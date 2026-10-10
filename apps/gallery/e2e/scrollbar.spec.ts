import { expect, test } from '@playwright/test';

// Headless Chromium draws no scrollbars, so pin the computed style that lets ::-webkit-scrollbar apply:
// Chrome 121+ ignores those pseudo-elements while the standard properties (set on :root by reset.css) are not `auto`.
test('the presets row hands its scrollbar to ::-webkit-scrollbar', async ({ page }) => {
  await page.goto('#/components/button');
  const area = page.locator('.gallery-presets').first();
  await expect(area).toBeVisible();
  await expect(area).toHaveCSS('scrollbar-color', 'auto');
  await expect(area).toHaveCSS('scrollbar-width', 'auto');
});

test('the sidebar still scrolls, with no scrollbar showing', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 500 });
  await page.goto('#/components/button');
  const sidebar = page.locator('.gallery-sidebar');
  await expect(sidebar).toHaveCSS('scrollbar-width', 'none');
  await expect(sidebar).toHaveCSS('overflow-y', 'auto');
  // Taller than the window, so it scrolls: the wheel moves it.
  await sidebar.hover();
  await page.mouse.wheel(0, 400);
  await expect.poll(() => sidebar.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
});

test('the CodeBlock hands its scrollbar to ::-webkit-scrollbar', async ({ page }) => {
  await page.goto('#/components/button');
  const pre = page.locator('.bit-code__pre').first();
  await expect(pre).toBeVisible();
  await expect(pre).toHaveCSS('scrollbar-color', 'auto');
  await expect(pre).toHaveCSS('scrollbar-width', 'auto');
});
