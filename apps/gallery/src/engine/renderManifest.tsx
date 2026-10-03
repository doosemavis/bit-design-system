import { createElement } from 'react';
import type { ReactElement, ReactNode } from 'react';
import type { ChildSpec, ControlState, Manifest } from '../manifests/types';
import { COMPONENTS, isHtmlElement } from '../manifests/registry';
import { buildProps } from './buildProps';

/** One ChildSpec as an element, with its nested parts rendered the same way. */
function renderChild(child: ChildSpec, index: number): ReactElement {
  const Part = isHtmlElement(child.component) ? child.component : COMPONENTS[child.component];
  if (!Part) throw new Error(`bit gallery: ChildSpec names unknown component "${child.component}"`);
  const inner = typeof child.children === 'object' ? child.children.map(renderChild) : child.children;
  return createElement(Part, { key: index, ...child.props }, inner);
}

function renderChildren(manifest: Manifest, state: ControlState): ReactNode {
  if (typeof manifest.children === 'string') return state.children ?? manifest.children;
  if (!manifest.children) return undefined;
  return manifest.children.map(renderChild);
}

/** The exact element the preview shows and toHtml serializes. */
export function renderManifest(manifest: Manifest, state: ControlState): ReactElement {
  return createElement(manifest.component, buildProps(manifest, state), renderChildren(manifest, state));
}
