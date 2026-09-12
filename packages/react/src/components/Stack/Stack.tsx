import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import type { SpaceStep } from '../../system/axes';
import { toClasses } from '../../system/toClasses';
import { dropLegacyColor } from '../../system/dropLegacyColor';

export interface StackProps extends Omit<HTMLAttributes<HTMLDivElement>, 'color'> {
  /** Flex direction. Rendered as `data-direction`. */
  direction?: 'row' | 'column';
  /** Gap on the 4px space scale (1 = 4px … 8 = 64px). Rendered as `data-gap`. */
  gap?: SpaceStep;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between';
  wrap?: boolean;
}

export const Stack = forwardRef<HTMLDivElement, StackProps>(function Stack(
  { direction = 'column', gap = 3, align, justify, wrap = false, className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={toClasses('stack', [], className)}
      data-direction={direction}
      data-gap={gap}
      data-align={align}
      data-justify={justify}
      data-wrap={wrap ? '' : undefined}
      {...dropLegacyColor(rest)}
    />
  );
});
