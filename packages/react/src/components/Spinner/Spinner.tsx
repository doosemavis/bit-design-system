import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { SIZES, TONES } from '../../system/axes';
import type { Size, Tone } from '../../system/axes';
import { toClasses } from '../../system/toClasses';

const tones = TONES;
const sizes = SIZES;

export interface SpinnerProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'aria-label'> {
  tone?: Tone;
  size?: Size;
  /** Required: screen readers announce this. Example: "Loading coins". */
  'aria-label': string;
}

export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(
  { tone = 'primary', size = 'md', className, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      role="status"
      className={toClasses(
        'spinner',
        [
          { name: 'tone', allowed: tones, value: tone },
          { name: 'size', allowed: sizes, value: size },
        ],
        className,
      )}
      {...rest}
    />
  );
});
