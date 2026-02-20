import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';
import ipc from '../shared/constants/ipc';
import { ISettings } from '../types/ISettings';
import { IConnection } from '../types/IConnection';
// Custom APIs for renderer
const api = {};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('api', api);
    contextBridge.exposeInMainWorld('settings', {
      get: (id?: number): Promise<ISettings> =>
        ipcRenderer.invoke(ipc.MAIN_API, { command: 'settings:get', id }),
      set: (preferences: ISettings) =>
        ipcRenderer.invoke(ipc.MAIN_API, { command: 'settings:set', preferences }),
    });
    contextBridge.exposeInMainWorld('connections', {
      add: (connection: IConnection): Promise<IConnection> =>
        ipcRenderer
          .invoke(ipc.MAIN_API, { command: 'connections:add', connection })
          .then(({ results, ack }) => ack && results.shift())
          .then(({ result, ack }) => ack && result),
      get: (id: number): Promise<IConnection> =>
        ipcRenderer
          .invoke(ipc.MAIN_API, { command: 'connections:get', id })
          .then(({ results, ack }) => ack && results.shift())
          .then(({ result, ack }) => ack && result),
      getAll: (): Promise<IConnection[]> =>
        ipcRenderer.invoke(ipc.MAIN_API, { command: 'connections:getAll' }),
      getRecent: (): Promise<IConnection[]> =>
        ipcRenderer
          .invoke(ipc.MAIN_API, { command: 'connections:getRecent' })
          .then(({ results, ack }) => ack && results.shift())
          .then(({ result, ack }) => ack && result),
      connect: (id: number) =>
        ipcRenderer.invoke(ipc.MAIN_API, { command: 'connections:connect', id }),
      upsert: (connection: IConnection): Promise<IConnection> =>
        ipcRenderer
          .invoke(ipc.MAIN_API, { command: 'connections:upsert', connection })
          .then(({ results, ack }) => ack && results.shift())
          .then(({ result, ack }) => ack && result),
    });
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.api = api;
}
