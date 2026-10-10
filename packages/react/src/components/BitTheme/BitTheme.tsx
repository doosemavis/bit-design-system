import { forwardRef } from 'react';
import type { ElementType, HTMLAttributes } from 'react';
import { createSlot } from '../../system/Slot';
import { toClasses } from '../../system/toClasses';
import { dropLegacyColor } from '../../system/dropLegacyColor';

/** The two modes a subtree can take. Class: `bit-{mode}`. */
const modes = ['light', 'dark'] as const;
/** A theme's name, as its file and class spell it: lowercase words joined by hyphens. */
const THEME_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const THEME_CLASS = /^bit-theme-/;
const Slot = createSlot('BitTheme');

export interface BitThemeProps extends Omit<HTMLAttributes<HTMLDivElement>, 'color'> {
  /**
   * The theme for this subtree, by name; its CSS file must be loaded. Class: `bit-theme-{theme}`. Left off, the
   * subtree keeps the theme around it.
   */
  theme?: 'power-up' | (string & {});
  /** Light or dark for this subtree. Class: `bit-{mode}`. Left off, the subtree keeps the mode around it. */
  mode?: (typeof modes)[number];
  /** Put the classes on the one child element instead of rendering a `<div>`. */
  asChild?: boolean;
}

/** `bit-theme-{theme}`, unless className already names a theme, or the name isn't a theme name. */
function themeClass(theme: string | undefined, className: string | undefined): string | undefined {
  if (theme === undefined || className?.split(/\s+/).some((name) => THEME_CLASS.test(name))) return undefined;
  if (THEME_NAME.test(theme)) return `bit-theme-${theme}`;
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[bit] BitTheme received theme="${theme}", which is not a theme name (lowercase words joined by hyphens). It was dropped.`);
  }
  return undefined;
}

/**
 * Themes a subtree: a wrapper with the theme class and the mode class, painted in that theme's page color.
 * `<BitTheme mode="dark">` makes a dark sidebar on a light page. The same classes work on any element without
 * React: `class="bit-theme bit-theme-power-up bit-dark"`.
 */
export const BitTheme = forwardRef<HTMLDivElement, BitThemeProps>(function BitTheme(
  { theme, mode, asChild = false, className, ...rest },
  ref,
) {
  const Comp: ElementType = asChild ? Slot : 'div';
  const extra = [themeClass(theme, className), className].filter(Boolean).join(' ') || undefined;
  const classes = toClasses('theme', [{ name: 'mode', allowed: modes, value: mode }], extra);
  return <Comp ref={ref} className={classes} {...dropLegacyColor(rest)} />;
});
