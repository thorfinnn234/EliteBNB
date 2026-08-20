import { useEffect, useRef, useState } from "react";

/**
 * Runs an async fetcher when explicit dependency values change.
 * The fetcher is kept in a ref so inline callbacks do not create request loops.
 */
export function useFetch(fetcher, dependencies = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetcherRef = useRef(fetcher);
  const dependencyList = Array.isArray(dependencies)
    ? dependencies
    : [dependencies];
  const dependencyKey = JSON.stringify(dependencyList);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    let active = true;

    Promise.resolve()
      .then(() => {
        if (!active) return null;

        setLoading(true);
        setError(null);
        return fetcherRef.current();
      })
      .then((result) => {
        if (active) setData(result?.data ?? result);
      })
      .catch((err) => {
        if (active) setError(err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [dependencyKey]);

  return { data, loading, error };
}
