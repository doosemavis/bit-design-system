import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ElementType } from 'react';
import { createSlot } from '../../system/Slot';
import { SIZES, COLORS, VARIANTS } from '../../system/axes';
import type { Size, Color, Variant } from '../../system/axes';
import { toClasses } from '../../system/toClasses';

/**
 * The values Button supports. To add one (say variant "link"): add it here,
 * then add a `.bit-button.bit-link { }` rule in packages/core/src/components/button.css.
 */
const colors = COLORS;
const variants = VARIANTS;
const sizes = SIZES;
const Slot = createSlot('Button', { emptyRendersNothing: true, alwaysChainHandlers: true });

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Color role. Class: `bit-{color}`. */
  color?: Color;
  /** Emphasis. Class: `bit-{variant}`. */
  variant?: Variant;
  /** Control height. Class: `bit-{size}`. */
  size?: Size;
  /** Shows a spinner and blocks clicks. Rendered as `data-loading` and `aria-busy`. */
  loading?: boolean;
  /** Render the single child element (for example an `<a>`) with Button's classes instead of a `<button>`. */
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    color = 'primary',
    variant = 'solid',
    size = 'md',
    loading = false,
    asChild = false,
    className,
    type = 'button',
    disabled,
    children,
    ...rest
  },
  ref,
) {
  const Comp: ElementType = asChild ? Slot : 'button';
  const inert = disabled || loading;
  const classes = toClasses(
    'button',
    [
      { name: 'color', allowed: colors, value: color },
      { name: 'variant', allowed: variants, value: variant },
      { name: 'size', allowed: sizes, value: size },
    ],
    className,
  );

  return (
    <Comp
      ref={ref}
      className={classes}
      data-loading={loading ? '' : undefined}
      aria-busy={loading || undefined}
      {...(asChild ? { 'aria-disabled': inert || undefined } : { type, disabled: inert })}
      {...rest}
    >
      {children}
    </Comp>
  );
});
