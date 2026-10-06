import { expect, test } from '@playwright/test';

// Headless Chromium draws no scrollbars, so pin the computed style that lets ::-webkit-scrollbar apply:
// Chrome 121+ ignores those pseudo-elements while the standard properties (set on :root by reset.css) are not `auto`.
test('the presets row and the sidebar hand their scrollbars to ::-webkit-scrollbar', async ({ page }) => {
  await page.goto('#/components/button');
  for (const selector of ['.gallery-presets', '.gallery-sidebar']) {
    const area = page.locator(selector).first();
    await expect(area).toBeVisible();
    await expect(area).toHaveCSS('scrollbar-color', 'auto');
    await expect(area).toHaveCSS('scrollbar-width', 'auto');
  }
});

test('the CodeBlock hands its scrollbar to ::-webkit-scrollbar', async ({ page }) => {
  await page.goto('#/components/button');
  const pre = page.locator('.bit-code__pre').first();
  await expect(pre).toBeVisible();
  await expect(pre).toHaveCSS('scrollbar-color', 'auto');
  await expect(pre).toHaveCSS('scrollbar-width', 'auto');
});
