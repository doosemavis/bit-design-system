import { expect, test } from '@playwright/test';
import { MODES, seedColorMode } from './mode';
import { calloutGaps, calloutOverlaps, gotoPass, loupeOverlaps, passesAxe, touchErrors } from './passes-helpers';

/** The Navigation group's Passes: each slug with its anatomy parts, as the manifests list them. */
const SLUGS: Record<string, readonly string[]> = {
  link: ['Color', 'Weight'],
  navbar: ['Edge', 'Pill edge', 'Pill face', 'Face', 'Current link', 'Action', 'Height', 'Brand', 'Shadow'],
  tabs: ['Panel edge', 'Tab edge', 'Panel face', 'Tab face', 'Power', 'Slot', 'Shadow'],
};

test.describe('Passes: Navigation', () => {
  for (const mode of MODES) {
    for (const [slug, parts] of Object.entries(SLUGS)) {
      test(`${slug}, ${mode}: Tokens touches, lists every part, and passes axe; Final passes axe`, async ({ page }) => {
        await seedColorMode(page, mode);
        await page.setViewportSize({ width: 1440, height: 1000 });
        await gotoPass(page, slug, 'tokens');
        await expect(page.locator('html')).toHaveAttribute('data-mode', mode);
        for (const part of parts) await expect(page.locator(`[role="listitem"][data-part="${part}"]`)).toBeVisible({ timeout: 10_000 });
        await expect(page.locator('[role="listitem"][data-part]')).toHaveCount(parts.length);
        await expect.poll(() => touchErrors(page), { message: 'touch rule' }).toEqual([]);
        await expect.poll(() => calloutGaps(page), { message: 'callout ends' }).toEqual([]);
        await expect.poll(() => loupeOverlaps(page), { message: 'loupe placement' }).toEqual([]);
        await expect.poll(() => calloutOverlaps(page), { message: 'callout placement' }).toEqual([]);
        expect(await passesAxe(page)).toEqual([]);

        await gotoPass(page, slug, 'final');
        expect(await passesAxe(page)).toEqual([]);
      });
    }
  }
});
