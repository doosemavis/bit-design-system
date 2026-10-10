import { createElement, forwardRef, useContext } from 'react';
import type { HTMLAttributes } from 'react';
import { DEPRECATED_TEXT_SIZES, DEPRECATED_TEXT_SIZE_TO, TEXT_SIZES } from '../../system/axes';
import type { DeprecatedTextSize, TextSize } from '../../system/axes';
import { InlineText } from '../../system/inlineText';
import { dataValue, toClasses } from '../../system/toClasses';
import { warnDeprecated } from '../../system/warnDeprecated';

/** Only `neutral` (muted) is supported on Text in v1; see the plan note. */
const colors = ['neutral'] as const;

/** @deprecated Text picks its element itself now. Removed in 0.2.0. */
export type TextElement = 'p' | 'span' | 'div' | 'label' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export interface TextProps extends HTMLAttributes<HTMLElement> {
  /**
   * @deprecated Text renders a `<p>`, or a `<span>` inside a Text, Heading, Button or Link. For a title use Heading.
   * Removed in 0.2.0.
   */
  as?: TextElement;
  /**
   * Size in px (14, 16, 18, 24, 32, 40). Rendered as `data-size`; reads `--bit-text-{size}px`. 24, 32 and 40 use the
   * display face. Default 16.
   * `11`, `13` and `15` are deprecated: they render as 14, 14 and 16. They will be removed in 0.2.0.
   */
  size?: TextSize | DeprecatedTextSize;
  /** `neutral` renders muted text. */
  color?: (typeof colors)[number];
  /**
   * Rendered as `data-weight`. Has no visible effect at 24, 32 and 40: those sizes use the
   * display face, which ships a single weight, so a heavier value would be browser-synthesized.
   */
  weight?: 'normal' | 'bold';
}

/** Body copy: a `<p>`, or a `<span>` when it sits inside a Text, Heading, Button or Link. */
export const Text = forwardRef<HTMLElement, TextProps>(function Text(
  { as, size = 16, color, weight = 'normal', className, children, ...rest },
  ref,
) {
  const inline = useContext(InlineText);
  if (as !== undefined) {
    warnDeprecated(
      'text-as',
      'Text as= is deprecated: Text renders a <p>, or a <span> inside a Text, Heading, Button or Link. For a title, use Heading. It will be removed in 0.2.0.',
    );
  }
  // String(): untyped callers (JS, MDX) can pass size="13", which is the old form too.
  const old = DEPRECATED_TEXT_SIZES.find((n) => String(n) === String(size));
  if (old !== undefined) {
    warnDeprecated(
      `text-size-${old}`,
      `Text size={${old}} is deprecated: the scale is even now (14, 16, 18, 24, 32, 40). Use size={${DEPRECATED_TEXT_SIZE_TO[old]}}. It will be removed in 0.2.0.`,
    );
  }
  const element = createElement(
    as ?? (inline ? 'span' : 'p'),
    {
      ref,
      className: toClasses('text', [{ name: 'color', allowed: colors, value: color }], className),
      'data-size': dataValue('text', { name: 'size', allowed: TEXT_SIZES, value: old === undefined ? size : DEPRECATED_TEXT_SIZE_TO[old] }),
      'data-weight': weight,
      ...rest,
    },
    children,
  );
  return inline ? element : createElement(InlineText.Provider, { value: true }, element);
});
