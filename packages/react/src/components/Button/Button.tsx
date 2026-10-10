import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ElementType, KeyboardEvent, MouseEvent } from 'react';
import { InlineText } from '../../system/inlineText';
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
const Slot = createSlot('Button', { emptyRendersNothing: true, alwaysChainHandlers: true, noFragmentRef: true });

/** Stops a click before any handler sees it, and stops a link from following its href. */
function blockClick(event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();
}

/** Stops Enter and Space, so they can't activate the element (a link follows its href on Enter). */
function blockKeys(event: KeyboardEvent) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  event.stopPropagation();
}

/**
 * An element that looks disabled but keeps focus: a loading button, or a disabled or loading link (asChild).
 * The capture handlers run before the element's own handlers, so neither fires.
 */
const BLOCKED = { 'aria-disabled': true, onClickCapture: blockClick, onKeyDownCapture: blockKeys } as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Color role. Class: `bit-{color}`. */
  color?: Color;
  /** Emphasis. Class: `bit-{variant}`. */
  variant?: Variant;
  /** Control height. Class: `bit-{size}`. */
  size?: Size;
  /**
   * Shows a spinner and blocks clicks, Enter and Space, but keeps the button focusable, so focus stays put
   * while it works. Rendered as `data-loading`, `aria-busy` and `aria-disabled`.
   */
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
  // A native button can be truly disabled. Loading, and anything rendered asChild, stays focusable instead.
  const native = asChild ? {} : { type, disabled };
  const blocked = (asChild && disabled) || (loading && !disabled);
  const classes = toClasses(
    'button',
    [
      { name: 'color', allowed: colors, value: color },
      { name: 'variant', allowed: variants, value: variant },
      { name: 'size', allowed: sizes, value: size },
    ],
    className,
  );

  // A Text in a button renders a span: a <p> can't sit in a <button>.
  return (
    <InlineText.Provider value>
      <Comp
        ref={ref}
        className={classes}
        data-loading={loading ? '' : undefined}
        aria-busy={loading || undefined}
        {...native}
        {...rest}
        {...(blocked ? BLOCKED : {})}
      >
        {children}
      </Comp>
    </InlineText.Provider>
  );
});
