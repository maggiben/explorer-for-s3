import { useEffect, DependencyList, useCallback } from 'react';
import { IpcChannels } from '@shared/rpc-channels';
import type { IpcRendererEvent } from 'electron';

const useContextMenu = <T>(
  callback: (message: T) => void,
  channels: string[] | string,
  deps?: DependencyList,
): T | undefined | void => {
  const handleContextMenuClick = useCallback(
    (_event: IpcRendererEvent, message: { id: string }) => {
      return channels.includes(message.id) && callback(message as T);
    },
    [callback, channels],
  );
  useEffect(() => {
    const removeListener = window.electron.ipcRenderer.on(
      IpcChannels.APP_CONTEXT_MENU_CLICK,
      handleContextMenuClick,
    );
    return () => {
      removeListener();
    };
  }, [deps, handleContextMenuClick]);

  return;
};

export default useContextMenu;
