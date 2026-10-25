import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { MODES, seedColorMode } from './mode';
import {
  calloutGaps,
  calloutOverlaps,
  gotoPass,
  loupeOverlaps,
  PASS_NAMES,
  passesAxe,
  passStage,
  passUrl,
  touchErrors,
} from './passes-helpers';
import type { PassValue } from './passes-helpers';

const SLUG = 'button';
/** Button's parts in tab order: the left column (Face, Size), then the right (Edge, Shadow). */
const PARTS = ['Face', 'Size', 'Edge', 'Shadow'];
const stage = (page: Page, pass: PassValue) => passStage(page, pass);
const callout = (page: Page, label: string) => page.locator(`[role="listitem"][data-part="${label}"]`);
/** Clicks a pass segment: the radio sits under its label, as in every bit SegmentedControl. */
const pickPass = (page: Page, name: string) => page.locator('.gallery-passes__controls').getByText(name, { exact: true }).click();
const focusedPart = (page: Page) => page.evaluate(() => document.activeElement?.getAttribute('data-part') ?? document.activeElement?.className ?? '');
const frames = (page: Page, n: number) =>
  page.evaluate(
    (count) =>
      new Promise<void>((done) => {
        const step = (left: number) => (left === 0 ? done() : requestAnimationFrame(() => step(left - 1)));
        step(count);
      }),
    n,
  );

