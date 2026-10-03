import { describe, it, expect } from 'vitest';
import { block, withoutBlocks, themeModes } from './css';

describe('themeModes', () => {
  it('skips a [data-mode="dark"] that continues a selector list and finds the standalone dark rule', () => {
    const { light, dark } = themeModes(
      ':root,\n[data-mode="light"],\n[data-mode="dark"] {\n  --a: 1;\n}\n\n[data-mode="dark"] {\n  --a: 2;\n}\n',
    );
    expect(light.get('--a')).toBe('1');
    expect(dark.get('--a')).toBe('2');
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
