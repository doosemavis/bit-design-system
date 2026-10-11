import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { MODES, seedColorMode } from './mode';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const nav = (page: Page) => page.getByRole('navigation', { name: 'Gallery' });
const stage = (page: Page) => page.getByRole('region', { name: 'Arcade: Bit Blaster' });
const board = (page: Page) => page.getByRole('application', { name: 'Bit Blaster board' });
const cabinet = (page: Page) => page.locator('.gallery-stage');
const pixels = (page: Page) => board(page).locator('canvas').evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());

test('opens over the main area with a pixel swipe, the header and sidebar untouched, and closes back to the same spot', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('#/components/button');
  await expect(page.locator('main h1')).toHaveText('Button');
  await page.evaluate(() => window.scrollTo({ top: 600, behavior: 'instant' }));
  const header = await page.locator('.gallery-header').boundingBox();
  const sidebar = await nav(page).boundingBox();

  await nav(page).getByRole('button', { name: 'Bit Blaster' }).click();
  // First the swipe, then the game.
  await expect(cabinet(page)).toHaveAttribute('data-phase', 'in');
  await expect(board(page)).toBeFocused();
  await expect(cabinet(page)).toHaveAttribute('data-phase', 'shown');

  // The main area, black: under the header, beside the sidebar, to the window's bottom.
  const box = (await cabinet(page).boundingBox())!;
  expect(box.x).toBe(sidebar!.width);
  expect(box.y).toBe(header!.height);
  expect(box.y + box.height).toBe(900);
  expect(await cabinet(page).evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgb(11, 11, 16)');
  expect(await page.locator('.gallery-header').boundingBox()).toEqual(header);
  expect(await nav(page).boundingBox()).toEqual(sidebar);
  // Tall: the field takes most of the area's height, in whole 2x pixels.
  const field = (await board(page).boundingBox())!;
  expect(field.height).toBeGreaterThan(0.8 * box.height);
  expect(field.width).toBe(448);
  // The page can't scroll under it.
  await page.mouse.wheel(0, 800);
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => window.scrollY)).toBe(600);

  await stage(page).getByRole('button', { name: 'Back to page' }).click();
  await expect(cabinet(page)).toHaveAttribute('data-phase', 'out');
  await expect(cabinet(page)).toHaveCount(0);
  expect(await page.evaluate(() => window.scrollY)).toBe(600);
  await expect(nav(page).getByRole('button', { name: 'Bit Blaster' })).toBeFocused();
  await expect(page).toHaveURL(/#\/components\/button$/);
});

test('the browser’s Back closes it, Forward brings it back, and the address never changes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('#/tokens');
  await expect(page.locator('main h1')).toHaveText('Tokens');
  await nav(page).getByRole('button', { name: 'Bit Blaster' }).click();
  await expect(board(page)).toBeFocused();
  await expect(page).toHaveURL(/#\/tokens$/);
  await page.goBack();
  await expect(stage(page)).toHaveCount(0);
  await expect(page.locator('main h1')).toHaveText('Tokens');
  await page.goForward();
  await expect(board(page)).toBeVisible();
});

test('reduce motion: no swipe, the game is simply there', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('#/');
  await nav(page).getByRole('button', { name: 'Bit Blaster' }).click();
  await expect(cabinet(page)).toHaveAttribute('data-phase', 'shown');
  expect(await page.locator('.gallery-stage__swipe').count()).toBe(0);
  // Slow speed starts on, as in the sidebar games.
  await expect(stage(page).getByRole('switch', { name: 'Slow speed' })).toBeChecked();
});

test('plays: the keys move and fire, the swarm can be hit, and P pauses', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('#/');
  await nav(page).getByRole('button', { name: 'Bit Blaster' }).click();
  await expect(board(page)).toBeFocused();
  const before = await pixels(page);
  await page.keyboard.press('Space');
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(300);
  await page.keyboard.up('ArrowRight');
  await expect.poll(() => pixels(page)).not.toBe(before);
  const score = stage(page).locator('.bit-badge').first();
  await expect
    .poll(
      async () => {
        await page.keyboard.press('Space');
        return score.textContent();
      },
      { timeout: 15_000, intervals: [300] },
    )
    .not.toBe('Score 0');
  await page.keyboard.press('p');
  await expect(stage(page).getByRole('button', { name: 'Resume' })).toBeVisible();
});

test('a stage game runs under the Content-Security-Policy, loaded as its own chunk only when opened', async ({ page }) => {
  const violations: string[] = [];
  page.on('console', (message) => {
    if (/Content Security Policy/i.test(message.text())) violations.push(message.text());
  });
  const scripts: string[] = [];
  page.on('request', (request) => {
    if (request.url().endsWith('.js')) scripts.push(request.url());
  });
  await page.goto('#/');
  await expect(page.locator('main h1').first()).toBeVisible();
  const before = scripts.length;
  await nav(page).getByRole('button', { name: 'Bit Blaster' }).click();
  await expect(board(page)).toBeFocused();
  await page.keyboard.press('Space');
  expect(scripts.length).toBeGreaterThan(before);
  expect(violations).toEqual([]);
});

for (const mode of MODES) {
  test(`the Bit Blaster stage has no axe violations (${mode})`, async ({ page }) => {
    await seedColorMode(page, mode);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('#/');
    await expect(page.locator('html')).toHaveAttribute('data-mode', mode);
    await nav(page).getByRole('button', { name: 'Bit Blaster' }).click();
    await expect(board(page)).toBeFocused();
    const { violations } = await new AxeBuilder({ page }).include('#gallery-stage').withTags(TAGS).analyze();
    expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
  });
}

test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test('from the Menu sheet: the sheet closes, the game fills the screen under the header, with 44px+ controls', async ({ page }) => {
    await page.goto('#/');
    await page.getByRole('button', { name: 'Menu' }).click();
    await nav(page).getByRole('button', { name: 'Bit Blaster' }).click();
    await expect(board(page)).toBeVisible();
    await expect(nav(page)).toBeHidden();
    const box = (await cabinet(page).boundingBox())!;
    expect(box.x).toBe(0);
    expect(box.y + box.height).toBe(844);
    // The whole game fits: nothing to scroll, nothing off the side.
    const game = page.locator('.gallery-stage__game');
    expect(await game.evaluate((el) => el.scrollHeight - el.clientHeight)).toBeLessThanOrEqual(1);
    expect(await game.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
    const controls = stage(page).getByRole('group', { name: 'Controls' }).getByRole('button');
    await expect(controls).toHaveCount(3);
    for (const control of await controls.all()) {
      const size = (await control.boundingBox())!;
      expect(size.width).toBeGreaterThanOrEqual(44);
      expect(size.height).toBeGreaterThanOrEqual(44);
    }
    await stage(page).getByRole('button', { name: 'Fire' }).tap();
    await expect(stage(page).getByRole('button', { name: 'Pause' })).toBeEnabled();
    await expect(board(page)).toBeFocused();
    await stage(page).getByRole('button', { name: 'Back to page' }).tap();
    await expect(cabinet(page)).toHaveCount(0);
  });
});
