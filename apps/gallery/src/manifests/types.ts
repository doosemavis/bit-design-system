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
export interface SelectControl {
  kind: 'select';
  prop: string;
  values: readonly string[];
  default: string;
  /** Parse the chosen value with Number() before passing it as a prop (Stack gap, BitLogo era). */
  numeric?: boolean;
  label?: string;
}
export interface BooleanControl {
  kind: 'boolean';
  prop: string;
  default: boolean;
  label?: string;
}
export interface NumberControl {
  kind: 'number';
  prop: string;
  default: number;
  min: number;
  max: number;
  step: number;
  label?: string;
}
export interface TextControl {
  kind: 'text';
  prop: string;
  default: string;
  label?: string;
}
export type Control = AxisControl | SelectControl | BooleanControl | NumberControl | TextControl;

/**
 * One child element of a compound component, as data so toJsx can print it. A PascalCase
 * `component` is a registered bit component; a lowercase one is a plain HTML element
 * (Select's `option`), following JSX's own rule.
 */
export interface ChildSpec {
  component: string;
  props?: Record<string, string>;
  children: string;
}

export interface Preset {
  label: string;
  state: Partial<ControlState>;
}

/** Sidebar group. Forms holds Field, Input, Select and Switch from PR2. */
export type ManifestGroup = 'components' | 'forms' | 'brand';

/** One row of a component page's Props table. */
export interface PropDoc {
  name: string;
  type: string;
  default?: string;
  description: string;
}

/** Everything a component page shows besides the playground (layout C, PR3). */
export interface ManifestDocs {
  badges?: readonly string[];
  usage?: { do: readonly string[]; dont: readonly string[] };
  props?: readonly PropDoc[];
  a11y?: readonly string[];
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
  presets?: readonly Preset[];
  /** Compound parts documented on this page; the import line lists them. */
  parts?: readonly string[];
  /** Page content beyond the playground. Optional until PR3 fills every manifest and makes it required. */
  docs?: ManifestDocs;
}
