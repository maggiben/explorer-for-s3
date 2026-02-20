import { ElectronAPI } from '@electron-toolkit/preload';
import type { ISettings } from '../types/ISettings';
import type { OpenDialogReturnValue, OpenDialogOptions, MessageBoxReturnValue } from 'electron';
import { IConnection } from 'src/types/IConnection';

export declare global {
  interface Window {
    electron: ElectronAPI;
    ipcRenderer: Electron.IpcRenderer;
    api: unknown;
    commands: {
      showOpenDialog: (options: OpenDialogOptions) => Promise<OpenDialogReturnValue>;
      showMessageBox: (options: MessageBoxOptions) => Promise<MessageBoxReturnValue>;
      modal: (type: string, options?: Record<string, unknown>) => Promise<boolean>;
      contextMenu: (type: string, options?: Record<string, unknown>) => Promise<void | null>;
    };
    settings: {
      get: () => Promise<{ results: [ISettings] }>;
      set: (preferences: ISettings) => Promise<boolean>;
    };
    connections: {
      add: (connection: IConnection) => Promise<IConnection>;
      get: (id: number) => Promise<IConnection>;
      getAll: () => Promise<IConnection[]>;
      getRecent: () => Promise<IConnection[]>;
      connect: (id: number) => Promise<void>;
      upsert: (connection: IConnection) => Promise<IConnection>;
    };
  }
}
