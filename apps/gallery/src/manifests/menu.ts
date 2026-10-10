import { createElement } from 'react';
import { Button, Menu } from '@bit-ds/react';
import type { ChildSpec, Manifest } from './types';
import { MenuExamples } from '../pages/menu/MenuExamples';


const ITEMS: readonly ChildSpec[] = [
  { component: 'MenuItem', props: { shortcut: '⌘N' }, children: 'New game' },
  { component: 'MenuItem', props: { shortcut: '⌘S' }, children: 'Save' },
  { component: 'MenuItem', props: { disabled: true }, children: 'Duplicate' },
  { component: 'MenuSeparator' },
  { component: 'MenuItem', props: { danger: true }, children: 'Delete save' },
];

export const menu: Manifest = {
  name: 'Menu',
  slug: 'menu',
  group: 'components',
  related: ['select', 'dialog', 'iconbutton'],
  component: Menu,
  description: 'A list of actions that opens from a button, in a small retro window with a purple title strip.',
  controls: [
    { kind: 'text', prop: 'title', default: 'File', alwaysPrint: true },
    { kind: 'axis', prop: 'size', values: ['sm', 'md'], default: 'md' },
    { kind: 'select', prop: 'align', values: ['start', 'end'], default: 'start' },
  ],
  children: ITEMS,
  parts: ['MenuItem', 'MenuSeparator'],
  // The trigger: an outline neutral Button with the title's words.
  elementProps: (state) => [
    {
      prop: 'trigger',
      value: createElement(Button, { variant: 'outline', color: 'neutral' }, String(state.title)),
      jsx: `<Button variant="outline" color="neutral">${String(state.title)}</Button>`,
      imports: ['Button'],
    },
  ],
  interactive: true,
  extraSection: { id: 'section-examples', title: 'Examples', Component: MenuExamples },
  docs: {
    badges: ['WAI-ARIA menu button', 'Top layer', 'Retro window'],
    usage: {
      do: [
        'Use a Menu for actions on one thing (a file, a row, a card) that would crowd the page as buttons.',
        'Give it a title that says what the actions act on: "File", "Level 3". It names the menu for screen readers.',
        'Put a destructive action last, after a MenuSeparator, with danger.',
      ],
      dont: [
        'Use a Menu to pick a value for a form. Use a Select: it shows the choice and submits it.',
        'Put a whole page of navigation in a Menu on a wide screen. Use a Navbar; it folds its links into a Menu only when narrow.',
        'Put inputs or text to read inside it. It closes on the first choice; use a Dialog.',
      ],
    },
    props: [
      { name: 'trigger', type: 'ReactElement', description: 'Required. The one element that opens the menu (a Button, an IconButton). It keeps its own props, handlers and ref.' },
      { name: 'title', type: 'ReactNode', description: 'Required. The words in the purple title strip. They name the menu (aria-labelledby).' },
      { name: 'size', className: 'bit-{size}', type: "'sm' | 'md'", default: "'md'", description: 'Text and rows: small or medium text, with a 16 or 20px icon.' },
      {
        name: 'align',
        type: "'start' | 'end'",
        default: "'start'",
        description: "Which of the trigger's edges the window lines up with. Start is the left in left-to-right pages and the right in right-to-left ones.",
      },
      { name: 'open', type: 'boolean', description: 'Whether it is open, when the parent owns it. Pair it with onOpenChange.' },
      { name: 'defaultOpen', type: 'boolean', default: 'false', description: 'Whether it starts open, when the Menu owns it. It moves focus to the first item.' },
      { name: 'onOpenChange', type: '(open: boolean) => void', description: 'Called with true when it asks to open and false when it asks to close.' },
      { name: 'children', type: 'ReactNode', description: 'MenuItem and MenuSeparator.' },
      {
        name: 'MenuItem',
        type: 'MenuItemProps',
        description:
          'One action: icon (an iconX export), shortcut (text shown at the end), danger, disabled, onSelect, and asChild to render a link as the item. Call event.preventDefault() in onSelect to keep the menu open.',
      },
      { name: 'MenuSeparator', type: 'HTMLAttributes', description: 'A line between groups of items.' },
      { name: 'ref', type: 'Ref<HTMLDivElement>', description: 'Goes to the window (class bit-menu), which takes className and every other prop.' },
    ],
    a11y: [
      'The WAI-ARIA menu button pattern: the trigger has aria-haspopup="menu", aria-expanded and aria-controls; the list is role="menu" and each item role="menuitem".',
      'Enter, Space or ArrowDown on the trigger open it on the first item, and ArrowUp on the last. Arrows move between items and wrap; Home and End go to the ends; typing a letter goes to the next item starting with it.',
      'Enter or Space chooses the item and closes the menu, and focus goes back to the trigger. Esc closes it the same way without choosing.',
      'Tab, Shift+Tab and a click outside close it; focus goes where it was going.',
      'Disabled items stay in the list with aria-disabled, so they are announced, but the arrows skip them.',
      'The title strip names the menu; it is not an item.',
      'In forced-colors mode (Windows high contrast) the active item takes the system highlight. With reduced motion it appears without its two-step entrance.',
    ],
  },
};
