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

    test('the naming rule holds still: picking any color moves no step, arrow or Button, and the card keeps its height', async ({ page }) => {
      const naming = page.locator('.gallery-arch-naming');
      const layout = () =>
        naming.evaluate((root) => {
          // Relative to the card, so a click that scrolls the page doesn't count as movement.
          const card = root.getBoundingClientRect();
          // Only what is drawn: each arrow is in the markup twice (right and down), one of them display: none.
          const at = (selector: string) =>
            [...root.querySelectorAll(selector)]
              .map((element) => element.getBoundingClientRect())
              .filter((r) => r.width > 0)
              .map((r) => `${Math.round(r.left - card.left)},${Math.round(r.top - card.top)},${Math.round(r.width)}`);
          return { steps: at('.gallery-arch-chain__step'), arrows: at('.gallery-arch-chain__arrow'), button: at('.gallery-arch-chain .bit-button'), height: Math.round(root.getBoundingClientRect().height) };
        });
      const first = await layout();
      for (const color of ['primary', 'success', 'warning', 'danger', 'neutral']) {
        // The segment's visible label, as a person clicks it (the radio itself is visually hidden).
        await page.locator('.gallery-arch-picker').getByText(color, { exact: true }).click();
        await expect(naming.locator('.gallery-arch-chain .bit-button')).toHaveClass(new RegExp(`\\bbit-${color}\\b`));
        expect(await layout(), `after picking ${color}`).toEqual(first);
      }
    });

    if (name === 'desktop') {
      test('the palette: each color’s name and hex are centered under its tile', async ({ page }) => {
        const centers = await page.locator('.gallery-arch-swatches > li').evaluateAll((items) =>
          items.map((li) => {
            const mid = (el: Element) => { const r = el.getBoundingClientRect(); return r.left + r.width / 2; };
            return [...li.children].map(mid);
          }),
        );
        expect(centers).toHaveLength(5);
        for (const [tile, ...labels] of centers) for (const label of labels) expect(near(label!, tile!)).toBe(true);
      });

      test('the page’s prose runs as wide as the figure, not the 56ch reading cap', async ({ page }) => {
        const [figure] = await boxes(page, '.gallery-arch');
        const [summary] = await boxes(page, 'section[aria-labelledby="architecture-summary"] p.bit-text');
        expect(near(summary!.width, figure!.width)).toBe(true);
      });

      test('Level 4’s components sit in three rows of four, each column centered on one line', async ({ page }) => {
        const cells = await boxes(page, '.gallery-arch-specimens > *');
        expect(cells).toHaveLength(12);
        const rows = [cells.slice(0, 4), cells.slice(4, 8), cells.slice(8)];
        for (const row of rows) for (const cell of row) expect(near(cell.top + cell.height / 2, row[0]!.top + row[0]!.height / 2)).toBe(true);
        const center = (box: { left: number; width: number }) => box.left + box.width / 2;
        for (let col = 0; col < 4; col++) for (const row of rows) expect(near(center(row[col]!), center(rows[0]![col]!))).toBe(true);
      });

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

    } else {
      test('the kind table fits the phone: no sideways scroll, and each row stacks axis over choice over why', async ({ page }) => {
        const table = page.locator('.gallery-arch-kind');
        const [scrollWidth, clientWidth] = await table.evaluate((wrapper) => [wrapper.scrollWidth, wrapper.clientWidth]);
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth!);
        for (const row of await table.locator('tbody tr').all()) {
          const [axis, choice, why] = await row.locator('td').evaluateAll((cells) =>
            cells.map((cell) => {
              const r = cell.getBoundingClientRect();
              return { top: r.top, bottom: r.bottom };
            }),
          );
          expect(choice!.top).toBeGreaterThanOrEqual(axis!.bottom - 1);
          expect(why!.top).toBeGreaterThanOrEqual(choice!.bottom - 1);
        }
        // Still a table to a screen reader, its column headers heard though not shown.
        await expect(page.getByRole('table', { name: 'What kind of design system this is' }).getByRole('columnheader')).toHaveCount(3);
      });
    }
  });
}
