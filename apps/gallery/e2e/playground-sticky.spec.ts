import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

/** Scrolls the last control into view, as when editing far down a long list, and reads where things land. */
async function editLastControl(page: Page) {
  return page.evaluate(() => {
    const controls = document.querySelectorAll('.gallery-controls__grid > *');
    controls[controls.length - 1]!.scrollIntoView({ block: 'end', behavior: 'instant' });
    const box = (selector: string) => document.querySelector(selector)!.getBoundingClientRect();
    return {
      header: box('.gallery-header').bottom,
      preview: box('.gallery-preview'),
      stage: box('.gallery-preview__stage'),
      live: box('.gallery-preview__stage > *'),
      viewport: innerHeight,
    };
  });
}

/** True when every preset chip lies wholly inside the presets row: none is cut off at an edge. */
function presetsAllShow(page: Page) {
  return page.locator('.gallery-presets').evaluate((row) => {
    const edge = row.getBoundingClientRect();
    return [...row.children].every((chip) => {
      const box = chip.getBoundingClientRect();
      return box.left >= edge.left && box.right <= edge.right;
    });
  });
}

test.describe('the Slider playground keeps the live component in view while a control changes', () => {
  test('desktop: the component sits at the top of the stage, which sticks under the header', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('#/components/slider');
    await expect(page.getByRole('heading', { level: 1, name: 'Slider' })).toBeVisible();
    const at = await editLastControl(page);
    // At the top of the stage, past its padding, not centered on the controls column's height.
    expect(at.live.top - at.stage.top).toBeLessThanOrEqual(48);
    expect(at.live.top).toBeGreaterThanOrEqual(at.header);
    expect(at.live.bottom).toBeLessThanOrEqual(at.viewport);
  });

  test('phone: the preview sticks under the header at no more than 40% of the window, over the controls', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('#/components/slider');
    await expect(page.getByRole('heading', { level: 1, name: 'Slider' })).toBeVisible();
    const at = await editLastControl(page);
    expect(Math.round(at.preview.top)).toBe(Math.round(at.header));
    expect(at.preview.height).toBeLessThanOrEqual(at.viewport * 0.4 + 1);
    expect(at.live.top).toBeGreaterThanOrEqual(at.header);
    expect(at.live.bottom).toBeLessThanOrEqual(at.preview.bottom);
    // The Checkerboard switch and every preset stay reachable in the stuck preview.
    // The Switch's input is visually hidden; its label is what a finger hits.
    await expect(page.locator('.gallery-preview__bar label.bit-switch')).toBeInViewport({ ratio: 1 });
    expect(await presetsAllShow(page)).toBe(true);
  });
});

for (const width of [390, 1200, 1280, 1440]) {
  test(`at ${width}px no Field preset is cut off at the row's edge`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('#/components/field');
    await expect(page.getByRole('heading', { level: 1, name: 'Field' })).toBeVisible();
    expect(await presetsAllShow(page)).toBe(true);
  });
}
