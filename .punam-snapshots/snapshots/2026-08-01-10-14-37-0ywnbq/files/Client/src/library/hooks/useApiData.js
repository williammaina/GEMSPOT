import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Generic async data hook with loading / error / refetch.
 */
export function useApiData(fetcher, deps = [], { immediate = true } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(Boolean(immediate));
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      if (mounted.current) {
        setData(result);
        setLoading(false);
      }
      return result;
    } catch (err) {
      if (mounted.current) {
        setError(err);
        setLoading(false);
      }
      throw err;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (!immediate) return undefined;
    refetch().catch(() => {});
    return undefined;
  }, [refetch, immediate]);

  return { data, error, loading, refetch, setData };
}
