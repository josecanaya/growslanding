'use client';

import { useEffect, useState } from 'react';

const COLOR_CLASSES = ['theme-blue', 'theme-green', 'theme-gray', 'theme-orange'] as const;
type ColorClass = typeof COLOR_CLASSES[number];

const mapColorToClass = (color: string | undefined | null): ColorClass => {
  if (!color) return 'theme-blue';
  const candidate = 'theme-' + color;
  return (COLOR_CLASSES as readonly string[]).includes(candidate) ? (candidate as ColorClass) : 'theme-blue';
};

type ThemeProviderProps = {
  children: React.ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [colorClass, setColorClass] = useState<ColorClass>('theme-blue');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem('preferencias');
      if (stored) {
        const prefs = JSON.parse(stored) as { darkMode?: boolean; color?: string };
        setTheme(prefs.darkMode ? 'dark' : 'light');
        setColorClass(mapColorToClass(prefs.color));
      }
    } catch (error) {
      console.error('[Cuenta] No se pudieron cargar las preferencias guardadas', error);
    }
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const body = document.body;
    COLOR_CLASSES.forEach((cls) => body.classList.remove(cls));
    body.classList.add(colorClass);
  }, [colorClass]);

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div className={colorClass}>
        {children}
      </div>
    </div>
  );
}
