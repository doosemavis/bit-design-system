# Select multi-select, option count and Field demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give `Select` a `multiple` mode (checkbox rows, an "N selected" pill when closed, values submitted under `name`). Give the Select gallery page an option-count control and a `multiple` switch, and give the Field page a Select demo, released as 0.1.5.

**Architecture:**
- Select's value logic moves into a `useSelectValue` hook that knows both modes. Its form inputs move into `SelectFormInputs`.
- `Select.tsx` keeps the open, close, keyboard and layer logic and branches on `isMultiple` only where the behaviour differs: activate a row, Tab, Alt+ArrowUp, and the trigger text.
- CSS: multi rows are styled through `[aria-multiselectable="true"]` on the listbox, so no new state attributes.
- Gallery: three engine additions, each kept small:
  - virtual number controls;
  - `deriveChildren`, with ChildSpec props that can be arrays (hoisted to a `const` like top-level props);
  - `interactive` as a function of state.

**Tech Stack:** pnpm monorepo; React 18 + TypeScript; tsup; vitest + jsdom + Testing Library (100% coverage gate on `@bit-ds/react`); Playwright + axe for e2e; plain CSS in `packages/core`.

**Spec:** `docs/superpowers/specs/2026-10-07-select-multi-design.md`. The 0.1.4 single-select spec, `docs/superpowers/specs/2026-10-07-select-dropdown-design.md`, stays authoritative for everything multi mode doesn't change.

## Global Constraints

- **Single-select doesn't change:** its behaviour, markup and types stay as 0.1.4. Every existing test in `packages/react/src/components/Select/*.test.ts*` passes unchanged, except where a task names the edit.
- **Coverage:** `@bit-ds/react` stays at 100% statements, branches, functions and lines (`pnpm --filter @bit-ds/react test:coverage`).
- **Library CSS:**
  - Tokens only. A raw value is allowed only with a `/* raw: … */` or explanatory comment on the same or the previous line, as `select.css` already does.
  - States are attributes, never classes.
  - Forced colours use system colours.
- **Gallery CSS:** `apps/gallery/src/**/gallery.css` stays layout-only. This plan adds no gallery CSS.
- **Immutability:** never mutate arrays or objects; build new ones.
- **Gallery builds against dist:** the gallery imports `@bit-ds/react` from its built `dist/`. After any change under `packages/`, run `pnpm build` before gallery tests or e2e.
- **Commits:** conventional (`feat:`, `fix:`, `test:`, `docs:`, `chore:`), and every message ends with:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  ```
- **Protected file:** `eslint.config.js` is hook-protected. Don't edit it.
- **Versioning:** only `packages/react/package.json` gets a version bump, to 0.1.5, in Task 7. Docs and CI changes don't bump.
- **Sample text:** US spelling in sample UI strings (`Pick a color`, `Favorite color`).

## Review Focus

1. **A controlled `value` of the wrong type for the mode:**
   - Cases: a string with `multiple`, or an array without it, from a JS consumer or a cast.
   - Expected: nothing chosen, the placeholder shows, no crash. Tested in Task 1 (hook) and Task 2 (Select).
2. **Switching `multiple` on a mounted, uncontrolled Select** (the gallery switch does exactly this):
   - Expected: the old value never leaks into the new mode, and the list and form inputs follow.
   - Tested in Task 1 (hook) and Task 2 (form values after the switch).
3. **Every option disabled, or the list empty, in multi mode:**
   - Expected: Enter, Space and Tab do nothing harmful, and no `onValueChange` call. Tested in Task 2.
4. **A typed `options` number control left empty or out of range** (`''`, `0`, `99`, `7.9`, `abc`):
   - Expected: the page keeps rendering 1–20 options, never 0 or NaN. Tested in Task 5.
5. **The Field page's HTML tab while showing a Select:**
   - Expected: it disappears, and the panel falls back to Props instead of showing markup that can't work without React.
   - Tested in Task 4 (engine) and Task 5 (Field manifest).

---

## File Structure

| File | Responsibility | Task |
|---|---|---|
| `packages/react/src/components/Select/useSelectValue.ts` (new) | Own versus controlled value for both modes, the mode-switch reset, form reset, `pickOne` and `toggle` | 1 |
| `packages/react/src/components/Select/useSelectValue.test.tsx` (new) | Hook unit tests | 1 |
| `packages/react/src/components/Select/SelectFormInputs.tsx` (new) | The overlaid validation input, plus one hidden input per chosen value in multi mode | 2 |
| `packages/react/src/components/Select/Select.tsx` | Types (`SelectMultipleProps`, overloads), `isMultiple` branches, pill, `aria-multiselectable` | 1, 2 |
| `packages/react/src/components/Select/Select.multi.test.tsx` (new) | Multi-mode behaviour, forms and types | 2 |
| `packages/react/src/index.ts` | Export `SelectMultipleProps` | 2 |
| `packages/core/src/components/select.css` | Checkbox rows, chosen-row override, pill, forced colours | 3 |
| `packages/core/src/__tests__/components/select.test.ts` | CSS rule tests | 3 |
| `apps/gallery/src/manifests/types.ts` | `NumberControl.virtual`, `ChildSpec.props: LiteralValue`, `deriveChildren`, `interactive` as a function | 4 |
| `apps/gallery/src/manifests/virtual.ts` (new) | `isVirtual(control)` | 4 |
| `apps/gallery/src/engine/childSpecs.ts` (new) | `childSpecs(manifest, state)`, `isInteractive(manifest, state)` | 4 |
| `apps/gallery/src/engine/buildProps.ts`, `engine/renderManifest.tsx`, `code/toJsx.ts`, `code/codeFormats.ts`, `code/CodePanel.tsx` | Use the above | 4 |
| `apps/gallery/src/test/manifest.ts` (new) | `testManifest()` builder for engine tests | 4 |
| `apps/gallery/src/manifests/select.ts`, `manifests/field.ts` | The new controls, presets and docs | 5 |
| `apps/gallery/src/manifests/manifests.test.ts`, `code/toJsx.test.ts`, `pages/ComponentPage.test.tsx` | Updated and new expectations | 4, 5 |
| `apps/gallery/e2e/select-multi.spec.ts` (new), `e2e/select-dropdown.spec.ts` | Browser checks | 6 |
| `CHANGELOG.md`, `README.md`, `packages/react/README.md`, `packages/react/package.json`, `scripts/smoke-consumer.mjs`, `packages/react/scripts/verify-dist.mjs` | Release | 7 |

---

### Task 1: `useSelectValue` hook (both modes); Select uses it for single mode

**Files:**
- Create: `packages/react/src/components/Select/useSelectValue.ts`
- Create: `packages/react/src/components/Select/useSelectValue.test.tsx`
- Modify: `packages/react/src/components/Select/Select.tsx` (the `own` state, `current`/`chosen`/`chosenOption`, the reset effect, and `choose`)

**Interfaces:**
- Produces (used by Task 2):
  ```ts
  export type SelectValueInput = string | readonly string[] | undefined;
  export interface SelectValueArgs {
    options: readonly SelectOption[];
    multiple: boolean;
    value: SelectValueInput;
    defaultValue: SelectValueInput;
    onValueChange: ((value: string) => void) | ((value: string[]) => void) | undefined;
    inputRef: RefObject<HTMLInputElement | null>;
    form: string | undefined;
  }
  export interface SelectValue {
    chosen: readonly number[];      // chosen option indexes, option order; ≤1 in single mode
    pickOne: (index: number) => void; // single: set value; no call when unchanged or index out of range
    toggle: (index: number) => void;  // multi: add/remove; no call when index out of range
  }
  export function useSelectValue(args: SelectValueArgs): SelectValue;
  ```
- Neither function checks `disabled`; the caller (Select's `activate`) refuses disabled rows.

- [ ] **Step 1: Write the failing hook tests**

Create `packages/react/src/components/Select/useSelectValue.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useSelectValue } from './useSelectValue';
import type { SelectValueArgs } from './useSelectValue';
import type { SelectOption } from './Select';

const OPTIONS: readonly SelectOption[] = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B' },
  { value: 'c', label: 'C' },
];

function setup(initial: Partial<SelectValueArgs> = {}) {
  // A detached input has no form, so the reset listener is never attached here; Select.form tests cover reset.
  const inputRef = { current: document.createElement('input') };
  const base: SelectValueArgs = {
    options: OPTIONS,
    multiple: false,
    value: undefined,
    defaultValue: undefined,
    onValueChange: undefined,
    inputRef,
    form: undefined,
  };
  return renderHook((props: Partial<SelectValueArgs>) => useSelectValue({ ...base, ...props }), { initialProps: initial });
}

describe('useSelectValue: single mode', () => {
  it('starts from defaultValue and picks a new option, calling onValueChange once per change', () => {
    const onValueChange = vi.fn();
    const { result } = setup({ defaultValue: 'b', onValueChange });
    expect(result.current.chosen).toEqual([1]);
    act(() => result.current.pickOne(2));
    expect(result.current.chosen).toEqual([2]);
    expect(onValueChange).toHaveBeenCalledWith('c');
    act(() => result.current.pickOne(2));
    act(() => result.current.pickOne(-1));
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });

  it('controlled: value wins and pickOne only reports', () => {
    const onValueChange = vi.fn();
    const { result } = setup({ value: 'a', onValueChange });
    act(() => result.current.pickOne(1));
    expect(onValueChange).toHaveBeenCalledWith('b');
    expect(result.current.chosen).toEqual([0]);
  });

  it('a value no option has chooses nothing', () => {
    expect(setup({ value: 'zzz' }).result.current.chosen).toEqual([]);
  });
});

