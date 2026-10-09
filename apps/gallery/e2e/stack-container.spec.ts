import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

test.use({ viewport: { width: 1280, height: 900 } });

/** The widths of the stage, the Box the Stack sits in, and each Badge, on the Stack page with these settings. */
async function measure(page: Page, query: string) {
  await page.goto(`#/components/stack?${query}`);
  await expect(page.getByRole('heading', { level: 1, name: 'Stack' })).toBeVisible();
  const stage = page.locator('.gallery-preview__stage');
  const box = stage.locator('> .bit-box');
  await expect(box.locator('.bit-badge')).toHaveCount(3);
  const width = async (locator: ReturnType<Page['locator']>) => Math.round((await locator.boundingBox())!.width);
  const padding = await stage.evaluate((el) => parseFloat(getComputedStyle(el).paddingLeft) + parseFloat(getComputedStyle(el).paddingRight));
  return {
    stage: (await width(stage)) - Math.round(padding),
    box: await width(box),
    badges: await Promise.all([0, 1, 2].map((i) => width(box.locator('.bit-badge').nth(i)))),
  };
}

test('stretch: every Badge runs the full width inside the Box, less its 4px padding each side', async ({ page }) => {
  const { box, badges } = await measure(page, 'containerWidth=240');
  expect(box).toBe(240);
  expect(badges).toEqual([232, 232, 232]);
});

test('start: the same Box, but each Badge shrinks back to its label', async ({ page }) => {
  const { box, badges } = await measure(page, 'containerWidth=240&align=start');
  expect(box).toBe(240);
  for (const badge of badges) expect(badge).toBeLessThan(120);
});

/** Each Badge's box, and the Box's, on the Stack page with these settings. */
async function boxes(page: Page, query: string) {
  await page.goto(`#/components/stack?${query}`);
  const box = page.locator('.gallery-preview__stage > .bit-box');
  await expect(box.locator('.bit-badge')).toHaveCount(3);
  await page.evaluate(() => document.fonts.ready.then(() => true));
  return {
    box: (await box.boundingBox())!,
    badges: await Promise.all([0, 1, 2].map(async (i) => (await box.locator('.bit-badge').nth(i).boundingBox())!)),
    wrapped: (await box.locator('.bit-stack').getAttribute('data-wrap')) !== null,
  };
}

for (const query of ['direction=row&gap=8&justify=end&containerWidth=160', 'direction=row&gap=64&containerWidth=240']) {
  test(`a row too wide for its Box wraps by itself, and no Badge leaves the outline (${query})`, async ({ page }) => {
    const { box, badges, wrapped } = await boxes(page, query);
    expect(wrapped).toBe(true);
    for (const b of badges) {
      expect(b.x).toBeGreaterThanOrEqual(box.x);
      expect(b.x + b.width).toBeLessThanOrEqual(box.x + box.width);
    }
    expect(badges[2]!.y).toBeGreaterThan(badges[0]!.y);
  });
}

test('a row that fits stays on one line: no wrap', async ({ page }) => {
  const { badges, wrapped } = await boxes(page, 'direction=row&gap=8&justify=end&containerWidth=360');
  expect(wrapped).toBe(false);
  expect(new Set(badges.map((b) => Math.round(b.y))).size).toBe(1);
});

test('container height 80, row, stretch: every Badge runs the full height inside the Box', async ({ page }) => {
  const { box, badges } = await boxes(page, 'direction=row&gap=8&containerHeight=80');
  expect(Math.round(box.height)).toBe(80);
  for (const b of badges) expect(Math.round(b.height)).toBe(72);
});

test('container height 200, column, justify end: the Badges sit at the bottom of the Box', async ({ page }) => {
  const { box, badges } = await boxes(page, 'justify=end&containerHeight=200');
  const last = badges[2]!;
  expect(Math.round(box.y + box.height - (last.y + last.height))).toBe(4);
});

test('container height 80, column: too tall for it, so it wraps into columns inside the outline', async ({ page }) => {
  const { box, badges, wrapped } = await boxes(page, 'align=start&containerHeight=80');
  expect(wrapped).toBe(true);
  for (const b of badges) expect(b.y + b.height).toBeLessThanOrEqual(box.y + box.height);
});

test('100%: the Box fills the stage, and stretched Badges with it', async ({ page }) => {
  const { stage, box, badges } = await measure(page, 'containerWidth=100%25');
  expect(Math.abs(box - stage)).toBeLessThanOrEqual(1);
  expect(badges).toEqual([box - 8, box - 8, box - 8]);
});
