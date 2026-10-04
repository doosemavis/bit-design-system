import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { test } from '@playwright/test';

const DIR = process.env.SCREENS_DIR;
const PAGES = [
  ['home', '#/'],
  ['playground-button', '#/components/button'],
  ['playground-input', '#/components/input'],
  ['tokens', '#/tokens'],
] as const;
const WIDTHS = [1300, 390] as const;
const MODES = ['light', 'dark'] as const;

test.skip(!DIR, 'set SCREENS_DIR to capture screenshots');

for (const [name, hash] of PAGES) {
  for (const width of WIDTHS) {
    for (const mode of MODES) {
      test(`${name} ${width} ${mode}`, async ({ page }) => {
        mkdirSync(DIR!, { recursive: true });
        await page.addInitScript((value) => window.localStorage.setItem('bit-color-mode', value), mode);
        await page.setViewportSize({ width, height: 900 });
        await page.goto(hash);
        await page.locator('main h1').first().waitFor();
        await page.screenshot({ path: join(DIR!, `${name}-${width}-${mode}.png`), fullPage: true });
      });
    }
  }
}
