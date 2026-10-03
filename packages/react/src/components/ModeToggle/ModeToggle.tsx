import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { element, toClasses } from '../../system/toClasses';
import { dropLegacyColor } from '../../system/dropLegacyColor';
import { COLOR_MODES, useColorMode } from '../../mode/colorMode';
import type { ColorMode } from '../../mode/colorMode';

const sizes = ['sm', 'md'] as const;
const LABELS: Record<ColorMode, string> = { light: 'Light', dark: 'Dark' };
const ICONS: Record<ColorMode, string> = { light: '☀', dark: '☾' };

export interface ModeToggleProps extends Omit<HTMLAttributes<HTMLDivElement>, 'color' | 'children'> {
  /** Control size. Class: `bit-{size}`. */
  size?: (typeof sizes)[number];
}

/**
 * The light/dark switch. Follows the OS until clicked, then remembers the choice (see useColorMode).
 * Every ModeToggle on the page shares one store, so they always agree.
 */
export const ModeToggle = forwardRef<HTMLDivElement, ModeToggleProps>(function ModeToggle(
  { size = 'md', className, 'aria-label': ariaLabel = 'Color mode', ...rest },
  ref,
) {
  const { mode, setMode } = useColorMode();
  return (
    <div
      ref={ref}
      role="group"
      aria-label={ariaLabel}
      className={toClasses('mode-toggle', [{ name: 'size', allowed: sizes, value: size }], className)}
      {...dropLegacyColor(rest)}
    >
      {COLOR_MODES.map((option) => (
        <button
          key={option}
          type="button"
          className={element('mode-toggle', 'option')}
          aria-pressed={mode === option}
          onClick={() => setMode(option)}
        >
          <span aria-hidden="true">{ICONS[option]}</span>
          {LABELS[option]}
        </button>
      ))}
    </div>
  );
});
