import { useEffect, useState } from "react";

export function useFetch(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    Promise.resolve()
      .then(() => {
        if (active) setLoading(true);
        return fetcher();
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
  }, [fetcher, ...deps]);

  return { data, loading, error };
}
