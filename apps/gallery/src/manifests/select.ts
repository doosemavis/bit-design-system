import { SIZES, Select } from '@bit-ds/react';
import type { Manifest } from './types';

/** The playground's choices; the code prints them as one `const options`. */
const OPTIONS = [
  { value: 'primary', label: 'Primary' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'success', label: 'Success' },
  { value: 'warning', label: 'Warning' },
  { value: 'danger', label: 'Danger' },
];

export const select: Manifest = {
  name: 'Select',
  slug: 'select',
  group: 'forms',
  component: Select,
  description: 'Picks one option from a list that bit draws itself, so it slides down in the bit theme and looks the same in every browser.',
  controls: [
    { kind: 'axis', prop: 'size', values: SIZES, default: 'md' },
    { kind: 'text', prop: 'aria-label', default: 'Color', label: 'aria-label' },
    { kind: 'text', prop: 'placeholder', default: 'Pick a color', alwaysPrint: true },
    { kind: 'boolean', prop: 'invalid', default: false },
    { kind: 'boolean', prop: 'disabled', default: false },
  ],
  fixedProps: { options: OPTIONS },
  presets: [
    { label: 'Invalid', state: { invalid: true } },
    { label: 'Small', state: { size: 'sm' } },
    { label: 'Disabled', state: { disabled: true } },
  ],
  docs: {
    badges: ['Combobox and listbox', 'Full keyboard', 'Themed list'],
    usage: {
      do: [
        'Use Select to pick one of five or more options. Put it in a Field for a visible label.',
        'Pass the choices as options, an array of { value, label }, and read the choice with onValueChange.',
        'Use SegmentedControl instead when there are two to four options and all should show.',
      ],
      dont: [
        'Use a Select for yes or no. Use a Switch.',
        'Use a Select to navigate to another page.',
        'Pass <option> children. Select takes an options array instead.',
      ],
    },
    props: [
      {
        name: 'options',
        type: 'readonly SelectOption[], where SelectOption = { value: string; label: ReactNode; disabled?: boolean }',
        description: 'Required. The choices, in order. A disabled option shows faded and cannot be chosen.',
      },
      {
        name: 'value',
        type: 'string',
        description: 'The chosen value, when the parent owns it. Use with onValueChange, or use defaultValue. A value no option has shows the placeholder.',
      },
      {
        name: 'onValueChange',
        type: '(value: string) => void',
        description: 'Called with the new value when the user chooses a different option. Choosing the option already chosen does not call it.',
      },
      {
        name: 'defaultValue',
        type: 'string',
        description: 'The first chosen value, when the Select owns it, and what a form reset puts back. Unset, nothing is chosen.',
      },
      { name: 'placeholder', type: 'ReactNode', default: "''", description: 'Shown in muted text while nothing is chosen.' },
      {
        name: 'name',
        type: 'string',
        description:
          'The form field name. A hidden native input is always there to carry the value; with a name, the chosen value is submitted under it, as a native select does.',
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
      'In forced-colors mode (Windows high contrast), the active option is ringed in the system highlight color and the chosen option is filled with it, so the two never look alike. An invalid select shows a thick 10px start edge instead of the red border.',
    ],
  },
  interactive: true,
};
