import { COLORS, SIZES, TEXT_SIZES, SPACE_STEPS } from '@bit/core/tokens';
import type { Color, Size, TextSize, SpaceStep } from '@bit/core/tokens';

/** Emphasis. Rendered per component, unlike color and size which are global remaps. */
export const VARIANTS = ['solid', 'outline', 'ghost'] as const;
export type Variant = (typeof VARIANTS)[number];

export { COLORS, SIZES, TEXT_SIZES, SPACE_STEPS };
export type { Color, Size, TextSize, SpaceStep };
