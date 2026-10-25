import { cloneElement, createElement } from 'react';
import type { ReactElement } from 'react';
import { Avatar, Box, COLORS, SIZES, Stack, Text } from '@bit-ds/react';
import type { AvatarProps } from '@bit-ds/react';
import type { ControlState, Manifest } from './types';
import { ScenePiece } from '../pages/component/passes/ScenePiece';
import { toHtml } from '../code/toHtml';
import { AVATAR_PHOTO, BROKEN_PHOTO, PRINTED_BROKEN, PRINTED_PHOTO } from '../content/avatarPhoto';

const PHOTOS = ['none', 'photo', 'broken'] as const;
type Photo = (typeof PHOTOS)[number];

/** The src each Photo choice renders (data: URIs, so nothing loads from another host), and the path the code shows. */
const SOURCES: Readonly<Record<Exclude<Photo, 'none'>, { render: string; printed: string }>> = {
  photo: { render: AVATAR_PHOTO, printed: PRINTED_PHOTO },
  broken: { render: BROKEN_PHOTO, printed: PRINTED_BROKEN },
};

const photoOf = (state: ControlState): Photo => (PHOTOS as readonly string[]).includes(String(state.photo)) ? (state.photo as Photo) : 'none';

/** The Avatar the state describes, with the src the code shows, for the HTML tab. */
function printedAvatar(state: ControlState): ReactElement {
  const photo = photoOf(state);
  const props: AvatarProps = {
    name: String(state.name),
    color: state.color as AvatarProps['color'],
    size: state.size as AvatarProps['size'],
    shape: state.shape as AvatarProps['shape'],
    flat: state.flat === true,
    src: photo === 'none' ? undefined : SOURCES[photo].printed,
  };
  return createElement(Avatar, props);
}

