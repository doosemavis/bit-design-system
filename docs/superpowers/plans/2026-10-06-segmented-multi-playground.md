# SegmentedControl multi-select, one-card playground, hoisted code, on-theme scrollbars: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the 0.1.3 additions the owner asked for on 2026-10-06:
- SegmentedControl `multiple`
- a gallery segment-count control
- the one-card playground (B3)
- code examples that hoist long values into consts
- on-theme scrollbars for CodeBlock and Table

**Architecture:**
- **Library, installable:** the SegmentedControl props become a discriminated union, and core CSS gains scrollbar rules.
- **Gallery engine:** gains virtual controls and `deriveProps`. The code printer hoists long values. The Playground renders both halves in one bit `Card`.

**Tech Stack:** a pnpm monorepo:
- `packages/core`: CSS and tokens, tested with vitest in node
- `packages/react`: `@bit-ds/react`, built with tsup, tested with vitest + jsdom + Testing Library, with a 100% coverage gate
- `apps/gallery`: Vite + React, with vitest, Playwright e2e and an axe run

**Spec:** `docs/superpowers/specs/2026-10-06-segmented-multi-playground-design.md`. Read it before starting any task.

## Global Constraints
- **Patch release.** 0.1.3 is a patch, so single-select SegmentedControl behaviour, markup and types must not change. The existing tests are the contract.
- **Immutability.** Never mutate props, state or arrays. Build new arrays.
- **Gallery CSS.** `gallery.css` is layout-only. Each paint declaration needs an entry in `apps/gallery/src/gallery-css.exceptions.ts` with a reason (`frame:`, `a11y:` or `specimen:`). Card chrome comes from bit `Card`.
- **Gallery reads the built library.** The gallery imports `@bit-ds/react` from `packages/react/dist`, so run `pnpm build` after any library change before gallery tests or the browser.
- **Version and changelog.** Don't edit CHANGELOG.md or package versions; the controller does.
- **Commits.** Conventional messages (`feat:`, `fix:`, `test:`, `refactor:`, `docs:`), each ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Don't push.
- **Style.** Match the surrounding code: terse one-line JSDoc, comments only where the why isn't obvious, tokens rather than raw colours in library CSS.
- **Done gate, every task:**
  - `pnpm build && pnpm verify`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm --filter @bit-ds/core test`
  - `pnpm test:coverage` (100% must hold)
  - `pnpm --filter @bit-ds/gallery test`
  - `node --test 'scripts/*.test.mjs'`
  - `pnpm smoke`

## Review Focus
The spec doesn't pin these, so each one has a test in its owning task.
1. **Controlled `multiple` value with an unknown string** (Task 1): `value={['nope']}` renders nothing chosen and doesn't throw. Toggling a real option emits only real values.
2. **Toggling `multiple` at runtime** (Task 1): an uncontrolled control resets to the new mode's default. It never renders a string in multi mode or an array in single mode, and it doesn't crash.
3. **A hoisted name that collides** (Task 3): two hoisted props never print the same const name. A name like `aria-label` becomes a valid identifier (`ariaLabel`).
4. **The 40-character boundary** (Task 3): a string of exactly 40 characters stays inline, and 41 hoists. A string containing quotes or newlines prints as a valid JS literal.
5. **A playground with no controls at all, or only a children control** (Task 4): the one-card layout still renders both halves with matching bars and no empty-grid gap.

---

### Task 1: SegmentedControl `multiple` (library)

**Files:**
- Modify: `packages/react/src/components/SegmentedControl/SegmentedControl.tsx`
- Test: `packages/react/src/components/SegmentedControl/SegmentedControl.test.tsx`
- Check: `packages/react/scripts/verify-dist.mjs` and `packages/react/src/index.ts`. No new exports are expected.

**Interfaces:**
- Produces, used by Task 5 through the built package:
```ts
interface SegmentedControlBaseProps
  extends Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, 'onChange' | 'color' | 'defaultValue'> {
  legend: ReactNode; legendHidden?: boolean; options: readonly SegmentedOption[]; name?: string;
  color?: Color; size?: Size;
}
interface SegmentedSingleProps { multiple?: false; value?: string; defaultValue?: string; onValueChange?: (value: string) => void }
interface SegmentedMultipleProps { multiple: true; value?: readonly string[]; defaultValue?: readonly string[]; onValueChange?: (value: string[]) => void }
export type SegmentedControlProps = SegmentedControlBaseProps & (SegmentedSingleProps | SegmentedMultipleProps);
```

- [ ] **Step 1: Write failing tests**

Append them to the test file's `describe`. The file already has `OPTIONS`, `radio()`, userEvent and `expectNoA11yViolations`.
```tsx
const box = (name: string) => screen.getByRole('checkbox', { name });

