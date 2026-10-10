import { COLORS, IconButton, SIZES, VARIANTS } from '@bit-ds/react';
import type { ControlState, Manifest } from './types';
import { exportNameFor, findIcon, iconHtml, ICONS_CSS_IMPORT, PLAYGROUND_ICONS } from '../pages/icons/iconCatalog';

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function chosen(state: ControlState) {
  return findIcon(String(state.iconName));
}

export const iconButton: Manifest = {
  name: 'IconButton',
  slug: 'iconbutton',
  group: 'components',
  related: ['button', 'icon', 'tooltip'],
  component: IconButton,
  description: 'A square button with one icon. Its label is the name screen readers hear; a tooltip can show it on hover.',
  controls: [
    { kind: 'select', prop: 'iconName', values: [...PLAYGROUND_ICONS], default: 'delete', label: 'Icon', virtual: true },
    { kind: 'text', prop: 'label', default: 'Delete', alwaysPrint: true },
    { kind: 'boolean', prop: 'iconFilled', default: false, label: 'Fill' },
    { kind: 'axis', prop: 'color', values: COLORS, default: 'neutral' },
    { kind: 'axis', prop: 'variant', values: VARIANTS, default: 'outline' },
    { kind: 'axis', prop: 'size', values: SIZES, default: 'md' },
    { kind: 'text', prop: 'tooltip', default: '' },
  ],
  importedProps: (state) => {
    const art = chosen(state);
    return [{ prop: 'icon', name: exportNameFor(art.name), value: art }];
  },
  html: (state) => {
    const { color, variant, size } = state;
    const note = `<!-- Needs ${ICONS_CSS_IMPORT.replace(/;$/, '')} as well as styles.css. A tooltip needs React. -->`;
    const open = `<button type="button" class="bit-iconButton bit-${color} bit-${variant} bit-${size} bit-button" aria-label="${escapeAttr(String(state.label ?? ''))}">`;
    const icon = iconHtml(chosen(state), { size: String(size), filled: state.iconFilled === true });
    return `${note}\n${open}\n  ${icon}\n</button>`;
  },
  presets: [
    { label: 'Danger delete', state: { iconName: 'delete', color: 'danger' } },
    { label: 'With tooltip', state: { tooltip: 'Delete' } },
    { label: 'Primary solid', state: { iconName: 'add', label: 'Add', color: 'primary', variant: 'solid' } },
  ],
  docs: {
    badges: ['Native <button>', 'Square'],
    usage: {
      do: [
        'Always give a label that says the action: "Delete", not "Trash".',
        'Add a tooltip when sighted people might not know the icon.',
      ],
      dont: ['Use an IconButton for an action with no widely known icon. Use a Button with text.'],
    },
    props: [
      { name: 'icon', type: 'IconData', description: 'The icon to draw: an icon export such as iconDelete.' },
      { name: 'label', type: 'string', description: 'The action, as a short phrase. It is the button\'s accessible name (aria-label). Required.' },
      { name: 'iconFilled', type: 'boolean', default: 'false', description: 'Draws the filled version of the icon.' },
      {
        name: 'color',
        className: 'bit-{color}',
        type: "'primary' | 'neutral' | 'success' | 'warning' | 'danger'",
        default: "'neutral'",
        description: 'The color role.',
      },
      { name: 'variant', className: 'bit-{variant}', type: "'solid' | 'outline' | 'ghost'", default: "'outline'", description: 'How much weight the button has.' },
      { name: 'size', className: 'bit-{size}', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'The square is 32, 40 or 48px.' },
      { name: 'tooltip', type: 'ReactNode', description: 'Shows this text in a Tooltip on hover and keyboard focus. No tooltip when left off.' },
    ],
    a11y: [
      'It is a native <button>, named by label (aria-label).',
      'The icon inside is hidden from screen readers.',
      "The tooltip doesn't repeat the name to them.",
      'Keyboard: Tab to it, Enter or Space to press.',
    ],
  },
};
