import { expect, test } from '@playwright/test';

test('RadioGroup: the arrow keys move the choice in a real browser, and Tab leaves in one stop', async ({ page }) => {
  await page.goto('#/components/radiogroup');
  const stage = page.locator('.gallery-preview__stage');
  await stage.getByRole('radio', { name: 'Standard' }).focus();
  await page.keyboard.press('ArrowDown');
  await expect(stage.getByRole('radio', { name: 'Express' })).toBeChecked();
  await expect(stage.getByRole('radio', { name: 'Express' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(stage.getByRole('radio')).not.toHaveCount(0);
  for (const radio of await stage.getByRole('radio').all()) await expect(radio).not.toBeFocused();
});

test('Textarea count: inside a Field it shares the hint row at the right, and stops at the limit', async ({ page }) => {
  await page.goto('#/components/textarea');
  const box = page.getByRole('textbox', { name: 'Bio' });
  const field = page.locator('.bit-field', { has: box });
  const hint = field.locator('.bit-field__hint');
  const count = field.locator('.bit-textarea__count');
  await expect(count).toContainText('120 / 140');
  const [boxRect, hintRect, countRect] = await Promise.all([box.boundingBox(), hint.boundingBox(), count.boundingBox()]);
  // One row under the box: the hint at the left, the count's right edge on the box's.
  expect(Math.abs(hintRect!.y - countRect!.y)).toBeLessThan(1);
  expect(hintRect!.y).toBeGreaterThan(boxRect!.y + boxRect!.height);
  expect(Math.abs(hintRect!.x - boxRect!.x)).toBeLessThan(1);
  expect(Math.abs(countRect!.x + countRect!.width - (boxRect!.x + boxRect!.width))).toBeLessThan(1);
  await expect(count).toHaveCSS('font-variant-numeric', 'tabular-nums');
  await box.press('End');
  await box.pressSequentially('x'.repeat(30));
  await expect(box).toHaveValue(/^.{140}$/s);
  await expect(count).toContainText('140 / 140');
  await expect(count).toHaveAttribute('data-state', 'limit');
});

test('Textarea count: outside a Field it sits on its own line under the box, at the end', async ({ page }) => {
  await page.goto('#/components/textarea?showCount=1');
  const stage = page.locator('.gallery-preview__stage');
  const box = stage.locator('.bit-textarea');
  const count = stage.locator('.bit-textarea__count');
  await expect(count).toHaveText('0 characters');
  const [boxRect, countRect] = await Promise.all([box.boundingBox(), count.boundingBox()]);
  expect(countRect!.y).toBeGreaterThan(boxRect!.y + boxRect!.height);
  expect(Math.abs(countRect!.x + countRect!.width - (boxRect!.x + boxRect!.width))).toBeLessThan(1);
});

test('Checkbox: the label toggles it, the box shows the ring on keyboard focus, and read-only stays put', async ({ page }) => {
  await page.goto('#/components/checkbox');
  const stage = page.locator('.gallery-preview__stage');
  const box = stage.getByRole('checkbox', { name: 'Remember me' });
  await stage.getByText('Remember me').click();
  await expect(box).toBeChecked();
  await box.focus();
  await page.keyboard.press('Space');
  await expect(box).not.toBeChecked();
  await expect(stage.locator('.bit-checkbox__box')).toHaveCSS('outline-style', 'solid');

  const readOnly = page.getByRole('checkbox', { name: 'Two-step sign-in' });
  await readOnly.click({ force: true });
  await expect(readOnly).toBeChecked();
});

test('Select: read-only shows its choice but never opens', async ({ page }) => {
  await page.goto('#/components/select?readOnly=1');
  const trigger = page.locator('.gallery-preview__stage').getByRole('combobox');
  await expect(trigger).toHaveAttribute('aria-readonly', 'true');
  await trigger.click();
  await page.keyboard.press('ArrowDown');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
});

test.describe('forced colors', () => {
  test.use({ forcedColors: 'active' });

  test('a ticked Checkbox and a chosen Radio keep a fill', async ({ page }) => {
    await page.goto('#/components/checkbox');
    const fill = (selector: string) => page.locator(selector).first().evaluate((el) => getComputedStyle(el).backgroundColor);
    const ticked = await fill('.bit-checkbox__input:checked + .bit-checkbox__box');
    const clear = await fill('.bit-checkbox__input:not(:checked):not(:indeterminate) + .bit-checkbox__box');
    expect(ticked).not.toBe(clear);
    await page.goto('#/components/radiogroup');
    const chosen = await fill('.bit-radio__input:checked + .bit-radio__dot');
    const other = await fill('.bit-radio__input:not(:checked) + .bit-radio__dot');
    expect(chosen).not.toBe(other);
  });

  test('a Textarea count near and at its limit is underlined, since its colors are gone', async ({ page }) => {
    await page.goto('#/components/textarea');
    const box = page.getByRole('textbox', { name: 'Bio' });
    const count = page.locator('.bit-field', { has: box }).locator('.bit-textarea__count');
    const line = () => count.evaluate((el) => getComputedStyle(el).textDecorationLine + ' ' + getComputedStyle(el).textDecorationStyle);
    expect(await line()).toBe('none solid');
    await box.press('End');
    await box.pressSequentially('x'.repeat(10));
    await expect(count).toHaveAttribute('data-state', 'near');
    expect(await line()).toBe('underline solid');
    await box.pressSequentially('x'.repeat(10));
    await expect(count).toHaveAttribute('data-state', 'limit');
    expect(await line()).toBe('underline double');
  });
});
