import { useEffect, useState } from 'react';
import { DEFAULT_THEME, THEMES } from './themes';
import type { Theme } from './themes';

function isTheme(value: string): value is Theme {
  return (THEMES as readonly string[]).includes(value);
}

/** One <select>; the chosen theme goes on <html data-theme>, which is all bit needs. */
export function ThemeSelect() {
  const [theme, setTheme] = useState<Theme>(() => {
    const current = document.documentElement.dataset.theme ?? '';
    return isTheme(current) ? current : DEFAULT_THEME;
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <label className="gallery-theme">
      <span className="gallery-theme__label">Theme</span>
      <select
        className="gallery-theme__select"
        value={theme}
        onChange={(event) => {
          const next = event.target.value;
          if (isTheme(next)) setTheme(next);
        }}
      >
        {THEMES.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
    </label>
  );
}
