import { createElement } from 'react';
import type { ReactElement, ReactNode } from 'react';
import type { ChildSpec, ControlState, Manifest } from '../manifests/types';
import { COMPONENTS, isHtmlElement } from '../manifests/registry';
import { activeDemo, childSpecs } from './childSpecs';
import { buildProps } from './buildProps';
import { defaultState } from './state';

/** One ChildSpec as an element, with its nested parts rendered the same way. */
function renderChild(child: ChildSpec, index: number): ReactElement {
  const Part = isHtmlElement(child.component) ? child.component : COMPONENTS[child.component];
  if (!Part) throw new Error(`bit gallery: ChildSpec names unknown component "${child.component}"`);
  const inner = typeof child.children === 'object' ? child.children.map(renderChild) : child.children;
  return createElement(Part, { key: index, ...child.props }, inner);
}

function renderChildren(manifest: Manifest, state: ControlState): ReactNode {
  if (typeof manifest.children === 'string') return state.children ?? manifest.children;
  return childSpecs(manifest, state)?.map(renderChild);
}

interface RenderOptions {
  /** A live sample on the page (preview, Variants, tile): adds the manifest's sampleProps, which the code never shows. */
  sample?: boolean;
}

/** The element the preview shows (with `sample`) and toHtml serializes (without). */
export function renderManifest(manifest: Manifest, state: ControlState, { sample = false }: RenderOptions = {}): ReactElement {
  const props = sample ? { ...buildProps(manifest, state), ...manifest.sampleProps } : buildProps(manifest, state);
  const element = createElement(manifest.component, props, renderChildren(manifest, state));
  const demo = activeDemo(manifest, state);
  return demo ? demo.render(element, { ...defaultState(manifest), ...state }) : element;
}
