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
- **Remount on mode change:** the preview remounts when `multiple` changes, so a stale uncontrolled value never crosses modes in the gallery. Section 1's reset rule already guarantees that for consumers.

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

## 4. Tests
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

**Visual.** Screenshots of the Button and SegmentedControl pages in light and dark, at 1280px and 390px, before re-tagging.

## Out of scope
- A `count` prop on the component.
- A `required` rule (keep at least one chosen).
- Arrow-key navigation in multi mode.
- Any change to single-select.
