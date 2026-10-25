import AxeBuilder from '@axe-core/playwright';
import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

/**
 * Shared checks for the built-up Passes, on any component page. Everything is read from the page: each dot's
 * `data-part`, `data-kind`, `data-edge` and `data-selector` (the anatomy part's selector), each callout's `data-part`
 * and `data-unseen`. Nothing here knows a component.
 */

export const PASS_NAMES = { wireframe: 'Wireframe', tokens: 'Tokens', states: 'States', final: 'Final' } as const;
export type PassValue = keyof typeof PASS_NAMES;

const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/** The stage of one pass, by its accessible name ("Tokens pass: Button"). */
export function passStage(page: Page, pass: PassValue): Locator {
  return page.getByRole('group', { name: new RegExp(`^${PASS_NAMES[pass]} pass: `) });
}

export const passUrl = (slug: string, pass: PassValue): string => `#/components/${slug}${pass === 'wireframe' ? '' : `?pass=${pass}`}`;

/** Loads a pass, then waits for its stage and for fonts (lines re-measure after them). */
export async function gotoPass(page: Page, slug: string, pass: PassValue): Promise<Locator> {
  await page.goto(passUrl(slug, pass));
  const stage = passStage(page, pass);
  await expect(stage).toBeVisible();
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  return stage;
}

/**
 * Each dot's miss against the painted-pixel rule for its part, from the part's own rect and computed style. [] when
 * every dot obeys it within 1px. A seen callout (no `data-unseen`) with no dot is reported too, so an empty diagram
 * never passes as a clean one.
 *
 * - ring: within borderWidth/2 + 1 of the stroke's center line on its edge;
 * - fill: inside the padding box;
 * - strip: inside the shadow strip outside the box (right or bottom);
 * - bracket: 9–11px outside its edge;
 * - box: within 1px of its edge;
 * - text: within 1px of the bottom of the rendered text run (a Range over the text, not the element box).
 */
