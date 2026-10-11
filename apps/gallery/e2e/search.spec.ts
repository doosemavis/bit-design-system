import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { MODES, seedColorMode } from './mode';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

test('⌘K, type, Enter: goes to the page and focuses its heading', async ({ page }) => {
  await page.goto('#/tokens');
  await expect(page.locator('main h1')).toHaveText('Tokens');
  await page.keyboard.press('Meta+k');
  const dialog = page.getByRole('dialog', { name: 'Search' });
  await expect(dialog).toBeVisible();
  const box = dialog.getByRole('combobox', { name: 'Search pages, components and props' });
  await expect(box).toBeFocused();
  await box.fill('segmented');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#\/components\/segmentedcontrol$/);
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('heading', { level: 1, name: 'SegmentedControl' })).toBeFocused();
  await expect(page).toHaveTitle('SegmentedControl · bit');
});

test('Ctrl+K, a prop, arrows and Enter: lands on that Props section, below the sticky header', async ({ page }) => {
  await page.goto('#/');
  await page.keyboard.press('Control+k');
  const box = page.getByRole('combobox', { name: 'Search pages, components and props' });
  await box.fill('size');
  const options = page.getByRole('option');
  await expect(options.first()).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowDown');
  await expect(options.nth(1)).toHaveAttribute('aria-selected', 'true');
  // A prop option is named "size, Button prop"; same-named props sort by component.
  await expect(options.nth(1)).toHaveAccessibleName(/^size, \w+ prop$/);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#\/[a-z/]+#section-props$/);
  const props = page.locator('#section-props');
  await expect(props).toBeFocused();
  const header = (await page.locator('.gallery-header').boundingBox())!;
  await expect.poll(async () => (await props.boundingBox())!.y).toBeGreaterThanOrEqual(header.height);
});

test('/ opens it from the page, but types a slash in a field', async ({ page }) => {
  await page.goto('#/components/input');
  await expect(page.locator('main h1')).toHaveText('Input');
  await page.keyboard.press('/');
  const dialog = page.getByRole('dialog', { name: 'Search' });
  const box = dialog.getByRole('combobox', { name: 'Search pages, components and props' });
  await expect(box).toBeFocused();
  await expect(box).toHaveValue('');
  await box.fill('sl');
  // Grouped: Components (Slider first), then Props.
  await expect(dialog.getByRole('group').first()).toHaveAccessibleName('Components');
  await expect(page.getByRole('option').first()).toHaveAccessibleName('Slider, component');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  const field = page.locator('main input[type="text"]').first();
  await field.fill('');
  await field.pressSequentially('a/b');
  await expect(field).toHaveValue('a/b');
  await expect(dialog).toBeHidden();
});

test('Alt+C copies the playground code and says "Copied"', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('#/components/button');
  await expect(page.locator('main h1')).toHaveText('Button');
  await page.keyboard.press('Alt+KeyC');
  await expect(page.locator('.gallery-codepanel .bit-code__copy')).toHaveText('Copied');
  await expect(page.locator('#bit-announcer')).toHaveText('Copied');
  const code = await page.getByRole('region', { name: 'Example code' }).textContent();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(code);
});

test('Esc closes it and hands focus back to the Search button', async ({ page }) => {
  await page.goto('#/');
  const button = page.getByRole('banner').getByRole('button', { name: 'Search' });
  await button.click();
  const dialog = page.getByRole('dialog', { name: 'Search' });
  await page.getByRole('combobox', { name: 'Search pages, components and props' }).fill('zzzz');
  await expect(dialog.getByRole('status')).toHaveText(/No results for “zzzz”/);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(button).toBeFocused();
});

for (const mode of MODES) {
  test(`the open dialog has no axe violations (${mode})`, async ({ page }) => {
    await seedColorMode(page, mode);
    await page.goto('#/components/button');
    await expect(page.locator('html')).toHaveAttribute('data-mode', mode);
    await page.keyboard.press('Control+k');
    await page.getByRole('combobox', { name: 'Search pages, components and props' }).fill('button');
    await expect(page.getByRole('dialog', { name: 'Search' })).toHaveAttribute('data-state', 'open');
    const { violations } = await new AxeBuilder({ page }).include('dialog').withTags(TAGS).analyze();
    expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
  });
}

test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('Search heads the Menu sheet, and the dialog fits the screen', async ({ page }) => {
    await page.goto('#/');
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('navigation', { name: 'Gallery' }).getByRole('button', { name: 'Search' }).click();
    const dialog = page.getByRole('dialog', { name: 'Search' });
    await expect(dialog).toBeVisible();
    const frame = (await dialog.boundingBox())!;
    expect(frame.x).toBeGreaterThanOrEqual(0);
    expect(frame.x + frame.width).toBeLessThanOrEqual(390);
    await page.getByRole('combobox', { name: 'Search pages, components and props' }).fill('switch');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#\/components\/switch$/);
    await expect(page.getByRole('navigation', { name: 'Gallery' })).toBeHidden();
  });
});
