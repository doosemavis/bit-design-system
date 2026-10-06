# SegmentedControl multi-select, segment count, and the one-card playground

Date: 2026-10-06. Ships in 0.1.3, which is not yet published: the tag was pulled before publish.
Board: `~/.gstack/projects/doosemavis-bit-design-system/designs/segmented-playground-20261006/board.html`. The owner picked A1 and B3.

## Owner's intent
- Set how many segments a SegmentedControl shows. Today the gallery always shows 3.
- Let a SegmentedControl be single-select or multi-select.
- On every component page, the preview card must not look disconnected from the Controls panel. Today the card is often shorter than the controls next to it.

## Decisions
| Question | Decision |
|---|---|
| Segment count | Gallery control only, from 2 to 5 (default 3). The component already renders any number of `options`, so it gets no `count` prop. |
| Turning on multi-select | A `multiple` boolean prop |
| Empty selection | Allowed. Nothing starts chosen without `defaultValue`, and every segment can be turned off. |
| Multi-select look | A1: the same as single-select. No CSS changes. |
| Playground | B3: one card. Preview and controls are split by a divider, and their two bars form one header strip. |

## 1. Library: `SegmentedControl` `multiple`
**Props.** The value props become a discriminated union. Everything else is unchanged.
```ts
interface SingleSelect { multiple?: false; value?: string; defaultValue?: string; onValueChange?: (value: string) => void }
interface MultiSelect { multiple: true; value?: readonly string[]; defaultValue?: readonly string[]; onValueChange?: (value: string[]) => void }
export type SegmentedControlProps = SegmentedControlBaseProps & (SingleSelect | MultiSelect);
```
- Single-select behaviour, markup and types stay byte-for-byte as they are.

**Multi-select markup.**
- Each segment uses `<input type="checkbox">` with the same classes, all sharing one `name` (given or generated), so a form submit sends every chosen value.
- The fieldset gets `data-multiple` so tests and authors can tell the modes apart. No CSS reads it.

**Multi-select behaviour.**
- Toggling a segment builds a new array in option order (not click order) and calls `onValueChange` with it. The previous array is never mutated.
- Uncontrolled: it starts from `defaultValue`, or `[]` when there is none.
- Controlled: `value` wins. Values that match no option are ignored when rendering.
- If `multiple` changes on a mounted control, its own (uncontrolled) value resets to that mode's default. A string never sticks around in multi mode, and an array never sticks around in single mode.
- Disabled options can't be toggled.

**Keyboard and accessibility.** All of this comes from native checkboxes: each segment is a Tab stop, and Space toggles it. The legend still names the group, and the forced-colours `:checked` rule already covers checkboxes.

**Exports.** No new exports. `SegmentedControlProps` already exists. `index.d.ts` gains the union.

**Docs.** The gallery's Usage and Accessibility text explain when to use multi-select. The CHANGELOG 0.1.3 entry gets an "Added" line.

## 2. Gallery engine: virtual controls and derived props
- A control may set `virtual: true`. The playground keeps its state, but `buildProps` doesn't pass it to the component, and toJsx doesn't print it.
- A manifest may define `deriveProps(state) => Record<string, LiteralValue>`. Its result merges like `fixedProps`, applied after them, so it wins over a fixed prop of the same name. It is printed the same way.
- SegmentedControl manifest:
  - `segments` is a virtual select of '2' to '5', default '3'.
  - `deriveProps` returns `options`: the first N of Day, Week, Month, Quarter, Year (values `day` … `year`).
  - It also gets a `multiple` boolean control, a "Multi-select" preset (multiple on, 4 segments), and a `multiple` row in the Props table.
- **No remount on mode change:** Section 1's rule (an uncontrolled value resets when `multiple` changes) already keeps a stale value from crossing modes, so the gallery needs no remount.

## 3. Gallery layout: B3 one card, on every component page
**Structure.**
- `Playground` wraps the preview and the controls in a single bit `Card` (`gallery-playground__top`).
- `Preview` renders its bar and stage without a `Card` of its own.
- `ControlsPanel` gets a bar with the same look as the preview bar: "CONTROLS" in the pixel face on the left, Reset on the right, the same height. It still has `aria-labelledby` pointing at its h3.

**Sizing and responsive layout.**
- Both halves stretch to the card's height. The preview stage grows to fill its half.
- A divider (border-inline-start) separates the halves.
- Under 720px the controls stack under the stage, and the divider becomes a top border.

**Rules.** New paint declarations go on the documented `gallery-css.exceptions.ts` list with reasons. Card chrome comes from bit `Card`, not gallery CSS.

## 4. Code examples: long values become a `const` (owner, 2026-10-06; board `designs/codepanel-20261006/board.html`, section D)
**Which values.** In the React code under every playground:
- Every array or object prop (from `fixedProps`, `deriveProps` or a control) is hoisted.
- Any string prop longer than 40 characters is hoisted too: a text control such as CodeBlock `code`, or a long `label`.

**How it prints.**
- Each hoisted value becomes `const <propName> = <literal>;` above the component. Arrays and objects print one item per line, with two-space indents.
- The prop prints as `<propName>={<propName>}`.
- With **Full file** on, the consts sit between the import line and `export function Example()`. With it off, they sit above the element.
- Children text is never hoisted. A name that isn't a valid JS identifier (such as `aria-label`) gets a camelCased const name.

**HTML tab.** No variables. It serializes the rendered element as today.

