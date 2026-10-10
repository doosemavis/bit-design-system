import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ChangeEvent, HTMLAttributes } from 'react';
import { PREFIX } from '@bit-ds/core/tokens';
import { COLORS, SIZES } from '../../system/axes';
import type { Color, Size } from '../../system/axes';
import { element, toClasses } from '../../system/toClasses';
import { composeRefs } from '../../system/Slot';
import { useFieldControl } from '../Field/FieldContext';
import { MAX_BLOCKS, blockCount, fractionOf, snapValue, stepCount } from './sliderMath';
import { useSliderValue } from './useSliderValue';
import { SliderBlocks } from './SliderBlocks';

const variants = ['square', 'blocks', 'round'] as const;
const colors = COLORS;
const sizes = SIZES;

export type SliderVariant = (typeof variants)[number];

export interface SliderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'color' | 'defaultValue' | 'onChange' | 'children'> {
  /** The value, when the parent owns it. Snapped to a step inside min..max, as the native input snaps it. */
  value?: number;
  /** The first value, when the Slider owns it, and what a form reset returns to. Default: min. */
  defaultValue?: number;
  /** Called with the new value, as a number, when it changes. The native `onChange` runs first. */
  onValueChange?: (value: number) => void;
  /** The native change event of the range input. */
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  /** Lowest value. Default: 0. */
  min?: number;
  /** Highest value. Default: 100. */
  max?: number;
  /** The gap between values. Default: 1. blocks draws one block per step, 20 at most. */
  step?: number;
  /** The look: a square thumb, a health bar of blocks, or a round thumb with a value bubble. Class: `bit-{variant}`. */
  variant?: SliderVariant;
  /** Thumb, track and block size. Class: `bit-{size}`. */
  size?: Size;
  /** The fill, the lit blocks and the round thumb. Class: `bit-{color}`. */
  color?: Color;
  /** Can't be changed or focused, and is faded. */
  disabled?: boolean;
  /** Shows the value and keeps focus, and submits it, but it can't change. Rendered as `aria-readonly`. */
  readOnly?: boolean;
  /** Marks it wrong: `aria-invalid="true"` and a danger edge. A surrounding Field's error does the same. */
  invalid?: boolean;
  /** The form field name: the value is submitted under it. */
  name?: string;
  /** The id of the form the value belongs to, when the Slider sits outside it. */
  form?: string;
  /** Words for the value, read by screen readers as aria-valuetext and shown in the round bubble: `(v) => \`${v}%\``. */
  formatValue?: (value: number) => string;
}

/** The axis value a `bit-{value}` in className asks for, else the prop's, so markup matches the class. */
function decorated<T extends string>(allowed: readonly T[], value: T, className: string | undefined): T {
  const supplied = className ? className.split(/\s+/) : [];
  return allowed.find((candidate) => supplied.includes(`${PREFIX}-${candidate}`)) ?? value;
}

/** True while a pointer is down on the slider, until it lifts anywhere on the page. */
function useDragging(): [boolean, () => void] {
  const [dragging, setDragging] = useState(false);
  useEffect(() => {
    if (!dragging) return undefined;
    const end = () => setDragging(false);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    return () => {
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
    };
  }, [dragging]);
  return [dragging, () => setDragging(true)];
}

/**
 * A slider: a native `<input type="range">`, see-through, over the parts that draw it, so the arrow keys, Home,
 * End, Page Up and Page Down, forms and screen readers work as the browser makes them. Inside a Field it takes the
 * Field's id, hint and error. The ref, id, name, form and aria-* props go to the input; className and the rest
 * go to the root.
 */
export const Slider = forwardRef<HTMLInputElement, SliderProps>(function Slider(
  {
    value,
    defaultValue,
    onValueChange,
    onChange,
    min = 0,
    max = 100,
    step = 1,
    variant = 'square',
    size = 'md',
    color = 'primary',
    disabled = false,
    readOnly = false,
    invalid,
    name,
    form,
    formatValue,
    id,
    tabIndex,
    autoFocus,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    'aria-describedby': ariaDescribedby,
    'aria-valuetext': ariaValuetext,
    'aria-invalid': ariaInvalid,
    className,
    style,
    ...rest
  },
  ref,
) {
  const inputRef = useRef<HTMLInputElement>(null);
  const setRef = useMemo(() => composeRefs(ref, inputRef), [ref]);
  const field = useFieldControl({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }, invalid);
  const { current, keep } = useSliderValue({ value, defaultValue, min, max, step, inputRef, form });
  const [dragging, startDragging] = useDragging();
  const [focused, setFocused] = useState(false);
  const shown = decorated(variants, variant, className);
  const canChange = !disabled && !readOnly;
  const fraction = fractionOf(current, min, max);
  const text = formatValue ? formatValue(current) : String(current);
  const steps = stepCount(min, max, step);
  const count = blockCount(min, max, step);

  useEffect(() => {
    if (process.env.NODE_ENV === 'production' || ariaLabel || ariaLabelledby || inputRef.current!.labels?.length) return;
    console.warn('[bit] bit-slider has no name. Put it in a Field, or give it aria-label or aria-labelledby.');
  }, [ariaLabel, ariaLabelledby]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'production' || shown !== 'blocks' || steps <= MAX_BLOCKS) return;
    console.warn(
      `[bit] bit-slider variant="blocks" draws one block per step, ${MAX_BLOCKS} at most. ${min} to ${max} by ${step} ` +
        `is ${steps} steps, so blocks are shared: give it a coarser step.`,
    );
  }, [shown, steps, min, max, step]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    // Read-only: React puts the input back to the current value, so it never moves.
    if (readOnly) return;
    const next = snapValue(Number(event.target.value), min, max, step);
    onChange?.(event);
    keep(next);
    if (next !== current) onValueChange?.(next);
  }

  return (
    <div
      className={toClasses(
        'slider',
        [
          { name: 'variant', allowed: variants, value: variant },
          { name: 'color', allowed: colors, value: color },
          { name: 'size', allowed: sizes, value: size },
        ],
        className,
      )}
      data-dragging={dragging ? '' : undefined}
      style={{ ...style, '--_bit-slider-fill': Number(fraction.toFixed(4)) } as CSSProperties}
      {...rest}
    >
      <input
        ref={setRef}
        className={element('slider', 'input')}
        type="range"
        min={min}
        max={max}
        step={step}
        value={current}
        name={name}
        form={form}
        disabled={disabled}
        tabIndex={tabIndex}
        autoFocus={autoFocus}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        aria-valuetext={ariaValuetext ?? (formatValue ? text : undefined)}
        aria-readonly={readOnly || undefined}
        // A range input takes no `required`, so the Field's is left off.
        id={field.id}
        aria-describedby={field['aria-describedby']}
        aria-invalid={field['aria-invalid']}
        onChange={handleChange}
        onPointerDown={() => {
          if (canChange) startDragging();
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {shown === 'blocks' ? (
        <SliderBlocks
          count={count}
          fraction={fraction}
          canChange={canChange}
          inputRef={inputRef}
          valueAt={(block) => snapValue(min + (block / count) * (max - min), min, max, step)}
          onDragStart={startDragging}
        />
      ) : (
        <>
          <span className={element('slider', 'track')} aria-hidden="true" />
          <span className={element('slider', 'fill')} aria-hidden="true" />
          <span className={element('slider', 'thumb')} aria-hidden="true">
            {shown === 'round' ? (
              <span className={element('slider', 'bubble')} data-open={focused || dragging ? '' : undefined}>
                {text}
              </span>
            ) : null}
          </span>
        </>
      )}
    </div>
  );
});
