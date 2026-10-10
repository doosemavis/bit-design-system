import { createContext, forwardRef, useContext, useId, useMemo, useState } from 'react';
import type { FieldsetHTMLAttributes, InputHTMLAttributes, MouseEvent, ReactNode } from 'react';
import { SIZES } from '../../system/axes';
import type { Size } from '../../system/axes';
import { element, toClasses } from '../../system/toClasses';
import { dropLegacyColor } from '../../system/dropLegacyColor';
import { useFieldControl, useFieldLabelId } from '../Field/FieldContext';

const sizes = SIZES;

export interface RadioOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps
  extends Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, 'onChange' | 'color' | 'defaultValue' | 'role'> {
  /** Names the group. Inside a Field, leave it off: the Field's label names the group. */
  legend?: ReactNode;
  /** Hide the legend visually. It is still read. */
  legendHidden?: boolean;
  /** The choices, as data. Or pass `<Radio>` children instead. */
  options?: readonly RadioOption[];
  /** The radios' shared name, submitted with the chosen value. Default: a generated id. */
  name?: string;
  /** The chosen value, when the parent owns it. */
  value?: string;
  /** The first chosen value, when the group owns it. Default: none chosen. */
  defaultValue?: string;
  /** Called with the newly chosen value. */
  onValueChange?: (value: string) => void;
  /** Dot and label size. Class: `bit-{size}`. */
  size?: Size;
  /** Marks the choice wrong: `aria-invalid="true"` and danger edges. A surrounding Field's error does the same. */
  invalid?: boolean;
  /** One must be chosen before the form submits. A surrounding Field's `required` does the same. */
  required?: boolean;
  /** Shows the choice and keeps focus, but it can't change. Rendered as `aria-readonly`. */
  readOnly?: boolean;
  /** `<Radio>` elements, when there is no `options`. */
  children?: ReactNode;
}

interface RadioGroupContextValue {
  name: string;
  chosen: string | undefined;
  choose: (value: string) => void;
  required: boolean | undefined;
  readOnly: boolean;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size' | 'color' | 'name' | 'checked' | 'defaultChecked' | 'value' | 'children'> {
  /** The value the group reports when this one is chosen. */
  value: string;
  /** The visible label. */
  children?: ReactNode;
}

/** One choice in a RadioGroup: a real radio, visually hidden, inside a label that draws the dot. */
export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { value, className, children, onChange, onClick, ...rest },
  ref,
) {
  const group = useContext(RadioGroupContext);
  if (!group) throw new Error('[bit] Radio must be inside a RadioGroup.');
  return (
    <label className={toClasses('radio', [], className)}>
      <input
        ref={ref}
        className={element('radio', 'input')}
        {...dropLegacyColor(rest)}
        type="radio"
        name={group.name}
        value={value}
        checked={group.chosen === value}
        required={group.required}
        onClick={(event: MouseEvent<HTMLInputElement>) => {
          // Read-only: the browser puts the old choice back.
          if (group.readOnly) event.preventDefault();
          onClick?.(event);
        }}
        onChange={(event) => {
          onChange?.(event);
          group.choose(value);
        }}
      />
      <span className={element('radio', 'dot')} aria-hidden="true" />
      <span className={element('radio', 'label')}>{children}</span>
    </label>
  );
});

/**
 * Pick one of a few choices: real radios in a fieldset, so the arrow keys move the choice and Tab enters and
 * leaves the group in one stop. Give it `options` or `<Radio>` children. Inside a Field the Field's label names
 * the group, its hint and error describe it, and its required and error reach every radio.
 */
const RadioGroupBase = forwardRef<HTMLFieldSetElement, RadioGroupProps>(function RadioGroup(
  {
    legend,
    legendHidden = false,
    options,
    name,
    value,
    defaultValue,
    onValueChange,
    size = 'md',
    invalid,
    required: requiredProp,
    readOnly = false,
    className,
    children,
    ...rest
  },
  ref,
) {
  const generated = useId();
  const legendId = `${generated}-legend`;
  const fieldLabelId = useFieldLabelId();
  const { required, ...wired } = useFieldControl({ ...rest, required: requiredProp }, invalid);
  const [own, setOwn] = useState(defaultValue);
  const chosen = value ?? own;

  const context = useMemo<RadioGroupContextValue>(
    () => ({
      name: name ?? generated,
      chosen,
      required,
      readOnly,
      choose: (next) => {
        if (readOnly) return;
        if (value === undefined) setOwn(next);
        onValueChange?.(next);
      },
    }),
    [name, generated, chosen, required, readOnly, value, onValueChange],
  );

  // Named by its legend, else by the surrounding Field's label; an aria-label or aria-labelledby of its own wins.
  const labelledBy = rest['aria-labelledby'] ?? (legend ? legendId : rest['aria-label'] ? undefined : fieldLabelId);

  return (
    <fieldset
      ref={ref}
      role="radiogroup"
      className={toClasses('radio-group', [{ name: 'size', allowed: sizes, value: size }], className)}
      {...dropLegacyColor(rest)}
      {...wired}
      aria-labelledby={labelledBy}
      aria-required={required || undefined}
      aria-readonly={readOnly || undefined}
    >
      {legend ? (
        <legend id={legendId} className={element('radio-group', 'legend')} data-hidden={legendHidden ? '' : undefined}>
          {legend}
        </legend>
      ) : null}
      <div className={element('radio-group', 'options')}>
        <RadioGroupContext.Provider value={context}>
          {options
            ? options.map((option) => (
                <Radio key={option.value} value={option.value} disabled={option.disabled}>
                  {option.label}
                </Radio>
              ))
            : children}
        </RadioGroupContext.Provider>
      </div>
    </fieldset>
  );
});

/** Field reads this to know its label names a group, so it points no `for` at it (a fieldset can't be labelled). */
export const RadioGroup = Object.assign(RadioGroupBase, { bitFieldGroup: true as const });
