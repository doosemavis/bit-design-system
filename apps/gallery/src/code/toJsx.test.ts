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
import type { Manifest } from '../manifests/types';
import { numberControlFixture } from '../test/fixtures';

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
      stack,
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
      { color: 'neutral', as: 'h2' },
      `import { Text } from '@bit-ds/react';\n\n<Text as="h2" color="neutral">The quick brown fox jumps over the lazy dog.</Text>`,
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
      'HTML option children print as JSX and stay out of the import line',
      select,
      { size: 'sm' },
      `import { Select } from '@bit-ds/react';\n\n<Select size="sm" aria-label="Color">\n  <option value="primary">primary</option>\n  <option value="success">success</option>\n  <option value="danger">danger</option>\n</Select>`,
    ],
    [
      'an alwaysPrint select prints at its default; a true-default boolean turned off prints ={false}',
      codeBlock,
      { copy: false },
      `import { CodeBlock } from '@bit-ds/react';\n\n<CodeBlock language="jsx" code="const coins = 42; // collected" copy={false} />`,
    ],
    [
      'fixed props print after the controls, as JS literals',
      segmentedControl,
      { size: 'sm' },
      `import { SegmentedControl } from '@bit-ds/react';\n\n<SegmentedControl legend="Range" size="sm" options={[{ value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }]} />`,
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
      `import { Button } from '@bit-ds/react';\n\n<Button title="Say &quot;hi&quot;" tabIndex={0} hidden={false} data={[{ it: 'it\\'s' }]}>Save</Button>`,
    );
  });

  it('prints HTML ChildSpecs as JSX but leaves them out of the import line', () => {
    const withHtml: Manifest = {
      ...stack,
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
