import { expect, test } from '@playwright/test';
import { calloutGaps, calloutOverlaps, expectLinesDrawn, gotoPass, loupeOverlaps, touchErrors } from './passes-helpers';
import type { PassValue } from './passes-helpers';

/** Every manifest with anatomy, spelled out (32 of the 33: the Logo is exempt). A new component page is added here. */
const SLUGS = [
  'alert', 'avatar', 'badge', 'bittheme', 'box', 'button', 'card', 'checkbox', 'code', 'codeblock', 'dialog',
  'field', 'heading', 'icon', 'iconbutton', 'input', 'link', 'menu', 'modetoggle', 'navbar', 'radiogroup',
  'segmentedcontrol', 'select', 'slider', 'spinner', 'stack', 'switch', 'table', 'tabs', 'text', 'textarea', 'tooltip',
];

const NO_JUMP: readonly PassValue[] = ['wireframe', 'tokens', 'states'];

test.describe('Passes: every page at 1024px, light mode', () => {
  test.use({ viewport: { width: 1024, height: 900 } });

  for (const slug of SLUGS) {
    test(`${slug}: Tokens lines touch, nothing overlaps, and the stage keeps its height across passes`, async ({ page }) => {
      // The spinner's arc rotates; reduced motion keeps its dot on the arc.
      if (slug === 'spinner') await page.emulateMedia({ reducedMotion: 'reduce' });

      const tokens = await gotoPass(page, slug, 'tokens');
      await expectLinesDrawn(page);
      await expect.poll(() => touchErrors(page), { message: `${slug} touch rule` }).toEqual([]);
      await expect.poll(() => calloutGaps(page), { message: `${slug} callout ends` }).toEqual([]);
      await expect.poll(() => loupeOverlaps(page), { message: `${slug} loupe placement` }).toEqual([]);
      await expect.poll(() => calloutOverlaps(page), { message: `${slug} callout placement` }).toEqual([]);
      const height = (await tokens.boundingBox())?.height ?? 0;
      expect(height, `${slug} Tokens stage height`).toBeGreaterThan(0);

      for (const pass of NO_JUMP.filter((p) => p !== 'tokens')) {
        const stage = await gotoPass(page, slug, pass);
        await expect
          .poll(async () => Math.abs(((await stage.boundingBox())?.height ?? 0) - height) <= 1, { message: `${slug} ${pass} stage height vs Tokens ${height}px` })
          .toBe(true);
      }
    });
  }
});
