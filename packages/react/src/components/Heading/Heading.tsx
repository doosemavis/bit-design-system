import { createElement, forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { dataValue, toClasses } from '../../system/toClasses';
import { dropLegacyColor } from '../../system/dropLegacyColor';

const LEVELS = [1, 2, 3, 4, 5, 6] as const;

export type HeadingLevel = (typeof LEVELS)[number];

export interface HeadingProps extends Omit<HTMLAttributes<HTMLHeadingElement>, 'color'> {
  /** Required. Renders `<h{level}>`, so the page outline stays correct. */
  level: HeadingLevel;
  /** The visual level, when it differs from `level`. Rendered as `data-level`; defaults to `level`. */
  size?: HeadingLevel;
}

/** A section title. `level` picks the tag; `size` picks the look, so an h2 can look like an h3. */
export const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(function Heading(
  { level, size, className, ...rest },
  ref,
) {
  // String(level), so a caller that leaves the required level off gets the same warning as a typo.
  const tag = dataValue('heading', { name: 'level', allowed: LEVELS, value: String(level) });
  const look = size === undefined ? tag : dataValue('heading', { name: 'size', allowed: LEVELS, value: size });
  return createElement(`h${tag ?? 2}`, {
    ref,
    className: toClasses('heading', [], className),
    'data-level': look,
    ...dropLegacyColor(rest),
  });
});
