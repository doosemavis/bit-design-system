import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { MODES, seedColorMode } from './mode';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const GAMES = ['Snake', 'Cheese Run'] as const;

const nav = (page: Page) => page.getByRole('navigation', { name: 'Gallery' });

/** Opens a game from the sidebar's Arcade section and waits for its board to take focus. */
async function openGame(page: Page, name: (typeof GAMES)[number]) {
  await nav(page).getByRole('button', { name }).click();
  const region = page.getByRole('region', { name: `Arcade: ${name}` });
  const board = region.getByRole('application', { name: `${name} board` });
  await expect(board).toBeFocused();
  return { region, board };
}

/** The board's pixels, to tell whether anything moved. */
const pixels = (region: Locator) => region.locator('canvas').evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());

for (const name of GAMES) {
  test(`${name}: opens from the sidebar, plays on the keys, pauses, and Back returns focus to its item`, async ({ page }) => {
    await page.goto('#/tokens');
    await expect(page.locator('main h1')).toHaveText('Tokens');
    const { region } = await openGame(page, name);
    await expect(nav(page)).toHaveCount(0);
    // A real 2D canvas, painted, and painted again once the game starts.
    const before = await pixels(region);
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    await expect(region.getByRole('button', { name: 'Pause' })).toBeEnabled();
    await expect.poll(() => pixels(region)).not.toBe(before);
    await page.keyboard.press('Space');
    await expect(region.getByRole('status')).toHaveText('Paused. Press Space to go on.');
    await region.getByRole('button', { name: 'Back to menu' }).click();
    await expect(nav(page).getByRole('button', { name })).toBeFocused();
    // The page itself never moved.
    await expect(page).toHaveURL(/#\/tokens$/);
  });
}

test('Esc pauses a running game, then goes back; the arrows never scroll the page while the board has them', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 700 });
  await page.goto('#/components/button');
  await openGame(page, 'Snake');
  const scrollY = await page.evaluate(() => window.scrollY);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Escape');
  const region = page.getByRole('region', { name: 'Arcade: Snake' });
  await expect(region.getByRole('button', { name: 'Resume' })).toBeVisible();
  expect(await page.evaluate(() => window.scrollY)).toBe(scrollY);
  await page.keyboard.press('Escape');
  await expect(nav(page).getByRole('button', { name: 'Snake' })).toBeFocused();
  // Off the board, the keys are the page's again.
  await page.locator('main').focus();
  await page.keyboard.press('End');
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(scrollY);
});

test('a game runs under the Content-Security-Policy, loaded as its own chunk only when opened', async ({ page }) => {
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
  for (const name of GAMES) {
    await openGame(page, name);
    await page.keyboard.press('ArrowRight');
    await page.getByRole('button', { name: 'Back to menu' }).click();
  }
  expect(scripts.length).toBeGreaterThan(before);
  expect(violations).toEqual([]);
});

for (const mode of MODES) {
  for (const name of GAMES) {
    test(`the ${name} panel has no axe violations (${mode})`, async ({ page }) => {
      await seedColorMode(page, mode);
      await page.goto('#/');
      await expect(page.locator('html')).toHaveAttribute('data-mode', mode);
      await openGame(page, name);
      const { violations } = await new AxeBuilder({ page }).include('#gallery-nav').withTags(TAGS).analyze();
      expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
    });
  }
}

test('forced colors: the board paints in the system Canvas color', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('#/');
  const { region } = await openGame(page, 'Snake');
  const corner = await region
    .locator('canvas')
    .evaluate((canvas: HTMLCanvasElement) => [...canvas.getContext('2d')!.getImageData(1, 1, 1, 1).data].slice(0, 3));
  const system = await page.evaluate(() => {
    const probe = document.createElement('span');
    probe.style.color = 'Canvas';
    probe.style.setProperty('forced-color-adjust', 'none');
    document.body.append(probe);
    const rgb = getComputedStyle(probe).color.match(/\d+/g)!.slice(0, 3).map(Number);
    probe.remove();
    return rgb;
  });
  expect(corner).toEqual(system);
});

