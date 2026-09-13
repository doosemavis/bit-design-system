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
  /** Parse the chosen value with Number() before passing it as a prop (Stack gap, BitLogo freeze). */
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

/** One child element of a compound component, as data so toJsx can print it. */
export interface ChildSpec {
  component: string;
  props?: Record<string, string>;
  children: string;
}

export interface Preset {
  label: string;
  state: Partial<ControlState>;
}

export interface Manifest {
  /** Export name; drives the title and the import line. */
  name: string;
  /** Route segment. */
  slug: string;
  group: 'Components' | 'Brand';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- rendered generically via createElement
  component: ComponentType<any>;
  description: string;
  controls: readonly Control[];
  /** A string is editable through a `children` text control; ChildSpec[] renders parts. */
  children?: string | readonly ChildSpec[];
  presets?: readonly Preset[];
  /** Compound parts documented on this page; the import line lists them. */
  parts?: readonly string[];
}
