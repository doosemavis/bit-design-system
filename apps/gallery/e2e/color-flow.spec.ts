import { expect, test } from '@playwright/test';

// Unit tests can't see this: under jsdom the theme's `?raw` import is empty, so only the built page proves the
// color flow reads the real theme. It must draw every color token, and its accent must follow the mode.
for (const [mode, accent] of [
  ['light', 'violet'],
  ['dark', 'yellow'],
] as const) {
  test(`Tokens: the color flow draws the real theme in ${mode} mode, accent from ${accent}`, async ({ page }) => {
    await page.addInitScript((m) => localStorage.setItem('bit-color-mode', m), mode);
    await page.goto('#/tokens');
    const flow = page.getByRole('group', { name: 'Where every color goes' });
    await expect(flow.getByRole('group', { name: `Which palette color feeds each color token, ${mode} mode` })).toBeVisible();
    // Every drawn token is a Copy chip.
    expect(await flow.getByRole('button', { name: /^Copy --bit-/ }).count()).toBe(await flow.locator('[data-flow]').count());
    expect(await flow.locator('[data-flow]').count()).toBeGreaterThan(30);
    const lit = await flow.locator('[data-accent]').evaluateAll((bands) => bands.map((band) => band.getAttribute('data-flow')));
    expect(lit).toContain(`${accent} → --bit-color-accent`);
    await expect(flow).toContainText(`The bright flows come from ${accent}`);
  });
}
