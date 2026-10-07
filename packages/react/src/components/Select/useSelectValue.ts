import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import type { SelectOption } from './Select';

/** A Select's value in either mode: a string (single), an array (multi), or none. */
export type SelectValueInput = string | readonly string[] | undefined;

export interface SelectValueArgs {
  options: readonly SelectOption[];
  multiple: boolean;
  value: SelectValueInput;
  defaultValue: SelectValueInput;
  onValueChange: ((value: string) => void) | ((value: string[]) => void) | undefined;
  /** The overlaid form input; its form's reset puts an uncontrolled Select back to defaultValue. */
  inputRef: RefObject<HTMLInputElement | null>;
  /** The `form` attribute, so a change re-finds the owning form. */
  form: string | undefined;
}

export interface SelectValue {
  /** The chosen options' indexes, in option order. Values no option has are left out. At most one in single mode. */
  chosen: readonly number[];
  /** Single mode: make the option at `index` the value. Nothing happens when it already is, or there is no such option. */
  pickOne: (index: number) => void;
  /** Multi mode: add the option at `index` to the value, or take it out. Nothing happens when there is no such option. */
  toggle: (index: number) => void;
}

interface Own {
  multiple: boolean;
  value: SelectValueInput;
}

/** defaultValue as a mode takes it: a string in single mode, an array in multi mode, else nothing chosen. */
function initial(multiple: boolean, defaultValue: SelectValueInput): SelectValueInput {
  if (multiple) return Array.isArray(defaultValue) ? defaultValue : [];
  return typeof defaultValue === 'string' ? defaultValue : undefined;
}

/** The chosen indexes for `current`. A value of the wrong type for the mode chooses nothing. */
function chosenIndexes(options: readonly SelectOption[], multiple: boolean, current: SelectValueInput): number[] {
  if (multiple) {
    const values: readonly string[] = Array.isArray(current) ? current : [];
    return options.flatMap((option, index) => (values.includes(option.value) ? [index] : []));
  }
  const index = typeof current === 'string' ? options.findIndex((option) => option.value === current) : -1;
  return index === -1 ? [] : [index];
}

/**
 * The value side of a Select: its own value when uncontrolled, `value` when controlled, in either mode.
 * Changing `multiple` resets the own value to that mode's default, so a string never reaches multi mode
 * and an array never reaches single mode. A form reset puts an uncontrolled Select back to defaultValue.
 */
export function useSelectValue({ options, multiple, value, defaultValue, onValueChange, inputRef, form }: SelectValueArgs): SelectValue {
  const [own, setOwn] = useState<Own>(() => ({ multiple, value: initial(multiple, defaultValue) }));
  if (own.multiple !== multiple) setOwn({ multiple, value: initial(multiple, defaultValue) });

  useEffect(() => {
    const owner = inputRef.current!.form;
    if (owner === null || value !== undefined) return undefined;
    const onReset = () => setOwn({ multiple, value: initial(multiple, defaultValue) });
    owner.addEventListener('reset', onReset);
    return () => owner.removeEventListener('reset', onReset);
  }, [inputRef, form, value, defaultValue, multiple]);

  const current = value ?? own.value;
  const chosen = chosenIndexes(options, multiple, current);

  function pickOne(index: number) {
    const option = options[index];
    if (!option || option.value === current) return;
    if (value === undefined) setOwn({ multiple: false, value: option.value });
    (onValueChange as ((next: string) => void) | undefined)?.(option.value);
  }

  function toggle(index: number) {
    if (!options[index]) return;
    const next = options
      .filter((_, i) => (i === index ? !chosen.includes(i) : chosen.includes(i)))
      .map((option) => option.value);
    if (value === undefined) setOwn({ multiple: true, value: next });
    (onValueChange as ((next: string[]) => void) | undefined)?.(next);
  }

  return { chosen, pickOne, toggle };
}
