import { forwardRef, useId, useState } from 'react';
import type { FieldsetHTMLAttributes, ReactNode } from 'react';
import { COLORS, SIZES } from '../../system/axes';
import type { Color, Size } from '../../system/axes';
import { element, toClasses } from '../../system/toClasses';

const colors = COLORS;
const sizes = SIZES;

export interface SegmentedOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

interface SegmentedControlBaseProps
  extends Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, 'onChange' | 'color' | 'defaultValue'> {
  /** Names the group; read by screen readers even when hidden. */
  legend: ReactNode;
  /** Hide the legend visually. It is still read. */
  legendHidden?: boolean;
  options: readonly SegmentedOption[];
  /** The inputs' shared name. Default: a generated id. */
  name?: string;
  /** Fill of the chosen option. Class: `bit-{color}`. */
  color?: Color;
  /** Segment height. Class: `bit-{size}`. */
  size?: Size;
}

interface SegmentedSingleProps {
  /** Pick one option (radios). Default. */
  multiple?: false;
  /** The chosen value, when the parent owns it. */
  value?: string;
  /** The first chosen value, when the control owns it. Default: the first option. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

interface SegmentedMultipleProps {
  /** Pick any number of options (checkboxes). */
  multiple: true;
  /** The chosen values, when the parent owns them. */
  value?: readonly string[];
  /** The first chosen values, when the control owns them. Default: none. */
  defaultValue?: readonly string[];
  /** Receives the chosen values in option order. */
  onValueChange?: (value: string[]) => void;
}

export type SegmentedControlProps = SegmentedControlBaseProps & (SegmentedSingleProps | SegmentedMultipleProps);

type OwnValue = { multiple: boolean; value: string | readonly string[] | undefined };

/**
 * Joined segments that pick one option, or several with `multiple`. Native radios (or checkboxes)
 * underneath, so arrow keys and Space work and Tab enters and leaves the group, with no custom keyboard code.
 */
export const SegmentedControl = forwardRef<HTMLFieldSetElement, SegmentedControlProps>(function SegmentedControl(
  {
    legend,
    legendHidden = false,
    options,
    name,
    multiple,
    value,
    defaultValue,
    onValueChange,
    color = 'primary',
    size = 'md',
    className,
    ...rest
  },
  ref,
) {
  const generatedName = useId();
  const isMultiple = multiple === true;
  const initial = (m: boolean): OwnValue['value'] =>
    m ? (Array.isArray(defaultValue) ? defaultValue : []) : typeof defaultValue === 'string' ? defaultValue : options[0]?.value;
  const [own, setOwn] = useState<OwnValue>(() => ({ multiple: isMultiple, value: initial(isMultiple) }));
  if (own.multiple !== isMultiple) setOwn({ multiple: isMultiple, value: initial(isMultiple) });
  const chosen = value ?? own.value;
  const chosenList = (Array.isArray(chosen) ? chosen : []) as readonly string[];

  function choose(next: string) {
    if (value === undefined) setOwn({ multiple: false, value: next });
    (onValueChange as ((v: string) => void) | undefined)?.(next);
  }

  function toggle(toggled: string) {
    const next = options
      .filter((o) => (o.value === toggled ? !chosenList.includes(o.value) : chosenList.includes(o.value)))
      .map((o) => o.value);
    if (value === undefined) setOwn({ multiple: true, value: next });
    (onValueChange as ((v: string[]) => void) | undefined)?.(next);
  }

  return (
    <fieldset
      ref={ref}
      className={toClasses(
        'segmented-control',
        [
          { name: 'color', allowed: colors, value: color },
          { name: 'size', allowed: sizes, value: size },
        ],
        className,
      )}
      data-multiple={isMultiple ? '' : undefined}
      {...rest}
    >
      <legend className={element('segmented-control', 'legend')} data-hidden={legendHidden ? '' : undefined}>
        {legend}
      </legend>
      <div className={element('segmented-control', 'options')}>
        {options.map((option) => (
          <label key={option.value} className={element('segmented-control', 'option')}>
            <input
              type={isMultiple ? 'checkbox' : 'radio'}
              className={element('segmented-control', 'input')}
              name={name ?? generatedName}
              value={option.value}
              checked={isMultiple ? chosenList.includes(option.value) : option.value === chosen}
              disabled={option.disabled}
              onChange={() => (isMultiple ? toggle(option.value) : choose(option.value))}
            />
            <span className={element('segmented-control', 'label')}>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
});
