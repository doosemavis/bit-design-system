import { expect, test } from '@playwright/test';

test.use({ forcedColors: 'active' });

for (const [slug, selector] of [
  ['input', '.bit-input'],
  ['select', '.bit-select__control'],
] as const) {
  test(`an invalid ${slug} shows a 10px start edge in forced colours`, async ({ page }) => {
    await page.goto(`#/components/${slug}`);
    await page.getByRole('switch', { name: 'invalid' }).click();
    const control = page.locator(`.gallery-preview__stage ${selector}`).first();
    await expect(control).toHaveAttribute('aria-invalid', 'true');
    await expect(control).toHaveCSS('border-inline-start-width', '10px');
  });
}
