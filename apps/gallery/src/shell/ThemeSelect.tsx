import { Field, Select } from '@bit-ds/react';
import { useEffect, useState } from 'react';
import { DEFAULT_THEME, THEMES } from './themes';
import type { Theme } from './themes';

/** One option per theme, labelled by its name. */
const THEME_OPTIONS = THEMES.map((name) => ({ value: name, label: name }));

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
        options={THEME_OPTIONS}
        value={theme}
        onValueChange={(next) => {
          if (isTheme(next)) setTheme(next);
        }}
      />
    </Field>
  );
}