describe('multiple', () => {
  it('renders one checkbox per option, sharing one name, and marks the fieldset data-multiple', () => {
    const { container } = render(<SegmentedControl multiple legend="Show" options={OPTIONS} name="show" />);
    const fieldset = container.firstElementChild as HTMLElement;
    expect(fieldset).toHaveAttribute('data-multiple');
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
    expect(screen.getAllByRole('checkbox').map((c) => (c as HTMLInputElement).name)).toEqual(['show', 'show', 'show']);
    expect(box('Week')).toHaveClass('bit-segmented-control__input');
  });

  it('starts with nothing chosen and toggles on and off, emitting arrays in option order', async () => {
    const onValueChange = vi.fn();
    render(<SegmentedControl multiple legend="Show" options={OPTIONS} onValueChange={onValueChange} />);
    expect(screen.getAllByRole('checkbox').some((c) => (c as HTMLInputElement).checked)).toBe(false);
    await userEvent.click(box('Month'));
    await userEvent.click(box('Day'));
    expect(onValueChange).toHaveBeenLastCalledWith(['day', 'month']);
    await userEvent.click(box('Month'));
    expect(onValueChange).toHaveBeenLastCalledWith(['day']);
    await userEvent.click(box('Day'));
    expect(onValueChange).toHaveBeenLastCalledWith([]);
  });

  it('starts from defaultValue and never mutates it', async () => {
    const start = Object.freeze(['week']) as readonly string[];
    render(<SegmentedControl multiple legend="Show" options={OPTIONS} defaultValue={start} />);
    expect(box('Week')).toBeChecked();
    await userEvent.click(box('Day'));
    expect(box('Day')).toBeChecked();
    expect(start).toEqual(['week']);
  });

  it('follows a controlled value and ignores values that match no option', async () => {
    function Controlled() {
      const [value, setValue] = useState<string[]>(['nope', 'week']);
      return <SegmentedControl multiple legend="Show" options={OPTIONS} value={value} onValueChange={setValue} />;
    }
    render(<Controlled />);
    expect(screen.getAllByRole('checkbox').filter((c) => (c as HTMLInputElement).checked).map((c) => (c as HTMLInputElement).value)).toEqual(['week']);
    await userEvent.click(box('Day'));
    expect(box('Day')).toBeChecked();
    expect(box('Week')).toBeChecked();
  });

  it('a disabled option cannot be toggled; Space toggles a focused one', async () => {
    const options = [...OPTIONS.slice(0, 2), { value: 'month', label: 'Month', disabled: true }];
    render(<SegmentedControl multiple legend="Show" options={options} />);
    await userEvent.click(box('Month'));
    expect(box('Month')).not.toBeChecked();
    box('Week').focus();
    await userEvent.keyboard(' ');
    expect(box('Week')).toBeChecked();
  });

  it("switching multiple on a mounted, uncontrolled control resets to that mode's default", () => {
    const { rerender } = render(<SegmentedControl legend="Show" options={OPTIONS} />);
    expect(radio('Day')).toBeChecked();
    rerender(<SegmentedControl multiple legend="Show" options={OPTIONS} />);
    expect(screen.getAllByRole('checkbox').some((c) => (c as HTMLInputElement).checked)).toBe(false);
    rerender(<SegmentedControl legend="Show" options={OPTIONS} />);
    expect(radio('Day')).toBeChecked();
  });

  it('has no axe violations', async () => {
    const { container } = render(<SegmentedControl multiple legend="Show" options={OPTIONS} defaultValue={['day']} />);
    await expectNoA11yViolations(container);
  });

  it('types: a string value with multiple is an error, and an array without it is too', () => {
    // @ts-expect-error multiple takes string[]
    void (<SegmentedControl multiple legend="x" options={OPTIONS} value="day" />);
    // @ts-expect-error single takes string
    void (<SegmentedControl legend="x" options={OPTIONS} value={['day']} />);
  });
});
```

- [ ] **Step 2: Run them and see them fail**

Run `pnpm --filter @bit-ds/react exec vitest run src/components/SegmentedControl`. Expected: the new tests fail (no checkboxes, no `data-multiple`). `pnpm typecheck` flags the unused `@ts-expect-error`s.

- [ ] **Step 3: Implement**

Destructure the props into `multiple` plus the rest. Keep the own value tagged with its mode, so a mode switch resets it during render (React's derived-state pattern).
```tsx
type OwnValue = { multiple: boolean; value: string | readonly string[] | undefined };

