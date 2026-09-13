import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { TONES } from '../../system/axes';
import type { Tone } from '../../system/axes';
import { toClasses } from '../../system/toClasses';

/** Badge supports a subset of the global axes. Add a value here and a rule in core/components/badge.css. */
const tones = TONES;
const variants = ['solid', 'outline'] as const;
const sizes = ['sm', 'md'] as const;

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  variant?: (typeof variants)[number];
  size?: (typeof sizes)[number];
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { tone = 'neutral', variant = 'solid', size = 'md', className, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={toClasses(
        'badge',
        [
          { name: 'tone', allowed: tones, value: tone },
          { name: 'variant', allowed: variants, value: variant },
          { name: 'size', allowed: sizes, value: size },
        ],
        className,
      )}
      {...rest}
    />
  );
});
