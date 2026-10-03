import type { ChildSpec, Control, ControlState, ControlValue, LiteralValue, Manifest } from '../manifests/types';
import { defaultState } from '../engine/state';
import { isOmittedSentinel } from '../manifests/sentinels';
import { isHtmlElement } from '../manifests/registry';

const INDENT = '  ';

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

/** A single-quoted JS string literal. Backslashes are escaped before quotes so the quote escapes survive. */
function singleQuoted(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

/** Children print raw unless they contain JSX-significant characters, then as a string expression. */
function printChildren(value: string): string {
  return /[<>{}]/.test(value) ? `{${singleQuoted(value)}}` : value;
}

/** A fixed prop's value as JS source: single-quoted strings, `{ key: value }` objects, `[a, b]` arrays. */
function literal(value: LiteralValue): string {
  if (typeof value === 'string') return singleQuoted(value);
  if (typeof value !== 'object') return String(value);
  if (Array.isArray(value)) return `[${value.map(literal).join(', ')}]`;
  const entries = Object.entries(value as Record<string, LiteralValue>).map(([key, v]) => `${key}: ${literal(v)}`);
  return `{ ${entries.join(', ')} }`;
}

/** A fixed prop as JSX: strings as attributes, everything else in braces. */
function printFixed(name: string, value: LiteralValue): string {
  return typeof value === 'string' ? `${name}="${escapeAttr(value)}"` : `${name}={${literal(value)}}`;
}

function isRequiredAria(control: Control): boolean {
  return control.kind === 'text' && control.prop.includes('-');
}

function printProp(control: Control, value: ControlValue, defaultValue: ControlValue): string | null {
  const isDefault = value === defaultValue;
  switch (control.kind) {
    case 'boolean':
      if (isDefault) return null;
      return value === true ? control.prop : `${control.prop}={false}`;
    case 'number':
      return isDefault ? null : `${control.prop}={${Number(value)}}`;
    case 'select':
      if ((isDefault && !control.alwaysPrint) || isOmittedSentinel(control, value)) return null;
      return control.numeric ? `${control.prop}={${Number(value)}}` : `${control.prop}="${escapeAttr(String(value))}"`;
    case 'axis':
      return isDefault ? null : `${control.prop}="${escapeAttr(String(value))}"`;
    case 'text': {
      const str = String(value);
      if (str === '') return null;
      if (isDefault && !control.alwaysPrint && !isRequiredAria(control)) return null;
      return `${control.prop}="${escapeAttr(str)}"`;
    }
  }
}

function printChildSpec(child: ChildSpec, depth: number): string {
  const props = Object.entries(child.props ?? {})
    .map(([k, v]) => ` ${k}="${escapeAttr(v)}"`)
    .join('');
  const indent = INDENT.repeat(depth);
  const open = `${indent}<${child.component}${props}`;
  if (child.children === undefined) return `${open} />`;
  if (typeof child.children === 'string') return `${open}>${printChildren(child.children)}</${child.component}>`;
  const inner = child.children.map((part) => printChildSpec(part, depth + 1)).join('\n');
  return `${open}>\n${inner}\n${indent}</${child.component}>`;
}

/** Every bit component a ChildSpec tree names, nested parts included. HTML elements are not imported. */
function componentNames(children: readonly ChildSpec[]): string[] {
  return children.flatMap((child) => [
    ...(isHtmlElement(child.component) ? [] : [child.component]),
    ...(typeof child.children === 'object' ? componentNames(child.children) : []),
  ]);
}

function importLine(manifest: Manifest): string {
  const nested = typeof manifest.children === 'object' ? componentNames(manifest.children) : [];
  const unique = [...new Set([manifest.name, ...(manifest.parts ?? []), ...nested])].sort();
  return `import { ${unique.join(', ')} } from '@bit-ds/react';`;
}

export interface ToJsxOptions {
  /**
   * `'props'` (the default) prints every axis as its prop: `color="danger"`. `'className'` prints the
   * non-default axes as one `className="bit-danger bit-outline"`, in control order, where the first of
   * them would have been, and leaves those props out. Both render the same classes.
   */
  decorators?: 'props' | 'className';
}

/** True when an axis control's value differs from its default, so it emits a class worth printing. */
function axisChanged(control: Control, state: ControlState, defaults: ControlState): boolean {
  return control.kind === 'axis' && (state[control.prop] ?? defaults[control.prop]) !== defaults[control.prop];
}

/** `className="bit-danger bit-outline"`: one class per changed axis, in control order. */
function decoratorClassName(manifest: Manifest, state: ControlState, defaults: ControlState): string {
  const classes = manifest.controls
    .filter((control) => axisChanged(control, state, defaults))
    .map((control) => `bit-${String(state[control.prop])}`);
  return `className="${escapeAttr(classes.join(' '))}"`;
}

/** The React snippet for the current state: import line, blank line, element. Pure. */
export function toJsx(manifest: Manifest, state: ControlState, options: ToJsxOptions = {}): string {
  const defaults = defaultState(manifest);
  const fixed = Object.entries(manifest.fixedProps ?? {}).map(([name, value]) => printFixed(name, value));
  const asClasses = options.decorators === 'className';
  // In className mode the attribute takes the place of the first changed axis; -1 when none changed.
  const classAt = asClasses ? manifest.controls.findIndex((control) => axisChanged(control, state, defaults)) : -1;
  const props = manifest.controls
    .map((control, index) => {
      if (asClasses && control.kind === 'axis') return index === classAt ? decoratorClassName(manifest, state, defaults) : null;
      return printProp(control, state[control.prop] ?? defaults[control.prop]!, defaults[control.prop]!);
    })
    .filter((p): p is string => p !== null)
    .concat(fixed)
    .map((p) => ` ${p}`)
    .join('');

  const open = `<${manifest.name}${props}`;
  let element: string;
  if (typeof manifest.children === 'string') {
    const children = String(state.children ?? manifest.children);
    element = children === '' ? `${open} />` : `${open}>${printChildren(children)}</${manifest.name}>`;
  } else if (manifest.children && manifest.children.length > 0) {
    const inner = manifest.children.map((child) => printChildSpec(child, 1)).join('\n');
    element = `${open}>\n${inner}\n</${manifest.name}>`;
  } else {
    element = `${open} />`;
  }
  return `${importLine(manifest)}\n\n${element}`;
}
