import type { ChildSpec, Control, ControlState, ControlValue, LiteralValue, Manifest, ManifestDemo } from '../manifests/types';
import { defaultState } from '../engine/state';
import { isOmittedSentinel } from '../manifests/sentinels';
import { isHtmlElement } from '../manifests/registry';
import { isVirtual } from '../manifests/virtual';
import { activeDemo, childSpecs } from '../engine/childSpecs';
import { staticProps } from '../engine/staticProps';

const INDENT = '  ';

/** A string prop longer than this prints as a const above the element instead of inline. */
const HOIST_LENGTH = 40;

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

/** Words a const can't be named; a prop that camelCases to one gets a number, like a collision. */
const RESERVED = new Set(
  'break case catch class const continue debugger default delete do else enum export extends false finally for function if import in instanceof let new null return static super switch this throw true try typeof var void while with yield'.split(' '),
);

/** A prop whose value prints once as `const <name> = <value>;` and is passed by that name. */
interface Hoisted {
  prop: string;
  value: LiteralValue;
}

/** A printed prop: a finished attribute, or a value to hoist. */
type PrintedProp = string | Hoisted;

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

/** Line breaks a JS string literal must escape, with their escapes. */
const LINE_BREAKS: Readonly<Record<string, string>> = { '\n': '\\n', '\r': '\\r', '\u2028': '\\u2028', '\u2029': '\\u2029' };

/**
 * A single-quoted, one-line JS string literal. Backslashes are escaped before quotes so the quote escapes
 * survive, and line breaks print as escapes because a quoted string can't span lines.
 */
function singleQuoted(value: string): string {
  const escaped = value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/[\n\r\u2028\u2029]/g, (ch) => LINE_BREAKS[ch]!);
  return `'${escaped}'`;
}

/** Children print raw unless they contain JSX-significant characters, then as a string expression. */
function printChildren(value: string): string {
  return /[<>{}]/.test(value) ? `{${singleQuoted(value)}}` : value;
}

/** An object key as JS source: bare when it is an identifier, quoted otherwise (`'aria-label'`). */
function objectKey(key: string): string {
  return IDENTIFIER.test(key) ? key : singleQuoted(key);
}

/** A value as one-line JS source: single-quoted strings, `{ key: value }` objects, `[a, b]` arrays. */
function literal(value: LiteralValue): string {
  if (typeof value === 'string') return singleQuoted(value);
  if (typeof value !== 'object') return String(value);
  if (Array.isArray(value)) return `[${value.map(literal).join(', ')}]`;
  const entries = Object.entries(value as Record<string, LiteralValue>).map(([key, v]) => `${objectKey(key)}: ${literal(v)}`);
  return `{ ${entries.join(', ')} }`;
}

/** A hoisted value as JS source: an array or object one item per line, two-space indented; anything else as literal(). */
function hoistedLiteral(value: LiteralValue): string {
  if (typeof value !== 'object') return literal(value);
  const lines = Array.isArray(value)
    ? value.map((item) => `${INDENT}${literal(item)},`)
    : Object.entries(value as Record<string, LiteralValue>).map(([key, v]) => `${INDENT}${objectKey(key)}: ${literal(v)},`);
  const [open, close] = Array.isArray(value) ? ['[', ']'] : ['{', '}'];
  return lines.length === 0 ? `${open}${close}` : `${open}\n${lines.join('\n')}\n${close}`;
}

/** Arrays, objects and strings longer than HOIST_LENGTH print as a const. */
function shouldHoist(value: LiteralValue): boolean {
  return typeof value === 'object' || (typeof value === 'string' && value.length > HOIST_LENGTH);
}

/** A fixed prop: hoisted when long, else a string attribute or a braced literal. */
function printFixed(name: string, value: LiteralValue): PrintedProp {
  if (shouldHoist(value)) return { prop: name, value };
  return typeof value === 'string' ? `${name}="${escapeAttr(value)}"` : `${name}={${literal(value)}}`;
}

/** The const name for a prop: the prop itself when it is an identifier, else camelCased (`aria-label` → `ariaLabel`). */
function constName(prop: string): string {
  if (IDENTIFIER.test(prop)) return prop;
  const camel = prop
    .split(/[^A-Za-z0-9_$]+/)
    .filter((part) => part !== '')
    .map((part, index) => (index === 0 ? part : part[0]!.toUpperCase() + part.slice(1)))
    .join('');
  return /^[A-Za-z_$]/.test(camel) ? camel : `_${camel}`;
}

/** One const name per prop, in order. A name already taken (or reserved) gets the lowest free number from 2. */
function uniqueNames(props: readonly string[]): string[] {
  return props.reduce<string[]>((names, prop) => {
    const base = constName(prop);
    const taken = (name: string) => names.includes(name) || RESERVED.has(name);
    let name = base;
    for (let n = 2; taken(name); n += 1) name = `${base}${n}`;
    return [...names, name];
  }, []);
}

/** One unique const name per hoisted value, in order, and the const declarations they name. */
function resolveHoisted(printed: readonly PrintedProp[]): { names: ReadonlyMap<Hoisted, string>; consts: string[] } {
  const hoisted = printed.filter((p): p is Hoisted => typeof p !== 'string');
  const unique = uniqueNames(hoisted.map((h) => h.prop));
  return {
    names: new Map(hoisted.map((h, index) => [h, unique[index]!])),
    consts: hoisted.map((h, index) => `const ${unique[index]!} = ${hoistedLiteral(h.value)};`),
  };
}

