import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { element, toClasses } from '../../system/toClasses';
import { dropLegacyColor } from '../../system/dropLegacyColor';
import { useFieldControl } from '../Field/FieldContext';

const sizes = ['sm', 'md'] as const;

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type' | 'color' | 'role'> {
  /** Track size. Class: `bit-{size}` on the label. */
  size?: (typeof sizes)[number];
  /** Marks it wrong: `aria-invalid="true"` and a danger edge on the track. A surrounding Field's error does the same. */
  invalid?: boolean;
  /** The visible label. */
  children?: ReactNode;
}

/**
 * An on/off switch: a real checkbox with role="switch", visually hidden, inside a label that draws
 * the track and thumb. Clicking the label or pressing Space toggles it. Inside a Field it takes the Field's
 * id, hint, error and required. The label takes `className`; the input takes the ref and every other prop
 * (checked, defaultChecked, onChange, disabled, name…).
 */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { size = 'md', invalid, className, children, ...rest },
  ref,
) {
  const wired = useFieldControl(rest, invalid);
  return (
    <label className={toClasses('switch', [{ name: 'size', allowed: sizes, value: size }], className)}>
      {/* type and role come after the spread, so an untyped caller cannot override them. */}
      <input ref={ref} className={element('switch', 'input')} {...dropLegacyColor(rest)} {...wired} type="checkbox" role="switch" />
      <span className={element('switch', 'track')} aria-hidden="true">
        <span className={element('switch', 'thumb')} />
      </span>
      <span className={element('switch', 'label')}>{children}</span>
    </label>
  );
});
