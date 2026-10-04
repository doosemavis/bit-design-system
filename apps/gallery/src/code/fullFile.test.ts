import { describe, it, expect } from 'vitest';
import { fullFile, STYLE_COMMENT } from './fullFile';
import { STYLE_IMPORTS } from '../content/styleImports';
import { toJsx } from './toJsx';
import { defaultState } from '../engine/state';
import { card } from '../manifests/card';

describe('fullFile', () => {
  it('wraps a one-line element in the style imports, the component import and an Example component', () => {
    expect(fullFile("import { Button } from '@bit-ds/react';\n\n<Button>Save</Button>")).toBe(
      [
        STYLE_COMMENT,
        "import '@bit-ds/react/themes/power-up.css';",
        "import '@bit-ds/react/styles.css';",
        "import { Button } from '@bit-ds/react';",
        '',
        'export function Example() {',
        '  return (',
        '    <Button>Save</Button>',
        '  );',
        '}',
        '',
      ].join('\n'),
    );
  });

  it('puts the theme first (its font @import must lead the CSS) and says the styles go in once', () => {
    const file = fullFile(toJsx(card, defaultState(card)));
    expect(file.startsWith(`// once per app: skip if already in your entry file\n${STYLE_IMPORTS}\n`)).toBe(true);
  });

  it('indents every line of a multi-line element inside return ( … )', () => {
    const file = fullFile(toJsx(card, defaultState(card)));
    expect(file).toContain('  return (\n    <Card>\n      <CardHeader>Stats</CardHeader>\n');
    expect(file).toContain('      <CardFooter>Updated today</CardFooter>\n    </Card>\n  );\n}\n');
  });
});
