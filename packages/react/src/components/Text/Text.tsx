import { createElement, forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { TEXT_SIZES } from '../../system/axes';
import type { TextSize } from '../../system/axes';
import { dataValue, toClasses } from '../../system/toClasses';
import { warnDeprecated } from '../../system/warnDeprecated';

/** Only `neutral` (muted) is supported on Text in v1; see the plan note. */
const colors = ['neutral'] as const;

export type TextElement = 'p' | 'span' | 'div' | 'label' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export interface TextProps extends HTMLAttributes<HTMLElement> {
  /** Which element to render. Styling comes from `size`, not from the tag. */
  as?: TextElement;
  /**
   * Size in px (13, 15, 18, 24, 32). Rendered as `data-size`; reads `--bit-text-{size}px`. 24 and 32 use the display face.
   * `11` is deprecated: it is under the 13px minimum text size. Use `13`. It will be removed in 0.2.0.
   */
  size?: TextSize;
  /** `neutral` renders muted text. */
  color?: (typeof colors)[number];
  /**
   * Rendered as `data-weight`. Has no visible effect at 24 and 32: those sizes use the
   * display face, which ships a single weight, so a heavier value would be browser-synthesized.
   */
  weight?: 'normal' | 'bold';
}

export const Text = forwardRef<HTMLElement, TextProps>(function Text(
  { as = 'p', size = 15, color, weight = 'normal', className, ...rest },
  ref,
) {
  // String(): untyped callers (JS, MDX) can pass size="11", which dataValue accepts too.
  if (String(size) === '11') {
    warnDeprecated(
      'text-size-11',
      'Text size={11} is deprecated: 11px is under the 13px minimum text size. Use size={13}. It will be removed in 0.2.0.',
    );
  }
  return createElement(as, {
    ref,
    className: toClasses('text', [{ name: 'color', allowed: colors, value: color }], className),
    'data-size': dataValue('text', { name: 'size', allowed: TEXT_SIZES, value: size }),
    'data-weight': weight,
    ...rest,
  });
});
