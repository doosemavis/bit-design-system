import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * The Architecture page's layout rules, measured. Each was found by eye in a design review (2026-10-16) and fixed;
 * these keep them fixed. Everything is compared within 1px, the rounding a browser may apply.
 */

interface Box {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
  readonly bottom: number;
}

const near = (a: number, b: number) => Math.abs(a - b) <= 1;
const centerX = (box: Box) => box.left + box.width / 2;

async function boxes(page: Page, selector: string): Promise<Box[]> {
  return page.locator(selector).evaluateAll((elements) =>
    elements.map((element) => {
      const r = element.getBoundingClientRect();
      return { left: r.left, top: r.top, width: r.width, height: r.height, bottom: r.bottom };
    }),
  );
}

/** Each connector with the boxes just above and below it (its pipe's siblings). */
async function connectorGaps(page: Page) {
  return page.locator('.gallery-arch-pipe').evaluateAll((pipes) =>
    pipes.map((pipe) => {
      const line = pipe.querySelector('.gallery-arch-pipe__line')!.getBoundingClientRect();
      return {
        top: line.top,
        bottom: line.bottom,
        above: pipe.previousElementSibling?.getBoundingClientRect().bottom ?? NaN,
        below: pipe.nextElementSibling?.getBoundingClientRect().top ?? NaN,
      };
    }),
  );
}

for (const [name, width] of [
  ['desktop', 1440],
  ['phone', 390],
] as const) {
  test.describe(`Architecture layout, ${name} (${width}px)`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('#/architecture');
      await expect(page.getByRole('heading', { level: 1, name: 'Architecture' })).toBeVisible();
    });

    test('every connector runs down one spine, centered on the level icons, and all are the same height', async ({ page }) => {
      const lines = await boxes(page, '.gallery-arch-pipe__line');
      const icons = await boxes(page, '.gallery-arch-level__icon');
      expect(lines).toHaveLength(4);
      expect(icons).toHaveLength(5);
      const spine = centerX(icons[0]!);
      for (const icon of icons) expect(near(centerX(icon), spine), `icon at ${centerX(icon)}, spine at ${spine}`).toBe(true);
      for (const line of lines) expect(near(centerX(line), spine), `connector at ${centerX(line)}, spine at ${spine}`).toBe(true);
      for (const line of lines) expect(near(line.height, lines[0]!.height)).toBe(true);
    });

    test('every connector touches the box above it and the box below it', async ({ page }) => {
      for (const gap of await connectorGaps(page)) {
        expect(near(gap.top, gap.above), `connector top ${gap.top}, box above ends ${gap.above}`).toBe(true);
        expect(near(gap.bottom, gap.below), `connector bottom ${gap.bottom}, box below starts ${gap.below}`).toBe(true);
      }
    });

    test('the scoreboard: each row of counts is one height, and every label sits on one line', async ({ page }) => {
      const scores = await boxes(page, '.gallery-arch-scoreboard__scores > li');
      expect(scores).toHaveLength(4);
      const rows = new Map<number, Box[]>();
      for (const score of scores) rows.set(Math.round(score.top), [...(rows.get(Math.round(score.top)) ?? []), score]);
      for (const row of rows.values()) for (const score of row) expect(near(score.height, row[0]!.height)).toBe(true);
      const labels = await boxes(page, '.gallery-arch-scoreboard__scores .gallery-arch-label');
      // A 12px pixel caption is about 18px tall on one line; a wrapped one is twice that.
      for (const label of labels) expect(label.height).toBeLessThan(24);
    });

    test('the palette: every swatch tile is the same size', async ({ page }) => {
      const tiles = await boxes(page, '.gallery-arch-tile');
      expect(tiles).toHaveLength(5);
      for (const tile of tiles) {
        expect(near(tile.width, tiles[0]!.width)).toBe(true);
        expect(near(tile.height, tiles[0]!.height)).toBe(true);
      }
    });

    test('the not-built box has one dashed border: its header draws only its divider', async ({ page }) => {
      const sides = await page.locator('[data-zone="future"] > .bit-card__header').evaluate((header) => {
        const style = getComputedStyle(header);
        return [style.borderTopWidth, style.borderLeftWidth, style.borderRightWidth, style.borderBottomStyle];
      });
      expect(sides).toEqual(['0px', '0px', '0px', 'dashed']);
    });

    if (name === 'desktop') {
      test('every level’s specimen starts on one line', async ({ page }) => {
        const specimens = await boxes(page, '.gallery-arch-level__specimen');
        expect(specimens).toHaveLength(5);
        for (const specimen of specimens) expect(near(specimen.left, specimens[0]!.left), `specimen at ${specimen.left}`).toBe(true);
      });

      test('the token rows: every dotted leader runs the same length across the level', async ({ page }) => {
        const leaders = await boxes(page, '.gallery-arch-token-list .gallery-token-row__leader');
        expect(leaders).toHaveLength(5);
        for (const leader of leaders) {
          expect(leader.width).toBeGreaterThan(64);
          expect(near(leader.width, leaders[0]!.width)).toBe(true);
        }
      });

      test('the react box and the not-built box share a row, with their headers level', async ({ page }) => {
        const [react, future] = [await boxes(page, '[data-zone="react"]'), await boxes(page, '[data-zone="future"]')];
        expect(near(react[0]!.top, future[0]!.top)).toBe(true);
        const headers = await boxes(page, '[data-zone="react"] > .bit-card__header, [data-zone="future"] > .bit-card__header');
        expect(headers).toHaveLength(2);
        expect(near(headers[0]!.top, headers[1]!.top)).toBe(true);
        expect(near(headers[0]!.height, headers[1]!.height)).toBe(true);
      });
    } else {
      test('stacked, the not-built box comes after the app, apart from the connected stack', async ({ page }) => {
        const [react, app, future] = await Promise.all(['react', 'app', 'future'].map(async (zone) => (await boxes(page, `[data-zone="${zone}"]`))[0]!));
        expect(react!.top).toBeLessThan(app!.top);
        expect(app!.bottom).toBeLessThan(future!.top);
      });
    }
  });
}
