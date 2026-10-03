// @vitest-environment node

import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

const main = readFileSync(new URL('./main.tsx', import.meta.url), 'utf8');

describe('main.tsx', () => {
  it('imports the theme before styles.css, the order the gallery teaches (its font @import must come first)', () => {
    const theme = main.indexOf("import '@bit-ds/react/themes/power-up.css';");
    const styles = main.indexOf("import '@bit-ds/react/styles.css';");
    expect(theme).toBeGreaterThanOrEqual(0);
    expect(styles).toBeGreaterThan(theme);
  });
});
