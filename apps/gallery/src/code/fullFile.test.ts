import { describe, it, expect } from 'vitest';
import { fullFile } from './fullFile';
import { toJsx } from './toJsx';
import { defaultState } from '../engine/state';
import { card } from '../manifests/card';

describe('fullFile', () => {
  it('wraps a one-line element in the component import and an Example component', () => {
    expect(fullFile("import { Button } from '@bit-ds/react';\n\n<Button>Save</Button>")).toBe(
      [
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

  it('leaves out the style imports: they go in once per app (Getting started), not in every file', () => {
    const file = fullFile(toJsx(card, defaultState(card)));
    expect(file.startsWith("import { Card, CardBody, CardFooter, CardHeader } from '@bit-ds/react';\n")).toBe(true);
    expect(file).not.toContain('.css');
  });

  it('indents every line of a multi-line element inside return ( … )', () => {
    const file = fullFile(toJsx(card, defaultState(card)));
    expect(file).toContain('  return (\n    <Card>\n      <CardHeader>Stats</CardHeader>\n');
    expect(file).toContain('      <CardFooter>Updated today</CardFooter>\n    </Card>\n  );\n}\n');
  });
});
