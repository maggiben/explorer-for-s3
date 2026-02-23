import type { DependencyList } from 'react';
import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { recentAtom } from '@renderer/atoms/recent';

export default function useRecent<T>(
  deps?: DependencyList,
): [T[] | undefined | void, () => Promise<void>] {
  const [recent, setRecent] = useAtom(recentAtom);
  const set = async () =>
    window.connections
      .getRecent()
      .then((results) => setRecent(results))
      .catch(console.error);
  useEffect(() => {
    set();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deps]);

  return [recent, set] as [T[], () => Promise<void>];
}
