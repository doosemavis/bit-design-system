# Select: a bit-drawn dropdown (0.1.4)

Date: 2026-10-07. Branch: `feat/release-0.1.4`.
Board: `~/.gstack/projects/doosemavis-bit-design-system/designs/select-20261006/board.html`. The owner picked look L1 ("chunky") and option 2: bit draws its own list.

## Owner's intent
- "For Forms Select, the dropdown that appears is the system default one. I want the dropdown to slide down from the select … stylized to match the bit DS theme."
- Every browser must look the same, so this is not `appearance: base-select`.
- "nobody is using this DS yet, so there will be no concerns of breaking changes": Select is replaced outright.
- It ships as **0.1.4**, with a "Breaking" CHANGELOG section (the owner's call, overriding the 0.x breaking-means-minor rule).

## 1. API (breaking)
```ts
export interface SelectOption { value: string; label: ReactNode; disabled?: boolean }
export interface SelectProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'value' | 'defaultValue' | 'onChange' | 'color' | 'type' | 'children'> {
  options: readonly SelectOption[];
  value?: string;                 // controlled
  defaultValue?: string;          // uncontrolled; default: none chosen
  onValueChange?: (value: string) => void;
  placeholder?: ReactNode;        // shown while nothing is chosen; default ''
  name?: string;                  // a hidden <input type="hidden"> carries name and value for form submits
  size?: Size;                    // class bit-{size} on the wrapper, as today
  invalid?: boolean;              // aria-invalid="true" and the danger border, as today; a Field error does the same
  disabled?: boolean;
}
```
- `forwardRef<HTMLButtonElement>`: the ref goes to the trigger button. `className` goes on the wrapper, as today.
- Field integration is kept: `useFieldControl` wires `id`, `aria-describedby` and `aria-invalid` onto the trigger, and Field's `<label htmlFor>` names it.
- Removed: `<option>` children, the native `onChange` event, `SelectHTMLAttributes`, and the `<select>` element.
- A `value` that matches no option shows the placeholder.

## 2. Look (L1)
**Closed trigger.** It looks exactly like today's Select: the recessed box, the chunky chevron drawn by the wrapper, sizes sm/md/lg, the danger border when invalid, and 0.5 opacity when disabled. The chosen option's label shows inside the box; with nothing chosen, the placeholder shows in the muted text colour.

**Open list (listbox panel).**
- `--bit-color-surface` background, a `--bit-border-width` line border, `--bit-radius-10px` corners, `--bit-shadow-md`, 4px padding, and Nunito body text.
- Option rows have 8px/12px padding and a 6px radius. Hovered or keyboard-active rows get `--bit-color-primary-soft`. The chosen row is `--bit-color-primary` with `--bit-color-primary-contrast` text in bold. A disabled row is at 0.5 opacity and can't be chosen.
- **Motion:** it slides down 8px and fades in over 150ms (`--bit-duration-*` tokens where they fit) as it opens, and the chevron rotates 180°. When the list opens above, it slides up instead. Reduced motion makes it instant.
- **Long lists:** max-height of about 16rem, then the list scrolls with the themed scrollbar (a surface track and an accent thumb, as Table).
- Forced colours use system colours: Highlight/HighlightText for active and chosen rows, CanvasText for the border.

## 3. Behaviour (WAI-ARIA APG "select-only combobox")
**Trigger.** A `<button type="button" role="combobox" aria-haspopup="listbox" aria-expanded aria-controls={listId}>`, with `aria-activedescendant` set while the list is open.

**List.** A `role="listbox"` element holding `role="option"` rows with `aria-selected` and `aria-disabled` and stable ids. Focus stays on the trigger.

**Keyboard on the trigger.**
- **Closed:**
  - Enter, Space, ArrowDown or ArrowUp open the list, with the chosen option active (or the first enabled one).
  - Alt+ArrowDown opens without moving.
  - Typing a printable character opens the list and does typeahead.
- **Open:**
  - ArrowDown and ArrowUp move between enabled options, without wrapping. Home, End, PageDown and PageUp also move.
  - Typing does typeahead: it matches the label prefix, buffers for 500ms, and cycles on a repeated letter.
  - Enter or Space chooses the active option and closes.
  - Alt+ArrowUp chooses and closes.
  - Escape closes without choosing.
  - Tab chooses the active option, closes, and lets focus move on.

**Pointer.** Clicking the trigger toggles the list. Clicking an option chooses it and closes. Clicking outside closes without choosing. Hovering moves the active row.

**After choosing.** Choosing calls `onValueChange(value)`, updates the own value when uncontrolled, and returns focus to the trigger. Choosing the option that is already chosen does not call `onValueChange`.

**Scroll.** The active row is scrolled into view (`block: 'nearest'`).

**Layering and position.**
- The list is rendered with the Popover API (`popover="manual"`) so it sits in the top layer and can't be clipped by `overflow: hidden` ancestors such as Card, Table or the playground.
- It's positioned with `position: fixed` from the trigger's `getBoundingClientRect()`: below the trigger with a 6px gap, and at least the trigger's width.
- If there isn't room below for the list (or 8rem, whichever is smaller) and there is more room above, it opens above.
- It repositions on scroll (capture) and resize while open, and closes if the trigger leaves the viewport.

**Forms and SSR.** Nothing touches `window` or `document` during render, and the ids come from `useId`. The hidden input is rendered only when `name` is set.

## 4. Gallery
Every Select the gallery uses moves to the new API:
- `engine/ControlsPanel.tsx` (axis and select controls)
- `shell/VersionSelect.tsx` and `shell/ThemeSelect.tsx`
- `manifests/select.ts`: its playground uses `options`, and the docs cover the new API, keyboard and accessibility
- `manifests/field.ts`: Field with a Select child
- any other caller tsc finds

The gallery's own tests and e2e specs that used native `<select>` APIs (`selectOption`, `select.value`, `change` events) move to clicking the trigger and choosing an option, or to the keyboard.

## 5. Tests
**React `Select.test.tsx`, rewritten.**
- ARIA roles and attributes.
- Opening and closing by click, keys and outside click.
- Every key in section 3, typeahead included.
- Controlled and uncontrolled use; `onValueChange` only on a change; placeholder; an unknown value; disabled options and a disabled control.
- `name` and the hidden input; Field wiring (label, describedby, invalid); the ref on the trigger.
- Popover and positioning logic with mocked rects (opens below; flips above).
- axe while closed and open. Coverage stays at 100%.

**Core CSS tests.** The trigger keeps today's look rules. The list panel, rows, active and chosen states and motion use tokens only. Reduced motion and forced colours are covered.

**Gallery.** Unit tests are updated, and an e2e test opens a Select with the keyboard and mouse, checks the list is visible and inside the viewport, and that it isn't clipped inside the playground card. axe runs on every route.

**Smoke and verify.** Exports are unchanged, since `Select` and `SelectProps` already exist; add `SelectOption` as a type. The smoke consumer's type check uses the new API.

**Visual.** Headed Chromium screenshots, open and closed, light and dark, including a flipped-up list near the bottom of the viewport.

## Out of scope
Multi-select, search/filter input, option groups, a virtualised long list, a native mobile picker, and async options.
