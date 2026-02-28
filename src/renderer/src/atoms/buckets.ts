// buckets atom
import { useCallback, useEffect } from 'react';
import { IBucket } from '../../../types/IBucket';
import { atom, useAtom } from 'jotai';
import { IConnection } from '../../../types/IConnection';

export const bucketsAtom = atom<IBucket[]>([]);

type BucketWithConnections = IBucket & { connections: IConnection[] };

export const useBuckets = (): {
  buckets: BucketWithConnections[];
  set: () => Promise<void>;
} => {
  const [buckets, setBuckets] = useAtom(bucketsAtom);
  const set = useCallback(async () => {
    const allBuckets = await window.buckets.getAll();
    const allBucketsWithConnections = await Promise.all(
      allBuckets.map(async (bucket) => {
        return {
          ...bucket,
          connections: await Promise.all(
            bucket.connectionIds.map(async (connectionId) => {
              return window.connections.get(connectionId);
            }),
          ),
        };
      }),
    );
    setBuckets(allBucketsWithConnections);
  }, [setBuckets]);
  useEffect(() => {
    set();
  }, [set]);
  return { buckets, set } as unknown as {
    buckets: BucketWithConnections[];
    set: () => Promise<void>;
  };
};
