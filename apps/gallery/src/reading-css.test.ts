// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('./gallery.css', import.meta.url), 'utf8');

/** The body of the first top-level `selector { … }` rule. */
function rule(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:^|\\n)${escaped} \\{([^}]*)\\}`).exec(css)?.[1] ?? '';
}

/** The `max-width: <n>ch` a rule sets, or NaN. */
const measure = (body: string) => Number(/max-width: (\d+)ch;/.exec(body)?.[1]);

/**
 * A ch is the width of "0". In Nunito that is about 1.34 average letters (measured 2026-10-11: 70ch held 89 to 94
 * characters a line), so 54 to 58ch is 72 to 78 characters, the top of the 45 to 75 range.
 */
const MEASURE = { min: 54, max: 58 };

// Critique 2026-10-11: lead and body paragraphs ran 101 to 150 characters a line on a wide screen.
describe('gallery.css: prose measure', () => {
  it('caps every paragraph in main at about 75 characters', () => {
    const cap = measure(rule('.gallery-main p.bit-text'));
    expect(cap).toBeGreaterThanOrEqual(MEASURE.min);
    expect(cap).toBeLessThanOrEqual(MEASURE.max);
  });

  it('caps bulleted prose (Usage, Accessibility, release notes) the same way', () => {
    expect(measure(rule('.gallery-main .gallery-bullets'))).toBe(measure(rule('.gallery-main p.bit-text')));
  });

  it('leaves live previews and samples alone: they show Text as it renders in an app', () => {
    const body = rule(
      '.gallery-main :is(.gallery-preview, .gallery-example__sample, .gallery-split__result, .gallery-tile__preview) p.bit-text',
    );
    expect(body).toMatch(/max-width: none;/);
  });

  it('caps only text: no table, code panel or card in the sheet takes a ch measure', () => {
    const capped = [...css.matchAll(/([^{}]+)\{[^}]*max-width: \d+ch;/g)].map((m) => m[1]!.replace(/\/\*[\s\S]*?\*\//g, '').trim());
    expect(capped).toEqual(['.gallery-main p.bit-text', '.gallery-main .gallery-bullets']);
  });
});

// Polish 2026-10-11, after the critique fixes merged.
describe('gallery.css: polish', () => {
  it('the On this page bar runs its lines and surface to the window edge past main, without widening the page', () => {
    const bar = rule('.gallery-section-bar');
    // Ink overflow only: border-image-outset and a spread shadow never add scroll width; the clip keeps the
    // extension to the right, so the bar never paints over the sidebar or the content above and below it.
    expect(bar).toContain('border-image: linear-gradient(var(--bit-color-line) 0 0) 1 / var(--bit-border-width) 0 / 0 100vw 0 0;');
    expect(bar).toContain('box-shadow: 0 0 0 100vw var(--bit-color-bg);');
    expect(bar).toContain('clip-path: inset(0 -100vw 0 0);');
  });

  it('cards too narrow for one line (a phone, a just-two-column laptop) stack every fact the same way: the count over its label', () => {
    // By the list's own width: the facts list is the size container.
    expect(rule('.gallery-facts')).toContain('container-type: inline-size;');
    const fact = /@container \(max-width: 27rem\) \{\s*\.gallery-fact \{([^}]*)\}/.exec(css)?.[1] ?? '';
    expect(fact).toContain('flex-direction: column;');
    expect(fact).toContain('align-items: flex-start;');
  });

  it('a phone scrolls the release filter sideways instead of cutting off its last options', () => {
    expect(rule('.gallery-release-filter')).toContain('max-width: 100%;');
    expect(rule('.gallery-release-filter .bit-segmented-control__options')).toContain('overflow-x: auto;');
  });
});
