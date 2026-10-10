import type { ComponentType, ReactElement } from 'react';

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
  /** A control that only shapes the page (how many segments): it shows in the panel and presets, but is never a prop and never printed. */
  virtual?: boolean;
  /** One line under the control, always shown (Text `as`: titles belong to Heading). */
  hint?: string;
  /**
   * Why the control can't change in this state, or undefined when it can (Text weight at 24 and 32). While
   * locked it is disabled, a primary note under it says why, and it holds its default, so the preview and the
   * code drop it.
   */
  lock?: (state: ControlState) => string | undefined;
}
interface BooleanControl {
  kind: 'boolean';
  prop: string;
  default: boolean;
  label?: string;
  /** A control that only shapes the page: it shows in the panel and presets, but is never a prop and never printed. */
  virtual?: boolean;
}
interface NumberControl {
  kind: 'number';
  prop: string;
  default: number;
  min: number;
  max: number;
  step: number;
  label?: string;
  /** A control that only shapes the page (how many options a Select lists): it shows in the panel and presets, but is never a prop and never printed. */
  virtual?: boolean;
}
interface TextControl {
  kind: 'text';
  prop: string;
  default: string;
  label?: string;
  /** Print the prop in the code even at its default, because the component requires it (Field `label`). */
  alwaysPrint?: boolean;
  /** A control that only shapes the page (a title shown in a child part): it shows in the panel and presets, but is never a prop and never printed. */
  virtual?: boolean;
}
export type Control = AxisControl | SelectControl | BooleanControl | NumberControl | TextControl;

/**
 * One child element of a compound component, as data so toJsx can print it. A PascalCase
 * `component` is a registered bit component; a lowercase one is a plain HTML element
 * (a `span`), following JSX's own rule. `children` is text, nested parts (Table's
 * head, rows and cells), or nothing for a self-closing element (Field's Input).
 * A string prop prints as an attribute; arrays, objects and strings over 40 characters print as a `const`, as top-level props do.
 */
export interface ChildSpec {
  component: string;
  props?: Readonly<Record<string, LiteralValue>>;
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

/**
 * A stateful wrapper for a component that can't show itself alone (a Dialog needs a trigger and open state).
 * The preview renders `render(element, state)`; the printed code adds the imports and setup lines and wraps the element.
 * Both get the full state, defaults merged in, so a demo can follow a virtual control (Stack's container width).
 */
export interface ManifestDemo {
  /**
   * Only in the states this returns true for (a dismissible Alert); every other state renders and prints the
   * bare element. It gets the full state, defaults merged in. Leave it off for a demo that always applies (Dialog).
   */
  when?: (state: ControlState) => boolean;
  render: (element: ReactElement, state: ControlState) => ReactElement;
  code: {
    /** Named imports from 'react' (`useState`), printed on their own line above the bit import. */
    reactImports: readonly string[];
    /** Extra bit components the wrapper uses (`Button`), merged into the bit import. */
    bitImports: readonly string[];
    /** Lines at the top of the component body (`const [open, setOpen] = useState(false);`). */
    setup: readonly string[];
    /** Attributes printed first on the element (`open={open}`), or a function of the state for ones that follow a control. */
    props: readonly string[] | ((state: ControlState) => readonly string[]);
    /** The JSX around the element. */
    wrap: (elementJsx: string, state: ControlState) => string;
  };
}

/** A prop passed as a named export of @bit-ds/react rather than a literal: Icon's `icon={iconFavorite}`. */
export interface ImportedProp {
  prop: string;
  /** The export the code imports and passes, `iconFavorite`. */
  name: string;
  /** What the preview passes: that export's value. */
  value: unknown;
}

/** A page section of its own, after Variants: Icon's "All icons". */
export interface ExtraSection {
  id: string;
  title: string;
  Component: ComponentType;
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
  demo?: ManifestDemo;
  /** A string is editable through a `children` text control; ChildSpec[] renders parts. */
  children?: string | readonly ChildSpec[];
  /**
   * Child parts worked out from the full control state (defaults merged in), in place of `children`, for a page
   * whose child depends on a control (Field's Input or Select). A manifest has `children` or this, never both.
   */
  deriveChildren?: (state: ControlState) => readonly ChildSpec[];
  /** Props every render gets that the page doesn't let you change. They print after the controls' props. */
  fixedProps?: Readonly<Record<string, LiteralValue>>;
  /** Props worked out from the full control state (defaults merged in), joining `fixedProps` for the render and the code. */
  deriveProps?: (state: ControlState) => Readonly<Record<string, LiteralValue>>;
  /** Props passed by name from @bit-ds/react, worked out from the full state (defaults merged in). Printed first as `prop={name}` and added to the import line. */
  importedProps?: (state: ControlState) => readonly ImportedProp[];
  /** The HTML tab's code, in place of the preview's markup: Icon prints its short class form, not the inline svg. Gets the full state. */
  html?: (state: ControlState) => string;
  /** A section only this page has, placed after Variants. */
  extraSection?: ExtraSection;
  presets?: readonly Preset[];
  /** Compound parts documented on this page; the import line lists them. */
  parts?: readonly string[];
  /** Page content beyond the playground: badges, usage, props and accessibility. */
  docs: ManifestDocs;
  /**
   * The component needs React to work (state, storage, the clipboard), so its page offers React code only.
   * Every other component's markup works as plain HTML with bit's CSS, and its page offers an HTML tab.
   * True, or true for some states: the HTML tab is hidden then.
   */
  interactive?: boolean | ((state: ControlState) => boolean);
}
