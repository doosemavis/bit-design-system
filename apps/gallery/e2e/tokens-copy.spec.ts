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
    // The button grows inside its own cell and never past the cell's edge. It may use the cell's padding:
    // font metrics differ by platform (Linux CI renders the label a little wider than macOS), and that
    // sub-pixel difference is invisible. The column positions above are the real promise, checked exactly.
    const fit = await row.locator('td').last().evaluate((cell) => {
      const button = cell.querySelector('button')!.getBoundingClientRect();
      const box = cell.getBoundingClientRect();
      return { buttonLeft: button.left, buttonRight: button.right, cellLeft: box.left, cellRight: box.right };
    });
    expect(fit.buttonRight, `button overflows its cell: ${JSON.stringify(fit)}`).toBeLessThanOrEqual(fit.cellRight);
    expect(fit.buttonLeft, `button overflows its cell: ${JSON.stringify(fit)}`).toBeGreaterThanOrEqual(fit.cellLeft);
    // And back to "Copy" after the reset.
    await expect(row.getByRole('button', { name: /^Copy var\(/ })).toBeVisible();
    expect(await cellLefts(page)).toEqual(before);
  });
}