const isMultiple = props.multiple === true;
const initial = (m: boolean): OwnValue['value'] =>
  m ? (Array.isArray(defaultValue) ? defaultValue : []) : typeof defaultValue === 'string' ? defaultValue : options[0]?.value;
const [own, setOwn] = useState<OwnValue>(() => ({ multiple: isMultiple, value: initial(isMultiple) }));
if (own.multiple !== isMultiple) setOwn({ multiple: isMultiple, value: initial(isMultiple) });
```
- **Single:** keep today's radios, `checked={option.value === chosen}` and `choose()` exactly.
- **Multiple:**
  - `chosen = value ?? own.value` as a `readonly string[]`.
  - Each checkbox has `checked={chosen.includes(option.value)}`.
  - On change: `const next = options.filter((o) => (o.value === toggled ? !chosen.includes(o.value) : chosen.includes(o.value))).map((o) => o.value);`
  - Set the own value when uncontrolled, then call `onValueChange(next)`.
- Render `type={isMultiple ? 'checkbox' : 'radio'}` and put `data-multiple={isMultiple ? '' : undefined}` on the fieldset.
- Update the component JSDoc so it says it picks one option, or several with `multiple`.

- [ ] **Step 4: Run the tests and see them pass**

Run the same vitest command, then `pnpm test:coverage`. Expected: everything passes at 100%. The existing single-select tests must pass without being edited.

- [ ] **Step 5: Run the done gate, then commit**
```bash
git add packages/react/src/components/SegmentedControl
git commit -m "feat(react): SegmentedControl multiple: checkboxes, string[] values, option-order emits"
```

---

### Task 2: On-theme scrollbars for CodeBlock and Table (core CSS)

**Files:**
- Modify: `packages/core/src/components/code-block.css` (after the `.bit-code__pre` rule) and `packages/core/src/components/table.css` (after `.bit-table`)
- Test: add `packages/core/src/__tests__/scrollbar.test.ts`, reading the CSS as text the same way the neighbouring tests do. Check `css.ts` for helpers.

**Interfaces:** none consumed. It produces CSS only.

- [ ] **Step 1: Write a failing test**

It must assert the following for `code-block.css`, inside `@media not (forced-colors: active)`:
- `.bit-code__pre::-webkit-scrollbar { height: 14px }`
- a track with `background: var(--bit-code-bg)`
- a thumb with `background: var(--bit-code-bg)`, `border: 3px solid transparent`, `background-clip: padding-box` and `box-shadow: inset 0 0 0 2px var(--bit-color-accent)`
- a thumb hover with `background: var(--bit-color-accent)`
- an `@supports not selector(::-webkit-scrollbar)` block with `scrollbar-color: var(--bit-color-accent) var(--bit-code-bg)` and `scrollbar-width: thin`

For `table.css`, the same shape with the track on `var(--bit-color-surface)` and the ring and hover on `var(--bit-color-line)`. Also assert that neither file uses a raw colour (`#` or `rgb(`) in these rules.

