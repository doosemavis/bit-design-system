import { forwardRef, useState } from 'react';
import type { HTMLAttributes } from 'react';
import { COLORS, SIZES } from '../../system/axes';
import type { Color, Size } from '../../system/axes';
import { withFlat } from '../../system/flat';
import { dataValue, element, toClasses } from '../../system/toClasses';

const colors = COLORS;
const sizes = SIZES;
/** Not a global axis, so it renders as a data attribute rather than a class. */
const shapes = ['circle', 'square', 'pixel'] as const;

export interface AvatarProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Required: the name screen readers hear, and where the initials come from. */
  name: string;
  /** The photo. With none, or when it fails to load, the initials show. */
  src?: string;
  /** The fill behind the initials. Class: `bit-{color}`. */
  color?: Color;
  /** The control heights, 32 / 40 / 48px, so an Avatar lines up with a Button. Class: `bit-{size}`. */
  size?: Size;
  /** `circle`; `square`, the 6px radius; `pixel`, square corners and the pixel font. Rendered as `data-shape`. */
  shape?: (typeof shapes)[number];
  /** Drops the hard shadow for a flat look. Class: `bit-flat`, so `className="bit-flat"` does the same. */
  flat?: boolean;
}

/**
 * The first letter of the first word and of the last word, uppercased: "Ada Lovelace" → "AL", "Cher" → "C".
 * Letters are read by code point, so an accented letter or an emoji isn't split in half.
 */
export function initialsOf(name: string): string {
  // `name` is required, but a plain-JavaScript caller can leave it out: no initials then, never a crash.
  const words = String(name ?? '').trim().split(/\s+/).filter(Boolean);
  const first = words[0];
  const last = words.length > 1 ? words[words.length - 1] : undefined;
  return [first, last]
    .map((word) => (word ? Array.from(word)[0]! : ''))
    .join('')
    .toLocaleUpperCase();
}

/**
 * A person, as a photo or their initials. The root is one image named `name` whichever shows: the initials sit
 * under the photo (seen while it loads), and a photo that fails to load is dropped, so no broken-image icon shows.
 */
export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(
  { name, src, color = 'neutral', size = 'md', shape = 'circle', flat = false, className, ...rest },
  ref,
) {
  // The src that failed, not a flag: a new src is tried again without an effect to reset it.
  const [failed, setFailed] = useState<string | null>(null);
  const showImage = Boolean(src) && src !== failed;
  return (
    <span
      ref={ref}
      role="img"
      aria-label={name}
      className={toClasses(
        'avatar',
        [
          { name: 'color', allowed: colors, value: color },
          { name: 'size', allowed: sizes, value: size },
        ],
        withFlat(flat, className),
      )}
      data-shape={dataValue('avatar', { name: 'shape', allowed: shapes, value: shape })}
      {...rest}
    >
      <span className={element('avatar', 'initials')} aria-hidden="true">
        {initialsOf(name)}
      </span>
      {showImage ? <img className={element('avatar', 'image')} src={src} alt="" onError={() => setFailed(src ?? null)} /> : null}
    </span>
  );
});
