import { expect, test } from '@playwright/test';
import { MODES, seedColorMode } from './mode';
import { calloutGaps, calloutOverlaps, gotoPass, loupeOverlaps, passesAxe, touchErrors } from './passes-helpers';

/** The Theming and Brand groups' Passes: each slug with its anatomy parts as callouts. Logo is passesExempt. */
const SLUGS: Record<string, string[]> = {
  bittheme: ['Page color', 'Text color'],
  icon: ['Glyph', 'Size (16/20/24px scale)'],
  modetoggle: ['Size', 'Pressed', 'Label', 'Edge', 'Surface', 'Shadow'],
};

for (const mode of MODES) {
  test.describe(`Passes: Theming and Brand, ${mode} mode`, () => {
    test.beforeEach(async ({ page }) => {
      await seedColorMode(page, mode);
      await page.setViewportSize({ width: 1440, height: 1000 });
    });

    for (const [slug, parts] of Object.entries(SLUGS)) {
      test(`${slug}: Tokens lines touch and callouts are clear, every part listed; axe passes`, async ({ page }) => {
        await gotoPass(page, slug, 'tokens');
        await expect(page.locator('html')).toHaveAttribute('data-mode', mode);
        await expect(page.locator('[data-role="line"]')).toHaveCount(parts.length, { timeout: 10_000 });
        for (const label of parts) await expect(page.locator(`[role="listitem"][data-part="${label}"]`)).toHaveCount(1);
        await expect.poll(() => touchErrors(page), { message: `${slug} touch rule` }).toEqual([]);
        await expect.poll(() => calloutGaps(page), { message: `${slug} callout ends` }).toEqual([]);
        await expect.poll(() => loupeOverlaps(page), { message: `${slug} loupe placement` }).toEqual([]);
        await expect.poll(() => calloutOverlaps(page), { message: `${slug} callout placement` }).toEqual([]);
        expect(await passesAxe(page)).toEqual([]);
      });

      test(`${slug}: Final loads with no page error; axe passes`, async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await gotoPass(page, slug, 'final');
        await expect(page.locator('[data-scene-slot] [data-instance]')).toHaveCount(1);
        expect(await passesAxe(page)).toEqual([]);
        expect(errors).toEqual([]);
      });
    }
  });
}

test.describe('Passes: Theming and Brand', () => {
  test('Logo is passesExempt: its page has no Passes section', async ({ page }) => {
    await page.goto('#/brand/logo');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('group', { name: /pass: / })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Passes', exact: true })).toHaveCount(0);
  });
});