- [ ] **Step 2: Run it and see it fail**

Run `pnpm --filter @bit-ds/core exec vitest run src/__tests__/scrollbar.test.ts`. Expected: FAIL.

- [ ] **Step 3: Implement** (CodeBlock shown; Table mirrors it with its tokens)
```css
/* The scrollbar is on the panel's own dark: a code-bg track and a thumb outlined in the border's accent.
   The transparent border insets the outline, leaving an even strip of track between it and the panel edge. */
@media not (forced-colors: active) {
  .bit-code__pre::-webkit-scrollbar { height: 14px; }
  .bit-code__pre::-webkit-scrollbar-track { background: var(--bit-code-bg); }
  .bit-code__pre::-webkit-scrollbar-thumb {
    background: var(--bit-code-bg);
    background-clip: padding-box;
    border: 3px solid transparent;
    border-radius: var(--bit-radius-10px);
    box-shadow: inset 0 0 0 2px var(--bit-color-accent);
  }
  .bit-code__pre::-webkit-scrollbar-thumb:hover { background: var(--bit-color-accent); }
  @supports not selector(::-webkit-scrollbar) {
    .bit-code__pre { scrollbar-color: var(--bit-color-accent) var(--bit-code-bg); scrollbar-width: thin; }
  }
}
```

- [ ] **Step 4: Run it and see it pass.** Also run `pnpm build && pnpm verify` and the full core suite. The type-floor and contrast tests must stay green.
- [ ] **Step 5: Look at it in a real browser**

Start the gallery with `pnpm --filter @bit-ds/gallery dev`. Build a page or use the SegmentedControl code panel with a long line. Screenshot the bottom edge in light and dark using gstack `$B`. Scrollbars only render headed, so either:
- launch headed with `$B` (see `~/.claude/skills/gstack/browse/sections/command-list.md`), or
- verify through `getComputedStyle` on the pseudo-element, and report that the browser check needs the controller.

- [ ] **Step 6: Commit**
```bash
git add packages/core/src/components/code-block.css packages/core/src/components/table.css packages/core/src/__tests__/scrollbar.test.ts
git commit -m "feat(core): on-theme scrollbars for CodeBlock and Table"
```

---

### Task 3: Code examples hoist long values into consts (gallery code printer)

**Files:**
- Modify: `apps/gallery/src/code/toJsx.ts` (`toJsx`, `printFixed`, `printProp` and `literal`) and `apps/gallery/src/code/fullFile.ts` (place the consts between the import and `export function`)
- Test: `apps/gallery/src/code/toJsx.test.ts` and `fullFile.test.ts`. Update any gallery test that snapshots SegmentedControl, CodeBlock, Select or Table code: grep for `options={[` and `code="`.

**Interfaces:**
- Consumes: `Manifest.fixedProps`, plus `Manifest.deriveProps` once Task 5 lands. Write a single helper now that Task 5 extends: `function staticProps(manifest: Manifest, state: ControlState): Record<string, LiteralValue>`, in `apps/gallery/src/engine/staticProps.ts`, returning `{ ...manifest.fixedProps }`. Task 5 adds the `deriveProps` merge.
- Produces: `toJsx(manifest, state, options)` still returns one string, now laid out as the import line, a blank line, the const declarations if any, a blank line, then the element. `fullFile(code)` splits it into import, consts and element.

- [ ] **Step 1: Write failing tests** in `toJsx.test.ts`
  - The SegmentedControl manifest prints `const options = [` with one `{ value: 'day', label: 'Day' },` line per option, then `];`, then `<SegmentedControl legend="Range" options={options} />`.
  - A CodeBlock state whose `code` is 41 characters prints `const code = '…';` and `code={code}`. At exactly 40 characters it stays inline (`code="…"`).
  - A string with a `'` and a `\n` prints as a valid literal. Assert with `new Function('return ' + literalPart)`, or by matching escaped output.
  - A hoisted prop named `aria-label` becomes `const ariaLabel = …` and `aria-label={ariaLabel}`.
  - Two hoisted props never share a name.
  - Children text is never hoisted.
  - Full file: the consts sit after the import and before `export function Example()`. Snippet mode puts them above the element.
