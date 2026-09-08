import { createElement, forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { TEXT_SIZES } from '../../system/axes';
import type { TextSize } from '../../system/axes';
import { toClasses } from '../../system/toClasses';

const sizes = TEXT_SIZES;
/** Only `neutral` (muted) is supported on Text in v1; see the plan note. */
const tones = ['neutral'] as const;

export type TextElement = 'p' | 'span' | 'div' | 'label' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export interface TextProps extends HTMLAttributes<HTMLElement> {
  /** Which element to render. Styling comes from `size`, not from the tag. */
  as?: TextElement;
  size?: TextSize;
  /** `neutral` renders muted text. */
  tone?: (typeof tones)[number];
  /** Rendered as `data-weight`. */
  weight?: 'normal' | 'bold';
}

export const Text = forwardRef<HTMLElement, TextProps>(function Text(
  { as = 'p', size = 'md', tone, weight = 'normal', className, ...rest },
  ref,
) {
  return createElement(as, {
    ref,
    className: toClasses(
      'text',
      [
        { name: 'tone', allowed: tones, value: tone },
        { name: 'size', allowed: sizes, value: size },
      ],
      className,
    ),
    'data-weight': weight,
    ...rest,
  });
});
