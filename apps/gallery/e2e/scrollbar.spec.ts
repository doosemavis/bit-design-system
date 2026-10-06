import { expect, test } from '@playwright/test';

// Headless Chromium draws no scrollbars, so pin the computed style that lets ::-webkit-scrollbar apply:
// Chrome 121+ ignores those pseudo-elements while the standard properties (set on :root by reset.css) are not `auto`.
test('the CodeBlock hands its scrollbar to ::-webkit-scrollbar', async ({ page }) => {
  await page.goto('#/components/button');
  const pre = page.locator('.bit-code__pre').first();
  await expect(pre).toBeVisible();
  await expect(pre).toHaveCSS('scrollbar-color', 'auto');
  await expect(pre).toHaveCSS('scrollbar-width', 'auto');
});
