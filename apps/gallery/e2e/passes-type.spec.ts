import { expect, test } from '@playwright/test';
import { MODES, seedColorMode } from './mode';
import { calloutGaps, calloutOverlaps, gotoPass, loupeOverlaps, passesAxe, touchErrors } from './passes-helpers';

/** The Type group's slugs and their anatomy parts, as the callouts list them. */
const SLUGS: Record<string, string[]> = {
  code: ['Pill', 'Text color', 'Font', 'Size'],
  codeblock: ['Panel', 'Edge', 'Bar rule', 'Shadow', 'Language label', 'Code size', 'Code text', 'Copy button', 'Syntax'],
  heading: ['Color', 'Face', 'Size', 'Line height'],
  text: ['Color', 'Face', 'Size', 'Line height'],
};

test.describe('Passes: Type', () => {
  for (const mode of MODES) {
    test.describe(`${mode} mode`, () => {
      test.beforeEach(async ({ page }) => {
        await seedColorMode(page, mode);
        await page.setViewportSize({ width: 1440, height: 1000 });
      });

      for (const [slug, parts] of Object.entries(SLUGS)) {
        test(`${slug}: Tokens lines touch, callouts list every part, axe passes on Tokens and Final`, async ({ page }) => {
          await gotoPass(page, slug, 'tokens');
          await expect(page.locator('html')).toHaveAttribute('data-mode', mode);
          await expect(page.locator('[data-role="line"]')).toHaveCount(parts.length);
          const listed = await page.locator('[role="listitem"][data-part]').evaluateAll((items) => items.map((item) => item.getAttribute('data-part')));
          expect([...listed].sort()).toEqual([...parts].sort());
          await expect.poll(() => touchErrors(page), { message: 'touch rule' }).toEqual([]);
          await expect.poll(() => calloutGaps(page), { message: 'callout ends' }).toEqual([]);
          await expect.poll(() => loupeOverlaps(page), { message: 'loupe placement' }).toEqual([]);
          await expect.poll(() => calloutOverlaps(page), { message: 'callout placement' }).toEqual([]);
          expect(await passesAxe(page)).toEqual([]);

          await gotoPass(page, slug, 'final');
          expect(await passesAxe(page)).toEqual([]);
        });
      }
    });
  }
});
