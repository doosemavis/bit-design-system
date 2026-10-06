import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

/** The right edges of the preview stage and of the component it shows. */
async function rightEdges(page: Page) {
  const stage = (await page.locator('.gallery-preview__stage').boundingBox())!;
  const child = (await page.locator('.gallery-preview__stage > *').first().boundingBox())!;
  return { stage: stage.x + stage.width, child: child.x + child.width };
}

test.use({ viewport: { width: 1280, height: 900 } });

test('a long CodeBlock line stays inside the preview stage and scrolls in its own pre', async ({ page }) => {
  await page.goto('#/components/codeblock');
  await expect(page.getByRole('heading', { level: 1, name: 'CodeBlock' })).toBeVisible();
  const line = `const line = '${'x'.repeat(180)}'; // the end`;
  expect(line.length).toBeGreaterThanOrEqual(200);
  await page.getByRole('textbox', { name: 'code', exact: true }).fill(line);
  const pre = page.locator('.gallery-preview .bit-code__pre');
  await expect(pre).toContainText('// the end');

  const { stage, child } = await rightEdges(page);
  expect(child).toBeLessThanOrEqual(stage);
  const scroll = await pre.evaluate((el) => ({ scrollWidth: el.scrollWidth, clientWidth: el.clientWidth }));
  expect(scroll.scrollWidth).toBeGreaterThan(scroll.clientWidth);
});

test('the Table preview stays inside the preview stage at 1280px', async ({ page }) => {
  await page.goto('#/components/table');
  await expect(page.getByRole('heading', { level: 1, name: 'Table' })).toBeVisible();
  const { stage, child } = await rightEdges(page);
  expect(child).toBeLessThanOrEqual(stage);
});
