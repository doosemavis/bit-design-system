import { expect, test } from '@playwright/test';
import { MODES, seedColorMode } from './mode';
import { calloutGaps, calloutOverlaps, expectLinesDrawn, gotoPass, loupeOverlaps, passesAxe, touchErrors } from './passes-helpers';

/** The Feedback group: each slug and the anatomy parts its Tokens pass lists as callouts. */
const GROUP: Record<string, string[]> = {
  alert: ['Edge', 'Fill', 'Shadow', 'Title', 'Message'],
  avatar: ['Edge', 'Face', 'Initials', 'Size', 'Shadow'],
  badge: ['Edge', 'Face', 'Label', 'Shadow'],
  dialog: ['Edge', 'Surface', 'Shadow', 'Title bar', 'Body', 'Footer'],
  spinner: ['Ring', 'Arc', 'Size'],
  tooltip: ['Bubble', 'Type', 'Corner'],
};

test.describe('Passes: Feedback', () => {
  test.use({ viewport: { width: 1440, height: 1000 } });

  for (const mode of MODES) {
    for (const [slug, parts] of Object.entries(GROUP)) {
      test(`${slug}: Tokens geometry, callouts and axe, then Final axe (${mode})`, async ({ page }) => {
        await seedColorMode(page, mode);
        // The Spinner arc rotates; reduced motion stops it so the Arc dot always sits on the arc.
        if (slug === 'spinner') await page.emulateMedia({ reducedMotion: 'reduce' });
        await gotoPass(page, slug, 'tokens');
        await expect(page.locator('html')).toHaveAttribute('data-mode', mode);

        const callouts = page.locator('[role="listitem"][data-part]');
        await expect.poll(async () => (await callouts.evaluateAll((els) => els.map((el) => el.getAttribute('data-part') ?? ''))).sort(), { timeout: 10_000 }).toEqual([...parts].sort());
        await expectLinesDrawn(page);
        await expect.poll(() => touchErrors(page), { timeout: 10_000 }).toEqual([]);
        await expect.poll(() => calloutGaps(page)).toEqual([]);
        await expect.poll(() => loupeOverlaps(page)).toEqual([]);
        await expect.poll(() => calloutOverlaps(page)).toEqual([]);
        expect(await passesAxe(page)).toEqual([]);

        await gotoPass(page, slug, 'final');
        expect(await passesAxe(page)).toEqual([]);
      });
    }
  }
});
