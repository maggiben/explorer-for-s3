import { atom } from 'jotai';
import type { ThemeConfig } from 'antd';

export const themeAtom = atom<ThemeConfig>({
  token: {
    borderRadius: 2,
  },
});
