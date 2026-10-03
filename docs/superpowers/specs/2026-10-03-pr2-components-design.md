# PR2: nine new components, design

**Status:** the looks were approved by the owner on boards on 2026-10-03, and the design in chat. This written spec awaits the owner's review.

**Ships as:** PR2, on branch `feat/components`, after the logo (#7, merged). Next comes PR3: final pages, the dogfooding lint, release, and the first npm publish.

**Inherited scope:** PR2 is T6 + T7 from `docs/superpowers/plans/2026-09-13-gallery.md` → "Design Review Amendments" (§D components, §E states, §G accessibility). It also takes the library-vs-gallery split from `docs/designs/gallery-dogfood.md`. Where this spec differs from those, this spec wins.

**Visual reference:** `~/.gstack/projects/doosemavis-bit-design-system/designs/pr2-20261003/`
- `board.html`: round 1, every component in both modes
- `board-2.html`: round 2, the Switch fix and the code borders

## Goal

`@bit-ds/react` gains nine public components, so apps built with bit, and the gallery itself, have real form controls, links, code display and tables:
- **Forms:** Field, Input, Select, Switch
- **Content:** Link, Code, CodeBlock, Table
- **Choice:** SegmentedControl

All nine follow these rules:
- They work in light mode and in Arcade Night dark mode.
- Native elements sit underneath, so keyboard and screen-reader support comes from the browser.
- They use the single focus ring from `reset.css`.
- They use flat solid fills and bit's chunky 3px lines.

## Decisions (owner, 2026-10-03)

| # | Decision |
|---|---|
| 1 | **Inputs and Selects are recessed.** They use `--bit-shadow-inset`, so typing areas sink into the page while buttons pop out. (Board I1; I2, raised, was not chosen.) |
| 2 | **Switch "on" is green** (`--bit-color-success`). When on, the track and the knob get a **near-black outline** (`--bit-color-ink`) so the switch stays crisp in dark mode. (Boards S1 and W1.) |
| 3 | **Code and CodeBlock borders follow the mode accent:** violet in light and yellow in dark, the same as the focus ring. They read a new token, `--bit-color-accent`. (Board C2.) |
| 4 | **Everything else as drawn on board 1:** Field errors, Select, Link, CodeBlock layout, SegmentedControl and Table. |
| 5 | **One PR**, built task by task with sub-agents. |

## 1. Shared rules (every new component)

- **Folders:**
  - React component in `packages/react/src/components/<Name>/<Name>.tsx` with `<Name>.test.tsx`
  - CSS in `packages/core/src/components/<kebab>.css`, imported from `packages/core/src/index.css`
  - exported from `packages/react/src/index.ts`
- **Classes come from `toClasses`** and follow the existing naming rule tested in `packages/react/src/index.test.tsx`: the root is `bit-<kebab(Name)>`, and a compound child of a parent export is `bit-<parent>__<rest>`. So:
  - TableHead → `bit-table__head`
  - CodeBlock → `bit-code__block`

  Axes emit `bit-{value}` classes. States are attributes, never classes.
- **`forwardRef`**, `className` appended last, rest props passed through, and `dropLegacyColor` applied to rest, like the existing components. Where the styled root and the native control differ (Select, Switch), this spec says which element gets the ref, `className` and rest.
- **Sizes:** where a component has a `size`, it uses `--bit-control-height-{sm,md,lg}` and `--bit-control-padding-*` through `--_bit-size-*` (`system/sizes.css`), the same as Button.
- **Colors:** a `color` axis uses `--_bit-color-*` through `.bit-{color}` (`system/colors.css`).
- **Borders:** `var(--bit-border-width) solid var(--bit-color-line)`, unless stated otherwise.
- **No `outline` in any component CSS.** The ring is drawn only by `system/reset.css`.
  - The existing "never sets outline" test is extended to catch the longhands: `/(^|[;{])\s*outline(-(color|style|width))?\s*:/m`.
  - Visually hidden native inputs (Switch, SegmentedControl) get their ring through new `reset.css` rules (see each component).
- **Visually hidden** means the existing pattern if the repo has one; otherwise `position:absolute; width:1px; height:1px; margin:-1px; padding:0; overflow:hidden; clip-path:inset(50%); white-space:nowrap; border:0`. The input stays focusable.
- **Disabled:** `opacity: 0.5; cursor: not-allowed`, as in Button.
- **Each component gets a gallery manifest** in `apps/gallery/src/manifests/` and a page in the existing generic ComponentPage.
- **No Storybook stories for new components.** PR3 removes Storybook, and `pnpm storybook:build` only has to keep passing.

## 2. Tokens

New tier-2 tokens:

| Token | Kind | Light | Dark | Used by |
|---|---|---|---|---|
| `--bit-color-accent` | mode | `var(--bit-palette-violet)` `#7C3AED` | `#FFC800` | Code and CodeBlock borders |
| `--bit-color-link` | mode | `var(--bit-palette-violet)` `#7C3AED` | `#B79BFF` | Link text (primary) |
| `--bit-color-link-visited` | mode | `#5B2BB5` | `#9B7FE6` | Link `:visited` (primary) |
| `--bit-color-danger-text` | mode | `var(--bit-color-danger)` | `#FF8A8A` | Field error text |
| `--bit-color-knob` | shared | `var(--bit-palette-white)` | (same) | Switch thumb when on |

- New palette entries, private to `power-up.css`, are added where a literal is used more than once.
- `SEMANTIC_TOKENS` goes from 87 to 92.
- `MODE_TOKENS` goes from 18 to 22: accent, link, link-visited and danger-text. The dark block declares each one.
- `--bit-color-knob` is shared and declared in the light block only.

Contrast tests, run in both modes through the existing two-mode harness:
- **3:1 or more:**
  - accent against bg, surface and `--bit-code-bg`
  - focus ring against `--bit-code-bg` (from PR1's checklist)
  - ink against success, for the Switch on-state edge
- **4.5:1 or more:**
  - link and link-visited against bg and surface
  - danger-text against bg and surface

If a listed value fails, the implementer adjusts the dark value until it passes, records it, and the owner sees it on the sign-off board.

## 3. The components

### Field (`bit-field`)

```ts
interface FieldProps extends Omit<HTMLAttributes<HTMLDivElement>, 'color'> {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;      // shown below; marks the control invalid
  required?: boolean;     // visible "*" (aria-hidden) + required passed to the control
  children: ReactElement; // exactly one Input or Select
}
```

**Markup:**
- `<div class="bit-field">` contains `<label class="bit-field__label" for={id}>{label}{required && <span class="bit-field__required" aria-hidden="true"> *</span>}</label>`, then the control, then `<p class="bit-field__hint" id={hintId}>` (when there's a hint) and `<p class="bit-field__error" id={errorId}><span aria-hidden="true">⚠ </span>{error}</p>` (when there's an error).
- The ref, `className` and rest props go on the root `div`.

**Wiring:**
- Field makes its ids with `useId` and shares them through a private `FieldContext`: `{ id, describedBy, invalid, required }`.
- Input and Select read the context when present and merge it:
  - `id ?? ctx.id`
  - `aria-describedby`, combining the control's own value and the context's
  - `aria-invalid` is true when the control's `invalid` is set or there's a context error
  - `required ?? ctx.required`
- The control's own props win over the context.
- No `cloneElement`.

**Switch is not used inside Field.** Switch carries its own visible label as `children`.

**Look:**
- The label is bold and uses body text.
- The hint is muted at `--bit-text-13px`.
- The error is bold, in `--bit-color-danger-text`, at `--bit-text-13px`.
- The gap is `--bit-space-4px` or `--bit-space-8px`, as drawn on the board.

### Input (`bit-input`)

```ts
interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'color'> {
  size?: 'sm' | 'md' | 'lg';  // default 'md'
  invalid?: boolean;          // sets aria-invalid="true"
}
```

- **Element:** a native `<input>`. It takes the ref, `className` and rest props, and `type` passes through.
- **Look:**
  - height from the size scale, with horizontal padding from the size scale
  - surface background and the line border
  - `--bit-radius-10px` and `box-shadow: var(--bit-shadow-inset)`
  - body font at the size's text size
  - placeholder in `--bit-color-text-muted`
- **`[aria-invalid="true"]`:** `border-color: var(--bit-color-danger)`.
- **`type="search"`:** styled the same, with the native cancel button left alone.

### Select (`bit-select`)

```ts
interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'color'> {
  size?: 'sm' | 'md' | 'lg';
  invalid?: boolean;
}
```

**Markup:** `<span class="bit-select bit-md">` wraps `<select class="bit-select__control">`.
- **Wrapper:** gets `className`, and draws the chevron with `::after`, using a CSS border triangle in `--bit-color-text` with `pointer-events: none`.
- **`<select>`:** gets the ref and rest props, uses `appearance: none` and Input's look, and has room on the right for the chevron.
- **Options:** native `<option>` children.

### Switch (`bit-switch`)

```ts
interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type' | 'color' | 'role'> {
  size?: 'sm' | 'md';  // default 'md'
  children?: ReactNode; // the visible label
}
```

**Markup:** `<label class="bit-switch bit-md">` contains:
- `<input type="checkbox" role="switch" class="bit-switch__input">`, visually hidden, which gets the ref and rest props (`checked`, `defaultChecked`, `onChange`, `disabled`, `name`, …)
- `<span class="bit-switch__track" aria-hidden="true"><span class="bit-switch__thumb"></span></span>`
- `<span class="bit-switch__label">{children}</span>`

The label gets `className`.

**Sizes:**
- md: track 48×28, thumb 16
- sm: track 40×24, thumb 12

Both use a 3px border.

**Look:**
- **Off:** `--bit-color-neutral-soft` track, line border, `--bit-shadow-sm`, and a surface thumb with a line border.
- **On** (`.bit-switch__input:checked + .bit-switch__track`):
  - the track is `--bit-color-success`, with a `--bit-color-ink` border
  - the thumb is `--bit-color-knob`, with a `--bit-color-ink` border
  - the thumb moves by `left` (no `transform`)
- **Disabled:** `.bit-switch__input:disabled + .bit-switch__track` is at 0.5 opacity, and the label gets `cursor: not-allowed`.
- **Focus:** `reset.css` adds `.bit-switch__input:focus-visible + .bit-switch__track { outline: var(--bit-focus-ring-width) solid var(--_bit-focus-ring, var(--bit-focus-ring-color)); outline-offset: var(--bit-focus-ring-offset); }`.

### Link (`bit-link`)

```ts
interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'color'> {
  color?: 'primary' | 'neutral'; // default 'primary'
  asChild?: boolean;             // render the single child (e.g. a router <Link>) with bit-link's class and props merged
}
```

**`color`:**
- **`primary`:** text in `--bit-color-link`, and visited in `--bit-color-link-visited`.
- **`neutral`:** text in `--bit-color-text`, and visited unchanged.

A full color axis is not offered, because only these two pass text contrast in both modes. The amendments' "color axis" line is superseded here.

**Look:**
- `font-weight: var(--bit-weight-bold)`
- `text-decoration: underline 2px` with `text-underline-offset: 3px`
- **`:hover`:** a 3px underline, and a background of `--bit-color-primary-soft` for primary, or `--bit-color-neutral-soft` for neutral.

**`asChild`:** uses a new in-repo `Slot` at `packages/react/src/system/Slot.tsx`.
- It renders its only child element.
- It merges `className`: the Slot's first, then the child's.
- It merges `style`, with the child's style winning.
- It merges event handlers: the child's handler runs first, then Slot's, unless `event.defaultPrevented`.
- Other props merge with the child's winning.
- It forwards the ref, composing the two refs.
- With anything other than exactly one valid element, it throws `Error('[bit] Link asChild needs exactly one child element.')`.

### Code (`bit-code`)

```ts
type CodeProps = HTMLAttributes<HTMLElement>; // renders <code>
```

**Look:**
- `--bit-font-mono` at `0.9em`, with `font-variant-ligatures: none`
- padding `1px 6px`, `--bit-radius-6px`, `--bit-color-neutral-soft` background, `--bit-color-text`
- **border:** `2px solid var(--bit-color-accent)`

### CodeBlock (`bit-code__block`)

```ts
interface CodeBlockProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'color'> {
  code: string;
  language: 'jsx' | 'html' | 'css' | 'shell';
  copy?: boolean; // default true
}
```

**Markup:** `<div class="bit-code__block" data-language={language}>` contains:
- a bar, `<div class="bit-code__bar">`, holding `<span class="bit-code__lang">{language}</span>`, then, when `copy` is set, `<button type="button" class="bit-code__copy" data-state="idle|copied|failed">` and `<span class="bit-code__status" aria-live="polite">` (visually hidden)
- the code, `<pre class="bit-code__pre" tabIndex={0} aria-label={`${language} code`}><code>`, with one `<span class="bit-code__token" data-kind={kind}>` per token (plain `text` tokens may be bare strings)

**Look:**
- `--bit-code-bg` background and `--bit-code-text` text
- **border:** `3px solid var(--bit-color-accent)`
- `--bit-shadow-md`, `--bit-radius-10px`, `overflow: hidden`
- **bar:** a bottom rule of `2px solid var(--bit-color-accent)`; the language label in the pixel font at `--bit-text-11px` in `--bit-code-punct`
- **pre:** `overflow-x: auto`, `--bit-font-mono` at `--bit-text-13px` with line-height 1.6, and `font-variant-ligatures: none`
- **tokens:** `[data-kind="X"]` → `color: var(--bit-code-X)` for each `CODE_KINDS` entry, and `comment` is italic
- **copy button:** a small light button with a 2px ink border and `--bit-radius-6px`; `[data-state="failed"]` uses a `--bit-color-danger-soft` background with `--bit-color-text`

**Tokenizer:** internal and unexported, at `packages/react/src/components/CodeBlock/tokenize.ts`. It is the gallery's `apps/gallery/src/code/highlight.ts` moved and grown:
- `tokenize(code, language): { kind: CodeKind; text: string }[]`
- languages: jsx, html, css, shell
- kinds: the ten `CODE_KINDS`, which are `text`, `keyword`, `string`, `tag`, `component`, `attr`, `punct`, `comment`, `number` and `prop`
- string patterns skip escaped quotes
- the invariant: `tokens.map(t => t.text).join('') === code` for any input

The gallery's `highlight.ts` and `highlight.test.ts` move into the react package, adapted.

**Copy:**
- On click, it calls `navigator.clipboard.writeText(code)`.
- On success, `data-state="copied"` and the button reads "Copied". On failure, including a missing `navigator.clipboard`, `data-state="failed"` and it reads "Copy failed".
- Either way it resets to "Copy" after 2000ms.
- The status span echoes "Copied" or "Copy failed".
- Unmounting clears the timer.

**Focus:**
- The copy button and the `pre` take the `reset.css` ring.
- The contrast test in §2 covers the ring on code-bg.

### SegmentedControl (`bit-segmented-control`)

```ts
interface SegmentedOption { value: string; label: ReactNode; disabled?: boolean }
interface SegmentedControlProps
  extends Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, 'onChange' | 'color' | 'defaultValue'> {
  legend: ReactNode;
  legendHidden?: boolean;      // legend visually hidden (still read)
  options: readonly SegmentedOption[];
  name?: string;               // default useId()
  value?: string;              // controlled
  defaultValue?: string;       // uncontrolled; default options[0].value
  onValueChange?: (value: string) => void;
  color?: 'primary' | 'neutral' | 'success' | 'warning' | 'danger'; // default 'primary'
  size?: 'sm' | 'md' | 'lg';   // default 'md'
}
```

**Markup:**
- `<fieldset class="bit-segmented-control bit-primary bit-md">`, which gets the ref, `className` and rest props.
- Inside it, `<legend class="bit-segmented-control__legend">`.
- Then `<div class="bit-segmented-control__options">`.
- Per option, a `<label class="bit-segmented-control__option">` containing `<input type="radio" class="bit-segmented-control__input" name value checked disabled>` (visually hidden), then `<span class="bit-segmented-control__label">{label}</span>`.

**Keyboard:** native radios give arrow-key movement and a single Tab stop, so there is **no custom roving tabindex**. This retires PR1's checklist item.

**Look:**
- The options row is joined segments: an outer line border, `--bit-radius-10px`, `--bit-shadow-md` and surface.
- Dividers are 3px lines in the line color.
- The checked option fills with `--_bit-color` and `--_bit-color-contrast`.
- Disabled options are at 0.5 opacity.

**Focus:** `reset.css` adds `.bit-segmented-control__input:focus-visible + .bit-segmented-control__label { outline: …same as Switch…; outline-offset: calc(-1 * var(--bit-focus-ring-width) - 2px); }`. The ring sits inside the segment.

### Table (`bit-table`)

Exports: `Table`, `TableHead`, `TableBody`, `TableRow`, `TableCell`.

```ts
interface TableProps extends TableHTMLAttributes<HTMLTableElement> { striped?: boolean }
interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> { as?: 'th' | 'td' }
```

**`Table`:**
- It renders `<div class="bit-table" data-striped={striped ? '' : undefined} tabIndex={0}>` with `<table class="bit-table__table">` inside.
- The `table` gets the ref and rest props. The wrapper gets `className`.
- If `aria-label` or `aria-labelledby` is passed, the wrapper also gets `role="region"` with that label, and the `table` gets the same label.
- The wrapper is always focusable, so a horizontally scrolling table can be scrolled by keyboard.

**`TableHead`, `TableBody` and `TableRow`:** render `thead`, `tbody` and `tr` with classes `bit-table__head`, `bit-table__body` and `bit-table__row`.

**`TableCell`:** renders `th` inside `TableHead` and `td` otherwise, using a private `TableSectionContext`. `as` overrides that, and the class is `bit-table__cell`.

**Look:**
- **wrapper:** the line border, `--bit-radius-10px`, `--bit-shadow-md`, surface, and `overflow-x: auto`
- **table:** `width: 100%; border-collapse: collapse`
- **head cells:** the pixel font at `--bit-text-11px`, uppercase, with a bottom rule of `3px solid var(--bit-color-line)`
- **body cells:** a top border of `1px solid color-mix(in srgb, var(--bit-color-line) 30%, transparent)`, with none on the first row
- **`[data-striped]`:** even body rows get `--bit-color-neutral-soft`
- **cell padding:** `--bit-space-12px` by `--bit-space-16px`

## 4. Gallery

**Manifests:**
- There is one manifest per component. Compound children are expressed as `ChildSpec`: Select's `option` children and Table's rows. Table's nested parts are registered so `toJsx` can print them.
- **ChildSpec allowlist** (from PR1's checklist): a lowercase `component` must be one of `option`, `span`, `strong`, `em` or `code`, and the manifest contract test fails otherwise.
- **Groups:** Field, Input, Select and Switch go in a new sidebar group, **Forms**. The manifest `group` union gains `'forms'`, and the sidebar renders it between Components and Brand. Link, Code, CodeBlock, SegmentedControl and Table go in `components`.
- **Previews:** Field's preview wraps an Input. CodeBlock's preview takes `code` and `language` from controls.

**Code panels switch to `CodeBlock`:**
- ComponentPage's code panel and Home's three `pre.gallery-pre` snippets render `<CodeBlock>` from `@bit-ds/react`. The panel and the React snippets use `language="jsx"`, the HTML-tab snippet uses `"html"`, and the install snippet uses `"shell"`.
- This is the owner's request from the dark-mode PR: editor colours in the gallery.
- `.gallery-pre` and its tests are removed, and `gallery.css` no longer sets a mono font.

**Deferred to PR3:** replacing the gallery's own raw `<select>`, `<input>` and `<button>` with bit components (the dogfooding lint).

## 5. Testing and done criteria

**React** (per component; react coverage stays at 100%):
- **Basics:**
  - the rendered element, classes and axes
  - where the ref, `className` and rest props land
  - every state attribute
  - axe clean
- **Field:**
  - `id`, `aria-describedby` and `aria-invalid` reach the control
  - the control's own props win
  - the hint and error ids exist only when used
- **Input and Select:** `invalid` sets `aria-invalid="true"`.
- **Switch:**
  - `role="switch"`
  - checking it by clicking the label, and by Space
  - disabled
- **Link:**
  - the color class
  - `asChild` renders the child, merges class, style, handlers and ref
  - it throws on zero or two children
- **CodeBlock:**
  - token spans per language
  - the tokenizer invariant, as a property test over many inputs including quotes, escapes and unclosed strings
  - copy success, failure and missing clipboard, plus the 2000ms reset (fake timers) and the timer cleanup on unmount
  - `copy={false}` hides the button
- **SegmentedControl:**
  - radios share `name`
  - controlled and uncontrolled
  - `onValueChange`
  - a disabled option
  - the legend is hidden but still present
- **Table:**
  - `th` in the head, `td` in the body, and the `as` override
  - `striped` sets `data-striped`
  - `aria-label` adds the region role

**Core:**
- every new CSS file reads only declared tokens
- no `outline` in component CSS, longhands included
- the new `reset.css` ring rules exist
- the new mode tokens are declared in both blocks
- every contrast check in §2 passes

**Gallery:**
- the manifest contract test, including the ChildSpec allowlist and the `forms` group
- the route smoke test, axe in both modes, for all nine pages
- Home and ComponentPage render `CodeBlock`

**By eye:** before the PR, a real-browser board of all nine components in both modes, plus the gallery code panels, for the owner's sign-off.

**Done:** all nine components are public, each has a gallery page, and every gate is green:
- build, verify (25 components: 12 existing + 13 new exports), typecheck, lint
- core, react and gallery tests
- react coverage 100%
- smoke, `storybook:build`

## Effects on later work

- **PR3:** the dogfooding lint bans raw `<button>`, `<a>`, `<input>`, `<select>`, `<table>`, `<code>` and `<pre>` in the gallery. These components make that possible. The layout-C pages fill in each manifest's `docs`.
- **PR1 checklist status:** SegmentedControl roving tabindex is retired (native radios). CodeBlock ring contrast, outline longhands, the ChildSpec allowlist and the mono font are all handled here.

## Amendment 1 (owner, 2026-10-03, at plan review)

| # | Change | Supersedes |
|---|---|---|
| P1 | CodeBlock's `pre` also gets `role="region"`, keeping `aria-label={`${language} code`}` and `tabIndex={0}`, so every screen reader announces the label. | §3 CodeBlock markup |
| P2 | **The failed Copy state is a solid danger button** in both modes: `[data-state="failed"]` uses a `--bit-color-danger` background with `--bit-color-danger-contrast` text. (Board `pr2-20261003/board-3.html`, F1.) | §3 CodeBlock copy-button look (`--bit-color-danger-soft`) |
| P3 | **The plan's two contrast-driven values are accepted:** light `--bit-color-danger-text` `#D61A1A` and dark `--bit-color-link-visited` `#9D82E7`. | §2 values |
