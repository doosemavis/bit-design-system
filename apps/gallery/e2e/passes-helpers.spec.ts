import { expect, test } from '@playwright/test';
import { gotoPass, passStage, passUrl, touchErrors } from './passes-helpers';

test.describe('Passes helpers: the touch rule cannot pass before anything is measured', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('an unmeasured Tokens stage reports that no callout is shown yet', async ({ page }) => {
    // The stage measures in an animation frame: with none, every callout stays hidden, as before the first measure.
    await page.addInitScript(() => {
      window.requestAnimationFrame = () => 0;
    });
    await page.goto(passUrl('button', 'tokens'));
    await expect(passStage(page, 'tokens')).toBeVisible();
    expect(await touchErrors(page)).toContain('no callout shown yet');
  });

  test('once measured, the same stage has none', async ({ page }) => {
    await gotoPass(page, 'button', 'tokens');
    await expect(page.locator('[data-role="line"]')).toHaveCount(4);
    await expect.poll(() => touchErrors(page)).toEqual([]);
  });
});
