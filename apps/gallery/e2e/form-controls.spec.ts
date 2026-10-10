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
});

test('Slider: the real arrow, Page and Home/End keys move it, the thumb shows the ring, and the round bubble opens on focus', async ({ page }) => {
  await page.goto('#/components/slider');
  const stage = page.locator('.gallery-preview__stage');
  const input = stage.getByRole('slider', { name: 'Volume' });
  await expect(input).toHaveValue('6');
  await input.focus();
  await page.keyboard.press('ArrowRight');
  await expect(input).toHaveValue('7');
  await page.keyboard.press('Home');
  await expect(input).toHaveValue('0');
  await page.keyboard.press('PageUp');
  await expect(input).not.toHaveValue('0');
  await page.keyboard.press('End');
  await expect(input).toHaveValue('10');
  await expect(stage.locator('.bit-slider__thumb')).toHaveCSS('outline-style', 'solid');
  // The thumb ends flush with the track's end at max.
  const [thumb, track] = await Promise.all([stage.locator('.bit-slider__thumb').boundingBox(), stage.locator('.bit-slider__track').boundingBox()]);
  expect(Math.abs(thumb!.x + thumb!.width - (track!.x + track!.width))).toBeLessThan(1);

  await page.goto('#/components/slider?variant=round');
  const round = page.locator('.gallery-preview__stage');
  await round.getByRole('slider').focus();
  await expect(round.locator('.bit-slider__bubble')).toHaveCSS('opacity', '1');
});

test('Slider: a click on a block picks that block, and a drag on the square thumb lands where the pointer is', async ({ page }) => {
  await page.goto('#/components/slider?variant=blocks');
  const stage = page.locator('.gallery-preview__stage');
  const input = stage.getByRole('slider');
  await stage.locator('.bit-slider__block').nth(2).click();
  await expect(input).toHaveValue('3');
  await expect(stage.locator('.bit-slider__block[data-state="current"]')).toHaveCount(1);

  await page.goto('#/components/slider');
  const square = page.locator('.gallery-preview__stage');
  const box = (await square.locator('.bit-slider').boundingBox())!;
  await page.mouse.click(box.x + box.width - 2, box.y + box.height / 2);
  await expect(square.getByRole('slider')).toHaveValue('10');
});
