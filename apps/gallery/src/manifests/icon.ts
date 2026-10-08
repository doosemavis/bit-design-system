import { COLORS, Icon, SIZES } from '@bit-ds/react';
import type { IconData } from '@bit-ds/react';
import type { ControlState, Manifest } from './types';
import { AllIcons } from '../pages/icons/AllIcons';
import { exportNameFor, findIcon, iconHtml, ICONS_CSS_IMPORT } from '../pages/icons/iconCatalog';

/** The icons the playground offers. The All icons section lists every one. */
const PLAYGROUND_ICONS = ['favorite', 'home', 'search', 'settings', 'delete', 'check-circle', 'warning', 'mail', 'person', 'download', 'add', 'close'];

/** The chosen icon: the regular or fill version of the picked name. */
function chosen(state: ControlState): IconData {
  const pair = findIcon(String(state.iconName));
  return state.filled === true ? pair.fill : pair.regular;
}

export const icon: Manifest = {
  name: 'Icon',
  slug: 'icon',
  group: 'components',
  component: Icon,
  description: 'A Material Symbols icon, as a React component or plain classes. 300 icons, each with a fill version.',
  controls: [
    { kind: 'select', prop: 'iconName', values: PLAYGROUND_ICONS, default: 'favorite', label: 'Icon', virtual: true },
    { kind: 'boolean', prop: 'filled', default: false, label: 'Fill', virtual: true },
    { kind: 'axis', prop: 'color', values: ['none', ...COLORS], default: 'none' },
    { kind: 'axis', prop: 'size', values: SIZES, default: 'md' },
    { kind: 'text', prop: 'label', default: '' },
  ],
  importedProps: (state) => {
    const art = chosen(state);
    return [{ prop: 'icon', name: exportNameFor(art.name), value: art }];
  },
  html: (state) => {
    const color = state.color === 'none' ? undefined : String(state.color);
    const label = String(state.label ?? '');
    const note = `<!-- Needs ${ICONS_CSS_IMPORT.replace(/;$/, '')} as well as styles.css -->`;
    return `${note}\n${iconHtml(chosen(state), { color, size: String(state.size), label: label || undefined })}`;
  },
  extraSection: { id: 'section-all-icons', title: 'All icons', Component: AllIcons },
  presets: [
    { label: 'Danger delete', state: { iconName: 'delete', color: 'danger' } },
    { label: 'Filled heart', state: { iconName: 'favorite', filled: true, color: 'danger' } },
  ],
  docs: {
    badges: ['Inline <svg>', 'Apache 2.0 artwork'],
    usage: {
      do: [
        'Put an icon next to a word that says the same thing: a trash can beside "Delete".',
        'Give an icon a label when it carries meaning on its own, such as a status with no text.',
        'For an icon-only Button, name the Button: <Button aria-label="Close"><Icon icon={iconClose} /></Button>.',
      ],
      dont: [
        'Use an icon as the only sign of an error or a state. Say it in words too.',
        'Label a decorative icon that sits next to its own text; screen readers would read it twice.',
      ],
    },
    props: [
      { name: 'icon', type: 'IconData', description: 'The icon to draw: an icon export such as iconFavorite or iconFavoriteFill. Adds the class bit-icon-{name}.' },
      {
        name: 'color',
        className: 'bit-{color}',
        type: "'primary' | 'neutral' | 'success' | 'warning' | 'danger'",
        description: 'The color role. Left off, the icon takes the color of the text around it.',
      },
      { name: 'size', className: 'bit-{size}', type: "'sm' | 'md' | 'lg'", default: "'md'", description: '16, 20 or 24px.' },
      { name: 'label', type: 'string', description: 'What the icon means. With it, screen readers announce an image with this name; without it, the icon is hidden from them.' },
    ],
    a11y: [
      'Without a label the svg is aria-hidden, so the words beside it carry the meaning.',
      'With a label it is role="img" with that aria-label.',
      'It is never focusable (focusable="false"), so keyboard users never land on it.',
      'It draws in currentColor, so it follows the text colour, including in Windows high-contrast mode. The class form switches to the system text colour there.',
    ],
  },
};
