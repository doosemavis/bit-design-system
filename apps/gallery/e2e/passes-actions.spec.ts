import { expect, test } from '@playwright/test';
import { MODES, seedColorMode } from './mode';
import { calloutGaps, calloutOverlaps, expectLinesDrawn, gotoPass, loupeOverlaps, passesAxe, touchErrors } from './passes-helpers';

/** The Actions group: each slug with every anatomy part, seen and unseen, listed as a callout. */
const SLUGS = [
  { slug: 'iconbutton', parts: ['Edge', 'Face', 'Size', 'Shadow'] },
  { slug: 'menu', parts: ['Edge', 'Face', 'Title', 'List', 'Item', 'Danger item'] },
];

test.describe('Passes: Actions', () => {
  for (const { slug, parts } of SLUGS) {
    test(`${slug}: Tokens at 1440px lists every part and every line touches`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await gotoPass(page, slug, 'tokens');
      const listed = await page.locator('[role="listitem"][data-part]').evaluateAll((els) => els.map((el) => el.getAttribute('data-part')));
      expect([...listed].sort()).toEqual([...parts].sort());
      await expectLinesDrawn(page);
      await expect.poll(() => touchErrors(page), { message: `${slug} touch rule` }).toEqual([]);
      await expect.poll(() => calloutGaps(page), { message: `${slug} callout ends` }).toEqual([]);
      await expect.poll(() => loupeOverlaps(page), { message: `${slug} loupe placement` }).toEqual([]);
      await expect.poll(() => calloutOverlaps(page), { message: `${slug} callout placement` }).toEqual([]);
    });
  }

  for (const mode of MODES) {
    for (const { slug } of SLUGS) {
      for (const pass of ['tokens', 'final'] as const) {
        test(`${slug}: ${pass} pass has no axe violations, ${mode} mode`, async ({ page }) => {
          await seedColorMode(page, mode);
          await gotoPass(page, slug, pass);
          await expect(page.locator('html')).toHaveAttribute('data-mode', mode);
          expect(await passesAxe(page)).toEqual([]);
        });
      }
    }
  }
});
