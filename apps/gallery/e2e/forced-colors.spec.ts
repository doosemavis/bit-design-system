import { expect, test } from '@playwright/test';
import type { Locator } from '@playwright/test';

test.use({ forcedColors: 'active' });

for (const [slug, selector] of [
  ['input', '.bit-input'],
  ['select', '.bit-select__control'],
] as const) {
  test(`an invalid ${slug} shows a 10px start edge in forced colors`, async ({ page }) => {
    await page.goto(`#/components/${slug}`);
    // The switch input sits under its track, so click the visible label, as a person would.
    await page.locator('label.bit-switch', { hasText: /^invalid$/ }).click();
    await expect(page.getByRole('switch', { name: 'invalid' })).toBeChecked();
    const control = page.locator(`.gallery-preview__stage ${selector}`).first();
    await expect(control).toHaveAttribute('aria-invalid', 'true');
    await expect(control).toHaveCSS('border-inline-start-width', '10px');
  });
}

/** The computed background color of the first element the locator finds. */
function background(locator: Locator): Promise<string> {
  return locator.first().evaluate((el) => getComputedStyle(el).backgroundColor);
}

test('the pressed ModeToggle option keeps a system highlight fill in forced colors', async ({ page }) => {
  await page.goto('#/components/modetoggle');
  const group = page.getByRole('group', { name: 'Color mode' }).first();
  const pressed = await background(group.locator('[aria-pressed="true"]'));
  expect(pressed).not.toBe(await background(group.locator('[aria-pressed="false"]')));
  expect(pressed).not.toBe('rgba(0, 0, 0, 0)');
});

test('an on Switch keeps a fill in forced colors, so on and off differ by more than the thumb', async ({ page }) => {
  await page.goto('#/components/switch');
  const label = page.locator('.gallery-preview__stage label.bit-switch').first();
  const track = label.locator('.bit-switch__track');
  const off = await background(track);
  await label.click();
  await expect(label.getByRole('switch')).toBeChecked();
  expect(await background(track)).not.toBe(off);
});

for (const slug of ['button', 'badge'] as const) {
  test(`a solid ${slug} and an outline ${slug} still look different in forced colors`, async ({ page }) => {
    await page.goto(`#/components/${slug}`);
    const solid = await background(page.locator(`.bit-${slug}.bit-solid`));
    const outline = await background(page.locator(`.bit-${slug}.bit-outline`));
    expect(solid).not.toBe(outline);
  });
}
