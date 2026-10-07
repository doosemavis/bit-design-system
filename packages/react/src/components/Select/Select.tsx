import { forwardRef, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ButtonHTMLAttributes, ForwardRefExoticComponent, KeyboardEvent, ReactElement, ReactNode, RefAttributes } from 'react';
import { SIZES } from '../../system/axes';
import type { Size } from '../../system/axes';
import { element, toClasses } from '../../system/toClasses';
import { dropLegacyColor } from '../../system/dropLegacyColor';
import { composeRefs } from '../../system/Slot';
import { useFieldControl, useFieldLabelId } from '../Field/FieldContext';
import { labelText, listboxName } from './naming';
import { firstEnabled, lastEnabled, page, step } from './navigation';
import { EMPTY_BUFFER, TYPEAHEAD_MS, matchTypeahead, nextBuffer } from './typeahead';
import { useListboxLayer } from './useListboxLayer';
import { SelectFormInputs } from './SelectFormInputs';
import { useSelectValue } from './useSelectValue';

const sizes = SIZES;

export interface SelectOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'value' | 'defaultValue' | 'onChange' | 'color' | 'type' | 'children'> {
  /**
   * Pick one option. Default. A `boolean` variable doesn't type-check here: render two branches (with
   * `multiple` and without), or cast.
   */
  multiple?: false;
  options: readonly SelectOption[];
  /** The chosen value, when the parent owns it. A value no option has shows the placeholder. */
  value?: string;
  /** The first chosen value, when the Select owns it, and what a form reset returns to. Default: none chosen. */
  defaultValue?: string;
  /** Called with the new value when the user chooses a different option. */
  onValueChange?: (value: string) => void;
  /** Shown, in muted text, while nothing is chosen. Default: ''. */
  placeholder?: ReactNode;
  /** The form field name: the chosen value is submitted under it, as a native select's is. */
  name?: string;
  /** Like a native select's: an empty Select blocks the form's submit and takes focus. A Field's `required` does the same. */
  required?: boolean;
  /** The id of the form the value belongs to, when the Select sits outside it. */
  form?: string;
  /** Control height. Class: `bit-{size}` on the wrapper. */
  size?: Size;
  /** Marks the choice wrong: `aria-invalid="true"` and a danger border. A surrounding Field's error does the same. */
  invalid?: boolean;
  /** Can't be opened, and submits nothing, like a disabled native select. */
  disabled?: boolean;
}

/** Props for a Select that picks any number of options. */
export interface SelectMultipleProps extends Omit<SelectProps, 'multiple' | 'value' | 'defaultValue' | 'onValueChange'> {
  /**
   * Pick any number of options: rows toggle and the list stays open. A `boolean` variable doesn't
   * type-check here: render two branches (with `multiple` and without), or cast.
   */
  multiple: true;
  /** The chosen values, when the parent owns them. Values no option has are not shown and are dropped from the next `onValueChange`. */
  value?: readonly string[];
  /** The first chosen values, when the Select owns them, and what a form reset returns to. Default: none. */
  defaultValue?: readonly string[];
  /** Receives the chosen values in option order, on every toggle. */
  onValueChange?: (value: string[]) => void;
}

type SelectRef = RefAttributes<HTMLButtonElement>;

/**
 * One call signature per mode, so `value` and `onValueChange` follow `multiple`. Single-select comes last
 * because `ComponentProps<typeof Select>` reads the last signature, as it did in 0.1.4.
 */
interface SelectComponent extends ForwardRefExoticComponent<SelectProps & SelectRef> {
  (props: SelectMultipleProps & SelectRef): ReactElement | null;
  (props: SelectProps & SelectRef): ReactElement | null;
}

/** Keys that open a closed list on the chosen option. */
const OPEN_KEYS = new Set(['Enter', ' ', 'ArrowDown', 'ArrowUp']);

type Options = readonly SelectOption[];
/** Keys that move the active row of an open list, and where they move it from `from`. */
const MOVES = new Map<string, (options: Options, from: number) => number>([
  ['ArrowDown', (options, from) => step(options, from, 1)],
  ['ArrowUp', (options, from) => step(options, from, -1)],
  ['Home', (options) => firstEnabled(options)],
  ['End', (options) => lastEnabled(options)],
  ['PageDown', (options, from) => page(options, from, 1)],
  ['PageUp', (options, from) => page(options, from, -1)],
]);

/** A key that types a character: one character, with no Ctrl, Meta or Alt. */
const printable = (event: KeyboardEvent) => event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;

/**
 * A select-only combobox (WAI-ARIA APG) that draws its own list, so it looks the same in every
 * browser. A button shows the chosen option and opens a listbox in the top layer; focus stays on the
 * button throughout. A visually hidden native input carries the value into forms, so name, required,
 * disabled, form and reset behave as a native select's do. The wrapper takes `className`; the button
 * takes the ref and every other prop. With `multiple`, rows toggle with a checkbox look and the list stays
 * open; the trigger shows the one chosen label or an "N selected" pill, and each value submits under `name`.
 */
