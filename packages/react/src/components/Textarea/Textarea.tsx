import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import { SIZES } from '../../system/axes';
import type { Size } from '../../system/axes';
import { toClasses } from '../../system/toClasses';
import { dropLegacyColor } from '../../system/dropLegacyColor';
import { useFieldControl } from '../Field/FieldContext';

const sizes = SIZES;

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'color'> {
  /** Text size and side padding. Class: `bit-{size}`. */
  size?: Size;
  /** Marks the value wrong: `aria-invalid="true"` and a danger border. A surrounding Field's error does the same. */
  invalid?: boolean;
}

/**
 * A native multi-line text box, recessed into the page like Input. It is `rows` lines tall (default 3) and can be
 * dragged taller, never wider. Inside a Field it takes the Field's id, hint, error and required.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { size = 'md', invalid, rows = 3, className, ...rest },
  ref,
) {
  const wired = useFieldControl(rest, invalid);
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={toClasses('textarea', [{ name: 'size', allowed: sizes, value: size }], className)}
      {...dropLegacyColor(rest)}
      {...wired}
    />
  );
});
