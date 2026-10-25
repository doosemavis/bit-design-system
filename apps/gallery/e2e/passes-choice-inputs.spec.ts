import { expect, test } from '@playwright/test';
import { MODES, seedColorMode } from './mode';
import { calloutGaps, calloutOverlaps, expectLinesDrawn, gotoPass, loupeOverlaps, passesAxe, touchErrors } from './passes-helpers';

/** The Choice inputs group: each slug with every anatomy part, as a callout label. */
const COMPONENTS: readonly { slug: string; parts: readonly string[] }[] = [
  { slug: 'checkbox', parts: ['Edge', 'Face', 'Shadow', 'Label'] },
  { slug: 'radiogroup', parts: ['Legend', 'Edge', 'Chosen', 'Face', 'Shadow', 'Label'] },
  { slug: 'segmentedcontrol', parts: ['Edge', 'Surface', 'Chosen', 'Divider', 'Size', 'Legend', 'Label', 'Shadow'] },
  { slug: 'select', parts: ['Edge', 'Face', 'Placeholder', 'Size', 'List', 'Option', 'Chosen option'] },
  { slug: 'slider', parts: ['Thumb', 'Thumb edge', 'Fill', 'Track edge', 'Track', 'Shadow'] },
  { slug: 'switch', parts: ['Edge', 'Thumb', 'Track', 'Label', 'Shadow'] },
];

test.describe('Passes: Choice inputs', () => {
  for (const mode of MODES) {
    test.describe(`${mode} mode`, () => {
      test.beforeEach(async ({ page }) => {
        await seedColorMode(page, mode);
        await page.setViewportSize({ width: 1440, height: 1000 });
      });

      for (const { slug, parts } of COMPONENTS) {
        test(`${slug}: Tokens lines touch, nothing overlaps, every part is a callout; axe on Tokens and Final`, async ({ page }) => {
          await gotoPass(page, slug, 'tokens');
          await expect(page.locator('html')).toHaveAttribute('data-mode', mode);
          const callouts = page.locator('[role="listitem"][data-part]');
          await expect(callouts).toHaveCount(parts.length);
          for (const label of parts) await expect(page.locator(`[role="listitem"][data-part="${label}"]`)).toHaveCount(1);
          await expectLinesDrawn(page);
          await expect.poll(() => touchErrors(page), { message: `${slug} touch rule` }).toEqual([]);
          await expect.poll(() => calloutGaps(page), { message: `${slug} callout ends` }).toEqual([]);
          await expect.poll(() => loupeOverlaps(page), { message: `${slug} loupe placement` }).toEqual([]);
          await expect.poll(() => calloutOverlaps(page), { message: `${slug} callout placement` }).toEqual([]);
          expect(await passesAxe(page), `${slug} Tokens axe`).toEqual([]);
          await gotoPass(page, slug, 'final');
          expect(await passesAxe(page), `${slug} Final axe`).toEqual([]);
        });
      }
    });
  }
});
