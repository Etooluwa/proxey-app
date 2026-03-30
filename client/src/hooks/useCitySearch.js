import { useState, useEffect, useRef } from 'react';

/**
 * useCitySearch — debounced city autocomplete via Nominatim (OpenStreetMap)
 *
 * @param {string} query - the current city input value
 * @returns {{ suggestions: string[], loading: boolean }}
 */
export function useCitySearch(query) {
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const timerRef = useRef(null);
    const controllerRef = useRef(null);

    useEffect(() => {
        const q = query?.trim() || '';
        if (q.length < 2) {
            setSuggestions([]);
            setLoading(false);
            return;
        }

        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(async () => {
            // Cancel any in-flight request
            if (controllerRef.current) controllerRef.current.abort();
            const controller = new AbortController();
            controllerRef.current = controller;

            setLoading(true);
            try {
                const url =
                    `https://nominatim.openstreetmap.org/search` +
                    `?q=${encodeURIComponent(q)}` +
                    `&featuretype=city` +
                    `&addressdetails=1` +
                    `&limit=6` +
                    `&format=json`;

                const res = await fetch(url, {
                    signal: controller.signal,
                    headers: { 'Accept-Language': 'en' },
                });
                const data = await res.json();

                // Build "City, Country" or "City, State, Country" labels, deduplicated
                const seen = new Set();
                const results = [];
                for (const item of data) {
                    const addr = item.address || {};
                    const city =
                        addr.city || addr.town || addr.village || addr.municipality || addr.county || item.display_name.split(',')[0];
                    const state = addr.state || addr.province || '';
                    const country = addr.country || '';
                    const label = [city, state, country].filter(Boolean).join(', ');
                    if (!seen.has(label)) {
                        seen.add(label);
                        results.push(label);
                    }
                }
                setSuggestions(results);
            } catch (err) {
                if (err.name !== 'AbortError') setSuggestions([]);
            } finally {
                setLoading(false);
            }
        }, 350);

        return () => {
            clearTimeout(timerRef.current);
        };
    }, [query]);

    return { suggestions, loading };
}
