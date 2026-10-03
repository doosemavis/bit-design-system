import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { SPACE_STEPS } from '../../system/axes';
import type { SpaceStep } from '../../system/axes';
import { dataValue, toClasses } from '../../system/toClasses';
import { dropLegacyColor } from '../../system/dropLegacyColor';

export interface StackProps extends Omit<HTMLAttributes<HTMLDivElement>, 'color'> {
  /** Flex direction. Rendered as `data-direction`. */
  direction?: 'row' | 'column';
  /** Gap in px on the space scale (4, 8, 12, 16, 24, 32, 48, 64). Rendered as `data-gap`; reads `--bit-space-{gap}px`. */
  gap?: SpaceStep;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between';
  wrap?: boolean;
}

export const Stack = forwardRef<HTMLDivElement, StackProps>(function Stack(
  { direction = 'column', gap = 12, align, justify, wrap = false, className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={toClasses('stack', [], className)}
      data-direction={direction}
      data-gap={dataValue('stack', { name: 'gap', allowed: SPACE_STEPS, value: gap })}
      data-align={align}
      data-justify={justify}
      data-wrap={wrap ? '' : undefined}
      {...dropLegacyColor(rest)}
    />
  );
});
