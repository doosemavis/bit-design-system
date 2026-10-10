import { forwardRef, isValidElement, useId, useMemo } from 'react';
import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { element, toClasses } from '../../system/toClasses';
import { dropLegacyColor } from '../../system/dropLegacyColor';
import { FieldContext } from './FieldContext';
import type { FieldContextValue } from './FieldContext';

export interface FieldProps extends Omit<HTMLAttributes<HTMLDivElement>, 'color'> {
  /** The visible label, tied to the control with `for`. */
  label: ReactNode;
  /** Help text under the control, read as its description. */
  hint?: ReactNode;
  /** Shown under the control in danger text; marks the control invalid and describes it. */
  error?: ReactNode;
  /** Shows a "*" (hidden from screen readers) and passes `required` to the control. */
  required?: boolean;
  /** Exactly one control: Input, Textarea, Select, Checkbox, Switch or RadioGroup. */
  children: ReactElement;
}

/** The control's own id, when it brings one, so the label still points at it. */
function ownId(children: ReactNode): string | undefined {
  if (!isValidElement<{ id?: unknown }>(children)) return undefined;
  return typeof children.props.id === 'string' ? children.props.id : undefined;
}

/** True for a group of controls (RadioGroup), which its label names by id: a `for` can't point at a fieldset. */
function isGroup(children: ReactNode): boolean {
  return isValidElement(children) && (children.type as { bitFieldGroup?: boolean }).bitFieldGroup === true;
}

/**
 * A label, an optional hint and an optional error around one control. The ids are shared through context, so
 * the control wires itself: no cloneElement.
 */
export const Field = forwardRef<HTMLDivElement, FieldProps>(function Field(
  { label, hint, error, required, className, children, ...rest },
  ref,
) {
  const generated = useId();
  const id = ownId(children) ?? generated;
  const labelId = `${generated}-label`;
  const hintId = `${generated}-hint`;
  const errorId = `${generated}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;
  const invalid = Boolean(error);
  const context = useMemo<FieldContextValue>(
    () => ({ id, labelId, describedBy, invalid, required }),
    [id, labelId, describedBy, invalid, required],
  );

  return (
    <div ref={ref} className={toClasses('field', [], className)} {...dropLegacyColor(rest)}>
      <label className={element('field', 'label')} id={labelId} htmlFor={isGroup(children) ? undefined : id}>
        {label}
        {required ? (
          <span className={element('field', 'required')} aria-hidden="true">
            {' *'}
          </span>
        ) : null}
      </label>
      <FieldContext.Provider value={context}>{children}</FieldContext.Provider>
      {hint ? (
        <p className={element('field', 'hint')} id={hintId}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className={element('field', 'error')} id={errorId}>
          <span aria-hidden="true">⚠ </span>
          {error}
        </p>
      ) : null}
    </div>
  );
});
