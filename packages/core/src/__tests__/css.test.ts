import { describe, it, expect } from 'vitest';
import { themeModes } from './css';

describe('themeModes', () => {
  it('skips a [data-mode="dark"] that continues a selector list and finds the standalone dark rule', () => {
    const { light, dark } = themeModes(
      ':root,\n[data-mode="light"],\n[data-mode="dark"] {\n  --a: 1;\n}\n\n[data-mode="dark"] {\n  --a: 2;\n}\n',
    );
    expect(light.get('--a')).toBe('1');
    expect(dark.get('--a')).toBe('2');
  });
});
