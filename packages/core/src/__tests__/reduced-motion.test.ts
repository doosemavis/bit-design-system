import { describe, expect, it } from 'vitest';
import { decl, listCss, readCss, styleRules } from './css';

const REDUCE = '(prefers-reduced-motion: reduce)';

/** A selector without its attribute and pseudo-class parts, so `.bit-dialog[data-state="opening"]::backdrop` is `.bit-dialog::backdrop`. */
function subject(selector: string): string {
  return selector
    .replace(/\[[^\]]*\]/g, '')
    .replace(/:(?!:)[\w-]+(\([^)]*\))?/g, '')
    .trim();
}

/** True when a declaration moves something: a transition or an animation that isn't `none`. */
function moves(body: string): boolean {
  return ['transition', 'animation'].some((prop) => {
    const value = decl(body, prop);
    return value !== null && value !== 'none';
  });
}

describe('reduced motion is each component’s own job, never a page-wide rule', () => {
  it('system/motion.css only defines keyframes: no global * rule and no !important', () => {
    const css = readCss('system/motion.css');
    expect(css).not.toContain('prefers-reduced-motion');
    expect(css).not.toContain('!important');
  });

  it.each([...listCss('system').map((f) => `system/${f}`), ...listCss('components').map((f) => `components/${f}`)])(
    '%s: no reduced-motion rule reaches past bit’s own classes',
    (file) => {
      const reduced = styleRules(readCss(file)).filter((rule) => rule.media === REDUCE);
      for (const rule of reduced) {
        for (const selector of rule.selector.split(/,\s*/)) expect(selector, file).toMatch(/^\.bit-/);
      }
    },
  );

  describe.each(listCss('components'))('components/%s', (file) => {
    const rules = styleRules(readCss(`components/${file}`));
    const moving = rules.filter((rule) => rule.media === null && moves(rule.body)).flatMap((rule) => rule.selector.split(/,\s*/));
    const stilled = rules
      .filter((rule) => rule.media === REDUCE && /(animation|transition):\s*none;/.test(rule.body))
      .flatMap((rule) => rule.selector.split(/,\s*/).map(subject));

    it.each(moving.length > 0 ? moving : ['(nothing moves)'])('%s stands still under reduced motion', (selector) => {
      if (moving.length === 0) return;
      expect(stilled, `${file}: add ${subject(selector)} to its @media ${REDUCE} rule`).toContain(subject(selector));
    });
  });
});