## 5. Scrollbar: on-theme horizontal scrollbar (owner's design, 2026-10-06; board `designs/codepanel-20261006/scrollbar.html`, option V1)
**Where.** Library CSS (packages/core), so it ships in the package: CodeBlock's `.bit-code__pre` and Table's scroll box (`.bit-table` wrapper with `overflow-x: auto`).

**CodeBlock.**
- Track: `--bit-code-bg`.
- Thumb: the same `--bit-code-bg` fill, with a 2px outline in `--bit-color-accent` (the CodeBlock's border colour: violet in light, yellow in dark, and custom themes follow). It fills with the accent on hover.
- The thumb is drawn slightly shorter than the track, leaving an even gap above and below its outline, so a small even strip of the dark track shows between the thumb's bottom edge and the CodeBlock's bottom border.
- Implementation: `::-webkit-scrollbar` 14px; thumb `border: 3px solid transparent; background-clip: padding-box` plus an inset 2px accent ring (`box-shadow: inset 0 0 0 2px`).
- Firefox fallback: `scrollbar-color: var(--bit-color-accent) var(--bit-code-bg)` with `scrollbar-width: thin`, applied only where `::-webkit-scrollbar` is unsupported, via `@supports not selector(::-webkit-scrollbar)`.

**Table.** It sits on the page surface, not the dark panel, so its track uses `--bit-color-surface` and its thumb outline `--bit-color-line`, with the same shape and gap.

**Rules.** Reduced motion is not relevant (nothing animates). Forced colours: the system draws scrollbars, so the rules are wrapped in `@media not (forced-colors: active)`.

### 5a. Owner's follow-up (2026-10-06, after seeing it live)
The owner's words: "if the background is black like the codeblock the color of the slider should match that. And same goes for the table or cards that have a light background in the light mode. … the border around the slider should match the color of the codeblock component that's being used in whatever theme mode (light/dark)". The owner chose this scope: bit components plus the gallery.

**The rule for every styled scrollbar.**
- The track and the thumb fill are the background of the container the bar sits in.
- The thumb has a 2px inset outline in `--bit-color-accent`, the CodeBlock border colour for the current mode: violet in light, yellow in dark.
- On hover the thumb fills with the accent.
- The shape is the same as §5: 14px, with the transparent 3px border that leaves an even gap.

**Where it applies.**
- **CodeBlock:** unchanged.
- **Table:** the track and thumb fill stay `--bit-color-surface`, and the outline and hover move from `--bit-color-line` to `--bit-color-accent`. The Firefox fallback becomes `scrollbar-color: var(--bit-color-accent) var(--bit-color-surface)`.
- **Gallery scroll areas:** the presets row in the preview bar (horizontal) and the sidebar (vertical, so `width: 14px` as well). These use `transparent` for the track and thumb fill, so they show their container's own background whatever it is. They also get the same `@supports` reset (`scrollbar-color: auto; scrollbar-width: auto`) so Chrome uses the pseudo-elements.
  - These are paint, so they go on `gallery-css.exceptions.ts` with `frame:` reasons.
- **Apps using bit:** their own page and panel scrollbars are untouched (`reset.css` is unchanged).

### 5b. Owner's second follow-up (2026-10-06): solid thumb, no hover change
The owner's words: "fill in those sliders with the same color that the border is. Also, when the cursor hovers over the slider, it should not have a hover change to make the slider appear taller/larger. The clickable area to drag it should be that size, but the slider should stay as the smaller slider."

This replaces §5 and §5a's thumb styling:
- **Every styled scrollbar:** the thumb is a solid `--bit-color-accent` fill (the CodeBlock border colour: violet in light, yellow in dark), with no outline ring.
- **Size and grab area:** it keeps `border: 3px solid transparent` with `background-clip: padding-box`. The visible bar stays slim with the even gap, and the whole 14px thumb box, transparent border included, is the drag target.
- **Hover:** no hover rule. The thumb looks the same when hovered or dragged.
- **Track:** unchanged. It is the container's background (`--bit-code-bg` for CodeBlock, `--bit-color-surface` for Table, transparent for the gallery's areas).
- **Firefox fallback:** stays `scrollbar-color: var(--bit-color-accent) <track>` with `scrollbar-width: thin`.

## 6. Tests
**React `SegmentedControl.test.tsx`.**
- Multi: checkboxes with a shared name; toggling on and off; option-order arrays; no mutation; controlled and uncontrolled use; the empty default.
- Disabled segments; Space toggles; `data-multiple`; switching `multiple` at runtime resets; axe.
- A type test: `multiple` with a string `value` is a `@ts-expect-error`.
- Coverage stays at 100%.

**Gallery.**
- Engine: a virtual control is neither passed nor printed; `deriveProps` merges and prints.
- Manifest: segments 2 to 5 render and print exactly N options; the Multi-select preset.
- Playground: one Card holds both halves; the bars share a height; the stage stretches; it stacks under 720px.
- `gallery-css` tests and exceptions; e2e axe on every route.

**Code and scrollbar.**
- toJsx: hoisting, covering arrays, objects, a long string, the 40-character boundary (exactly 40 stays inline), full-file and snippet placement, and camelCased names; plus the printed code of the SegmentedControl and CodeBlock pages.
- Core CSS tests for both scrollbar rule sets, their tokens, and the forced-colours guard.

**Visual.** Screenshots of the Button and SegmentedControl pages in light and dark, at 1280px and 390px, before re-tagging.

## Out of scope
- A `count` prop on the component.
- A `required` rule (keep at least one chosen).
- Arrow-key navigation in multi mode.
- Any change to single-select.
