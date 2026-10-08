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

test('All icons: toolbar controls line up with the search box and groups are spaced apart', async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto('#/components/icon');
  const section = page.getByRole('region', { name: 'All icons' });
  const input = (await section.getByLabel('Search icons').boundingBox())!;
  const rows = section.locator('.bit-segmented-control__options');
  await expect(rows).toHaveCount(2);
  for (let i = 0; i < 2; i += 1) {
    const box = (await rows.nth(i).boundingBox())!;
    expect(Math.abs(box.y - input.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(box.y + box.height - (input.y + input.height))).toBeLessThanOrEqual(1);
  }
  const heads = section.locator('.gallery-icon-group-head');
  const h1 = (await heads.nth(0).boundingBox())!;
  const h2 = (await heads.nth(1).boundingBox())!;
  const g1 = (await section.locator('.gallery-icon-grid').nth(0).boundingBox())!;
  expect(Math.abs(g1.y - (h1.y + h1.height) - 16)).toBeLessThanOrEqual(2);
  expect(Math.abs(h2.y - (g1.y + g1.height) - 48)).toBeLessThanOrEqual(2);
});

test('All icons: group header has a divider and a bold 15px count pill', async ({ page }) => {
  await page.goto('#/components/icon');
  const head = page.getByRole('region', { name: 'All icons' }).locator('.gallery-icon-group-head').first();
  const border = await head.evaluate((el) => parseFloat(getComputedStyle(el).borderBottomWidth));
  expect(border).toBeGreaterThan(0);
  const pill = head.locator('.gallery-icon-count');
  await expect(pill).toHaveText(/^\d+ icons$/);
  const style = await pill.evaluate((el) => ({ w: Number(getComputedStyle(el).fontWeight), s: getComputedStyle(el).fontSize }));
  expect(style.w).toBeGreaterThanOrEqual(700);
  expect(style.s).toBe('15px');
});