export function touchErrors(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    type Edge = 'top' | 'right' | 'bottom' | 'left';
    const errors: string[] = [];
    const TOL = 1;
    const within = (v: number, lo: number, hi: number) => v >= lo - TOL && v <= hi + TOL;
    const fmt = (n: number) => n.toFixed(1);
    // The rendered text only: a Range over each text node, so a child element's box never widens the run.
    const textRun = (el: Element): DOMRect | null => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const rects: DOMRect[] = [];
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (!node.textContent?.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        rects.push(...[...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0));
      }
      if (rects.length === 0) return null;
      const left = Math.min(...rects.map((r) => r.left));
      const top = Math.min(...rects.map((r) => r.top));
      const right = Math.max(...rects.map((r) => r.right));
      const bottom = Math.max(...rects.map((r) => r.bottom));
      return new DOMRect(left, top, right - left, bottom - top);
    };
    const offset = (shadow: string) => {
      const hit = /(-?[\d.]+)px\s+(-?[\d.]+)px/.exec(shadow);
      return hit ? { x: Number(hit[1]), y: Number(hit[2]) } : { x: 0, y: 0 };
    };

    for (const stage of document.querySelectorAll<HTMLElement>('.gallery-passes__stage')) {
      const instance = [...stage.querySelectorAll('[data-instance]')].find((el) => !el.closest('[data-role="loupe"]'));
      const dots = [...stage.querySelectorAll<SVGCircleElement>('circle[data-role="dot"]')];
      for (const callout of stage.querySelectorAll<HTMLElement>('[role="listitem"][data-part]')) {
        if (callout.hasAttribute('data-unseen') || getComputedStyle(callout).visibility === 'hidden') continue;
        if (!dots.some((dot) => dot.dataset.part === callout.dataset.part)) errors.push(`${callout.dataset.part}: no dot`);
      }
      for (const dot of dots) {
        const { part, kind, selector } = dot.dataset;
        const edge = dot.dataset.edge as Edge | undefined;
        const name = `${part} (${kind})`;
        const el = selector ? instance?.querySelector(selector) : null;
        if (!el || !edge) {
          errors.push(`${name}: no part element for ${selector ?? '(no data-selector)'}`);
          continue;
        }
        const c = dot.getBoundingClientRect();
        const x = c.left + c.width / 2;
        const y = c.top + c.height / 2;
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        const bw = (side: string) => parseFloat(cs.getPropertyValue(`border-${side}-width`)) || 0;
        const at = `dot ${fmt(x)},${fmt(y)}; box ${fmt(r.left)},${fmt(r.top)} ${fmt(r.width)}x${fmt(r.height)}`;
        const fail = (why: string) => errors.push(`${name}: ${why} (${at})`);
        const alongEdge = edge === 'top' || edge === 'bottom' ? within(x, r.left, r.right) : within(y, r.top, r.bottom);
        switch (kind) {
          case 'ring': {
            const w = bw(edge);
            const line = { top: r.top + w / 2, bottom: r.bottom - w / 2, left: r.left + w / 2, right: r.right - w / 2 }[edge];
            const off = edge === 'top' || edge === 'bottom' ? Math.abs(y - line) : Math.abs(x - line);
            if (off > w / 2 + 1 || !alongEdge) fail(`${fmt(off)}px off the ${edge} stroke's center line (border ${w}px)`);
            break;
          }
          case 'fill': {
            const inside = x > r.left + bw('left') && x < r.right - bw('right') && y > r.top + bw('top') && y < r.bottom - bw('bottom');
            if (!inside) fail('outside the padding box');
            break;
          }
          case 'strip': {
            const s = offset(cs.boxShadow);
            const right = within(x, r.right, r.right + s.x) && within(y, r.top + s.y, r.bottom + s.y);
            const bottom = within(x, r.left + s.x, r.right + s.x) && within(y, r.bottom, r.bottom + s.y);
            if (s.x <= 0 && s.y <= 0) fail('no shadow offset to land on');
            else if (!right && !bottom) fail(`outside the ${s.x}px/${s.y}px shadow strip`);
            break;
          }
          case 'bracket': {
            const out = { top: r.top - y, bottom: y - r.bottom, left: r.left - x, right: x - r.right }[edge];
            if (out < 9 || out > 11 || !alongEdge) fail(`${fmt(out)}px outside its ${edge} edge, not 9–11px`);
            break;
          }
          case 'box': {
            const off = { top: Math.abs(y - r.top), bottom: Math.abs(y - r.bottom), left: Math.abs(x - r.left), right: Math.abs(x - r.right) }[edge];
            if (off > TOL || !alongEdge) fail(`${fmt(off)}px off its ${edge} edge`);
            break;
          }
          case 'text': {
            const run = textRun(el);
            if (!run) fail('no rendered text run');
            else if (Math.abs(y - run.bottom) > TOL || !within(x, run.left, run.right)) {
              fail(`off the text run ${fmt(run.left)}–${fmt(run.right)}, bottom ${fmt(run.bottom)}`);
            }
            break;
          }
          default:
            fail('unknown kind');
        }
      }
    }
    return errors;
  });
}

/**
 * Each line whose ends miss: its start must sit on its dot, and its end on the edge of its callout that faces the
 * instance (a left-column callout's right edge, a right-column callout's left edge), inside its height, within 1px.
 * [] when every line touches both.
 */
