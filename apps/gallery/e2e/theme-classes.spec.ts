import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { themeValue } from './theme';

const BG = themeValue('--bit-color-bg');

/** A second theme, written to the template power-up.css documents, with two telltale page colors. */
const RETRO = `@layer bit.reset, bit.tokens, bit.components;
@layer bit.tokens {
  :is(.bit-theme-retro, [data-theme="retro"]),
  :where(.bit-theme-retro, [data-theme="retro"]) :is(.bit-light, .bit-dark, [data-mode="light"], [data-mode="dark"], [data-mode="system"]),
  :is(.bit-theme-retro, [data-theme="retro"]):is(.bit-light, .bit-dark, [data-mode="light"], [data-mode="dark"], [data-mode="system"]) {
    --bit-color-bg: #010101;
  }
  :where(.bit-theme-retro, [data-theme="retro"]) :is(.bit-dark, [data-mode="dark"]),
  :is(.bit-theme-retro, [data-theme="retro"]):is(.bit-dark, [data-mode="dark"]) {
    --bit-color-bg: #020202;
  }
}`;

/** Build a test tree under <body> from `html`, with the second theme loaded first or last, and read each [data-probe]'s page color. */
async function probe(page: Page, html: string, retroFirst: boolean): Promise<Record<string, string>> {
  return page.evaluate(
    ([markup, css, first]) => {
      const style = document.createElement('style');
      style.textContent = css;
      if (first) document.head.prepend(style);
      else document.head.append(style);
      const host = document.createElement('div');
      host.innerHTML = markup;
      document.body.append(host);
      return Object.fromEntries(
        [...host.querySelectorAll<HTMLElement>('[data-probe]')].map((el) => [
          el.dataset.probe!,
          getComputedStyle(el).getPropertyValue('--bit-color-bg').trim().toLowerCase(),
        ]),
      );
    },
    [html, RETRO, retroFirst] as const,
  );
}

const TREE = `
  <div data-probe="plain"></div>
  <div class="bit-dark" data-probe="dark class"></div>
  <div data-mode="dark" data-probe="dark attribute"></div>
  <div class="bit-dark"><div class="bit-light" data-probe="light inside dark"></div></div>
  <div class="bit-theme-power-up bit-dark" data-probe="power-up class, dark"></div>
  <div class="bit-theme-retro" data-probe="retro"></div>
  <div class="bit-theme-retro bit-dark" data-probe="retro, dark on it"></div>
  <div class="bit-theme-retro"><div class="bit-dark" data-probe="dark inside retro"></div></div>
  <div data-theme="retro"><div data-mode="dark"><div class="bit-light" data-probe="light inside dark retro"></div></div></div>
  <div class="bit-dark"><div class="bit-theme-retro" data-probe="retro inside dark"></div></div>
  <div class="bit-theme-retro"><div class="bit-theme-power-up bit-dark" data-probe="power-up dark inside retro"></div></div>
`;

for (const retroFirst of [false, true]) {
  test(`theme and mode classes pick the right tokens, with the second theme loaded ${retroFirst ? 'first' : 'last'}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('#/tokens');
    await page.evaluate(() => document.documentElement.removeAttribute('data-mode'));
    const values = await probe(page, TREE, retroFirst);
    expect(values).toEqual({
      plain: BG.light.toLowerCase(),
      'dark class': BG.dark.toLowerCase(),
      'dark attribute': BG.dark.toLowerCase(),
      'light inside dark': BG.light.toLowerCase(),
      'power-up class, dark': BG.dark.toLowerCase(),
      retro: '#010101',
      'retro, dark on it': '#020202',
      'dark inside retro': '#020202',
      'light inside dark retro': '#010101',
      // A theme starts its subtree fresh, in its light block: give it a mode to make it dark.
      'retro inside dark': '#010101',
      'power-up dark inside retro': BG.dark.toLowerCase(),
    });
  });
}

test('<html class="bit-dark bit-theme-power-up"> is dark before any script runs', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.route('**/*.js', (route) => route.abort());
  await page.goto('#/tokens');
  await page.evaluate(() => {
    document.documentElement.removeAttribute('data-mode');
    document.documentElement.className = 'bit-dark bit-theme-power-up';
  });
  const bg = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bit-color-bg').trim().toLowerCase());
  expect(bg).toBe(BG.dark.toLowerCase());
});

test('ModeToggle writes the bit-dark class beside data-mode', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('#/tokens');
  await page.getByRole('group', { name: 'Color mode' }).first().getByRole('button', { name: 'Dark' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-mode', 'dark');
  await expect(page.locator('html')).toHaveClass(/(^|\s)bit-dark(\s|$)/);
});
