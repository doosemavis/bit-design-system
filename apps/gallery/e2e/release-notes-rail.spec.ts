import { expect, test } from '@playwright/test';

test('Release notes: the version rail shows full-width rows with muted dates and a highlighted chosen version', async ({ page }) => {
  await page.goto('#/release-notes');
  const rail = page.getByRole('navigation', { name: 'Versions' });
  const current = rail.locator('a[aria-current="true"]');
  await expect(current).toHaveCount(1);
  const look = await current.evaluate((a) => {
    const css = getComputedStyle(a);
    const version = a.querySelector('span:not(.bit-text)') as HTMLElement;
    const date = a.querySelector('.bit-text') as HTMLElement;
    return {
      background: css.backgroundColor,
      decoration: css.textDecorationLine,
      borderWidth: css.borderTopWidth,
      weight: css.fontWeight,
      versionColor: getComputedStyle(version).color,
      dateColor: getComputedStyle(date).color,
      rowWidth: a.getBoundingClientRect().width,
      railWidth: (a.closest('nav') as HTMLElement).getBoundingClientRect().width,
    };
  });
  expect(look.background).not.toBe('rgba(0, 0, 0, 0)');
  expect(look.decoration).toBe('none');
  expect(look.borderWidth).toBe('2px');
  expect(Number(look.weight)).toBeGreaterThanOrEqual(700);
  expect(look.dateColor).not.toBe(look.versionColor);
  expect(look.rowWidth).toBeGreaterThanOrEqual(look.railWidth - 1);
  const other = rail.locator('a:not([aria-current])').first();
  expect(await other.evaluate((a) => getComputedStyle(a).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
});
