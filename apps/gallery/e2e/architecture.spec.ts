import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { seedColorMode } from './mode';

/** `rgb(217, 26, 26)` → `#D91A1A`, to compare a computed color with the hex the page prints. */
function toHex(rgb: string): string {
  const [r, g, b] = rgb.match(/\d+/g)!.map(Number);
  return `#${[r, g, b].map((n) => n!.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

async function pick(page: Page, color: string) {
  await page.getByRole('radio', { name: color }).check({ force: true });
}

const chain = (page: Page) => page.getByRole('list', { name: 'From the prop to the pixels' });

// Unit tests read the theme from disk; only the built page proves the hex it prints is the color the Button paints.
for (const [mode, color, hex] of [
  ['light', 'danger', '#D91A1A'],
  ['dark', 'neutral', '#9A9EB0'],
] as const) {
  test(`Architecture: in ${mode} mode, color="${color}" ends at ${hex}, the color the real Button paints`, async ({ page }) => {
    await seedColorMode(page, mode);
    await page.goto('#/architecture');
    await pick(page, color);
    const button = chain(page).getByRole('button', { name: 'Save' });
    await expect(button).toHaveClass(new RegExp(`\\bbit-${color}\\b`));
    await expect(chain(page).getByRole('listitem').nth(3)).toHaveText(`4 · hex${hex}`);
    // Polled: Button eases background-color over --bit-duration-fast, so the first read can be mid-transition.
    await expect.poll(async () => toHex(await button.evaluate((el) => getComputedStyle(el).backgroundColor))).toBe(hex);
    await expect(page.getByRole('region', { name: `power-up theme, ${mode} mode` })).toBeVisible();
  });
}

test('Architecture: legible at phone width, with no sideways page scroll', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('#/architecture');
  await expect(page.getByRole('heading', { level: 1, name: 'Architecture' })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  // The color picker shows all five options inside the card: an even grid, nothing scrolled or clipped out of sight.
  const fit = await page.locator('.gallery-arch-naming').evaluate((naming) => {
    const card = naming.getBoundingClientRect();
    return [...naming.querySelectorAll('.bit-segmented-control__option')].map((option) => {
      const r = option.getBoundingClientRect();
      return r.left >= card.left - 1 && r.right <= card.right + 1;
    });
  });
  expect(fit).toEqual([true, true, true, true, true]);
  // Stacked, the chain's arrows point down, not right.
  await expect(page.locator('.gallery-arch-chain__arrow[data-dir="column"]').first()).toBeVisible();
  await expect(page.locator('.gallery-arch-chain__arrow[data-dir="row"]').first()).toBeHidden();
  // Each level stacks its specimen under its name, so neither is squeezed.
  const grid = page.locator('.gallery-arch-level__grid').first();
  expect(await grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length)).toBe(1);
});

// The facts and Level 3 parse the built theme file; unit tests read the source one. Prove the built one agrees.
test('Architecture: the CSS layers fact and Level 3 come from the built theme: 3 layers, ending in bit.components', async ({ page }) => {
  await page.goto('#/architecture');
  await expect(page.getByRole('list', { name: 'bit by the numbers' }).getByRole('listitem').nth(2)).toHaveText('003 CSS layers');
  await expect(page.getByRole('heading', { name: 'Component CSS' }).locator('..')).toContainText('in the bit.components layer');
});
