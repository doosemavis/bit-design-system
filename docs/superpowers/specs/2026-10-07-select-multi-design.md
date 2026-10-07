# Select: multi-select, an option-count control, and the Field demo (0.1.5)

Date: 2026-10-07. Branch: `feat/select-multi-0.1.5`.
Board: `~/.gstack/projects/doosemavis-bit-design-system/designs/select-multi-20261007/board.html`. The owner picked these:
- **A1 + P1:** two or more chosen show an "N selected" purple pill where the text sits, and one chosen shows its label as plain text.
- **B1:** a checkbox in each row.

## Owner's intent
- "The control panel should have a number input that can increment or decrement the amount of items listed in the select dropdown menu to show the user what happens when the dropdown's max height is reached and then the scroll bar appears."
- "Add another control panel option and component behavior to the same select dropdown, where you can have the user select multiple items in the dropdown, or just single items."
- "If there are multiple items selected, the number of items should be reflected in the dropdown input in the closed position."
- The Field page gets a Select demo; it was a logged follow-up from 0.1.4.
- It ships as **0.1.5**. The change is additive: single-select Select is unchanged in behaviour, markup and types.

## 1. Library: `Select` `multiple`
### API
`SelectProps` (single) stays exactly as 0.1.4 and remains an interface. A new exported interface adds the multi mode:
```ts
export interface SelectMultipleProps extends Omit<SelectProps, 'multiple' | 'value' | 'defaultValue' | 'onValueChange'> {
  multiple: true;
  value?: readonly string[];            // controlled; values no option has are ignored
  defaultValue?: readonly string[];     // uncontrolled; default []; what a form reset returns to
  onValueChange?: (value: string[]) => void; // a new array, in option order, on every toggle
}
```
- `SelectProps` gains `multiple?: false`.
- `Select` gets two call signatures, single and multiple, as SegmentedControl does: a `forwardRef` component cast to an overloaded type, so TS consumers of 0.1.4 code still compile.
- `SelectMultipleProps` is exported from the package index.
- A type test: `multiple` with a string `value` is a `@ts-expect-error`.

### Value and state
- Multi uncontrolled: it starts from `defaultValue`, or `[]`. Controlled: `value` wins.
- Toggling builds a new array in **option order**, never click order, calls `onValueChange` with it, and updates its own value when uncontrolled. The previous array is never mutated.
- A disabled option can't be toggled. A chosen-but-disabled option (from `value` or `defaultValue`) stays chosen, but can't be toggled off by the user.
- If `multiple` changes on a mounted Select, its own (uncontrolled) value resets during render to that mode's default: `defaultValue` when its type fits the new mode, else `undefined` (single) or `[]` (multi). A string never survives into multi mode, and an array never survives into single mode.

### Closed trigger (A1 + P1)
| Chosen (counting only values that match an option) | Trigger shows |
|---|---|
| 0 | `placeholder`, muted, as 0.1.4 |
| 1 | that option's label, plain text, as single-select |
| 2 or more | a pill `<span class="bit-select__count">N selected</span>` where the text sits |

- **Pill look:** `--bit-color-primary` background, `--bit-color-primary-contrast` text, bold, `--bit-radius-full`, `--bit-text-13px` body text, a 20px line height and `0 var(--bit-space-8px)` padding, as on the board. Badge `sm` is not used, because it's the 7px pixel font. It stays inside the `bit-select__value` box, so a long trigger still truncates.
- **Forced colours:** the pill gets a 1px `CanvasText` border, so it stays visible when the browser removes its background.

### Open list (B1)
- The listbox gets `aria-multiselectable="true"`. Each row keeps `aria-selected` (true or false) and `aria-disabled`.
- Every row shows a checkbox, drawn by CSS on `.bit-select__list[aria-multiselectable="true"] .bit-select__option::before`, so it's decoration and screen readers never read it.
  - **Box:** 18px, `--bit-border-width` `--bit-color-line` border, `--bit-color-surface` fill, `--bit-radius-6px`.
  - **Chosen:** a `--bit-color-primary` fill and a tick in `--bit-color-primary-contrast`, drawn with borders.
  - The row is a flex row with a `--bit-space-8px` gap.
