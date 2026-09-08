import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { TONES } from '../../system/axes';
import type { Tone } from '../../system/axes';
import { element, toClasses } from '../../system/toClasses';

const tones = TONES;
const variants = ['solid', 'outline'] as const;

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  tone?: Tone;
  /** `outline` uses the tone's soft background; `solid` fills with the tone. */
  variant?: (typeof variants)[number];
  /** Optional heading rendered in the display font. */
  title?: string;
}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
  { tone = 'neutral', variant = 'outline', title, role = 'status', className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      role={role}
      className={toClasses(
        'alert',
        [
          { name: 'tone', allowed: tones, value: tone },
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
