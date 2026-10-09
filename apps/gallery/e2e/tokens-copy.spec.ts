import { expect, test } from '@playwright/test';

/**
 * Where a token row's name, value and chip sit inside the row, so a shift in any of them shows. Relative to
 * the row, because clicking scrolls the chip into view and moves everything on screen by the same amount.
 */
async function rowBoxes(row: import('@playwright/test').Locator) {
  return row.evaluate((el) => {
    const origin = el.getBoundingClientRect();
    return ['__name', '__value', '__chip'].map((part) => {
      const r = el.querySelector(`.gallery-token-row${part}`)!.getBoundingClientRect();
      return [r.left - origin.left, r.top - origin.top, r.width];
    });
  });
}

/** Waits for the web fonts, so a late font swap can't move a chip between two measurements. */
async function settled(page: import('@playwright/test').Page) {
  await page.evaluate(() => document.fonts.ready.then(() => true));
}

/** The chip's own hint: Tooltip renders its bubble right after the trigger, so no other chip's hint can match. */
const hintOf = (chip: import('@playwright/test').Locator) => chip.locator('xpath=following-sibling::*[@role="tooltip"][1]');

for (const [outcome, label, clipboard] of [
  ['Copied', 'Copied', 'resolve'],
  ['Copy failed', 'Copy failed', 'reject'],
] as const) {
  test(`Token cards: "${outcome}" on a token chip does not move its row`, async ({ page }) => {
    await page.addInitScript((mode) => {
      const writeText = () => (mode === 'resolve' ? Promise.resolve() : Promise.reject(new Error('denied')));
      Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    }, clipboard);
    await page.goto('#/tokens');
    const chip = page.getByRole('group', { name: 'space tokens' }).getByRole('button', { name: 'Copy --bit-space-16px' });
    const row = chip.locator('xpath=ancestor::*[contains(concat(" ", normalize-space(@class), " "), " gallery-token-row ")][1]');
    await expect(row).toBeVisible();
    await settled(page);
    const before = await rowBoxes(row);
    await chip.click();
    // The result shows in the chip's own hint; the chip keeps its text, so nothing in the row moves.
    await expect(hintOf(chip)).toHaveText(label);
    expect(await rowBoxes(row)).toEqual(before);
  });
}

for (const [where, scope, shown] of [
  ['a color card hex', (page: import('@playwright/test').Page) => page.getByRole('group', { name: 'primary tokens' }), '#7C3AED'],
  ['a token card name', (page: import('@playwright/test').Page) => page.getByRole('group', { name: 'shadow tokens' }), '--bit-shadow-md'],
  ['a color flow token', (page: import('@playwright/test').Page) => page.getByRole('group', { name: 'Where every color goes' }), '--bit-color-primary'],
] as const) {
  test(`Tokens: clicking ${where} copies it, and the hint goes Copy → Copied without moving the chip`, async ({ page }) => {
    await page.addInitScript(() => {
      const copied: string[] = [];
      Object.defineProperty(window, '__copied', { value: copied });
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: (text: string) => (copied.push(text), Promise.resolve()) },
        configurable: true,
      });
    });
    await page.goto('#/tokens');
    await settled(page);
    // Whole name, any case: the built CSS is minified, which lowercases hex.
    const chip = scope(page).getByRole('button', { name: new RegExp(`^Copy ${shown}$`, 'i') });
    await chip.hover();
    const hint = hintOf(chip);
    await expect(hint).toHaveText('Copy');
    const box = await chip.boundingBox();
    // The built CSS is minified, which lowercases hex, so compare with what the chip actually shows.
    const visible = await chip.innerText();
    expect(visible.toLowerCase()).toBe(shown.toLowerCase());
    await chip.click();
    await expect(hint).toHaveText('Copied');
    expect(await page.evaluate(() => (window as unknown as { __copied: string[] }).__copied)).toEqual([visible]);
    expect(await chip.boundingBox()).toEqual(box);
    await expect(chip).toHaveText(visible);
  });
}
