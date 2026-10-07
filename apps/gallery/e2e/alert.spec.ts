import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { MODES, seedColorMode } from './mode';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
test.use({ viewport: { width: 1280, height: 900 } });

for (const mode of MODES) {
  test.describe(`Alert page, dismissible (${mode} mode)`, () => {
    test.beforeEach(async ({ page }) => {
      await seedColorMode(page, mode);
    });

    test('the × dismisses the preview Alert, "Show alert again" brings it back, and axe stays clean', async ({ page }) => {
      await page.goto('#/components/alert');
      const preview = page.getByRole('region', { name: 'Alert preview' });
      await expect(preview.getByRole('button', { name: 'Dismiss' })).toHaveCount(0);

      // The switch input sits under its track, so click the visible label, as a person would.
      await page.locator('label.bit-switch', { hasText: /^dismissible$/ }).click();
      await expect(page.getByRole('switch', { name: 'dismissible' })).toBeChecked();
      const alert = preview.getByRole('status');
      const dismiss = alert.getByRole('button', { name: 'Dismiss' });
      await expect(dismiss).toBeVisible();

      // The title and body keep clear of the ×.
      const x = (await dismiss.boundingBox())!;
      for (const part of ['.bit-alert__title', '.bit-alert__body']) {
        const box = (await alert.locator(part).boundingBox())!;
        expect(box.x + box.width, part).toBeLessThanOrEqual(x.x);
      }

      const clean = async () => {
        const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
      };
      await clean();

      await dismiss.click();
      await expect(alert).toHaveCount(0);
      const again = preview.getByRole('button', { name: 'Show alert again' });
      await expect(again).toBeFocused();
      await clean();

      await again.click();
      await expect(preview.getByRole('status')).toContainText('Your changes were saved.');
      await expect(preview.getByRole('button', { name: 'Dismiss' })).toBeFocused();
    });
  });
}
