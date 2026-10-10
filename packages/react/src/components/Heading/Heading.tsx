import { createElement, forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { HEADING_SIZES } from '../../system/axes';
import type { HeadingSize } from '../../system/axes';
import { dataValue, toClasses } from '../../system/toClasses';
import { dropLegacyColor } from '../../system/dropLegacyColor';
import { InlineText } from '../../system/inlineText';
import { warnDeprecated } from '../../system/warnDeprecated';

/** Deprecated: the old `level` prop and the old `size={level}` form. */
const LEVELS = [1, 2, 3, 4, 5, 6] as const;

export type { HeadingSize };

/** @deprecated Heading's size picks the tag now. Removed in 0.2.0. */
export type HeadingLevel = (typeof LEVELS)[number];

type HeadingTag = `h${HeadingLevel}`;

/** The tag each size renders: 40 and up h1, 32 to 38 h2, 26 to 30 h3, 24 h4, 22 h5, 20 h6. */
function tagFor(size: HeadingSize): HeadingTag {
  if (size >= 40) return 'h1';
  if (size >= 32) return 'h2';
  if (size >= 26) return 'h3';
  if (size === 24) return 'h4';
  if (size === 22) return 'h5';
  return 'h6';
}

/** The smallest size that renders each level's tag: what to write in place of a deprecated level. */
const LEVEL_SIZE: Record<HeadingLevel, HeadingSize> = { 1: 40, 2: 32, 3: 26, 4: 24, 5: 22, 6: 20 };

export interface HeadingProps extends Omit<HTMLAttributes<HTMLHeadingElement>, 'color'> {
  /**
   * Size in px, every 2px from 20 to 44, all in the display face. Rendered as `data-size`; reads
   * `--bit-heading-{size}px`. Default 32. The size also picks the tag, for the page outline that screen readers,
   * search engines and reader modes use: 40 to 44 h1, 32 to 38 h2, 26 to 30 h3, 24 h4, 22 h5, 20 h6.
   * A level (1 to 6) is deprecated: use the px size. It will be removed in 0.2.0.
   */
  size?: HeadingSize | HeadingLevel;
  /** @deprecated Use `size`, which picks the tag. Removed in 0.2.0. */
  level?: HeadingLevel;
}

/** The tag the deprecated level asks for, warning once per level. Undefined when level is off or unknown. */
function levelTag(level: HeadingLevel | undefined): HeadingTag | undefined {
  if (level === undefined) return undefined;
  // String(level), so an untyped "4" works and a typo gets dataValue's usual warning.
  const valid = dataValue('heading', { name: 'level', allowed: LEVELS, value: String(level) });
  if (valid === undefined) return undefined;
  warnDeprecated(
    `heading-level-${valid}`,
    `Heading level={${valid}} is deprecated: the size picks the tag now. Use size={${LEVEL_SIZE[Number(valid) as HeadingLevel]}}, which renders an h${valid}. It will be removed in 0.2.0.`,
  );
  return `h${valid}` as HeadingTag;
}

/** The old size={1..6} form, warning once per value: it keeps that level's whole look through data-level. */
function oldLevelSize(size: HeadingProps['size']): HeadingLevel | undefined {
  // String(): untyped callers (JS, MDX) can pass size="3".
  const old = LEVELS.find((n) => String(n) === String(size));
  if (old !== undefined) {
    warnDeprecated(
      `heading-size-${old}`,
      `Heading size={${old}} is deprecated: size is now in px, every 2px from 20 to 44, and it picks the tag. Use size={${LEVEL_SIZE[old]}}, which renders an h${old}. It will be removed in 0.2.0.`,
    );
  }
  return old;
}

/** A section title. `size` is the look, in px, and picks the tag, so the page outline follows how big titles are. */
export const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(function Heading(
  { size, level, className, ...rest },
  ref,
) {
  const fromLevel = levelTag(level);
  const old = oldLevelSize(size);
  const valid = old === undefined && size !== undefined ? dataValue('heading', { name: 'size', allowed: HEADING_SIZES, value: size }) : undefined;
  const px = valid === undefined ? undefined : (Number(valid) as HeadingSize);
  // The deprecated forms keep their old whole-level look: size={1..6}, or level on its own (no px size).
  const oldLook = old ?? (px === undefined && fromLevel !== undefined ? Number(fromLevel[1]) : undefined);
  // An unknown size falls back to the default, after dataValue's warning.
  const look = px ?? 32;
  const tag = fromLevel ?? (old === undefined ? tagFor(look) : 'h2');
  return createElement(
    InlineText.Provider,
    { value: true },
    createElement(tag, {
      ref,
      className: toClasses('heading', [], className),
      'data-level': oldLook === undefined ? undefined : String(oldLook),
      'data-size': oldLook === undefined ? String(look) : undefined,
      ...dropLegacyColor(rest),
    }),
  );
});
