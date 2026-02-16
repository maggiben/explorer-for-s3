import { atom } from 'jotai';
import type { ThemeConfig } from 'antd';

export const themeAtom = atom<ThemeConfig>({
  token: {
    // Seed Token, affects wide range
    colorPrimary: '#b96600',
    borderRadius: 2,

    // Derived token, affects narrow range
    colorBgContainer: '#f6ffed',
  },
});
