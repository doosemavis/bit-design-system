import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { SIZES } from '../../system/axes';
import type { Size } from '../../system/axes';
import { element, toClasses } from '../../system/toClasses';
import { dropLegacyColor } from '../../system/dropLegacyColor';
import { useFieldControl } from '../Field/FieldContext';

const sizes = SIZES;

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'color'> {
  /** Control height. Class: `bit-{size}` on the wrapper. */
  size?: Size;
  /** Marks the choice wrong: `aria-invalid="true"` and a danger border. A surrounding Field's error does the same. */
  invalid?: boolean;
}

/**
 * The browser's own select, styled like Input, with a chunky chevron drawn by the wrapper.
 * The wrapper takes `className`; the `<select>` takes the ref and every other prop.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { size = 'md', invalid, className, ...rest },
  ref,
) {
  const wired = useFieldControl(rest, invalid);
  return (
    <span className={toClasses('select', [{ name: 'size', allowed: sizes, value: size }], className)}>
      <select ref={ref} className={element('select', 'control')} {...dropLegacyColor(rest)} {...wired} />
    </span>
  );
});
