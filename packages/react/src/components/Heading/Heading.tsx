import { createElement, forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { dataValue, toClasses } from '../../system/toClasses';
import { dropLegacyColor } from '../../system/dropLegacyColor';
import { warnDeprecated } from '../../system/warnDeprecated';

const TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;

/** Text's sizes without the deprecated 11: a heading never goes under the 13px floor. */
const SIZES = [13, 15, 18, 24, 32] as const;

/** Deprecated: the old `level` prop and the old `size={level}` form. */
const LEVELS = [1, 2, 3, 4, 5, 6] as const;

export type HeadingTag = (typeof TAGS)[number];

export type HeadingSize = (typeof SIZES)[number];

/** @deprecated Use `as` ('h1' to 'h6'). Removed in 0.2.0. */
export type HeadingLevel = (typeof LEVELS)[number];

/** Each tag's own px size: the size when `size` is left off. */
const TAG_PX: Record<HeadingTag, HeadingSize> = { h1: 32, h2: 24, h3: 18, h4: 15, h5: 13, h6: 13 };

export interface HeadingProps extends Omit<HTMLAttributes<HTMLHeadingElement>, 'color'> {
  /**
   * The tag, `h1` to `h6`, for the page outline that screen readers, search engines and reader modes use.
   * Default `h2`. It sets the size only when `size` is left off.
   */
  as?: HeadingTag;
  /**
   * Size in px (13, 15, 18, 24, 32). Rendered as `data-size`; reads `--bit-text-{size}px`. 18 and up use the
   * display face; 15 and 13 the body face in bold. Default: the tag's own size (h1 32, h2 24, h3 18, h4 15, h5 and h6 13).
   * A level (1 to 6) is deprecated: use the px size. It will be removed in 0.2.0.
   */
  size?: HeadingSize | HeadingLevel;
  /** @deprecated Use `as` ('h1' to 'h6'), and `size` in px to change the look. Removed in 0.2.0. */
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
    `Heading level={${valid}} is deprecated: use as="h${valid}" (and size in px to change its look). It will be removed in 0.2.0.`,
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
      `Heading size={${old}} is deprecated: size is now in px (13, 15, 18, 24, 32). Use size={${TAG_PX[`h${old}`]}}. It will be removed in 0.2.0.`,
    );
  }
  return old;
}

/** A section title. `as` picks the tag for the page outline; `size` picks the look, in px, like Text. */
export const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(function Heading(
  { as, size, level, className, ...rest },
  ref,
) {
  const fromLevel = levelTag(level);
  const fromAs = as === undefined ? undefined : dataValue('heading', { name: 'as', allowed: TAGS, value: as });
  const tag = (fromAs as HeadingTag | undefined) ?? fromLevel ?? 'h2';
  const old = oldLevelSize(size);
  const px = old === undefined && size !== undefined ? dataValue('heading', { name: 'size', allowed: SIZES, value: size }) : undefined;
  // The deprecated forms keep their old whole-level look: size={1..6}, or level on its own (no as, no px size).
  const oldLook = old ?? (px === undefined && fromAs === undefined && fromLevel !== undefined ? Number(fromLevel[1]) : undefined);
  return createElement(tag, {
    ref,
    className: toClasses('heading', [], className),
    'data-level': oldLook === undefined ? undefined : String(oldLook),
    'data-size': oldLook === undefined ? (px ?? String(TAG_PX[tag])) : undefined,
    ...dropLegacyColor(rest),
  });
});
