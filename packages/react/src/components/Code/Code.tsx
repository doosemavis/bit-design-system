import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { toClasses } from '../../system/toClasses';
import { dropLegacyColor } from '../../system/dropLegacyColor';

export type CodeProps = Omit<HTMLAttributes<HTMLElement>, 'color'>;

/** Inline code: a small mono chip inside running text, in its own colour: light violet in light mode, yellow in dark. */
export const Code = forwardRef<HTMLElement, CodeProps>(function Code({ className, ...rest }, ref) {
  return <code ref={ref} className={toClasses('code', [], className)} {...dropLegacyColor(rest)} />;
});
