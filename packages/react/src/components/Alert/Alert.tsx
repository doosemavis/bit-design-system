import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { COLORS } from '../../system/axes';
import type { Color } from '../../system/axes';
import { element, toClasses } from '../../system/toClasses';
import { Button } from '../Button/Button';
import { Icon } from '../Icon/Icon';
import { iconCheckCircle, iconError, iconInfo, iconWarning } from '../../icons/icons.generated';
import type { IconData } from '../../icons/types';

const colors = COLORS;
const variants = ['solid', 'outline'] as const;

/** Each color's own icon, so the severity never rests on color alone. Neutral has none. */
const SEVERITY_ICONS: Readonly<Partial<Record<Color, IconData>>> = {
  primary: iconInfo,
  success: iconCheckCircle,
  warning: iconWarning,
  danger: iconError,
};

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  /** Color role. Class: `bit-{color}`. */
  color?: Color;
  /** `outline` uses the color's soft background; `solid` fills with the color. */
  variant?: (typeof variants)[number];
  /** Heading text rendered in the display font. This is the alert's own heading, not the native `title` tooltip attribute, which is intentionally not forwarded. */
  title?: string;
  /**
   * Shows a × button in the top corner that calls this. The Alert does not hide itself: remove it in your
   * handler (keep whether it shows in state). Without it there is no ×. The root is marked `data-dismissible`.
   */
  onDismiss?: () => void;
  /** The × button's accessible name. Default: 'Dismiss'. */
  dismissLabel?: string;
  /**
   * The leading icon, hidden from screen readers (the title and text carry the meaning). `true`: the color's own
   * icon (info, check, warning sign, error; neutral has none). `false`: no icon. An icon export: that icon.
   */
  icon?: boolean | IconData;
}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
  {
    color = 'neutral',
    variant = 'outline',
    title,
    role = 'status',
    onDismiss,
    dismissLabel = 'Dismiss',
    icon = true,
    className,
    children,
    ...rest
  },
  ref,
) {
  // A color decorator in className wins over the color prop (toClasses), so the icon follows it too.
  const shownColor = colors.find((c) => className?.split(/\s+/).includes(`bit-${c}`)) ?? color;
  const shown = icon === true ? SEVERITY_ICONS[shownColor] : icon || undefined;
  return (
    <div
      ref={ref}
      role={role}
      data-dismissible={onDismiss ? '' : undefined}
      className={toClasses(
        'alert',
        [
          { name: 'color', allowed: colors, value: color },
          { name: 'variant', allowed: variants, value: variant },
        ],
        className,
      )}
      {...rest}
    >
      {shown ? <Icon icon={shown} iconFilled className={element('alert', 'icon')} /> : null}
      {title ? <div className={element('alert', 'title')}>{title}</div> : null}
      <div className={element('alert', 'body')}>{children}</div>
      {onDismiss ? (
        <Button
          color="neutral"
          variant="outline"
          size="sm"
          type="button"
          className={element('alert', 'dismiss')}
          aria-label={dismissLabel}
          onClick={() => onDismiss()}
        >
          <span aria-hidden="true">×</span>
        </Button>
      ) : null}
    </div>
  );
});
