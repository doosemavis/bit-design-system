import type { ComponentType } from 'react';

export type ControlValue = string | boolean;
/** Everything the visitor can change on a page, keyed by prop name. Numbers are stored as strings. */
export type ControlState = Record<string, ControlValue>;

export interface AxisControl {
  kind: 'axis';
  prop: 'color' | 'variant' | 'size';
  values: readonly string[];
  default: string;
}
interface SelectControl {
  kind: 'select';
  prop: string;
  values: readonly string[];
  default: string;
  /** Parse the chosen value with Number() before passing it as a prop (Stack gap, BitLogo era). */
  numeric?: boolean;
  label?: string;
  /** Print the prop in the code even at its default, because the component requires it (CodeBlock `language`). */
  alwaysPrint?: boolean;
}
interface BooleanControl {
  kind: 'boolean';
  prop: string;
  default: boolean;
  label?: string;
}
interface NumberControl {
  kind: 'number';
  prop: string;
  default: number;
  min: number;
  max: number;
  step: number;
  label?: string;
}
interface TextControl {
  kind: 'text';
  prop: string;
  default: string;
  label?: string;
  /** Print the prop in the code even at its default, because the component requires it (Field `label`). */
  alwaysPrint?: boolean;
}
export type Control = AxisControl | SelectControl | BooleanControl | NumberControl | TextControl;

/**
 * One child element of a compound component, as data so toJsx can print it. A PascalCase
 * `component` is a registered bit component; a lowercase one is a plain HTML element
 * (Select's `option`), following JSX's own rule. `children` is text, nested parts (Table's
 * head, rows and cells), or nothing for a self-closing element (Field's Input).
 */
export interface ChildSpec {
  component: string;
  props?: Record<string, string>;
  children?: string | readonly ChildSpec[];
}

/** A JSON-like value toJsx can print as a JS literal (SegmentedControl's options). */
export type LiteralValue = string | number | boolean | readonly LiteralValue[] | { readonly [key: string]: LiteralValue };

export interface Preset {
  label: string;
  state: Partial<ControlState>;
}

/** Sidebar group. Forms holds Field, Input, Select and Switch from PR2. */
export type ManifestGroup = 'components' | 'forms' | 'brand';

/** One row of a component page's Props table. */
export interface PropDoc {
  name: string;
  /** The type as you'd write it in TypeScript: `'sm' | 'md' | 'lg'`, `boolean`, `ReactNode`. */
  type: string;
  /** The value when the prop is left off, written as code (`'md'`, `false`). Omit it for a required prop. */
  default?: string;
  /** The decorator class an axis prop emits, `bit-{color}`, `bit-{variant}` or `bit-{size}`. Only axis props have one. */
  className?: string;
  description: string;
}

/** Everything a component page shows besides the playground (layout C). Every manifest has one. */
export interface ManifestDocs {
  /** Short facts shown under the import line, such as "Native <button>". May be empty. */
  badges: readonly string[];
  /** When to reach for the component, and when not to. At least one of each. */
  usage: { do: readonly string[]; dont: readonly string[] };
  /** Every prop the controls expose, plus any other a newcomer needs. At least one. */
  props: readonly PropDoc[];
  /** What the component does for keyboard and screen-reader users, and what it leaves to you. At least one. */
  a11y: readonly string[];
  /** The children control's error when the visitor empties it, e.g. Button's screen-reader warning. */
  emptyChildrenError?: string;
}

export interface Manifest {
  /** Export name; drives the title and the import line. */
  name: string;
  /** Route segment. */
  slug: string;
  group: ManifestGroup;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- rendered generically via createElement
  component: ComponentType<any>;
  description: string;
  controls: readonly Control[];
  /** A string is editable through a `children` text control; ChildSpec[] renders parts. */
  children?: string | readonly ChildSpec[];
  /** Props every render gets that the page doesn't let you change. They print after the controls' props. */
  fixedProps?: Readonly<Record<string, LiteralValue>>;
  presets?: readonly Preset[];
  /** Compound parts documented on this page; the import line lists them. */
  parts?: readonly string[];
  /** Page content beyond the playground: badges, usage, props and accessibility. */
  docs: ManifestDocs;
  /**
   * The component needs React to work (state, storage, the clipboard), so its page offers React code only.
   * Every other component's markup works as plain HTML with bit's CSS, and its page offers an HTML tab.
   */
  interactive?: boolean;
}
