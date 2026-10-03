import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { SIZES } from '../../system/axes';
import type { Size } from '../../system/axes';
import { toClasses } from '../../system/toClasses';
import { dropLegacyColor } from '../../system/dropLegacyColor';
import { useFieldControl } from '../Field/FieldContext';

const sizes = SIZES;

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'color'> {
  /** Control height. Class: `bit-{size}`. */
  size?: Size;
  /** Marks the value wrong: `aria-invalid="true"` and a danger border. A surrounding Field's error does the same. */
  invalid?: boolean;
}

/** A native text input, recessed into the page. Inside a Field it takes the Field's id, hint and error. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { size = 'md', invalid, className, ...rest },
  ref,
) {
  const wired = useFieldControl(rest, invalid);
  return (
    <input
      ref={ref}
      className={toClasses('input', [{ name: 'size', allowed: sizes, value: size }], className)}
      {...dropLegacyColor(rest)}
      {...wired}
    />
  );
});
