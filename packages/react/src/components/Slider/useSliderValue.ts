import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import { snapValue } from './sliderMath';

interface SliderValueArgs {
  value: number | undefined;
  defaultValue: number | undefined;
  min: number;
  max: number;
  step: number;
  /** The range input; its form's reset puts an uncontrolled Slider back to defaultValue. */
  inputRef: RefObject<HTMLInputElement | null>;
  /** The `form` attribute, so a change re-finds the owning form. */
  form: string | undefined;
}

interface SliderValue {
  /** The value shown and submitted, snapped to a step inside min..max. */
  current: number;
  /** Keep a new value when the Slider owns it. Does nothing when the parent owns it. */
  keep: (next: number) => void;
}

/**
 * The value side of a Slider: its own value when uncontrolled, `value` when controlled, always snapped as the
 * native input would snap it. A form reset puts an uncontrolled Slider back to defaultValue (or min).
 */
export function useSliderValue({ value, defaultValue, min, max, step, inputRef, form }: SliderValueArgs): SliderValue {
  const [own, setOwn] = useState(() => snapValue(defaultValue ?? min, min, max, step));

  useEffect(() => {
    const owner = inputRef.current!.form;
    if (owner === null || value !== undefined) return undefined;
    const onReset = () => setOwn(snapValue(defaultValue ?? min, min, max, step));
    owner.addEventListener('reset', onReset);
    return () => owner.removeEventListener('reset', onReset);
  // `form` is deliberate: when the attribute changes, the effect re-finds the owning form.
  }, [inputRef, form, value, defaultValue, min, max, step]);

  const current = snapValue(value ?? own, min, max, step);
  const keep = (next: number) => {
    if (value === undefined) setOwn(next);
  };
  return { current, keep };
}
