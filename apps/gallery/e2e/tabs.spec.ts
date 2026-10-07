import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { MODES, seedColorMode } from './mode';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
test.use({ viewport: { width: 1280, height: 900 } });

test.describe('Tabs page', () => {
  test('arrows, Home and End choose (automatic); the panel follows; the plug-in animation runs then clears', async ({ page }) => {
    await page.goto('#/components/tabs');
    const preview = page.getByRole('region', { name: 'Tabs preview' });
    const overview = preview.getByRole('tab', { name: 'Overview' });
    await overview.focus();
    await page.keyboard.press('ArrowRight');
    const usage = preview.getByRole('tab', { name: 'Usage' });
    await expect(usage).toBeFocused();
    await expect(usage).toHaveAttribute('aria-selected', 'true');
    await expect(preview.getByRole('tabpanel')).toHaveText('When to reach for it, and when not to.');
    await expect(usage).toHaveAttribute('data-boot', /^[ab]$/);
    await expect(usage).not.toHaveAttribute('data-boot', /./, { timeout: 2000 });
    await page.keyboard.press('End');
    await expect(preview.getByRole('tab', { name: 'Props' })).toBeFocused();
    await page.keyboard.press('Home');
    await expect(overview).toBeFocused();
  });

  test('manual activation: arrows move focus, Enter chooses', async ({ page }) => {
    await page.goto('#/components/tabs?activation=manual');
    const preview = page.getByRole('region', { name: 'Tabs preview' });
    await preview.getByRole('tab', { name: 'Overview' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(preview.getByRole('tab', { name: 'Usage' })).toBeFocused();
    await expect(preview.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('Enter');
    await expect(preview.getByRole('tab', { name: 'Usage' })).toHaveAttribute('aria-selected', 'true');
  });

  for (const mode of MODES) {
    test(`${mode}: no axe violations`, async ({ page }) => {
      await seedColorMode(page, mode);
      await page.goto('#/components/tabs');
      await expect(page.getByRole('region', { name: 'Tabs preview' }).getByRole('tablist')).toBeVisible();
      const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
    });
  }
});
