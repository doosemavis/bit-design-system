import { describe, it, expect } from 'vitest';
import { toJsx } from './toJsx';
import { defaultState } from '../engine/state';
import { button } from '../manifests/button';
import { alert } from '../manifests/alert';
import { card } from '../manifests/card';
import { stack } from '../manifests/stack';
import { text } from '../manifests/text';
import { spinner } from '../manifests/spinner';
import { bitLogo } from '../manifests/bitLogo';
import { badge } from '../manifests/badge';
import { field } from '../manifests/field';
import { input } from '../manifests/input';
import { select } from '../manifests/select';
import { codeBlock } from '../manifests/codeBlock';
import { segmentedControl } from '../manifests/segmentedControl';
import { table } from '../manifests/table';
import type { Manifest } from '../manifests/types';
import { numberControlFixture } from '../test/fixtures';

/** SegmentedControl's options as the code prints them: one const, one option per line. */
const OPTIONS_CONST = [
  'const options = [',
  "  { value: 'day', label: 'Day' },",
  "  { value: 'week', label: 'Week' },",
  "  { value: 'month', label: 'Month' },",
  '];',
].join('\n');

/** Select's options as the code prints them: the same one-const shape as SegmentedControl's. */
const SELECT_OPTIONS_CONST = [
  'const options = [',
  "  { value: 'primary', label: 'Primary' },",
  "  { value: 'neutral', label: 'Neutral' },",
  "  { value: 'success', label: 'Success' },",
  "  { value: 'warning', label: 'Warning' },",
  "  { value: 'danger', label: 'Danger' },",
  '];',
].join('\n');

/** The JS literal a `const <name> = <literal>;` line holds, or undefined when the snippet has no such const. */
const constLiteral = (code: string, name: string) => new RegExp(`^const ${name} = (.*);$`, 'm').exec(code)?.[1];

/** Stack without its page demo (the Box it sits in), as a plain sample of the printing rules. */
const bareStack: Manifest = { ...stack, demo: undefined };