- In multi mode a chosen row does **not** get the solid primary fill or bold weight; the checkbox shows the choice. Active (hover or keyboard) rows still get `--bit-color-primary-soft`. Disabled rows are at 0.5 opacity.
- **Forced colours:** the box border is `CanvasText`. A chosen box is filled with `Highlight` and the tick is `HighlightText`. The active row keeps 0.1.4's Highlight ring. Chosen rows in multi mode get no row fill.
- **Reduced motion:** nothing new animates.

### Keyboard and pointer (multi mode only; single is unchanged)
- **Closed:** the same as single. Enter, Space, ArrowDown and ArrowUp open with the first chosen enabled option active (else the first enabled one). Alt+ArrowDown opens. Typing opens and does typeahead.
- **Open:**
  - Enter, or Space when not mid-typeahead, **toggles** the active row and keeps the list open.
  - Clicking a row toggles it and keeps the list open; focus stays on the trigger.
  - Escape, Alt+ArrowUp, Tab, a click outside, blur and window blur all **close without toggling**. Tab is not prevented, so focus moves on. Escape still stops propagation.
  - Arrows, Home, End, Page keys, typeahead and hover move the active row exactly as in single mode.
- Clicking the trigger toggles open and closed, as in single mode.

### Forms (multi mode)
- **Submitting:** each chosen value is submitted under `name` in option order, like `<select multiple>`. One `<input type="hidden" name form value disabled>` is rendered per chosen value. With no `name`, none are rendered.
- **Validation:** the overlaid `bit-select__input` stays, but in multi mode it has **no** `name`. It carries `required` (Select's or a Field's) and `form`, and its value is the first chosen value or `''`. So `required` means "at least one chosen", and the browser's message, focus forwarding and `checkValidity()` behave as 0.1.4.
- **Disabled:** disables all of them, so nothing is submitted and nothing blocks.
- **Reset:** the owning form's reset puts an uncontrolled multi Select back to `defaultValue`, or `[]`. A controlled one ignores it. `onValueChange` is not called.
- In single mode nothing changes; the one overlaid input still carries `name`.

### File size
`Select.tsx` is about 350 lines today. The value logic (own versus controlled, the mode reset, toggle versus choose, and reset handling) moves into a `useSelectValue.ts` hook. The form inputs move into a small `SelectFormInputs.tsx`, so that no file passes about 400 lines.

## 2. Gallery: Select page
- **`optionCount` control:** a number control labelled **options**, from 1 to 20, step 1, default 5. It is **virtual**: it shapes the page and is never passed or printed.
  - `NumberControl` gains `virtual?: boolean`. `buildProps`, `toJsx` and anything else that skips virtual select controls skip virtual number controls the same way.
- **`deriveProps`:** returns `options`, the first N of these 20 labels (value = lowercase label): Primary, Neutral, Success, Warning, Danger, Apple, Banana, Cherry, Grape, Lemon, Mango, Orange, Peach, Pear, Plum, Kiwi, Lime, Melon, Berry, Fig.
  - N is `Number(state.optionCount)`, floored and clamped to 1–20. Anything that isn't a number (an empty field mid-typing) uses 5.
  - The old `fixedProps.options` goes.
- **`multiple`:** a boolean control, default false.
- **Placeholder:** the default becomes `Pick colors`.
- **Presets:** add "Long list" (`optionCount: '12'`) and "Multi-select" (`multiple: true, optionCount: '12'`). Keep Invalid, Small and Disabled.
- **Docs:**
  - Props table: `multiple` gets a row. `value`, `defaultValue` and `onValueChange` say what they take in multi mode, and `SelectMultipleProps` is named.
  - Usage and a11y gain lines on when to use multi-select, the "N selected" pill, toggling keeping the list open, and each value submitting under `name`.
  - Badges: add "Single or multi".
- **Code example:** prints `const options = [...]` (hoisted, as today) and `multiple` when on. The rendered Preview remains uncontrolled.

