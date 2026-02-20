import type { ExtractAtomValue } from 'jotai';
import { themeAtom } from '../renderer/src/atoms/theme';

export interface INotificationOptions {
  enabled: boolean;
  silent?: boolean;
}

export interface ISettings {
  behaviour: {
    language: string;
    preferredSystemLanguages?: string[];
    notifications: INotificationOptions;
  };
  username: string;
  apparence: {
    mode: string;
    language: string;
    preferredSystemLanguages?: string[];
    theme: ExtractAtomValue<typeof themeAtom>;
  };
  advanced: {
    isDev?: boolean;
    preferencesPath?: string;
    update: {
      automatic?: boolean;
    };
    logs: {
      enabled?: boolean;
      savePath?: string;
      backup?: {
        enabled: boolean;
        maxSize: number;
      };
      purge?: {
        enabled: boolean;
        maxSize: number;
      };
    };
  };
}
