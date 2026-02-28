import type { DependencyList } from 'react';
import { useCallback, useEffect } from 'react';
import { useAtom } from 'jotai';
import { recentAtom } from '@renderer/atoms/recent';

export default function useRecent<T>(deps?: DependencyList): [T[], () => Promise<void>] {
  const [recent, setRecent] = useAtom(recentAtom);
  const set = useCallback(
    async () =>
      window.connections
        .getRecent()
        .then((results) => setRecent(results))
        .catch(console.error),
    [setRecent],
  );
  useEffect(() => {
    set();
  }, [deps, set]);

  return [recent, set] as [T[], () => Promise<void>];
}
