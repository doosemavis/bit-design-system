import { forwardRef } from 'react';
import type { SVGAttributes } from 'react';
import { COLORS, SIZES } from '../../system/axes';
import type { Color, Size } from '../../system/axes';
import { toClasses } from '../../system/toClasses';
import type { IconData } from '../../icons/types';

export interface IconProps extends Omit<SVGAttributes<SVGSVGElement>, 'color' | 'children'> {
  /** The icon to draw: an `iconX` export, such as `iconFavorite`. Class: `bit-icon-{icon.name}`. */
  icon: IconData;
  /** Color role. Class: `bit-{color}`. Left off, the icon is drawn in the surrounding text color. */
  color?: Color;
  /** sm 16px, md 20px, lg 24px. Class: `bit-{size}`. */
  size?: Size;
  /** What the icon means, for screen readers. Without it the icon is decorative and hidden from them. */
  label?: string;
}

/** A Material Symbols icon as an inline <svg>. It needs no stylesheet beyond styles.css. */
export const Icon = forwardRef<SVGSVGElement, IconProps>(function Icon(
  { icon, color, size = 'md', label, className, ...rest },
  ref,
) {
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true as const };
  return (
    <svg
      ref={ref}
      className={toClasses(
        'icon',
        [
          { name: 'color', allowed: COLORS, value: color },
          { name: 'size', allowed: SIZES, value: size },
        ],
        className ? `bit-icon-${icon.name} ${className}` : `bit-icon-${icon.name}`,
      )}
      viewBox="0 -960 960 960"
      focusable="false"
      {...a11y}
      {...rest}
    >
      <path d={icon.path} />
    </svg>
  );
});
