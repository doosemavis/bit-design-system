/** Every public class and custom property starts with this. */
export const PREFIX = 'bit';

/** The five color roles. Same words as the `color` prop and the `bit-{color}` class. */
export const COLORS = ['primary', 'neutral', 'success', 'warning', 'danger'] as const;
/** Control sizes. Same words as the `size` prop and the `bit-{size}` class. */
export const SIZES = ['sm', 'md', 'lg'] as const;
/**
 * Text sizes in px, all even. Same numbers as Text's and Heading's `size` prop, their `data-size` attribute and
 * the `--bit-text-{n}px` token. 14 is the smallest text. The names describe power-up's scale; revisit if a theme
 * needs another.
 */
export const TEXT_SIZES = [14, 16, 18, 24, 32, 40] as const;
/**
 * The old odd sizes, deprecated in 0.1.8 and removed in 0.2.0. Each still works and renders as the size it maps
 * to, and its `--bit-text-{n}px` token is an alias of that size's token.
 */
export const DEPRECATED_TEXT_SIZES = [11, 13, 15] as const;
/** What each deprecated size renders as: 11 and 13 → 14, 15 → 16. */
export const DEPRECATED_TEXT_SIZE_TO = { 11: 14, 13: 14, 15: 16 } as const;
/**
 * Heading sizes in px: every 2px from 20 to 44, all in the display face. Same numbers as Heading's `size` prop, its
 * `data-size` attribute and the `--bit-heading-{n}px` token. The size also picks the tag (40 and up h1, 32 to 38
 * h2, 26 to 30 h3, 24 h4, 22 h5, 20 h6).
 */
export const HEADING_SIZES = [20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44] as const;
/** Space in px. Same numbers as Stack's `gap` prop, its `data-gap` attribute and the `--bit-space-{n}px` token. */
export const SPACE_STEPS = [4, 8, 12, 16, 24, 32, 48, 64] as const;
/** Corner radii in px, as `--bit-radius-{n}px`. `--bit-radius-full` (the pill) names a shape, not a size. */
const RADII = [6, 10, 14] as const;
/** Syntax-color kinds for code. CodeBlock's tokenizer emits these; each reads `--bit-code-{kind}`. */
export const CODE_KINDS = ['text', 'keyword', 'string', 'tag', 'component', 'attr', 'punct', 'comment', 'number', 'prop'] as const;

export type Color = (typeof COLORS)[number];
export type Size = (typeof SIZES)[number];
export type TextSize = (typeof TEXT_SIZES)[number];
/** @deprecated 11, 13 and 15: use 14 or 16. Removed in 0.2.0. */
export type DeprecatedTextSize = (typeof DEPRECATED_TEXT_SIZES)[number];
export type HeadingSize = (typeof HEADING_SIZES)[number];
/** The heading tags a Heading size can render. */
export type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
export type SpaceStep = (typeof SPACE_STEPS)[number];

/**
 * The tag a Heading size renders: 40 and up h1, 32 to 38 h2, 26 to 30 h3, 24 h4, 22 h5, 20 h6. Heading uses it,
 * and so does the gallery's Typography page, so the two never disagree.
 */
export function headingTag(size: HeadingSize): HeadingTag {
  if (size >= 40) return 'h1';
  if (size >= 32) return 'h2';
  if (size >= 26) return 'h3';
  if (size === 24) return 'h4';
  if (size === 22) return 'h5';
  return 'h6';
}

const token = (category: string, ...parts: (string | number)[]) =>
  `--${PREFIX}-${[category, ...parts].join('-')}`;

const px = (n: number) => `${n}px`;

const colorRoleTokens = ['bg', 'surface', 'ink', 'text', 'text-muted', 'selection', 'line', 'shadow'].map((role) =>
  token('color', role),
);

/**
 * Component roles: the accent (CodeBlock's border and bar rule), link text, field error text, the Switch thumb when on, Table stripes, and Code text inside a Table.
 * Each has one job, so a theme can tune it without moving primary, danger or the surfaces.
 */
const componentColorTokens = ['accent', 'link', 'link-visited', 'danger-text', 'knob', 'stripe', 'code-text'].map((role) => token('color', role));

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
];

const typeTokens = [
  ...['display', 'body', 'pixel', 'mono'].map((f) => token('font', f)),
  ...TEXT_SIZES.map((n) => token('text', px(n))),
  ...DEPRECATED_TEXT_SIZES.map((n) => token('text', px(n))),
  ...HEADING_SIZES.map((n) => token('heading', px(n))),
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
];

const focusTokens = ['color', 'width', 'offset'].map((part) => token('focus', 'ring', part));

/**
 * The inline Code pill has its own text, background and selection colours, so it can stand apart from the
 * CodeBlock panel, and selected text never matches the pill's text colour. on-tint is its background on
 * tinted surfaces (Alerts, Card footers, hovered Links), which sit close to the pill's dark-mode grey.
 */
const inlineCodeTokens = [
  token('code', 'inline', 'bg'),
  token('code', 'inline', 'bg', 'on-tint'),
  token('code', 'inline', 'text'),
  token('code', 'inline', 'selection'),
];

const codeTokens = [token('code', 'bg'), ...CODE_KINDS.map((kind) => token('code', kind)), ...inlineCodeTokens];

/**
 * The BitLogo's coin golds and the violet of 64-bit's hard drop. Fixed brand colors, so a palette change
 * never recolors the logo.
 */
const logoTokens = ['coin', 'coin-light', 'coin-shade', 'coin-deep', 'violet'].map((part) => token('logo', part));

/**
 * The complete tier-2 token set. Every theme must declare every one of these.
 * Components read only these names (never tier-1 `--bit-palette-*` values).
 */
export const SEMANTIC_TOKENS: readonly string[] = [
  ...colorRoleTokens,
  ...componentColorTokens,
  ...colorTokens,
  ...shapeTokens,
  ...typeTokens,
  ...spaceTokens,
  ...controlTokens,
  ...motionTokens,
  ...focusTokens,
  ...codeTokens,
  ...logoTokens,
];

/**
 * The tokens a theme's dark block overrides (`[data-mode="dark"]` in the theme file). Everything
 * else is shared by both modes. The completeness test requires the dark block to declare exactly these.
 */
export const MODE_TOKENS: readonly string[] = [
  token('color', 'bg'),
  token('color', 'surface'),
  token('color', 'text'),
  token('color', 'text-muted'),
  token('color', 'line'),
  token('color', 'shadow'),
  token('color', 'neutral'),
  token('color', 'neutral', 'contrast'),
  token('color', 'neutral', 'hover'),
  token('color', 'neutral', 'soft'),
  token('color', 'stripe'),
  ...['primary', 'success', 'warning', 'danger'].map((color) => token('color', color, 'soft')),
  token('shadow', 'inset'),
  token('code', 'bg'),
  ...inlineCodeTokens,
  token('focus', 'ring', 'color'),
  token('focus', 'ring', 'offset'),
  token('color', 'accent'),
  token('color', 'link'),
  token('color', 'link-visited'),
  token('color', 'danger-text'),
  token('color', 'code-text'),
];
