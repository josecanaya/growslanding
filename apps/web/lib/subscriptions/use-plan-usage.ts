import type { PlanLimitRuleId } from './types';
import { useCallback, useEffect, useMemo, useState } from 'react';

type UsageResponse = {
  count: number;
};

export type PlanUsageKey = PlanLimitRuleId;

export function usePlanUsage(key: PlanUsageKey) {
  const [usage, setUsage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [version, setVersion] = useState(0);

  const refresh = useCallback(() => {
    setVersion((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/usage/${key}`, {
          signal: abortController.signal,
          cache: 'no-store',
        });
        if (!response.ok) {
          const info = await response.json().catch(() => ({}));
          const err = new Error(
            info?.error ?? `No se pudo obtener /api/usage/${key}`,
          );
          throw err;
        }
        const data = (await response.json()) as UsageResponse;
        if (!abortController.signal.aborted) {
          setUsage(data.count ?? 0);
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          setError(err as Error);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      abortController.abort();
    };
  }, [key, version]);

  return useMemo(
    () => ({
      usage,
      isLoading,
      error,
      refresh,
    }),
    [usage, isLoading, error, refresh],
  );
}