test.describe('Passes on the Button page', () => {
  for (const [value, name] of Object.entries(PASS_NAMES) as [PassValue, string][]) {
    test(`?pass=${value} loads the ${name} pass`, async ({ page }) => {
      await page.goto(passUrl(SLUG, value));
      await expect(stage(page, value)).toBeVisible();
    });
  }

  test('?pass=xray lands on Wireframe with the key gone', async ({ page }) => {
    await page.goto('#/components/button?pass=xray');
    await expect(stage(page, 'wireframe')).toBeVisible();
    await expect(page).toHaveURL(/#\/components\/button$/);
  });

  test('Back and Forward step through passes; a Playground control keeps the pass', async ({ page }) => {
    await page.goto('#/components/button');
    await pickPass(page, 'Tokens');
    await expect(stage(page, 'tokens')).toBeVisible();
    await page.getByRole('button', { name: 'Next: States' }).click();
    await expect(stage(page, 'states')).toBeVisible();
    await page.goBack();
    await expect(stage(page, 'tokens')).toBeVisible();
    await page.goForward();
    await expect(stage(page, 'states')).toBeVisible();
    // The variant control is a bit Select (a combobox with a listbox), not a radio group.
    const variant = page.getByRole('region', { name: 'Controls' }).getByRole('combobox', { name: 'variant', exact: true });
    await variant.click();
    await page.locator(`[id="${await variant.getAttribute('aria-controls')}"]`).getByRole('option', { name: 'outline' }).click();
    await expect(page).toHaveURL(/variant=outline&pass=states/);
  });

  test('keyboard only: the pass control, Play, Next, then the stage in its tab order; the focus ring always shows', async ({ page }) => {
    await page.goto('#/components/button');
    await expect(stage(page, 'wireframe')).toBeVisible();
    // The ring the eye sees: a segment's radio is visually hidden, so reset.css draws the ring on its label.
    const ring = () =>
      page.evaluate(() => {
        const active = document.activeElement!;
        const drawn = active.matches('.bit-segmented-control__input') ? active.nextElementSibling : active;
        if (!drawn || (drawn !== active && !drawn.matches('.bit-segmented-control__label'))) return 'no label';
        const style = getComputedStyle(drawn);
        return `${style.outlineStyle} ${style.outlineWidth}`;
      });
    const inStage = () =>
      page.evaluate(() => {
        const active = document.activeElement;
        return { instance: !!active?.closest('[data-instance]'), diagram: !!active?.closest('svg, [data-role="loupe"]') };
      });
    const onPassRadio = () => page.evaluate(() => document.activeElement?.matches('input[name="pass"]') ?? false);
    for (let tabs = 0; tabs < 100 && !(await onPassRadio()); tabs += 1) await page.keyboard.press('Tab');
    await expect(page.getByRole('radio', { name: 'Wireframe' })).toBeFocused();
    expect(await ring()).toMatch(/^solid [1-9]/);
    await page.keyboard.press('ArrowRight');
    await expect(stage(page, 'tokens')).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Tokens' })).toBeFocused();
    expect(await ring()).toMatch(/^solid [1-9]/);
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Play' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Next: States' })).toBeFocused();
    expect(await ring()).toMatch(/^solid [1-9]/);

    // Tokens: after Next, each landed callout in turn; never the diagram or the instance.
    await expect(callout(page, 'Shadow')).toBeVisible({ timeout: 10_000 });
    const reached: string[] = [];
    for (let i = 0; i < PARTS.length; i += 1) {
      await page.keyboard.press('Tab');
      expect(await inStage()).toEqual({ instance: false, diagram: false });
      reached.push(await focusedPart(page));
      expect(await ring()).toMatch(/^solid [1-9]/);
    }
    expect(reached).toEqual(PARTS);

    // States: the chip group, then whatever follows the stage, not the instance.
    await page.getByRole('button', { name: 'Next: States' }).focus();
    await page.keyboard.press('Enter');
    await expect(stage(page, 'states')).toBeVisible();
    await expect(page.getByRole('status')).toHaveText('States, pass 3 of 4');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('radio', { name: 'Default' })).toBeFocused();
    expect(await ring()).toMatch(/^solid [1-9]/);
    await page.keyboard.press('Tab');
    expect(await inStage()).toEqual({ instance: false, diagram: false });

    // Try it makes the instance live: it comes right after the chip group.
    await page.getByRole('radio', { name: 'Default' }).focus();
    for (let i = 0; i < 3; i += 1) await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('radio', { name: 'Try it' })).toBeChecked();
    await expect(page.getByText('Point at it, press it, or Tab to it')).toBeVisible();
    await page.keyboard.press('Tab');
    expect(await inStage()).toEqual({ instance: true, diagram: false });
    expect(await ring()).toMatch(/^solid [1-9]/);
  });

  test('lines touch: each dot on its painted pixels, each line on its callout, the loupe clear, at 1440px and 1024px', async ({ page }) => {
    for (const width of [1440, 1024]) {
      await page.setViewportSize({ width, height: 900 });
      await gotoPass(page, SLUG, 'tokens');
      await expect(page.locator('[data-role="line"]')).toHaveCount(PARTS.length);
      // Poll: after a resize the stage re-measures on the next frame, so the paths briefly lag the new layout.
      await expect.poll(() => touchErrors(page), { message: `touch rule at ${width}px` }).toEqual([]);
      await expect.poll(() => calloutGaps(page), { message: `callout ends at ${width}px` }).toEqual([]);
      await expect.poll(() => loupeOverlaps(page), { message: `loupe placement at ${width}px` }).toEqual([]);
      await expect.poll(() => calloutOverlaps(page), { message: `callout placement at ${width}px` }).toEqual([]);
    }
  });

  test('Play runs the whole build and ends on Final, in its scene', async ({ page }) => {
    await gotoPass(page, SLUG, 'wireframe');
    await page.getByRole('button', { name: 'Play' }).click();
    await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible();
    await expect(page).toHaveURL(/\?pass=final$/, { timeout: 25_000 });
    await expect(page.locator('[data-scene-slot] [data-instance] .bit-button')).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Play' })).toBeVisible();
  });

  test('Stop replaces the URL with the pass it stopped on, adding no history entry', async ({ page }) => {
    await gotoPass(page, SLUG, 'wireframe');
    const before = await page.evaluate(() => history.length);
    await page.getByRole('button', { name: 'Play' }).click();
    await expect(stage(page, 'tokens')).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Stop' }).click();
    await expect(page.getByRole('button', { name: 'Play' })).toBeVisible();
    const label = await page.locator('.gallery-passes__stage').getAttribute('aria-label');
    const shown = (label ?? '').split(' pass:')[0]!.toLowerCase();
    await expect(page).toHaveURL(new RegExp(`\\?pass=${shown}$`));
    expect(await page.evaluate(() => history.length)).toBe(before);
  });

  test('pointing at and focusing the Shadow callout lights its strip and shows the loupe', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoPass(page, SLUG, 'tokens');
    const strip = page.locator('[data-role="highlight"][data-kind="strip"]');
    await expect(page.locator('[data-role="line"]')).toHaveCount(PARTS.length);
    await expect(strip).toHaveCount(0);
    await callout(page, 'Shadow').hover();
    await expect(strip).toHaveCount(1);
    await expect(page.locator('[data-role="loupe"]')).toHaveCount(1);
    await expect(page.locator('[data-role="line"][data-part="Edge"]')).toHaveAttribute('stroke-opacity', '0.3');
    await page.mouse.move(0, 0);
    await expect(strip).toHaveCount(0);
    await callout(page, 'Shadow').focus();
    await expect(strip).toHaveCount(1);
    await expect(page.locator('[data-role="loupe"]')).toHaveCount(1);
  });

  test('at 640px (200% of 1280) the stage stacks: no lines, highlights or loupe, every part listed', async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 900 });
    await gotoPass(page, SLUG, 'tokens');
    await expect(page.locator('.gallery-passes__stage[data-stacked]')).toBeVisible();
    await expect(page.locator('[data-role="line"]')).toHaveCount(0);
    await expect(page.locator('[data-role="highlight"]')).toHaveCount(0);
    await expect(page.locator('[data-role="loupe"]')).toHaveCount(0);
    for (const label of PARTS) await expect(callout(page, label)).toBeVisible();
    expect(await calloutOverlaps(page)).toEqual([]);
  });

  test('narrowing past 600px on Tokens leaves nothing stale, and widening brings the lines back', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoPass(page, SLUG, 'tokens');
    await expect(page.locator('[data-role="line"]')).toHaveCount(PARTS.length);
    await page.setViewportSize({ width: 640, height: 900 });
    await expect(page.locator('.gallery-passes__stage[data-stacked]')).toBeVisible();
    await expect(page.locator('[data-role="line"], [data-role="highlight"], [data-role="loupe"]')).toHaveCount(0);
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.locator('[data-role="line"]')).toHaveCount(PARTS.length);
    await expect.poll(() => touchErrors(page)).toEqual([]);
  });

  test('no layout jump: the stage keeps one height across Wireframe, Tokens and States', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const heights: number[] = [];
    for (const value of ['wireframe', 'tokens', 'states'] as const) {
      const named = await gotoPass(page, SLUG, value);
      await frames(page, 3);
      const size = await named.evaluate((el) => ({ height: el.getBoundingClientRect().height, overflows: el.scrollHeight > el.clientHeight + 0.5 }));
      expect(size.overflows, `${value} stage overflows`).toBe(false);
      heights.push(size.height);
    }
    expect(new Set(heights).size, `heights ${heights.join(', ')}`).toBe(1);
  });

  test('reduced motion: the first frame that shows Tokens shows its end state, with nothing animating', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoPass(page, SLUG, 'wireframe');
    await frames(page, 3);
    // Watch every frame from the click on, and keep the first one whose stage says Tokens (the URL change renders
    // through the router's transition, so that frame can come a few after the click).
    const first = page.evaluate(
      () =>
        new Promise<Record<string, number>>((done) => {
          const look = () => {
            const stage = document.querySelector('.gallery-passes__stage');
            if (!stage?.getAttribute('aria-label')?.startsWith('Tokens pass')) {
              requestAnimationFrame(look);
              return;
            }
            const lines = [...document.querySelectorAll<SVGPathElement>('[data-role="line"]')];
            done({
              lines: lines.length,
              dashed: lines.filter((p) => p.style.strokeDasharray !== '').length,
              shown: [...document.querySelectorAll<HTMLElement>('[role="listitem"][data-part]')].filter((c) => getComputedStyle(c).visibility !== 'hidden').length,
              animations: document.getAnimations().filter((a) => a.playState === 'running').length,
              outline: document.querySelectorAll('[data-role="outline"]').length,
            });
          };
          requestAnimationFrame(look);
        }),
    );
    await pickPass(page, 'Tokens');
    expect(await first).toEqual({ lines: PARTS.length, dashed: 0, shown: PARTS.length, animations: 0, outline: 0 });
    expect(await touchErrors(page)).toEqual([]);
  });

  test('the wireframe outline fades as the edge lands, and the graph paper fades out for Final; then both are gone', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    /** Picks a pass, and reports what is mounted in the first frame that shows it. */
    const firstFrameOf = async (name: string, selector: string) => {
      const seen = page.evaluate(
        ([pass, css]) =>
          new Promise<number>((done) => {
            const look = () => {
              const label = document.querySelector('.gallery-passes__stage')?.getAttribute('aria-label') ?? '';
              if (label.startsWith(`${pass} pass`)) done(document.querySelectorAll(css).length);
              else requestAnimationFrame(look);
            };
            requestAnimationFrame(look);
          }),
        [name, selector] as const,
      );
      await pickPass(page, name);
      return seen;
    };
    await gotoPass(page, SLUG, 'wireframe');
    await expect(page.locator('[data-role="outline"]')).toHaveCount(1);
    expect(await firstFrameOf('Tokens', '[data-role="outline"]'), 'the outline is still there as Tokens starts').toBe(1);
    await expect(page.locator('[data-role="outline"]')).toHaveCount(0, { timeout: 3_000 });
    await gotoPass(page, SLUG, 'states');
    await expect(page.locator('[data-layer="paper"]')).toHaveCount(1);
    expect(await firstFrameOf('Final', '[data-layer="paper"]'), 'the paper is still there as Final starts').toBe(1);
    await expect(page.locator('[data-layer="paper"]')).toHaveCount(0, { timeout: 3_000 });
  });

  test('the ink sits above the loupe, and both above anything the instance stacks (a Tabs list sets z-index: 1)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoPass(page, SLUG, 'tokens');
    await expect(page.locator('[data-role="loupe"]')).toHaveCount(1);
    const layers = await page.evaluate(() => {
      const z = (el: Element | null) => Number.parseInt(el ? getComputedStyle(el).zIndex : '', 10) || 0;
      const stage = document.querySelector('.gallery-passes__stage')!;
      const inside = [...stage.querySelectorAll('.gallery-passes__slot *')].map(z);
      return { ink: z(stage.querySelector('svg[data-layer="ink"]')), lens: z(stage.querySelector('[data-lens]')), instance: Math.max(1, ...inside) };
    });
    expect(layers.lens).toBeGreaterThan(layers.instance);
    expect(layers.ink).toBeGreaterThan(layers.lens);
  });

  test('review focus 1: a resize and a mode switch mid-Tokens still leave every dot on its part', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoPass(page, SLUG, 'wireframe');
    await pickPass(page, 'Tokens');
    await expect(page.locator('[data-role="line"]')).toHaveCount(1);
    await page.setViewportSize({ width: 1100, height: 900 });
    await expect(page.locator('[data-role="line"]')).toHaveCount(2, { timeout: 5_000 });
    await page.getByRole('group', { name: 'Color mode' }).first().getByRole('button', { name: 'Dark' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'dark');
    await expect(page.locator('[data-role="line"]')).toHaveCount(PARTS.length, { timeout: 10_000 });
    await expect.poll(() => touchErrors(page), { timeout: 10_000 }).toEqual([]);
    await expect.poll(() => calloutGaps(page)).toEqual([]);
  });
});

for (const mode of MODES) {
  test.describe(`Passes axe, ${mode} mode`, () => {
    test.beforeEach(async ({ page }) => {
      await seedColorMode(page, mode);
    });
    for (const [value, name] of Object.entries(PASS_NAMES) as [PassValue, string][]) {
      test(`${name} pass has no axe violations`, async ({ page }) => {
        await gotoPass(page, SLUG, value);
        await expect(page.locator('html')).toHaveAttribute('data-mode', mode);
        expect(await passesAxe(page)).toEqual([]);
      });
    }
  });
}
