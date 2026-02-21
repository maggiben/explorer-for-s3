import { atom } from 'jotai';
import { settingsAtom } from './settings';

export const themeAtom = atom((get) => get(settingsAtom).apparence);
