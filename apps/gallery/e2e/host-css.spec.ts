import { expect, test } from '@playwright/test';

// bit's CSS sits in cascade layers and touches nothing outside its own classes, so a host app's plain CSS wins
// and the host's own elements keep their defaults.

test('an unlayered host style beats a bit component rule, even with lower specificity', async ({ page }) => {
  await page.goto('#/components/button');
  const button = page.locator('.gallery-preview__stage .bit-button').first();
  await expect(button).not.toHaveCSS('padding-left', '0px');
  await page.addStyleTag({ content: 'button { padding-left: 0; }' });
  await expect(button).toHaveCSS('padding-left', '0px');
});

test("bit sets no scrollbar-width and no motion on a host's own elements", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('#/tokens');
  const own = await page.evaluate(() => {
    const el = document.createElement('div');
    el.style.cssText = 'overflow: auto; transition: opacity 300ms; animation: spin-host 2s infinite;';
    document.body.append(el);
    const style = getComputedStyle(el);
    return { width: style.scrollbarWidth, transition: style.transitionDuration, animation: style.animationDuration, count: style.animationIterationCount };
  });
  expect(own).toEqual({ width: 'auto', transition: '0.3s', animation: '2s', count: 'infinite' });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('the Spinner, a loading Button and the Switch stand still', async ({ page }) => {
    await page.goto('#/components/spinner');
    await expect(page.locator('.bit-spinner').first()).toHaveCSS('animation-name', 'none');
    await page.goto('#/components/switch');
    await expect(page.locator('.bit-switch__thumb').first()).toHaveCSS('transition-duration', '0s');
    await page.goto('#/components/button');
    await expect(page.locator('.bit-button').first()).toHaveCSS('transition-duration', '0s');
  });
});
