import type { Ref } from 'react';
import { element } from '../../system/toClasses';

interface SelectFormInputsProps {
  inputRef: Ref<HTMLInputElement>;
  multiple: boolean;
  /** The chosen values, in option order. */
  values: readonly string[];
  name: string | undefined;
  form: string | undefined;
  required: boolean | undefined;
  disabled: boolean | undefined;
  /** The browser focuses the overlaid input to show its validation message; pass focus on to the trigger. */
  onFocus: () => void;
}

/** The form input is controlled by the Select; typing can't reach it, and autofill changes are dropped. */
const ignoreChange = () => {};

/**
 * What a Select puts in its form. The overlaid input carries required, so the browser's message and focus
 * work as on a native select; in single mode it also carries the value under `name`. In multi mode it has
 * no name, and one hidden input per chosen value submits them under `name`, as `<select multiple>` does.
 */
export function SelectFormInputs({ inputRef, multiple, values, name, form, required, disabled, onFocus }: SelectFormInputsProps) {
  return (
    <>
      <input
        ref={inputRef}
        className={element('select', 'input')}
        type="text"
        tabIndex={-1}
        aria-hidden="true"
        autoComplete="off"
        name={multiple ? undefined : name}
        form={form}
        value={values[0] ?? ''}
        onChange={ignoreChange}
        required={required}
        disabled={disabled}
        // A blocked submit focuses the first invalid control and shows the browser's message over it;
        // this input lies over the trigger, so the message appears at the Select, and the focus goes on
        // to the trigger. `invalid` is never cancelled, so checkValidity() moves no focus.
        onFocus={onFocus}
      />
      {multiple && name !== undefined
        ? values.map((v) => <input key={v} type="hidden" name={name} form={form} value={v} disabled={disabled} />)
        : null}
    </>
  );
}
