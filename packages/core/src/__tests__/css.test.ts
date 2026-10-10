import { describe, it, expect } from 'vitest';
import { block, styleRules, withoutBlocks, themeModes } from './css';

describe('themeModes', () => {
  it('skips a [data-mode="dark"] that continues a selector list and finds the standalone dark rule', () => {
    const { light, dark } = themeModes(
      ':root,\n[data-mode="light"],\n[data-mode="dark"] {\n  --a: 1;\n}\n\n[data-mode="dark"] {\n  --a: 2;\n}\n',
    );
    expect(light.get('--a')).toBe('1');
    expect(dark.get('--a')).toBe('2');
  });

  it('reads rules inside @layer, counts .bit-dark (scoped to a theme or not) as dark, and skips @media copies', () => {
    const css = `@layer bit.reset, bit.tokens, bit.components;
@layer bit.tokens {
  :where(:root), :where(.bit-light, .bit-dark), .bit-theme-x { --a: 1; --b: 1; }
  :where(.bit-dark, [data-mode="dark"]), :where(.bit-theme-x) :is(.bit-dark, [data-mode="dark"]) { --a: 2; }
  @media (prefers-color-scheme: dark) { [data-mode="system"] { --a: 3; --b: 3; } }
}`;
    const { light, dark } = themeModes(css);
    expect(Object.fromEntries(light)).toEqual({ '--a': '1', '--b': '1' });
    expect(Object.fromEntries(dark)).toEqual({ '--a': '2' });
  });
});

describe('styleRules', () => {
  it('carries the @layer a rule sits in, through an @media inside it', () => {
    const rules = styleRules('@layer a.b { .x { color: red; } @media (min-width: 1px) { .y { color: blue; } } }\n.z { color: green; }');
    expect(rules.map((r) => [r.selector, r.layer, r.media])).toEqual([
      ['.x', 'a.b', null],
      ['.y', 'a.b', '(min-width: 1px)'],
      ['.z', null, null],
    ]);
  });
});

describe('withoutBlocks', () => {
  it('removes exactly the named blocks and leaves the rest', () => {
    const css = '.a { color: red; }\n.b { color: blue; }\n';
    expect(withoutBlocks(css, ['.a'])).toBe('\n.b { color: blue; }\n');
    expect(block(withoutBlocks(css, ['.a']), '.b')).toBe(' color: blue; ');
  });

  it('leaves the CSS alone when a selector is not there, so a renamed exception fails loudly', () => {
    expect(withoutBlocks('.a { color: red; }', ['.missing'])).toBe('.a { color: red; }');
  });
});
