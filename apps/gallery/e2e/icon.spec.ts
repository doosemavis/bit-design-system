import { expect, test } from '@playwright/test';

test("All icons: a tile shows its name in a tooltip, and Copy puts that icon's class form on the clipboard", async ({ page }) => {
  await page.addInitScript(() => {
    const copied: string[] = [];
    (window as unknown as { __copied: string[] }).__copied = copied;
    const writeText = (text: string) => {
      copied.push(text);
      return Promise.resolve();
    };
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  });
  await page.goto('#/components/icon');
  const section = page.getByRole('region', { name: 'All icons' });
  await section.getByLabel('Search icons').fill('arrow back');
  const tiles = section.getByRole('button', { name: /^Copy / });
  await expect(tiles).toHaveCount(1);
  await tiles.hover();
  await expect(page.getByRole('tooltip', { name: 'arrow-back' })).toBeVisible();
  await section.getByText('HTML', { exact: true }).click();
  await section.getByText('Fill', { exact: true }).click();
  await section.getByRole('button', { name: 'Copy arrow-back', exact: true }).click();
  await expect(page.getByRole('tooltip', { name: 'Copied' })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __copied: string[] }).__copied)).toEqual([
    '<span class="bit-icon bit-icon-arrow-back bit-iconFilled" aria-hidden="true"></span>',
  ]);
});

test('All icons: keyboard focus shows the tooltip and Escape hides it without losing focus', async ({ page }) => {
  await page.goto('#/components/icon');
  const section = page.getByRole('region', { name: 'All icons' });
  await section.getByLabel('Search icons').fill('arrow back');
  const tile = section.getByRole('button', { name: 'Copy arrow-back', exact: true });
  await tile.focus();
  const tooltip = page.getByRole('tooltip', { name: 'arrow-back' });
  await expect(tooltip).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(tooltip).toBeHidden();
  await expect(tile).toBeFocused();
});