- [ ] **Step 2: Run them and see them fail.** Run `pnpm --filter @bit-ds/gallery exec vitest run src/code`.
- [ ] **Step 3: Implement**
  - Collect the hoistable props: any array or object `LiteralValue`, or any string from a `text` control or a fixed prop longer than 40 characters.
  - Print each as `const <ident> = <multi-line literal>;`. Arrays print one item per line, indented two spaces. Objects keep the existing `{ key: 'v' }` form on one line inside arrays.
  - Name each const from the prop: camelCase anything that isn't an identifier, and append a number on a collision.
  - The prop becomes `name={ident}`.
  - Keep `printProp`'s default and sentinel rules.
- [ ] **Step 4: Run them and see them pass,** then run the whole gallery suite.
- [ ] **Step 5: Check the full-file smoke test.** `scripts/smoke-consumer.mjs` writes the playground's `fullFile` output to `App.jsx` and builds it. Run `pnpm smoke:full`; the hoisted output must still build.
- [ ] **Step 6: Commit**
```bash
git add apps/gallery/src/code apps/gallery/src/engine/staticProps.ts
git commit -m "feat(gallery): code examples hoist arrays, objects and long strings into consts"
```

---

### Task 4: One-card playground (B3) on every component page

**Files:**
- Modify:
  - `apps/gallery/src/pages/component/Playground.tsx`: wrap the two halves in `<Card className="gallery-playground__top">`
  - `apps/gallery/src/engine/Preview.tsx`: no `Card` of its own; it renders `section.gallery-preview` with the bar and the stage
  - `apps/gallery/src/engine/ControlsPanel.tsx`: the head becomes a bar matching `.gallery-preview__bar`. The title is "Controls" in the same pixel face as the preview title. Keep the `h3#controls-heading` and `aria-labelledby`.
  - `apps/gallery/src/gallery.css`
  - `apps/gallery/src/gallery-css.exceptions.ts`
- Test: `Preview.test.tsx`, `ControlsPanel.test.tsx`, `gallery-css.test.ts`, the ComponentPage tests and the e2e axe run.

**Interfaces:** none across tasks. The DOM classes `gallery-preview`, `gallery-preview__bar`, `gallery-preview__stage`, `gallery-controls` and `gallery-controls__grid` stay.

- [ ] **Step 1: Write failing tests**
  - On a component page, one `.bit-card.gallery-playground__top` holds both `.gallery-preview` and `.gallery-controls`. `.gallery-preview` contains no `.bit-card`.
  - `.gallery-controls` starts with a bar (`.gallery-controls__bar`) that holds the h3 "Controls" and Reset.
  - In `gallery.css`:
    - `.gallery-playground__top` is a two-column grid with `align-items: stretch`;
    - `.gallery-preview` is a column flex with a `flex: 1` stage;
    - `.gallery-controls` has `border-inline-start` as its divider;
    - under 720px the grid is one column and the divider moves to `border-top`.
  - The bars share a height (a `min-height` both bars read, e.g. `--_gallery-bar-height`).
  - Every new paint declaration is listed in the exceptions file.
  - Review Focus 5: a manifest with only a children control still renders the bar and grid with no empty gap. Use a minimal test manifest.
- [ ] **Step 2: Run them and see them fail.**
- [ ] **Step 3: Implement.** The card's padding is zero on this card only. Use CardBody or a class, whichever the Card API allows; check `packages/react/src/components/Card`. The controls bar reuses the preview bar's paint rules by sharing a class or a selector list, not by duplicating colours.
- [ ] **Step 4: Run them and see them pass.** Run the gallery tests and `pnpm e2e`.
- [ ] **Step 5: Screenshot.** Take the Button and SegmentedControl pages at 1280px and 390px, light and dark, with gstack `$B`, and include the paths in the report.
- [ ] **Step 6: Commit**
```bash
git add apps/gallery/src
git commit -m "feat(gallery): preview and controls share one card (B3)"
```

---

