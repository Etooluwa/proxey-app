import { useSession } from '../auth/authContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useToast } from '../components/ui/ToastProvider';
import { useState, useEffect, useCallback } from 'react';
import fetchProviders from '../data/providers';

/**
 * Universal SAFE_STRING Helper
 * Guaranteed to return a string, never throws, never returns an object.
 */
const asString = (val, fallback = '') => {
    if (val === null || val === undefined) return fallback;
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return String(val);
    if (typeof val === 'boolean') return val ? 'true' : 'false';
    if (typeof val === 'object') {
        // Try to extract common text fields if it's an accidental object
        if (val.message) return String(val.message);
        if (val.name) return String(val.name);
        if (val.title) return String(val.title);
        if (val.value) return String(val.value); // generic value holder
        // Last resort: standard JSON stringify, but ensure it's not [object Object]
        try {
            return JSON.stringify(val);
        } catch (e) {
            return fallback;
        }
    }
    return fallback;
};

/**
 * Universal SAFE_NUMBER Helper
 * Guaranteed to return a valid number.
 */
const asNumber = (val, fallback = 0) => {
    if (val === null || val === undefined) return fallback;
    if (typeof val === 'number' && !isNaN(val)) return val;
    if (typeof val === 'string') {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? fallback : parsed;
    }
    if (typeof val === 'object') {
        if (val.value) return asNumber(val.value, fallback);
        if (val.rating) return asNumber(val.rating, fallback);
    }
    return fallback;
};

/**
 * Universal SAFE_ARRAY Helper
 * Guaranteed to return an array.
 */
const asArray = (val) => {
    if (Array.isArray(val)) return val;
    if (!val) return [];
    // If it's a single object that looks like it should be an array item, wrap it?
    // For now, strict empty array fallback is safer.
    return [];
};

/**
 * Normalizes a provider object from the API.
 * This is the "firewall" for provider data.
 */
const normalizeProvider = (p) => {
    if (!p) return null;

    // Normalize Categories
    // Categories might be strings, or objects like { name: 'Cleaning' }
    const rawCategories = asArray(p.categories);
    const normalizedCategories = rawCategories.map(c => {
        if (typeof c === 'string') return c;
        if (typeof c === 'object' && c.name) return asString(c.name);
        return asString(c); // Fallback stringify
    }).filter(c => c !== ''); // Remove empty strings

    // Normalize Reviews
    // Reviews might be an array of objects
    const rawReviews = asArray(p.reviews);

    return {
        id: asString(p.id, `provider-${Math.random()}`),
        name: asString(p.name, 'Unknown Provider'),
        headline: asString(p.headline, ''),
        bio: asString(p.bio, ''),
        city: asString(p.city, ''),
        photo: asString(p.photo, ''), // If null, UI should handle fallback or we can put default here
        hourly_rate: asNumber(p.hourly_rate, 0),
        rating: asNumber(p.rating, 0),
        review_count: asNumber(p.review_count, rawReviews.length),
        categories: normalizedCategories,
        reviews: rawReviews // Keep raw structures if deep access is needed, but usually we just count them
    };
};

/**
 * HOOK: useClientData
 * Centralizes access to 'Safe' profile and 'Safe' providers.
 */
export const useClientData = () => {
    const { session, profile, logout, updateProfile, isLoading: isAuthLoading, authError } = useSession();
    const { notifications, unreadCount, markAllAsRead } = useNotifications();
    const toast = useToast();

    // -- 1. Safe Profile --
    const safeProfile = {
        id: asString(profile?.id || session?.user?.id),
        email: asString(profile?.email || session?.user?.email),
        name: asString(profile?.name || session?.user?.email?.split('@')[0], 'User'),
        photo: asString(profile?.photo, ''),
        phone: asString(profile?.phone, ''),
        bio: asString(profile?.bio, ''),
        city: asString(profile?.city, 'San Francisco, CA'),
        state: asString(profile?.state, ''),
        zip: asString(profile?.zip, ''),
        address: asString(profile?.address, ''),
        role: asString(profile?.role || session?.user?.user_metadata?.role, 'client'),

        // Strict Arrays
        paymentMethods: asArray(profile?.paymentMethods),

        // Helper to check if data is actually loaded
        isLoaded: !!profile
    };

    // -- 2. Providers Fetching Logic --
    const [providers, setProviders] = useState([]);
    const [isProvidersLoading, setIsProvidersLoading] = useState(false);
    const [providersError, setProvidersError] = useState(null);

    const loadProviders = useCallback(async (filters = {}) => {
        setIsProvidersLoading(true);
        setProvidersError(null);
        try {
            const raw = await fetchProviders(filters);
            const normalized = raw.map(normalizeProvider).filter(Boolean);
            setProviders(normalized);
        } catch (err) {
            console.error("Failed to load providers:", err);
            setProvidersError(asString(err.message, "Failed to load providers"));
            toast.push({
                title: "Error loading providers",
                description: "Could not fetch provider list. Please try again.",
                variant: "error"
            });
        } finally {
            setIsProvidersLoading(false);
        }
    }, [toast]);

    // Initial load of providers on mount? (Optional, or let pages trigger it)
    // We'll let pages trigger it to avoid over-fetching.

    // -- 3. Profile Update Wrapper --
    const updateClientProfile = async (updates) => {
        try {
            await updateProfile(updates);
            return true; // Success
        } catch (error) {
            console.error("Profile update error:", error);
            throw error; // Re-throw for UI to handle if needed
        }
    };

    return {
        // User Data
        session,
        profile: safeProfile,
        isAuthLoading,
        authError: asString(authError),

        // Notifications
        notifications,
        unreadCount,
        markAllAsRead,

        // Providers Data
        providers, // The clean, normalized list
        loadProviders, // Function to trigger fetch
        isProvidersLoading,
        providersError,

        // Actions
        logout,
        updateProfile: updateClientProfile,

        // Utils
        utils: {
            asString,
            asNumber,
            asArray
        }
    };
};
