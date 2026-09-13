import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { COLORS } from '../../system/axes';
import type { Color } from '../../system/axes';
import { element, toClasses } from '../../system/toClasses';

const colors = COLORS;
const variants = ['solid', 'outline'] as const;

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  /** Color role. Class: `bit-{color}`. */
  color?: Color;
  /** `outline` uses the color's soft background; `solid` fills with the color. */
  variant?: (typeof variants)[number];
  /** Heading text rendered in the display font. This is the alert's own heading, not the native `title` tooltip attribute, which is intentionally not forwarded. */
  title?: string;
}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
  { color = 'neutral', variant = 'outline', title, role = 'status', className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      role={role}
      className={toClasses(
        'alert',
        [
          { name: 'color', allowed: colors, value: color },
          { name: 'variant', allowed: variants, value: variant },
        ],
        className,
      )}
      {...rest}
    >
      {title ? <div className={element('alert', 'title')}>{title}</div> : null}
      <div className={element('alert', 'body')}>{children}</div>
    </div>
  );
});
