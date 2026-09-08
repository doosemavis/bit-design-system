import { TONES, SIZES, TEXT_SIZES, SPACE_STEPS } from '@bit/core/tokens';
import type { Tone, Size, TextSize, SpaceStep } from '@bit/core/tokens';

/** Emphasis. Rendered per component, unlike tone and size which are global remaps. */
export const VARIANTS = ['solid', 'outline', 'ghost'] as const;
export type Variant = (typeof VARIANTS)[number];

export { TONES, SIZES, TEXT_SIZES, SPACE_STEPS };
export type { Tone, Size, TextSize, SpaceStep };
