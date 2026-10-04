import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { MODES, seedColorMode } from './mode';
import { ROUTES } from './routes';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

for (const mode of MODES) {
  test.describe(`${mode} mode`, () => {
    test.beforeEach(async ({ page }) => {
      await seedColorMode(page, mode);
    });

    for (const route of ROUTES) {
      test(`${route.name} has no axe violations`, async ({ page }) => {
        await page.goto(route.hash);
        await expect(page.locator('main h1').first()).toBeVisible();
        await expect(page.locator('html')).toHaveAttribute('data-mode', mode);
        const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
        const summary = violations.map((v) => `${v.id}: ${v.help} → ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`);
        expect(summary).toEqual([]);
      });
    }
  });
}
