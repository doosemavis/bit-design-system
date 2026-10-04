import { Field, Select } from '@bit-ds/react';
import { useEffect, useState } from 'react';
import { DEFAULT_THEME, THEMES } from './themes';
import type { Theme } from './themes';

function isTheme(value: string): value is Theme {
  return (THEMES as readonly string[]).includes(value);
}

/** One bit Select; the chosen theme goes on <html data-theme>, which is all bit needs. */
export function ThemeSelect() {
  const [theme, setTheme] = useState<Theme>(() => {
    const current = document.documentElement.dataset.theme ?? '';
    return isTheme(current) ? current : DEFAULT_THEME;
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <Field label="Theme" className="gallery-theme">
      <Select
        size="sm"
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
      </Select>
    </Field>
  );
}
