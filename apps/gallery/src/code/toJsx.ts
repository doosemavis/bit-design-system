import type { ChildSpec, Control, ControlState, ControlValue, Manifest } from '../manifests/types';
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
      if (isDefault || isOmittedSentinel(control, value)) return null;
      return control.numeric ? `${control.prop}={${Number(value)}}` : `${control.prop}="${escapeAttr(String(value))}"`;
    case 'axis':
      return isDefault ? null : `${control.prop}="${escapeAttr(String(value))}"`;
    case 'text': {
      const str = String(value);
      if (str === '') return null;
      if (isDefault && !isRequiredAria(control)) return null;
      return `${control.prop}="${escapeAttr(str)}"`;
    }
  }
}

function printChildSpec(child: ChildSpec, depth: number): string {
  const props = Object.entries(child.props ?? {})
    .map(([k, v]) => ` ${k}="${escapeAttr(v)}"`)
    .join('');
  return `${INDENT.repeat(depth)}<${child.component}${props}>${printChildren(child.children)}</${child.component}>`;
}

function importLine(manifest: Manifest): string {
  const names = [manifest.name, ...(manifest.parts ?? [])];
  if (Array.isArray(manifest.children)) {
    for (const child of manifest.children) if (!isHtmlElement(child.component)) names.push(child.component);
  }
  const unique = [...new Set(names)].sort();
  return `import { ${unique.join(', ')} } from '@bit-ds/react';`;
}

/** The React snippet for the current state: import line, blank line, element. Pure. */
export function toJsx(manifest: Manifest, state: ControlState): string {
  const defaults = defaultState(manifest);
  const props = manifest.controls
    .map((control) => printProp(control, state[control.prop] ?? defaults[control.prop]!, defaults[control.prop]!))
    .filter((p): p is string => p !== null)
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
