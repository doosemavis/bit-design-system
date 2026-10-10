import { forwardRef, useLayoutEffect, useMemo, useRef } from 'react';
import type { ChangeEvent, InputHTMLAttributes, MouseEvent, ReactNode } from 'react';
import { SIZES } from '../../system/axes';
import type { Size } from '../../system/axes';
import { element, toClasses } from '../../system/toClasses';
import { dropLegacyColor } from '../../system/dropLegacyColor';
import { composeRefs } from '../../system/Slot';
import { useFieldControl } from '../Field/FieldContext';

const sizes = SIZES;

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type' | 'color' | 'children'> {
  /** Box and label size. Class: `bit-{size}` on the label. */
  size?: Size;
  /** Shows a bar instead of a tick: some, not all, of what it stands for. Screen readers announce "mixed". */
  indeterminate?: boolean;
  /** Called with the new checked state. The native `onChange` still runs first. */
  onCheckedChange?: (checked: boolean) => void;
  /** Marks it wrong: `aria-invalid="true"` and a danger edge. A surrounding Field's error does the same. */
  invalid?: boolean;
  /** Shows its state and keeps focus, but a click or Space doesn't change it. Rendered as `aria-readonly`. */
  readOnly?: boolean;
  /** The visible label. */
  children?: ReactNode;
}

/**
 * A checkbox: a real `<input type="checkbox">`, visually hidden, inside a label that draws the box. Clicking the
 * label or pressing Space toggles it. Inside a Field it takes the Field's id, hint, error and required. The label
 * takes `className`; the input takes the ref and every other prop (checked, defaultChecked, name, value…).
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { size = 'md', indeterminate = false, onCheckedChange, invalid, readOnly = false, onChange, onClick, className, children, ...rest },
  ref,
) {
  const inputRef = useRef<HTMLInputElement>(null);
  const setRef = useMemo(() => composeRefs(ref, inputRef), [ref]);
  const wired = useFieldControl(rest, invalid);

  // indeterminate is a DOM property, never an attribute, so it is set after each render.
  useLayoutEffect(() => {
    inputRef.current!.indeterminate = indeterminate;
  });

  return (
    <label className={toClasses('checkbox', [{ name: 'size', allowed: sizes, value: size }], className)}>
      {/* type comes after the spread, so an untyped caller cannot override it. */}
      <input
        ref={setRef}
        className={element('checkbox', 'input')}
        {...dropLegacyColor(rest)}
        {...wired}
        type="checkbox"
        aria-readonly={readOnly || undefined}
        onClick={(event: MouseEvent<HTMLInputElement>) => {
          // Read-only: the browser undoes the toggle, so neither onChange nor the box moves.
          if (readOnly) event.preventDefault();
          onClick?.(event);
        }}
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          if (readOnly) return;
          onChange?.(event);
          onCheckedChange?.(event.target.checked);
        }}
      />
      <span className={element('checkbox', 'box')} aria-hidden="true" />
      {children === undefined || children === null || children === '' ? null : (
        <span className={element('checkbox', 'label')}>{children}</span>
      )}
    </label>
  );
});
