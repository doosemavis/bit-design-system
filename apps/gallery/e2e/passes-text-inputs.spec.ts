import { expect, test } from '@playwright/test';
import { MODES, seedColorMode } from './mode';
import { calloutGaps, calloutOverlaps, gotoPass, loupeOverlaps, passesAxe, touchErrors } from './passes-helpers';

/** The Text inputs group: each slug with its anatomy parts, as the callouts list them. */
const SLUGS = [
  { slug: 'field', parts: ['Label', 'Gap', 'Hint', 'Error'] },
  { slug: 'input', parts: ['Edge', 'Face', 'Size'] },
  { slug: 'textarea', parts: ['Edge', 'Face', 'Count'] },
] as const;

test.describe('Passes: Text inputs', () => {
  for (const mode of MODES) {
    test.describe(`${mode} mode`, () => {
      test.beforeEach(async ({ page }) => {
        await seedColorMode(page, mode);
        await page.setViewportSize({ width: 1440, height: 1000 });
      });

      for (const { slug, parts } of SLUGS) {
        test(`${slug}: Tokens lines touch, callouts clear, every part listed, axe clean on Tokens and Final`, async ({ page }) => {
          await gotoPass(page, slug, 'tokens');
          await expect(page.locator('html')).toHaveAttribute('data-mode', mode);
          await expect(page.locator('[data-role="line"]')).toHaveCount(parts.length);
          await expect.poll(() => touchErrors(page), { message: `${slug} touch rule` }).toEqual([]);
          await expect.poll(() => calloutGaps(page), { message: `${slug} callout ends` }).toEqual([]);
          await expect.poll(() => loupeOverlaps(page), { message: `${slug} loupe` }).toEqual([]);
          await expect.poll(() => calloutOverlaps(page), { message: `${slug} callouts` }).toEqual([]);
          for (const part of parts) await expect(page.locator(`[role="listitem"][data-part="${part}"]`)).toBeVisible();
          expect(await passesAxe(page), `${slug} Tokens axe`).toEqual([]);

          await gotoPass(page, slug, 'final');
          expect(await passesAxe(page), `${slug} Final axe`).toEqual([]);
        });
      }
    });
  }
});
