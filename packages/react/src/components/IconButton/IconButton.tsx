import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { COLORS, SIZES, VARIANTS } from '../../system/axes';
import type { Color, Size, Variant } from '../../system/axes';
import { toClasses } from '../../system/toClasses';
import type { IconData } from '../../icons/types';
import { Icon } from '../Icon/Icon';
import { Tooltip } from '../Tooltip/Tooltip';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color' | 'children' | 'aria-label'> {
  /** The icon to show: an `iconX` export. */
  icon: IconData;
  /** The button's name for screen readers (an icon alone says nothing). Required. */
  label: string;
  /** Draws the filled version of the icon. */
  iconFilled?: boolean;
  /** Color role. Class: `bit-{color}`. */
  color?: Color;
  /** Emphasis. Class: `bit-{variant}`. */
  variant?: Variant;
  /** Square size: 32, 40 or 48px, with a 16, 20 or 24px icon. Class: `bit-{size}`. */
  size?: Size;
  /** Shows this in a Tooltip on hover and keyboard focus. No tooltip when left off (or empty). */
  tooltip?: ReactNode;
}

/** A square Button holding one Icon. It shares Button's colors, variants and press animation. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, label, iconFilled = false, color = 'neutral', variant = 'outline', size = 'md', tooltip, className, type = 'button', ...rest },
  ref,
) {
  const button = (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      className={toClasses(
        'iconButton',
        [
          { name: 'color', allowed: COLORS, value: color },
          { name: 'variant', allowed: VARIANTS, value: variant },
          { name: 'size', allowed: SIZES, value: size },
        ],
        className ? `bit-button ${className}` : 'bit-button',
      )}
      {...rest}
    >
      <Icon icon={icon} size={size} iconFilled={iconFilled} />
    </button>
  );
  if (tooltip === undefined || tooltip === null || tooltip === false || tooltip === '') return button;
  return (
    <Tooltip content={tooltip} describe={false}>
      {button}
    </Tooltip>
  );
});