## 3. Gallery: Field page demo
- **`control` choice:** a virtual select control `control`, labelled **control**, with values `Input` and `Select`, default `Input`.
- **`deriveChildren`:** a new optional `deriveChildren?: (state: ControlState) => readonly ChildSpec[]` on `Manifest`. When present it replaces `children` for rendering and printing. `renderManifest` and `toJsx` use it (through one `childSpecs(manifest, state)` helper). A manifests test rejects a manifest that has both `children` and `deriveChildren`.
  - Input: `{ component: 'Input', props: { type: 'email', placeholder: 'you@example.com' } }`, as today.
  - Select: `{ component: 'Select', props: { placeholder: 'Pick a color', options: FIELD_OPTIONS } }`, using the 5 colour options.
- **`ChildSpec.props`:** widens from `Record<string, string>` to `Record<string, LiteralValue>`.
  - `printChildSpec` prints them with the same rules as top-level props: strings as attributes, other literals braced, and arrays, objects and strings over 40 characters hoisted to a `const`.
  - Hoisted child consts join the element's consts, so names stay unique (`options`, `options2`). Full-file and snippet placement are unchanged.
- **Label:** when `control` is Select, the default Field label stays `Email` unless edited. That's acceptable, but the Select preset sets `label: 'Favorite color'` and `hint: 'We use it for your avatar.'`.
- **Presets:** add a "Select" preset (`control: 'Select'`, plus the label and hint above).
- **HTML tab** (amendment, 2026-10-07): a Select's markup alone doesn't work, so the Field page hides its HTML tab while `control` is Select. `Manifest.interactive` may be a function of the state (`(state) => state.control === 'Select'`), and `CodeFormat.available` takes `(manifest, state)`. CodePanel already falls back to Props when the chosen tab disappears.

## 4. Tests
**React.**
- `Select.multi.test.tsx`:
  - ARIA (`aria-multiselectable`, `aria-selected` true and false), the pill at 0, 1, 2 and N chosen, and unknown values not counted.
  - Toggling by click, Enter and Space with the list staying open; option-order arrays; no mutation; and controlled and uncontrolled use.
  - Disabled options and a chosen disabled option, and the close keys not toggling (Escape, Tab, Alt+ArrowUp, outside click).
  - Switching `multiple` at runtime, both ways.
  - Forms: values submitted under `name` in order (FormData), none without a name, `required` blocking when empty and passing with one, disabled, `form=`, and reset.
  - Field wiring, and axe open and closed.
- The type test, and existing single-select tests unchanged and passing. Coverage stays at 100%.

**Core CSS tests.** The multi checkbox, chosen-row override, pill and forced-colour rules use tokens only (raw values only where commented, as the existing raw rules are).

**Gallery.**
- Engine: a virtual number control is neither passed nor printed. `deriveChildren` renders and prints. ChildSpec array props print hoisted, and names stay unique.
- Select manifest: `optionCount` at 1, 5, 12 and 20, plus non-numeric and out-of-range values; the presets; and `multiple` printed.
- Field manifest: the Select child renders, and its printed code (snippet and full file) is asserted as an exact string with `const options` above the Field.
- e2e: on the Select page, set options to 12, open the list, and check the list is scrollable (`scrollHeight > clientHeight`) and inside the viewport. Turn on multi-select, toggle three rows with the mouse and keyboard, close, and check the "3 selected" pill. Field page: switch to Select and open it. axe runs on every route.

**Smoke and verify.** `SelectMultipleProps` is exported and the smoke consumer type-checks a multi Select.

**Visual.** Headed Chromium screenshots of the Select page in light and dark: closed with the pill, open with checkbox rows, and the 12-option scrolling list. Also the Field page with Select.

## 5. Release
- `@bit-ds/react` goes to **0.1.5**, with a CHANGELOG `0.1.5` "Added" section (multi-select and `SelectMultipleProps`). The CHANGELOG lists package releases only, so the gallery changes get no entry. The README Select line mentions multi-select.
- The release follows the usual flow: PR, merge, tag `v0.1.5`, and the owner approves `publish`.

## Out of scope
- Chosen items shown as removable tags, a "select all" option, a search box, and a maximum number of choices.
- Option groups and async options.
- Any change to single-select behaviour or look.
