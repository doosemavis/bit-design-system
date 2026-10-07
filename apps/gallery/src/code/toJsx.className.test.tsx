import { createElement } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { toJsx } from './toJsx';
import { defaultState } from '../engine/state';
import { buildProps } from '../engine/buildProps';
import { renderManifest } from '../engine/renderManifest';
import { MANIFESTS } from '../manifests';
import { button } from '../manifests/button';
import { segmentedControl } from '../manifests/segmentedControl';
import { stack } from '../manifests/stack';
import type { AxisControl, ControlState, Manifest } from '../manifests/types';

const AS_CLASSES = { decorators: 'className' } as const;

describe("toJsx with { decorators: 'className' } (Amendment 1)", () => {
  it('prints the changed axes as one className, in control order, and leaves their props out', () => {
    expect(toJsx(button, { ...defaultState(button), color: 'danger', variant: 'outline' }, AS_CLASSES)).toBe(
      "import { Button } from '@bit-ds/react';\n\n<Button className=\"bit-danger bit-outline\">Save</Button>",
    );
  });

  it('with every axis at its default it prints no className, the same as Props mode', () => {
    expect(toJsx(button, defaultState(button), AS_CLASSES)).toBe(toJsx(button, defaultState(button)));
  });

  it('keeps every other prop where Props mode prints it', () => {
    expect(toJsx(button, { ...defaultState(button), size: 'lg', loading: true }, AS_CLASSES)).toContain(
      '<Button className="bit-lg" loading>Save</Button>',
    );
    expect(toJsx(segmentedControl, { ...defaultState(segmentedControl), color: 'success' }, AS_CLASSES)).toContain(
      '<SegmentedControl legend="Range" className="bit-success" options=',
    );
  });

  it('a manifest with no axis prints exactly what Props mode does', () => {
    const state = { ...defaultState(stack), gap: '24' };
    expect(toJsx(stack, state, AS_CLASSES)).toBe(toJsx(stack, state));
  });
});

/** The className the className-mode snippet prints, or undefined when it prints none. */
const printedClassName = (manifest: Manifest, state: ControlState) => /className="([^"]*)"/.exec(toJsx(manifest, state, AS_CLASSES))?.[1];

/** The element the className-mode snippet describes: the changed axis props swapped for its className. */
function classNameElement(manifest: Manifest, state: ControlState): ReactElement {
  const defaults = defaultState(manifest);
  const changedAxis = (prop: string) => manifest.controls.some((c) => c.kind === 'axis' && c.prop === prop && state[prop] !== defaults[prop]);
  const props = Object.fromEntries(Object.entries(buildProps(manifest, state)).filter(([prop]) => !changedAxis(prop)));
  const { children } = renderManifest(manifest, state).props as { children?: ReactNode };
  return createElement(manifest.component, { ...props, className: printedClassName(manifest, state) }, children);
}

/** The component's own root: the first child, or, for a manifest with a demo wrapper (Dialog's trigger Button), the element with the component's class. */
const rootClasses = (element: ReactElement, manifest: Manifest) => {
  const { container, unmount } = render(element);
  const root = manifest.demo ? container.querySelector(`.bit-${manifest.name.toLowerCase()}`)! : container.firstElementChild!;
  const classes = [...root.classList].sort();
  unmount();
  return classes;
};

const AXIS_CASES = MANIFESTS.flatMap((manifest) =>
  manifest.controls
    .filter((c): c is AxisControl => c.kind === 'axis')
    .flatMap((axis) =>
      axis.values.filter((v) => v !== axis.default).map((value) => [manifest.name, axis.prop, value, manifest] as const),
    ),
);

describe('className mode round trip', () => {
  it.each(AXIS_CASES)('%s %s="%s": the className snippet renders the same root classes as the props snippet', (_n, prop, value, manifest) => {
    const state = { ...defaultState(manifest), [prop]: value };
    expect(printedClassName(manifest, state)).toBe(`bit-${value}`);
    expect(rootClasses(classNameElement(manifest, state), manifest)).toEqual(rootClasses(renderManifest(manifest, state), manifest));
  });
});
