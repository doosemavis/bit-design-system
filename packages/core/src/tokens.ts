/** Every public class and custom property starts with this. */
export const PREFIX = 'bit';

/** The five color roles. Same words as the `color` prop and the `bit-{color}` class. */
export const COLORS = ['primary', 'neutral', 'success', 'warning', 'danger'] as const;
/** Control sizes. Same words as the `size` prop and the `bit-{size}` class. */
export const SIZES = ['sm', 'md', 'lg'] as const;
/**
 * Text sizes in px. Same numbers as Text's `size` prop, its `data-size` attribute and the
 * `--bit-text-{n}px` token. The names describe power-up's scale; revisit if a theme needs another.
 */
export const TEXT_SIZES = [11, 13, 15, 18, 24, 32] as const;
/** Space in px. Same numbers as Stack's `gap` prop, its `data-gap` attribute and the `--bit-space-{n}px` token. */
export const SPACE_STEPS = [4, 8, 12, 16, 24, 32, 48, 64] as const;
/** Corner radii in px, as `--bit-radius-{n}px`. `--bit-radius-full` (the pill) names a shape, not a size. */
const RADII = [6, 10, 14] as const;
/** Syntax-color kinds for code. CodeBlock's tokenizer (PR2) emits these; each reads `--bit-code-{kind}`. */
export const CODE_KINDS = ['text', 'keyword', 'string', 'tag', 'component', 'attr', 'punct', 'comment', 'number', 'prop'] as const;

export type Color = (typeof COLORS)[number];
export type Size = (typeof SIZES)[number];
export type TextSize = (typeof TEXT_SIZES)[number];
export type SpaceStep = (typeof SPACE_STEPS)[number];

const token = (category: string, ...parts: (string | number)[]) =>
  `--${PREFIX}-${[category, ...parts].join('-')}`;

const px = (n: number) => `${n}px`;

const colorRoleTokens = ['bg', 'surface', 'ink', 'text', 'text-muted', 'focus', 'selection'].map((role) =>
  token('color', role),
);

const colorTokens = COLORS.flatMap((color) => [
  token('color', color),
  token('color', color, 'contrast'),
  token('color', color, 'hover'),
  token('color', color, 'soft'),
]);

const shapeTokens = [
  token('border', 'width'),
  ...RADII.map((n) => token('radius', px(n))),
  token('radius', 'full'),
  ...['sm', 'md', 'lg', 'inset'].map((s) => token('shadow', s)),
  token('gloss'),
];

const typeTokens = [
  ...['display', 'body', 'pixel', 'mono'].map((f) => token('font', f)),
  ...TEXT_SIZES.map((n) => token('text', px(n))),
  token('leading', 'tight'),
  token('leading', 'normal'),
  token('weight', 'normal'),
  token('weight', 'bold'),
];

const spaceTokens = SPACE_STEPS.map((n) => token('space', px(n)));

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

const codeTokens = [token('code', 'bg'), ...CODE_KINDS.map((kind) => token('code', kind))];

/** The BitLogo's coin golds. Fixed brand colors, so a palette change never recolors the logo. */
const logoTokens = ['coin', 'coin-light', 'coin-shade', 'coin-deep'].map((part) => token('logo', part));

/**
 * The complete tier-2 token set. Every theme must declare every one of these.
 * Components read only these names (never tier-1 `--bit-palette-*` values).
 */
export const SEMANTIC_TOKENS: readonly string[] = [
  ...colorRoleTokens,
  ...colorTokens,
  ...shapeTokens,
  ...typeTokens,
  ...spaceTokens,
  ...controlTokens,
  ...motionTokens,
  ...codeTokens,
  ...logoTokens,
];
