import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { themeValue } from './theme';

const STORAGE_KEY = 'bit-color-mode';
const BG = themeValue('--bit-color-bg');
const SCHEMES = ['light', 'dark'] as const;

/** The root's background token as the page computes it right now, lowercased for comparison with the theme source. */
function rootBg(page: Page): Promise<string> {
  return page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--bit-color-bg').trim().toLowerCase(),
  );
}

function savedChoice(page: Page): Promise<string | null> {
  return page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY);
}

for (const scheme of SCHEMES) {
  test.describe(`${scheme} OS, nothing saved`, () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
    });

    test(`first paint, before React loads, uses the ${scheme} tokens`, async ({ page }) => {
      // Block the app's scripts: what shows is index.html's data-mode="system" and the CSS alone.
      await page.route('**/*.js', (route) => route.abort());
      await page.goto('#/tokens');
      expect(await rootBg(page)).toBe(BG[scheme].toLowerCase());
      await expect(page.locator('html')).toHaveAttribute('data-mode', 'system');
      await expect(page.locator('#root')).toBeEmpty();
    });

    test(`#/tokens shows the ${scheme} tokens straight away, and stays on system`, async ({ page }) => {
      await page.goto('#/tokens');
      expect(await rootBg(page)).toBe(BG[scheme].toLowerCase());
      await expect(page.locator('html')).toHaveAttribute('data-mode', 'system');
      expect(await savedChoice(page)).toBeNull();
    });
  });
}

test('a saved choice wins over the OS, as the a11y helpers rely on', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.addInitScript((key) => window.localStorage.setItem(key, 'light'), STORAGE_KEY);
  await page.goto('#/tokens');
  expect(await rootBg(page)).toBe(BG.light.toLowerCase());
  await expect(page.locator('html')).toHaveAttribute('data-mode', 'light');
});

test("ModeToggle's choice is saved and survives a reload", async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('#/tokens');
  expect(await rootBg(page)).toBe(BG.light.toLowerCase());

  const dark = page.getByRole('group', { name: 'Color mode' }).first().getByRole('button', { name: 'Dark' });
  await dark.click();
  await expect(dark).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-mode', 'dark');
  expect(await savedChoice(page)).toBe('dark');

  await page.reload();
  expect(await rootBg(page)).toBe(BG.dark.toLowerCase());
  await expect(page.locator('html')).toHaveAttribute('data-mode', 'dark');
  expect(await savedChoice(page)).toBe('dark');
  await expect(dark).toHaveAttribute('aria-pressed', 'true');
});

test('Getting started step 4: both code blocks show, and the disclosure starts closed and opens', async ({ page }) => {
  await page.goto('#/getting-started');
  await expect(page.getByRole('region', { name: 'index.html' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Any file' })).toBeVisible();

  const disclosure = page.getByRole('button', { name: 'Optional: use a saved choice before the page draws' });
  await expect(disclosure).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('region', { name: 'Saved-choice script' })).toBeHidden();

  await disclosure.click();
  await expect(disclosure).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('region', { name: 'Optional: use a saved choice before the page draws' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Saved-choice script' })).toBeVisible();
});
