import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

test.use({ viewport: { width: 1280, height: 900 } });

/** The two Variants rows' Navbars (pill, then bar), and their rendered heights. */
async function variantHeights(page: Page): Promise<number[]> {
  const table = page.getByRole('table', { name: 'Navbar variants' });
  const bars = table.locator('.bit-navbar');
  await expect(bars).toHaveCount(2);
  await expect(bars.nth(0)).toHaveClass(/bit-pill/);
  await expect(bars.nth(1)).toHaveClass(/bit-bar/);
  return bars.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
}

test.describe('Navbar page', () => {
  for (const [size, px] of [
    ['md', 70],
    ['sm', 62],
  ] as const) {
    test(`pill and bar are exactly the same height at ${size} (${px}px)`, async ({ page }) => {
      await page.goto(`#/components/navbar${size === 'md' ? '' : `?size=${size}`}`);
      expect(await variantHeights(page)).toEqual([px, px]);
    });
  }

  test('switching the playground between pill and bar moves nothing below it', async ({ page }) => {
    await page.goto('#/components/navbar');
    const below = page.locator('#section-variants');
    const before = (await below.boundingBox())!.y;
    await page.goto('#/components/navbar?variant=bar');
    await expect(page.locator('.gallery-preview__stage .bit-navbar.bit-bar')).toBeVisible();
    expect((await below.boundingBox())!.y).toBe(before);
  });

  test('at phone width the links fold into a Menu with a 44px tap target; the Menu lists the links', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('#/components/navbar');
    const example = page.getByRole('article').filter({ hasText: 'On a phone' });
    const nav = example.locator('.bit-navbar');
    await expect(nav.locator('.bit-navbar__links')).toBeHidden();
    const toggle = nav.getByRole('button', { name: 'Menu' });
    await expect(toggle).toBeVisible();
    await toggle.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    // The hit area reaches 44px tall: a point just above the drawn button still lands on it.
    const box = (await toggle.boundingBox())!;
    expect(box.height).toBeLessThan(44);
    const reach = (44 - box.height) / 2 - 1;
    expect(await page.evaluate(([x, y]) => document.elementFromPoint(x!, y!)?.closest('.bit-navbar__toggle') !== null, [box.x + box.width / 2, box.y - reach])).toBe(true);
    await toggle.click();
    const menu = page.getByRole('menu', { name: 'Menu' });
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('menuitem')).toHaveText(['Menu', 'Navbar', 'Link']);
    await expect(menu.getByRole('menuitem', { name: 'Navbar' })).toHaveAttribute('aria-current', 'page');
    await expect(nav.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });
});