export const avatar: Manifest = {
  name: 'Avatar',
  slug: 'avatar',
  group: 'components',
  related: ['badge', 'button', 'menu'],
  component: Avatar,
  description: 'A person, as a photo or their initials. With no photo, or one that fails to load, the initials show.',
  controls: [
    { kind: 'text', prop: 'name', default: 'Ada Lovelace', alwaysPrint: true },
    { kind: 'select', prop: 'photo', values: PHOTOS, default: 'none', label: 'Photo', virtual: true, hint: 'broken: a src that fails to load, so the initials stay.' },
    { kind: 'axis', prop: 'color', values: COLORS, default: 'neutral' },
    { kind: 'axis', prop: 'size', values: SIZES, default: 'md' },
    { kind: 'select', prop: 'shape', values: ['circle', 'square', 'pixel'], default: 'circle' },
    { kind: 'boolean', prop: 'flat', default: false },
  ],
  demo: {
    when: (state) => photoOf(state) !== 'none',
    render: (element, state) => {
      const photo = photoOf(state);
      // Keyed by src, so a new choice is a fresh image: a broken one's fallback doesn't carry over.
      return photo === 'none' ? element : cloneElement(element as ReactElement<AvatarProps>, { src: SOURCES[photo].render, key: photo });
    },
    code: {
      reactImports: [],
      bitImports: [],
      setup: [],
      props: (state) => {
        const photo = photoOf(state);
        return photo === 'none' ? [] : [`src="${SOURCES[photo].printed}"`];
      },
      wrap: (jsx) => jsx,
    },
  },
  html: (state) => toHtml(printedAvatar(state)),
  presets: [
    { label: 'With a photo', state: { photo: 'photo' } },
    { label: 'Photo fails to load', state: { photo: 'broken', name: 'Grace Hopper', color: 'primary' } },
    { label: 'Pixel player', state: { shape: 'pixel', color: 'primary', size: 'lg', name: 'Player One' } },
    { label: 'Square, flat', state: { shape: 'square', flat: true, color: 'success', name: 'Alan Turing' } },
  ],
  anatomy: {
    parts: [
      {
        label: 'Edge',
        selector: '.bit-avatar',
        tokens: ['--bit-color-line'],
        side: 'right',
        touch: { kind: 'ring', edge: 'top', at: 0.5 },
        off: { '--bit-color-line': 'transparent' },
      },
      {
        label: 'Face',
        selector: '.bit-avatar',
        tokens: ['--bit-color-neutral'],
        side: 'left',
        touch: { kind: 'fill', edge: 'left', at: 0.25 },
        off: { '--bit-color-neutral': 'transparent' },
      },
      {
        label: 'Initials',
        selector: '.bit-avatar__initials',
        tokens: ['--bit-font-body', '--bit-weight-bold'],
        side: 'right',
        touch: { kind: 'text', edge: 'bottom', at: 0.5, leave: 'right' },
      },
      {
        label: 'Size',
        selector: '.bit-avatar',
        tokens: ['--bit-control-height-md'],
        side: 'left',
        touch: { kind: 'bracket', edge: 'left', at: 0.75 },
      },
      {
        label: 'Shadow',
        selector: '.bit-avatar',
        tokens: ['--bit-shadow-sm'],
        side: 'right',
        touch: { kind: 'strip', edge: 'bottom', at: 0.5 },
        off: { '--bit-shadow-sm': 'none' },
      },
    ],
    states: [
      { label: 'Default', state: {} },
      { label: 'Square', state: { shape: 'square' } },
      { label: 'Pixel', state: { shape: 'pixel' } },
    ],
    scene: {
      caption: 'In use: beside a comment',
      render: (instance) =>
        createElement(
          Box,
          { padding: 24, style: { border: '2px solid var(--bit-color-text)' } },
          createElement(
            Stack,
            { direction: 'row', gap: 16, align: 'start' },
            instance,
            createElement(
              ScenePiece,
              null,
              createElement(
                Stack,
                { gap: 4 },
                createElement(Text, { weight: 'bold' }, 'Ada Lovelace'),
                createElement(Text, null, 'The new color tokens look great. Shipping them today.'),
              ),
            ),
          ),
        ),
    },
  },
  docs: {
    badges: ['role="img"', 'Photo or initials', 'Three shapes', 'Button heights'],
    usage: {
      do: [
        "Give every Avatar the person's name: screen readers hear it, and the initials come from it.",
        'Pass aria-hidden when the name is already written beside the Avatar, so it isn’t heard twice.',
        'Set one color for the initials across a list. The color is a role, not a person.',
      ],
      dont: [
        'Use an Avatar for a logo or an icon. Use Icon, or an <img> with its own alt.',
        "Make an Avatar clickable on its own. Put it in a Button or a Menu's trigger, named for what it does.",
      ],
    },
    props: [
      { name: 'name', type: 'string', description: 'Required. The name screen readers hear, and the source of the initials: the first letter of the first and last word.' },
      { name: 'src', type: 'string', description: 'The photo. With none, or when it fails to load, the initials show; a new src is tried again.' },
      {
        name: 'color',
        className: 'bit-{color}',
        type: "'primary' | 'neutral' | 'success' | 'warning' | 'danger'",
        default: "'neutral'",
        description: 'The fill behind the initials.',
      },
      {
        name: 'size',
        className: 'bit-{size}',
        type: "'sm' | 'md' | 'lg'",
        default: "'md'",
        description: 'The control heights, 32, 40 and 48px, so an Avatar lines up with a Button beside it.',
      },
      {
        name: 'shape',
        type: "'circle' | 'square' | 'pixel'",
        default: "'circle'",
        description: "circle; square, the 6px radius; pixel, square corners and the pixel font. Rendered as data-shape, because shape isn't a shared axis.",
      },
      { name: 'flat', type: 'boolean', default: 'false', description: 'Drops the hard shadow for a flat look. Class: bit-flat, so className="bit-flat" does the same.' },
    ],
    a11y: [
      'The Avatar is one image, role="img", named by name, whether the photo or the initials show. The photo inside has an empty alt, and the initials are hidden from screen readers.',
      'A photo that fails to load is removed, so no broken-image icon shows; the initials are already under it.',
    ],
  },
};
