import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { SIZES } from '../system/axes';
import type { Size } from '../system/axes';
import { element, toClasses } from '../system/toClasses';
import { dropLegacyColor } from '../system/dropLegacyColor';
import { useLogoEra } from './logoEra';
import type { Era } from './logoEra';

const sizes = SIZES;

export interface BitLogoProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'color'> {
  size?: Size;
  /** Pin one era. Omit it and each page load shows the next era: 8 → 16 → 32 → 64. */
  era?: Era;
}

/** The bit wordmark: "bit" drawn in one console era's style, over a small "Design System" caption. */
export const BitLogo = forwardRef<HTMLSpanElement, BitLogoProps>(function BitLogo(
  { size = 'md', era, className, ...rest },
  ref,
) {
  const shown = useLogoEra(era);

  return (
    <span
      ref={ref}
      role="img"
      aria-label="bit Design System"
      className={toClasses('logo', [{ name: 'size', allowed: sizes, value: size }], className)}
      data-era={shown}
      {...dropLegacyColor(rest)}
    >
      <span className={element('logo', 'word')} aria-hidden="true">
        bit
      </span>
      <span className={element('logo', 'caption')} aria-hidden="true">
        Design System
      </span>
    </span>
  );
});
