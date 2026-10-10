import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ChangeEvent, HTMLAttributes } from 'react';
import { PREFIX } from '@bit-ds/core/tokens';
import { COLORS, SIZES } from '../../system/axes';
import type { Color, Size } from '../../system/axes';
import { element, toClasses } from '../../system/toClasses';
import { composeRefs } from '../../system/Slot';
import { useFieldControl, useFieldLabelId } from '../Field/FieldContext';
import { MAX_BLOCKS, MAX_NOTCHES, blockCount, fractionOf, notchFractions, snapValue, stepCount, valueChars } from './sliderMath';
import { useSliderValue } from './useSliderValue';
import { useDrag } from './useDrag';
import { SliderBlocks } from './SliderBlocks';
import { SliderNumber } from './SliderNumber';

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
  /**
   * The gap between values. Default: 1. The value is always a whole step; while it is dragged the thumb glides
   * under the pointer, then settles on the step when the pointer lifts. blocks draws one block per step, 20 at most.
   */
  step?: number;
  /**
   * Snaps the thumb to each step while it is dragged, and draws a small mark under the track at each step, 20 at
   * most. square and round only: blocks always snaps. Rendered as `data-notched`.
   */
  notched?: boolean;
  /**
   * A number box after the track, which follows the slider and sets it. It takes the slider's name; a form gets the
   * value once, from the slider. square and round only. Rendered as `data-number-input`.
   */
  numberInput?: boolean;
  /** A unit for the number box, shown in a tab on its end and read with it: "%", "px", "°". Needs numberInput. */
  unit?: string;
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

/**
 * A slider: a native `<input type="range">`, see-through, over the parts that draw it, so the arrow keys, Home,
 * End, Page Up and Page Down, forms and screen readers work as the browser makes them. Inside a Field it takes the
 * Field's id, hint and error. The ref, id, name, form and aria-* props go to the input; className and the rest
 * go to the root. A drag glides the drawn thumb under the pointer while the input keeps whole steps; notched snaps
 * it instead and marks each step, and numberInput adds a number box after the track.
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
    notched = false,
    numberInput = false,
    unit,
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
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const setRef = useMemo(() => composeRefs(ref, inputRef), [ref]);
  const field = useFieldControl({ id, 'aria-describedby': ariaDescribedby, 'aria-invalid': ariaInvalid }, invalid);
  const fieldLabelId = useFieldLabelId();
  const { current, keep } = useSliderValue({ value, defaultValue, min, max, step, inputRef, form });
  const [focused, setFocused] = useState(false);
  const shown = decorated(variants, variant, className);
  // blocks are a row of steps already: notched and the number box are for square and round.
  const isNotched = notched && shown !== 'blocks';
  const hasBox = numberInput && shown !== 'blocks';
  const { dragging, glide, start: startDragging } = useDrag(rootRef, shown !== 'blocks' && !notched);
  const canChange = !disabled && !readOnly;
  const fraction = glide ?? fractionOf(current, min, max);
  const text = formatValue ? formatValue(current) : String(current);
  const steps = stepCount(min, max, step);
  const count = blockCount(min, max, step);
  const notches = isNotched ? notchFractions(min, max, step) : [];

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

  useEffect(() => {
    if (process.env.NODE_ENV === 'production' || !isNotched || steps + 1 <= MAX_NOTCHES) return;
    console.warn(
      `[bit] bit-slider notched draws a mark per step, ${MAX_NOTCHES} at most. ${min} to ${max} by ${step} is ` +
        `${steps + 1} marks, so it draws none: give it a coarser step.`,
    );
  }, [isNotched, steps, min, max, step]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'production' || !numberInput || shown !== 'blocks') return;
    console.warn('[bit] bit-slider variant="blocks" has no number box, so numberInput is ignored. Use square or round.');
  }, [numberInput, shown]);

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
      data-notched={isNotched ? '' : undefined}
      data-number-input={hasBox ? '' : undefined}
      ref={rootRef}
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
        onPointerDown={(event) => {
          if (canChange) startDragging(event.clientX);
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
          {notches.length > 0 ? (
            <span className={element('slider', 'notches')} aria-hidden="true">
              {notches.map((at) => (
                <span key={at} className={element('slider', 'notch')} style={{ '--_bit-slider-at': at } as CSSProperties} />
              ))}
            </span>
          ) : null}
        </>
      )}
      {hasBox ? (
        <SliderNumber
          value={current}
          min={min}
          max={max}
          step={step}
          chars={valueChars(min, max, step)}
          unit={unit}
          disabled={disabled}
          readOnly={readOnly}
          inputRef={inputRef}
          label={
            ariaLabelledby || (!ariaLabel && fieldLabelId) ? { 'aria-labelledby': ariaLabelledby || fieldLabelId } : { 'aria-label': ariaLabel }
          }
          describedBy={field['aria-describedby']}
          invalid={field['aria-invalid']}
        />
      ) : null}
    </div>
  );
});
