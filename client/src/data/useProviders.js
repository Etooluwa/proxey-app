import { useEffect, useMemo, useState } from "react";
import { fetchProviders } from "./providers";

export function useProviders(filters = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const filterKey = useMemo(() => JSON.stringify(filters || {}), [filters]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const providers = await fetchProviders(filters);
        if (!cancelled) {
          setData(providers);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [filterKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const empty = !loading && !error && data.length === 0;

  return {
    providers: data,
    loading,
    error,
    empty,
  };
}

export default useProviders;