describe('toJsx', () => {
  it.each([
    ['defaults are omitted', button, {}, `import { Button } from '@bit-ds/react';\n\n<Button>Save</Button>`],
    [
      'changed axes and bare booleans',
      button,
      { color: 'danger', variant: 'outline', loading: true },
      `import { Button } from '@bit-ds/react';\n\n<Button color="danger" variant="outline" loading>Save</Button>`,
    ],
    [
      'a numeric select uses braces',
      bitLogo,
      { era: '32' },
      `import { BitLogo } from '@bit-ds/react';\n\n<BitLogo era={32} />`,
    ],
    [
      'number controls use braces and a true-default boolean turned off prints ={false}',
      numberControlFixture,
      { interval: '8', animated: false },
      `import { BitLogo } from '@bit-ds/react';\n\n<BitLogo interval={8} animated={false} />`,
    ],
    [
      'numeric selects use braces and sentinels are omitted',
      bareStack,
      { direction: 'row', gap: '24' },
      `import { Badge, Stack } from '@bit-ds/react';\n\n<Stack direction="row" gap={24}>\n  <Badge color="primary">One</Badge>\n  <Badge color="success">Two</Badge>\n  <Badge color="danger">Three</Badge>\n</Stack>`,
    ],
    [
      'text props are quoted and escaped',
      alert,
      { title: 'Say "hi"' },
      `import { Alert } from '@bit-ds/react';\n\n<Alert title="Say &quot;hi&quot;">Your changes were saved.</Alert>`,
    ],
    [
      'an empty text prop is omitted',
      alert,
      { title: '' },
      `import { Alert } from '@bit-ds/react';\n\n<Alert>Your changes were saved.</Alert>`,
    ],
    [
      'compound components list every part in the import',
      card,
      { variant: 'outline' },
      `import { Card, CardBody, CardFooter, CardHeader } from '@bit-ds/react';\n\n<Card variant="outline">\n  <CardHeader>Stats</CardHeader>\n  <CardBody>3 coins collected</CardBody>\n  <CardFooter>Updated today</CardFooter>\n</Card>`,
    ],
    [
      'self-closing when there are no children, aria-label kept as is',
      spinner,
      {},
      `import { Spinner } from '@bit-ds/react';\n\n<Spinner aria-label="Loading coins" />`,
    ],
    [
      'the default sentinel is omitted and neutral is printed',
      text,
      { color: 'neutral' },
      `import { Text } from '@bit-ds/react';\n\n<Text color="neutral">The quick brown fox jumps over the lazy dog.</Text>`,
    ],
    [
      'an alwaysPrint text prop prints at its default, and a ChildSpec with no children self-closes',
      field,
      {},
      `import { Field, Input } from '@bit-ds/react';\n\n<Field label="Email">\n  <Input type="email" placeholder="you@example.com" />\n</Field>`,
    ],
    [
      'a component with no children self-closes; aria-label and alwaysPrint props print at their defaults',
      input,
      { invalid: true },
      `import { Input } from '@bit-ds/react';\n\n<Input aria-label="Email" placeholder="you@example.com" invalid />`,
    ],
    [
      "Select's options are a fixed prop: hoisted into a const and passed as options={options}",
      select,
      { size: 'sm' },
      `import { Select } from '@bit-ds/react';\n\n${SELECT_OPTIONS_CONST}\n\n<Select size="sm" aria-label="Color" placeholder="Pick colors" options={options} />`,
    ],
    [
      'an alwaysPrint select prints at its default; a true-default boolean turned off prints ={false}',
      codeBlock,
      { copy: false },
      `import { CodeBlock } from '@bit-ds/react';\n\n<CodeBlock language="jsx" code="const coins = 42; // collected" copy={false} />`,
    ],
    [
      'fixed props print after the controls; an array fixed prop is hoisted into a const',
      segmentedControl,
      { size: 'sm' },
      `import { SegmentedControl } from '@bit-ds/react';\n\n${OPTIONS_CONST}\n\n<SegmentedControl legend="Range" size="sm" options={options} />`,
    ],
    [
      'a data-attribute enum prints like any select',
      badge,
      { shape: 'square' },
      `import { Badge } from '@bit-ds/react';\n\n<Badge shape="square">New</Badge>`,
    ],
  ])('%s', (_name, manifest, partial, expected) => {
    expect(toJsx(manifest, { ...defaultState(manifest), ...partial })).toBe(expected);
  });

  it('prints edited children and escapes braces and angle brackets in them', () => {
    const state = { ...defaultState(button), children: 'a < b {c}' };
    expect(toJsx(button, state)).toBe(`import { Button } from '@bit-ds/react';\n\n<Button>{'a < b {c}'}</Button>`);
  });

  it('escapes single quotes inside braced children', () => {
    const state = { ...defaultState(button), children: "it's <b>" };
    expect(toJsx(button, state)).toBe(`import { Button } from '@bit-ds/react';\n\n<Button>{'it\\'s <b>'}</Button>`);
  });

  it('escapes backslashes before quotes inside braced children', () => {
    const state = { ...defaultState(button), children: "C:\\dir\\'x {y}" };
    expect(toJsx(button, state)).toBe(`import { Button } from '@bit-ds/react';\n\n<Button>{'C:\\\\dir\\\\\\'x {y}'}</Button>`);
  });

  it('prints plain children with quotes and backslashes raw', () => {
    const state = { ...defaultState(button), children: "it's C:\\dir" };
    expect(toJsx(button, state)).toBe(`import { Button } from '@bit-ds/react';\n\n<Button>it's C:\\dir</Button>`);
  });

  it('prints every kind of fixed value: strings as attributes, numbers, booleans, arrays and objects in braces', () => {
    const withFixed: Manifest = {
      ...button,
      fixedProps: { title: 'Say "hi"', tabIndex: 0, hidden: false, data: [{ it: "it's" }] },
    };
    expect(toJsx(withFixed, defaultState(withFixed))).toBe(
      `import { Button } from '@bit-ds/react';\n\nconst data = [\n  { it: 'it\\'s' },\n];\n\n<Button title="Say &quot;hi&quot;" tabIndex={0} hidden={false} data={data}>Save</Button>`,
    );
  });

  it('prints nested parts indented one level per depth, and imports every part once', () => {
    const small: Manifest = {
      ...table,
      children: [
        { component: 'TableBody', children: [{ component: 'TableRow', children: [{ component: 'TableCell', children: 'a' }] }] },
      ],
    };
    expect(toJsx(small, { ...defaultState(small), striped: true })).toBe(
      `import { Table, TableBody, TableCell, TableHead, TableRow } from '@bit-ds/react';\n\n<Table striped aria-label="Button props">\n  <TableBody>\n    <TableRow>\n      <TableCell>a</TableCell>\n    </TableRow>\n  </TableBody>\n</Table>`,
    );
  });

  it('prints HTML ChildSpecs as JSX but leaves them out of the import line', () => {
    const withHtml: Manifest = {
      ...bareStack,
      children: [
        { component: 'span', props: { className: 'note' }, children: 'plain' },
        { component: 'Badge', children: 'bit' },
      ],
    };
    expect(toJsx(withHtml, defaultState(withHtml))).toBe(
      `import { Badge, Stack } from '@bit-ds/react';\n\n<Stack>\n  <span className="note">plain</span>\n  <Badge>bit</Badge>\n</Stack>`,
    );
  });
});

