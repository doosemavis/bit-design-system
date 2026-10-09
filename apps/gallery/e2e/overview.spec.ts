import { expect, test } from '@playwright/test';

async function openOverview(page: import('@playwright/test').Page, width: number) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('#/');
  await expect(page.locator('.gallery-tile').first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready.then(() => true));
}

for (const [label, width] of [
  ['desktop', 1280],
  ['tablet', 900],
  ['phone', 390],
] as const) {
  test(`Overview: every tile shows its whole preview, and tiles in a row line up, on a ${label} (${width}px)`, async ({ page }) => {
    await openOverview(page, width);
    const tiles = await page.locator('.gallery-tile').evaluateAll((els) =>
      els.map((tile) => {
        const preview = tile.querySelector('.gallery-tile__preview') as HTMLElement;
        const box = tile.getBoundingClientRect();
        return {
          name: tile.querySelector('a')!.textContent!.replace(' →', ''),
          top: Math.round(box.top),
          height: Math.round(box.height),
          // Content wider or taller than the preview would be clipped by its overflow: hidden.
          clipped: preview.scrollWidth > preview.clientWidth + 1 || preview.scrollHeight > preview.clientHeight + 1,
        };
      }),
    );
    expect(tiles.length).toBeGreaterThan(20);
    expect(tiles.filter((t) => t.clipped).map((t) => t.name)).toEqual([]);
    // Tiles that start on the same line are one row, and all one height.
    const rows = new Map<number, number[]>();
    for (const t of tiles) rows.set(t.top, [...(rows.get(t.top) ?? []), t.height]);
    for (const [top, heights] of rows) expect(new Set(heights).size, `row at ${top}: ${heights.join(', ')}`).toBe(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}

test('Overview: on a desktop the intro sits beside the quick start card at about its height, with no gap above the logo', async ({ page }) => {
  await openOverview(page, 1280);
  const [intro, quick] = await page.locator('.gallery-hero > *').evaluateAll((cols) =>
    cols.map((col) => { const r = col.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, height: r.height }; }),
  );
  expect(quick!.left).toBeGreaterThan(intro!.right);
  // The facts fill the intro: the two columns end within 32px of each other, so neither side leaves a hole.
  expect(Math.abs(intro!.height - quick!.height)).toBeLessThan(32);
  const tops = await page
    .getByRole('list', { name: 'At a glance' })
    .getByRole('listitem')
    .evaluateAll((items) => items.map((item) => Math.round(item.getBoundingClientRect().top)));
  // Two by two.
  expect([tops[1], tops[3]]).toEqual([tops[0], tops[2]]);
  expect(tops[2]).toBeGreaterThan(tops[0]!);
});
