import { COLORS, SIZES, TEXT_SIZES, DEPRECATED_TEXT_SIZES, DEPRECATED_TEXT_SIZE_TO, HEADING_SIZES, SPACE_STEPS, headingTag } from '@bit-ds/core/tokens';
import type { Color, Size, TextSize, DeprecatedTextSize, HeadingSize, HeadingTag, SpaceStep } from '@bit-ds/core/tokens';

/** Emphasis. Rendered per component, unlike color and size which are global remaps. */
export const VARIANTS = ['solid', 'outline', 'ghost'] as const;
export type Variant = (typeof VARIANTS)[number];

export { COLORS, SIZES, TEXT_SIZES, DEPRECATED_TEXT_SIZES, DEPRECATED_TEXT_SIZE_TO, HEADING_SIZES, SPACE_STEPS, headingTag };
export type { Color, Size, TextSize, DeprecatedTextSize, HeadingSize, HeadingTag, SpaceStep };
