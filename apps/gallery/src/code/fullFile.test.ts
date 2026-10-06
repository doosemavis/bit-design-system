import { describe, it, expect } from 'vitest';
import { fullFile } from './fullFile';
import { toJsx } from './toJsx';
import { defaultState } from '../engine/state';
import { card } from '../manifests/card';
import { codeBlock } from '../manifests/codeBlock';
import { segmentedControl } from '../manifests/segmentedControl';
import { MANIFESTS } from '../manifests';
import type { ControlState, Manifest } from '../manifests/types';
import { CODE_FORMATS, codeFor } from './codeFormats';
import ts from 'typescript';

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

  it('puts the consts at the top level, after the import and before export function Example()', () => {
    expect(fullFile(toJsx(segmentedControl, defaultState(segmentedControl)))).toBe(
      [
        "import { SegmentedControl } from '@bit-ds/react';",
        '',
        'const options = [',
        "  { value: 'day', label: 'Day' },",
        "  { value: 'week', label: 'Week' },",
        "  { value: 'month', label: 'Month' },",
        '];',
        '',
        'export function Example() {',
        '  return (',
        '    <SegmentedControl legend="Range" options={options} />',
        '  );',
        '}',
        '',
      ].join('\n'),
    );
  });

  it('separates several consts with blank lines and indents none of them', () => {
    const state = { ...defaultState(codeBlock), code: 'const total = coins + bonus; // collected' };
    const withFixed: Manifest = { ...codeBlock, fixedProps: { tags: ['a', 'b'] } };
    expect(fullFile(toJsx(withFixed, state))).toBe(
      [
        "import { CodeBlock } from '@bit-ds/react';",
        '',
        "const code = 'const total = coins + bonus; // collected';",
        '',
        'const tags = [',
        "  'a',",
        "  'b',",
        '];',
        '',
        'export function Example() {',
        '  return (',
        '    <CodeBlock language="jsx" code={code} tags={tags} />',
        '  );',
        '}',
        '',
      ].join('\n'),
    );
  });

  it('with Full file off, the snippet puts the consts above the element at column 0', () => {
    const props = CODE_FORMATS.find((format) => format.id === 'props')!;
    const snippet = codeFor(props, segmentedControl, defaultState(segmentedControl), false);
    expect(snippet).toContain('];\n\n<SegmentedControl legend="Range" options={options} />');
    expect(snippet.indexOf('const options = [')).toBeLessThan(snippet.indexOf('<SegmentedControl'));
    expect(snippet).not.toContain('export function');
  });

  it('every page, preset and code format prints a full file that parses as JSX', () => {
    const tricky = { ...defaultState(codeBlock), code: "const it's = 'C:\\dir';\n\n  console.log(`${it}`); // </CodeBlock> {}" };
    const cases: [string, Manifest, ControlState][] = [
      ['CodeBlock with quotes, backslashes and newlines', codeBlock, tricky],
      ...MANIFESTS.flatMap((manifest): [string, Manifest, ControlState][] => [
        [manifest.name, manifest, defaultState(manifest)],
        ...(manifest.presets ?? []).map((preset): [string, Manifest, ControlState] => [
          `${manifest.name} ${preset.label}`,
          manifest,
          { ...defaultState(manifest), ...preset.state } as ControlState,
        ]),
      ]),
    ];
    for (const [name, manifest, state] of cases) {
      for (const format of CODE_FORMATS.filter((f) => f.fullFile && f.available(manifest))) {
        const { diagnostics } = ts.transpileModule(codeFor(format, manifest, state, true), {
          fileName: 'App.jsx',
          reportDiagnostics: true,
          compilerOptions: { jsx: ts.JsxEmit.Preserve, allowJs: true },
        });
        expect(diagnostics?.map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n')), `${name} (${format.label})`).toEqual([]);
      }
    }
  });
});