describe('useSelectValue: multi mode', () => {
  it('starts empty and toggles into option order, never mutating the previous array', () => {
    const onValueChange = vi.fn();
    const { result } = setup({ multiple: true, onValueChange });
    expect(result.current.chosen).toEqual([]);
    act(() => result.current.toggle(2));
    const first = onValueChange.mock.calls[0]![0] as string[];
    act(() => result.current.toggle(0));
    expect(onValueChange.mock.calls[1]![0]).toEqual(['a', 'c']);
    expect(first).toEqual(['c']);
    expect(result.current.chosen).toEqual([0, 2]);
    act(() => result.current.toggle(0));
    expect(onValueChange.mock.calls[2]![0]).toEqual(['c']);
    expect(result.current.chosen).toEqual([2]);
  });

  it('defaultValue in any order, with unknown values, becomes option-order indexes', () => {
    expect(setup({ multiple: true, defaultValue: ['c', 'zzz', 'a'] }).result.current.chosen).toEqual([0, 2]);
  });

  it('controlled: value wins and toggle only reports', () => {
    const onValueChange = vi.fn();
    const { result } = setup({ multiple: true, value: ['b'], onValueChange });
    act(() => result.current.toggle(0));
    expect(onValueChange).toHaveBeenCalledWith(['a', 'b']);
    expect(result.current.chosen).toEqual([1]);
  });

  it('toggle(-1) (no active row) does nothing', () => {
    const onValueChange = vi.fn();
    const { result } = setup({ multiple: true, onValueChange });
    act(() => result.current.toggle(-1));
    expect(onValueChange).not.toHaveBeenCalled();
  });
});