export const Select = forwardRef<HTMLButtonElement, SelectProps | SelectMultipleProps>(function Select(
  {
    options,
    multiple,
    value,
    defaultValue,
    onValueChange,
    placeholder = '',
    name,
    required: requiredProp,
    form,
    size = 'md',
    invalid,
    disabled,
    className,
    onClick,
    onKeyDown,
    onKeyUp,
    onBlur,
    onPointerDown,
    ...rest
  },
  ref,
) {
  const listId = useId();
  const optionId = (index: number) => `${listId}-option-${index}`;
  const { required, ...wired } = useFieldControl({ ...rest, required: requiredProp }, invalid);
  const fieldLabelId = useFieldLabelId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  // The text of any <label> outside a Field, read when the list opens, to name the listbox.
  const [outsideLabel, setOutsideLabel] = useState('');
  const typed = useRef(EMPTY_BUFFER);
  // True from a press outside that closed the list until that click is over: a label's click then
  // reaches the trigger, and must not reopen the list.
  const pressedOutside = useRef(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const setTriggerRef = useMemo(() => composeRefs(ref, triggerRef), [ref]);
  const close = useCallback(() => setOpen(false), []);

  // A Select disabled while open closes, so it doesn't reappear open when enabled again.
  if (disabled && open) setOpen(false);

  const isMultiple = multiple === true;
  const { chosen, pickOne, toggle } = useSelectValue({ options, multiple: isMultiple, value, defaultValue, onValueChange, inputRef, form });

  /** Where the list opens: the chosen option, or the first enabled one (-1 when none is enabled). */
  const startIndex = () => {
    const firstChosen = chosen.find((index) => !options[index]!.disabled);
    return firstChosen ?? firstEnabled(options);
  };
  // The options can change while the list is open: an active row that is gone or now disabled
  // falls back to where the list would open, so aria-activedescendant and the keys stay valid.
  const activeIndex = active >= 0 && active < options.length && !options[active]!.disabled ? active : startIndex();
  // Keep the state on the fallback too, so the highlight doesn't jump back when the old row returns.
  if (open && active !== activeIndex) setActive(activeIndex);

  // What the list's size depends on, as a string, so an equal inline options array doesn't re-place it.
  const optionsKey = JSON.stringify(options.map((option) => [option.value, Boolean(option.disabled)]));
  useListboxLayer(open, triggerRef, listRef, close, optionsKey);

  useEffect(() => {
    if (!open) return undefined;
    function onDocumentPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (triggerRef.current!.contains(target) || listRef.current!.contains(target)) return;
      setOpen(false);
      pressedOutside.current = true;
      // Forget the press once its click (and any label activation it causes) is done, or at once if
      // it never becomes a click (pointercancel: a touch that turned into a scroll).
      const forget = () => {
        document.removeEventListener('click', afterClick, true);
        document.removeEventListener('pointercancel', forget, true);
        pressedOutside.current = false;
      };
      const afterClick = () => {
        document.removeEventListener('click', afterClick, true);
        setTimeout(forget, 0);
      };
      document.addEventListener('click', afterClick, true);
      document.addEventListener('pointercancel', forget, true);
    }
    document.addEventListener('pointerdown', onDocumentPointerDown, true);
    window.addEventListener('blur', close);
    return () => {
      document.removeEventListener('pointerdown', onDocumentPointerDown, true);
      window.removeEventListener('blur', close);
    };
  }, [open, close]);

  useEffect(() => {
    // activeIndex is always a row that exists (or -1), so the lookup is in bounds.
    if (!open || activeIndex < 0) return;
    const row = listRef.current!.children[activeIndex] as HTMLElement;
    if (typeof row.scrollIntoView === 'function') row.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex]);

  function openAt(index: number) {
    setActive(index);
    setOpen(true);
    setOutsideLabel(labelText(triggerRef.current!, wrapperRef.current!));
  }

  /**
   * The active row's action. Single: choose the option at `index` and close. Multi: toggle it and stay
   * open. A disabled option is refused, and the list stays open.
   */
  function activate(index: number) {
    if (options[index]?.disabled) return;
    if (isMultiple) {
      toggle(index);
      return;
    }
    setOpen(false);
    triggerRef.current!.focus();
    pickOne(index);
  }

  /** Tab and Alt+ArrowUp: single-select chooses the active option and closes; multi-select only closes. */
  function finish() {
    if (isMultiple) setOpen(false);
    else activate(activeIndex);
  }

  /** Add `char` to the typeahead search and return the matching option, or `from` when none matches. */
  function search(char: string, from: number): number {
    typed.current = nextBuffer(typed.current, char, Date.now());
    const labels = [...listRef.current!.children].map((row, i) => ({ label: row.textContent!, disabled: options[i]!.disabled }));
    const found = matchTypeahead(labels, typed.current.text, from);
    return found === -1 ? from : found;
  }

  function onClosedKey(event: KeyboardEvent<HTMLButtonElement>) {
    if (OPEN_KEYS.has(event.key)) {
      // Prevented, so the button's own click (Enter, Space) doesn't toggle the list shut again.
      event.preventDefault();
      openAt(startIndex());
    } else if (printable(event)) {
      event.preventDefault();
      openAt(search(event.key, startIndex()));
    }
  }

  function onOpenKey(event: KeyboardEvent<HTMLButtonElement>) {
    const { key } = event;
    const typing = Date.now() - typed.current.at <= TYPEAHEAD_MS;
    const move = MOVES.get(key);
    if (key === 'Tab') {
      // Not prevented: focus moves on as usual.
      finish();
    } else if (key === 'Escape') {
      // Stopped too, so a surrounding dialog's Escape handler doesn't close it as well.
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    } else if (key === 'ArrowUp' && event.altKey) {
      event.preventDefault();
      finish();
    } else if (key === 'Enter' || (key === ' ' && !typing)) {
      event.preventDefault();
      activate(activeIndex);
    } else if (move) {
      event.preventDefault();
      setActive(move(options, activeIndex));
    } else if (printable(event)) {
      event.preventDefault();
      setActive(search(key, activeIndex));
    }
  }

  const listName = listboxName({
    ownLabelledBy: rest['aria-labelledby'],
    ownLabel: rest['aria-label'],
    fieldLabelId,
    outsideLabel: open ? outsideLabel : '',
    triggerId: wired.id,
  });

  /** None: the placeholder. One: its label. Two or more (multi only): the "N selected" pill. */
  function triggerText(): ReactNode {
    if (chosen.length === 0) return placeholder;
    if (chosen.length === 1) return options[chosen[0]!]!.label;
    return <span className={element('select', 'count')}>{chosen.length} selected</span>;
  }

  return (
    <span
      ref={wrapperRef}
      className={toClasses('select', [{ name: 'size', allowed: sizes, value: size }], className)}
      data-open={open ? '' : undefined}
    >
      <button
        ref={setTriggerRef}
        type="button"
        role="combobox"
        className={element('select', 'control')}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && activeIndex >= 0 ? optionId(activeIndex) : undefined}
        aria-required={required || undefined}
        disabled={disabled}
        {...dropLegacyColor(rest)}
        {...wired}
        onPointerDown={(event) => {
          onPointerDown?.(event);
          pressedOutside.current = false;
        }}
        onClick={(event) => {
          onClick?.(event);
          if (pressedOutside.current) {
            // A label's click that followed the press which closed the list: leave it closed.
            pressedOutside.current = false;
          } else if (open) setOpen(false);
          else openAt(startIndex());
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          if (open) onOpenKey(event);
          else onClosedKey(event);
        }}
        onKeyUp={(event) => {
          onKeyUp?.(event);
          // Space clicks a button on key up; the keydown already did the work.
          if (event.key === ' ') event.preventDefault();
        }}
        onBlur={(event) => {
          onBlur?.(event);
          if (open && !listRef.current!.contains(event.relatedTarget)) setOpen(false);
        }}
      >
        <span className={element('select', 'value')} data-placeholder={chosen.length === 0 ? '' : undefined}>
          {triggerText()}
        </span>
      </button>
      <span
        ref={listRef}
        id={listId}
        role="listbox"
        aria-multiselectable={isMultiple || undefined}
        className={element('select', 'list')}
        hidden={!open}
        {...listName}
        // Pressing a row must not move focus off the trigger.
        onMouseDown={(event) => event.preventDefault()}
        // Nor may its click activate a <label> around the Select, which would reopen the list.
        onClick={(event) => event.preventDefault()}
      >
        {options.map((option, index) => (
          <span
            key={option.value}
            id={optionId(index)}
            role="option"
            className={element('select', 'option')}
            aria-selected={chosen.includes(index)}
            aria-disabled={option.disabled ? true : undefined}
            data-active={open && index === activeIndex ? '' : undefined}
            onClick={() => activate(index)}
            onPointerMove={() => {
              if (!option.disabled) setActive(index);
            }}
          >
            {option.label}
          </span>
        ))}
      </span>
      <SelectFormInputs
        inputRef={inputRef}
        multiple={isMultiple}
        values={chosen.map((index) => options[index]!.value)}
        name={name}
        form={form}
        required={required}
        disabled={disabled}
        onFocus={() => triggerRef.current!.focus()}
      />
    </span>
  );
}) as SelectComponent;
