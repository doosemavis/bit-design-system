import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { COLORS, SIZES } from '../../system/axes';
import type { Color } from '../../system/axes';
import { withFlat } from '../../system/flat';
import { dataValue, toClasses } from '../../system/toClasses';

/** Badge supports a subset of the global axes. Add a value here and a rule in core/components/badge.css. */
const colors = COLORS;
const variants = ['solid', 'outline'] as const;
const sizes = SIZES;
/** Not a global axis, so it renders as a data attribute rather than a class. */
const shapes = ['pill', 'square'] as const;

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Color role. Class: `bit-{color}`. */
  color?: Color;
  variant?: (typeof variants)[number];
  /** `lg` is the readable badge: body font, 15px bold. `sm` and `md` use the pixel font. */
  size?: (typeof sizes)[number];
  /** Drops the hard shadow for a flat look. Class: `bit-flat`, so `className="bit-flat"` does the same. */
  flat?: boolean;
  /** `pill` is fully rounded; `square` uses the 6px radius. Rendered as `data-shape`. */
  shape?: (typeof shapes)[number];
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { color = 'neutral', variant = 'solid', size = 'md', shape = 'pill', flat = false, className, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={toClasses(
        'badge',
        [
          { name: 'color', allowed: colors, value: color },
          { name: 'variant', allowed: variants, value: variant },
          { name: 'size', allowed: sizes, value: size },
        ],
        withFlat(flat, className),
      )}
      data-shape={dataValue('badge', { name: 'shape', allowed: shapes, value: shape })}
      {...rest}
    />
  );
});
