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

export interface SegmentedControlProps
  extends Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, 'onChange' | 'color' | 'defaultValue'> {
  /** Names the group; read by screen readers even when hidden. */
  legend: ReactNode;
  /** Hide the legend visually. It is still read. */
  legendHidden?: boolean;
  options: readonly SegmentedOption[];
  /** The radios' shared name. Default: a generated id. */
  name?: string;
  /** The chosen value, when the parent owns it. */
  value?: string;
  /** The first chosen value, when the control owns it. Default: the first option. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Fill of the chosen option. Class: `bit-{color}`. */
  color?: Color;
  /** Segment height. Class: `bit-{size}`. */
  size?: Size;
}

/**
 * Joined segments that pick one option. Native radios underneath, so arrow keys move the choice and
 * Tab enters and leaves the group in one stop, with no custom keyboard code.
 */
export const SegmentedControl = forwardRef<HTMLFieldSetElement, SegmentedControlProps>(function SegmentedControl(
  {
    legend,
    legendHidden = false,
    options,
    name,
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
  const [ownValue, setOwnValue] = useState(defaultValue ?? options[0]?.value);
  const chosen = value ?? ownValue;

  function choose(next: string) {
    if (value === undefined) setOwnValue(next);
    onValueChange?.(next);
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
      {...rest}
    >
      <legend className={element('segmented-control', 'legend')} data-hidden={legendHidden ? '' : undefined}>
        {legend}
      </legend>
      <div className={element('segmented-control', 'options')}>
        {options.map((option) => (
          <label key={option.value} className={element('segmented-control', 'option')}>
            <input
              type="radio"
              className={element('segmented-control', 'input')}
              name={name ?? generatedName}
              value={option.value}
              checked={option.value === chosen}
              disabled={option.disabled}
              onChange={() => choose(option.value)}
            />
            <span className={element('segmented-control', 'label')}>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
});
