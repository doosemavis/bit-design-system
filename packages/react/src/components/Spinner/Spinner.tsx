import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { SIZES, COLORS } from '../../system/axes';
import type { Size, Color } from '../../system/axes';
import { toClasses } from '../../system/toClasses';

const colors = COLORS;
const sizes = SIZES;

export interface SpinnerProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'aria-label'> {
  /** Color role. Class: `bit-{color}`. */
  color?: Color;
  size?: Size;
  /** Required: screen readers announce this. Example: "Loading coins". */
  'aria-label': string;
}

export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(
  { color = 'primary', size = 'md', className, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      role="status"
      className={toClasses(
        'spinner',
        [
          { name: 'color', allowed: colors, value: color },
          { name: 'size', allowed: sizes, value: size },
        ],
        className,
      )}
      {...rest}
    />
  );
});
