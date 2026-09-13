/** Every public class and custom property starts with this. */
export const PREFIX = 'bit';

/** The five color roles. Same words as the `tone` prop and the `bit-{tone}` class. */
export const TONES = ['primary', 'neutral', 'success', 'warning', 'danger'] as const;
/** Control sizes. Same words as the `size` prop and the `bit-{size}` class. */
export const SIZES = ['sm', 'md', 'lg'] as const;
/** Text sizes: the control sizes plus the ends of the type scale. */
export const TEXT_SIZES = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const;
/** Spacing steps on a 4px scale: 4, 8, 12, 16, 24, 32, 48, 64. */
export const SPACE_STEPS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export type Tone = (typeof TONES)[number];
export type Size = (typeof SIZES)[number];
export type TextSize = (typeof TEXT_SIZES)[number];
export type SpaceStep = (typeof SPACE_STEPS)[number];

const token = (category: string, ...parts: (string | number)[]) =>
  `--${PREFIX}-${[category, ...parts].join('-')}`;

const colorRoleTokens = ['bg', 'surface', 'ink', 'text', 'text-muted', 'focus'].map((role) => token('color', role));

const toneTokens = TONES.flatMap((tone) => [
  token('color', tone),
  token('color', tone, 'contrast'),
  token('color', tone, 'hover'),
  token('color', tone, 'soft'),
]);

const shapeTokens = [
  token('border', 'width'),
  ...['sm', 'md', 'lg', 'full'].map((s) => token('radius', s)),
  ...['sm', 'md', 'lg', 'inset'].map((s) => token('shadow', s)),
  token('gloss'),
];

const typeTokens = [
  ...['display', 'body', 'pixel'].map((f) => token('font', f)),
  ...TEXT_SIZES.map((s) => token('text', s)),
  token('leading', 'tight'),
  token('leading', 'normal'),
  token('weight', 'normal'),
  token('weight', 'bold'),
];

const spaceTokens = SPACE_STEPS.map((n) => token('space', n));

const controlTokens = [
  ...SIZES.map((s) => token('control', 'height', s)),
  ...SIZES.map((s) => token('control', 'padding', s)),
];

const motionTokens = [
  token('press', 'offset'),
  token('duration', 'fast'),
  token('duration', 'normal'),
  token('motion', 'power-up'),
];

/**
 * The complete tier-2 token set. Every theme must declare every one of these.
 * Components read only these names (never tier-1 `--bit-palette-*` values).
 */
export const SEMANTIC_TOKENS: readonly string[] = [
  ...colorRoleTokens,
  ...toneTokens,
  ...shapeTokens,
  ...typeTokens,
  ...spaceTokens,
  ...controlTokens,
  ...motionTokens,
];
