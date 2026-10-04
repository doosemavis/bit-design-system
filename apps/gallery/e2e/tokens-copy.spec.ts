import { expect, test } from '@playwright/test';

/** The left edge of every cell in the first body row, so a shift in any column shows. */
async function cellLefts(page: import('@playwright/test').Page) {
  return page
    .getByRole('region', { name: 'Token values' })
    .locator('tbody tr')
    .first()
    .locator('td')
    .evaluateAll((cells) => cells.map((cell) => cell.getBoundingClientRect().left));
}

for (const [outcome, label, clipboard] of [
  ['Copied', 'Copied', 'resolve'],
  ['Copy failed', 'Copy failed', 'reject'],
] as const) {
  test(`All tokens: "${outcome}" does not move any column`, async ({ page }) => {
    await page.addInitScript((mode) => {
      const writeText = () => (mode === 'resolve' ? Promise.resolve() : Promise.reject(new Error('denied')));
      Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    }, clipboard);
    await page.goto('#/tokens');
    const row = page.getByRole('region', { name: 'Token values' }).locator('tbody tr').first();
    await expect(row).toBeVisible();
    const before = await cellLefts(page);
    expect(before).toHaveLength(3);
    await row.getByRole('button').click();
    await expect(row.getByRole('button', { name: label })).toBeVisible();
    expect(await cellLefts(page)).toEqual(before);
    // The button grows inside its cell: its right edge stays within the cell's content box.
    const fits = await row.locator('td').last().evaluate((cell) => {
      const button = cell.querySelector('button')!.getBoundingClientRect();
      const box = cell.getBoundingClientRect();
      const pad = parseFloat(getComputedStyle(cell).paddingRight);
      // 1px of slack: the table snaps column widths to whole pixels, so a fractional label can poke out under 1px.
      return button.right <= box.right - pad + 1 && button.left >= box.left;
    });
    expect(fits).toBe(true);
    // And back to "Copy" after the reset.
    await expect(row.getByRole('button', { name: /^Copy var\(/ })).toBeVisible();
    expect(await cellLefts(page)).toEqual(before);
  });
}
