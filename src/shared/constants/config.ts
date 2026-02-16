import { app } from 'electron';
const isDev = !app.isPackaged || process.env.NODE_ENV === 'development';
export const DATABASE_FILENAME = isDev ? 'data.test.db' : 'data.db';
export const KEY_FILENAME = isDev ? 'encrypted-key.test.bin' : 'encrypted-key.bin';