describe('useSelectValue: the wrong type for the mode, and switching modes', () => {
  it('a string value in multi mode, or an array in single mode, chooses nothing', () => {
    expect(setup({ multiple: true, value: 'a' }).result.current.chosen).toEqual([]);
    expect(setup({ value: ['a'] as unknown as string }).result.current.chosen).toEqual([]);
  });

  it('switching to multi resets the own value to [] (a string defaultValue does not carry over), and back again', () => {
    const { result, rerender } = setup({ defaultValue: 'b' });
    expect(result.current.chosen).toEqual([1]);
    rerender({ defaultValue: 'b', multiple: true });
    expect(result.current.chosen).toEqual([]);
    act(() => result.current.toggle(0));
    expect(result.current.chosen).toEqual([0]);
    rerender({ defaultValue: 'b', multiple: false });
    expect(result.current.chosen).toEqual([1]);
  });

  it('an array defaultValue fits multi mode and is dropped in single mode', () => {
    const { result, rerender } = setup({ multiple: true, defaultValue: ['a'] });
    expect(result.current.chosen).toEqual([0]);
    rerender({ multiple: false, defaultValue: ['a'] });
    expect(result.current.chosen).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the hook tests to verify they fail**

Run: `pnpm --filter @bit-ds/react exec vitest run src/components/Select/useSelectValue.test.tsx`
Expected: FAIL. The run can't resolve `./useSelectValue`.

- [ ] **Step 3: Write the hook**

Create `packages/react/src/components/Select/useSelectValue.ts`:

```ts
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
```

- [ ] **Step 4: Run the hook tests to verify they pass**

Run: `pnpm --filter @bit-ds/react exec vitest run src/components/Select/useSelectValue.test.tsx`
Expected: PASS (10 tests).

- [ ] **Step 5: Make Select use the hook (single mode only, so no behaviour change)**

In `packages/react/src/components/Select/Select.tsx`:

1. Add `import { useSelectValue } from './useSelectValue';`.
2. Delete `const [own, setOwn] = useState(defaultValue);`.
3. Replace these lines:
   ```ts
   const current = value ?? own;
   const chosen = options.findIndex((option) => option.value === current);
   const chosenOption = options[chosen];
   ```
   with:
   ```ts
   const { chosen, pickOne } = useSelectValue({ options, multiple: false, value, defaultValue, onValueChange, inputRef, form });
   const chosenOption = chosen.length === 1 ? options[chosen[0]!] : undefined;
   ```
   `inputRef` must be declared above this line, so move the `useRef` declarations above it if needed.
4. `startIndex` becomes:
   ```ts
   const startIndex = () => {
     const firstChosen = chosen.find((index) => !options[index]!.disabled);
     return firstChosen ?? firstEnabled(options);
   };
   ```
5. Delete the reset `useEffect` (the hook owns it now).
6. `choose` becomes:
   ```ts
   /** Choose the option at `index` and close. A disabled option is refused and the list stays open. */
   function choose(index: number) {
     if (options[index]?.disabled) return;
     setOpen(false);
     triggerRef.current!.focus();
     pickOne(index);
   }
   ```
7. In the option rows, `aria-selected={index === chosen}` becomes `aria-selected={chosen.includes(index)}`.

Keep `value`, `defaultValue` and `onValueChange` typed as today: `SelectProps` doesn't change in this task. `useState` is still used by `open`, `active` and `outsideLabel`.

- [ ] **Step 6: Run the whole React suite with coverage**

Run: `pnpm --filter @bit-ds/react test:coverage`
Expected: every existing Select test passes unchanged, and coverage is 100% for all four metrics. If a branch in `useSelectValue.ts` shows uncovered, add the missing case to `useSelectValue.test.tsx`; don't add `/* istanbul ignore */`.

- [ ] **Step 7: Typecheck, lint, commit**

Run: `pnpm --filter @bit-ds/react typecheck && pnpm lint`
Expected: no errors.

```bash
git add packages/react/src/components/Select/useSelectValue.ts packages/react/src/components/Select/useSelectValue.test.tsx packages/react/src/components/Select/Select.tsx
git commit -m "refactor(react): Select's value logic moves into useSelectValue, ready for multi mode

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Select `multiple`: types, behaviour, pill, forms, export

**Files:**
- Create: `packages/react/src/components/Select/SelectFormInputs.tsx`
- Create: `packages/react/src/components/Select/Select.multi.test.tsx`
- Modify: `packages/react/src/components/Select/Select.tsx`
- Modify: `packages/react/src/index.ts:42`

**Interfaces:**
- Consumes: `useSelectValue`, `SelectValueInput` (Task 1).
- Produces:
  - `SelectMultipleProps`, exported from the package.
  - DOM, for Task 3's CSS and Task 6's e2e:
    - the listbox `[aria-multiselectable="true"]` in multi mode;
    - the pill `span.bit-select__count` inside `span.bit-select__value`, text `"{N} selected"`;
    - in multi mode with a `name`, `input[type="hidden"][name]`, one per chosen value.

- [ ] **Step 1: Write the failing multi tests**

Create `packages/react/src/components/Select/Select.multi.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from './Select';
import type { SelectMultipleProps, SelectOption, SelectProps } from './Select';
import { Field } from '../Field/Field';
import { expectNoA11yViolations } from '../../test/a11y';

const OPTIONS: readonly SelectOption[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter', disabled: true },
  { value: 'year', label: 'Year' },
];

const trigger = () => screen.getByRole('combobox');
const isOpen = () => trigger().getAttribute('aria-expanded') === 'true';
const valueBox = (container: HTMLElement) => container.querySelector<HTMLElement>('.bit-select__value')!;
const row = (name: string) => screen.getByRole('option', { name, hidden: true });

function setup(props: Partial<SelectMultipleProps> = {}) {
  const user = userEvent.setup();
  const onValueChange = vi.fn();
  const utils = render(<Select multiple aria-label="Range" options={OPTIONS} onValueChange={onValueChange} {...props} />);
  return { user, onValueChange, ...utils };
}

describe('Select multiple: ARIA and the closed trigger', () => {
  it('the listbox is multiselectable and every row reports aria-selected true or false', () => {
    const { container } = setup({ defaultValue: ['week'] });
    const list = container.querySelector('[role="listbox"]')!;
    expect(list).toHaveAttribute('aria-multiselectable', 'true');
    expect(row('Week')).toHaveAttribute('aria-selected', 'true');
    expect(row('Day')).toHaveAttribute('aria-selected', 'false');
  });

  it('single mode has no aria-multiselectable', () => {
    const { container } = render(<Select aria-label="Range" options={OPTIONS} />);
    expect(container.querySelector('[role="listbox"]')).not.toHaveAttribute('aria-multiselectable');
  });

  it('none chosen shows the placeholder; one shows its label; two or more show the "N selected" pill', () => {
    const { container, rerender } = render(<Select multiple aria-label="Range" options={OPTIONS} placeholder="Pick" value={[]} />);
    expect(valueBox(container)).toHaveTextContent('Pick');
    expect(valueBox(container)).toHaveAttribute('data-placeholder');
    rerender(<Select multiple aria-label="Range" options={OPTIONS} placeholder="Pick" value={['month']} />);
    expect(valueBox(container)).toHaveTextContent('Month');
    expect(valueBox(container)).not.toHaveAttribute('data-placeholder');
    expect(container.querySelector('.bit-select__count')).toBeNull();
    rerender(<Select multiple aria-label="Range" options={OPTIONS} placeholder="Pick" value={['day', 'year', 'week']} />);
    const pill = container.querySelector('.bit-select__count')!;
    expect(pill.tagName).toBe('SPAN');
    expect(pill.parentElement).toBe(valueBox(container));
    expect(pill).toHaveTextContent('3 selected');
  });

  it('values no option has are not counted', () => {
    const { container } = setup({ value: ['day', 'zzz', 'nope'] });
    expect(valueBox(container)).toHaveTextContent('Day');
    expect(container.querySelector('.bit-select__count')).toBeNull();
  });

  it('a string value in multi mode chooses nothing (wrong type from JS)', () => {
    const { container } = setup({ value: 'day' as unknown as string[], placeholder: 'Pick' });
    expect(valueBox(container)).toHaveTextContent('Pick');
  });
});

describe('Select multiple: toggling keeps the list open', () => {
  it('clicking rows toggles them in option order, the list stays open, and focus stays on the trigger', async () => {
    const { user, onValueChange, container } = setup();
    await user.click(trigger());
    await user.click(row('Year'));
    await user.click(row('Day'));
    expect(isOpen()).toBe(true);
    expect(trigger()).toHaveFocus();
    expect(onValueChange).toHaveBeenNthCalledWith(1, ['year']);
    expect(onValueChange).toHaveBeenNthCalledWith(2, ['day', 'year']);
    expect(container.querySelector('.bit-select__count')).toHaveTextContent('2 selected');
    await user.click(row('Day'));
    expect(onValueChange).toHaveBeenNthCalledWith(3, ['year']);
  });

  it('Enter and Space toggle the active row and keep the list open', async () => {
    const { user, onValueChange } = setup();
    trigger().focus();
    await user.keyboard('{Enter}');
    expect(isOpen()).toBe(true);
    await user.keyboard('{Enter}');
    await user.keyboard('{ArrowDown}');
    await user.keyboard(' ');
    expect(isOpen()).toBe(true);
    expect(onValueChange).toHaveBeenLastCalledWith(['day', 'week']);
  });

  it('a disabled row is refused', async () => {
    const { user, onValueChange } = setup();
    await user.click(trigger());
    await user.click(row('Quarter'));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(isOpen()).toBe(true);
  });

  it('a chosen disabled option stays chosen and toggling others keeps it', async () => {
    const { user, onValueChange } = setup({ defaultValue: ['quarter'] });
    await user.click(trigger());
    await user.click(row('Day'));
    expect(onValueChange).toHaveBeenCalledWith(['day', 'quarter']);
  });

  it('opens with the first chosen enabled option active', async () => {
    const { user } = setup({ defaultValue: ['quarter', 'month'] });
    trigger().focus();
    await user.keyboard('{ArrowDown}');
    const active = document.getElementById(trigger().getAttribute('aria-activedescendant')!);
    expect(active).toHaveTextContent('Month');
  });

  it('with every option disabled, Enter, Space and Tab call nothing', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Select multiple aria-label="Range" options={[{ value: 'x', label: 'X', disabled: true }]} onValueChange={onValueChange} />,
    );
    trigger().focus();
    await user.keyboard('{Enter}');
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    await user.keyboard('{Tab}');
    expect(onValueChange).not.toHaveBeenCalled();
  });
});

describe('Select multiple: closing never toggles', () => {
  it.each([
    ['Escape', '{Escape}'],
    ['Alt+ArrowUp', '{Alt>}{ArrowUp}{/Alt}'],
  ])('%s closes without toggling and keeps focus on the trigger', async (_name, keys) => {
    const { user, onValueChange } = setup();
    trigger().focus();
    await user.keyboard('{ArrowDown}');
    await user.keyboard(keys);
    expect(isOpen()).toBe(false);
    expect(onValueChange).not.toHaveBeenCalled();
    expect(trigger()).toHaveFocus();
  });

  it('Tab closes without toggling and is not prevented', () => {
    const { onValueChange } = setup();
    trigger().focus();
    fireEvent.keyDown(trigger(), { key: 'ArrowDown' });
    const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    act(() => {
      trigger().dispatchEvent(tab);
    });
    expect(tab.defaultPrevented).toBe(false);
    expect(isOpen()).toBe(false);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('a press outside closes without toggling', async () => {
    const { user, onValueChange } = setup();
    await user.click(trigger());
    await user.click(document.body);
    expect(isOpen()).toBe(false);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('single mode still chooses on Alt+ArrowUp (unchanged)', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<Select aria-label="Range" options={OPTIONS} onValueChange={onValueChange} />);
    trigger().focus();
    await user.keyboard('{ArrowDown}{ArrowDown}{Alt>}{ArrowUp}{/Alt}');
    expect(onValueChange).toHaveBeenLastCalledWith('week');
  });
});

describe('Select multiple: switching mode at runtime', () => {
  it('single → multi drops the string; multi → single drops the array', async () => {
    const user = userEvent.setup();
    const view = (multiple: boolean) =>
      multiple ? (
        <Select multiple aria-label="Range" options={OPTIONS} name="r" placeholder="Pick" />
      ) : (
        <Select aria-label="Range" options={OPTIONS} name="r" placeholder="Pick" defaultValue="day" />
      );
    const { container, rerender } = render(<form>{view(false)}</form>);
    expect(valueBox(container)).toHaveTextContent('Day');
    rerender(<form>{view(true)}</form>);
    expect(valueBox(container)).toHaveTextContent('Pick');
    expect(new FormData(container.querySelector('form')!).getAll('r')).toEqual([]);
    await user.click(trigger());
    await user.click(row('Week'));
    await user.click(row('Year'));
    rerender(<form>{view(false)}</form>);
    expect(valueBox(container)).toHaveTextContent('Day');
    expect(new FormData(container.querySelector('form')!).getAll('r')).toEqual(['day']);
  });
});

describe('Select multiple in a form', () => {
  it('submits every chosen value under name, in option order', () => {
    const { container } = render(
      <form>
        <Select multiple aria-label="Range" options={OPTIONS} name="range" defaultValue={['year', 'day']} />
      </form>,
    );
    expect(new FormData(container.querySelector('form')!).getAll('range')).toEqual(['day', 'year']);
  });

  it('without a name submits nothing', () => {
    const { container } = render(
      <form>
        <Select multiple aria-label="Range" options={OPTIONS} defaultValue={['day']} />
      </form>,
    );
    expect([...new FormData(container.querySelector('form')!).keys()]).toEqual([]);
  });

  it('required blocks an empty submit and passes with one chosen', () => {
    const onSubmit = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    const { container, rerender } = render(
      <form onSubmit={onSubmit}>
        <Select multiple aria-label="Range" options={OPTIONS} name="range" required value={[]} />
      </form>,
    );
    act(() => container.querySelector('form')!.requestSubmit());
    expect(onSubmit).not.toHaveBeenCalled();
    expect(trigger()).toHaveAttribute('aria-required', 'true');
    rerender(
      <form onSubmit={onSubmit}>
        <Select multiple aria-label="Range" options={OPTIONS} name="range" required value={['week']} />
      </form>,
    );
    act(() => container.querySelector('form')!.requestSubmit());
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('the validation input has no name in multi mode, so it adds no extra entry', () => {
    const { container } = render(
      <form>
        <Select multiple aria-label="Range" options={OPTIONS} name="range" defaultValue={['week']} />
      </form>,
    );
    expect(container.querySelector('.bit-select__input')).not.toHaveAttribute('name');
  });

  it('disabled submits nothing and never blocks', () => {
    const onSubmit = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    const { container } = render(
      <form onSubmit={onSubmit}>
        <Select multiple disabled required aria-label="Range" options={OPTIONS} name="range" defaultValue={['day']} />
      </form>,
    );
    expect(new FormData(container.querySelector('form')!).getAll('range')).toEqual([]);
    act(() => container.querySelector('form')!.requestSubmit());
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('form="id" ties every hidden input to that form', () => {
    const { container } = render(
      <>
        <form id="f" />
        <Select multiple aria-label="Range" options={OPTIONS} name="range" form="f" defaultValue={['day', 'week']} />
      </>,
    );
    expect(new FormData(container.querySelector('form')!).getAll('range')).toEqual(['day', 'week']);
  });

  it('reset puts an uncontrolled multi Select back to defaultValue without calling onValueChange', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(
      <form>
        <Select multiple aria-label="Range" options={OPTIONS} name="range" defaultValue={['day']} onValueChange={onValueChange} />
      </form>,
    );
    await user.click(trigger());
    await user.click(row('Week'));
    expect(new FormData(container.querySelector('form')!).getAll('range')).toEqual(['day', 'week']);
    act(() => container.querySelector('form')!.reset());
    expect(new FormData(container.querySelector('form')!).getAll('range')).toEqual(['day']);
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });
});

describe('Select multiple: Field, axe and types', () => {
  it('inside a Field takes its label, and required from the Field', () => {
    render(
      <Field label="Ranges" required>
        <Select multiple options={OPTIONS} />
      </Field>,
    );
    expect(screen.getByRole('combobox', { name: /Ranges/ })).toHaveAttribute('aria-required', 'true');
  });

  it('has no axe violations closed with the pill, or open', async () => {
    const user = userEvent.setup();
    const { container } = render(<Select multiple aria-label="Range" options={OPTIONS} defaultValue={['day', 'week']} />);
    await expectNoA11yViolations(container);
    await user.click(trigger());
    await expectNoA11yViolations(document.body);
  });

  it('types: multiple takes string[] and reports string[]; single is unchanged', () => {
    const onMany: SelectMultipleProps['onValueChange'] = (v) => void v.join();
    const onOne: SelectProps['onValueChange'] = (v) => void v.toUpperCase();
    void (<Select multiple aria-label="x" options={OPTIONS} value={['day']} onValueChange={onMany} />);
    void (<Select aria-label="x" options={OPTIONS} value="day" onValueChange={onOne} />);
    // @ts-expect-error multiple takes string[]
    void (<Select multiple aria-label="x" options={OPTIONS} value="day" />);
    // @ts-expect-error single takes string
    void (<Select aria-label="x" options={OPTIONS} value={['day']} />);
    interface WithHint extends SelectProps {
      hint?: string;
    }
    const withHint: WithHint = { options: OPTIONS, hint: 'h' };
    expect(withHint.hint).toBe('h');
  });
});
```

Check that `expectNoA11yViolations` accepts the element as `Select.test.tsx` uses it (`src/test/a11y`). If its signature differs, pass what it takes.

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm --filter @bit-ds/react exec vitest run src/components/Select/Select.multi.test.tsx`
Expected: FAIL. There's no `aria-multiselectable` and no pill, and `SelectMultipleProps` doesn't exist yet.

- [ ] **Step 3: Create `SelectFormInputs.tsx`**

```tsx
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
```

- [ ] **Step 4: Change `Select.tsx`**

1. **Imports:** add `ForwardRefExoticComponent, ReactElement, RefAttributes` to the type import from `react`. Add `import { SelectFormInputs } from './SelectFormInputs';`. Delete `ignoreChange` from Select.tsx (it now lives in `SelectFormInputs.tsx`).
2. **`SelectProps`:** add the first member:
   ```ts
   /**
    * Pick one option. Default. A `boolean` variable doesn't type-check here: render two branches (with
    * `multiple` and without), or cast.
    */
   multiple?: false;
   ```
3. **After `SelectProps`, add:**
   ```ts
   /** Props for a Select that picks any number of options. */
   export interface SelectMultipleProps extends Omit<SelectProps, 'multiple' | 'value' | 'defaultValue' | 'onValueChange'> {
     /**
      * Pick any number of options: rows toggle and the list stays open. A `boolean` variable doesn't
      * type-check here: render two branches (with `multiple` and without), or cast.
      */
     multiple: true;
     /** The chosen values, when the parent owns them. Values no option has are ignored. */
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
   ```
4. **The component:** `forwardRef<HTMLButtonElement, SelectProps>(function Select(` becomes `forwardRef<HTMLButtonElement, SelectProps | SelectMultipleProps>(function Select(`. The closing `});` becomes `}) as SelectComponent;`. Add `multiple,` to the destructured props, after `options,`.
5. **After the destructuring:**
   ```ts
   const isMultiple = multiple === true;
   ```
   Then change the hook call to `useSelectValue({ options, multiple: isMultiple, value, defaultValue, onValueChange, inputRef, form })` and destructure `toggle` too: `const { chosen, pickOne, toggle } = …`.
6. **Replace `choose` with `activate` and `finish`:**
   ```ts
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
   ```
7. **In `onOpenKey`, replace the Tab and Enter branches:**
   ```ts
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
   ```
   The Alt+ArrowUp branch must stay before `move`, because ArrowUp is in `MOVES`. The rest is unchanged.
8. **Option rows:** `onClick={() => choose(index)}` becomes `onClick={() => activate(index)}`. The listbox gets `aria-multiselectable={isMultiple || undefined}`.
9. **Trigger value:**
   ```tsx
   <span className={element('select', 'value')} data-placeholder={chosen.length === 0 ? '' : undefined}>
     {triggerText()}
   </span>
   ```
   with, above `return`:
   ```tsx
   /** None: the placeholder. One: its label. Two or more (multi only): the "N selected" pill. */
   function triggerText(): ReactNode {
     if (chosen.length === 0) return placeholder;
     if (chosen.length === 1) return options[chosen[0]!]!.label;
     return <span className={element('select', 'count')}>{chosen.length} selected</span>;
   }
   ```
   Delete `chosenOption` if nothing else uses it.
10. **Replace the `<input … />` with:**
    ```tsx
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
    ```
11. **Doc comment above `Select`:** add one sentence: "With `multiple`, rows toggle with a checkbox look and the list stays open; the trigger shows the one chosen label or an "N selected" pill, and each value submits under `name`."

- [ ] **Step 5: Export the type**

In `packages/react/src/index.ts`, line 42 becomes:
```ts
export type { SelectProps, SelectMultipleProps, SelectOption } from './components/Select/Select';
```

- [ ] **Step 6: Run the Select tests, the full suite with coverage, and the typecheck**

Run: `pnpm --filter @bit-ds/react test:coverage && pnpm --filter @bit-ds/react typecheck`
Expected:
- Every test passes: the new multi file and every existing single-select file, unchanged.
- Coverage is 100% for all four metrics.
- The typecheck is clean. The two `@ts-expect-error` lines must each be an error; an unused `@ts-expect-error` fails tsc.
- Report `wc -l Select.tsx` in the task report. The spec's limit is about 400 lines. If it's over, move `onClosedKey` and `onOpenKey` unchanged into a `useSelectKeys.ts` hook that takes what they read; don't split mid-function.

- [ ] **Step 7: Lint and commit**

Run: `pnpm lint`

```bash
git add packages/react/src/components/Select packages/react/src/index.ts
git commit -m "feat(react): Select multiple: toggling rows, an \"N selected\" pill, and each value submitted under name

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Core CSS: checkbox rows, chosen-row override, pill, forced colours

**Files:**
- Modify: `packages/core/src/components/select.css`
- Test: `packages/core/src/__tests__/components/select.test.ts`

**Interfaces:**
- Consumes these DOM hooks from Task 2:
  - `.bit-select__list[aria-multiselectable="true"]`;
  - `.bit-select__option[aria-selected="true"]` and `[data-active]`;
  - `.bit-select__count`.

- [ ] **Step 1: Write the failing CSS tests**

Append inside the top-level `describe('components/select.css', …)` in `packages/core/src/__tests__/components/select.test.ts`:

```ts
  describe('multi-select (0.1.5)', () => {
    const MULTI = '.bit-select__list[aria-multiselectable="true"] .bit-select__option';

    it('multi rows are flex rows with a gap, and lead with an 18px checkbox drawn in tokens', () => {
      const rowRule = block(css, MULTI)!;
      expect(decl(rowRule, 'display')).toBe('flex');
      expect(decl(rowRule, 'align-items')).toBe('center');
      expect(decl(rowRule, 'gap')).toBe('var(--bit-space-8px)');
      expect(decl(rowRule, 'position')).toBe('relative');
      const box = block(css, `${MULTI}::before`)!;
      for (const line of [
        'content: "";',
        'width: 18px;',
        'height: 18px;',
        'border: var(--bit-border-width) solid var(--bit-color-line);',
        'border-radius: var(--bit-radius-6px);',
        'background: var(--bit-color-surface);',
      ]) {
        expect(box).toContain(line);
      }
    });

    it('a chosen multi row is not filled or bold; its checkbox fills primary and shows a contrast tick', () => {
      const chosen = block(css, `${MULTI}[aria-selected="true"]`)!;
      expect(chosen).toContain('background: transparent;');
      expect(chosen).toContain('color: var(--bit-color-text);');
      expect(chosen).toContain('font-weight: var(--bit-weight-normal);');
      expect(block(css, `${MULTI}[aria-selected="true"]::before`)).toContain('background: var(--bit-color-primary);');
      const tick = block(css, `${MULTI}[aria-selected="true"]::after`)!;
      expect(tick).toContain('border: solid var(--bit-color-primary-contrast);');
      expect(tick).toContain('transform: rotate(45deg);');
    });

    it('an active multi row gets the soft fill, after the chosen override so it wins', () => {
      expect(block(css, `${MULTI}[data-active]`)).toContain('background: var(--bit-color-primary-soft);');
      expect(css.indexOf(`${MULTI}[data-active] {`)).toBeGreaterThan(css.indexOf(`${MULTI}[aria-selected="true"] {`));
    });

    it('the "N selected" pill is primary, bold, body text 13px, fully rounded', () => {
      const pill = block(css, '.bit-select__count')!;
      for (const line of [
        'background: var(--bit-color-primary);',
        'color: var(--bit-color-primary-contrast);',
        'font-weight: var(--bit-weight-bold);',
        'font-size: var(--bit-text-13px);',
        'border-radius: var(--bit-radius-full);',
        'padding: 0 var(--bit-space-8px);',
      ]) {
        expect(pill).toContain(line);
      }
    });

    it('forced colours: the pill gets a CanvasText ring; the checkbox is CanvasText, Highlight when chosen; chosen rows are not filled', () => {
      expect(inMedia('(forced-colors: active)', '.bit-select__count')).toContain('border: 1px solid CanvasText;');
      expect(inMedia('(forced-colors: active)', `${MULTI}::before`)).toContain('border-color: CanvasText;');
      const chosenBox = inMedia('(forced-colors: active)', `${MULTI}[aria-selected="true"]::before`)!;
      expect(chosenBox).toContain('background: Highlight;');
      expect(inMedia('(forced-colors: active)', `${MULTI}[aria-selected="true"]::after`)).toContain('border-color: HighlightText;');
      const chosenRow = inMedia('(forced-colors: active)', `${MULTI}[aria-selected="true"]`)!;
      expect(chosenRow).toContain('background: Canvas;');
      expect(chosenRow).toContain('color: CanvasText;');
      expect(inMedia('(forced-colors: active)', `${MULTI}[data-active]`)).toContain('box-shadow: inset 0 0 0 2px Highlight;');
    });
  });
```

`block(css, selector)` must find a top-level rule and not the same selector inside `@media`. If it returns the media copy, read `packages/core/src/__tests__/css.ts` and use `styleRules(css, null)` with a find on `selector` (media `null`) instead.

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm --filter @bit-ds/core exec vitest run src/__tests__/components/select.test.ts`
Expected: FAIL. `block(...)` returns null for the new selectors.

- [ ] **Step 3: Add the CSS**

In `packages/core/src/components/select.css`, add this after the `.bit-select__option[aria-disabled="true"] { … }` rule and before the `@media (prefers-reduced-motion: reduce)` block:

```css
/* Two or more chosen (multi-select): the count, in a pill where the text sits. */
.bit-select__count {
  display: inline-block;
  padding: 0 var(--bit-space-8px);
  font-size: var(--bit-text-13px);
  font-weight: var(--bit-weight-bold);
  line-height: 20px; /* raw: the pill's height inside every control size; there is no 20px leading token */
  color: var(--bit-color-primary-contrast);
  background: var(--bit-color-primary);
  border-radius: var(--bit-radius-full);
}

/* Multi-select (the listbox is aria-multiselectable): every row leads with a checkbox, and the checkbox,
   not a fill, shows what is chosen. Decoration only: aria-selected tells screen readers. */
.bit-select__list[aria-multiselectable="true"] .bit-select__option {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--bit-space-8px);
}

.bit-select__list[aria-multiselectable="true"] .bit-select__option::before {
  content: "";
  flex: none;
  box-sizing: border-box;
  width: 18px; /* raw: the checkbox, sized to the row's text */
  height: 18px;
  border: var(--bit-border-width) solid var(--bit-color-line);
  border-radius: var(--bit-radius-6px);
  background: var(--bit-color-surface);
}

.bit-select__list[aria-multiselectable="true"] .bit-select__option[aria-selected="true"] {
  background: transparent;
  color: var(--bit-color-text);
  font-weight: var(--bit-weight-normal);
}

.bit-select__list[aria-multiselectable="true"] .bit-select__option[aria-selected="true"]::before {
  background: var(--bit-color-primary);
}

/* The tick: two borders of a 5×10 box turned 45°, centred on the checkbox (the row's start padding + 5px). */
.bit-select__list[aria-multiselectable="true"] .bit-select__option[aria-selected="true"]::after {
  content: "";
  position: absolute;
  top: 50%;
  inset-inline-start: calc(var(--bit-space-12px) + 5px);
  width: 5px;
  height: 10px;
  margin-top: -7px; /* raw: lifts the turned box so the tick sits centred in the 18px checkbox */
  border: solid var(--bit-color-primary-contrast);
  border-width: 0 3px 3px 0;
  transform: rotate(45deg);
}

/* Comes after the chosen override, so an active chosen row still shows the hover fill. */
.bit-select__list[aria-multiselectable="true"] .bit-select__option[data-active] {
  background: var(--bit-color-primary-soft);
}
```

Then add these, inside the existing `@media (forced-colors: active) { … }` block and after its last rule (`.bit-select__option[data-active][aria-selected="true"]`):

```css
  /* The pill's fill is removed in forced colours; a ring keeps it visible. */
  .bit-select__count {
    border: 1px solid CanvasText;
  }

  /* Multi-select: the checkbox, not a row fill, shows the choice. */
  .bit-select__list[aria-multiselectable="true"] .bit-select__option::before {
    forced-color-adjust: none;
    border-color: CanvasText;
    background: Canvas;
  }

  .bit-select__list[aria-multiselectable="true"] .bit-select__option[aria-selected="true"] {
    background: Canvas;
    color: CanvasText;
  }

  .bit-select__list[aria-multiselectable="true"] .bit-select__option[aria-selected="true"]::before {
    background: Highlight;
    border-color: Highlight;
  }

  .bit-select__list[aria-multiselectable="true"] .bit-select__option[aria-selected="true"]::after {
    forced-color-adjust: none;
    border-color: HighlightText;
  }

  .bit-select__list[aria-multiselectable="true"] .bit-select__option[data-active] {
    box-shadow: inset 0 0 0 2px Highlight;
  }
```

`border-color: HighlightText` overrides only the colour of the tick's `border: solid …` shorthand; the widths stay.

- [ ] **Step 4: Run the core suite**

Run: `pnpm --filter @bit-ds/core test`
Expected: PASS, including the new `multi-select (0.1.5)` tests and every existing test (contrast, scrollbar, light-frozen).

- [ ] **Step 5: Build and check the dist**

Run: `pnpm build && pnpm verify`
Expected: `dist OK`.

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/components/select.css packages/core/src/__tests__/components/select.test.ts
git commit -m "feat(core): multi-select Select rows show a checkbox, and the closed box an \"N selected\" pill

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Gallery engine: virtual number controls, `deriveChildren`, array child props, state-aware `interactive`

**Files:**
- Modify: `apps/gallery/src/manifests/types.ts`
- Create: `apps/gallery/src/manifests/virtual.ts`
- Create: `apps/gallery/src/engine/childSpecs.ts`
- Create: `apps/gallery/src/test/manifest.ts`
- Create: `apps/gallery/src/engine/childSpecs.test.tsx`
- Modify: `apps/gallery/src/engine/buildProps.ts`, `apps/gallery/src/engine/renderManifest.tsx`, `apps/gallery/src/code/toJsx.ts`, `apps/gallery/src/code/codeFormats.ts`, `apps/gallery/src/code/CodePanel.tsx`, `apps/gallery/src/manifests/manifests.test.ts`, plus any test calling `.available(`

**Interfaces:**
- Produces (used by Task 5):
  ```ts
  // manifests/types.ts
  interface NumberControl { …; virtual?: boolean }
  interface ChildSpec { component: string; props?: Readonly<Record<string, LiteralValue>>; children?: string | readonly ChildSpec[] }
  interface Manifest { …; deriveChildren?: (state: ControlState) => readonly ChildSpec[]; interactive?: boolean | ((state: ControlState) => boolean) }
  // manifests/virtual.ts
  export function isVirtual(control: Control): boolean;
  // engine/childSpecs.ts
  export function childSpecs(manifest: Manifest, state: ControlState): readonly ChildSpec[] | undefined;
  export function isInteractive(manifest: Manifest, state: ControlState): boolean;
  // code/codeFormats.ts — CodeFormat
  available: (manifest: Manifest, state: ControlState) => boolean;
  ```

- [ ] **Step 1: Add the test helper**

Create `apps/gallery/src/test/manifest.ts`:

```ts
import type { Manifest } from '../manifests/types';

/** A minimal valid manifest for engine tests; override only what the test is about. */
export function testManifest(overrides: Partial<Manifest> = {}): Manifest {
  return {
    name: 'Demo',
    slug: 'demo',
    group: 'components',
    component: () => null,
    description: 'A test manifest.',
    controls: [],
    docs: {
      badges: [],
      usage: { do: ['Do.'], dont: ["Don't."] },
      props: [{ name: 'x', type: 'string', description: 'x' }],
      a11y: ['a11y.'],
    },
    ...overrides,
  };
}
```

- [ ] **Step 2: Write the failing engine tests**

Create `apps/gallery/src/engine/childSpecs.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { childSpecs, isInteractive } from './childSpecs';
import { renderManifest } from './renderManifest';
import { buildProps } from './buildProps';
import { defaultState } from './state';
import { toJsx } from '../code/toJsx';
import { CODE_FORMATS } from '../code/codeFormats';
import { testManifest } from '../test/manifest';
import type { ChildSpec, ControlState } from '../manifests/types';

const INPUT: ChildSpec = { component: 'Input', props: { type: 'email' } };
const SELECT: ChildSpec = { component: 'Select', props: { placeholder: 'Pick', options: [{ value: 'a', label: 'A' }] } };

const switching = testManifest({
  name: 'Field',
  component: ({ children }: { children?: ReactNode }) => <div data-testid="host">{children}</div>,
  controls: [
    { kind: 'text', prop: 'label', default: 'Email', alwaysPrint: true },
    { kind: 'select', prop: 'control', values: ['Input', 'Select'], default: 'Input', virtual: true },
  ],
  deriveChildren: (state) => [state.control === 'Select' ? SELECT : INPUT],
  interactive: (state) => state.control === 'Select',
});

describe('childSpecs', () => {
  it('uses deriveChildren with the defaults filled in, so a partial state works', () => {
    expect(childSpecs(switching, {})).toEqual([INPUT]);
    expect(childSpecs(switching, { control: 'Select' })).toEqual([SELECT]);
  });

  it('falls back to a ChildSpec array, and is undefined for text children or none', () => {
    expect(childSpecs(testManifest({ children: [INPUT] }), {})).toEqual([INPUT]);
    expect(childSpecs(testManifest({ children: 'Click' }), {})).toBeUndefined();
    expect(childSpecs(testManifest(), {})).toBeUndefined();
  });

  it('renderManifest renders the derived children', () => {
    render(renderManifest(switching, { ...defaultState(switching), control: 'Select' }));
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });
});

describe('toJsx with derived children and array child props', () => {
  it('imports the child, hoists its array prop to a const and passes it by name', () => {
    expect(toJsx(switching, { ...defaultState(switching), control: 'Select' })).toBe(
      [
        "import { Field, Select } from '@bit-ds/react';",
        "const options = [\n  { value: 'a', label: 'A' },\n];",
        '<Field label="Email">\n  <Select placeholder="Pick" options={options} />\n</Field>',
      ].join('\n\n'),
    );
  });

  it('a child const and a top-level const of the same name get unique names, top level first', () => {
    const both = testManifest({ ...switching, fixedProps: { options: ['x'] } });
    const code = toJsx(both, { ...defaultState(both), control: 'Select' });
    expect(code).toContain("const options = [\n  'x',\n];");
    expect(code).toContain("const options2 = [\n  { value: 'a', label: 'A' },\n];");
    expect(code).toContain('<Field label="Email" options={options}>');
    expect(code).toContain('<Select placeholder="Pick" options={options2} />');
  });

  it('a short string child prop still prints as an attribute', () => {
    expect(toJsx(switching, defaultState(switching))).toContain('<Input type="email" />');
  });
});

describe('virtual number controls', () => {
  const counted = testManifest({
    controls: [{ kind: 'number', prop: 'count', default: 3, min: 1, max: 9, step: 1, virtual: true }],
  });

  it('are neither passed nor printed', () => {
    const state: ControlState = { count: '7' };
    expect(buildProps(counted, state)).not.toHaveProperty('count');
    expect(toJsx(counted, state)).not.toContain('count');
  });
});

describe('interactive as a function of state', () => {
  const ids = (state: ControlState) => CODE_FORMATS.filter((f) => f.available(switching, state)).map((f) => f.id);

  it('isInteractive reads a boolean or calls the function with the defaults filled in', () => {
    expect(isInteractive(testManifest({ interactive: true }), {})).toBe(true);
    expect(isInteractive(testManifest(), {})).toBe(false);
    expect(isInteractive(switching, {})).toBe(false);
    expect(isInteractive(switching, { control: 'Select' })).toBe(true);
  });

  it('the HTML tab is offered only while the state is not interactive', () => {
    expect(ids(defaultState(switching))).toContain('html');
    expect(ids({ ...defaultState(switching), control: 'Select' })).not.toContain('html');
  });
});
```

The `Field` name here only drives the printed tag. The import line lists `Field` because `importLine` uses `manifest.name`; the component itself is the test's `div` host.

- [ ] **Step 3: Run them to verify they fail**

Run: `pnpm build && pnpm --filter @bit-ds/gallery exec vitest run src/engine/childSpecs.test.tsx`
Expected: FAIL. `./childSpecs` can't be resolved.

- [ ] **Step 4: Types and `isVirtual`**

In `apps/gallery/src/manifests/types.ts`:
1. **`NumberControl`:** add
   ```ts
     /** A control that only shapes the page (how many options a Select lists): it shows in the panel and presets, but is never a prop and never printed. */
     virtual?: boolean;
   ```
2. **`ChildSpec`:** change `props?: Record<string, string>;` to `props?: Readonly<Record<string, LiteralValue>>;`. Add to its doc comment: "A string prop prints as an attribute; arrays, objects and strings over 40 characters print as a `const`, as top-level props do."
3. **`Manifest`:** add after `children`:
   ```ts
     /**
      * Child parts worked out from the full control state (defaults merged in), in place of `children`, for a page
      * whose child depends on a control (Field's Input or Select). A manifest has `children` or this, never both.
      */
     deriveChildren?: (state: ControlState) => readonly ChildSpec[];
   ```
4. **`interactive`:** change it to:
   ```ts
     /** True, or true for some states, when the component needs React to work: the HTML tab is hidden then. */
     interactive?: boolean | ((state: ControlState) => boolean);
   ```

Create `apps/gallery/src/manifests/virtual.ts`:

```ts
import type { Control } from './types';

/** A control that shapes the page only (SegmentedControl's segments, Select's option count): never passed, printed or documented as a prop. */
export function isVirtual(control: Control): boolean {
  return (control.kind === 'select' || control.kind === 'number') && control.virtual === true;
}
```

- [ ] **Step 5: `childSpecs` and `isInteractive`**

Create `apps/gallery/src/engine/childSpecs.ts`:

```ts
import type { ChildSpec, ControlState, Manifest } from '../manifests/types';
import { defaultState } from './state';

/** The child parts a page renders and prints for `state`: deriveChildren's, else a ChildSpec array, else none. Pure. */
export function childSpecs(manifest: Manifest, state: ControlState): readonly ChildSpec[] | undefined {
  if (manifest.deriveChildren) return manifest.deriveChildren({ ...defaultState(manifest), ...state });
  return typeof manifest.children === 'object' ? manifest.children : undefined;
}

/** Whether the component needs React to work in this state, so its HTML alone would not. */
export function isInteractive(manifest: Manifest, state: ControlState): boolean {
  const { interactive } = manifest;
  if (typeof interactive === 'function') return interactive({ ...defaultState(manifest), ...state });
  return interactive === true;
}
```

- [ ] **Step 6: Use them in the engine**

1. **`engine/buildProps.ts`:** `if (control.kind === 'select' && control.virtual) continue;` becomes `if (isVirtual(control)) continue;`, with `import { isVirtual } from '../manifests/virtual';`.
2. **`engine/renderManifest.tsx`:** `renderChildren` becomes:
   ```ts
   function renderChildren(manifest: Manifest, state: ControlState): ReactNode {
     if (typeof manifest.children === 'string') return state.children ?? manifest.children;
     return childSpecs(manifest, state)?.map(renderChild);
   }
   ```
   with `import { childSpecs } from './childSpecs';`. `renderChild` is unchanged: `{ key: index, ...child.props }` already spreads any value.
3. **`code/codeFormats.ts`:**
   - `available: (manifest: Manifest) => boolean;` becomes `available: (manifest: Manifest, state: ControlState) => boolean;`.
   - The HTML entry becomes `available: (manifest, state) => !isInteractive(manifest, state),`, with `import { isInteractive } from '../engine/childSpecs';`.
   - The other two entries keep their bodies; they still satisfy the wider signature.
4. **`code/CodePanel.tsx`:** `CODE_FORMATS.filter((format) => format.available(manifest))` becomes `CODE_FORMATS.filter((format) => format.available(manifest, state))`. The existing `?? formats[0]!` fallback already covers a tab that disappears.
5. **Other callers:** run `grep -rn "available(" apps/gallery/src`, and update every remaining caller (tests included) to pass a state, `defaultState(manifest)` where the test has none.

- [ ] **Step 7: `toJsx`: virtual numbers, derived children, hoisted child props**

In `apps/gallery/src/code/toJsx.ts`:

1. Add `import { isVirtual } from '../manifests/virtual';` and `import { childSpecs } from '../engine/childSpecs';`.
2. Replace `resolveHoisted` with:
   ```ts
   /** One unique const name per hoisted value, in order, and the const declarations they name. */
   function resolveHoisted(printed: readonly PrintedProp[]): { names: ReadonlyMap<Hoisted, string>; consts: string[] } {
     const hoisted = printed.filter((p): p is Hoisted => typeof p !== 'string');
     const unique = uniqueNames(hoisted.map((h) => h.prop));
     return {
       names: new Map(hoisted.map((h, index) => [h, unique[index]!])),
       consts: hoisted.map((h, index) => `const ${unique[index]!} = ${hoistedLiteral(h.value)};`),
     };
   }

   /** A printed prop as an attribute: as is, or `prop={name}` for a hoisted one. */
   function attr(p: PrintedProp, names: ReadonlyMap<Hoisted, string>): string {
     return typeof p === 'string' ? p : `${p.prop}={${names.get(p)!}}`;
   }
   ```
3. Add, above `printChildSpec`:
   ```ts
   /** Every ChildSpec in a tree, each parent before its parts, in document order. */
   function flatten(children: readonly ChildSpec[]): ChildSpec[] {
     return children.flatMap((child) => [child, ...(typeof child.children === 'object' ? flatten(child.children) : [])]);
   }
   ```
4. Replace `printChildSpec`:
   ```ts
   function printChildSpec(
     child: ChildSpec,
     depth: number,
     printedProps: ReadonlyMap<ChildSpec, readonly PrintedProp[]>,
     names: ReadonlyMap<Hoisted, string>,
   ): string {
     const props = printedProps.get(child)!.map((p) => ` ${attr(p, names)}`).join('');
     const indent = INDENT.repeat(depth);
     const open = `${indent}<${child.component}${props}`;
     if (child.children === undefined) return `${open} />`;
     if (typeof child.children === 'string') return `${open}>${printChildren(child.children)}</${child.component}>`;
     const inner = child.children.map((part) => printChildSpec(part, depth + 1, printedProps, names)).join('\n');
     return `${open}>\n${inner}\n${indent}</${child.component}>`;
   }
   ```
5. `importLine(manifest)` becomes `importLine(manifest: Manifest, specs: readonly ChildSpec[] | undefined)`, with `const nested = specs ? componentNames(specs) : [];`.
6. In `toJsx`:
   - `if (control.kind === 'select' && control.virtual) return null;` becomes `if (isVirtual(control)) return null;`.
   - Then, after `printed` is built (and replacing the old `const { attrs, consts } = resolveHoisted(printed);` and `const props = attrs.map(…)` lines):
   ```ts
   const specs = childSpecs(manifest, state);
   // Child props print by the same rules as fixed props; their consts follow the element's, names unique across both.
   const printedProps = new Map(
     (specs ? flatten(specs) : []).map((child) => [child, Object.entries(child.props ?? {}).map(([name, value]) => printFixed(name, value))] as const),
   );
   const { names, consts } = resolveHoisted([...printed, ...[...printedProps.values()].flat()]);
   const props = printed.map((p) => ` ${attr(p, names)}`).join('');
   ```
   - Replace the ChildSpec branch:
   ```ts
   } else if (specs && specs.length > 0) {
     const inner = specs.map((child) => printChildSpec(child, 1, printedProps, names)).join('\n');
     element = `${open}>\n${inner}\n</${manifest.name}>`;
   }
   ```
   - Change the return to `return [importLine(manifest, specs), ...consts, element].join('\n\n');`.

- [ ] **Step 8: Manifest contract tests**

In `apps/gallery/src/manifests/manifests.test.ts`:
1. In `'%s documents every prop its controls expose, once'`, `m.controls.filter((c) => !(c.kind === 'select' && c.virtual))` becomes `m.controls.filter((c) => !isVirtual(c))`, with `import { isVirtual } from './virtual';`.
2. Replace `'every child spec names a registered component or an allowed HTML element'` with:
   ```ts
   it('every child spec names a registered component or an allowed HTML element, derived ones included', () => {
     for (const m of MANIFESTS) {
       const states = [defaultState(m), ...(m.presets ?? []).map((p) => ({ ...defaultState(m), ...p.state }) as ControlState)];
       for (const state of states) {
         expect(unknownChildren(childSpecs(m, state) ?? []), m.name).toEqual([]);
       }
     }
   });

   it('a manifest has children or deriveChildren, never both', () => {
     expect(MANIFESTS.filter((m) => m.children !== undefined && m.deriveChildren !== undefined).map((m) => m.name)).toEqual([]);
   });
   ```
   with `import { childSpecs, isInteractive } from '../engine/childSpecs';`. Import `defaultState` from `../engine/state` if the file doesn't already.
3. In `'only ModeToggle, CodeBlock and Select are interactive (no HTML tab): they need React to work'`, read each manifest through `isInteractive(m, defaultState(m))` instead of `m.interactive`. The expected names are unchanged.

- [ ] **Step 9: Run the gallery suite and typecheck**

Run: `pnpm --filter @bit-ds/gallery test && pnpm --filter @bit-ds/gallery typecheck`
Expected: PASS. Existing toJsx expectations are unchanged unless a current child string prop is over 40 characters; none is known. If one is, keep the new rule, update that expectation in this commit, and name it in the report.

- [ ] **Step 10: Lint and commit**

Run: `pnpm lint`

```bash
git add apps/gallery/src
git commit -m "feat(gallery): virtual number controls, derived child parts with array props, and a per-state HTML tab

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Gallery manifests: Select (option count, multiple) and Field (Select demo)

**Files:**
- Modify: `apps/gallery/src/manifests/select.ts`
- Modify: `apps/gallery/src/manifests/field.ts`
- Modify: `apps/gallery/src/manifests/manifests.test.ts`
- Modify: `apps/gallery/src/code/toJsx.test.ts` (~line 117)
- Modify: `apps/gallery/src/pages/ComponentPage.test.tsx` (~lines 273 and 281)
- Create: `apps/gallery/src/manifests/select.test.ts`
- Create: `apps/gallery/src/manifests/field.test.tsx`

**Interfaces:**
- Consumes: `isVirtual`, `childSpecs`, `isInteractive`, `deriveChildren`, `NumberControl.virtual`, `CODE_FORMATS[].available(manifest, state)` (Task 4); `Select multiple` (Task 2, through the built dist).
- Produces: `export function optionCount(raw: ControlValue | undefined): number` from `manifests/select.ts`, plus the control props Task 6 drives:
  - **Select page:** `optionCount` (labelled "options"), `multiple`.
  - **Field page:** `control`.

- [ ] **Step 1: Write the failing manifest tests**

Create `apps/gallery/src/manifests/select.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { select, optionCount } from './select';
import { staticProps } from '../engine/staticProps';
import { buildProps } from '../engine/buildProps';
import { defaultState } from '../engine/state';
import { toJsx } from '../code/toJsx';
import type { ControlState } from './types';

const listed = (raw: string) => (staticProps(select, { optionCount: raw }).options as readonly unknown[]).length;

describe('Select page: the options control', () => {
  it('lists as many options as it says, from 1 to 20', () => {
    expect(listed('1')).toBe(1);
    expect(listed('5')).toBe(5);
    expect(listed('12')).toBe(12);
    expect(listed('20')).toBe(20);
  });

  it('clamps out-of-range values, floors fractions, and uses 5 for anything that is not a number', () => {
    expect(listed('0')).toBe(1);
    expect(listed('-3')).toBe(1);
    expect(listed('99')).toBe(20);
    expect(listed('7.9')).toBe(7);
    expect(listed('')).toBe(5);
    expect(listed('  ')).toBe(5);
    expect(listed('abc')).toBe(5);
    expect(optionCount(undefined)).toBe(5);
  });

  it('starts with the five colours, then fruit, values lowercase', () => {
    expect(staticProps(select, { optionCount: '7' }).options).toEqual([
      { value: 'primary', label: 'Primary' },
      { value: 'neutral', label: 'Neutral' },
      { value: 'success', label: 'Success' },
      { value: 'warning', label: 'Warning' },
      { value: 'danger', label: 'Danger' },
      { value: 'apple', label: 'Apple' },
      { value: 'banana', label: 'Banana' },
    ]);
  });

  it('is never passed to Select nor printed', () => {
    const state: ControlState = { ...defaultState(select), optionCount: '12' };
    expect(buildProps(select, state)).not.toHaveProperty('optionCount');
    expect(toJsx(select, state)).not.toContain('optionCount');
  });
});

describe('Select page: multiple and presets', () => {
  it('multiple prints as a bare prop and is passed through', () => {
    const state: ControlState = { ...defaultState(select), multiple: true };
    expect(buildProps(select, state).multiple).toBe(true);
    expect(toJsx(select, state)).toContain('<Select multiple aria-label="Color" placeholder="Pick colors" options={options} />');
  });

  it('offers Long list and Multi-select presets', () => {
    const presets = Object.fromEntries((select.presets ?? []).map((p) => [p.label, p.state]));
    expect(presets['Long list']).toEqual({ optionCount: '12' });
    expect(presets['Multi-select']).toEqual({ multiple: true, optionCount: '12' });
  });
});
```

Create `apps/gallery/src/manifests/field.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { field } from './field';
import { defaultState } from '../engine/state';
import { renderManifest } from '../engine/renderManifest';
import { toJsx } from '../code/toJsx';
import { fullFile } from '../code/fullFile';
import { CODE_FORMATS } from '../code/codeFormats';
import type { ControlState } from './types';

const withSelect: ControlState = { ...defaultState(field), control: 'Select' };

describe('Field page: the Select demo', () => {
  it('Input stays the default child', () => {
    render(renderManifest(field, defaultState(field)));
    expect(screen.getByRole('textbox', { name: 'Email' })).toBeInTheDocument();
  });

  it('control=Select renders a Select named by the Field label', () => {
    render(renderManifest(field, withSelect));
    expect(screen.getByRole('combobox', { name: 'Email' })).toBeInTheDocument();
  });

  it('prints the Select with its options as a const above the Field', () => {
    expect(toJsx(field, withSelect)).toBe(
      [
        "import { Field, Select } from '@bit-ds/react';",
        [
          'const options = [',
          "  { value: 'primary', label: 'Primary' },",
          "  { value: 'neutral', label: 'Neutral' },",
          "  { value: 'success', label: 'Success' },",
          "  { value: 'warning', label: 'Warning' },",
          "  { value: 'danger', label: 'Danger' },",
          '];',
        ].join('\n'),
        '<Field label="Email">\n  <Select placeholder="Pick a color" options={options} />\n</Field>',
      ].join('\n\n'),
    );
  });

  it('the full file puts the const between the import and the component', () => {
    const file = fullFile(toJsx(field, withSelect));
    expect(file.indexOf('const options = [')).toBeGreaterThan(file.indexOf("from '@bit-ds/react';"));
    expect(file.indexOf('const options = [')).toBeLessThan(file.indexOf('function Example'));
  });

  it('hides the HTML tab while showing a Select, and offers it for the Input', () => {
    const ids = (state: ControlState) => CODE_FORMATS.filter((f) => f.available(field, state)).map((f) => f.id);
    expect(ids(defaultState(field))).toContain('html');
    expect(ids(withSelect)).not.toContain('html');
  });

  it('the Select preset sets the control, a matching label and a hint', () => {
    expect((field.presets ?? []).find((p) => p.label === 'Select')?.state).toEqual({
      control: 'Select',
      label: 'Favorite color',
      hint: 'We use it for your avatar.',
    });
  });
});
```

If the full file doesn't name its component `Example`, read `apps/gallery/src/content/snippets.mjs` and use the name it prints.

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm --filter @bit-ds/gallery exec vitest run src/manifests/select.test.ts src/manifests/field.test.tsx`
Expected: FAIL. `optionCount` isn't exported, there's no `control` control, and the presets are missing.

- [ ] **Step 3: Rewrite the top of `manifests/select.ts`**

1. **Option data:** replace the `OPTIONS` const with:
   ```ts
   /** The playground's choices: the five colours, then fruit, so a long list still reads well. */
   const LABELS = [
     'Primary', 'Neutral', 'Success', 'Warning', 'Danger',
     'Apple', 'Banana', 'Cherry', 'Grape', 'Lemon', 'Mango', 'Orange', 'Peach', 'Pear', 'Plum',
     'Kiwi', 'Lime', 'Melon', 'Berry', 'Fig',
   ] as const;
   const OPTION_COUNT = { min: 1, max: LABELS.length, default: 5 } as const;

   /** How many options to list: the control's value floored and clamped to 1–20, or 5 when it isn't a number (an empty field mid-edit). */
   export function optionCount(raw: ControlValue | undefined): number {
     const n = Math.floor(Number(raw));
     if (raw === undefined || String(raw).trim() === '' || !Number.isFinite(n)) return OPTION_COUNT.default;
     return Math.min(OPTION_COUNT.max, Math.max(OPTION_COUNT.min, n));
   }
   ```
   Change the type import to `import type { ControlValue, Manifest } from './types';`. Prettier may reflow `LABELS`; let it.
2. **Description:** "Picks one option, or several with `multiple`, from a list that bit draws itself, so it slides down in the bit theme and looks the same in every browser."
3. **Controls:**
   ```ts
   controls: [
     { kind: 'axis', prop: 'size', values: SIZES, default: 'md' },
     {
       kind: 'number',
       prop: 'optionCount',
       label: 'options',
       default: OPTION_COUNT.default,
       min: OPTION_COUNT.min,
       max: OPTION_COUNT.max,
       step: 1,
       virtual: true,
     },
     { kind: 'boolean', prop: 'multiple', default: false },
     { kind: 'text', prop: 'aria-label', default: 'Color', label: 'aria-label' },
     { kind: 'text', prop: 'placeholder', default: 'Pick colors', alwaysPrint: true },
     { kind: 'boolean', prop: 'invalid', default: false },
     { kind: 'boolean', prop: 'disabled', default: false },
   ],
   deriveProps: (state) => ({
     options: LABELS.slice(0, optionCount(state.optionCount)).map((label) => ({ value: label.toLowerCase(), label })),
   }),
   ```
   Delete `fixedProps: { options: OPTIONS },`.
4. **Presets:**
   ```ts
   presets: [
     { label: 'Long list', state: { optionCount: '12' } },
     { label: 'Multi-select', state: { multiple: true, optionCount: '12' } },
     { label: 'Invalid', state: { invalid: true } },
     { label: 'Small', state: { size: 'sm' } },
     { label: 'Disabled', state: { disabled: true } },
   ],
   ```
5. **Docs:**
   - Badges become `['Combobox and listbox', 'Single or multi', 'Full keyboard', 'Themed list']`.
   - `usage.do` gains: `'Add multiple to let people pick several. Rows show a checkbox, the list stays open while they pick, and the closed box shows how many they chose.'`.
   - `usage.dont` gains: `'Use multiple for two to four options that should all show. Use SegmentedControl with multiple instead.'`.
   - Props: insert after the `options` row:
     ```ts
     {
       name: 'multiple',
       type: 'boolean',
       default: 'false',
       description:
         'Pick any number of options. value and defaultValue become string arrays, onValueChange receives a string[] in option order, and each chosen value submits under name. Its props type is SelectMultipleProps. Pass it as a literal: a boolean variable does not type-check.',
     },
     ```
   - Append to the `value` row's description: ` With multiple, a string[].`.
   - Append to the `defaultValue` row: ` With multiple, a string[]; unset, none are chosen.`.
   - The `onValueChange` row: type `'(value: string) => void, or (value: string[]) => void with multiple'`, and append ` With multiple, it is called on every toggle with the chosen values in option order.` to its description.
   - The `name` row: append ` With multiple, every chosen value is submitted under it, as a native <select multiple> does.`.
   - The `placeholder` row is unchanged: its docs default `''` is the component's.
   - `a11y` gains two lines:
     - `'With multiple, the list is marked aria-multiselectable and each option says whether it is chosen. Enter, Space or a click toggles the active option and the list stays open; Escape, Tab, Alt+ArrowUp or a click outside closes it without changing anything.'`
     - `'With multiple, the closed box reads its one chosen option, or "3 selected" when there are several, so screen readers hear the count.'`
     - Also append to the forced-colors line: ` With multiple, the checkbox is drawn in system colors and fills with the highlight color when chosen.`.

- [ ] **Step 4: Rewrite `manifests/field.ts`**

1. Change the type import to `import type { ChildSpec, Manifest } from './types';`.
2. Above the manifest:
   ```ts
   /** Field's two children. The Select's options print as one `const options`. */
   const INPUT_CHILD: ChildSpec = { component: 'Input', props: { type: 'email', placeholder: 'you@example.com' } };
   const SELECT_CHILD: ChildSpec = {
     component: 'Select',
     props: {
       placeholder: 'Pick a color',
       options: [
         { value: 'primary', label: 'Primary' },
         { value: 'neutral', label: 'Neutral' },
         { value: 'success', label: 'Success' },
         { value: 'warning', label: 'Warning' },
         { value: 'danger', label: 'Danger' },
       ],
     },
   };
   ```
3. Controls: add first `{ kind: 'select', prop: 'control', label: 'control', values: ['Input', 'Select'], default: 'Input', virtual: true },`.
4. Replace `children: [{ component: 'Input', … }],` with:
   ```ts
   deriveChildren: (state) => [state.control === 'Select' ? SELECT_CHILD : INPUT_CHILD],
   // A Select's markup needs React, so the HTML tab hides while it is the child.
   interactive: (state) => state.control === 'Select',
   ```
5. Presets: append `{ label: 'Select', state: { control: 'Select', label: 'Favorite color', hint: 'We use it for your avatar.' } },`.

- [ ] **Step 5: Update the expectations that change**

1. **`code/toJsx.test.ts` (~117):** the Select expectation's `placeholder="Pick a color"` becomes `placeholder="Pick colors"`. `SELECT_OPTIONS_CONST` stays the five colours (the default count is 5).
2. **`pages/ComponentPage.test.tsx` (~273, ~281):** `'Pick a color'` becomes `'Pick colors'`.
3. **`manifests/manifests.test.ts`:**
   - In the interactive test, add `expect(isInteractive(field, { control: 'Select' })).toBe(true);`, importing `field` from `./field` if it isn't already.
   - In the Select API tests (~311–345), any assertion on `select.fixedProps?.options` reads `staticProps(select, defaultState(select)).options` instead; it's the same five colours.
4. **Search for leftovers:** run `grep -rn "Pick a color" apps/gallery/src` and update every remaining hit that's about the Select page. Field's `Pick a color` is intended.

- [ ] **Step 6: Run the gallery suite and typecheck**

Run: `pnpm build && pnpm --filter @bit-ds/gallery test && pnpm --filter @bit-ds/gallery typecheck`
Expected: PASS. The manifest contract tests are green:
- preset round-trip, including `optionCount: '12'`;
- every prop documented, with virtual controls skipped;
- defaults match: `multiple` is `false` in both.

- [ ] **Step 7: Lint and commit**

Run: `pnpm lint`

```bash
git add apps/gallery/src
git commit -m "feat(gallery): Select page lists 1-20 options and switches to multi-select; Field page shows a Select

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: e2e and visual check

**Files:**
- Create: `apps/gallery/e2e/select-multi.spec.ts`
- Modify: `apps/gallery/e2e/select-dropdown.spec.ts` (~line 123: `'Pick a color'` becomes `'Pick colors'`)

**Interfaces:**
- Consumes these DOM and labels from Tasks 2–5:
  - the Select preview region `Select preview`, with its combobox `Color`;
  - the Controls region `Controls`, with the spinbutton `options`;
  - the Presets group `Presets`;
  - `.bit-select__count`.

- [ ] **Step 1: Write the e2e spec**

Create `apps/gallery/e2e/select-multi.spec.ts`:

```ts
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { MODES, seedColorMode } from './mode';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

test.use({ viewport: { width: 1280, height: 900 } });

async function listOf(page: Page, trigger: Locator): Promise<Locator> {
  const id = await trigger.getAttribute('aria-controls');
  expect(id).toBeTruthy();
  return page.locator(`[id="${id}"]`);
}

async function settle(list: Locator): Promise<void> {
  await list.evaluate((el) => Promise.all(el.getAnimations({ subtree: true }).map((animation) => animation.finished)));
  await expect(list).toHaveCSS('opacity', '1');
}

test.describe('Select page: option count and multi-select', () => {
  test('12 options make the list scroll inside the viewport', async ({ page }) => {
    await page.goto('#/components/select');
    const options = page.getByRole('region', { name: 'Controls' }).getByRole('spinbutton', { name: 'options' });
    await options.fill('12');
    const trigger = page.getByRole('region', { name: 'Select preview' }).getByRole('combobox', { name: 'Color' });
    await trigger.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await trigger.click();
    const list = await listOf(page, trigger);
    await expect(list.getByRole('option')).toHaveCount(12);
    expect(await list.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
    const box = (await list.boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize()!.height);
    expect(new URL(page.url()).hash).toContain('optionCount=12');
  });

  for (const mode of MODES) {
    test(`${mode}: multi-select toggles by mouse and keyboard, stays open, and the closed box shows the pill`, async ({ page }) => {
      await seedColorMode(page, mode);
      await page.goto('#/components/select');
      await page.getByRole('group', { name: 'Presets' }).getByRole('button', { name: 'Multi-select' }).click();
      const trigger = page.getByRole('region', { name: 'Select preview' }).getByRole('combobox', { name: 'Color' });
      await trigger.evaluate((el) => el.scrollIntoView({ block: 'center' }));
      await trigger.click();
      const list = await listOf(page, trigger);
      await expect(list).toHaveAttribute('aria-multiselectable', 'true');
      await list.getByRole('option', { name: 'Primary' }).click();
      await list.getByRole('option', { name: 'Success' }).click();
      await expect(list).toBeVisible();
      await page.keyboard.press('End');
      await page.keyboard.press('Enter');
      await expect(list.getByRole('option', { name: 'Orange' })).toHaveAttribute('aria-selected', 'true');
      await settle(list);
      const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
      await page.keyboard.press('Escape');
      await expect(list).toBeHidden();
      await expect(trigger.locator('.bit-select__count')).toHaveText('3 selected');
      await expect(trigger).toBeFocused();
    });
  }
});

test.describe('Field page: Select demo', () => {
  test('the Select preset shows a Select named by the Field label, its list opens, and there is no HTML tab', async ({ page }) => {
    await page.goto('#/components/field');
    await page.getByRole('group', { name: 'Presets' }).getByRole('button', { name: 'Select' }).click();
    const trigger = page.getByRole('region', { name: 'Field preview' }).getByRole('combobox', { name: 'Favorite color' });
    await trigger.click();
    await expect(await listOf(page, trigger)).toBeVisible();
    await expect(page.getByRole('radio', { name: 'HTML' })).toHaveCount(0);
  });
});
```

The End key lands on the twelfth label, Orange. The region and group names (`Select preview`, `Field preview`, `Controls`, `Presets`) follow the existing specs. If one differs, read `apps/gallery/src/engine/Preview.tsx`, `ControlsPanel.tsx` and `Presets.tsx` and use the real name. With one code format left, CodePanel renders no format switch, so `toHaveCount(0)` passes either way, which is the intent.

- [ ] **Step 2: Update the existing placeholder expectation**

In `apps/gallery/e2e/select-dropdown.spec.ts`, `await expect(trigger).toHaveText('Pick a color');` becomes `await expect(trigger).toHaveText('Pick colors');`.

- [ ] **Step 3: Run e2e**

Run: `pnpm gallery:build && pnpm e2e`
Expected: every spec passes, the new ones included. `a11y.spec.ts` covers both routes in light and dark.

- [ ] **Step 4: Visual check (headed Chromium) and screenshots for the owner**

With `pnpm dev` running, use a short Playwright script with `chromium.launch({ headless: false })` (the scrollbar only renders true to life headed) at 1280×900. Capture each of these in light and dark (seed the mode as `e2e/mode.ts` does):
- the Select page closed with the "3 selected" pill;
- the Select page open with checkbox rows, after the Multi-select preset and three toggles;
- the Select page with 12 options open, showing the themed scrollbar;
- the Field page with the Select preset, open.

Save them to `~/.gstack/projects/doosemavis-bit-design-system/designs/select-multi-20261007/` as `live-{pill,rows,long,field}-{light,dark}.png`. Keep the script in the scratchpad, not the repo.

Check by eye that the tick sits centred in its checkbox. If it's off by more than 1px, adjust only the tick's `inset-inline-start` and `margin-top` raw values in `select.css`, re-run `pnpm --filter @bit-ds/core test`, and record the new values in the report.

- [ ] **Step 5: Commit**

```bash
git add apps/gallery/e2e
git add packages/core/src/components/select.css   # only if Step 4 adjusted it
git commit -m "test(gallery): e2e for Select multi-select, the option count and the Field Select demo

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Release prep for 0.1.5

**Files:**
- Modify: `packages/react/package.json` (`"version": "0.1.4"` becomes `"0.1.5"`)
- Modify: `CHANGELOG.md`
- Modify: `README.md:86` and `packages/react/README.md:86`
- Modify: `scripts/smoke-consumer.mjs` (~338–360)
- Modify: `packages/react/scripts/verify-dist.mjs:75`

- [ ] **Step 1: verify-dist requires the new type**

In `packages/react/scripts/verify-dist.mjs` line 75, add `'SelectMultipleProps'` after `'SelectProps'` in the list.

Run: `pnpm build && pnpm verify`
Expected: `dist OK`. This locks the export in, so a later removal fails.

- [ ] **Step 2: Smoke consumer type-checks a multi Select**

In `scripts/smoke-consumer.mjs`, in the `check.tsx` template:
- Change the type import to `import type { Color, SegmentedControlProps, SelectMultipleProps, SelectOption, SelectProps } from '@bit-ds/react';`.
- After the `onRange` line, add:
  ```ts
  // Select multiple (0.1.5): string[] in, string[] out.
  export const onRanges: SelectMultipleProps['onValueChange'] = (v) => void v.join();
  ```
- In `App`, after the existing `<Select … />`, add:
  ```tsx
        <Select multiple aria-label="Ranges" options={ranges} name="ranges" defaultValue={['day']} onValueChange={onRanges} />
  ```

Run: `pnpm smoke`
Expected: `consumer OK: … types check`.

- [ ] **Step 3: Version, CHANGELOG, READMEs**

1. **Version:** in `packages/react/package.json`, `"version": "0.1.4"` becomes `"version": "0.1.5"`.
2. **CHANGELOG:** in `CHANGELOG.md`, insert above `## 0.1.4 — 2026-10-07`:
   ```markdown
   ## 0.1.5 — 2026-10-07
   ### Added
   - `Select` `multiple`: pick any number of options. Each row shows a checkbox, and clicking a row or pressing Enter or Space toggles it while the list stays open; Escape, Tab or a click outside closes it. The closed box shows the one chosen label, or a purple "3 selected" pill when there are several. `value`/`defaultValue` are `string[]`, and `onValueChange` receives the chosen values in option order.
   - In a form, a multi-select `Select` submits every chosen value under `name`, as `<select multiple>` does; `required` means at least one, and a form reset puts back `defaultValue`.
   - `SelectMultipleProps` type. `SelectProps` stays the single-select props, unchanged. Pass `multiple` as a literal: a `boolean` variable doesn't type-check, so render the two cases separately.
   ```
3. **READMEs:** in both `README.md` and `packages/react/README.md` line 86, change `with full keyboard support, so its list looks the same in every browser` to `with full keyboard support and single or multi-select, so its list looks the same in every browser`.

- [ ] **Step 4: Full local CI**

Run each and confirm each passes:
```bash
pnpm build && pnpm verify
pnpm typecheck
pnpm lint
pnpm --filter @bit-ds/core test
pnpm test:coverage
pnpm --filter @bit-ds/gallery test
pnpm smoke && pnpm smoke:full
pnpm gallery:build
pnpm e2e
```
Expected:
- `dist OK`, `consumer OK`, `global stylesheet OK`, `vite OK` and `fonts OK`;
- 100% coverage;
- every suite and e2e test green.

- [ ] **Step 5: Commit**

```bash
git add packages/react/package.json CHANGELOG.md README.md packages/react/README.md scripts/smoke-consumer.mjs packages/react/scripts/verify-dist.mjs
git commit -m "chore: release 0.1.5 (Select multiple, SelectMultipleProps)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

Opening the PR, merging, tagging `v0.1.5` and the npm publish happen outside this plan. The owner approves each, and approves `publish` in Actions.
