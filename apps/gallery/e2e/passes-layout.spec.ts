import { expect, test } from '@playwright/test';
import { MODES, seedColorMode } from './mode';
import { calloutGaps, calloutOverlaps, gotoPass, loupeOverlaps, passesAxe, touchErrors } from './passes-helpers';

/** The Layout group: each slug with every anatomy part, as its callout is labeled. */
const SLUGS: Record<string, string[]> = {
  box: ['Padding', 'Margin'],
  card: ['Edge', 'Surface', 'Shadow', 'Header divider', 'Header text', 'Footer divider', 'Footer fill'],
  stack: ['Gap, One to Two', 'Gap, Two to Three'],
  table: ['Edge', 'Surface', 'Shadow', 'Header divider', 'Header text', 'Row divider', 'Stripe', 'Cell padding'],
};

test.describe('Passes: Layout', () => {
  for (const [slug, parts] of Object.entries(SLUGS)) {
    test(`${slug}: Tokens at 1440px lists every part and the lines touch`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await gotoPass(page, slug, 'tokens');
      await expect(page.locator('[data-role="line"]')).toHaveCount(parts.length);
      const labels = await page.locator('[role="listitem"][data-part]').evaluateAll((els) => els.map((el) => el.getAttribute('data-part')));
      expect([...labels].sort()).toEqual([...parts].sort());
      await expect.poll(() => touchErrors(page), { message: `${slug} touch rule` }).toEqual([]);
      await expect.poll(() => calloutGaps(page), { message: `${slug} callout ends` }).toEqual([]);
      await expect.poll(() => loupeOverlaps(page), { message: `${slug} loupe placement` }).toEqual([]);
      await expect.poll(() => calloutOverlaps(page), { message: `${slug} callout placement` }).toEqual([]);
    });
  }

  for (const mode of MODES) {
    test.describe(`axe, ${mode} mode`, () => {
      test.beforeEach(async ({ page }) => {
        await seedColorMode(page, mode);
      });
      for (const slug of Object.keys(SLUGS)) {
        for (const pass of ['tokens', 'final'] as const) {
          test(`${slug}: ${pass} pass has no axe violations`, async ({ page }) => {
            await page.setViewportSize({ width: 1440, height: 900 });
            await gotoPass(page, slug, pass);
            await expect(page.locator('html')).toHaveAttribute('data-mode', mode);
            expect(await passesAxe(page)).toEqual([]);
          });
        }
      }
    });
  }
});