### Task 5: Virtual controls, `deriveProps`, and the SegmentedControl page (after Tasks 1 and 3 merge)

**Files:**
- Modify:
  - `apps/gallery/src/manifests/types.ts`: add `virtual?: boolean` on `SelectControl`; add `deriveProps?: (state: ControlState) => Readonly<Record<string, LiteralValue>>` on `Manifest`
  - `apps/gallery/src/engine/staticProps.ts`: merge `deriveProps({ ...defaultState(manifest), ...state })` after `fixedProps`
  - `apps/gallery/src/engine/buildProps.ts`: start from `staticProps`, and skip controls where `virtual` is true
  - `apps/gallery/src/code/toJsx.ts`: virtual controls never print; the static props come from `staticProps`
  - `apps/gallery/src/manifests/segmentedControl.ts`
- Test: `buildProps.test.ts`, `toJsx.test.ts`, `manifests.test.ts` (or the SegmentedControl page tests), `ComponentPage` tests

**Interfaces:**
- Consumes: Task 1's `multiple` prop (from the built package; run `pnpm build`) and Task 3's `staticProps()`.
- Produces: the manifest API (`virtual`, `deriveProps`) for any future page.

- [ ] **Step 1: Write failing tests**
  - `buildProps` on SegmentedControl with `{ segments: '5' }` gives `options` with values `['day','week','month','quarter','year']` and no `segments` key. `'2'` gives two.
  - toJsx prints no `segments`, and prints the hoisted `const options` with exactly N items.
  - The `multiple` boolean prints as `multiple` when on and is absent when off.
  - The "Multi-select" preset (`{ multiple: true, segments: '4' }`) renders four checkboxes.
  - The Props table has a `multiple` row of type `boolean`, default `false`, with a description.
  - The playground controls show a `segments` select (2–5) and a `multiple` switch.
- [ ] **Step 2: Run them and see them fail.**
- [ ] **Step 3: Implement.** In the manifest:
  - `controls`: add `{ kind: 'select', prop: 'segments', label: 'segments', values: ['2','3','4','5'], default: '3', virtual: true }` and `{ kind: 'boolean', prop: 'multiple', default: false }`.
  - Replace `fixedProps.options` with `deriveProps: (state) => ({ options: SEGMENTS.slice(0, Number(state.segments)) })`, where `SEGMENTS` lists day, week, month, quarter and year.
  - `presets`: add `{ label: 'Multi-select', state: { multiple: true, segments: '4' } }`.
  - `description`: "Joined segments that pick one option, or several with multiple."
  - Badges: add 'Native checkboxes (multiple)'.
  - Usage:
    - do: 'Use multiple for filters where any mix of options, or none, is valid.'
    - dont: 'Use multiple when exactly one answer is required. Leave it off.'
  - a11y: 'With multiple, each segment is a native checkbox: Tab moves between segments and Space toggles one.'
  - Props table: update `value`, `defaultValue` and `onValueChange` to show both shapes, and add the `multiple` row.
- [ ] **Step 4: Run them and see them pass,** then run the whole gallery suite and `pnpm e2e`.
- [ ] **Step 5: Commit**
```bash
git add apps/gallery/src
git commit -m "feat(gallery): segments and multiple controls on the SegmentedControl page"
```

---

### Task 6 (controller): Integrate, changelog, verify, PR, re-tag
- [ ] Merge Tasks 1–4 (wave 1, parallel), then run Task 5 on the merged branch.
- [ ] Add to the CHANGELOG 0.1.3 entry:
  - **Added:** SegmentedControl `multiple`.
  - **Changed:** CodeBlock and Table scrollbars follow the theme.
- [ ] Run the full done gate, plus `pnpm smoke:full`, the gallery build and `pnpm e2e`.
- [ ] Run one review pass.
- [ ] Take headed screenshots for the owner: the scrollbar gap, the B3 layout, multi-select, and the hoisted code.
- [ ] Open the PR. After the owner says go: merge, `git tag v0.1.3`, push the tag; the owner approves publish.

---

### Task 7: Import line height matches its Copy button (owner, 2026-10-06; gallery only)

