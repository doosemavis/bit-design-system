import { useId, useState } from 'react';
import type { CSSProperties, RefObject } from 'react';
import { PREFIX } from '@bit-ds/core/tokens';
import { element } from '../../system/toClasses';
import { Icon } from '../Icon/Icon';
import { iconKeyboardArrowDown, iconKeyboardArrowUp } from '../../icons/icons.generated';
import { snapValue, unitSide } from './sliderMath';
import { setInputValue } from './setInputValue';

interface SliderNumberProps {
  /** The slider's value, shown when nothing is being typed. */
  value: number;
  min: number;
  max: number;
  step: number;
  /** How many characters the longest value takes: the box is this wide. */
  chars: number;
  /** A unit shown in a tab beside the box ("%" after it, "$" before it), which also describes it. */
  unit: string | undefined;
  /** The unit's side, when the caller picks it. */
  unitPosition: 'start' | 'end' | undefined;
  disabled: boolean;
  readOnly: boolean;
  /** The range input. The box moves the slider through it, so onChange, onValueChange and forms all follow. */
  inputRef: RefObject<HTMLInputElement | null>;
  /** The slider's own name for the box: its aria-label, aria-labelledby or the Field's label. */
  label: { 'aria-label'?: string; 'aria-labelledby'?: string };
  /** The slider's hint and error ids. */
  describedBy: string | undefined;
  invalid: boolean | 'true' | 'false' | 'grammar' | 'spelling' | undefined;
}

/** A typed number, or null when the box holds nothing that reads as one. */
function typed(text: string): number | null {
  if (text.trim() === '') return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

/**
 * The number box after the track, with a unit tab before or after it: a native number input that shows the slider's value and sets it. A number in
 * range moves the slider as it is typed; Enter or leaving the box pulls any number into range and onto a step,
 * and an empty box goes back to the value. Two step buttons at its end nudge it a step; they are out of the Tab
 * order and hidden from screen readers, since the box's own Up and Down keys step it. It has no name, so a form
 * gets the value once, from the range input.
 */
export function SliderNumber({ value, min, max, step, chars, unit, unitPosition, disabled, readOnly, inputRef, label, describedBy, invalid }: SliderNumberProps) {
  // What is being typed, until Enter or blur; null shows the slider's value.
  const [draft, setDraft] = useState<string | null>(null);
  // When the value moves for another reason (a drag, a key, the parent), a draft that doesn't make it is dropped.
  const [shownFor, setShownFor] = useState(value);
  if (shownFor !== value) {
    setShownFor(value);
    const number = draft === null ? null : typed(draft);
    if (number === null || snapValue(number, min, max, step) !== value) setDraft(null);
  }
  const unitId = useId();
  const canChange = !disabled && !readOnly;
  const move = (next: number) => setInputValue(inputRef.current!, next);

  function commit() {
    if (draft === null) return;
    const number = typed(draft);
    setDraft(null);
    if (number !== null) move(snapValue(number, min, max, step));
  }

  function nudge(direction: 1 | -1) {
    setDraft(null);
    move(snapValue(value + direction * step, min, max, step));
  }

  const steps = (['up', 'down'] as const).map((direction) => (
    <button
      key={direction}
      type="button"
      tabIndex={-1}
      className={element('slider', 'step')}
      data-direction={direction}
      disabled={!canChange}
      // Keep focus where it was: on the box while typing, or nowhere new.
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => nudge(direction === 'up' ? 1 : -1)}
    >
      <Icon icon={direction === 'up' ? iconKeyboardArrowUp : iconKeyboardArrowDown} size="sm" />
    </button>
  ));

  const side = unit ? (unitPosition ?? unitSide(unit)) : undefined;
  const tab = unit ? (
    <span className={element('slider', 'unit')} id={unitId}>
      {unit}
    </span>
  ) : null;

  return (
    <span className={element('slider', 'box')} data-unit={side} style={{ '--_bit-slider-chars': chars } as CSSProperties}>
      {side === 'start' ? tab : null}
      <span className={element('slider', 'spin')}>
        <input
          className={`${PREFIX}-input ${element('slider', 'number')}`}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={draft ?? String(value)}
          disabled={disabled}
          readOnly={readOnly}
          {...label}
          aria-describedby={[describedBy, unit ? unitId : undefined].filter(Boolean).join(' ') || undefined}
          aria-invalid={invalid}
          onChange={(event) => {
            const text = event.target.value;
            setDraft(text);
            const number = typed(text);
            if (number !== null && number >= min && number <= max) move(snapValue(number, min, max, step));
          }}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') commit();
          }}
        />
        <span className={element('slider', 'steps')} aria-hidden="true">
          {steps}
        </span>
      </span>
      {side === 'end' ? tab : null}
    </span>
  );
}
