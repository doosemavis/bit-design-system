import { createElement, forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { dataValue, toClasses } from '../../system/toClasses';
import { dropLegacyColor } from '../../system/dropLegacyColor';
import { warnDeprecated } from '../../system/warnDeprecated';

const LEVELS = [1, 2, 3, 4, 5, 6] as const;

/** Text's sizes without the deprecated 11: a heading never goes under the 13px floor. */
const SIZES = [13, 15, 18, 24, 32] as const;

/** Each level's own px size, for the deprecation message of the old `size={level}` form. */
const LEVEL_PX = { 1: 32, 2: 24, 3: 18, 4: 15, 5: 13, 6: 13 } as const;

export type HeadingLevel = (typeof LEVELS)[number];

export type HeadingSize = (typeof SIZES)[number];

export interface HeadingProps extends Omit<HTMLAttributes<HTMLHeadingElement>, 'color'> {
  /** Required. Renders `<h{level}>`, so the page outline stays correct, and picks the face. */
  level: HeadingLevel;
  /**
   * Size in px (13, 15, 18, 24, 32), when it differs from the level's own. Rendered as `data-size`; reads
   * `--bit-text-{size}px`. Changes only the size: the face, weight and spacing stay the level's.
   * A level (1 to 6) is deprecated: it gives that level's whole look. Use the px size. It will be removed in 0.2.0.
   */
  size?: HeadingSize | HeadingLevel;
}

/** A section title. `level` picks the tag and the face; `size` picks the px size, so an h2 can be 18px. */
export const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(function Heading(
  { level, size, className, ...rest },
  ref,
) {
  // String(level), so a caller that leaves the required level off gets the same warning as a typo.
  const tag = dataValue('heading', { name: 'level', allowed: LEVELS, value: String(level) });
  // String(): untyped callers (JS, MDX) can pass size="3", which is the old form too.
  const oldLevel = LEVELS.find((n) => String(n) === String(size));
  if (oldLevel !== undefined) {
    warnDeprecated(
      `heading-size-${oldLevel}`,
      `Heading size={${oldLevel}} is deprecated: size is now in px (13, 15, 18, 24, 32). Use size={${LEVEL_PX[oldLevel]}}. It will be removed in 0.2.0.`,
    );
  }
  return createElement(`h${tag ?? 2}`, {
    ref,
    className: toClasses('heading', [], className),
    'data-level': oldLevel === undefined ? tag : String(oldLevel),
    'data-size': oldLevel === undefined ? dataValue('heading', { name: 'size', allowed: SIZES, value: size }) : undefined,
    ...dropLegacyColor(rest),
  });
});