export function calloutGaps(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const errors: string[] = [];
    const TOL = 1;
    for (const svg of document.querySelectorAll<SVGSVGElement>('.gallery-passes__stage svg[data-layer="ink"]')) {
      const stage = svg.closest('.gallery-passes__stage')!;
      const origin = svg.getBoundingClientRect();
      for (const line of svg.querySelectorAll<SVGPathElement>('path[data-role="line"]')) {
        const part = line.dataset.part ?? '';
        const nums = (line.getAttribute('d') ?? '').match(/-?[\d.]+(?:e-?\d+)?/g)?.map(Number) ?? [];
        if (nums.length < 4) {
          errors.push(`${part}: line has no points`);
          continue;
        }
        const start = { x: origin.left + nums[0]!, y: origin.top + nums[1]! };
        const end = { x: origin.left + nums[nums.length - 2]!, y: origin.top + nums[nums.length - 1]! };
        const dot = svg.querySelector(`circle[data-role="dot"][data-part="${CSS.escape(part)}"]`);
        if (!dot) errors.push(`${part}: line with no dot`);
        else {
          const d = dot.getBoundingClientRect();
          const gap = Math.hypot(start.x - (d.left + d.width / 2), start.y - (d.top + d.height / 2));
          if (gap > TOL) errors.push(`${part}: line starts ${gap.toFixed(1)}px from its dot`);
        }
        const callout = stage.querySelector(`[role="listitem"][data-part="${CSS.escape(part)}"]`);
        if (!callout) {
          errors.push(`${part}: line with no callout`);
          continue;
        }
        const c = callout.getBoundingClientRect();
        const side = callout.closest('[data-side]')?.getAttribute('data-side');
        if (side !== 'left' && side !== 'right') {
          errors.push(`${part}: callout in no left or right column`);
          continue;
        }
        const facing = side === 'left' ? c.right : c.left;
        const edgeGap = Math.abs(end.x - facing);
        const inHeight = end.y >= c.top - TOL && end.y <= c.bottom + TOL;
        if (edgeGap > TOL || !inHeight) {
          errors.push(`${part}: line ends ${edgeGap.toFixed(1)}px from its callout's ${side === 'left' ? 'right' : 'left'} edge${inHeight ? '' : ', outside its height'}`);
        }
      }
    }
    return errors;
  });
}

/** Each loupe that overlaps a shown callout or the stage's instance. [] when every loupe sits clear. */
export function loupeOverlaps(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const errors: string[] = [];
    const overlaps = (a: DOMRect, b: DOMRect) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
    for (const stage of document.querySelectorAll<HTMLElement>('.gallery-passes__stage')) {
      const instance = [...stage.querySelectorAll('[data-instance] > *')].find((el) => !el.closest('[data-role="loupe"]'));
      const callouts = [...stage.querySelectorAll<HTMLElement>('[role="listitem"][data-part]')].filter((c) => getComputedStyle(c).visibility !== 'hidden');
      for (const lens of stage.querySelectorAll<SVGCircleElement>('circle[data-role="lens"]')) {
        const box = lens.getBoundingClientRect();
        if (instance && overlaps(box, instance.getBoundingClientRect())) errors.push('loupe overlaps the instance');
        for (const callout of callouts) {
          if (overlaps(box, callout.getBoundingClientRect())) errors.push(`loupe overlaps the ${callout.dataset.part} callout`);
        }
      }
    }
    return errors;
  });
}

/** Each pair of shown callouts that overlap, in the columns or the stacked list. [] when none do. */
export function calloutOverlaps(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const errors: string[] = [];
    for (const stage of document.querySelectorAll<HTMLElement>('.gallery-passes__stage')) {
      const shown = [...stage.querySelectorAll<HTMLElement>('[role="listitem"][data-part]')].filter((c) => getComputedStyle(c).visibility !== 'hidden');
      const boxes = shown.map((c) => ({ label: c.dataset.part, r: c.getBoundingClientRect() }));
      const stageBox = stage.getBoundingClientRect();
      boxes.forEach((a, i) => {
        if (a.r.top < stageBox.top - 1 || a.r.bottom > stageBox.bottom + 1) errors.push(`${a.label} callout leaves the stage`);
        for (const b of boxes.slice(i + 1)) {
          const hit = a.r.left < b.r.right && b.r.left < a.r.right && a.r.top < b.r.bottom && b.r.top < a.r.bottom;
          if (hit) errors.push(`${a.label} and ${b.label} callouts overlap`);
        }
      });
    }
    return errors;
  });
}

/** axe on the page as it is now, with the gallery's WCAG tags: one line per violation, [] when clean. */
export async function passesAxe(page: Page): Promise<string[]> {
  const { violations } = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  return violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`);
}