/** A printed prop as an attribute: as is, or `prop={name}` for a hoisted one. */
function attr(p: PrintedProp, names: ReadonlyMap<Hoisted, string>): string {
  return typeof p === 'string' ? p : `${p.prop}={${names.get(p)!}}`;
}

function isRequiredAria(control: Control): boolean {
  return control.kind === 'text' && control.prop.includes('-');
}

function printProp(control: Control, value: ControlValue, defaultValue: ControlValue): PrintedProp | null {
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
      if (shouldHoist(str)) return { prop: control.prop, value: str };
      return `${control.prop}="${escapeAttr(str)}"`;
    }
  }
}

/** Every ChildSpec in a tree, each parent before its parts, in document order. */
function flatten(children: readonly ChildSpec[]): ChildSpec[] {
  return children.flatMap((child) => [child, ...(typeof child.children === 'object' ? flatten(child.children) : [])]);
}

function printChildSpec(
  child: ChildSpec,
  depth: number,
  printedProps: ReadonlyMap<ChildSpec, readonly PrintedProp[]>,
  names: ReadonlyMap<Hoisted, string>,
): string {
  const props = printedProps.get(child)!.map((p) => ` ${attr(p, names)}`).join('');
  const indent = INDENT.repeat(depth);
  const open = `${indent}<${child.component}${props}`;
  if (child.children === undefined) return `${open} />`;
  if (typeof child.children === 'string') return `${open}>${printChildren(child.children)}</${child.component}>`;
  const inner = child.children.map((part) => printChildSpec(part, depth + 1, printedProps, names)).join('\n');
  return `${open}>\n${inner}\n${indent}</${child.component}>`;
}

/** Every bit component a ChildSpec tree names, nested parts included. HTML elements are not imported. */
function componentNames(children: readonly ChildSpec[]): string[] {
  return children.flatMap((child) => [
    ...(isHtmlElement(child.component) ? [] : [child.component]),
    ...(typeof child.children === 'object' ? componentNames(child.children) : []),
  ]);
}

function importLine(manifest: Manifest, specs: readonly ChildSpec[] | undefined, demo: ManifestDemo['code'] | undefined): string {
  const nested = specs ? componentNames(specs) : [];
  const unique = [...new Set([manifest.name, ...(manifest.parts ?? []), ...nested, ...(demo?.bitImports ?? [])])].sort();
  const bit = `import { ${unique.join(', ')} } from '@bit-ds/react';`;
  if (!demo || demo.reactImports.length === 0) return bit;
  return `import { ${[...demo.reactImports].sort().join(', ')} } from 'react';\n${bit}`;
}

interface ToJsxOptions {
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

/**
 * The React snippet for the current state, as blocks separated by blank lines: the import line, one
 * `const` per hoisted value (arrays, objects, strings over 40 characters), then the element. Pure.
 */
export function toJsx(manifest: Manifest, state: ControlState, options: ToJsxOptions = {}): string {
  const defaults = defaultState(manifest);
  const fixed = Object.entries(staticProps(manifest, state)).map(([name, value]) => printFixed(name, value));
  const asClasses = options.decorators === 'className';
  // In className mode the attribute takes the place of the first changed axis; -1 when none changed.
  const classAt = asClasses ? manifest.controls.findIndex((control) => axisChanged(control, state, defaults)) : -1;
  const printed = manifest.controls
    .map((control, index): PrintedProp | null => {
      if (isVirtual(control)) return null;
      if (asClasses && control.kind === 'axis') return index === classAt ? decoratorClassName(manifest, state, defaults) : null;
      return printProp(control, state[control.prop] ?? defaults[control.prop]!, defaults[control.prop]!);
    })
    .filter((p): p is PrintedProp => p !== null)
    .concat(fixed);
  const specs = childSpecs(manifest, state);
  // Child props print by the same rules as fixed props; their consts follow the element's, names unique across both.
  const printedProps = new Map(
    (specs ? flatten(specs) : []).map((child) => [child, Object.entries(child.props ?? {}).map(([name, value]) => printFixed(name, value))] as const),
  );
  const { names, consts } = resolveHoisted([...printed, ...[...printedProps.values()].flat()]);
  const demo = activeDemo(manifest, state)?.code;
  const props = [...(demo?.props ?? []), ...printed.map((p) => attr(p, names))].map((p) => ` ${p}`).join('');

  const open = `<${manifest.name}${props}`;
  let element: string;
  if (typeof manifest.children === 'string') {
    const children = String(state.children ?? manifest.children);
    element = children === '' ? `${open} />` : `${open}>${printChildren(children)}</${manifest.name}>`;
  } else if (specs && specs.length > 0) {
    const inner = specs.map((child) => printChildSpec(child, 1, printedProps, names)).join('\n');
    element = `${open}>\n${inner}\n</${manifest.name}>`;
  } else {
    element = `${open} />`;
  }
  if (demo) element = demo.wrap(element);
  const setup = demo && demo.setup.length > 0 ? [demo.setup.join('\n')] : [];
  return [importLine(manifest, specs, demo), ...consts, ...setup, element].join('\n\n');
}
