import { expect, test } from '@playwright/test';

test("All icons: search, switch to HTML and Fill, and Copy puts that icon's class form on the clipboard", async ({ page }) => {
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
  await expect(section.getByRole('button', { name: /^Copy / })).toHaveCount(1);
  await section.getByText('HTML', { exact: true }).click();
  await section.getByText('Fill', { exact: true }).click();
  await section.getByRole('button', { name: 'Copy arrow-back-fill' }).click();
  await expect(section.getByRole('button', { name: 'Copied' })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __copied: string[] }).__copied)).toEqual([
    '<span class="bit-icon bit-icon-arrow-back-fill" aria-hidden="true"></span>',
  ]);
});
