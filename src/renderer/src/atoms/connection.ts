import { atom, useAtom } from 'jotai';
import regions from '../../../shared/constants/regions.json';
import { IConnection } from '../../../types/IConnection';
import { useCallback, useEffect } from 'react';

export const connectionAtom = atom<IConnection>({
  accessKeyId: '',
  secretAccessKey: '',
  region: regions[0].code,
  bucket: '',
  remember: true,
});

export const connectionsAtom = atom<IConnection[]>([]);

export const useConnections = (): {
  connections: IConnection[];
  set: () => Promise<void>;
} => {
  const [connections, setConnections] = useAtom(connectionsAtom);
  const set = useCallback(async () => {
    const result = await window.connections.getAll();
    setConnections(result);
  }, [setConnections]);
  useEffect(() => {
    set();
  }, [set]);
  return { connections, set };
};
