import { expect, test } from '@playwright/test';

/** The computed width of the Foundations title's ::after bar, the title's own width, and the animation name. */
async function barState(page: import('@playwright/test').Page) {
  return page.getByRole('heading', { level: 2, name: 'Foundations' }).evaluate((title) => {
    const bar = getComputedStyle(title, '::after');
    return { bar: parseFloat(bar.width), title: title.getBoundingClientRect().width, animation: bar.animationName };
  });
}

test('reduced motion: the current section underline is full width with no animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('#/tokens');
  await expect(page.getByRole('heading', { level: 2, name: 'Foundations' })).toBeVisible();
  const { bar, title, animation } = await barState(page);
  expect(animation).toBe('none');
  expect(bar).toBeCloseTo(title, 0);
});

test('the current section underline has filled the title after 600ms', async ({ page }) => {
  await page.goto('#/tokens');
  await expect(page.getByRole('heading', { level: 2, name: 'Foundations' })).toBeVisible();
  await page.waitForTimeout(600);
  const { bar, title } = await barState(page);
  expect(bar).toBeCloseTo(title, 0);
});

test('a section that is not current keeps the 22px bar', async ({ page }) => {
  await page.goto('#/tokens');
  const width = await page
    .getByRole('heading', { level: 2, name: 'Components' })
    .evaluate((title) => parseFloat(getComputedStyle(title, '::after').width));
  expect(width).toBe(22);
});
