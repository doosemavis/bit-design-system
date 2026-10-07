import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { renderManifest } from './renderManifest';
import { buildProps } from './buildProps';
import { defaultState } from './state';
import { toJsx } from '../code/toJsx';
import { fullFile } from '../code/fullFile';
import { testManifest } from '../test/manifest';

const Box = ({ children }: { children?: ReactNode }) => <div data-testid="box">{children}</div>;

const withDemo = testManifest({
  name: 'Panel',
  component: Box,
  controls: [
    { kind: 'text', prop: 'title', default: 'Hello', virtual: true },
    { kind: 'boolean', prop: 'loud', default: false, virtual: true },
  ],
  deriveChildren: (state) => [{ component: 'span', children: String(state.title) }],
  demo: {
    render: (element) => <section data-testid="demo">{element}</section>,
    code: {
      reactImports: ['useState'],
      bitImports: ['Button'],
      setup: ['const [open, setOpen] = useState(false);'],
      props: ['open={open}'],
      wrap: (jsx) => `<>\n  <Button>Go</Button>\n${jsx.split('\n').map((line) => `  ${line}`).join('\n')}\n</>`,
    },
  },
});

describe('engine: demo wrapper', () => {
  it('renderManifest wraps the element with demo.render', () => {
    render(renderManifest(withDemo, defaultState(withDemo)));
    expect(screen.getByTestId('demo')).toContainElement(screen.getByTestId('box'));
    expect(screen.getByTestId('box')).toHaveTextContent('Hello');
  });

  it('virtual text and boolean controls are neither passed nor printed', () => {
    const state = { ...defaultState(withDemo), title: 'Hi', loud: true };
    expect(buildProps(withDemo, state)).toEqual({});
    expect(toJsx(withDemo, state)).not.toMatch(/title=|loud/);
  });

  it('toJsx prints the react import, the bit imports, the setup lines, the demo props first and the wrap', () => {
    expect(toJsx(withDemo, defaultState(withDemo))).toBe(
      [
        "import { useState } from 'react';\nimport { Button, Panel } from '@bit-ds/react';",
        'const [open, setOpen] = useState(false);',
        '<>\n  <Button>Go</Button>\n  <Panel open={open}>\n    <span>Hello</span>\n  </Panel>\n</>',
      ].join('\n\n'),
    );
  });

  it('the full file puts hook setup lines inside the component, before return', () => {
    expect(fullFile(toJsx(withDemo, defaultState(withDemo)))).toBe(
      [
        "import { useState } from 'react';",
        "import { Button, Panel } from '@bit-ds/react';",
        '',
        'export function Example() {',
        '  const [open, setOpen] = useState(false);',
        '',
        '  return (',
        '    <>',
        '      <Button>Go</Button>',
        '      <Panel open={open}>',
        '        <span>Hello</span>',
        '      </Panel>',
        '    </>',
        '  );',
        '}',
        '',
      ].join('\n'),
    );
  });

  it('a module-level const (a hoisted options array) still goes above the component', () => {
    const file = fullFile("import { X } from '@bit-ds/react';\n\nconst options = [\n  'a',\n];\n\n<X options={options} />");
    expect(file.indexOf('const options')).toBeLessThan(file.indexOf('export function Example()'));
  });
});
