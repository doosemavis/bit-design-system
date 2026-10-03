import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { element, toClasses } from '../../system/toClasses';
import { dropLegacyColor } from '../../system/dropLegacyColor';

const sizes = ['sm', 'md'] as const;

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type' | 'color' | 'role'> {
  /** Track size. Class: `bit-{size}` on the label. */
  size?: (typeof sizes)[number];
  /** The visible label. */
  children?: ReactNode;
}

/**
 * An on/off switch: a real checkbox with role="switch", visually hidden, inside a label that draws
 * the track and thumb. Clicking the label or pressing Space toggles it. The label takes `className`;
 * the input takes the ref and every other prop (checked, defaultChecked, onChange, disabled, name…).
 */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { size = 'md', className, children, ...rest },
  ref,
) {
  return (
    <label className={toClasses('switch', [{ name: 'size', allowed: sizes, value: size }], className)}>
      <input ref={ref} type="checkbox" role="switch" className={element('switch', 'input')} {...dropLegacyColor(rest)} />
      <span className={element('switch', 'track')} aria-hidden="true">
        <span className={element('switch', 'thumb')} />
      </span>
      <span className={element('switch', 'label')}>{children}</span>
    </label>
  );
});