describe('toJsx hoists arrays, objects and long strings into consts', () => {
  /** 41 characters: one over the limit, so it is hoisted. */
  const CODE_41 = 'const total = coins + bonus; // collected';
  /** 40 characters: at the limit, so it stays inline. */
  const CODE_40 = 'const total = coins + bonus; // counted.';
  const LONG_LABEL = 'Loading every coin in the castle, please wait';

  it('segments is virtual: it never prints, and sets how many options the const holds', () => {
    const code = toJsx(segmentedControl, { ...defaultState(segmentedControl), segments: '4', multiple: true });
    expect(code).not.toContain('segments');
    expect(code).toContain('<SegmentedControl legend="Range" multiple options={options} />');
    expect(code.match(/value: '/g)).toHaveLength(4);
    expect(code).toContain("{ value: 'quarter', label: 'Quarter' },");
  });

  it('multiple is absent when off, and virtual controls stay out of the className format too', () => {
    const state = { ...defaultState(segmentedControl), segments: '5' };
    expect(toJsx(segmentedControl, state)).not.toMatch(/multiple|segments=/);
    expect(toJsx(segmentedControl, state, { decorators: 'className' })).not.toContain('segments');
  });

  it('prints SegmentedControl options as a const, one option per line, passed by name', () => {
    expect(toJsx(segmentedControl, defaultState(segmentedControl))).toBe(
      `import { SegmentedControl } from '@bit-ds/react';\n\n${OPTIONS_CONST}\n\n<SegmentedControl legend="Range" options={options} />`,
    );
  });

  it('hoists a string longer than 40 characters and keeps one of exactly 40 inline', () => {
    expect(CODE_41).toHaveLength(41);
    expect(CODE_40).toHaveLength(40);
    expect(toJsx(codeBlock, { ...defaultState(codeBlock), code: CODE_41 })).toBe(
      `import { CodeBlock } from '@bit-ds/react';\n\nconst code = '${CODE_41}';\n\n<CodeBlock language="jsx" code={code} />`,
    );
    expect(toJsx(codeBlock, { ...defaultState(codeBlock), code: CODE_40 })).toBe(
      `import { CodeBlock } from '@bit-ds/react';\n\n<CodeBlock language="jsx" code="${CODE_40}" />`,
    );
  });

  it('prints a hoisted string with quotes, backslashes and newlines as a valid one-line JS literal', () => {
    const code = "const it's = 'C:\\dir';\nconsole.log(it's);\r\n\u2028done";
    const printed = toJsx(codeBlock, { ...defaultState(codeBlock), code });
    const literal = constLiteral(printed, 'code');
    expect(literal).toBeDefined();
    expect(new Function(`return ${literal}`)()).toBe(code);
    expect(printed).toContain('code={code}');
  });

  it('camelCases a prop name that is not an identifier: aria-label becomes ariaLabel', () => {
    expect(LONG_LABEL.length).toBeGreaterThan(40);
    expect(toJsx(spinner, { ...defaultState(spinner), 'aria-label': LONG_LABEL })).toBe(
      `import { Spinner } from '@bit-ds/react';\n\nconst ariaLabel = '${LONG_LABEL}';\n\n<Spinner aria-label={ariaLabel} />`,
    );
  });

  it('gives two hoisted props different names, numbering the later one', () => {
    const clash: Manifest = { ...spinner, fixedProps: { ariaLabel: ['a'] } };
    expect(toJsx(clash, { ...defaultState(clash), 'aria-label': LONG_LABEL })).toBe(
      `import { Spinner } from '@bit-ds/react';\n\nconst ariaLabel = '${LONG_LABEL}';\n\nconst ariaLabel2 = [\n  'a',\n];\n\n<Spinner aria-label={ariaLabel} ariaLabel={ariaLabel2} />`,
    );
  });

  it('never hoists children text, however long', () => {
    const children = 'Save every coin you collected in the castle today';
    expect(toJsx(button, { ...defaultState(button), children })).toBe(`import { Button } from '@bit-ds/react';\n\n<Button>${children}</Button>`);
  });

  it('hoists a long fixed string and keeps a short one as an attribute', () => {
    const withFixed: Manifest = { ...button, fixedProps: { title: CODE_41, name: CODE_40 } };
    expect(toJsx(withFixed, defaultState(withFixed))).toBe(
      `import { Button } from '@bit-ds/react';\n\nconst title = '${CODE_41}';\n\n<Button title={title} name="${CODE_40}">Save</Button>`,
    );
  });

  it('prints a hoisted object one entry per line, quoting keys that are not identifiers, and an empty array as []', () => {
    const withFixed: Manifest = { ...button, fixedProps: { labels: { 'aria-label': 'Day', title: 'Day' }, items: [] } };
    expect(toJsx(withFixed, defaultState(withFixed))).toBe(
      `import { Button } from '@bit-ds/react';\n\nconst labels = {\n  'aria-label': 'Day',\n  title: 'Day',\n};\n\nconst items = [];\n\n<Button labels={labels} items={items}>Save</Button>`,
    );
  });

  it('leaves a long text prop out at its default, so it has no const either', () => {
    const longDefault: Manifest = { ...alert, controls: [{ kind: 'text', prop: 'title', default: CODE_41 }] };
    expect(toJsx(longDefault, defaultState(longDefault))).toBe(`import { Alert } from '@bit-ds/react';\n\n<Alert>Your changes were saved.</Alert>`);
  });

  it('hoists in className mode too', () => {
    const state = { ...defaultState(segmentedControl), color: 'success' };
    expect(toJsx(segmentedControl, state, { decorators: 'className' })).toBe(
      `import { SegmentedControl } from '@bit-ds/react';\n\n${OPTIONS_CONST}\n\n<SegmentedControl legend="Range" className="bit-success" options={options} />`,
    );
  });
});
