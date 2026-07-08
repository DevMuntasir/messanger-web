// ThemeContext (web) — light/dark toggle + selectable accent gradient,
// backed by CSS variables. Sets data-theme on <html> (global.css defines the
// palettes) and writes the accent vars; both persisted, mirroring the app.
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';

const ThemeContext = createContext(null);
const THEME_MODE_KEY = 'theme_mode';
const ACCENT_THEME_KEY = 'accent_theme';

// Same accent list as the app's ACCENT_THEMES in theme.js
export const ACCENT_THEMES = [
  { id: 'aurora', label: 'Aurora', colors: ['#9b5cff', '#0a7cff'] },
  { id: 'sunset', label: 'Sunset', colors: ['#ff8a65', '#ff5277'] },
  { id: 'ocean', label: 'Ocean', colors: ['#23b5ff', '#0a7cff'] },
  { id: 'forest', label: 'Forest', colors: ['#21c463', '#0ea5a5'] },
  { id: 'candy', label: 'Candy', colors: ['#f472b6', '#a855f7'] },
  { id: 'ember', label: 'Ember', colors: ['#ffb300', '#ff6f43'] },
];

export function getAccentThemeById(id) {
  return ACCENT_THEMES.find((t) => t.id === id) || ACCENT_THEMES[0];
}

function loadInitial(key, valid) {
  try {
    const saved = localStorage.getItem(key);
    if (saved && valid(saved)) return saved;
  } catch {}
  return null;
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => loadInitial(THEME_MODE_KEY, (v) => v === 'light' || v === 'dark') || 'dark');
  const [accentId, setAccentId] = useState(() => loadInitial(ACCENT_THEME_KEY, (v) => ACCENT_THEMES.some((t) => t.id === v)) || 'aurora');

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
    try { localStorage.setItem(THEME_MODE_KEY, mode); } catch {}
  }, [mode]);

  useEffect(() => {
    const { colors } = getAccentThemeById(accentId);
    const root = document.documentElement.style;
    root.setProperty('--accent-a', colors[0]);
    root.setProperty('--accent-b', colors[1]);
    root.setProperty('--color-accent', colors[0]);
    try { localStorage.setItem(ACCENT_THEME_KEY, accentId); } catch {}
  }, [accentId]);

  const toggle = useCallback(() => {
    setMode((m) => (m === 'light' ? 'dark' : 'light'));
  }, []);

  const setDark = useCallback((isDark) => {
    setMode(isDark ? 'dark' : 'light');
  }, []);

  const setAccent = useCallback((id) => {
    setAccentId(id);
  }, []);

  const value = useMemo(
    () => ({
      mode,
      dark: mode === 'dark',
      toggle,
      setDark,
      accentId,
      accentTheme: getAccentThemeById(accentId),
      setAccent,
    }),
    [mode, toggle, setDark, accentId, setAccent]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
