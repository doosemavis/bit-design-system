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
import type { Manifest } from '../manifests/types';

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
