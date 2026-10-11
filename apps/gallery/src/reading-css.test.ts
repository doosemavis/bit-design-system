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
