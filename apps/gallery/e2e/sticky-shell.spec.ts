import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { MODES, seedColorMode } from './mode';

/** Scroll the window with no smooth animation, so a measure right after sees the end position. */
async function scrollTo(page: Page, top: number) {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), top);
}

const box = async (page: Page, selector: string) => (await page.locator(selector).first().boundingBox())!;

/** No sideways scroll on the page itself. */
async function expectNoHorizontalScroll(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
}

for (const mode of MODES) {
  test.describe(`${mode} mode`, () => {
    test.beforeEach(async ({ page }) => {
      await seedColorMode(page, mode);
    });

    test('desktop: the header and sidebar stay put while the page scrolls, and the sidebar scrolls its own list', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('#/components/button');
      await expect(page.locator('main h1')).toHaveText('Button');
      await scrollTo(page, 1500);
      const header = await box(page, '.gallery-header');
      const sidebar = await box(page, '.gallery-sidebar');
      expect(header.y).toBe(0);
      expect(sidebar.y).toBe(header.height);
      expect(sidebar.height).toBe(900 - header.height);
      const own = await page.locator('.gallery-sidebar').evaluate((nav) => ({ scroll: nav.scrollHeight, client: nav.clientHeight }));
      expect(own.scroll).toBeGreaterThan(own.client);
      await expectNoHorizontalScroll(page);
    });

    test('tablet: same sticky frame, no sideways scroll', async ({ page }) => {
      await page.setViewportSize({ width: 834, height: 1000 });
      await page.goto('#/tokens');
      await expect(page.locator('main h1')).toHaveText('Tokens');
      await scrollTo(page, 1200);
      expect((await box(page, '.gallery-header')).y).toBe(0);
      expect((await box(page, '.gallery-sidebar')).y).toBe((await box(page, '.gallery-header')).height);
      await expectNoHorizontalScroll(page);
    });
  });
}

test('a section bar jump, a "#" link and a deep link all land below the header', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('#/components/button');
  const header = await box(page, '.gallery-header');
  const props = page.locator('#section-props');

  await page.getByRole('navigation', { name: 'On this page' }).getByRole('link', { name: 'Props' }).click();
  await expect(props).toBeFocused();
  await expect.poll(async () => (await props.boundingBox())!.y).toBeGreaterThanOrEqual(header.height);
  await expect.poll(async () => (await props.boundingBox())!.y).toBeLessThan(header.height + 40);

  await scrollTo(page, 0);
  await page.getByRole('heading', { level: 2, name: 'Usage' }).hover();
  await page.getByRole('link', { name: 'Link to the Usage section' }).click();
  await expect(page).toHaveURL(/#\/components\/button#section-usage$/);
  const usage = page.locator('#section-usage');
  await expect(usage).toBeFocused();
  await expect.poll(async () => (await usage.boundingBox())!.y).toBeGreaterThanOrEqual(header.height);

  await page.goto('about:blank');
  await page.goto('#/components/badge#section-accessibility');
  const a11y = page.locator('#section-accessibility');
  await expect(a11y).toBeFocused();
  await expect.poll(async () => (await a11y.boundingBox())!.y).toBeGreaterThanOrEqual(header.height);
  await expect(page).toHaveTitle('Badge · bit');
});

test('the "#" link shows on hover and on keyboard focus, and is hidden otherwise', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('#/components/button');
  const anchor = page.getByRole('link', { name: 'Link to the Usage section' });
  await expect(anchor).toHaveCSS('opacity', '0');
  await page.getByRole('heading', { level: 2, name: 'Usage' }).hover();
  await expect(anchor).toHaveCSS('opacity', '1');
  await page.mouse.move(0, 0);
  await anchor.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect(anchor).toBeFocused();
  await expect(anchor).toHaveCSS('opacity', '1');
});

test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('Menu stays reachable while scrolled, is 44px tall, toggles to Close, and closes on Esc and on navigation', async ({ page }) => {
    await page.goto('#/components/button');
    await expect(page.locator('main h1')).toHaveText('Button');
    await scrollTo(page, 1500);
    const menu = page.getByRole('banner').getByRole('button', { name: 'Menu' });
    const menuBox = (await menu.boundingBox())!;
    expect(menuBox.y).toBeGreaterThanOrEqual(0);
    expect(menuBox.y + menuBox.height).toBeLessThanOrEqual((await box(page, '.gallery-header')).height);
    expect(menuBox.height).toBeGreaterThanOrEqual(44);
    await expectNoHorizontalScroll(page);

    await menu.click();
    const close = page.getByRole('banner').getByRole('button', { name: 'Close' });
    await expect(close).toHaveAttribute('aria-expanded', 'true');
    await expect(close).toHaveAttribute('aria-controls', 'gallery-nav');
    await expect(close).toBeFocused();
    const nav = page.getByRole('navigation', { name: 'Gallery' });
    await expect(nav).toBeVisible();
    // The sheet fills the window under the header exactly: it scrolls its own list, never the page.
    const headerHeight = (await box(page, '.gallery-header')).height;
    const sheet = (await nav.boundingBox())!;
    expect(sheet.y).toBe(headerHeight);
    expect(sheet.height).toBe(844 - headerHeight);
    await expect(nav.getByRole('link', { name: 'Button', exact: true })).toBeInViewport();

    await page.keyboard.press('Escape');
    await expect(nav).toBeHidden();
    await expect(menu).toBeFocused();

    await menu.click();
    await nav.getByRole('link', { name: 'Badge', exact: true }).click();
    await expect(page.locator('main h1')).toHaveText('Badge');
    await expect(nav).toBeHidden();
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('main h1')).toBeFocused();
  });
});
