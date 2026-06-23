import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark';
export type Language = 'zh' | 'en';

type ThemeRipple = {
  id: number;
  x: number;
  y: number;
  color: string;
};

type UIState = {
  themeMode: ThemeMode;
  language: Language;
  themeRipple?: ThemeRipple;
  toggleTheme: (origin?: { x: number; y: number }) => void;
  setThemeMode: (mode: ThemeMode, origin?: { x: number; y: number }) => void;
  setLanguage: (language: Language) => void;
  clearThemeRipple: (id: number) => void;
};

const storedTheme = typeof window !== 'undefined' ? window.localStorage.getItem('album-theme') : null;
const storedLanguage = typeof window !== 'undefined' ? window.localStorage.getItem('album-language') : null;

function validTheme(value: string | null): ThemeMode {
  return value === 'dark' ? 'dark' : 'light';
}

function validLanguage(value: string | null): Language {
  return value === 'en' ? 'en' : 'zh';
}

function rippleColor(mode: ThemeMode) {
  return mode === 'dark' ? '#16120f' : '#fff8ef';
}

export const useUiStore = create<UIState>((set, get) => ({
  themeMode: validTheme(storedTheme),
  language: validLanguage(storedLanguage),
  themeRipple: undefined,
  toggleTheme: (origin) => {
    const next = get().themeMode === 'light' ? 'dark' : 'light';
    get().setThemeMode(next, origin);
  },
  setThemeMode: (mode, origin) => {
    window.localStorage.setItem('album-theme', mode);
    const point = origin ?? { x: window.innerWidth - 96, y: 44 };
    set({
      themeMode: mode,
      themeRipple: {
        id: Date.now(),
        x: point.x,
        y: point.y,
        color: rippleColor(mode),
      },
    });
  },
  setLanguage: (language) => {
    window.localStorage.setItem('album-language', language);
    set({ language });
  },
  clearThemeRipple: (id) => set((state) => (state.themeRipple?.id === id ? { themeRipple: undefined } : state)),
}));
