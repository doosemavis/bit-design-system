import { SIZES, Select } from '@bit-ds/react';
import type { ControlValue, Manifest } from './types';

/** The playground's choices: the five colours, then fruit, so a long list still reads well. */
const LABELS = [
  'Primary',
  'Neutral',
  'Success',
  'Warning',
  'Danger',
  'Apple',
  'Banana',
  'Cherry',
  'Grape',
  'Lemon',
  'Mango',
  'Orange',
  'Peach',
  'Pear',
  'Plum',
  'Kiwi',
  'Lime',
  'Melon',
  'Berry',
  'Fig',
] as const;
const OPTION_COUNT = { min: 1, max: LABELS.length, default: 5 } as const;

/** How many options to list: the control's value floored and clamped to 1–20, or 5 when it isn't a number (an empty field mid-edit). */
export function optionCount(raw: ControlValue | undefined): number {
  const n = Math.floor(Number(raw));
  if (raw === undefined || String(raw).trim() === '' || !Number.isFinite(n)) return OPTION_COUNT.default;
  return Math.min(OPTION_COUNT.max, Math.max(OPTION_COUNT.min, n));
}

export const select: Manifest = {
  name: 'Select',
  slug: 'select',
  group: 'forms',
  component: Select,
  description:
    'Picks one option, or several with `multiple`, from a list that bit draws itself, so it slides down in the bit theme and looks the same in every browser.',
  controls: [
    { kind: 'axis', prop: 'size', values: SIZES, default: 'md' },
    {
      kind: 'number',
      prop: 'optionCount',
      label: 'options',
      default: OPTION_COUNT.default,
      min: OPTION_COUNT.min,
      max: OPTION_COUNT.max,
      step: 1,
      virtual: true,
    },
    { kind: 'boolean', prop: 'multiple', default: false },
    { kind: 'text', prop: 'aria-label', default: 'Color', label: 'aria-label' },
    { kind: 'text', prop: 'placeholder', default: 'Pick colors', alwaysPrint: true },
    { kind: 'boolean', prop: 'invalid', default: false },
    { kind: 'boolean', prop: 'disabled', default: false },
  ],
  deriveProps: (state) => ({
    options: LABELS.slice(0, optionCount(state.optionCount)).map((label) => ({ value: label.toLowerCase(), label })),
  }),
  presets: [
    { label: 'Long list', state: { optionCount: '12' } },
    { label: 'Multi-select', state: { multiple: true, optionCount: '12' } },
    { label: 'Invalid', state: { invalid: true } },
    { label: 'Small', state: { size: 'sm' } },
    { label: 'Disabled', state: { disabled: true } },
  ],
  docs: {
    badges: ['Combobox and listbox', 'Single or multi', 'Full keyboard', 'Themed list'],
    usage: {
      do: [
        'Use Select to pick one of five or more options. Put it in a Field for a visible label.',
        'Pass the choices as options, an array of { value, label }, and read the choice with onValueChange.',
        'Use SegmentedControl instead when there are two to four options and all should show.',
        'Add multiple to let people pick several. Rows show a checkbox, the list stays open while they pick, and the closed box shows the chosen option, or how many when there are several.',
      ],
      dont: [
        'Use a Select for yes or no. Use a Switch.',
        'Use a Select to navigate to another page.',
        'Pass <option> children. Select takes an options array instead.',
        'Use multiple for two to four options that should all show. Use SegmentedControl with multiple instead.',
      ],
    },
    props: [
      {
        name: 'options',
        type: 'readonly SelectOption[], where SelectOption = { value: string; label: ReactNode; disabled?: boolean }',
        description: 'Required. The choices, in order. A disabled option shows faded and cannot be chosen.',
      },
      {
        name: 'multiple',
        type: 'boolean',
        default: 'false',
        description:
          'Pick any number of options. value and defaultValue become string arrays, onValueChange receives a string[] in option order, and each chosen value submits under name. Its props type is SelectMultipleProps. Pass it as a literal: a boolean variable does not type-check.',
      },
      {
        name: 'value',
        type: 'string',
        description:
          'The chosen value, when the parent owns it. Use with onValueChange, or use defaultValue. A value no option has shows the placeholder. With multiple, a string[]; values no option has are not shown and are dropped from the next onValueChange.',
      },
      {
        name: 'onValueChange',
        type: '(value: string) => void, or (value: string[]) => void with multiple',
        description:
          'Called with the new value when the user chooses a different option. Choosing the option already chosen does not call it. With multiple, it is called on every toggle with the chosen values in option order.',
      },
      {
        name: 'defaultValue',
        type: 'string',
        description:
          'The first chosen value, when the Select owns it, and what a form reset puts back. Unset, nothing is chosen. With multiple, a string[]; unset, none are chosen.',
      },
      { name: 'placeholder', type: 'ReactNode', default: "''", description: 'Shown in muted text while nothing is chosen.' },
      {
        name: 'name',
        type: 'string',
        description:
          'The form field name. A hidden native input is always there to carry the value; with a name, the chosen value is submitted under it, as a native select does. With multiple, every chosen value is submitted under it, as a native <select multiple> does.',
      },
      {
        name: 'required',
        type: 'boolean',
        default: 'false',
        description:
          "An empty Select blocks the form's submit: the browser shows its own message at the Select and focus moves to it. Sets aria-required too. A Field's required does the same.",
      },
      {
        name: 'form',
        type: 'string',
        description: 'The id of the form the value belongs to, when the Select sits outside that form. Its reset resets the Select too.',
      },
      { name: 'size', className: 'bit-{size}', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Control height. The class goes on the wrapper.' },
      {
        name: 'aria-label',
        type: 'string',
        description: "Names the select when there's no visible label. Inside a Field, leave it off.",
      },
      {
        name: 'invalid',
        type: 'boolean',
        default: 'false',
        description: 'Marks the choice wrong: aria-invalid="true" (a flag that tells screen readers the choice is wrong) and a danger border.',
      },
      {
        name: 'disabled',
        type: 'boolean',
        default: 'false',
        description: 'Turns the whole control off: it cannot be focused or opened, and submits nothing, as a disabled native select.',
      },
      { name: 'ref', type: 'Ref<HTMLButtonElement>', description: 'Goes to the trigger button. className goes on the wrapper.' },
    ],
    a11y: [
      'A select-only combobox (the WAI-ARIA pattern): a button with role combobox opens a listbox of options, and focus stays on the button the whole time.',
      'Tab moves focus to it. Enter, Space or an arrow key opens the list on the chosen option; typing a letter opens it on the first option that starts with it. Alt+ArrowDown opens the list without moving.',
      'While open, the arrow keys move one option, Home and End go to the first and last, and Page Up and Page Down jump several. Typing jumps to a matching option; typing the same letter again cycles through them.',
      'Enter or Space chooses the active option and closes the list; Alt+ArrowUp chooses the active option and closes it too. Escape closes it without choosing. Tab chooses the active option, closes the list and moves on.',
      'Screen readers announce the combobox by its name (the Field label, or aria-label), then the chosen option, and read each option as it becomes active. The list takes the same name.',
      "Inside a Field it takes the Field's id, hint and error.",
      "A required Select that is empty blocks the form's submit like a native one: the browser shows its own message at the Select and focus moves to it. Escape closes only the list, not a dialog around it, and the list closes when focus leaves.",
      'In forced-colors mode (Windows high contrast), the active option is ringed in the system highlight color and the chosen option is filled with it, so the two never look alike. An invalid select shows a thick 10px start edge instead of the red border. With multiple, the checkbox is drawn in system colors and fills with the highlight color when chosen.',
      'With multiple, the list is marked aria-multiselectable and each option says whether it is chosen. Enter, Space or a click toggles the active option and the list stays open; Escape, Tab, Alt+ArrowUp or a click outside closes it without changing anything.',
      'With multiple, the closed box reads its one chosen option, or "3 selected" when there are several, so screen readers hear the count.',
    ],
  },
  interactive: true,
};
