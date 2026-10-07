import { forwardRef, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ButtonHTMLAttributes, KeyboardEvent, ReactNode } from 'react';
import { SIZES } from '../../system/axes';
import type { Size } from '../../system/axes';
import { element, toClasses } from '../../system/toClasses';
import { dropLegacyColor } from '../../system/dropLegacyColor';
import { composeRefs } from '../../system/Slot';
import { useFieldControl, useFieldLabelId } from '../Field/FieldContext';
import { firstEnabled, lastEnabled, page, step } from './navigation';
import { EMPTY_BUFFER, TYPEAHEAD_MS, matchTypeahead, nextBuffer } from './typeahead';
import { useListboxLayer } from './useListboxLayer';

const sizes = SIZES;

export interface SelectOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'value' | 'defaultValue' | 'onChange' | 'color' | 'type' | 'children'> {
  options: readonly SelectOption[];
  /** The chosen value, when the parent owns it. A value no option has shows the placeholder. */
  value?: string;
  /** The first chosen value, when the Select owns it. Default: none chosen. */
  defaultValue?: string;
  /** Called with the new value when the user chooses a different option. */
  onValueChange?: (value: string) => void;
  /** Shown, in muted text, while nothing is chosen. Default: ''. */
  placeholder?: ReactNode;
  /** With a name, a hidden input carries the chosen value into form submits. */
  name?: string;
  /** Control height. Class: `bit-{size}` on the wrapper. */
  size?: Size;
  /** Marks the choice wrong: `aria-invalid="true"` and a danger border. A surrounding Field's error does the same. */
  invalid?: boolean;
  disabled?: boolean;
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

/** The text of every <label> that points at the trigger, joined. */
function labelText(trigger: HTMLButtonElement): string {
  return [...trigger.labels]
    .map((label) => label.textContent!.trim())
    .join(' ')
    .trim();
}

interface NameSources {
  ownLabelledBy: string | undefined;
  ownLabel: string | undefined;
  fieldLabelId: string | undefined;
  /** The text of a <label for> outside a Field; '' when there is none (or the list is closed). */
  outsideLabel: string;
  triggerId: string | undefined;
}

/**
 * The listbox's name, so it is never unnamed while open: the Select's own aria-labelledby, else its
 * aria-label, else the Field label, else the text of a <label for> elsewhere, else the trigger.
 */
function listboxName(sources: NameSources): { 'aria-label'?: string; 'aria-labelledby'?: string } {
  if (sources.ownLabelledBy !== undefined) return { 'aria-labelledby': sources.ownLabelledBy };
  if (sources.ownLabel !== undefined) return { 'aria-label': sources.ownLabel };
  if (sources.fieldLabelId !== undefined) return { 'aria-labelledby': sources.fieldLabelId };
  if (sources.outsideLabel) return { 'aria-label': sources.outsideLabel };
  return { 'aria-labelledby': sources.triggerId };
}

/** A key that types a character: one character, with no Ctrl, Meta or Alt. */
const printable = (event: KeyboardEvent) => event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;

/**
 * A select-only combobox (WAI-ARIA APG) that draws its own list, so it looks the same in every
 * browser. A button shows the chosen option and opens a listbox in the top layer; focus stays on the
 * button throughout. The wrapper takes `className`; the button takes the ref and every other prop.
 */
export const Select = forwardRef<HTMLButtonElement, SelectProps>(function Select(
  {
    options,
    value,
    defaultValue,
    onValueChange,
    placeholder = '',
    name,
    size = 'md',
    invalid,
    disabled,
    className,
    onClick,
    onKeyDown,
    onKeyUp,
    ...rest
  },
  ref,
) {
  const listId = useId();
  const optionId = (index: number) => `${listId}-option-${index}`;
  const { required, ...wired } = useFieldControl(rest, invalid);
  const fieldLabelId = useFieldLabelId();
  const [own, setOwn] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  // The text of any <label for> outside a Field, read when the list opens, to name the listbox.
  const [outsideLabel, setOutsideLabel] = useState('');
  const typed = useRef(EMPTY_BUFFER);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLSpanElement>(null);
  const setTriggerRef = useMemo(() => composeRefs(ref, triggerRef), [ref]);
  const close = useCallback(() => setOpen(false), []);

  // A Select disabled while open closes, so it doesn't reappear open when enabled again.
  if (disabled && open) setOpen(false);

  const current = value ?? own;
  const chosen = options.findIndex((option) => option.value === current);
  const chosenOption = options[chosen];

  /** Where the list opens: the chosen option, or the first enabled one (-1 when none is enabled). */
  const startIndex = () => (chosenOption && !chosenOption.disabled ? chosen : firstEnabled(options));
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
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (triggerRef.current!.contains(target) || listRef.current!.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [open]);

  useEffect(() => {
    // activeIndex is always a row that exists (or -1), so the lookup is in bounds.
    if (!open || activeIndex < 0) return;
    const row = listRef.current!.children[activeIndex] as HTMLElement;
    if (typeof row.scrollIntoView === 'function') row.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex]);

  function openAt(index: number) {
    setActive(index);
    setOpen(true);
    setOutsideLabel(labelText(triggerRef.current!));
  }

  /** Choose the option at `index` and close. A disabled option is refused and the list stays open. */
  function choose(index: number) {
    const option = options[index];
    if (option?.disabled) return;
    setOpen(false);
    triggerRef.current!.focus();
    if (!option || option.value === current) return;
    if (value === undefined) setOwn(option.value);
    onValueChange?.(option.value);
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
      choose(activeIndex);
    } else if (key === 'Escape') {
      event.preventDefault();
      setOpen(false);
    } else if (key === 'Enter' || (key === 'ArrowUp' && event.altKey) || (key === ' ' && !typing)) {
      event.preventDefault();
      choose(activeIndex);
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

  return (
    <span
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
        onClick={(event) => {
          onClick?.(event);
          if (open) setOpen(false);
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
      >
        <span className={element('select', 'value')} data-placeholder={chosenOption ? undefined : ''}>
          {chosenOption ? chosenOption.label : placeholder}
        </span>
      </button>
      <span
        ref={listRef}
        id={listId}
        role="listbox"
        className={element('select', 'list')}
        hidden={!open}
        {...listName}
        // Pressing a row must not move focus off the trigger.
        onMouseDown={(event) => event.preventDefault()}
      >
        {options.map((option, index) => (
          <span
            key={option.value}
            id={optionId(index)}
            role="option"
            className={element('select', 'option')}
            aria-selected={index === chosen}
            aria-disabled={option.disabled ? true : undefined}
            data-active={open && index === activeIndex ? '' : undefined}
            onClick={() => choose(index)}
            onPointerMove={() => {
              if (!option.disabled) setActive(index);
            }}
          >
            {option.label}
          </span>
        ))}
      </span>
      {name === undefined ? null : <input type="hidden" name={name} value={chosenOption?.value ?? ''} />}
    </span>
  );
});
