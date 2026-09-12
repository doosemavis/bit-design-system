import { forwardRef } from 'react';
import type { CSSProperties, HTMLAttributes } from 'react';
import { SIZES } from '../system/axes';
import type { Size } from '../system/axes';
import { element, toClasses } from '../system/toClasses';

/** Console generations, in the order the logo cycles through them. */
export const ERAS = [8, 16, 32, 64] as const;
export type Era = (typeof ERAS)[number];

const sizes = SIZES;

export interface BitLogoProps extends HTMLAttributes<HTMLSpanElement> {
  size?: Size;
  /** Seconds each era stays on screen. Demo default is 5. */
  interval?: number;
  /** Set false to show a single static era (the first one). */
  animated?: boolean;
  /** Pin one era and stop cycling. A theme or version picker sets this. */
  freeze?: Era;
}

export const BitLogo = forwardRef<HTMLSpanElement, BitLogoProps>(function BitLogo(
  { size = 'md', interval = 5, animated = true, freeze, className, style, ...rest },
  ref,
) {
  const shown: readonly Era[] = freeze !== undefined ? [freeze] : animated ? ERAS : [ERAS[0]];
  const cycling = shown.length > 1;
  const cssVars = { ...style, '--_bit-logo-interval': `${interval}s` } as CSSProperties;

  return (
    <span
      ref={ref}
      role="img"
      aria-label="bit"
      className={toClasses('logo', [{ name: 'size', allowed: sizes, value: size }], className)}
      data-animated={cycling ? '' : undefined}
      style={cssVars}
      {...rest}
    >
      <span className={element('logo', 'slot')} aria-hidden="true">
        {shown.map((era) => (
          <span key={era} className={element('logo', 'era')} data-era={era}>
            {era}
          </span>
        ))}
      </span>
      <span className={element('logo', 'suffix')} aria-hidden="true">
        -bit
      </span>
    </span>
  );
});
