import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { element, toClasses } from '../../system/toClasses';
import { dropLegacyColor } from '../../system/dropLegacyColor';
import { COLOR_MODES, useColorMode } from '../../mode/colorMode';
import { Icon } from '../Icon/Icon';
import { iconDarkMode, iconLightMode } from '../../icons/icons.generated';
import type { ColorMode } from '../../mode/colorMode';

const sizes = ['sm', 'md'] as const;
const LABELS: Record<ColorMode, string> = { light: 'Light', dark: 'Dark' };
const ICONS: Record<ColorMode, string> = { light: '☀', dark: '☾' };
/** The icon-only form draws real icons, larger than the text glyphs: md beside sm, lg beside md. */
const SVG_ICONS = { light: iconLightMode, dark: iconDarkMode } as const;
const ICON_SIZE = { sm: 'md', md: 'lg' } as const;

export interface ModeToggleProps extends Omit<HTMLAttributes<HTMLDivElement>, 'color' | 'children'> {
  /** Control size. Class: `bit-{size}`. */
  size?: (typeof sizes)[number];
  /**
   * Just the sun and moon, as square buttons with bigger icons, for a tight header. Each button keeps its name
   * (Light, Dark) for screen readers. Rendered as `data-icon-only`.
   */
  iconOnly?: boolean;
}

/**
 * The light/dark switch. Follows the OS until clicked, then remembers the choice (see useColorMode).
 * Every ModeToggle on the page shares one store, so they always agree.
 */
export const ModeToggle = forwardRef<HTMLDivElement, ModeToggleProps>(function ModeToggle(
  { size = 'md', iconOnly = false, className, 'aria-label': ariaLabel = 'Color mode', ...rest },
  ref,
) {
  const { mode, setMode } = useColorMode();
  return (
    <div
      ref={ref}
      role="group"
      aria-label={ariaLabel}
      className={toClasses('mode-toggle', [{ name: 'size', allowed: sizes, value: size }], className)}
      data-icon-only={iconOnly ? '' : undefined}
      {...dropLegacyColor(rest)}
    >
      {COLOR_MODES.map((option) => (
        <button
          key={option}
          type="button"
          className={element('mode-toggle', 'option')}
          aria-pressed={mode === option}
          aria-label={iconOnly ? LABELS[option] : undefined}
          onClick={() => setMode(option)}
        >
          {iconOnly ? (
            <Icon icon={SVG_ICONS[option]} size={ICON_SIZE[size] ?? 'md'} />
          ) : (
            <>
              <span aria-hidden="true">{ICONS[option]}</span>
              {LABELS[option]}
            </>
          )}
        </button>
      ))}
    </div>
  );
});
