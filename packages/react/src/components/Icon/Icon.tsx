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
  /** Draws the filled version. Class: `bit-iconFilled`, so `className="bit-iconFilled"` does the same. */
  iconFilled?: boolean;
  /** What the icon means, for screen readers. Without it (or `aria-label`/`aria-labelledby`) the icon is decorative. */
  label?: string;
}

const FILLED = 'bit-iconFilled';

/** A Material Symbols icon as an inline <svg>. It needs no stylesheet beyond styles.css. */
export const Icon = forwardRef<SVGSVGElement, IconProps>(function Icon(
  { icon, color, size = 'md', iconFilled = false, label, className, ...rest },
  ref,
) {
  const filledByClass = className?.split(/\s+/).includes(FILLED) ?? false;
  const name = label?.trim() || rest['aria-label']?.trim();
  const labelledBy = rest['aria-labelledby']?.trim();
  const labelled = Boolean(name) || Boolean(labelledBy);
  // Spread after rest, so a named icon is never hidden and an unnamed one never carries an empty name.
  const a11y = labelled
    ? { role: 'img', 'aria-label': name || undefined, 'aria-labelledby': labelledBy || undefined, 'aria-hidden': undefined }
    : { role: undefined, 'aria-label': undefined, 'aria-labelledby': undefined, 'aria-hidden': true as const };
  const extra = [`bit-icon-${icon.name}`, iconFilled && !filledByClass ? FILLED : undefined, className].filter(Boolean).join(' ');
  return (
    <svg
      ref={ref}
      className={toClasses(
        'icon',
        [
          { name: 'color', allowed: COLORS, value: color },
          { name: 'size', allowed: SIZES, value: size },
        ],
        extra,
      )}
      viewBox="0 -960 960 960"
      focusable="false"
      {...rest}
      {...a11y}
    >
      <path d={iconFilled || filledByClass ? icon.fillPath : icon.path} />
    </svg>
  );
});