/** The board's grid as [columns, rows], from its data-grid. */
const gridOf = async (board: Locator) => (await board.getAttribute('data-grid'))!.split('x').map(Number) as [number, number];

test('the boards fill the sidebar’s height: taller than wide, and a resize mid-game keeps the grid until the next game', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('#/');
  const snake = await openGame(page, 'Snake');
  const box = (await snake.board.boundingBox())!;
  expect(box.height).toBeGreaterThan(450);
  expect(box.height).toBeGreaterThan(2 * box.width);
  // A fixed number of columns, so the 50px-wider game sidebar means bigger cells and fewer rows: 34 at 1440x900.
  await expect.poll(async () => (await gridOf(snake.board))[1]).toBeGreaterThan(30);
  const before = await gridOf(snake.board);
  // The instructions are folded away under the controls.
  await expect(snake.region.getByRole('button', { name: 'How to play' })).toHaveAttribute('aria-expanded', 'false');
  await page.keyboard.press('ArrowUp');
  await page.setViewportSize({ width: 1440, height: 800 });
  await expect.poll(async () => (await snake.board.boundingBox())!.height).toBeLessThan(box.height);
  expect(await gridOf(snake.board)).toEqual(before);
  await expect(snake.region.getByRole('button', { name: 'Pause' })).toBeEnabled();
  await snake.region.getByRole('button', { name: 'Restart' }).click();
  await expect.poll(async () => (await gridOf(snake.board))[1]).toBeLessThan(before[1]);

  await snake.region.getByRole('button', { name: 'Back to menu' }).click();
  const cheese = await openGame(page, 'Cheese Run');
  // At 1440x800 Cheese Run's taller HUD (five badges) leaves a board under twice as tall as wide: a 7 by 13 maze.
  await expect.poll(async () => (await gridOf(cheese.board))[1]).toBeGreaterThan(1.5 * (await gridOf(cheese.board))[0]);
});

test('a game widens the sidebar by 50px, and Back narrows it again', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('#/');
  const width = (locator: Locator) => locator.evaluate((el) => el.getBoundingClientRect().width);
  const mainStart = () => page.locator('main').evaluate((el) => el.getBoundingClientRect().left);
  const menu = await width(nav(page));
  const start = await mainStart();
  const { region } = await openGame(page, 'Snake');
  expect(await width(region)).toBe(menu + 50);
  // Main moves over beside it rather than sitting under it.
  expect(await mainStart()).toBe(start + 50);
  await region.getByRole('button', { name: 'Back to menu' }).click();
  expect(await width(nav(page))).toBe(menu);
});

test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test('a game runs in the Menu sheet with 44px+ arrows, sized to fit, and Back keeps the sheet open', async ({ page }) => {
    await page.goto('#/');
    await page.getByRole('button', { name: 'Menu' }).click();
    const { region } = await openGame(page, 'Cheese Run');
    const box = (await region.locator('.gallery-game__board').boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(390);
    const arrows = region.getByRole('group', { name: 'Arrows' }).getByRole('button');
    await expect(arrows).toHaveCount(4);
    for (const arrow of await arrows.all()) {
      const size = (await arrow.boundingBox())!;
      expect(size.width).toBeGreaterThanOrEqual(44);
      expect(size.height).toBeGreaterThanOrEqual(44);
    }
    // The board takes the sheet's height above the arrows: the whole game fits with nothing to scroll.
    expect(await region.evaluate((sheet) => sheet.scrollHeight - sheet.clientHeight)).toBeLessThanOrEqual(1);
    await region.getByRole('button', { name: 'Right' }).tap();
    await region.getByRole('button', { name: 'Down' }).tap();
    await expect(region.getByRole('button', { name: 'Pause' })).toBeEnabled();
    await region.getByRole('button', { name: 'Back to menu' }).tap();
    await expect(nav(page)).toBeVisible();
    await expect(nav(page).getByRole('button', { name: 'Cheese Run' })).toBeFocused();
  });
});
