import { Button, COLORS, SIZES, VARIANTS } from '@bit-ds/react';
import type { Manifest } from './types';

export const button: Manifest = {
  name: 'Button',
  slug: 'button',
  group: 'components',
  component: Button,
  description: 'The primary action. Three axes, two booleans, and asChild for links.',
  controls: [
    { kind: 'axis', prop: 'color', values: COLORS, default: 'primary' },
    { kind: 'axis', prop: 'variant', values: VARIANTS, default: 'solid' },
    { kind: 'axis', prop: 'size', values: SIZES, default: 'md' },
    { kind: 'boolean', prop: 'loading', default: false },
    { kind: 'boolean', prop: 'disabled', default: false },
  ],
  children: 'Save',
  presets: [
    { label: 'Danger outline', state: { color: 'danger', variant: 'outline' } },
    { label: 'Ghost small', state: { variant: 'ghost', size: 'sm' } },
    { label: 'Loading', state: { loading: true } },
  ],
  docs: {
    badges: ['Native <button>', 'Keyboard ready', 'asChild for links'],
    usage: {
      do: [
        'Use one solid Button per view, for the main action (Save, Send, Create).',
        'Use outline or ghost for the other actions beside it.',
        'Label it with a verb that says what happens: "Delete project", not "OK".',
      ],
      dont: [
        "Line up three solid Buttons; the eye can't pick one.",
        "Use a Button to go to another page. That's a Link, or Button asChild around your router's link.",
        'Leave a Button with no text and no aria-label.',
      ],
    },
    props: [
      {
        name: 'color',
        className: 'bit-{color}',
        type: "'primary' | 'neutral' | 'success' | 'warning' | 'danger'",
        default: "'primary'",
        description: 'The color role. Reads the --bit-color-{color} tokens: named design values, such as --bit-color-primary.',
      },
      {
        name: 'variant',
        className: 'bit-{variant}',
        type: "'solid' | 'outline' | 'ghost'",
        default: "'solid'",
        description: 'How loud it is. Solid for the one main action, outline and ghost for the rest.',
      },
      { name: 'size', className: 'bit-{size}', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Height and padding.' },
      {
        name: 'loading',
        type: 'boolean',
        default: 'false',
        description:
          'Shows a spinner and sets aria-busy and aria-disabled. It blocks clicks, Enter and Space, but the button keeps focus and stays in the Tab order, so a click that starts the work never drops focus to the page.',
      },
      {
        name: 'disabled',
        type: 'boolean',
        default: 'false',
        description:
          "The native disabled attribute: it can't be clicked or focused. With asChild it becomes aria-disabled instead, because a link has no disabled attribute; clicks, Enter and Space are blocked, so the link isn't followed.",
      },
      {
        name: 'asChild',
        type: 'boolean',
        default: 'false',
        description: "Puts Button's classes on its one child (an <a>, a router link) instead of rendering a <button>.",
      },
      { name: 'children', type: 'ReactNode', description: 'The label.' },
    ],
    a11y: [
      'Renders a native <button type="button">, so Enter and Space press it and it never submits a form by surprise.',
      'loading sets aria-busy and aria-disabled but not disabled, so a focused button keeps focus while it works, and screen readers announce it as busy and unavailable. The label stays, so they still announce the action.',
      'A disabled or loading Button with asChild stays in the Tab order (aria-disabled), and a click, Enter or Space does nothing: the link is not followed.',
      "The focus ring comes from reset.css, bit's base stylesheet, and nothing removes it.",
      'A Button with only an icon needs an aria-label.',
    ],
    emptyChildrenError: 'A Button needs text or an aria-label, or screen readers announce just "button".',
  },
};