The owner's words: "The import statement code that is at the top of each component page, I want the height of that background to be the same height as the copy button next to it. Don't change the font or anything just the height of the background. Should be for all import statements in the component section. This should not apply to the Code component itself."

**Files:**
- Modify: `apps/gallery/src/pages/component/ComponentHeader.tsx` (the row holding `<Code>{line}</Code>` and `<CopyButton>`) and `apps/gallery/src/gallery.css`
- Test: the ComponentHeader / ComponentPage tests and `gallery-css.test.ts`

**Interfaces:** none.

- [ ] **Step 1: Write failing tests**
  - The import row stretches its children: the Stack takes `align="stretch"` if Stack supports it; otherwise use a gallery layout class.
  - The import `Code` has the class `gallery-import-code`.
  - `gallery.css` has `.gallery-import-code { display: inline-flex; align-items: center; }`. Both are layout properties, so the guard needs no exception.
  - No other `.bit-code` rule changes, the Code component's CSS in packages/core is untouched, and the font size and padding stay the same.
- [ ] **Step 2: Run them and see them fail.**
- [ ] **Step 3: Implement.** Stretch the row so the chip's background box takes the Copy button's height, and centre the text vertically inside it. Only on the component pages' import line: Code elsewhere (body text, captions, tables) must not change.
- [ ] **Step 4: Verify in the browser.** Measure on the Button and SegmentedControl pages with gstack `$B` that `getBoundingClientRect().height` of the chip equals the Copy button's, at 1280px and 390px, light and dark. Screenshot it.
- [ ] **Step 5: Run the done gate and commit:** `feat(gallery): component import line matches its Copy button's height`.

---

### Task 8: Scrollbars match their container, with a solid thumb in the CodeBlock border colour and no hover change (owner follow-ups; spec §5a and §5b, where §5b wins on the thumb)

**Files:**
- Modify:
  - `packages/core/src/components/table.css` and `packages/core/src/__tests__/scrollbar.test.ts`
  - `apps/gallery/src/gallery.css`: the presets row (`.gallery-presets`, `overflow-x: auto`) and the sidebar (the `overflow-y: auto` rule)
  - `apps/gallery/src/gallery-css.exceptions.ts`
  - `apps/gallery/src/gallery-css.test.ts`
  - `apps/gallery/e2e/scrollbar.spec.ts`

**Interfaces:** none. Runs after Task 4 merges, because both touch the presets and bar area of `gallery.css`.

- [ ] **Step 1: Write failing tests**
  - Core, CodeBlock and Table cases in scrollbar.test.ts:
    - the thumb is `background: var(--bit-color-accent)` with `background-clip: padding-box` and `border: 3px solid transparent`;
    - there is no `box-shadow` ring and no `:hover` rule;
    - the tracks are unchanged (`--bit-code-bg` and `--bit-color-surface`);
    - the Table's Firefox fallback is `var(--bit-color-accent) var(--bit-color-surface)`.
  - Assert explicitly that neither file contains `::-webkit-scrollbar-thumb:hover`.
  - Gallery CSS test: `.gallery-presets` and the sidebar scroll rule get:
    - `::-webkit-scrollbar` rules: height 14px, plus width 14px for the sidebar;
    - a `transparent` track;
    - a thumb with `background: var(--bit-color-accent); background-clip: padding-box; border: 3px solid transparent; border-radius: var(--bit-radius-10px)`;
    - no hover rule;
    - the `@supports selector(::-webkit-scrollbar)` reset to `auto`, inside `@media not (forced-colors: active)`.
  - The exceptions file lists every new paint declaration with a `frame:` reason.
  - e2e: the presets row's computed `scrollbar-color` is `auto`.
- [ ] **Step 2: Run them and see them fail.**
- [ ] **Step 3: Implement.** Match the comment style of the existing rules. To avoid repeating the gallery rule block, use one selector list for both scroll areas where the properties are identical.
- [ ] **Step 4: Run the done gate,** including `pnpm e2e`.
- [ ] **Step 5: Commit:** `feat: scrollbars take their container's background, outlined in the CodeBlock border colour`.
