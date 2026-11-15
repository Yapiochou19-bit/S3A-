import { useCallback, useEffect, useState, type DependencyList } from 'react';
import { toApiError, type ApiError } from '../services/errors';

interface AsyncState<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
}

/** Charge une donnée au montage (et à chaque changement de deps) avec états chargement / erreur. */
export function useAsync<T>(load: () => Promise<T>, deps: DependencyList) {
  const [state, setState] = useState<AsyncState<T>>({ data: null, error: null, loading: true });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    load()
      .then((data) => {
        if (!cancelled) setState({ data, error: null, loading: false });
      })
      .catch((e: unknown) => {
        if (!cancelled) setState({ data: null, error: toApiError(e), loading: false });
      });
    return () => {
      cancelled = true;
    };
    // `load` est volontairement exclu : les deps de l'appelant pilotent le rechargement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  return { ...state, reload };
}
