# PR2 Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship nine new public components in `@bit-ds/react` (Field, Input, Select, Switch, Link, Code, CodeBlock, SegmentedControl, Table with four parts), each with core CSS, tests and a gallery page, and move the gallery's code panels onto CodeBlock.

**Architecture:**
- **Core (`@bit-ds/core`):** five new tier-2 color tokens and one CSS file per component. The two visually hidden inputs (Switch, SegmentedControl) get their focus ring from new `system/reset.css` rules on the part drawn beside them, so component CSS still never sets `outline`.
- **React (`@bit-ds/react`):** native elements underneath every component. Field shares ids through a private context (no `cloneElement`). Link's `asChild` uses a new internal `Slot`. CodeBlock owns a small tokenizer (moved from the gallery) and a copy button.
- **Gallery:** one manifest per component. The engine learns three small things: childless and nested `ChildSpec`s, controls that always print, and fixed props. ComponentPage and Home render `CodeBlock` instead of `pre.gallery-pre`.

**Tech Stack:** pnpm 9.15.9 workspaces, TypeScript 5.9 strict, React 19, Vitest 4 (jsdom for react and gallery, node for core), Testing Library and user-event 14, axe-core 4.13, tsup and esbuild, Vite gallery, react-router-dom 7.

**Spec:** `docs/superpowers/specs/2026-10-03-pr2-components-design.md`. Visual reference: `~/.gstack/projects/doosemavis-bit-design-system/designs/pr2-20261003/board.html` and `board-2.html`.

Every code block in this plan was run in a scratch copy of the repo at `c2c09d8`. Each task's gates passed there, in order, before the plan was written.

## Spec deviations (owner: confirm on the sign-off board)

The spec says: "If a listed value fails, the implementer adjusts the dark value until it passes, records it, and the owner sees it on the sign-off board." Two values fail. The plan uses the nearest passing value in each case.

- **D1. Light `--bit-color-danger-text` is `#D61A1A`, not `var(--bit-color-danger)` (`#D91A1A`).**
  - `#D91A1A` on the light page (`#EEEFE9`) is **4.41:1**, under the spec's own 4.5:1 rule for danger-text.
  - `#D61A1A` is the nearest red that passes: **4.51:1** on the page and 5.22:1 on white.
  - `--bit-color-danger` itself is unchanged (it is frozen in `light-frozen.test.ts`), so borders and fills look the same. Only Field's error text and required star are 3/255 darker.
- **D2. Dark `--bit-color-link-visited` is `#9D82E7`, not `#9B7FE6`.**
  - `#9B7FE6` passes the page and surface (5.69:1 and 5.05:1). It fails on the hover highlight: a hovered primary Link sits on `--bit-color-primary-soft` (`#2E2352` in dark), and there it is **4.45:1**.
  - The spec doesn't list that check. It is Review Focus item 5, because a hovered visited link is a state people see.
  - `#9D82E7` is the nearest lighter violet that passes: **4.59:1** on the highlight, 5.87:1 on the page, 5.21:1 on the surface.

## Contrast, computed for this plan

WCAG 2.x ratios, from the actual `power-up.css` values. In light: bg `#EEEFE9`, surface `#FFFFFF`, code-bg `#151515`, primary-soft `#EBE1FD`. In dark: bg `#15151C`, surface `#20202A`, code-bg `#0B0B10`, primary-soft `#2E2352`. Success (`#1FA34A`) and ink (`#151515`) are the same in both modes. Task 1's tests assert every row.

| Pair | Minimum | Light | Dark |
|---|---|---|---|
| accent vs bg / surface / code-bg | 3:1 | `#7C3AED`: 4.93 / 5.70 / 3.20 | `#FFC800`: 11.69 / 10.38 / 12.63 |
| focus ring vs code-bg | 3:1 | `#7C3AED`: 3.20 | `#FFC800`: 12.63 |
| ink vs success (Switch on edge) | 3:1 | 5.56 | 5.56 |
| link vs bg / surface / primary-soft | 4.5:1 | `#7C3AED`: 4.93 / 5.70 / 4.54 | `#B79BFF`: 7.91 / 7.03 / 6.19 |
| link-visited vs bg / surface / primary-soft | 4.5:1 | `#5B2BB5`: 7.39 / 8.54 / 6.80 | `#9D82E7` (D2): 5.87 / 5.21 / 4.59 |
| danger-text vs bg / surface | 4.5:1 | `#D61A1A` (D1): 4.51 / 5.22 | `#FF8A8A`: 8.01 / 7.11 |
| Copy label: ink vs `--bit-code-text` | 4.5:1 | 15.31 | 15.31 |

The spec's values for comparison: light danger-text `#D91A1A` gives 4.41 / 5.11, and dark link-visited `#9B7FE6` gives 5.69 / 5.05 / 4.45.

## Decisions this plan makes that the spec left open (owner: confirm in review)

1. **Export lists grow task by task.** Each component task adds its own names to:
   - the component list in `packages/react/src/index.test.tsx`
   - `EXPECTED` in `packages/react/scripts/verify-dist.mjs` and in `scripts/smoke-consumer.mjs`
   - verify-dist's CSS needles and type names

   So no gate is red between tasks. The lists reach 25 in Task 9.
2. **Visually hidden:** the repo has no pattern yet. Each component that hides an element declares the spec's nine declarations on its own selector. A test helper, `VISUALLY_HIDDEN` in `packages/core/src/__tests__/css.ts`, pins them.
3. **Ring rules land with their component.** The Switch rule ships in Task 4 and the SegmentedControl rule in Task 8, each with its test, so the reviewer sees the ring with the part it draws on. The same goes for every component-specific selector in a system file.
4. **CodeBlock's `pre` ring is pulled inside the panel.** `.bit-code__block` has `overflow: hidden` (spec), which would clip a ring drawn outside the `pre`. `reset.css` gets `.bit-code__pre:focus-visible { outline-offset: calc(-1 * var(--bit-focus-ring-width) - 2px); }`, so the ring sits on code-bg. That is exactly the pairing the spec's ring-vs-code-bg contrast check covers.
5. **The chosen SegmentedControl segment sets `--_bit-focus-ring: var(--_bit-color-contrast)`.** Native radios put focus on the chosen option, which is filled with the color. Without this, the light violet ring would sit on a violet fill. This is the mechanism `reset.css` already documents for colored containers, the same one solid Alert uses.
6. **Ink exceptions:** the "never ink" test becomes an allowlist, `INK_EXCEPTIONS`, keyed by file and exact selector.
   - `switch.css`: the two on-state blocks (decision 2 in the spec).
   - `code-block.css`: `.bit-code__copy` (the spec's "2px ink border").
7. **Field's label follows the control's own id.** If the Input or Select inside a Field brings its own `id`, the spec's "own props win" would leave `for` pointing at Field's generated id. Field reads `children.props.id` (reading props, not cloning), so the label stays tied to the control.
8. **Sizes and fonts the spec left to the board:**
   - Field gap is `--bit-space-8px` (the board drew 6px; the spec allows 4px or 8px).
   - Code and CodeBlock set `font-weight: 400`, because JetBrains Mono ships only 400 and 700, and the page's 600 would snap to bold. The gallery's old `.gallery-pre` did the same.
   - The Copy button is `--bit-code-text` with ink text and a 13px bold body font. The bar is padded 8px, so the button's ring isn't clipped.
9. **Omit `color` everywhere it isn't an axis:** Code, CodeBlock and the Table parts `Omit<…, 'color'>` and apply `dropLegacyColor`, like Card. The spec's interfaces for Code and Table don't omit it, but its shared rules say "like the existing components."
10. **File names:** CodeBlock's CSS is `components/code-block.css` (kebab of the component name, per spec §1), and Code's is `components/code.css`.
11. **Gallery engine additions:**
    - `ChildSpec.children` becomes optional (Field's Input self-closes) and nestable (Table).
    - Text and select controls get `alwaysPrint`, so required props print at their default: Field `label`, CodeBlock `code` and `language`, SegmentedControl `legend`, Link `href`, Input `placeholder`.
    - Manifests get `fixedProps` for values a control can't edit (SegmentedControl `options`).
    - The ChildSpec allowlist is `HTML_CHILDREN` in `registry.ts`.
12. **"gallery.css no longer sets a mono font"** is read as: no hard-coded mono stack. `.gallery-pre` goes, and the two remaining `ui-monospace, …` stacks read `var(--bit-font-mono)`. This is the PR1 checklist item.
13. **Button keeps `@radix-ui/react-slot`.** The spec's new `Slot` serves Link. Moving Button onto it is out of scope.
14. **CodeBlock with an unknown `language`** (an untyped caller) renders the code as plain text instead of crashing. `CodeLanguage` is exported as a type.
15. **Task 7 (the gallery's code panels) stays separate from Task 6 (CodeBlock).** It touches another package and its own tests. A reviewer can approve the component and still reject the gallery migration.

**Owner notes, no change made:**
- The spec gives CodeBlock's `pre` an `aria-label` and no role. axe 4.13 reports `aria-prohibited-attr` for it as "needs review", not a violation, so the axe tests pass. Some screen readers ignore a label on an element with no role. Adding `role="region"` fixes that in one attribute if you want it.
- The failed Copy state uses `--bit-color-danger-soft` (spec). In dark that's `#40191B`, on the `#0B0B10` panel, so the button reads by its text more than its shape. The board drew light pink. Judge it on the sign-off board.

## Global Constraints

- **Branch:** `feat/components`, spec commit `c2c09d8`. One PR to `main`.
- **Gallery builds first:** the gallery uses `@bit-ds/react` through its built `exports` map. Run `pnpm build` before gallery typecheck and tests.
- **New tokens** (spec §2, with D1 and D2):

  | Token | Kind | Light | Dark |
  |---|---|---|---|
  | `--bit-color-accent` | mode | `var(--bit-palette-violet)` (`#7C3AED`) | `var(--bit-palette-yellow)` (`#FFC800`) |
  | `--bit-color-link` | mode | `var(--bit-palette-violet)` (`#7C3AED`) | `#B79BFF` |
  | `--bit-color-link-visited` | mode | `#5B2BB5` | `#9D82E7` (D2) |
  | `--bit-color-danger-text` | mode | `#D61A1A` (D1) | `#FF8A8A` |
  | `--bit-color-knob` | shared | `var(--bit-palette-white)` | (same) |

  - `SEMANTIC_TOKENS` goes from 87 to **92**.
  - `MODE_TOKENS` goes from 18 to **22** (accent, link, link-visited, danger-text). The dark block declares each one.
  - `--bit-color-knob` is declared in the light block only.
  - Every literal above is used once, so none becomes a palette entry.
- **Naming rule** (`packages/react/src/index.test.tsx`):
  - The root is `bit-<kebab(Name)>`.
  - A compound child of a parent export is `bit-<parent>__<rest>`. So TableHead is `bit-table__head` and CodeBlock is `bit-code__block`.
  - Axes emit `bit-{value}` classes. States are attributes, never classes.
- **Where the ref, `className` and rest props land:**

  | Component | Root element | ref | `className` | rest |
  |---|---|---|---|---|
  | Field | `div.bit-field` | div | div | div |
  | Input | `input.bit-input` | input | input | input |
  | Select | `span.bit-select` | `select` | span | `select` |
  | Switch | `label.bit-switch` | `input` | label | `input` |
  | Link | `a.bit-link` (or the `asChild` child) | a | a | a |
  | Code | `code.bit-code` | code | code | code |
  | CodeBlock | `div.bit-code__block` | div | div | div |
  | SegmentedControl | `fieldset.bit-segmented-control` | fieldset | fieldset | fieldset |
  | Table | `div.bit-table` | `table` | div | `table` |
  | TableHead / TableBody / TableRow / TableCell | `thead` / `tbody` / `tr` / `th` or `td` | itself | itself | itself |

  `className` is always appended last. `dropLegacyColor` is applied to rest wherever `color` isn't an own prop.
- **No `outline` in component CSS:** `/(^|[;{])\s*outline(-(color|style|width))?\s*:/m` must not match any `components/*.css`. `outline-offset` is allowed. The ring is drawn only by `system/reset.css`.
- **`reset.css` ring rules (new):**
  - `.bit-switch__input:focus-visible + .bit-switch__track { outline: var(--bit-focus-ring-width) solid var(--_bit-focus-ring, var(--bit-focus-ring-color)); outline-offset: var(--bit-focus-ring-offset); }`
  - `.bit-segmented-control__input:focus-visible + .bit-segmented-control__label { outline: var(--bit-focus-ring-width) solid var(--_bit-focus-ring, var(--bit-focus-ring-color)); outline-offset: calc(-1 * var(--bit-focus-ring-width) - 2px); }`
  - `.bit-code__pre:focus-visible { outline-offset: calc(-1 * var(--bit-focus-ring-width) - 2px); }` (decision 4)
- **Visually hidden:** `position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0;`. The input stays focusable.
- **Disabled:** `opacity: 0.5; cursor: not-allowed`.
- **Borders:** `var(--bit-border-width) solid var(--bit-color-line)` unless the spec says otherwise. Ink is read only by the selectors in `INK_EXCEPTIONS`.
- **No Storybook stories** for new components. `pnpm storybook:build` must keep passing.
- **Commits:** conventional (`feat(core):`, `feat(react):`, `feat(gallery):`, `docs:`), each ending with the single trailer line `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Gates** (every task ends with all of them green):
  - `pnpm build`, `pnpm verify`, `pnpm typecheck`, `pnpm lint`
  - `pnpm test` (core, react, gallery)
  - `pnpm test:coverage`
  - `pnpm smoke`, `pnpm storybook:build`
- **React coverage is 100%.** The config's threshold is 80%, so read the summary: Statements, Branches, Functions and Lines must each print `100%`.
- **Code style:** small focused files, comments only where the code doesn't say it, no mutation of inputs. Local accumulators inside one function (the tokenizer's token list) are fine.

## Review Focus

1. **A Field whose control brings its own `id`** (`<Field label="Email"><Input id="email" /></Field>`): the label must still name the input. Pinned in Task 2, "a control with its own id keeps its label: the label points at that id".
2. **Leaving a page while Copy is still writing to the clipboard** (route change, slow permission prompt): no timer outlives the CodeBlock and nothing throws. Pinned in Task 6, "unmounting while the clipboard is still busy starts no timer and does not throw".
3. **Tabbing into a SegmentedControl in light mode:** focus lands on the chosen option, which is filled violet, so the ring must not be violet too. Pinned in Task 8, "a ring on the chosen fill takes the contrast color, so violet never sits on violet".
4. **Tabbing into a CodeBlock to scroll wide code:** the ring must show in full, not be cut off by the panel's `overflow: hidden`. Pinned in Task 6, "pulls the pre's ring 2px inside it, so the panel's overflow: hidden cannot clip it".
5. **Hovering a link you've already visited, in dark mode:** the text sits on the primary-soft highlight and must stay readable. Pinned in Task 1, "PR2: --bit-color-link-visited is readable on the page, surfaces and the hover highlight". This test is why D2 exists.

---

## File structure

**Core** (`packages/core/src/`):
- `tokens.ts`: five color roles, `MODE_TOKENS` +4
- `themes/power-up.css`: the new tokens in both blocks
- `system/reset.css`: three ring rules
- `index.css`: ten new imports
- `components/`: `field.css`, `input.css`, `select.css`, `switch.css`, `link.css`, `code.css`, `code-block.css`, `segmented-control.css`, `table.css`
- `__tests__/css.ts`: `block`, `decl`, `withoutBlocks`, `VISUALLY_HIDDEN`, `OUTLINE_DECLARATION`
- `__tests__/components/<kebab>.test.ts`: one per new CSS file

**React** (`packages/react/src/`):
- `system/Slot.tsx`: internal
- `components/Field/`: `Field.tsx`, `FieldContext.ts` (private context and `useFieldControl`)
- `components/Input/`, `Select/`, `Switch/`, `Link/`, `Code/`: one component each
- `components/CodeBlock/`: `CodeBlock.tsx`, `CopyButton.tsx` (internal), `tokenize.ts` (internal)
- `components/SegmentedControl/`
- `components/Table/`: Table and its four parts, plus the private section context
- `index.ts`, `index.test.tsx`
- `../scripts/verify-dist.mjs`

**Gallery** (`apps/gallery/src/`):
- `manifests/`: nine manifests, plus `types.ts`, `registry.ts`, `index.ts` and `manifests.test.ts`
- `code/toJsx.ts` and `engine/buildProps.ts`, `engine/renderManifest.ts`, with their tests
- `pages/ComponentPage.tsx`, `pages/HomePage.tsx`
- `gallery.css` and `gallery-css.test.ts`
- `routes.test.tsx`, `shell/Shell.test.tsx`, `shell/Sidebar.test.tsx`
- `code/highlight.ts` and `highlight.test.ts` are deleted (moved into CodeBlock)

**Root:** `scripts/smoke-consumer.mjs`, `README.md`, `CONTRIBUTING.md`.

### Task 1: Tokens, CSS test helpers, outline and ink guards, and Slot

**Files:**
- Modify: `packages/core/src/tokens.ts:30-32` (add the PR2 roles after `colorRoleTokens`), `:84-95` (`SEMANTIC_TOKENS`), `:101-117` (`MODE_TOKENS`)
- Modify: `packages/core/src/themes/power-up.css:63` (light block, after `--bit-color-shadow`), `:188` (dark block, after `--bit-focus-ring-offset`)
- Modify: `packages/core/src/__tests__/css.ts` (append helpers), `css.test.ts`, `system.test.ts:1-16, 278-290`, `tokens.test.ts:2, 12-14, 53`, `contrast.test.ts:56-59, 75-76` and the end of the file
- Create: `packages/react/src/system/Slot.tsx`, `packages/react/src/system/Slot.test.tsx`

**Interfaces:**
- Produces, for every later core test file (`packages/core/src/__tests__/css.ts`):
  - `block(css: string, selector: string): string | null`, the body of the first `selector { … }`
  - `decl(body: string, prop: string): string | null`
  - `withoutBlocks(css: string, selectors: readonly string[]): string`
  - `VISUALLY_HIDDEN: readonly string[]` (the nine declarations)
  - `OUTLINE_DECLARATION: RegExp`
- Produces, in `packages/core/src/__tests__/system.test.ts`: `INK_EXCEPTIONS: Readonly<Record<string, readonly string[]>>`, empty for now. Tasks 4 and 6 add entries.
- Produces the tokens `--bit-color-accent`, `--bit-color-link`, `--bit-color-link-visited`, `--bit-color-danger-text` and `--bit-color-knob`.
- Produces, for Task 5 (`packages/react/src/system/Slot.tsx`):
  - `Slot`, a `forwardRef<HTMLElement, SlotProps>`, where `SlotProps extends HTMLAttributes<HTMLElement> { children?: ReactNode }`
  - `mergeProps(slot, child)` and `composeRefs(...refs)`
  - It throws `Error('[bit] Link asChild needs exactly one child element.')`.
  - Internal: never exported from `index.ts`.

- [ ] **Step 1: Add the shared CSS test helpers**

Append to `packages/core/src/__tests__/css.ts`:

```ts

/** Return the body of the first `selector { ... }` block, or null. */
export function block(css: string, selector: string): string | null {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`).exec(css);
  return m ? m[1]! : null;
}

/** Return the value of `prop` in a block body (not a prefixed or longer property), or null. */
export function decl(body: string, prop: string): string | null {
  const m = new RegExp(`(?<![-\\w])${prop}\\s*:\\s*([^;]+);`).exec(body);
  return m ? m[1]!.trim() : null;
}

/** The CSS with each listed `selector { ... }` block removed. Selectors must match the file's text exactly. */
export function withoutBlocks(css: string, selectors: readonly string[]): string {
  return selectors.reduce((rest, selector) => {
    const body = block(rest, selector);
    return body === null ? rest : rest.replace(`${selector} {${body}}`, '');
  }, css);
}

/**
 * The visually hidden pattern (PR2 spec §1): gone from sight and layout, still read and focusable.
 * Every component that hides a native input or a status line declares exactly these.
 */
export const VISUALLY_HIDDEN: readonly string[] = [
  'position: absolute;',
  'width: 1px;',
  'height: 1px;',
  'margin: -1px;',
  'padding: 0;',
  'overflow: hidden;',
  'clip-path: inset(50%);',
  'white-space: nowrap;',
  'border: 0;',
];

/** Matches any outline declaration, longhands included (outline-offset is allowed). */
export const OUTLINE_DECLARATION = /(^|[;{])\s*outline(-(color|style|width))?\s*:/m;
```

In `packages/core/src/__tests__/css.test.ts`, change the import to `import { block, withoutBlocks, themeModes } from './css';` and append:

```ts

describe('withoutBlocks', () => {
  it('removes exactly the named blocks and leaves the rest', () => {
    const css = '.a { color: red; }\n.b { color: blue; }\n';
    expect(withoutBlocks(css, ['.a'])).toBe('\n.b { color: blue; }\n');
    expect(block(withoutBlocks(css, ['.a']), '.b')).toBe(' color: blue; ');
  });

  it('leaves the CSS alone when a selector is not there, so a renamed exception fails loudly', () => {
    expect(withoutBlocks('.a { color: red; }', ['.missing'])).toBe('.a { color: red; }');
  });
});
```

- [ ] **Step 2: Harden the outline guard and turn the ink guard into an allowlist**

In `packages/core/src/__tests__/system.test.ts`, replace lines 1–16 (the imports and the local `block` and `decl` functions) with:

```ts
import { describe, it, expect } from 'vitest';
import { SEMANTIC_TOKENS, SIZES, COLORS } from '../tokens';
import { OUTLINE_DECLARATION, block, decl, listCss, readCss, resolveVar, themeModes, withoutBlocks } from './css';

/**
 * The only places a component may read --bit-color-ink, by file and exact selector. Everything else
 * draws lines with --bit-color-line so they lift in dark mode. Each entry is an owner decision.
 */
const INK_EXCEPTIONS: Readonly<Record<string, readonly string[]>> = {};
```

Replace the `'%s never sets outline, so nothing can override the ring'` test with:

```ts
  it.each(listCss('components'))('%s never sets outline or its longhands, so nothing can override the ring', (file) => {
    expect(readCss(`components/${file}`)).not.toMatch(OUTLINE_DECLARATION);
  });

  it('the outline guard catches the shorthand and every longhand, and allows outline-offset', () => {
    for (const css of ['a {\n  outline: none;\n}', 'a { outline-color: red; }', 'a{outline-style:none}', 'a { color: red; outline-width: 0; }']) {
      expect(css).toMatch(OUTLINE_DECLARATION);
    }
    for (const css of ['a { outline-offset: 2px; }', '.bit-outline { color: red; }', '.bit-button.bit-outline:hover { color: red; }']) {
      expect(css).not.toMatch(OUTLINE_DECLARATION);
    }
  });
```

Replace the `'%s draws lines with --bit-color-line, never ink'` test with:

```ts
  it.each(listCss('components'))('%s draws lines with --bit-color-line; ink only where the owner chose it', (file) => {
    const css = withoutBlocks(readCss(`components/${file}`), INK_EXCEPTIONS[file] ?? []);
    expect(css).not.toContain('var(--bit-color-ink)');
  });
```

- [ ] **Step 3: Run the core tests (the guards pass on today's CSS)**

Run: `pnpm --filter @bit-ds/core test`
Expected: PASS. The new guard tests and the `withoutBlocks` tests pass, because nothing has changed yet.

- [ ] **Step 4: Write the failing token tests**

In `packages/core/src/__tests__/tokens.test.ts`:
- Change the import to `import { SEMANTIC_TOKENS, MODE_TOKENS, COLORS, SIZES, SPACE_STEPS, TEXT_SIZES, CODE_KINDS } from '../tokens';`.
- Change the count test to 92:

```ts
  it('contains exactly 92 unique names, all prefixed --bit-', () => {
    expect(SEMANTIC_TOKENS).toHaveLength(92);
    expect(new Set(SEMANTIC_TOKENS).size).toBe(92);
```

(Keep the rest of that test unchanged.) Add this test before `'has no --bit-color-focus (the focus ring has its own tokens)'`:

```ts
  it('includes the five PR2 color roles; four of them change with the mode, the knob is shared', () => {
    const pr2 = ['--bit-color-accent', '--bit-color-link', '--bit-color-link-visited', '--bit-color-danger-text', '--bit-color-knob'];
    for (const name of pr2) expect(SEMANTIC_TOKENS).toContain(name);
    expect(MODE_TOKENS).toHaveLength(22);
    expect(new Set(MODE_TOKENS).size).toBe(22);
    for (const name of pr2.slice(0, 4)) expect(MODE_TOKENS).toContain(name);
    expect(MODE_TOKENS).not.toContain('--bit-color-knob');
  });
```

In `packages/core/src/__tests__/contrast.test.ts`, inside the `describe.each(MODES)` block, after the `'selected text (ink on the selection color) is readable'` test, add:

```ts

  it.each(['--bit-color-bg', '--bit-color-surface', '--bit-code-bg'])('PR2: the code accent border stands out on %s', (bg) => {
    expect(contrastRatio(resolveColor('--bit-color-accent'), resolveColor(bg))).toBeGreaterThanOrEqual(AA_NON_TEXT);
  });

  it('PR2: the focus ring stands out on the code panel (CodeBlock pre and copy button)', () => {
    expect(contrastRatio(resolveColor('--bit-focus-ring-color'), resolveColor('--bit-code-bg'))).toBeGreaterThanOrEqual(AA_NON_TEXT);
  });

  it('PR2: the ink outline of an on Switch stands out from the success fill', () => {
    expect(contrastRatio(resolveColor('--bit-color-ink'), resolveColor('--bit-color-success'))).toBeGreaterThanOrEqual(AA_NON_TEXT);
  });

  // primary-soft is the hover highlight behind a primary Link, so link text must stay readable on it too.
  it.each(['--bit-color-link', '--bit-color-link-visited'])('PR2: %s is readable on the page, surfaces and the hover highlight', (link) => {
    for (const bg of ['--bit-color-bg', '--bit-color-surface', '--bit-color-primary-soft']) {
      expect(contrastRatio(resolveColor(link), resolveColor(bg)), bg).toBeGreaterThanOrEqual(AA_TEXT);
    }
  });

  it('PR2: field error text is readable on the page and on surfaces', () => {
    for (const bg of ['--bit-color-bg', '--bit-color-surface']) {
      expect(contrastRatio(resolveColor('--bit-color-danger-text'), resolveColor(bg)), bg).toBeGreaterThanOrEqual(AA_TEXT);
    }
  });
```

In the same file's `'dark mode values (owner-locked 2026-10-03)'` table, after the row `['--bit-code-bg', '#0B0B10'], ['--bit-focus-ring-color', '#FFC800'],`, add:

```ts
    // PR2 (spec §2). link-visited is #9D82E7, not the spec's #9B7FE6: see the plan's deviation D2.
    ['--bit-color-accent', '#FFC800'], ['--bit-color-link', '#B79BFF'],
    ['--bit-color-link-visited', '#9D82E7'], ['--bit-color-danger-text', '#FF8A8A'],
```

Append to the end of the file:

```ts

describe('PR2 light values (spec §2)', () => {
  const { light } = themeModes(readCss('themes/power-up.css'));

  it.each([
    ['--bit-color-accent', '#7C3AED'],
    ['--bit-color-link', '#7C3AED'],
    ['--bit-color-link-visited', '#5B2BB5'],
    // Not the spec's var(--bit-color-danger) (#D91A1A, 4.41:1 on the page): see the plan's deviation D1.
    ['--bit-color-danger-text', '#D61A1A'],
    ['--bit-color-knob', '#FFFFFF'],
  ])('%s is %s in light', (token, value) => {
    expect(resolveVar(light, token)).toBe(value);
  });

  it('accent and link follow the palette violet, and the knob the palette white', () => {
    expect(light.get('--bit-color-accent')).toBe('var(--bit-palette-violet)');
    expect(light.get('--bit-color-link')).toBe('var(--bit-palette-violet)');
    expect(light.get('--bit-color-knob')).toBe('var(--bit-palette-white)');
  });
});
```

- [ ] **Step 5: Run the core tests and confirm they fail**

Run: `pnpm --filter @bit-ds/core test`
Expected: FAIL.
- `tokens.test.ts`: the count is still 87, and `MODE_TOKENS` has 18.
- `contrast.test.ts`: `Token --bit-color-accent is not declared`, and the same for the other new tokens.
- `theme-completeness.test.ts` passes for now. The dark block still matches the old `MODE_TOKENS`.

- [ ] **Step 6: Add the tokens**

In `packages/core/src/tokens.ts`, after the `colorRoleTokens` declaration (ending at line 32), add:

```ts

/**
 * PR2 roles: the code border accent, link text, field error text, and the Switch thumb when on.
 * Each has one job, so a theme can tune it without moving primary, danger or the surfaces.
 */
const pr2ColorTokens = ['accent', 'link', 'link-visited', 'danger-text', 'knob'].map((role) => token('color', role));
```

In `SEMANTIC_TOKENS`, add `...pr2ColorTokens,` right after `...colorRoleTokens,`. At the end of `MODE_TOKENS`, after `token('focus', 'ring', 'offset'),`, add:

```ts
  token('color', 'accent'),
  token('color', 'link'),
  token('color', 'link-visited'),
  token('color', 'danger-text'),
```

In `packages/core/src/themes/power-up.css`, in the shared (light) block, after `  --bit-color-shadow: var(--bit-palette-ink);` (line 63), add:

```css
  --bit-color-accent: var(--bit-palette-violet);
  --bit-color-link: var(--bit-palette-violet);
  --bit-color-link-visited: #5B2BB5;
  /* The spec's var(--bit-color-danger) (#D91A1A) is 4.41:1 on the page; #D61A1A is the nearest red that passes (4.51:1). */
  --bit-color-danger-text: #D61A1A;
  --bit-color-knob: var(--bit-palette-white);
```

In the `[data-mode="dark"]` block, after `  --bit-focus-ring-offset: 1px;` (line 188, the last declaration), add:

```css
  --bit-color-accent: var(--bit-palette-yellow);
  --bit-color-link: #B79BFF;
  /* The spec's #9B7FE6 is 4.45:1 on the hover highlight (primary-soft); #9D82E7 is the nearest that passes (4.59:1). */
  --bit-color-link-visited: #9D82E7;
  --bit-color-danger-text: #FF8A8A;
```

- [ ] **Step 7: Run the core tests and confirm they pass**

Run: `pnpm --filter @bit-ds/core test`
Expected: PASS, `Tests  300 passed (300)`. That includes `theme-completeness.test.ts` ("its dark block overrides exactly the mode tokens") and every `light-frozen.test.ts` row.

- [ ] **Step 8: Write the failing Slot tests**

Create `packages/react/src/system/Slot.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import type { MouseEvent } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Slot, composeRefs, mergeProps } from './Slot';

const ERROR = '[bit] Link asChild needs exactly one child element.';

describe('Slot', () => {
  it('renders its only child element, not a wrapper', () => {
    const { container } = render(
      <Slot>
        <a href="/docs">Docs</a>
      </Slot>,
    );
    expect(container.innerHTML).toBe('<a href="/docs">Docs</a>');
  });

  it('joins className with the Slot first and the child second', () => {
    render(
      <Slot className="bit-link bit-primary">
        <a href="/docs" className="router-active">
          Docs
        </a>
      </Slot>,
    );
    expect(screen.getByRole('link').className).toBe('bit-link bit-primary router-active');
  });

  it('merges style, and the child wins a clash', () => {
    render(
      <Slot style={{ color: 'red', marginTop: 4 }}>
        <a href="/docs" style={{ color: 'blue' }}>
          Docs
        </a>
      </Slot>,
    );
    const link = screen.getByRole('link');
    expect(link.style.color).toBe('blue');
    expect(link.style.marginTop).toBe('4px');
  });

  it('other props merge with the child winning', () => {
    render(
      <Slot title="from slot" data-slot="" aria-label="slot">
        <a href="/docs" title="from child">
          Docs
        </a>
      </Slot>,
    );
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('title', 'from child');
    expect(link).toHaveAttribute('data-slot', '');
    expect(link).toHaveAttribute('aria-label', 'slot');
  });

  it('runs the child handler first, then the Slot handler', async () => {
    const calls: string[] = [];
    render(
      <Slot onClick={() => calls.push('slot')}>
        <button type="button" onClick={() => calls.push('child')}>
          Go
        </button>
      </Slot>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(calls).toEqual(['child', 'slot']);
  });

  it('skips the Slot handler when the child prevents the default', async () => {
    const slot = vi.fn();
    render(
      <Slot onClick={slot}>
        <a href="#x" onClick={(event: MouseEvent) => event.preventDefault()}>
          Go
        </a>
      </Slot>,
    );
    await userEvent.click(screen.getByRole('link'));
    expect(slot).not.toHaveBeenCalled();
  });

  it('keeps a handler that only one side has', async () => {
    const slot = vi.fn();
    const child = vi.fn();
    render(
      <>
        <Slot onClick={slot}>
          <button type="button">Slot only</button>
        </Slot>
        <Slot onMouseDown={slot}>
          <button type="button" onClick={child}>
            Child only
          </button>
        </Slot>
      </>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Slot only' }));
    expect(slot).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole('button', { name: 'Child only' }));
    expect(child).toHaveBeenCalledTimes(1);
  });

  it('forwards the ref and still feeds the child ref', () => {
    const slotRef = createRef<HTMLElement>();
    const childRef = vi.fn();
    render(
      <Slot ref={slotRef}>
        <a href="/docs" ref={childRef}>
          Docs
        </a>
      </Slot>,
    );
    const link = screen.getByRole('link');
    expect(slotRef.current).toBe(link);
    expect(childRef).toHaveBeenCalledWith(link);
  });

  it.each([
    ['no child', undefined],
    ['two children', [<a key="1" href="/a">A</a>, <a key="2" href="/b">B</a>]],
    ['a text child', 'Docs'],
  ])('throws with %s', (_name, children) => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Slot>{children}</Slot>)).toThrow(ERROR);
    vi.restoreAllMocks();
  });
});

describe('mergeProps', () => {
  it('leaves className and style off when neither side has them', () => {
    expect(mergeProps({ id: 'a' }, { title: 'b' })).toEqual({ id: 'a', title: 'b', className: undefined });
  });

  it('keeps the child handler when the Slot passes an empty one', () => {
    const child = () => {};
    expect(mergeProps({ onClick: undefined }, { onClick: child }).onClick).toBe(child);
  });

  it('keeps a style only the child has', () => {
    expect(mergeProps({}, { style: { color: 'red' } }).style).toEqual({ color: 'red' });
  });
});

describe('composeRefs', () => {
  it('sets object refs and calls function refs, and skips null and undefined', () => {
    const object = createRef<HTMLElement>();
    const fn = vi.fn();
    const node = document.createElement('a');
    composeRefs<HTMLElement>(object, fn, null, undefined)(node);
    expect(object.current).toBe(node);
    expect(fn).toHaveBeenCalledWith(node);
  });
});
```

- [ ] **Step 9: Run it and confirm it fails**

Run: `pnpm --filter @bit-ds/react test -- src/system/Slot`
Expected: FAIL, `Failed to resolve import "./Slot"`.

- [ ] **Step 10: Write Slot**

Create `packages/react/src/system/Slot.tsx`:

```tsx
import { Children, cloneElement, forwardRef, isValidElement } from 'react';
import type { CSSProperties, HTMLAttributes, ReactElement, ReactNode, Ref, RefObject } from 'react';

export interface SlotProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
}

type AnyProps = Record<string, unknown>;
type ChildProps = AnyProps & { className?: string; style?: CSSProperties; ref?: Ref<HTMLElement> };

const HANDLER = /^on[A-Z]/;

/** The single element child, or a clear error. A string, a number, nothing, or two children all throw. */
function onlyElement(children: ReactNode): ReactElement<ChildProps> {
  const items = Children.toArray(children);
  const [first] = items;
  if (items.length !== 1 || !isValidElement<ChildProps>(first)) {
    throw new Error('[bit] Link asChild needs exactly one child element.');
  }
  return first;
}

function setRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === 'function') ref(value);
  else if (ref) (ref as RefObject<T | null>).current = value;
}

/** One ref callback that feeds every ref it was given. */
export function composeRefs<T>(...refs: (Ref<T> | undefined)[]): (node: T | null) => void {
  return (node) => {
    for (const ref of refs) setRef(ref, node);
  };
}

/** The child's handler runs first; the Slot's runs after, unless the child called preventDefault(). */
function chain(childHandler: unknown, slotHandler: unknown): unknown {
  if (typeof childHandler !== 'function') return slotHandler;
  if (typeof slotHandler !== 'function') return childHandler;
  return (event: { defaultPrevented: boolean }, ...more: unknown[]) => {
    childHandler(event, ...more);
    if (!event.defaultPrevented) slotHandler(event, ...more);
  };
}

/** Slot props under the child's. className joins (Slot first), style merges (child wins), handlers chain. */
export function mergeProps(slot: AnyProps, child: ChildProps): AnyProps {
  const merged: AnyProps = { ...slot, ...child };
  for (const key of Object.keys(slot)) {
    if (HANDLER.test(key)) merged[key] = chain(child[key], slot[key]);
  }
  const className = [slot.className, child.className].filter(Boolean).join(' ');
  merged.className = className || undefined;
  if (slot.style || child.style) merged.style = { ...(slot.style as CSSProperties), ...child.style };
  return merged;
}

/**
 * Renders its only child element with the Slot's props merged in, so a component can lend its classes
 * and behavior to another element (Link asChild around a router link). Internal: not exported.
 */
export const Slot = forwardRef<HTMLElement, SlotProps>(function Slot({ children, ...slotProps }, forwardedRef) {
  const child = onlyElement(children);
  return cloneElement(child, {
    ...mergeProps(slotProps, child.props),
    ref: composeRefs(forwardedRef, child.props.ref),
  });
});
```

- [ ] **Step 11: Run the react tests with coverage and confirm they pass**

Run: `pnpm --filter @bit-ds/react test -- src/system/Slot && pnpm test:coverage`
Expected:
- Slot: `Tests  15 passed (15)`.
- Coverage: `Tests  186 passed (186)`, and Statements, Branches, Functions and Lines all at `100%`.

- [ ] **Step 12: Run every gate**

Run: `pnpm build && pnpm verify && pnpm typecheck && pnpm lint && pnpm test && pnpm smoke && pnpm storybook:build`
Expected:
- `dist OK: 12 components`
- core `300 passed`, react `186 passed`, gallery `114 passed`
- `consumer OK: 12 components`
- `Storybook build completed successfully`

- [ ] **Step 13: Commit**

```bash
git add packages/core/src packages/react/src/system/Slot.tsx packages/react/src/system/Slot.test.tsx
git commit -m "feat(core): PR2 color tokens with two-mode contrast, outline-longhand and ink guards; internal Slot

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Field and Input, the Forms sidebar group, and self-closing ChildSpecs

**Files:**
- Create:
  - `packages/core/src/components/field.css` and `input.css`
  - `packages/core/src/__tests__/components/field.test.ts` and `input.test.ts`
- Modify: `packages/core/src/index.css:15` (two imports after `mode-toggle.css`)
- Create:
  - `packages/react/src/components/Field/FieldContext.ts`, `Field.tsx` and `Field.test.tsx`
  - `packages/react/src/components/Input/Input.tsx` and `Input.test.tsx`
- Modify:
  - `packages/react/src/index.ts:26-27` (after the ModeToggle exports)
  - `packages/react/src/index.test.tsx:5-6, 27, 37-41, 54`
  - `packages/react/scripts/verify-dist.mjs:11, 46, 52`
  - `scripts/smoke-consumer.mjs:15`
- Create: `apps/gallery/src/manifests/field.ts` and `input.ts`
- Modify:
  - `apps/gallery/src/manifests/types.ts:37-54` (`TextControl`, `ChildSpec`)
  - `apps/gallery/src/code/toJsx.ts:42, 48-53`
  - `apps/gallery/src/manifests/registry.ts:2-18`
  - `apps/gallery/src/manifests/index.ts:10-13`
  - `apps/gallery/src/shell/Sidebar.test.tsx` (full rewrite)
  - `apps/gallery/src/code/toJsx.test.ts`
  - `apps/gallery/src/engine/renderManifest.test.tsx`

**Interfaces:**
- Consumes `VISUALLY_HIDDEN`, `block` from Task 1 (core tests) and `--bit-color-danger-text`.
- Produces, for Task 3 (`packages/react/src/components/Field/FieldContext.ts`, private):
  - `FieldContext`
  - `interface FieldControlProps { id?: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean | 'true' | 'false' | 'grammar' | 'spelling'; required?: boolean }`
  - `useFieldControl(own: FieldControlProps, invalid: boolean | undefined): FieldControlProps`. Spread its result after the rest props on the native control.
- Produces `Field` (`FieldProps`) and `Input` (`InputProps`: `size?: Size`, `invalid?: boolean`), exported from `@bit-ds/react`.
- Produces, in the gallery:
  - `TextControl.alwaysPrint?: boolean`
  - `ChildSpec.children?: string` (optional now; Task 9 adds nesting)
  - `manifests/field.ts` → `field`, and `manifests/input.ts` → `input`, both in group `'forms'`
- Produces, in `packages/react/src/index.test.tsx`: `SAMPLE_PROPS: Record<string, Record<string, unknown>>`, the per-component props for the naming-rule render. Later tasks add rows.

- [ ] **Step 1: Write the failing core CSS tests**

Create `packages/core/src/__tests__/components/field.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { block, readCss } from '../css';

describe('components/field.css', () => {
  const css = readCss('components/field.css');

  it('stacks label, control, hint and error with an 8px gap', () => {
    const root = block(css, '.bit-field')!;
    expect(root).toContain('display: flex;');
    expect(root).toContain('flex-direction: column;');
    expect(root).toContain('gap: var(--bit-space-8px);');
  });

  it('the label is bold body text', () => {
    const label = block(css, '.bit-field__label')!;
    expect(label).toContain('font-family: var(--bit-font-body);');
    expect(label).toContain('font-weight: var(--bit-weight-bold);');
  });

  it('the hint is muted at 13px', () => {
    const hint = block(css, '.bit-field__hint')!;
    expect(hint).toContain('font-size: var(--bit-text-13px);');
    expect(hint).toContain('color: var(--bit-color-text-muted);');
  });

  it('the error is bold danger text at 13px, and so is the required star', () => {
    const error = block(css, '.bit-field__error')!;
    expect(error).toContain('font-size: var(--bit-text-13px);');
    expect(error).toContain('font-weight: var(--bit-weight-bold);');
    expect(error).toContain('color: var(--bit-color-danger-text);');
    expect(block(css, '.bit-field__required')).toContain('color: var(--bit-color-danger-text);');
  });
});
```

Create `packages/core/src/__tests__/components/input.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { block, readCss } from '../css';

describe('components/input.css', () => {
  const css = readCss('components/input.css');

  it('is recessed: surface fill, line border, 10px radius and the inset shadow', () => {
    const root = block(css, '.bit-input')!;
    for (const line of [
      'background: var(--bit-color-surface);',
      'border: var(--bit-border-width) solid var(--bit-color-line);',
      'border-radius: var(--bit-radius-10px);',
      'box-shadow: var(--bit-shadow-inset);',
    ]) {
      expect(root).toContain(line);
    }
  });

  it('takes height, padding and text size from the size decorator', () => {
    const root = block(css, '.bit-input')!;
    expect(root).toContain('height: var(--_bit-size-height);');
    expect(root).toContain('padding: 0 var(--_bit-size-padding);');
    expect(root).toContain('font-size: var(--_bit-size-text);');
    expect(root).toContain('font-family: var(--bit-font-body);');
  });

  it('the placeholder is muted text', () => {
    expect(block(css, '.bit-input::placeholder')).toContain('color: var(--bit-color-text-muted);');
  });

  it('aria-invalid="true" turns the border danger', () => {
    expect(block(css, '.bit-input[aria-invalid="true"]')).toContain('border-color: var(--bit-color-danger);');
  });

  it('disabled is half opacity with a not-allowed cursor, as in Button', () => {
    const body = block(css, '.bit-input:disabled')!;
    expect(body).toContain('opacity: 0.5;');
    expect(body).toContain('cursor: not-allowed;');
  });

  it('leaves the native search cancel button alone', () => {
    expect(css).not.toContain('search-cancel-button');
    expect(css).not.toContain('[type="search"]');
  });
});
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `pnpm --filter @bit-ds/core test`
Expected: FAIL with `ENOENT: no such file or directory` for `components/field.css` and `components/input.css`.

- [ ] **Step 3: Write the CSS**

Create `packages/core/src/components/field.css`:

```css
/* Field: a label, the control, then an optional hint and error, stacked. The control brings its own look. */
.bit-field {
  display: flex;
  flex-direction: column;
  gap: var(--bit-space-8px);
  color: var(--bit-color-text);
}

.bit-field__label {
  font-family: var(--bit-font-body);
  font-size: var(--bit-text-15px);
  font-weight: var(--bit-weight-bold);
  line-height: var(--bit-leading-tight);
}

.bit-field__required {
  color: var(--bit-color-danger-text);
}

.bit-field__hint {
  margin: 0;
  font-size: var(--bit-text-13px);
  color: var(--bit-color-text-muted);
}

.bit-field__error {
  margin: 0;
  font-size: var(--bit-text-13px);
  font-weight: var(--bit-weight-bold);
  color: var(--bit-color-danger-text);
}
```

Create `packages/core/src/components/input.css`:

```css
/* Input: recessed into the page (inset shadow), where buttons pop out of it. Size from .bit-{size}. */
.bit-input {
  appearance: none;
  width: 100%;
  height: var(--_bit-size-height);
  padding: 0 var(--_bit-size-padding);
  font-family: var(--bit-font-body);
  font-size: var(--_bit-size-text);
  font-weight: var(--bit-weight-normal);
  color: var(--bit-color-text);
  background: var(--bit-color-surface);
  border: var(--bit-border-width) solid var(--bit-color-line);
  border-radius: var(--bit-radius-10px);
  box-shadow: var(--bit-shadow-inset);
}

.bit-input::placeholder {
  color: var(--bit-color-text-muted);
  opacity: 1;
}

/* states are attributes, never classes */
.bit-input[aria-invalid="true"] {
  border-color: var(--bit-color-danger);
}

.bit-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

In `packages/core/src/index.css`, after `@import "./components/mode-toggle.css";`, add:

```css
@import "./components/field.css";
@import "./components/input.css";
```

- [ ] **Step 4: Run the core tests and confirm they pass**

Run: `pnpm --filter @bit-ds/core test`
Expected: PASS, `Tests  322 passed (322)`. The system tests now also check both files: semantic tokens only, no outline, no ink, and imported from `index.css`.

- [ ] **Step 5: Write the failing React tests**

Create `packages/react/src/components/Field/Field.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { Field } from './Field';
import { Input } from '../Input/Input';
import { expectNoA11yViolations } from '../../test/a11y';

const root = (container: HTMLElement) => container.firstElementChild as HTMLElement;

describe('Field', () => {
  it('renders a div.bit-field with a label tied to the control', () => {
    const { container } = render(
      <Field label="Email">
        <Input />
      </Field>,
    );
    expect(root(container).tagName).toBe('DIV');
    expect(root(container).className).toBe('bit-field');
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(container.querySelector('label.bit-field__label')).toHaveAttribute('for', input.id);
    expect(input.id).not.toBe('');
  });

  it('puts the ref, className and rest props on the root div', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <Field ref={ref} label="Email" className="extra" data-testid="field" style={{ marginTop: 4 }}>
        <Input />
      </Field>,
    );
    expect(ref.current).toBe(root(container));
    expect(root(container).className).toBe('bit-field extra');
    expect(root(container)).toHaveAttribute('data-testid', 'field');
    expect(root(container).style.marginTop).toBe('4px');
  });

  it('with no hint or error, renders neither and leaves the control undescribed and valid', () => {
    const { container } = render(
      <Field label="Email">
        <Input />
      </Field>,
    );
    expect(container.querySelector('.bit-field__hint')).toBeNull();
    expect(container.querySelector('.bit-field__error')).toBeNull();
    const input = screen.getByRole('textbox');
    expect(input).not.toHaveAttribute('aria-describedby');
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('a hint gets an id and describes the control', () => {
    const { container } = render(
      <Field label="Email" hint="We never share it.">
        <Input />
      </Field>,
    );
    const hint = container.querySelector('p.bit-field__hint')!;
    expect(hint).toHaveTextContent('We never share it.');
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-describedby', hint.id);
    expect(screen.getByRole('textbox')).toHaveAccessibleDescription('We never share it.');
  });

  it('an error describes the control after the hint, marks it invalid, and shows the warning sign to sight only', () => {
    const { container } = render(
      <Field label="Name" hint="As on your card." error="Enter your name.">
        <Input />
      </Field>,
    );
    const hint = container.querySelector('.bit-field__hint')!;
    const error = container.querySelector('p.bit-field__error')!;
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-describedby', `${hint.id} ${error.id}`);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(error.querySelector('span[aria-hidden="true"]')).toHaveTextContent('⚠');
    expect(input).toHaveAccessibleDescription('As on your card. Enter your name.');
  });

  it('required shows a hidden "*" and makes the control required', () => {
    const { container } = render(
      <Field label="Email" required>
        <Input />
      </Field>,
    );
    const star = container.querySelector('.bit-field__required')!;
    expect(star).toHaveAttribute('aria-hidden', 'true');
    expect(star.textContent).toBe(' *');
    expect(screen.getByRole('textbox', { name: 'Email' })).toBeRequired();
  });

  it("the control's own props win over the Field's, and descriptions combine", () => {
    render(
      <>
        <p id="extra">Extra help</p>
        <Field label="Email" error="Wrong" required>
          <Input id="email" aria-describedby="extra" aria-invalid={false} required={false} />
        </Field>
      </>,
    );
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input.id).toBe('email');
    expect(input.getAttribute('aria-describedby')).toMatch(/^extra \S+-error$/);
    expect(input).toHaveAttribute('aria-invalid', 'false');
    expect(input).not.toBeRequired();
  });

  it('a control with its own id keeps its label: the label points at that id', () => {
    const { container } = render(
      <Field label="Email">
        <Input id="email" />
      </Field>,
    );
    expect(container.querySelector('label')).toHaveAttribute('for', 'email');
    expect(screen.getByRole('textbox', { name: 'Email' }).id).toBe('email');
  });

  it('a control passed inside an array (as the gallery engine renders it) is still labelled', () => {
    render(
      // @ts-expect-error children is one element; an array still has to work at runtime
      <Field label="Email">{[<Input key="email" />]}</Field>,
    );
    expect(screen.getByRole('textbox', { name: 'Email' })).toBeInTheDocument();
  });

  it('two Fields get different ids', () => {
    render(
      <>
        <Field label="First">
          <Input />
        </Field>
        <Field label="Second">
          <Input />
        </Field>
      </>,
    );
    const [first, second] = screen.getAllByRole('textbox');
    expect(first!.id).not.toBe(second!.id);
  });

  it('rejects the legacy DOM color attribute and does not render it', () => {
    const { container } = render(
      // @ts-expect-error color is not part of FieldProps
      <Field label="Email" color="danger">
        <Input />
      </Field>,
    );
    expect(root(container)).not.toHaveAttribute('color');
  });

  it('has no accessibility violations with a hint, an error and required', async () => {
    const { container } = render(
      <Field label="Email" hint="We never share it." error="Enter your email." required>
        <Input type="email" />
      </Field>,
    );
    await expectNoA11yViolations(container);
  });
});
```

Create `packages/react/src/components/Input/Input.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { Input } from './Input';
import { SIZES } from '../../system/axes';
import { expectNoA11yViolations } from '../../test/a11y';

describe('Input', () => {
  it('renders a native input with the default size', () => {
    render(<Input aria-label="Email" />);
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input.tagName).toBe('INPUT');
    expect(input.className).toBe('bit-input bit-md');
  });

  it.each(SIZES)('size=%s maps to bit-%s', (size) => {
    render(<Input aria-label="Email" size={size} />);
    expect(screen.getByRole('textbox').className).toBe(`bit-input bit-${size}`);
  });

  it('puts the ref, className and rest props on the input, and passes type through', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} aria-label="Search" type="search" className="extra" placeholder="Find" name="q" />);
    const input = screen.getByRole('searchbox', { name: 'Search' });
    expect(ref.current).toBe(input);
    expect(input.className).toBe('bit-input bit-md extra');
    expect(input).toHaveAttribute('type', 'search');
    expect(input).toHaveAttribute('placeholder', 'Find');
    expect(input).toHaveAttribute('name', 'q');
  });

  it('invalid sets aria-invalid="true"; without it there is no aria-invalid', () => {
    const { rerender } = render(<Input aria-label="Email" invalid />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    rerender(<Input aria-label="Email" />);
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid');
  });

  it('disabled and required reach the native input', () => {
    render(<Input aria-label="Email" disabled required />);
    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(screen.getByRole('textbox')).toBeRequired();
  });

  it('drops an unknown size with a warning instead of emitting a class', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // @ts-expect-error xl is not a size
    render(<Input aria-label="Email" size="xl" />);
    expect(screen.getByRole('textbox').className).toBe('bit-input');
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('rejects the legacy DOM color attribute and does not render it', () => {
    // @ts-expect-error color is not part of InputProps
    render(<Input aria-label="Email" color="danger" />);
    expect(screen.getByRole('textbox')).not.toHaveAttribute('color');
  });

  it.each([false, true])('has no accessibility violations (invalid=%s)', async (invalid) => {
    const { container } = render(<Input aria-label="Email" invalid={invalid} />);
    await expectNoA11yViolations(container);
  });
});
```

In `packages/react/src/index.test.tsx`:
- Replace line 6, `import type { ComponentType } from 'react';`, with:

```ts
import { createElement } from 'react';
import type { ComponentType } from 'react';
```

- Above `/** The naming rule from the spec, as code. */` (line 27), add:

```ts
/**
 * What each component renders with in the naming-rule test: `aria-label="x"` and the child "x", plus
 * these props where a component needs more to render at all. A void element (Input) takes no children.
 */
const SAMPLE_PROPS: Record<string, Record<string, unknown>> = {
  Input: { children: undefined },
};

```

- Replace the `'exports exactly the Phase 1 components'` test with:

```ts
  it('exports exactly the public components', () => {
    expect(componentNames.sort()).toEqual(
      [
        'Alert', 'Badge', 'BitLogo', 'Button', 'Card', 'CardBody', 'CardFooter', 'CardHeader', 'ModeToggle', 'Spinner', 'Stack', 'Text',
        'Field', 'Input',
      ].sort(),
    );
  });
```

- In the naming-rule test, replace `const { container } = render(<Component aria-label="x">x</Component>);` with:

```ts
    const { container } = render(createElement(Component, { 'aria-label': 'x', children: 'x', ...SAMPLE_PROPS[name] }));
```

- [ ] **Step 6: Run them and confirm they fail**

Run: `pnpm --filter @bit-ds/react test`
Expected: FAIL.
- `Failed to resolve import "./Field"` and `"./Input"`.
- `index.test.tsx`: `exports exactly the public components` lacks Field and Input.

- [ ] **Step 7: Write Field's context, Field and Input**

Create `packages/react/src/components/Field/FieldContext.ts`:

```ts
import { createContext, useContext } from 'react';

/** What a Field tells the one Input or Select inside it. Private: not exported from the package. */
export interface FieldContextValue {
  id: string;
  describedBy: string | undefined;
  invalid: boolean;
  required: boolean | undefined;
}

export const FieldContext = createContext<FieldContextValue | null>(null);

/** The props of a control that Field can wire. */
export interface FieldControlProps {
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean | 'true' | 'false' | 'grammar' | 'spelling';
  required?: boolean;
}

/**
 * The id, description, invalid state and required flag a control renders: its own props merged with
 * the surrounding Field's, if any. The control's own props win; descriptions are combined.
 */
export function useFieldControl(own: FieldControlProps, invalid: boolean | undefined): FieldControlProps {
  const field = useContext(FieldContext);
  const describedBy = [own['aria-describedby'], field?.describedBy].filter(Boolean).join(' ');
  return {
    id: own.id ?? field?.id,
    'aria-describedby': describedBy || undefined,
    'aria-invalid': own['aria-invalid'] ?? (invalid || field?.invalid ? true : undefined),
    required: own.required ?? field?.required,
  };
}
```

Create `packages/react/src/components/Field/Field.tsx`:

```tsx
import { forwardRef, isValidElement, useId, useMemo } from 'react';
import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { element, toClasses } from '../../system/toClasses';
import { dropLegacyColor } from '../../system/dropLegacyColor';
import { FieldContext } from './FieldContext';
import type { FieldContextValue } from './FieldContext';

export interface FieldProps extends Omit<HTMLAttributes<HTMLDivElement>, 'color'> {
  /** The visible label, tied to the control with `for`. */
  label: ReactNode;
  /** Help text under the control, read as its description. */
  hint?: ReactNode;
  /** Shown under the control in danger text; marks the control invalid and describes it. */
  error?: ReactNode;
  /** Shows a "*" (hidden from screen readers) and passes `required` to the control. */
  required?: boolean;
  /** Exactly one Input or Select. */
  children: ReactElement;
}

/** The control's own id, when it brings one, so the label still points at it. */
function ownId(children: ReactNode): string | undefined {
  if (!isValidElement<{ id?: unknown }>(children)) return undefined;
  return typeof children.props.id === 'string' ? children.props.id : undefined;
}

/**
 * A label, an optional hint and an optional error around one Input or Select. The ids are shared
 * through context, so the control wires itself: no cloneElement.
 */
export const Field = forwardRef<HTMLDivElement, FieldProps>(function Field(
  { label, hint, error, required, className, children, ...rest },
  ref,
) {
  const generated = useId();
  const id = ownId(children) ?? generated;
  const hintId = `${generated}-hint`;
  const errorId = `${generated}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;
  const invalid = Boolean(error);
  const context = useMemo<FieldContextValue>(
    () => ({ id, describedBy, invalid, required }),
    [id, describedBy, invalid, required],
  );

  return (
    <div ref={ref} className={toClasses('field', [], className)} {...dropLegacyColor(rest)}>
      <label className={element('field', 'label')} htmlFor={id}>
        {label}
        {required ? (
          <span className={element('field', 'required')} aria-hidden="true">
            {' *'}
          </span>
        ) : null}
      </label>
      <FieldContext.Provider value={context}>{children}</FieldContext.Provider>
      {hint ? (
        <p className={element('field', 'hint')} id={hintId}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className={element('field', 'error')} id={errorId}>
          <span aria-hidden="true">⚠ </span>
          {error}
        </p>
      ) : null}
    </div>
  );
});
```

Create `packages/react/src/components/Input/Input.tsx`:

```tsx
import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { SIZES } from '../../system/axes';
import type { Size } from '../../system/axes';
import { toClasses } from '../../system/toClasses';
import { dropLegacyColor } from '../../system/dropLegacyColor';
import { useFieldControl } from '../Field/FieldContext';

const sizes = SIZES;

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'color'> {
  /** Control height. Class: `bit-{size}`. */
  size?: Size;
  /** Marks the value wrong: `aria-invalid="true"` and a danger border. A surrounding Field's error does the same. */
  invalid?: boolean;
}

/** A native text input, recessed into the page. Inside a Field it takes the Field's id, hint and error. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { size = 'md', invalid, className, ...rest },
  ref,
) {
  const wired = useFieldControl(rest, invalid);
  return (
    <input
      ref={ref}
      className={toClasses('input', [{ name: 'size', allowed: sizes, value: size }], className)}
      {...dropLegacyColor(rest)}
      {...wired}
    />
  );
});
```

In `packages/react/src/index.ts`, after the two ModeToggle export lines, add:

```ts

export { Field } from './components/Field/Field';
export type { FieldProps } from './components/Field/Field';

export { Input } from './components/Input/Input';
export type { InputProps } from './components/Input/Input';
```

In `packages/react/scripts/verify-dist.mjs`, replace the `EXPECTED` line (11) with:

```js
const EXPECTED = [
  'Alert', 'Badge', 'BitLogo', 'Button', 'Card', 'CardBody', 'CardFooter', 'CardHeader', 'ModeToggle', 'Spinner', 'Stack', 'Text',
  'Field', 'Input',
];
```

Change the type-name list (line 46) to `['ButtonProps', 'BitLogoProps', 'Variant', 'Size', 'FieldProps', 'InputProps']`. Append `'.bit-field__error', '.bit-input'` to the end of the CSS needle list (line 52). In `scripts/smoke-consumer.mjs`, replace the `EXPECTED` line (15) with the same four-line `EXPECTED` block as verify-dist.

- [ ] **Step 8: Run the react tests with coverage and confirm they pass**

Run: `pnpm test:coverage`
Expected: `Tests  211 passed (211)`. Statements, Branches, Functions and Lines are all `100%`.

- [ ] **Step 9: Update the gallery tests (they fail until the manifests exist)**

Replace `apps/gallery/src/shell/Sidebar.test.tsx` with:

```tsx
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { NAV, Sidebar } from './Sidebar';
import type { NavItem } from './Sidebar';

function renderSidebar(items: readonly NavItem[]) {
  render(
    <MemoryRouter>
      <Sidebar items={items} open={false} onNavigate={() => {}} />
    </MemoryRouter>,
  );
  return screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
}

/** The link names listed under one sidebar heading. */
function linksUnder(heading: string): string[] {
  const section = screen.getByRole('heading', { level: 2, name: heading }).closest('section')!;
  return within(section)
    .getAllByRole('link')
    .map((link) => link.textContent ?? '');
}

describe('Sidebar', () => {
  it('lists Foundations, Components, Forms and Brand, with Forms between Components and Brand', () => {
    expect(renderSidebar(NAV)).toEqual(['Foundations', 'Components', 'Forms', 'Brand']);
    expect(screen.getByRole('link', { name: 'Button' })).toHaveAttribute('href', '/components/button');
  });

  it('Forms holds the form controls, routed like any component', () => {
    renderSidebar(NAV);
    expect(linksUnder('Forms')).toEqual(['Field', 'Input']);
    expect(screen.getByRole('link', { name: 'Input' })).toHaveAttribute('href', '/components/input');
  });

  it('hides a group with no items', () => {
    expect(renderSidebar(NAV.filter((item) => item.group !== 'Forms'))).toEqual(['Foundations', 'Components', 'Brand']);
  });
});
```

In `apps/gallery/src/code/toJsx.test.ts`, after `import { badge } from '../manifests/badge';`, add:

```ts
import { field } from '../manifests/field';
import { input } from '../manifests/input';
```

Then add these two rows to the `it.each` table, before the `'a data-attribute enum prints like any select'` row:

```ts
    [
      'an alwaysPrint text prop prints at its default, and a ChildSpec with no children self-closes',
      field,
      {},
      `import { Field, Input } from '@bit-ds/react';\n\n<Field label="Email">\n  <Input type="email" placeholder="you@example.com" />\n</Field>`,
    ],
    [
      'a component with no children self-closes; aria-label and alwaysPrint props print at their defaults',
      input,
      { invalid: true },
      `import { Input } from '@bit-ds/react';\n\n<Input aria-label="Email" placeholder="you@example.com" invalid />`,
    ],
```

In `apps/gallery/src/engine/renderManifest.test.tsx`, after `import { stack } from '../manifests/stack';`, add `import { field } from '../manifests/field';`. Add this test before `'renders a lowercase ChildSpec as a plain HTML element (Select needs <option>)'`:

```tsx
  it('renders a ChildSpec with no children as a childless element (Field wraps a void Input)', () => {
    render(renderManifest(field, { ...defaultState(field), error: 'Enter your email.' }));
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input).toHaveClass('bit-input');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Enter your email.');
  });
```

- [ ] **Step 10: Run the gallery tests and confirm they fail**

Run: `pnpm build && pnpm --filter @bit-ds/gallery test`
Expected: FAIL, `Failed to resolve import "../manifests/field"`.

- [ ] **Step 11: Teach the engine childless ChildSpecs and alwaysPrint, and add the two manifests**

In `apps/gallery/src/manifests/types.ts`, replace `TextControl` with:

```ts
export interface TextControl {
  kind: 'text';
  prop: string;
  default: string;
  label?: string;
  /** Print the prop in the code even at its default, because the component requires it (Field `label`). */
  alwaysPrint?: boolean;
}
```

Replace the `ChildSpec` comment and interface with:

```ts
/**
 * One child element of a compound component, as data so toJsx can print it. A PascalCase
 * `component` is a registered bit component; a lowercase one is a plain HTML element
 * (Select's `option`), following JSX's own rule. No `children` renders and prints a
 * self-closing element (Field's Input).
 */
export interface ChildSpec {
  component: string;
  props?: Record<string, string>;
  children?: string;
}
```

In `apps/gallery/src/code/toJsx.ts`, in `printProp`'s `'text'` case, change `if (isDefault && !isRequiredAria(control)) return null;` to:

```ts
      if (isDefault && !control.alwaysPrint && !isRequiredAria(control)) return null;
```

Replace `printChildSpec` with:

```ts
function printChildSpec(child: ChildSpec, depth: number): string {
  const props = Object.entries(child.props ?? {})
    .map(([k, v]) => ` ${k}="${escapeAttr(v)}"`)
    .join('');
  const open = `${INDENT.repeat(depth)}<${child.component}${props}`;
  if (child.children === undefined) return `${open} />`;
  return `${open}>${printChildren(child.children)}</${child.component}>`;
}
```

(`renderManifest.tsx` needs no change: `createElement(Part, props, undefined)` already renders a childless element.)

Replace lines 1–18 of `apps/gallery/src/manifests/registry.ts` (the imports and `COMPONENTS`) with:

```ts
import type { ComponentType } from 'react';
import {
  Alert,
  Badge,
  BitLogo,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Field,
  Input,
  Spinner,
  Stack,
  Text,
} from '@bit-ds/react';

/** Export name → component, so ChildSpec.component (a string) can be rendered. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- heterogeneous prop types by design
export const COMPONENTS: Record<string, ComponentType<any>> = {
  Alert,
  Badge,
  BitLogo,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Field,
  Input,
  Spinner,
  Stack,
  Text,
};
```

Create `apps/gallery/src/manifests/field.ts`:

```ts
import { Field } from '@bit-ds/react';
import type { Manifest } from './types';

export const field: Manifest = {
  name: 'Field',
  slug: 'field',
  group: 'forms',
  component: Field,
  description: 'A label, an optional hint and an error around one Input or Select. It wires the ids, so screen readers read them.',
  controls: [
    { kind: 'text', prop: 'label', default: 'Email', alwaysPrint: true },
    { kind: 'text', prop: 'hint', default: '' },
    { kind: 'text', prop: 'error', default: '' },
    { kind: 'boolean', prop: 'required', default: false },
  ],
  children: [{ component: 'Input', props: { type: 'email', placeholder: 'you@example.com' } }],
  presets: [
    { label: 'With a hint', state: { hint: 'We never share it.' } },
    { label: 'With an error', state: { error: 'Enter your email.' } },
    { label: 'Required', state: { required: true } },
  ],
};
```

Create `apps/gallery/src/manifests/input.ts`:

```ts
import { Input, SIZES } from '@bit-ds/react';
import type { Manifest } from './types';

export const input: Manifest = {
  name: 'Input',
  slug: 'input',
  group: 'forms',
  component: Input,
  description: 'A native text input, recessed into the page. Put it in a Field for a visible label.',
  controls: [
    { kind: 'axis', prop: 'size', values: SIZES, default: 'md' },
    { kind: 'select', prop: 'type', values: ['text', 'email', 'search', 'password'], default: 'text' },
    { kind: 'text', prop: 'aria-label', default: 'Email', label: 'aria-label' },
    { kind: 'text', prop: 'placeholder', default: 'you@example.com', alwaysPrint: true },
    { kind: 'boolean', prop: 'invalid', default: false },
    { kind: 'boolean', prop: 'disabled', default: false },
  ],
  presets: [
    { label: 'Invalid', state: { invalid: true } },
    { label: 'Search', state: { type: 'search', 'aria-label': 'Search', placeholder: 'Search components' } },
    { label: 'Disabled', state: { disabled: true } },
  ],
};
```

In `apps/gallery/src/manifests/index.ts`, replace lines 10–13 (the `bitLogo` import and `MANIFESTS`) with:

```ts
import { bitLogo } from './bitLogo';
import { field } from './field';
import { input } from './input';

/** Sidebar order within each group (Components, then Forms, then Brand). */
export const MANIFESTS: readonly Manifest[] = [button, badge, alert, card, stack, text, spinner, modeToggle, field, input, bitLogo];
```

- [ ] **Step 12: Run the gallery tests and confirm they pass**

Run: `pnpm build && pnpm --filter @bit-ds/gallery test`
Expected: PASS, `Tests  122 passed (122)`. That includes the route smoke for Field and Input with axe in both modes, and the manifest contract test (the `forms` group is already in `ManifestGroup`).

- [ ] **Step 13: Run every gate**

Run: `pnpm build && pnpm verify && pnpm typecheck && pnpm lint && pnpm test && pnpm test:coverage && pnpm smoke && pnpm storybook:build`
Expected:
- `dist OK: 14 components`
- core `322`, react `211`, gallery `122` passed
- coverage `100%` in all four columns
- `consumer OK: 14 components`
- Storybook builds

- [ ] **Step 14: Commit**

```bash
git add packages/core/src packages/react/src packages/react/scripts/verify-dist.mjs scripts/smoke-consumer.mjs apps/gallery/src
git commit -m "feat: Field and Input, wired through a private context, with Forms gallery pages

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Select, and the ChildSpec HTML allowlist

**Files:**
- Create: `packages/core/src/components/select.css`, `packages/core/src/__tests__/components/select.test.ts`
- Modify: `packages/core/src/index.css` (after `input.css`)
- Create: `packages/react/src/components/Select/Select.tsx` and `Select.test.tsx`
- Modify: `packages/react/src/index.ts`, `index.test.tsx`, `packages/react/scripts/verify-dist.mjs`, `scripts/smoke-consumer.mjs`
- Create: `apps/gallery/src/manifests/select.ts`
- Modify:
  - `apps/gallery/src/manifests/registry.ts`
  - `apps/gallery/src/manifests/index.ts`
  - `apps/gallery/src/manifests/manifests.test.ts:4, 8, 58-70, 97-100`
  - `apps/gallery/src/shell/Sidebar.test.tsx`
  - `apps/gallery/src/code/toJsx.test.ts`

**Interfaces:**
- Consumes `useFieldControl` and `FieldControlProps` from Task 2 (`../Field/FieldContext`).
- Produces `Select` (`SelectProps`: `size?: Size`, `invalid?: boolean`), exported.
- Produces `HTML_CHILDREN: readonly string[] = ['option', 'span', 'strong', 'em', 'code']`, exported from `apps/gallery/src/manifests/registry.ts`.
- Produces `unknownChildren(children)`, local to `manifests.test.ts`. Task 9 makes it recurse into nested parts.

- [ ] **Step 1: Write the failing core test**

Create `packages/core/src/__tests__/components/select.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { block, readCss } from '../css';

describe('components/select.css', () => {
  const css = readCss('components/select.css');

  it('the control has Input’s recessed look and drops the native arrow', () => {
    const control = block(css, '.bit-select__control')!;
    for (const line of [
      'appearance: none;',
      'height: var(--_bit-size-height);',
      'font-size: var(--_bit-size-text);',
      'background: var(--bit-color-surface);',
      'border: var(--bit-border-width) solid var(--bit-color-line);',
      'border-radius: var(--bit-radius-10px);',
      'box-shadow: var(--bit-shadow-inset);',
    ]) {
      expect(control).toContain(line);
    }
  });

  it('leaves room on the right for the chevron', () => {
    expect(block(css, '.bit-select__control')).toContain(
      'padding: 0 calc(var(--_bit-size-padding) * 2 + 12px) 0 var(--_bit-size-padding);',
    );
  });

  it('the wrapper draws the chevron as a text-colored border triangle that ignores the pointer', () => {
    expect(block(css, '.bit-select')).toContain('position: relative;');
    const chevron = block(css, '.bit-select::after')!;
    expect(chevron).toContain('border-top: 7px solid var(--bit-color-text);');
    expect(chevron).toContain('border-left: 6px solid transparent;');
    expect(chevron).toContain('pointer-events: none;');
  });

  it('aria-invalid="true" turns the border danger; disabled dims the control and the chevron', () => {
    expect(block(css, '.bit-select__control[aria-invalid="true"]')).toContain('border-color: var(--bit-color-danger);');
    expect(block(css, '.bit-select__control:disabled')).toContain('opacity: 0.5;');
    expect(block(css, '.bit-select__control:disabled')).toContain('cursor: not-allowed;');
    expect(block(css, '.bit-select:has(.bit-select__control:disabled)::after')).toContain('opacity: 0.5;');
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `pnpm --filter @bit-ds/core test`
Expected: FAIL, `ENOENT … components/select.css`.

- [ ] **Step 3: Write the CSS**

Create `packages/core/src/components/select.css`:

```css
/* Select: the native select with Input's recessed look. The wrapper draws the chevron, so the
   option list stays the browser's own. Size from .bit-{size} on the wrapper. */
.bit-select {
  position: relative;
  display: block;
  width: 100%;
}

/* A CSS border triangle, 12px wide and 7px tall, centred on the right padding. */
.bit-select::after {
  content: "";
  position: absolute;
  top: 50%;
  right: var(--_bit-size-padding);
  width: 0;
  height: 0;
  margin-top: -3px;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 7px solid var(--bit-color-text);
  pointer-events: none;
}

.bit-select__control {
  appearance: none;
  width: 100%;
  height: var(--_bit-size-height);
  /* room on the right for the 12px chevron and a padding either side of it */
  padding: 0 calc(var(--_bit-size-padding) * 2 + 12px) 0 var(--_bit-size-padding);
  font-family: var(--bit-font-body);
  font-size: var(--_bit-size-text);
  font-weight: var(--bit-weight-normal);
  color: var(--bit-color-text);
  background: var(--bit-color-surface);
  border: var(--bit-border-width) solid var(--bit-color-line);
  border-radius: var(--bit-radius-10px);
  box-shadow: var(--bit-shadow-inset);
  cursor: pointer;
}

/* states are attributes, never classes */
.bit-select__control[aria-invalid="true"] {
  border-color: var(--bit-color-danger);
}

.bit-select__control:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.bit-select:has(.bit-select__control:disabled)::after {
  opacity: 0.5;
}
```

In `packages/core/src/index.css`, after `@import "./components/input.css";`, add `@import "./components/select.css";`.

- [ ] **Step 4: Run the core tests and confirm they pass**

Run: `pnpm --filter @bit-ds/core test`
Expected: PASS, `Tests  332 passed (332)`.

- [ ] **Step 5: Write the failing React tests**

Create `packages/react/src/components/Select/Select.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from './Select';
import { Field } from '../Field/Field';
import { SIZES } from '../../system/axes';
import { expectNoA11yViolations } from '../../test/a11y';

const options = (
  <>
    <option value="primary">primary</option>
    <option value="danger">danger</option>
  </>
);

describe('Select', () => {
  it('wraps a native select in span.bit-select with the default size', () => {
    const { container } = render(<Select aria-label="Color">{options}</Select>);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.tagName).toBe('SPAN');
    expect(wrapper.className).toBe('bit-select bit-md');
    const select = screen.getByRole('combobox', { name: 'Color' });
    expect(select.tagName).toBe('SELECT');
    expect(select.className).toBe('bit-select__control');
    expect(select.parentElement).toBe(wrapper);
  });

  it.each(SIZES)('size=%s goes on the wrapper as bit-%s', (size) => {
    const { container } = render(
      <Select aria-label="Color" size={size}>
        {options}
      </Select>,
    );
    expect((container.firstElementChild as HTMLElement).className).toBe(`bit-select bit-${size}`);
  });

  it('className goes on the wrapper; the ref and rest props go on the select', () => {
    const ref = createRef<HTMLSelectElement>();
    const { container } = render(
      <Select ref={ref} aria-label="Color" className="extra" name="color" data-testid="control" defaultValue="danger">
        {options}
      </Select>,
    );
    const select = screen.getByTestId('control');
    expect((container.firstElementChild as HTMLElement).className).toBe('bit-select bit-md extra');
    expect(select.className).toBe('bit-select__control');
    expect(ref.current).toBe(select);
    expect(select).toHaveAttribute('name', 'color');
    expect(select).toHaveValue('danger');
  });

  it('renders native options and changes value from the keyboard or mouse', async () => {
    render(<Select aria-label="Color">{options}</Select>);
    const select = screen.getByRole('combobox');
    expect(screen.getAllByRole('option')).toHaveLength(2);
    await userEvent.selectOptions(select, 'danger');
    expect(select).toHaveValue('danger');
  });

  it('invalid sets aria-invalid="true"; without it there is no aria-invalid', () => {
    const { rerender } = render(
      <Select aria-label="Color" invalid>
        {options}
      </Select>,
    );
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true');
    rerender(<Select aria-label="Color">{options}</Select>);
    expect(screen.getByRole('combobox')).not.toHaveAttribute('aria-invalid');
  });

  it('disabled reaches the native select', () => {
    render(
      <Select aria-label="Color" disabled>
        {options}
      </Select>,
    );
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('inside a Field it takes the label, the error description and the invalid state', () => {
    const { container } = render(
      <Field label="Color" error="Pick a color.">
        <Select>{options}</Select>
      </Field>,
    );
    const select = screen.getByRole('combobox', { name: 'Color' });
    expect(select).toHaveAttribute('aria-invalid', 'true');
    expect(select).toHaveAttribute('aria-describedby', container.querySelector('.bit-field__error')!.id);
  });

  it('rejects the legacy DOM color attribute and does not render it', () => {
    render(
      // @ts-expect-error color is not part of SelectProps
      <Select aria-label="Color" color="danger">
        {options}
      </Select>,
    );
    expect(screen.getByRole('combobox')).not.toHaveAttribute('color');
  });

  it('has no accessibility violations, alone or in a Field with an error', async () => {
    const { container } = render(
      <>
        <Select aria-label="Size">{options}</Select>
        <Field label="Color" error="Pick a color.">
          <Select>{options}</Select>
        </Field>
      </>,
    );
    await expectNoA11yViolations(container);
  });
});
```

In `packages/react/src/index.test.tsx`, change the second row of the component list to `'Field', 'Input', 'Select',`.

- [ ] **Step 6: Run them and confirm they fail**

Run: `pnpm --filter @bit-ds/react test`
Expected: FAIL, `Failed to resolve import "./Select"`, and the export list lacks Select.

- [ ] **Step 7: Write Select and export it**

Create `packages/react/src/components/Select/Select.tsx`:

```tsx
import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { SIZES } from '../../system/axes';
import type { Size } from '../../system/axes';
import { element, toClasses } from '../../system/toClasses';
import { dropLegacyColor } from '../../system/dropLegacyColor';
import { useFieldControl } from '../Field/FieldContext';

const sizes = SIZES;

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'color'> {
  /** Control height. Class: `bit-{size}` on the wrapper. */
  size?: Size;
  /** Marks the choice wrong: `aria-invalid="true"` and a danger border. A surrounding Field's error does the same. */
  invalid?: boolean;
}

/**
 * The browser's own select, styled like Input, with a chunky chevron drawn by the wrapper.
 * The wrapper takes `className`; the `<select>` takes the ref and every other prop.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { size = 'md', invalid, className, ...rest },
  ref,
) {
  const wired = useFieldControl(rest, invalid);
  return (
    <span className={toClasses('select', [{ name: 'size', allowed: sizes, value: size }], className)}>
      <select ref={ref} className={element('select', 'control')} {...dropLegacyColor(rest)} {...wired} />
    </span>
  );
});
```

In `packages/react/src/index.ts`, after the Input exports, add:

```ts

export { Select } from './components/Select/Select';
export type { SelectProps } from './components/Select/Select';
```

In `packages/react/scripts/verify-dist.mjs`:
- Change `EXPECTED`'s second row to `'Field', 'Input', 'Select',`.
- Add `'SelectProps'` to the type-name list.
- Add `'.bit-select__control'` to the CSS needle list.

In `scripts/smoke-consumer.mjs`, change `EXPECTED`'s second row to `'Field', 'Input', 'Select',`.

- [ ] **Step 8: Run the react tests with coverage and confirm they pass**

Run: `pnpm test:coverage`
Expected: `Tests  223 passed (223)`, with `100%` in all four columns.

- [ ] **Step 9: Write the failing gallery tests: the allowlist and the forms group**

In `apps/gallery/src/manifests/manifests.test.ts`:
- Change the registry import to `import { COMPONENTS, HTML_CHILDREN, isHtmlElement } from './registry';`.
- Replace `import type { ControlState } from './types';` with:

```ts
import type { ChildSpec, ControlState } from './types';

/** ChildSpec names that are neither a registered component nor an allowed lowercase HTML element. */
function unknownChildren(children: readonly ChildSpec[]): string[] {
  return children
    .map((child) => child.component)
    .filter((name) => (isHtmlElement(name) ? !HTML_CHILDREN.includes(name) : COMPONENTS[name] === undefined));
}
```

Replace the test `'every control default is one of its values and every child spec names a registered component'` with these three:

```ts
  it('every control default is one of its values', () => {
    for (const m of MANIFESTS) {
      for (const c of m.controls) {
        if (c.kind === 'select') expect(c.values, `${m.name}.${c.prop}`).toContain(c.default);
        if (c.kind === 'number') expect(c.default).toBeGreaterThanOrEqual(c.min);
      }
    }
  });

  it('every child spec names a registered component or an allowed HTML element', () => {
    for (const m of MANIFESTS) {
      if (Array.isArray(m.children)) expect(unknownChildren(m.children), m.name).toEqual([]);
    }
  });

  it('the ChildSpec allowlist is option, span, strong, em and code, and catches a typo or a stray tag', () => {
    expect(HTML_CHILDREN).toEqual(['option', 'span', 'strong', 'em', 'code']);
    const children: ChildSpec[] = [
      { component: 'option', children: 'ok' },
      { component: 'opton', children: 'typo' },
      { component: 'div', children: 'not allowed' },
      { component: 'Badge', children: 'registered' },
      { component: 'Nope', children: 'unregistered' },
    ];
    expect(unknownChildren(children)).toEqual(['opton', 'div', 'Nope']);
  });
```

After the `'groups are the sidebar groups, and only the logo is brand'` test, add:

```ts

  it('the form controls are in the forms group', () => {
    expect(MANIFESTS.filter((m) => m.group === 'forms').map((m) => m.name)).toEqual(['Field', 'Input', 'Select']);
  });
```

In `apps/gallery/src/shell/Sidebar.test.tsx`, change `expect(linksUnder('Forms')).toEqual(['Field', 'Input']);` to `expect(linksUnder('Forms')).toEqual(['Field', 'Input', 'Select']);`.

In `apps/gallery/src/code/toJsx.test.ts`, add `import { select } from '../manifests/select';` after the `input` import. Add this row before `'a data-attribute enum prints like any select'`:

```ts
    [
      'HTML option children print as JSX and stay out of the import line',
      select,
      { size: 'sm' },
      `import { Select } from '@bit-ds/react';\n\n<Select size="sm" aria-label="Color">\n  <option value="primary">primary</option>\n  <option value="success">success</option>\n  <option value="danger">danger</option>\n</Select>`,
    ],
```

- [ ] **Step 10: Run the gallery tests and confirm they fail**

Run: `pnpm build && pnpm --filter @bit-ds/gallery test`
Expected: FAIL. `HTML_CHILDREN` is not exported (`undefined`), and `../manifests/select` doesn't resolve.

- [ ] **Step 11: Add the allowlist and the manifest**

In `apps/gallery/src/manifests/registry.ts`:
- Add `Select,` after `Input,` in both the import list and `COMPONENTS`.
- After `COMPONENTS`, add:

```ts

/**
 * The plain HTML elements a ChildSpec may name (PR1 checklist). A typo like `opton` would otherwise
 * render an unknown element silently; the manifest contract test fails on anything else.
 */
export const HTML_CHILDREN: readonly string[] = ['option', 'span', 'strong', 'em', 'code'];
```

Create `apps/gallery/src/manifests/select.ts`:

```ts
import { SIZES, Select } from '@bit-ds/react';
import type { Manifest } from './types';

export const select: Manifest = {
  name: 'Select',
  slug: 'select',
  group: 'forms',
  component: Select,
  description: 'The browser’s own select, styled like Input. The option list stays native, so every keyboard and screen reader works.',
  controls: [
    { kind: 'axis', prop: 'size', values: SIZES, default: 'md' },
    { kind: 'text', prop: 'aria-label', default: 'Color', label: 'aria-label' },
    { kind: 'boolean', prop: 'invalid', default: false },
    { kind: 'boolean', prop: 'disabled', default: false },
  ],
  children: [
    { component: 'option', props: { value: 'primary' }, children: 'primary' },
    { component: 'option', props: { value: 'success' }, children: 'success' },
    { component: 'option', props: { value: 'danger' }, children: 'danger' },
  ],
  presets: [
    { label: 'Invalid', state: { invalid: true } },
    { label: 'Small', state: { size: 'sm' } },
    { label: 'Disabled', state: { disabled: true } },
  ],
};
```

In `apps/gallery/src/manifests/index.ts`, add `import { select } from './select';` after the `input` import. In `MANIFESTS`, insert `select` after `input`.

- [ ] **Step 12: Run the gallery tests and confirm they pass**

Run: `pnpm build && pnpm --filter @bit-ds/gallery test`
Expected: PASS, `Tests  128 passed (128)`.

- [ ] **Step 13: Run every gate**

Run: `pnpm build && pnpm verify && pnpm typecheck && pnpm lint && pnpm test && pnpm test:coverage && pnpm smoke && pnpm storybook:build`
Expected:
- `dist OK: 15 components`
- core `332`, react `223`, gallery `128` passed
- coverage `100%`
- `consumer OK: 15 components`
- Storybook builds

- [ ] **Step 14: Commit**

```bash
git add packages/core/src packages/react/src packages/react/scripts/verify-dist.mjs scripts/smoke-consumer.mjs apps/gallery/src
git commit -m "feat: Select over the native select, and an HTML allowlist for gallery ChildSpecs

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Switch, its ring on the track, and the first ink exception

**Files:**
- Create: `packages/core/src/components/switch.css`, `packages/core/src/__tests__/components/switch.test.ts`
- Modify:
  - `packages/core/src/index.css` (after `select.css`)
  - `packages/core/src/system/reset.css:46` (new rule above `/* Programmatic focus targets`)
  - `packages/core/src/__tests__/system.test.ts` (`INK_EXCEPTIONS`)
- Create: `packages/react/src/components/Switch/Switch.tsx` and `Switch.test.tsx`
- Modify: `packages/react/src/index.ts`, `index.test.tsx`, `packages/react/scripts/verify-dist.mjs`, `scripts/smoke-consumer.mjs`
- Create: `apps/gallery/src/manifests/switch.ts`
- Modify: `apps/gallery/src/manifests/registry.ts`, `index.ts`, `manifests.test.ts`, `apps/gallery/src/shell/Sidebar.test.tsx`

**Interfaces:**
- Consumes `VISUALLY_HIDDEN`, `block` and `INK_EXCEPTIONS` (Task 1), and `--bit-color-knob`.
- Produces `Switch` (`SwitchProps`: `size?: 'sm' | 'md'`, `children?: ReactNode`), exported.
- Produces the classes `bit-switch`, `bit-switch__input`, `bit-switch__track`, `bit-switch__thumb` and `bit-switch__label`.
- Produces the `reset.css` rule `.bit-switch__input:focus-visible + .bit-switch__track`.
- Produces `switchManifest` (the name `switch` is reserved) in `apps/gallery/src/manifests/switch.ts`.

- [ ] **Step 1: Write the failing core tests**

Create `packages/core/src/__tests__/components/switch.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { VISUALLY_HIDDEN, block, readCss } from '../css';

describe('components/switch.css', () => {
  const css = readCss('components/switch.css');
  const on = '.bit-switch__input:checked + .bit-switch__track';

  it('hides the native checkbox visually but keeps it focusable and read', () => {
    const input = block(css, '.bit-switch__input')!;
    for (const line of VISUALLY_HIDDEN) expect(input).toContain(line);
    expect(input).not.toContain('display: none');
    expect(input).not.toContain('visibility: hidden');
  });

  it('sizes: md is a 48×28 track with a 16px thumb, sm is 40×24 with 12px', () => {
    const md = block(css, '.bit-switch.bit-md')!;
    expect(md).toContain('--_bit-switch-width: 48px;');
    expect(md).toContain('--_bit-switch-height: 28px;');
    expect(md).toContain('--_bit-switch-thumb: 16px;');
    const sm = block(css, '.bit-switch.bit-sm')!;
    expect(sm).toContain('--_bit-switch-width: 40px;');
    expect(sm).toContain('--_bit-switch-height: 24px;');
    expect(sm).toContain('--_bit-switch-thumb: 12px;');
  });

  it('off: a neutral-soft track with a line border and the small shadow; a surface thumb with a line border', () => {
    const track = block(css, '.bit-switch__track')!;
    expect(track).toContain('background: var(--bit-color-neutral-soft);');
    expect(track).toContain('border: var(--bit-border-width) solid var(--bit-color-line);');
    expect(track).toContain('box-shadow: var(--bit-shadow-sm);');
    const thumb = block(css, '.bit-switch__thumb')!;
    expect(thumb).toContain('background: var(--bit-color-surface);');
    expect(thumb).toContain('border: var(--bit-border-width) solid var(--bit-color-line);');
  });

  it('on: a success track and a knob thumb, both outlined in ink (decision 2)', () => {
    expect(block(css, on)).toContain('background: var(--bit-color-success);');
    expect(block(css, on)).toContain('border-color: var(--bit-color-ink);');
    const thumb = block(css, `${on} .bit-switch__thumb`)!;
    expect(thumb).toContain('background: var(--bit-color-knob);');
    expect(thumb).toContain('border-color: var(--bit-color-ink);');
  });

  it('the thumb moves by left, never transform', () => {
    expect(block(css, `${on} .bit-switch__thumb`)).toContain(
      'left: calc(var(--_bit-switch-width) - 2 * var(--bit-border-width) - var(--_bit-switch-thumb) - 3px);',
    );
    expect(css).not.toMatch(/(?<![-\w])transform\s*:/);
  });

  it('disabled dims the track and label to half and shows a not-allowed cursor', () => {
    expect(block(css, '.bit-switch__input:disabled + .bit-switch__track,\n.bit-switch__input:disabled ~ .bit-switch__label')).toContain(
      'opacity: 0.5;',
    );
    expect(block(css, '.bit-switch:has(.bit-switch__input:disabled)')).toContain('cursor: not-allowed;');
  });
});

describe('system/reset.css (Switch ring)', () => {
  it('draws the one focus ring on the track when the hidden input has keyboard focus', () => {
    const body = block(readCss('system/reset.css'), '.bit-switch__input:focus-visible + .bit-switch__track')!;
    expect(body).toContain('outline: var(--bit-focus-ring-width) solid var(--_bit-focus-ring, var(--bit-focus-ring-color));');
    expect(body).toContain('outline-offset: var(--bit-focus-ring-offset);');
  });
});
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `pnpm --filter @bit-ds/core test`
Expected: FAIL. `components/switch.css` doesn't exist, and the reset rule is missing (`block(...)` returns null).

- [ ] **Step 3: Write the CSS, the ring rule and the ink exception**

Create `packages/core/src/components/switch.css`:

```css
/* Switch: a real checkbox (role="switch"), visually hidden, inside a label that draws the track and
   thumb beside it. The input's state reaches them through the + combinator. Its focus ring is drawn
   on the track by system/reset.css. Sizes are fixed px from the board, not the control scale. */
.bit-switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: var(--bit-space-8px);
  font-family: var(--bit-font-body);
  font-size: var(--bit-text-15px);
  font-weight: var(--bit-weight-bold);
  line-height: var(--bit-leading-tight);
  color: var(--bit-color-text);
  cursor: pointer;
}

.bit-switch.bit-md {
  --_bit-switch-width: 48px;
  --_bit-switch-height: 28px;
  --_bit-switch-thumb: 16px;
}

.bit-switch.bit-sm {
  --_bit-switch-width: 40px;
  --_bit-switch-height: 24px;
  --_bit-switch-thumb: 12px;
  font-size: var(--bit-text-13px);
}

.bit-switch__input {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

.bit-switch__track {
  position: relative;
  flex: none;
  width: var(--_bit-switch-width);
  height: var(--_bit-switch-height);
  background: var(--bit-color-neutral-soft);
  border: var(--bit-border-width) solid var(--bit-color-line);
  border-radius: var(--bit-radius-full);
  box-shadow: var(--bit-shadow-sm);
  transition: background-color var(--bit-duration-fast);
}

/* The thumb sits 3px inside the track. On, it slides to the far end by `left` (no transform). */
.bit-switch__thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: var(--_bit-switch-thumb);
  height: var(--_bit-switch-thumb);
  background: var(--bit-color-surface);
  border: var(--bit-border-width) solid var(--bit-color-line);
  border-radius: var(--bit-radius-full);
  transition: left var(--bit-duration-fast);
}

/* On: green, with a near-black outline on the track and the thumb so it stays crisp in dark mode
   (owner decision 2, board W1). */
.bit-switch__input:checked + .bit-switch__track {
  background: var(--bit-color-success);
  border-color: var(--bit-color-ink);
}

.bit-switch__input:checked + .bit-switch__track .bit-switch__thumb {
  left: calc(var(--_bit-switch-width) - 2 * var(--bit-border-width) - var(--_bit-switch-thumb) - 3px);
  background: var(--bit-color-knob);
  border-color: var(--bit-color-ink);
}

/* states are attributes, never classes */
.bit-switch__input:disabled + .bit-switch__track,
.bit-switch__input:disabled ~ .bit-switch__label {
  opacity: 0.5;
}

.bit-switch:has(.bit-switch__input:disabled) {
  cursor: not-allowed;
}
```

In `packages/core/src/index.css`, after `@import "./components/select.css";`, add `@import "./components/switch.css";`.

In `packages/core/src/system/reset.css`, insert above the comment `/* Programmatic focus targets (a page heading …`:

```css
/* Visually hidden inputs can't show a ring, so the part drawn beside them shows it: the same ring,
   from the same tokens. */
.bit-switch__input:focus-visible + .bit-switch__track {
  outline: var(--bit-focus-ring-width) solid var(--_bit-focus-ring, var(--bit-focus-ring-color));
  outline-offset: var(--bit-focus-ring-offset);
}

```

In `packages/core/src/__tests__/system.test.ts`, replace `const INK_EXCEPTIONS: Readonly<Record<string, readonly string[]>> = {};` with:

```ts
const INK_EXCEPTIONS: Readonly<Record<string, readonly string[]>> = {
  // Decision 2: an on Switch outlines its track and thumb in ink so it stays crisp in dark mode.
  'switch.css': [
    '.bit-switch__input:checked + .bit-switch__track',
    '.bit-switch__input:checked + .bit-switch__track .bit-switch__thumb',
  ],
};
```

- [ ] **Step 4: Run the core tests and confirm they pass**

Run: `pnpm --filter @bit-ds/core test`
Expected: PASS, `Tests  345 passed (345)`. That includes `'switch.css draws lines with --bit-color-line; ink only where the owner chose it'`.

- [ ] **Step 5: Write the failing React tests**

Create `packages/react/src/components/Switch/Switch.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest';
import { createRef, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Switch } from './Switch';
import { expectNoA11yViolations } from '../../test/a11y';

describe('Switch', () => {
  it('renders a label holding a hidden checkbox with role="switch", the track, and the visible label', () => {
    const { container } = render(<Switch>Wi-Fi</Switch>);
    const label = container.firstElementChild as HTMLElement;
    expect(label.tagName).toBe('LABEL');
    expect(label.className).toBe('bit-switch bit-md');
    const input = screen.getByRole('switch', { name: 'Wi-Fi' });
    expect(input).toHaveAttribute('type', 'checkbox');
    expect(input.className).toBe('bit-switch__input');
    const track = label.querySelector('.bit-switch__track')!;
    expect(track).toHaveAttribute('aria-hidden', 'true');
    expect(track.querySelector('.bit-switch__thumb')).not.toBeNull();
    expect(label.querySelector('.bit-switch__label')).toHaveTextContent('Wi-Fi');
    expect([...label.children].map((el) => el.className)).toEqual(['bit-switch__input', 'bit-switch__track', 'bit-switch__label']);
  });

  it.each(['sm', 'md'] as const)('size=%s goes on the label as bit-%s', (size) => {
    const { container } = render(<Switch size={size}>Wi-Fi</Switch>);
    expect((container.firstElementChild as HTMLElement).className).toBe(`bit-switch bit-${size}`);
  });

  it('className goes on the label; the ref and rest props go on the input', () => {
    const ref = createRef<HTMLInputElement>();
    const { container } = render(
      <Switch ref={ref} className="extra" name="wifi" data-testid="input" defaultChecked>
        Wi-Fi
      </Switch>,
    );
    const input = screen.getByTestId('input');
    expect((container.firstElementChild as HTMLElement).className).toBe('bit-switch bit-md extra');
    expect(ref.current).toBe(input);
    expect(input).toHaveAttribute('name', 'wifi');
    expect(input).toBeChecked();
  });

  it('clicking the label text toggles it and reports the change', async () => {
    const onChange = vi.fn();
    render(<Switch onChange={onChange}>Wi-Fi</Switch>);
    const input = screen.getByRole('switch');
    await userEvent.click(screen.getByText('Wi-Fi'));
    expect(input).toBeChecked();
    expect(onChange).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByText('Wi-Fi'));
    expect(input).not.toBeChecked();
  });

  it('Tab reaches it and Space toggles it', async () => {
    render(<Switch>Wi-Fi</Switch>);
    await userEvent.tab();
    const input = screen.getByRole('switch');
    expect(input).toHaveFocus();
    await userEvent.keyboard(' ');
    expect(input).toBeChecked();
  });

  it('works controlled', async () => {
    function Controlled() {
      const [on, setOn] = useState(false);
      return (
        <Switch checked={on} onChange={(event) => setOn(event.target.checked)}>
          {on ? 'On' : 'Off'}
        </Switch>
      );
    }
    render(<Controlled />);
    await userEvent.click(screen.getByText('Off'));
    expect(screen.getByRole('switch', { name: 'On' })).toBeChecked();
  });

  it('disabled: no toggling by click or key', async () => {
    const onChange = vi.fn();
    render(
      <Switch disabled onChange={onChange}>
        Wi-Fi
      </Switch>,
    );
    const input = screen.getByRole('switch');
    expect(input).toBeDisabled();
    await userEvent.click(screen.getByText('Wi-Fi'));
    expect(input).not.toBeChecked();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('rejects the legacy DOM color attribute and does not render it', () => {
    // @ts-expect-error color is not part of SwitchProps
    render(<Switch color="danger">Wi-Fi</Switch>);
    expect(screen.getByRole('switch')).not.toHaveAttribute('color');
  });

  it.each([
    ['off', {}],
    ['on', { defaultChecked: true }],
    ['disabled', { disabled: true }],
  ])('has no accessibility violations (%s)', async (_state, props) => {
    const { container } = render(<Switch {...props}>Wi-Fi</Switch>);
    await expectNoA11yViolations(container);
  });
});
```

In `packages/react/src/index.test.tsx`, change the second row of the component list to `'Field', 'Input', 'Select', 'Switch',`.

- [ ] **Step 6: Run them and confirm they fail**

Run: `pnpm --filter @bit-ds/react test`
Expected: FAIL, `Failed to resolve import "./Switch"`, and the export list lacks Switch.

- [ ] **Step 7: Write Switch and export it**

Create `packages/react/src/components/Switch/Switch.tsx`:

```tsx
import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { element, toClasses } from '../../system/toClasses';
import { dropLegacyColor } from '../../system/dropLegacyColor';

const sizes = ['sm', 'md'] as const;

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type' | 'color' | 'role'> {
  /** Track size. Class: `bit-{size}` on the label. */
  size?: (typeof sizes)[number];
  /** The visible label. */
  children?: ReactNode;
}

/**
 * An on/off switch: a real checkbox with role="switch", visually hidden, inside a label that draws
 * the track and thumb. Clicking the label or pressing Space toggles it. The label takes `className`;
 * the input takes the ref and every other prop (checked, defaultChecked, onChange, disabled, name…).
 */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { size = 'md', className, children, ...rest },
  ref,
) {
  return (
    <label className={toClasses('switch', [{ name: 'size', allowed: sizes, value: size }], className)}>
      <input ref={ref} type="checkbox" role="switch" className={element('switch', 'input')} {...dropLegacyColor(rest)} />
      <span className={element('switch', 'track')} aria-hidden="true">
        <span className={element('switch', 'thumb')} />
      </span>
      <span className={element('switch', 'label')}>{children}</span>
    </label>
  );
});
```

In `packages/react/src/index.ts`, after the Select exports, add:

```ts

export { Switch } from './components/Switch/Switch';
export type { SwitchProps } from './components/Switch/Switch';
```

In `packages/react/scripts/verify-dist.mjs`:
- Change `EXPECTED`'s second row to `'Field', 'Input', 'Select', 'Switch',`.
- Add `'SwitchProps'` to the type-name list.
- Add `'.bit-switch__track'` to the needle list.

In `scripts/smoke-consumer.mjs`, change the same `EXPECTED` row.

- [ ] **Step 8: Run the react tests with coverage and confirm they pass**

Run: `pnpm test:coverage`
Expected: `Tests  236 passed (236)`, with `100%` in all four columns.

- [ ] **Step 9: Update the gallery tests (they fail until the manifest exists)**

In `apps/gallery/src/manifests/manifests.test.ts`, change the forms-group expectation to `['Field', 'Input', 'Select', 'Switch']`. In `apps/gallery/src/shell/Sidebar.test.tsx`, change the `linksUnder('Forms')` expectation to `['Field', 'Input', 'Select', 'Switch']`.

Run: `pnpm build && pnpm --filter @bit-ds/gallery test`
Expected: FAIL in both, because they still see three forms items.

- [ ] **Step 10: Add the manifest**

Create `apps/gallery/src/manifests/switch.ts`:

```ts
import { Switch } from '@bit-ds/react';
import type { Manifest } from './types';

/** `switch` is a reserved word, so this manifest is `switchManifest`. */
export const switchManifest: Manifest = {
  name: 'Switch',
  slug: 'switch',
  group: 'forms',
  component: Switch,
  description: 'An on/off switch. A real checkbox announced as a switch: click the label or press Space. Green when on.',
  controls: [
    { kind: 'axis', prop: 'size', values: ['sm', 'md'], default: 'md' },
    { kind: 'boolean', prop: 'disabled', default: false },
  ],
  children: 'Wi-Fi',
  presets: [
    { label: 'Small', state: { size: 'sm' } },
    { label: 'Disabled', state: { disabled: true } },
  ],
};
```

In `apps/gallery/src/manifests/registry.ts`, add `Switch,` after `Stack,` in both the import list and `COMPONENTS`. In `apps/gallery/src/manifests/index.ts`, add `import { switchManifest } from './switch';` after the `select` import, and insert `switchManifest` after `select` in `MANIFESTS`.

- [ ] **Step 11: Run the gallery tests and confirm they pass**

Run: `pnpm build && pnpm --filter @bit-ds/gallery test`
Expected: PASS, `Tests  130 passed (130)`. The new Switch route passes axe in both modes.

- [ ] **Step 12: Run every gate**

Run: `pnpm build && pnpm verify && pnpm typecheck && pnpm lint && pnpm test && pnpm test:coverage && pnpm smoke && pnpm storybook:build`
Expected:
- `dist OK: 16 components`
- core `345`, react `236`, gallery `130` passed
- coverage `100%`
- `consumer OK: 16 components`
- Storybook builds

- [ ] **Step 13: Commit**

```bash
git add packages/core/src packages/react/src packages/react/scripts/verify-dist.mjs scripts/smoke-consumer.mjs apps/gallery/src
git commit -m "feat: Switch over a hidden native checkbox, green and ink-edged when on, ringed on the track

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Link, with asChild through Slot

**Files:**
- Create: `packages/core/src/components/link.css`, `packages/core/src/__tests__/components/link.test.ts`
- Modify: `packages/core/src/index.css` (after `switch.css`)
- Create: `packages/react/src/components/Link/Link.tsx` and `Link.test.tsx`
- Modify: `packages/react/src/index.ts`, `index.test.tsx`, `packages/react/scripts/verify-dist.mjs`, `scripts/smoke-consumer.mjs`
- Create: `apps/gallery/src/manifests/link.ts`
- Modify: `apps/gallery/src/manifests/registry.ts`, `index.ts`

**Interfaces:**
- Consumes `Slot` (Task 1, `../../system/Slot`) and the tokens `--bit-color-link` and `--bit-color-link-visited`.
- Produces `Link` (`LinkProps`: `color?: 'primary' | 'neutral'`, `asChild?: boolean`), exported.
- Produces the gallery manifest `link`, in group `'components'`.

- [ ] **Step 1: Write the failing core test**

Create `packages/core/src/__tests__/components/link.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { block, readCss } from '../css';

describe('components/link.css', () => {
  const css = readCss('components/link.css');

  it('is bold with a 2px underline 3px below the text', () => {
    const root = block(css, '.bit-link')!;
    expect(root).toContain('font-weight: var(--bit-weight-bold);');
    expect(root).toContain('text-decoration: underline 2px;');
    expect(root).toContain('text-underline-offset: 3px;');
  });

  it('primary reads the link token, and the visited token once visited', () => {
    expect(block(css, '.bit-link.bit-primary')).toContain('color: var(--bit-color-link);');
    expect(block(css, '.bit-link.bit-primary:visited')).toContain('color: var(--bit-color-link-visited);');
  });

  it('neutral is body text, visited or not', () => {
    expect(block(css, '.bit-link.bit-neutral,\n.bit-link.bit-neutral:visited')).toContain('color: var(--bit-color-text);');
  });

  it('hover thickens the underline to 3px over a soft highlight in the link color', () => {
    expect(block(css, '.bit-link:hover')).toContain('text-decoration-thickness: 3px;');
    expect(block(css, '.bit-link.bit-primary:hover')).toContain('background: var(--bit-color-primary-soft);');
    expect(block(css, '.bit-link.bit-neutral:hover')).toContain('background: var(--bit-color-neutral-soft);');
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `pnpm --filter @bit-ds/core test`
Expected: FAIL, `ENOENT … components/link.css`.

- [ ] **Step 3: Write the CSS**

Create `packages/core/src/components/link.css`:

```css
/* Link: bold text with a thick underline. primary reads the link tokens (with a visited color);
   neutral reads body text. Hover thickens the underline and adds a soft highlight. */
.bit-link {
  font-weight: var(--bit-weight-bold);
  text-decoration: underline 2px;
  text-underline-offset: 3px;
}

.bit-link.bit-primary {
  color: var(--bit-color-link);
}

.bit-link.bit-primary:visited {
  color: var(--bit-color-link-visited);
}

.bit-link.bit-neutral,
.bit-link.bit-neutral:visited {
  color: var(--bit-color-text);
}

.bit-link:hover {
  text-decoration-thickness: 3px;
}

.bit-link.bit-primary:hover {
  background: var(--bit-color-primary-soft);
}

.bit-link.bit-neutral:hover {
  background: var(--bit-color-neutral-soft);
}
```

In `packages/core/src/index.css`, after `@import "./components/switch.css";`, add `@import "./components/link.css";`.

- [ ] **Step 4: Run the core tests and confirm they pass**

Run: `pnpm --filter @bit-ds/core test`
Expected: PASS, `Tests  355 passed (355)`.

- [ ] **Step 5: Write the failing React tests**

Create `packages/react/src/components/Link/Link.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest';
import { createRef, forwardRef } from 'react';
import type { AnchorHTMLAttributes } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link } from './Link';
import { expectNoA11yViolations } from '../../test/a11y';

/** Stands in for a router's link: takes `to`, renders an `<a>`, forwards the ref. */
const RouterLink = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }>(
  function RouterLink({ to, ...rest }, ref) {
    return <a ref={ref} href={to} data-router="" {...rest} />;
  },
);

describe('Link', () => {
  it('renders an <a> with the primary color by default', () => {
    render(<Link href="/docs">Docs</Link>);
    const link = screen.getByRole('link', { name: 'Docs' });
    expect(link.tagName).toBe('A');
    expect(link.className).toBe('bit-link bit-primary');
    expect(link).toHaveAttribute('href', '/docs');
  });

  it('color="neutral" maps to bit-neutral', () => {
    render(
      <Link href="/docs" color="neutral">
        Docs
      </Link>,
    );
    expect(screen.getByRole('link').className).toBe('bit-link bit-neutral');
  });

  it('drops a color outside primary and neutral, with a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      // @ts-expect-error danger is not a Link color
      <Link href="/docs" color="danger">
        Docs
      </Link>,
    );
    expect(screen.getByRole('link').className).toBe('bit-link');
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('appends className last, forwards the ref, and passes rest props to the <a>', () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      <Link ref={ref} href="/docs" className="extra" target="_blank" rel="noreferrer">
        Docs
      </Link>,
    );
    const link = screen.getByRole('link');
    expect(link.className).toBe('bit-link bit-primary extra');
    expect(ref.current).toBe(link);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer');
  });

  it('asChild renders the child instead of an <a>, with the classes merged (Link first)', () => {
    const { container } = render(
      <Link asChild color="neutral">
        <RouterLink to="/tokens" className="active">
          Tokens
        </RouterLink>
      </Link>,
    );
    const link = screen.getByRole('link', { name: 'Tokens' });
    expect(container.querySelectorAll('a')).toHaveLength(1);
    expect(link).toHaveAttribute('data-router');
    expect(link).toHaveAttribute('href', '/tokens');
    expect(link.className).toBe('bit-link bit-neutral active');
  });

  it('asChild merges style (the child wins), chains handlers (child first) and composes refs', async () => {
    const calls: string[] = [];
    const linkRef = createRef<HTMLAnchorElement>();
    const childRef = createRef<HTMLAnchorElement>();
    render(
      <Link
        asChild
        ref={linkRef}
        style={{ color: 'red', marginTop: 4 }}
        onClick={(event) => {
          event.preventDefault();
          calls.push('link');
        }}
      >
        <RouterLink to="/tokens" ref={childRef} style={{ color: 'blue' }} onClick={() => calls.push('child')}>
          Tokens
        </RouterLink>
      </Link>,
    );
    const link = screen.getByRole('link');
    expect(link.style.color).toBe('blue');
    expect(link.style.marginTop).toBe('4px');
    await userEvent.click(link);
    expect(calls).toEqual(['child', 'link']);
    expect(linkRef.current).toBe(link);
    expect(childRef.current).toBe(link);
  });

  it('asChild throws with no child, and with two children', () => {
    const message = '[bit] Link asChild needs exactly one child element.';
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Link asChild />)).toThrow(message);
    expect(() =>
      render(
        <Link asChild>
          <a href="/a">A</a>
          <a href="/b">B</a>
        </Link>,
      ),
    ).toThrow(message);
    vi.restoreAllMocks();
  });

  it.each(['primary', 'neutral'] as const)('has no accessibility violations (%s, plain and asChild)', async (color) => {
    const { container } = render(
      <p>
        Read the{' '}
        <Link href="/install" color={color}>
          install guide
        </Link>{' '}
        or the{' '}
        <Link asChild color={color}>
          <RouterLink to="/tokens">tokens</RouterLink>
        </Link>
        .
      </p>,
    );
    await expectNoA11yViolations(container);
  });
});
```

In `packages/react/src/index.test.tsx`:
- Change the second row of the component list to `'Field', 'Input', 'Select', 'Switch', 'Link',`.
- After the `'exports the logo eras and storage key but not the page-era internals'` test, add:

```ts

  it('keeps Slot internal: Link asChild uses it, the package does not export it', () => {
    for (const name of ['Slot', 'composeRefs', 'mergeProps']) expect(name in lib).toBe(false);
  });
```

- [ ] **Step 6: Run them and confirm they fail**

Run: `pnpm --filter @bit-ds/react test`
Expected: FAIL, `Failed to resolve import "./Link"`, and the export list lacks Link.

- [ ] **Step 7: Write Link and export it**

Create `packages/react/src/components/Link/Link.tsx`:

```tsx
import { forwardRef } from 'react';
import type { AnchorHTMLAttributes } from 'react';
import { toClasses } from '../../system/toClasses';
import { Slot } from '../../system/Slot';

/** Only these two pass text contrast in both modes, so Link has no full color axis. */
const colors = ['primary', 'neutral'] as const;

export interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'color'> {
  /** `primary` reads the link tokens (and a visited color); `neutral` is body text. Class: `bit-{color}`. */
  color?: (typeof colors)[number];
  /** Render the single child (a router link, say) with Link's classes and props merged in, instead of an `<a>`. */
  asChild?: boolean;
}

/** A bold, underlined text link. */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { color = 'primary', asChild = false, className, ...rest },
  ref,
) {
  const classes = toClasses('link', [{ name: 'color', allowed: colors, value: color }], className);
  if (asChild) return <Slot ref={ref} className={classes} {...rest} />;
  return <a ref={ref} className={classes} {...rest} />;
});
```

In `packages/react/src/index.ts`, after the Switch exports, add:

```ts

export { Link } from './components/Link/Link';
export type { LinkProps } from './components/Link/Link';
```

In `packages/react/scripts/verify-dist.mjs`:
- Change `EXPECTED`'s second row to `'Field', 'Input', 'Select', 'Switch', 'Link',`.
- Add `'LinkProps'` to the type-name list.
- Add `'.bit-link'` to the needle list.

In `scripts/smoke-consumer.mjs`, change the same `EXPECTED` row.

- [ ] **Step 8: Run the react tests with coverage and confirm they pass**

Run: `pnpm test:coverage`
Expected: `Tests  247 passed (247)`, with `100%` in all four columns.

- [ ] **Step 9: Add the gallery manifest**

The route smoke test (`routes.test.tsx` and `routes.dark.test.tsx`) iterates `MANIFESTS`, and the contract test requires a manifest for every component export. So the gallery is red until this step. Run `pnpm build && pnpm --filter @bit-ds/gallery test` first.
Expected: FAIL, `every component export has a manifest or is a documented part` → `['Link']`.

Create `apps/gallery/src/manifests/link.ts`:

```ts
import { Link } from '@bit-ds/react';
import type { Manifest } from './types';

export const link: Manifest = {
  name: 'Link',
  slug: 'link',
  group: 'components',
  component: Link,
  description: 'A bold, underlined text link. primary or neutral; asChild lends the look to a router link.',
  controls: [
    { kind: 'axis', prop: 'color', values: ['primary', 'neutral'], default: 'primary' },
    { kind: 'text', prop: 'href', default: 'https://github.com/doosemavis/bit-design-system', alwaysPrint: true },
  ],
  children: 'Read the install guide',
  presets: [{ label: 'Neutral', state: { color: 'neutral' } }],
};
```

In `apps/gallery/src/manifests/registry.ts`, add `Link,` after `Input,` in both lists. In `apps/gallery/src/manifests/index.ts`, add `import { link } from './link';` after the `switchManifest` import, and insert `link` after `modeToggle` in `MANIFESTS`. Link is in Components, which lists before Forms.

- [ ] **Step 10: Run the gallery tests and confirm they pass**

Run: `pnpm build && pnpm --filter @bit-ds/gallery test`
Expected: PASS, `Tests  132 passed (132)`.

- [ ] **Step 11: Run every gate**

Run: `pnpm build && pnpm verify && pnpm typecheck && pnpm lint && pnpm test && pnpm test:coverage && pnpm smoke && pnpm storybook:build`
Expected:
- `dist OK: 17 components`
- core `355`, react `247`, gallery `132` passed
- coverage `100%`
- `consumer OK: 17 components`
- Storybook builds

- [ ] **Step 12: Commit**

```bash
git add packages/core/src packages/react/src packages/react/scripts/verify-dist.mjs scripts/smoke-consumer.mjs apps/gallery/src
git commit -m "feat: Link in primary and neutral, with asChild through the internal Slot

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Code and CodeBlock: the tokenizer moves in from the gallery, and the copy states

**Files:**
- Create:
  - `packages/core/src/components/code.css` and `code-block.css`
  - `packages/core/src/__tests__/components/code.test.ts` and `code-block.test.ts`
- Modify:
  - `packages/core/src/index.css` (after `link.css`)
  - `packages/core/src/system/reset.css` (the `pre` rule)
  - `packages/core/src/__tests__/system.test.ts` (`INK_EXCEPTIONS`)
  - `packages/core/src/__tests__/contrast.test.ts`
- Create:
  - `packages/react/src/components/CodeBlock/tokenize.ts` and `tokenize.test.ts`
  - `packages/react/src/components/CodeBlock/CopyButton.tsx`, `CodeBlock.tsx` and `CodeBlock.test.tsx`
  - `packages/react/src/components/Code/Code.tsx` and `Code.test.tsx`
- Modify: `packages/react/src/index.ts`, `index.test.tsx`, `packages/react/scripts/verify-dist.mjs`, `scripts/smoke-consumer.mjs`
- Create: `apps/gallery/src/manifests/code.ts` and `codeBlock.ts`
- Delete: `apps/gallery/src/code/highlight.ts` and `highlight.test.ts` (their cases move into `tokenize.test.ts`)
- Modify:
  - `apps/gallery/src/manifests/types.ts` (`SelectControl.alwaysPrint`)
  - `apps/gallery/src/code/toJsx.ts` (`'select'` case)
  - `apps/gallery/src/manifests/registry.ts`, `index.ts`
  - `apps/gallery/src/code/toJsx.test.ts`

**Interfaces:**
- Consumes `CODE_KINDS` from `@bit-ds/core/tokens`, `--bit-color-accent`, the `--bit-code-*` tokens, and `INK_EXCEPTIONS` (Task 1).
- Produces, in `packages/react/src/components/CodeBlock/tokenize.ts` (internal, unexported from the package):
  - `type CodeKind`
  - `interface CodeToken { kind: CodeKind; text: string }`
  - `CODE_LANGUAGES = ['jsx', 'html', 'css', 'shell'] as const` and `type CodeLanguage`
  - `tokenize(code: string, language: CodeLanguage): CodeToken[]`
- Produces, in `CopyButton.tsx` (internal): `CopyButton({ code })` and `COPY_RESET_MS = 2000`.
- Produces `Code` (`CodeProps`) and `CodeBlock` (`CodeBlockProps`: `code`, `language`, `copy?`), plus the type `CodeLanguage`, all exported. Task 7 renders `CodeBlock` in the gallery.
- Produces, in the gallery: `SelectControl.alwaysPrint?: boolean`.

- [ ] **Step 1: Write the failing core tests**

Create `packages/core/src/__tests__/components/code.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { block, readCss } from '../css';

describe('components/code.css', () => {
  const css = readCss('components/code.css');

  it('inline code is a mono chip at 0.9em without ligatures, in the regular mono weight', () => {
    const root = block(css, '.bit-code')!;
    for (const line of [
      'font-family: var(--bit-font-mono);',
      'font-size: 0.9em;',
      'font-weight: 400;',
      'font-variant-ligatures: none;',
      'padding: 1px 6px;',
      'border-radius: var(--bit-radius-6px);',
      'background: var(--bit-color-neutral-soft);',
      'color: var(--bit-color-text);',
    ]) {
      expect(root).toContain(line);
    }
  });

  it('the border is 2px in the mode accent (decision 3)', () => {
    expect(block(css, '.bit-code')).toContain('border: 2px solid var(--bit-color-accent);');
  });
});
```

Create `packages/core/src/__tests__/components/code-block.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { CODE_KINDS } from '../../tokens';
import { VISUALLY_HIDDEN, block, readCss } from '../css';

describe('components/code-block.css', () => {
  const css = readCss('components/code-block.css');

  it('the panel is Ink night with a 3px accent border, the mid shadow and a 10px radius', () => {
    const panel = block(css, '.bit-code__block')!;
    for (const line of [
      'background: var(--bit-code-bg);',
      'color: var(--bit-code-text);',
      'border: var(--bit-border-width) solid var(--bit-color-accent);',
      'box-shadow: var(--bit-shadow-md);',
      'border-radius: var(--bit-radius-10px);',
      'overflow: hidden;',
    ]) {
      expect(panel).toContain(line);
    }
  });

  it('the bar has a 2px accent rule; the language is pixel type at 11px in the punct color', () => {
    expect(block(css, '.bit-code__bar')).toContain('border-bottom: 2px solid var(--bit-color-accent);');
    const lang = block(css, '.bit-code__lang')!;
    expect(lang).toContain('font-family: var(--bit-font-pixel);');
    expect(lang).toContain('font-size: var(--bit-text-11px);');
    expect(lang).toContain('color: var(--bit-code-punct);');
  });

  it('the pre scrolls sideways in 13px mono at line-height 1.6, without ligatures', () => {
    const pre = block(css, '.bit-code__pre')!;
    for (const line of [
      'overflow-x: auto;',
      'font-family: var(--bit-font-mono);',
      'font-size: var(--bit-text-13px);',
      'font-weight: 400;',
      'line-height: 1.6;',
      'font-variant-ligatures: none;',
    ]) {
      expect(pre).toContain(line);
    }
    expect(block(css, '.bit-code__pre code')).toContain('font: inherit;');
  });

  it.each(CODE_KINDS)('tokens of kind %s read --bit-code-%s', (kind) => {
    expect(block(css, `.bit-code__token[data-kind="${kind}"]`)).toContain(`color: var(--bit-code-${kind});`);
  });

  it('comments are italic', () => {
    expect(block(css, '.bit-code__token[data-kind="comment"]')).toContain('font-style: italic;');
  });

  it('the Copy button is light with a 2px ink border and a 6px radius; failed is danger-soft with body text', () => {
    const copy = block(css, '.bit-code__copy')!;
    expect(copy).toContain('border: 2px solid var(--bit-color-ink);');
    expect(copy).toContain('border-radius: var(--bit-radius-6px);');
    expect(copy).toContain('background: var(--bit-code-text);');
    expect(copy).toContain('color: var(--bit-color-ink);');
    const failed = block(css, '.bit-code__copy[data-state="failed"]')!;
    expect(failed).toContain('background: var(--bit-color-danger-soft);');
    expect(failed).toContain('color: var(--bit-color-text);');
  });

  it('the status line is visually hidden but still announced', () => {
    const status = block(css, '.bit-code__status')!;
    for (const line of VISUALLY_HIDDEN) expect(status).toContain(line);
  });
});

describe('system/reset.css (CodeBlock ring)', () => {
  it('pulls the pre’s ring 2px inside it, so the panel’s overflow: hidden cannot clip it', () => {
    expect(block(readCss('system/reset.css'), '.bit-code__pre:focus-visible')).toContain(
      'outline-offset: calc(-1 * var(--bit-focus-ring-width) - 2px);',
    );
  });
});
```

In `packages/core/src/__tests__/contrast.test.ts`, inside `describe.each(MODES)`, before `'PR2: field error text is readable on the page and on surfaces'`, add:

```ts
  it('PR2: the Copy button label (ink on the code text color) is readable', () => {
    expect(contrastRatio(resolveColor('--bit-color-ink'), resolveColor('--bit-code-text'))).toBeGreaterThanOrEqual(AA_TEXT);
  });

```

- [ ] **Step 2: Run them and confirm they fail**

Run: `pnpm --filter @bit-ds/core test`
Expected: FAIL. `code.css` and `code-block.css` don't exist, and the reset rule is missing. The new contrast test already passes (15.31:1).

- [ ] **Step 3: Write the CSS, the pre ring rule and the second ink exception**

Create `packages/core/src/components/code.css`:

```css
/* Code: inline code, a small mono chip in running text. The border follows the mode accent
   (violet in light, yellow in dark; decision 3). */
.bit-code {
  padding: 1px 6px;
  font-family: var(--bit-font-mono);
  font-size: 0.9em;
  /* JetBrains Mono ships 400 and 700; the page's 600 would snap to bold. */
  font-weight: 400;
  font-variant-ligatures: none;
  color: var(--bit-color-text);
  background: var(--bit-color-neutral-soft);
  border: 2px solid var(--bit-color-accent);
  border-radius: var(--bit-radius-6px);
}
```

Create `packages/core/src/components/code-block.css`:

```css
/* CodeBlock: the Ink-night panel (dark in both modes) with editor colors, a language bar and a Copy
   button. The border and the bar's rule follow the mode accent (decision 3). The pre's focus ring is
   pulled inside the panel by system/reset.css, so overflow: hidden can't clip it. */
.bit-code__block {
  overflow: hidden;
  color: var(--bit-code-text);
  background: var(--bit-code-bg);
  border: var(--bit-border-width) solid var(--bit-color-accent);
  border-radius: var(--bit-radius-10px);
  box-shadow: var(--bit-shadow-md);
}

.bit-code__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--bit-space-8px);
  padding: var(--bit-space-8px) var(--bit-space-8px) var(--bit-space-8px) var(--bit-space-16px);
  border-bottom: 2px solid var(--bit-color-accent);
}

.bit-code__lang {
  font-family: var(--bit-font-pixel);
  font-size: var(--bit-text-11px);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--bit-code-punct);
}

/* A small light button on the dark bar, edged in ink like the board. */
.bit-code__copy {
  padding: var(--bit-space-4px) var(--bit-space-8px);
  font-family: var(--bit-font-body);
  font-size: var(--bit-text-13px);
  font-weight: var(--bit-weight-bold);
  line-height: 1;
  color: var(--bit-color-ink);
  background: var(--bit-code-text);
  border: 2px solid var(--bit-color-ink);
  border-radius: var(--bit-radius-6px);
  cursor: pointer;
}

/* states are attributes, never classes */
.bit-code__copy[data-state="failed"] {
  color: var(--bit-color-text);
  background: var(--bit-color-danger-soft);
}

.bit-code__status {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

.bit-code__pre {
  margin: 0;
  padding: var(--bit-space-12px) var(--bit-space-16px);
  overflow-x: auto;
  font-family: var(--bit-font-mono);
  font-size: var(--bit-text-13px);
  /* JetBrains Mono ships 400 and 700; the page's 600 would snap to bold. */
  font-weight: 400;
  line-height: 1.6;
  font-variant-ligatures: none;
  white-space: pre;
}

.bit-code__pre code {
  font: inherit;
}

/* One color per CODE_KINDS entry. Plain text is a bare string and takes the panel's text color. */
.bit-code__token[data-kind="text"] { color: var(--bit-code-text); }
.bit-code__token[data-kind="keyword"] { color: var(--bit-code-keyword); }
.bit-code__token[data-kind="string"] { color: var(--bit-code-string); }
.bit-code__token[data-kind="tag"] { color: var(--bit-code-tag); }
.bit-code__token[data-kind="component"] { color: var(--bit-code-component); }
.bit-code__token[data-kind="attr"] { color: var(--bit-code-attr); }
.bit-code__token[data-kind="punct"] { color: var(--bit-code-punct); }
.bit-code__token[data-kind="comment"] { color: var(--bit-code-comment); font-style: italic; }
.bit-code__token[data-kind="number"] { color: var(--bit-code-number); }
.bit-code__token[data-kind="prop"] { color: var(--bit-code-prop); }
```

In `packages/core/src/index.css`, after `@import "./components/link.css";`, add:

```css
@import "./components/code.css";
@import "./components/code-block.css";
```

In `packages/core/src/system/reset.css`, insert above the comment `/* Programmatic focus targets (a page heading …`:

```css
/* CodeBlock's scrollable pre sits inside a panel with overflow: hidden, which would clip a ring drawn
   outside it. Pull the ring 2px inside the pre instead, onto the code background. */
.bit-code__pre:focus-visible {
  outline-offset: calc(-1 * var(--bit-focus-ring-width) - 2px);
}

```

In `packages/core/src/__tests__/system.test.ts`, add this entry to `INK_EXCEPTIONS`, after the `'switch.css'` entry:

```ts
  // The Copy button is a light button on the dark code bar, edged and labelled in ink (board 1).
  'code-block.css': ['.bit-code__copy'],
```

- [ ] **Step 4: Run the core tests and confirm they pass**

Run: `pnpm --filter @bit-ds/core test`
Expected: PASS, `Tests  388 passed (388)`.

- [ ] **Step 5: Write the failing tokenizer tests**

Create `packages/react/src/components/CodeBlock/tokenize.test.ts`. The gallery's two `highlight.test.ts` cases are the first and the seventh `jsx` tests here.

```ts
import { describe, expect, it } from 'vitest';
import { CODE_KINDS } from '@bit-ds/core/tokens';
import { CODE_LANGUAGES, tokenize } from './tokenize';
import type { CodeLanguage, CodeToken } from './tokenize';

/** Tokens as [kind, text] pairs, which read better in expectations. */
const pairs = (code: string, language: CodeLanguage) => tokenize(code, language).map((t) => [t.kind, t.text]);
const kindOf = (code: string, language: CodeLanguage, text: string) =>
  tokenize(code, language).find((t) => t.text === text)?.kind;

describe('tokenize: jsx', () => {
  it('splits a JSX element into punct, component, attr, string and text', () => {
    expect(pairs('<Button color="danger" loading>Save</Button>', 'jsx')).toEqual([
      ['punct', '<'],
      ['component', 'Button'],
      ['text', ' '],
      ['attr', 'color'],
      ['punct', '='],
      ['string', '"danger"'],
      ['text', ' '],
      ['attr', 'loading'],
      ['punct', '>'],
      ['text', 'Save'],
      ['punct', '</'],
      ['component', 'Button'],
      ['punct', '>'],
    ]);
  });

  it('colors the import line: keywords, the imported component, the module string', () => {
    expect(pairs(`import { Button } from '@bit-ds/react';`, 'jsx')).toEqual([
      ['keyword', 'import'],
      ['text', ' '],
      ['punct', '{'],
      ['text', ' '],
      ['component', 'Button'],
      ['text', ' '],
      ['punct', '}'],
      ['text', ' '],
      ['keyword', 'from'],
      ['text', ' '],
      ['string', "'@bit-ds/react'"],
      ['punct', ';'],
    ]);
  });

  it('a braced attribute value is code: numbers, punct and nested braces', () => {
    expect(pairs('<Stack gap={16} style={{ marginTop: 4 }} />', 'jsx')).toEqual([
      ['punct', '<'],
      ['component', 'Stack'],
      ['text', ' '],
      ['attr', 'gap'],
      ['punct', '='],
      ['punct', '{'],
      ['number', '16'],
      ['punct', '}'],
      ['text', ' '],
      ['attr', 'style'],
      ['punct', '='],
      ['punct', '{'],
      ['punct', '{'],
      ['text', ' '],
      ['prop', 'marginTop'],
      ['punct', ':'],
      ['text', ' '],
      ['number', '4'],
      ['text', ' '],
      ['punct', '}'],
      ['punct', '}'],
      ['text', ' '],
      ['punct', '/>'],
    ]);
  });

  it('lowercase elements are tags; children text stays plain, even capitalized words', () => {
    expect(pairs('<p>Hello World</p>', 'jsx')).toEqual([
      ['punct', '<'],
      ['tag', 'p'],
      ['punct', '>'],
      ['text', 'Hello World'],
      ['punct', '</'],
      ['tag', 'p'],
      ['punct', '>'],
    ]);
  });

  it('children can hold expressions, nested elements and fragments', () => {
    expect(pairs('<><b>{n}</b> < 3</>', 'jsx')).toEqual([
      ['punct', '<'],
      ['punct', '>'],
      ['punct', '<'],
      ['tag', 'b'],
      ['punct', '>'],
      ['punct', '{'],
      ['text', 'n'],
      ['punct', '}'],
      ['punct', '</'],
      ['tag', 'b'],
      ['punct', '>'],
      ['text', ' < 3'],
      ['punct', '</'],
      ['punct', '>'],
    ]);
  });

  it('comments, numbers and keywords in plain code', () => {
    expect(pairs('// note\nconst n = 1.5; /* done */', 'jsx')).toEqual([
      ['comment', '// note'],
      ['text', '\n'],
      ['keyword', 'const'],
      ['text', ' n '],
      ['punct', '='],
      ['text', ' '],
      ['number', '1.5'],
      ['punct', ';'],
      ['text', ' '],
      ['comment', '/* done */'],
    ]);
  });

  it('handles class attributes, self-closing tags, braces and import lines (the gallery highlighter cases)', () => {
    const code = `import { Button } from '@bit-ds/react';\n\n<span class="bit-badge bit-md" data-x="" />\n<BitLogo era={32} />`;
    const tokens = tokenize(code, 'jsx');
    expect(tokens.map((t) => t.text).join('')).toBe(code);
    expect(tokens).toContainEqual({ kind: 'string', text: "'@bit-ds/react'" });
    expect(tokens).toContainEqual({ kind: 'attr', text: 'data-x' });
    expect(tokens).toContainEqual({ kind: 'punct', text: '/>' });
    expect(tokens).toContainEqual({ kind: 'component', text: 'BitLogo' });
    expect(tokens).toContainEqual({ kind: 'number', text: '32' });
  });

  it('a stray closing brace or an unknown character is still kept', () => {
    expect(pairs('} ~', 'jsx')).toEqual([
      ['punct', '}'],
      ['text', ' ~'],
    ]);
    expect(pairs('<a ~>', 'jsx')).toEqual([
      ['punct', '<'],
      ['tag', 'a'],
      ['text', ' ~'],
      ['punct', '>'],
    ]);
  });
});

describe('tokenize: strings', () => {
  it.each(CODE_LANGUAGES.filter((l) => l !== 'html'))('%s: an escaped quote does not end the string', (language) => {
    expect(kindOf(`x 'it\\'s' y`, language, `'it\\'s'`)).toBe('string');
    expect(kindOf(`x "say \\"hi\\"" y`, language, `"say \\"hi\\""`)).toBe('string');
  });

  it('an unclosed string runs to the end of its line, not past it', () => {
    expect(pairs(`a = 'oops\nb`, 'jsx')).toEqual([
      ['text', 'a '],
      ['punct', '='],
      ['text', ' '],
      ['string', "'oops"],
      ['text', '\nb'],
    ]);
  });

  it('a template string may span lines', () => {
    expect(kindOf('x = `a\nb`', 'jsx', '`a\nb`')).toBe('string');
  });
});

describe('tokenize: html', () => {
  it('splits markup into tags, attributes, strings and text; comments are comments', () => {
    expect(pairs('<div class="bit-card"><!-- hi -->Stats</div>', 'html')).toEqual([
      ['punct', '<'],
      ['tag', 'div'],
      ['text', ' '],
      ['attr', 'class'],
      ['punct', '='],
      ['string', '"bit-card"'],
      ['punct', '>'],
      ['comment', '<!-- hi -->'],
      ['text', 'Stats'],
      ['punct', '</'],
      ['tag', 'div'],
      ['punct', '>'],
    ]);
  });

  it('self-closing tags, a lone < in text, and stray characters in a tag', () => {
    expect(pairs('a < b <br ~/>', 'html')).toEqual([
      ['text', 'a < b '],
      ['punct', '<'],
      ['tag', 'br'],
      ['text', ' ~'],
      ['punct', '/>'],
    ]);
  });
});

describe('tokenize: css', () => {
  it('selectors are tags, pseudo-classes and functions keywords, properties props, values numbers', () => {
    expect(pairs('.bit-button:hover {\n  height: 40px;\n  border: var(--bit-line) !important;\n}', 'css')).toEqual([
      ['tag', '.bit-button'],
      ['keyword', ':hover'],
      ['text', ' '],
      ['punct', '{'],
      ['text', '\n  '],
      ['prop', 'height'],
      ['punct', ':'],
      ['text', ' '],
      ['number', '40px'],
      ['punct', ';'],
      ['text', '\n  '],
      ['prop', 'border'],
      ['punct', ':'],
      ['text', ' '],
      ['keyword', 'var'],
      ['punct', '('],
      ['prop', '--bit-line'],
      ['punct', ')'],
      ['text', ' '],
      ['keyword', '!important'],
      ['punct', ';'],
      ['text', '\n'],
      ['punct', '}'],
    ]);
  });

  it('at-rules, comments, strings, hex colors, custom properties and plain words', () => {
    expect(pairs('@media x { /* c */ --a: #FFF "s" auto ~ }', 'css')).toEqual([
      ['keyword', '@media'],
      ['text', ' '],
      ['tag', 'x'],
      ['text', ' '],
      ['punct', '{'],
      ['text', ' '],
      ['comment', '/* c */'],
      ['text', ' '],
      ['prop', '--a'],
      ['punct', ':'],
      ['text', ' '],
      ['number', '#FFF'],
      ['text', ' '],
      ['string', '"s"'],
      ['text', ' auto ~ '],
      ['punct', '}'],
    ]);
  });

  it('a stray closing brace never drops below the top level', () => {
    expect(pairs('} a', 'css')).toEqual([
      ['punct', '}'],
      ['text', ' '],
      ['tag', 'a'],
    ]);
  });
});

describe('tokenize: shell', () => {
  it('the first word of each command is a keyword; flags are attrs; comments only start a word', () => {
    expect(pairs('pnpm add @bit-ds/react --save-dev # dev\nnpm i a#b', 'shell')).toEqual([
      ['keyword', 'pnpm'],
      ['text', ' add @bit-ds/react '],
      ['attr', '--save-dev'],
      ['text', ' '],
      ['comment', '# dev'],
      ['text', '\n'],
      ['keyword', 'npm'],
      ['text', ' i a#b'],
    ]);
  });

  it('pipes and && start a new command; redirects do not; variables, numbers and strings', () => {
    expect(pairs('a 3 | b $HOME && c "x" > 5 $', 'shell')).toEqual([
      ['keyword', 'a'],
      ['text', ' '],
      ['number', '3'],
      ['text', ' '],
      ['punct', '|'],
      ['text', ' '],
      ['keyword', 'b'],
      ['text', ' '],
      ['prop', '$HOME'],
      ['text', ' '],
      ['punct', '&&'],
      ['text', ' '],
      ['keyword', 'c'],
      ['text', ' '],
      ['string', '"x"'],
      ['text', ' '],
      ['punct', '>'],
      ['text', ' '],
      ['number', '5'],
      ['text', ' $'],
    ]);
  });

  it('at the start of a command, a flag-like or numeric word is the command', () => {
    expect(pairs('--version\n42', 'shell')).toEqual([
      ['keyword', '--version'],
      ['text', '\n'],
      ['keyword', '42'],
    ]);
  });
});

describe('tokenize: edges', () => {
  it.each(CODE_LANGUAGES)('%s: empty code is no tokens', (language) => {
    expect(tokenize('', language)).toEqual([]);
  });

  it('an unknown language (an untyped caller) is one plain-text token, never a crash', () => {
    // @ts-expect-error ts is not a supported language
    expect(tokenize('const a = 1;', 'ts')).toEqual([{ kind: 'text', text: 'const a = 1;' }]);
    // @ts-expect-error a prototype key is not a language either
    expect(tokenize('x', 'constructor')).toEqual([{ kind: 'text', text: 'x' }]);
    // @ts-expect-error ts is not a supported language
    expect(tokenize('', 'ts')).toEqual([]);
  });
});

/** A seeded PRNG (mulberry32), so a failing case reproduces from its seed. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The awkward pieces code is made of: quotes, escapes, unclosed openers, comment markers, unicode. */
const PIECES = [
  '<', '</', '>', '/>', '<>', '{', '}', '"', "'", '`', '\\', '\\"', "\\'", '=', ':', ';', '#', '$', '${', '-', '--',
  '//', '/*', '*/', '<!--', '-->', '@media', '.', '(', ')', '!important', ' ', '\n', '\t', '&&', '|', '>',
  'a', 'Button', 'div', 'class', 'import', 'from', 'var', '42', '3.5px', '#fff', 'é', '🙂',
];

function randomCode(next: () => number): string {
  const length = Math.floor(next() * 48);
  return Array.from({ length }, () => PIECES[Math.floor(next() * PIECES.length)]).join('');
}

const kinds = new Set<string>(CODE_KINDS);

/** The invariant and the token rules every output must keep. */
function expectWellFormed(code: string, tokens: readonly CodeToken[]): void {
  expect(tokens.map((t) => t.text).join('')).toBe(code);
  for (const [index, t] of tokens.entries()) {
    expect(t.text.length).toBeGreaterThan(0);
    expect(kinds.has(t.kind)).toBe(true);
    if (index > 0 && t.kind === 'text') expect(tokens[index - 1]!.kind).not.toBe('text');
  }
}

describe('tokenize: the invariant (property test)', () => {
  it.each(CODE_LANGUAGES)('%s: joining the tokens gives back any input exactly, over 400 random inputs', (language) => {
    const next = seeded(2026_10_03);
    for (let run = 0; run < 400; run += 1) {
      const code = randomCode(next);
      expectWellFormed(code, tokenize(code, language));
    }
  });

  it.each(CODE_LANGUAGES)('%s: holds for every piece alone and every pair of pieces', (language) => {
    for (const a of PIECES) {
      expectWellFormed(a, tokenize(a, language));
      for (const b of PIECES) expectWellFormed(a + b, tokenize(a + b, language));
    }
  });
});
```

- [ ] **Step 6: Run it and confirm it fails**

Run: `pnpm --filter @bit-ds/react test -- src/components/CodeBlock`
Expected: FAIL, `Failed to resolve import "./tokenize"`.

- [ ] **Step 7: Write the tokenizer**

Create `packages/react/src/components/CodeBlock/tokenize.ts`. It grows the gallery's `highlight.ts` (JSX and HTML only, five kinds) into four languages and the ten `CODE_KINDS`, and skips escaped quotes:

```ts
import type { CODE_KINDS } from '@bit-ds/core/tokens';

/** One syntax color; each reads `--bit-code-{kind}`. */
export type CodeKind = (typeof CODE_KINDS)[number];
export interface CodeToken {
  kind: CodeKind;
  text: string;
}
export const CODE_LANGUAGES = ['jsx', 'html', 'css', 'shell'] as const;
export type CodeLanguage = (typeof CODE_LANGUAGES)[number];

/** A pattern anchored at the cursor and the kind its match becomes. No pattern can match empty. */
type Rule = readonly [kind: CodeKind, pattern: RegExp];
/** One step of a lexer: the token at `at` and the state after it. The token is never empty. */
type Step<S> = (code: string, at: number, state: S) => readonly [CodeToken, S];

/** Single, double or backtick quoted, skipping escaped quotes. An unclosed ' or " string ends at the line. */
const STRING = /^(?:'(?:\\.|[^'\\\n])*'?|"(?:\\.|[^"\\\n])*"?|`(?:\\[\s\S]|[^`\\])*`?)/;
const BLOCK_COMMENT = /^\/\*[\s\S]*?(?:\*\/|$)/;

const token = (kind: CodeKind, text: string): CodeToken => ({ kind, text });

/** The first rule that matches at the start of `rest`, else its first character as plain text. */
function match(rules: readonly Rule[], rest: string): CodeToken {
  for (const [kind, pattern] of rules) {
    const found = pattern.exec(rest);
    if (found) return token(kind, found[0]);
  }
  return token('text', rest[0]!);
}

/** Runs a lexer over the code. Adjacent plain text merges, so the markup stays small. */
function run<S>(code: string, start: S, step: Step<S>): CodeToken[] {
  const tokens: CodeToken[] = [];
  let state = start;
  for (let at = 0; at < code.length; ) {
    const [next, after] = step(code, at, state);
    const last = tokens[tokens.length - 1];
    if (last?.kind === 'text' && next.kind === 'text') tokens[tokens.length - 1] = token('text', last.text + next.text);
    else tokens.push(next);
    state = after;
    at += next.text.length;
  }
  return tokens;
}

/** True when the character before `at` opened a tag (`<` or `</`), so a name here is the tag name. */
function afterTagOpen(code: string, at: number): boolean {
  return code[at - 1] === '<' || (code[at - 1] === '/' && code[at - 2] === '<');
}

// ---------------------------------------------------------------------------------------- JSX

type JsxMode = 'js' | 'tag' | 'closeTag' | 'children';

const JS_RULES: readonly Rule[] = [
  ['comment', /^\/\/[^\n]*/],
  ['comment', BLOCK_COMMENT],
  ['string', STRING],
  ['number', /^\d+(?:\.\d+)?/],
  ['keyword', /^(?:import|from|export|default|const|let|var|function|return|if|else|new|typeof|as|type|interface|true|false|null|undefined)\b/],
  ['component', /^[A-Z][\w$]*/],
  ['prop', /^[A-Za-z_$][\w$]*(?=\s*:)/],
  ['text', /^[A-Za-z_$][\w$]*/],
  ['punct', /^[()[\];,.:=+\-*/!?&|<>%]/],
];

const TAG_RULES: readonly Rule[] = [
  ['string', STRING],
  ['attr', /^[A-Za-z_:][\w:.-]*/],
  ['punct', /^=/],
];

/** The mode stack minus its top `count` entries, never empty. */
function pop(modes: readonly JsxMode[], count = 1): JsxMode[] {
  return modes.length > count ? modes.slice(0, -count) : ['js'];
}

function jsxTagStep(code: string, at: number, modes: readonly JsxMode[]): readonly [CodeToken, readonly JsxMode[]] {
  const rest = code.slice(at);
  const name = /^[A-Za-z][\w.-]*/.exec(rest);
  if (name && afterTagOpen(code, at)) return [token(/^[A-Z]/.test(name[0]) ? 'component' : 'tag', name[0]), modes];
  const close = /^\/?>/.exec(rest);
  if (!close) return [match(TAG_RULES, rest), modes];
  if (modes[modes.length - 1] === 'closeTag') return [token('punct', close[0]), pop(modes, 2)];
  return [token('punct', close[0]), close[0] === '/>' ? pop(modes) : [...pop(modes), 'children']];
}

const jsxStep: Step<readonly JsxMode[]> = (code, at, modes) => {
  const rest = code.slice(at);
  const mode = modes[modes.length - 1];
  if (rest[0] === '{') return [token('punct', '{'), [...modes, 'js']];
  if (mode === 'tag' || mode === 'closeTag') return jsxTagStep(code, at, modes);
  if (mode === 'js' && rest[0] === '}') return [token('punct', '}'), pop(modes)];
  const open = /^<\/?(?=[A-Za-z>])/.exec(rest);
  if (open) return [token('punct', open[0]), [...modes, open[0] === '</' ? 'closeTag' : 'tag']];
  if (mode === 'children') return [token('text', /^[^<{]+/.exec(rest)?.[0] ?? rest[0]!), modes];
  return [match(JS_RULES, rest), modes];
};

// --------------------------------------------------------------------------------------- HTML

const HTML_TAG_RULES: readonly Rule[] = [
  ['string', STRING],
  ['attr', /^[A-Za-z_:@][\w:.-]*/],
  ['punct', /^=/],
];

const htmlStep: Step<boolean> = (code, at, inTag) => {
  const rest = code.slice(at);
  if (inTag) {
    const name = /^[A-Za-z][\w-]*/.exec(rest);
    if (name && afterTagOpen(code, at)) return [token('tag', name[0]), true];
    const close = /^\/?>/.exec(rest);
    if (close) return [token('punct', close[0]), false];
    return [match(HTML_TAG_RULES, rest), true];
  }
  const comment = /^<!--[\s\S]*?(?:-->|$)/.exec(rest);
  if (comment) return [token('comment', comment[0]), false];
  const open = /^<\/?(?=[A-Za-z])/.exec(rest);
  if (open) return [token('punct', open[0]), true];
  return [token('text', /^[^<]+/.exec(rest)?.[0] ?? rest[0]!), false];
};

// ---------------------------------------------------------------------------------------- CSS

const CSS_SELECTOR_RULES: readonly Rule[] = [
  ['keyword', /^@[\w-]+/],
  ['tag', /^[.#]?-?[A-Za-z_][\w-]*/],
  ['keyword', /^::?[\w-]+/],
  ['punct', /^[,>+~*()[\]=]/],
];

const CSS_DECLARATION_RULES: readonly Rule[] = [
  ['prop', /^-{0,2}[A-Za-z_][\w-]*(?=\s*:)/],
  ['prop', /^--[\w-]+/],
  ['keyword', /^[A-Za-z-]+(?=\()/],
  ['keyword', /^!important\b/],
  ['number', /^#[0-9A-Fa-f]{3,8}\b/],
  ['number', /^-?(?:\d*\.)?\d+(?:[a-z%]+)?/],
  ['text', /^[A-Za-z_][\w-]*/],
  ['punct', /^[:;,()/*+]/],
];

const cssStep: Step<number> = (code, at, depth) => {
  const rest = code.slice(at);
  const comment = BLOCK_COMMENT.exec(rest);
  if (comment) return [token('comment', comment[0]), depth];
  const string = STRING.exec(rest);
  if (string) return [token('string', string[0]), depth];
  if (rest[0] === '{') return [token('punct', '{'), depth + 1];
  if (rest[0] === '}') return [token('punct', '}'), Math.max(0, depth - 1)];
  return [match(depth > 0 ? CSS_DECLARATION_RULES : CSS_SELECTOR_RULES, rest), depth];
};

// -------------------------------------------------------------------------------------- shell

/** `atCommand`: the next word is a command (start of a line, or after a pipe, `;`, `&&` or `||`). */
const shellStep: Step<boolean> = (code, at, atCommand) => {
  const rest = code.slice(at);
  const wordStart = at === 0 || /\s/.test(code[at - 1]!);
  const comment = /^#[^\n]*/.exec(rest);
  if (comment && wordStart) return [token('comment', comment[0]), atCommand];
  if (rest[0] === '\n') return [token('text', '\n'), true];
  const space = /^[ \t]+/.exec(rest);
  if (space) return [token('text', space[0]), atCommand];
  const operator = /^(?:&&|\|\||[|;&<>])/.exec(rest);
  if (operator) return [token('punct', operator[0]), !/^[<>]$/.test(operator[0])];
  const string = STRING.exec(rest);
  if (string) return [token('string', string[0]), false];
  const variable = /^\$\{?[A-Za-z_]\w*\}?/.exec(rest);
  if (variable) return [token('prop', variable[0]), false];
  const flag = /^--?[A-Za-z][\w-]*/.exec(rest);
  if (flag && !atCommand) return [token('attr', flag[0]), false];
  const number = /^\d+\b/.exec(rest);
  if (number && !atCommand) return [token('number', number[0]), false];
  const word = /^[^\s'"`|;&<>$#]+/.exec(rest);
  if (word) return [token(atCommand ? 'keyword' : 'text', word[0]), false];
  return [token('text', rest[0]!), atCommand];
};

// ---------------------------------------------------------------------------------------------

const LEXERS = new Map<string, (code: string) => CodeToken[]>([
  ['jsx', (code) => run<readonly JsxMode[]>(code, ['js'], jsxStep)],
  ['html', (code) => run(code, false, htmlStep)],
  ['css', (code) => run(code, 0, cssStep)],
  ['shell', (code) => run(code, true, shellStep)],
]);

/**
 * Splits code into colored tokens. Not a parser: it only needs to pick a color per piece, and joining
 * the tokens' text always gives back the input exactly. An unknown language (from an untyped caller)
 * is one plain-text token.
 */
export function tokenize(code: string, language: CodeLanguage): CodeToken[] {
  const lex = LEXERS.get(language);
  if (!lex) return code === '' ? [] : [token('text', code)];
  return lex(code);
}
```

- [ ] **Step 8: Run the tokenizer tests and confirm they pass at 100%**

Run: `pnpm --filter @bit-ds/react test -- src/components/CodeBlock/tokenize && pnpm --filter @bit-ds/react exec vitest run --coverage --coverage.include=src/components/CodeBlock/tokenize.ts src/components/CodeBlock/tokenize.test.ts`
Expected: `Tests  34 passed (34)`, and the tokenizer's Statements, Branches, Functions and Lines are all `100%`.

- [ ] **Step 9: Write the failing CodeBlock and Code tests**

Create `packages/react/src/components/CodeBlock/CodeBlock.test.tsx`:

```tsx
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { CodeBlock } from './CodeBlock';
import { COPY_RESET_MS } from './CopyButton';
import { CODE_LANGUAGES } from './tokenize';
import { expectNoA11yViolations } from '../../test/a11y';

const JSX = `<Button color="danger">Delete</Button>`;

/** Replace navigator.clipboard for one test; `undefined` removes it. */
function stubClipboard(writeText: ((text: string) => Promise<void>) | undefined): void {
  Object.defineProperty(navigator, 'clipboard', {
    value: writeText ? { writeText } : undefined,
    configurable: true,
  });
}

/** Click, then let the clipboard promise settle and React apply the new state. */
async function click(element: HTMLElement): Promise<void> {
  await act(async () => {
    fireEvent.click(element);
  });
}

const copyButton = () => screen.getByRole('button');
const status = (container: HTMLElement) => container.querySelector('.bit-code__status')!;

afterEach(() => {
  Reflect.deleteProperty(navigator, 'clipboard');
  vi.useRealTimers();
});

describe('CodeBlock', () => {
  it('renders the block, the bar with the language and Copy, and a focusable labelled pre', () => {
    const { container } = render(<CodeBlock code={JSX} language="jsx" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toBe('bit-code__block');
    expect(root).toHaveAttribute('data-language', 'jsx');
    const bar = root.querySelector('.bit-code__bar')!;
    expect(bar.querySelector('.bit-code__lang')).toHaveTextContent('jsx');
    expect(copyButton()).toHaveAttribute('type', 'button');
    expect(copyButton()).toHaveAttribute('data-state', 'idle');
    expect(copyButton()).toHaveTextContent('Copy');
    expect(status(container)).toHaveAttribute('aria-live', 'polite');
    expect(status(container)).toBeEmptyDOMElement();
    const pre = root.querySelector('pre.bit-code__pre')!;
    expect(pre).toHaveAttribute('tabindex', '0');
    expect(pre).toHaveAttribute('aria-label', 'jsx code');
    expect(pre.firstElementChild!.tagName).toBe('CODE');
  });

  it('puts the ref, className and rest props on the root', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(<CodeBlock ref={ref} code="x" language="css" className="extra" data-testid="cb" />);
    const root = container.firstElementChild as HTMLElement;
    expect(ref.current).toBe(root);
    expect(root.className).toBe('bit-code__block extra');
    expect(root).toHaveAttribute('data-testid', 'cb');
  });

  it('colors tokens as spans with data-kind and leaves plain text bare', () => {
    const { container } = render(<CodeBlock code={JSX} language="jsx" />);
    const code = container.querySelector('pre code')!;
    const spans = [...code.querySelectorAll('span.bit-code__token')];
    expect(spans.map((s) => [s.getAttribute('data-kind'), s.textContent])).toEqual([
      ['punct', '<'],
      ['component', 'Button'],
      ['attr', 'color'],
      ['punct', '='],
      ['string', '"danger"'],
      ['punct', '>'],
      ['punct', '</'],
      ['component', 'Button'],
      ['punct', '>'],
    ]);
    const bare = [...code.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE).map((node) => node.textContent);
    expect(bare).toEqual([' ', 'Delete']);
  });

  it.each([
    ['jsx', `import { Button } from '@bit-ds/react';`, ['keyword', 'component', 'string']],
    ['html', '<div class="bit-card"><!-- x --></div>', ['tag', 'attr', 'string', 'comment']],
    ['css', '.bit-card { height: 40px; }', ['tag', 'prop', 'number']],
    ['shell', 'pnpm add @bit-ds/react # go', ['keyword', 'comment']],
  ] as const)('%s: the pre reads back the exact code, with its kinds colored', (language, code, kinds) => {
    const { container } = render(<CodeBlock code={code} language={language} />);
    expect(container.querySelector('pre')!.textContent).toBe(code);
    const seen = [...container.querySelectorAll('[data-kind]')].map((s) => s.getAttribute('data-kind'));
    for (const kind of kinds) expect(seen).toContain(kind);
  });

  it('copies the code: "Copied" on the button and in the status, then "Copy" again after 2000ms', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn(() => Promise.resolve());
    stubClipboard(writeText);
    const { container } = render(<CodeBlock code={JSX} language="jsx" />);
    await click(copyButton());
    expect(writeText).toHaveBeenCalledWith(JSX);
    expect(copyButton()).toHaveAttribute('data-state', 'copied');
    expect(copyButton()).toHaveTextContent('Copied');
    expect(status(container)).toHaveTextContent('Copied');
    act(() => vi.advanceTimersByTime(COPY_RESET_MS - 1));
    expect(copyButton()).toHaveAttribute('data-state', 'copied');
    act(() => vi.advanceTimersByTime(1));
    expect(copyButton()).toHaveAttribute('data-state', 'idle');
    expect(copyButton()).toHaveTextContent('Copy');
    expect(status(container)).toBeEmptyDOMElement();
  });

  it('a refused write shows "Copy failed", then resets', async () => {
    vi.useFakeTimers();
    stubClipboard(() => Promise.reject(new Error('denied')));
    const { container } = render(<CodeBlock code={JSX} language="jsx" />);
    await click(copyButton());
    expect(copyButton()).toHaveAttribute('data-state', 'failed');
    expect(copyButton()).toHaveTextContent('Copy failed');
    expect(status(container)).toHaveTextContent('Copy failed');
    act(() => vi.advanceTimersByTime(COPY_RESET_MS));
    expect(copyButton()).toHaveAttribute('data-state', 'idle');
  });

  it('no clipboard at all (an insecure page) shows "Copy failed" and does not throw', async () => {
    stubClipboard(undefined);
    render(<CodeBlock code={JSX} language="jsx" />);
    await click(copyButton());
    expect(copyButton()).toHaveAttribute('data-state', 'failed');
  });

  it('a second click restarts the 2000ms', async () => {
    vi.useFakeTimers();
    stubClipboard(() => Promise.resolve());
    render(<CodeBlock code={JSX} language="jsx" />);
    await click(copyButton());
    act(() => vi.advanceTimersByTime(1500));
    await click(copyButton());
    act(() => vi.advanceTimersByTime(1500));
    expect(copyButton()).toHaveAttribute('data-state', 'copied');
    act(() => vi.advanceTimersByTime(500));
    expect(copyButton()).toHaveAttribute('data-state', 'idle');
  });

  it('unmounting clears the reset timer', async () => {
    vi.useFakeTimers();
    stubClipboard(() => Promise.resolve());
    const { unmount } = render(<CodeBlock code={JSX} language="jsx" />);
    await click(copyButton());
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('unmounting while the clipboard is still busy starts no timer and does not throw', async () => {
    vi.useFakeTimers();
    let finish: () => void = () => {};
    stubClipboard(() => new Promise<void>((resolve) => (finish = resolve)));
    const { unmount } = render(<CodeBlock code={JSX} language="jsx" />);
    fireEvent.click(copyButton());
    unmount();
    await act(async () => finish());
    expect(vi.getTimerCount()).toBe(0);
  });

  it('copy={false} shows no button and no status', () => {
    const { container } = render(<CodeBlock code="x" language="shell" copy={false} />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(container.querySelector('.bit-code__status')).toBeNull();
    expect(container.querySelector('.bit-code__lang')).toHaveTextContent('shell');
  });

  it('rejects the legacy DOM color attribute and does not render it', () => {
    // @ts-expect-error color is not part of CodeBlockProps
    const { container } = render(<CodeBlock code="x" language="css" color="danger" />);
    expect(container.firstElementChild).not.toHaveAttribute('color');
  });

  it.each(CODE_LANGUAGES)('%s: has no accessibility violations', async (language) => {
    const { container } = render(<CodeBlock code={JSX} language={language} />);
    await expectNoA11yViolations(container);
  });
});
```

Create `packages/react/src/components/Code/Code.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { Code } from './Code';
import { expectNoA11yViolations } from '../../test/a11y';

describe('Code', () => {
  it('renders a <code class="bit-code">', () => {
    render(<Code>color="danger"</Code>);
    const code = screen.getByText('color="danger"');
    expect(code.tagName).toBe('CODE');
    expect(code.className).toBe('bit-code');
  });

  it('appends className last, forwards the ref and passes rest props', () => {
    const ref = createRef<HTMLElement>();
    render(
      <Code ref={ref} className="extra" title="a prop">
        size
      </Code>,
    );
    const code = screen.getByText('size');
    expect(code.className).toBe('bit-code extra');
    expect(ref.current).toBe(code);
    expect(code).toHaveAttribute('title', 'a prop');
  });

  it('rejects the legacy DOM color attribute and does not render it', () => {
    // @ts-expect-error color is not part of CodeProps
    render(<Code color="danger">x</Code>);
    expect(screen.getByText('x')).not.toHaveAttribute('color');
  });

  it('has no accessibility violations inside running text', async () => {
    const { container } = render(
      <p>
        Set <Code>color="danger"</Code> on any component.
      </p>,
    );
    await expectNoA11yViolations(container);
  });
});
```

In `packages/react/src/index.test.tsx`:
- Change the second row of the component list to `'Field', 'Input', 'Select', 'Switch', 'Link', 'Code', 'CodeBlock',`.
- Add `CodeBlock: { code: 'x', language: 'shell', children: undefined },` to `SAMPLE_PROPS` after the `Input` row.
- After the `'keeps Slot internal…'` test, add:

```ts

  it('keeps the tokenizer and the copy button internal', () => {
    for (const name of ['tokenize', 'CODE_LANGUAGES', 'CopyButton', 'COPY_RESET_MS']) expect(name in lib).toBe(false);
  });
```

- [ ] **Step 10: Run them and confirm they fail**

Run: `pnpm --filter @bit-ds/react test`
Expected: FAIL. `Failed to resolve import "./CodeBlock"`, `"./CopyButton"` and `"./Code"`, and the export list lacks Code and CodeBlock.

- [ ] **Step 11: Write CopyButton, CodeBlock and Code, and export them**

Create `packages/react/src/components/CodeBlock/CopyButton.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react';
import { element } from '../../system/toClasses';

type CopyState = 'idle' | 'copied' | 'failed';

const LABELS: Record<CopyState, string> = { idle: 'Copy', copied: 'Copied', failed: 'Copy failed' };

/** How long "Copied" or "Copy failed" shows before the button reads "Copy" again. */
export const COPY_RESET_MS = 2000;

/** True when the text reached the clipboard. A missing or refusing clipboard is false, never a throw. */
async function writeClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** CodeBlock's Copy button and the visually hidden status line that announces the result. Internal. */
export function CopyButton({ code }: { code: string }) {
  const [state, setState] = useState<CopyState>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(timer.current);
    };
  }, []);

  async function copy() {
    const ok = await writeClipboard(code);
    // Unmounted while the clipboard was busy: start no timer that would outlive the component.
    if (!mounted.current) return;
    clearTimeout(timer.current);
    setState(ok ? 'copied' : 'failed');
    timer.current = setTimeout(() => setState('idle'), COPY_RESET_MS);
  }

  return (
    <>
      <button type="button" className={element('code', 'copy')} data-state={state} onClick={() => void copy()}>
        {LABELS[state]}
      </button>
      <span className={element('code', 'status')} aria-live="polite">
        {state === 'idle' ? '' : LABELS[state]}
      </span>
    </>
  );
}
```

Create `packages/react/src/components/CodeBlock/CodeBlock.tsx`:

```tsx
import { forwardRef, useMemo } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { element, withClassName } from '../../system/toClasses';
import { dropLegacyColor } from '../../system/dropLegacyColor';
import { tokenize } from './tokenize';
import type { CodeLanguage, CodeToken } from './tokenize';
import { CopyButton } from './CopyButton';

export type { CodeLanguage } from './tokenize';

export interface CodeBlockProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'color'> {
  /** The code to show, exactly as written. */
  code: string;
  /** Picks the syntax colors and the label in the bar. */
  language: CodeLanguage;
  /** Show the Copy button. Default true. */
  copy?: boolean;
}

/** Plain text stays a bare string; every other token is a span the CSS colors by `data-kind`. */
function renderToken(token: CodeToken, index: number): ReactNode {
  if (token.kind === 'text') return token.text;
  return (
    <span key={index} className={element('code', 'token')} data-kind={token.kind}>
      {token.text}
    </span>
  );
}

/** A dark code panel with editor colors, a language label and a Copy button. */
export const CodeBlock = forwardRef<HTMLDivElement, CodeBlockProps>(function CodeBlock(
  { code, language, copy = true, className, ...rest },
  ref,
) {
  const tokens = useMemo(() => tokenize(code, language), [code, language]);
  return (
    <div ref={ref} className={withClassName(element('code', 'block'), className)} data-language={language} {...dropLegacyColor(rest)}>
      <div className={element('code', 'bar')}>
        <span className={element('code', 'lang')}>{language}</span>
        {copy ? <CopyButton code={code} /> : null}
      </div>
      <pre className={element('code', 'pre')} tabIndex={0} aria-label={`${language} code`}>
        <code>{tokens.map(renderToken)}</code>
      </pre>
    </div>
  );
});
```

Create `packages/react/src/components/Code/Code.tsx`:

```tsx
import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { toClasses } from '../../system/toClasses';
import { dropLegacyColor } from '../../system/dropLegacyColor';

export type CodeProps = Omit<HTMLAttributes<HTMLElement>, 'color'>;

/** Inline code: a small mono chip inside running text, edged in the mode accent. */
export const Code = forwardRef<HTMLElement, CodeProps>(function Code({ className, ...rest }, ref) {
  return <code ref={ref} className={toClasses('code', [], className)} {...dropLegacyColor(rest)} />;
});
```

In `packages/react/src/index.ts`, after the Link exports, add:

```ts

export { Code } from './components/Code/Code';
export type { CodeProps } from './components/Code/Code';

export { CodeBlock } from './components/CodeBlock/CodeBlock';
export type { CodeBlockProps, CodeLanguage } from './components/CodeBlock/CodeBlock';
```

In `packages/react/scripts/verify-dist.mjs`:
- Change `EXPECTED`'s second row to `'Field', 'Input', 'Select', 'Switch', 'Link', 'Code', 'CodeBlock',`.
- Add `'CodeProps', 'CodeBlockProps'` to the type-name list.
- Add `'.bit-code', '.bit-code__token', '.bit-code__copy'` to the needle list. esbuild rewrites `[data-kind="keyword"]` to `[data-kind=keyword]` in the bundle, so the needles stop at the class.

In `scripts/smoke-consumer.mjs`, change the same `EXPECTED` row.

- [ ] **Step 12: Run the react tests with coverage and confirm they pass**

Run: `pnpm test:coverage`
Expected: `Tests  307 passed (307)`, with `100%` in all four columns.

- [ ] **Step 13: Move the gallery off its highlighter, and let select controls always print**

Delete `apps/gallery/src/code/highlight.ts` and `apps/gallery/src/code/highlight.test.ts` (`git rm`). Nothing else imports them. Their two cases now live in `tokenize.test.ts`.

In `apps/gallery/src/code/toJsx.test.ts`, add `import { codeBlock } from '../manifests/codeBlock';` after the `select` import. Add this row before `'a data-attribute enum prints like any select'`:

```ts
    [
      'an alwaysPrint select prints at its default; a true-default boolean turned off prints ={false}',
      codeBlock,
      { copy: false },
      `import { CodeBlock } from '@bit-ds/react';\n\n<CodeBlock language="jsx" code="const coins = 42; // collected" copy={false} />`,
    ],
```

Run: `pnpm build && pnpm --filter @bit-ds/gallery test`
Expected: FAIL, `Failed to resolve import "../manifests/codeBlock"`. The contract test also lists `['Code', 'CodeBlock']` as missing manifests.

- [ ] **Step 14: Add the two manifests and the select `alwaysPrint`**

In `apps/gallery/src/manifests/types.ts`, in `SelectControl`, after `label?: string;`, add:

```ts
  /** Print the prop in the code even at its default, because the component requires it (CodeBlock `language`). */
  alwaysPrint?: boolean;
```

In `apps/gallery/src/code/toJsx.ts`, in `printProp`'s `'select'` case, change `if (isDefault || isOmittedSentinel(control, value)) return null;` to:

```ts
      if ((isDefault && !control.alwaysPrint) || isOmittedSentinel(control, value)) return null;
```

Create `apps/gallery/src/manifests/code.ts`:

```ts
import { Code } from '@bit-ds/react';
import type { Manifest } from './types';

export const code: Manifest = {
  name: 'Code',
  slug: 'code',
  group: 'components',
  component: Code,
  description: 'Inline code: a small mono chip inside running text. The border follows the mode accent.',
  controls: [],
  children: 'color="danger"',
};
```

Create `apps/gallery/src/manifests/codeBlock.ts`:

```ts
import { CodeBlock } from '@bit-ds/react';
import type { CodeLanguage } from '@bit-ds/react';
import type { Manifest } from './types';

const LANGUAGES: readonly CodeLanguage[] = ['jsx', 'html', 'css', 'shell'];

export const codeBlock: Manifest = {
  name: 'CodeBlock',
  slug: 'codeblock',
  group: 'components',
  component: CodeBlock,
  description: 'A dark code panel with editor colors, a language label and a Copy button. JSX, HTML, CSS and shell.',
  controls: [
    { kind: 'select', prop: 'language', values: LANGUAGES, default: 'jsx', alwaysPrint: true },
    { kind: 'text', prop: 'code', default: 'const coins = 42; // collected', alwaysPrint: true },
    { kind: 'boolean', prop: 'copy', default: true },
  ],
  presets: [
    { label: 'CSS', state: { language: 'css', code: '.bit-button { height: 40px; }' } },
    { label: 'Shell', state: { language: 'shell', code: 'pnpm add @bit-ds/react' } },
    { label: 'No Copy button', state: { copy: false } },
  ],
};
```

In `apps/gallery/src/manifests/registry.ts`, add `Code,` and `CodeBlock,` after `CardHeader,` in both the import list and `COMPONENTS`. In `apps/gallery/src/manifests/index.ts`, add these imports after the `link` import:

```ts
import { code } from './code';
import { codeBlock } from './codeBlock';
```

In `MANIFESTS`, insert `code, codeBlock` after `link`.

- [ ] **Step 15: Run the gallery tests and confirm they pass**

Run: `pnpm build && pnpm --filter @bit-ds/gallery test`
Expected: PASS, `Tests  135 passed (135)`. The Code and CodeBlock routes pass axe in both modes.

- [ ] **Step 16: Run every gate**

Run: `pnpm build && pnpm verify && pnpm typecheck && pnpm lint && pnpm test && pnpm test:coverage && pnpm smoke && pnpm storybook:build`
Expected:
- `dist OK: 19 components`
- core `388`, react `307`, gallery `135` passed
- coverage `100%`
- `consumer OK: 19 components`
- Storybook builds

- [ ] **Step 17: Commit**

```bash
git add -A packages/core/src packages/react/src packages/react/scripts/verify-dist.mjs scripts/smoke-consumer.mjs apps/gallery/src
git commit -m "feat: Code and CodeBlock with a four-language tokenizer, copy states and an inset ring

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: The gallery's code panels become CodeBlocks

**Files:**
- Modify:
  - `apps/gallery/src/pages/ComponentPage.tsx:2, 39-41`
  - `apps/gallery/src/pages/HomePage.tsx:1, 29, 66-67`
  - `apps/gallery/src/gallery.css:143-162` (delete `.gallery-pre`), `:231`, `:328` (mono stacks)
  - `apps/gallery/src/gallery-css.test.ts:24-38`
  - `apps/gallery/src/routes.test.tsx:6, 21, 32`
  - `apps/gallery/src/shell/Shell.test.tsx:19-22` (and a new test)

**Interfaces:**
- Consumes `CodeBlock` with `code` and `language` (Task 6) from `@bit-ds/react`.
- Produces nothing new. The classes the gallery tests now query are `.bit-code__block` (with `data-language`) and its `pre`.

- [ ] **Step 1: Write the failing gallery tests**

In `apps/gallery/src/routes.test.tsx`, after `import { expectNoA11yViolations } from './test/a11y';`, add:

```tsx

/** The React code panel: the CodeBlock in the section headed "React". */
function reactPanel(): HTMLElement {
  const section = screen.getByRole('heading', { level: 2, name: 'React' }).closest('section')!;
  return section.querySelector<HTMLElement>('.bit-code__block')!;
}
```

In the route smoke test, replace `expect(screen.getByText(/from '@bit-ds\/react';/)).toBeInTheDocument();` with:

```tsx
      expect(reactPanel()).toHaveAttribute('data-language', 'jsx');
      expect(reactPanel().querySelector('pre')!.textContent).toMatch(/^import \{ .+ \} from '@bit-ds\/react';\n\n</);
```

In `'a control change updates the preview, the code, and the URL'`, replace `expect(screen.getByText(/<Button color="danger">Save<\/Button>/)).toBeInTheDocument();` with:

```tsx
    expect(reactPanel().querySelector('pre')!.textContent).toContain('<Button color="danger">Save</Button>');
```

In `apps/gallery/src/shell/Shell.test.tsx`, in `'home shows the logo, the install lines, and the naming rule'`, replace the four lines that start with `const install = screen.getByText(/pnpm add @bit-ds\/react/);` with:

```tsx
    const install = container.querySelector('.bit-code__block[data-language="shell"] pre');
    expect(install?.textContent).toBe(
      "pnpm add @bit-ds/react\nimport '@bit-ds/react/themes/power-up.css';\nimport '@bit-ds/react/styles.css';",
    );
```

Add this test before `'has a skip link that targets main'`:

```tsx
  it('home shows its three snippets as CodeBlocks: install in shell, then the React and HTML ways', async () => {
    const { container } = renderAt('/');
    await screen.findByRole('heading', { level: 1 });
    const blocks = [...container.querySelectorAll('.bit-code__block')];
    expect(blocks.map((b) => b.getAttribute('data-language'))).toEqual(['shell', 'jsx', 'html']);
    expect(blocks[1]!.querySelector('pre')!.textContent).toBe('<Card><CardHeader>Stats</CardHeader></Card>');
    expect(blocks[2]!.querySelector('pre')!.textContent).toBe(
      '<div class="bit-card bit-solid"><div class="bit-card__header">Stats</div></div>',
    );
    expect(blocks[1]!.querySelector('[data-kind="component"]')).toHaveTextContent('Card');
    expect(container.querySelector('pre.gallery-pre')).toBeNull();
  });

```

In `apps/gallery/src/gallery-css.test.ts`, replace the three `.gallery-pre` tests (`'code panels use the Ink-night code tokens and the mono font in both modes'`, `'code panels use the regular mono weight…'` and `'code inside a panel inherits the panel font…'`) with:

```ts
  it('has no code panel of its own: CodeBlock from @bit-ds/react draws every snippet', () => {
    // .gallery-preview and .gallery-presets stay; only the old .gallery-pre panel is gone.
    expect(galleryCss).not.toMatch(/\.gallery-pre[\s{,]/);
  });

  it('never hardcodes a font stack: mono labels read --bit-font-mono', () => {
    expect(galleryCss).not.toMatch(/monospace/);
    expect(galleryCss).toMatch(/\.gallery-control__label\s*\{[^}]*font-family: var\(--bit-font-mono\);/);
    expect(galleryCss).toMatch(/\.gallery-matrix__table th\s*\{[^}]*font-family: var\(--bit-font-mono\);/);
  });
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `pnpm build && pnpm --filter @bit-ds/gallery test`
Expected: FAIL.
- The route smoke tests (no `.bit-code__block` under "React", so `null`).
- The Shell tests (no shell CodeBlock).
- Both `gallery.css` tests (`.gallery-pre` and the `ui-monospace` stacks are still there).

- [ ] **Step 3: Render CodeBlocks and clean `gallery.css`**

In `apps/gallery/src/pages/ComponentPage.tsx`:
- Change line 2 to `import { CodeBlock, Stack, Text } from '@bit-ds/react';`.
- Replace the three-line `<pre className="gallery-pre">…</pre>` (lines 39–41) with:

```tsx
        <CodeBlock code={toJsx(manifest, state)} language="jsx" />
```

In `apps/gallery/src/pages/HomePage.tsx`:
- Change line 1 to `import { BitLogo, Card, CardBody, CardHeader, CodeBlock, Stack, Text } from '@bit-ds/react';`.
- Replace `<pre className="gallery-pre">{INSTALL}</pre>` with `<CodeBlock code={INSTALL} language="shell" />`.
- Replace the two `pre` lines in the "Two ways" card with:

```tsx
            <CodeBlock code={REACT_WAY} language="jsx" />
            <CodeBlock code={HTML_WAY} language="html" />
```

In `apps/gallery/src/gallery.css`:
- Delete from the comment `/* Ink-night code panel (both modes). PR2's CodeBlock replaces this and adds syntax colors. */` through the end of the `.gallery-pre code { font: inherit; }` block (lines 143–162). Leave one blank line before `.gallery-table`.
- In `.gallery-control__label` and `.gallery-matrix__table th`, replace `font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;` with `font-family: var(--bit-font-mono);`.

- [ ] **Step 4: Run the gallery tests and confirm they pass**

Run: `pnpm build && pnpm --filter @bit-ds/gallery test`
Expected: PASS, `Tests  135 passed (135)`. The route smoke tests still run axe on every page in both modes, now with a CodeBlock on each.

- [ ] **Step 5: Run every gate**

Run: `pnpm build && pnpm verify && pnpm typecheck && pnpm lint && pnpm test && pnpm test:coverage && pnpm smoke && pnpm storybook:build`
Expected: all green.
- `dist OK: 19 components`
- core `388`, react `307`, gallery `135` passed

- [ ] **Step 6: Commit**

```bash
git add apps/gallery/src
git commit -m "feat(gallery): code panels and Home snippets render CodeBlock; gallery.css drops its own code panel and mono stacks

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: SegmentedControl over native radios, and gallery fixed props

**Files:**
- Create: `packages/core/src/components/segmented-control.css`, `packages/core/src/__tests__/components/segmented-control.test.ts`
- Modify: `packages/core/src/index.css` (after `code-block.css`), `packages/core/src/system/reset.css` (after the Switch rule)
- Create: `packages/react/src/components/SegmentedControl/SegmentedControl.tsx` and `SegmentedControl.test.tsx`
- Modify: `packages/react/src/index.ts`, `index.test.tsx`, `packages/react/scripts/verify-dist.mjs`, `scripts/smoke-consumer.mjs`
- Create: `apps/gallery/src/manifests/segmentedControl.ts`
- Modify:
  - `apps/gallery/src/manifests/types.ts` (`LiteralValue`, `Manifest.fixedProps`)
  - `apps/gallery/src/manifests/index.ts` (re-export `LiteralValue`, add the manifest)
  - `apps/gallery/src/engine/buildProps.ts:4-6`
  - `apps/gallery/src/code/toJsx.ts`
  - `apps/gallery/src/manifests/registry.ts`
  - `apps/gallery/src/engine/buildProps.test.ts`
  - `apps/gallery/src/code/toJsx.test.ts`

**Interfaces:**
- Consumes `VISUALLY_HIDDEN` and `block` (Task 1), and the color and size decorators (`--_bit-color*`, `--_bit-size-*`).
- Produces `SegmentedControl` (`SegmentedControlProps`) and the type `SegmentedOption { value: string; label: ReactNode; disabled?: boolean }`, exported.
- Produces the classes `bit-segmented-control`, `__legend` (with `data-hidden`), `__options`, `__option`, `__input` and `__label`.
- Produces the `reset.css` rule `.bit-segmented-control__input:focus-visible + .bit-segmented-control__label`.
- Produces, in the gallery:
  - `type LiteralValue = string | number | boolean | readonly LiteralValue[] | { readonly [key: string]: LiteralValue }`
  - `Manifest.fixedProps?: Readonly<Record<string, LiteralValue>>`. Fixed props are applied before the controls in `buildProps`, and printed after the controls' props in `toJsx`.

- [ ] **Step 1: Write the failing core tests**

Create `packages/core/src/__tests__/components/segmented-control.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { VISUALLY_HIDDEN, block, readCss } from '../css';

describe('components/segmented-control.css', () => {
  const css = readCss('components/segmented-control.css');
  const checked = '.bit-segmented-control__input:checked + .bit-segmented-control__label';

  it('the fieldset sheds the browser border and padding', () => {
    const root = block(css, '.bit-segmented-control')!;
    expect(root).toContain('border: 0;');
    expect(root).toContain('padding: 0;');
    expect(root).toContain('margin: 0;');
  });

  it('hides the native radios, and the legend when data-hidden, but keeps them read and focusable', () => {
    const hidden = block(css, '.bit-segmented-control__legend[data-hidden],\n.bit-segmented-control__input')!;
    for (const line of VISUALLY_HIDDEN) expect(hidden).toContain(line);
  });

  it('joins the segments: an outer line border, 10px radius, the mid shadow, surface, 3px line dividers', () => {
    const row = block(css, '.bit-segmented-control__options')!;
    for (const line of [
      'border: var(--bit-border-width) solid var(--bit-color-line);',
      'border-radius: var(--bit-radius-10px);',
      'box-shadow: var(--bit-shadow-md);',
      'background: var(--bit-color-surface);',
      'overflow: hidden;',
    ]) {
      expect(row).toContain(line);
    }
    expect(block(css, '.bit-segmented-control__option + .bit-segmented-control__option')).toContain(
      'border-left: var(--bit-border-width) solid var(--bit-color-line);',
    );
  });

  it('segments take their height, padding and text size from the size scale', () => {
    const label = block(css, '.bit-segmented-control__label')!;
    expect(label).toContain('height: calc(var(--_bit-size-height) - 2 * var(--bit-border-width));');
    expect(label).toContain('padding: 0 var(--_bit-size-padding);');
    expect(label).toContain('font-size: var(--_bit-size-text);');
  });

  it('the chosen segment fills with the color and its contrast text', () => {
    expect(block(css, checked)).toContain('background: var(--_bit-color);');
    expect(block(css, checked)).toContain('color: var(--_bit-color-contrast);');
  });

  it('a ring on the chosen fill takes the contrast color, so violet never sits on violet', () => {
    expect(block(css, checked)).toContain('--_bit-focus-ring: var(--_bit-color-contrast);');
  });

  it('a disabled option is half opacity with a not-allowed cursor', () => {
    const disabled = block(css, '.bit-segmented-control__input:disabled + .bit-segmented-control__label')!;
    expect(disabled).toContain('opacity: 0.5;');
    expect(disabled).toContain('cursor: not-allowed;');
  });
});

describe('system/reset.css (SegmentedControl ring)', () => {
  it('draws the one ring inside the focused segment', () => {
    const body = block(readCss('system/reset.css'), '.bit-segmented-control__input:focus-visible + .bit-segmented-control__label')!;
    expect(body).toContain('outline: var(--bit-focus-ring-width) solid var(--_bit-focus-ring, var(--bit-focus-ring-color));');
    expect(body).toContain('outline-offset: calc(-1 * var(--bit-focus-ring-width) - 2px);');
  });
});
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `pnpm --filter @bit-ds/core test`
Expected: FAIL. `segmented-control.css` doesn't exist, and the reset rule is missing.

- [ ] **Step 3: Write the CSS and the ring rule**

Create `packages/core/src/components/segmented-control.css`:

```css
/* SegmentedControl: joined segments that pick one option. Real radios underneath, visually hidden,
   so arrow keys move the choice and Tab enters and leaves in one stop. The chosen segment fills with
   the color (.bit-{color}); heights come from the size scale (.bit-{size}). The focus ring is drawn
   inside the segment by system/reset.css. */
.bit-segmented-control {
  display: inline-block;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
  color: var(--bit-color-text);
}

.bit-segmented-control__legend {
  padding: 0;
  margin-bottom: var(--bit-space-8px);
  font-family: var(--bit-font-body);
  font-size: var(--bit-text-15px);
  font-weight: var(--bit-weight-bold);
}

.bit-segmented-control__legend[data-hidden],
.bit-segmented-control__input {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

/* overflow: hidden keeps the chosen fill inside the rounded corners; the ring is inset, so it is never clipped. */
.bit-segmented-control__options {
  display: flex;
  overflow: hidden;
  background: var(--bit-color-surface);
  border: var(--bit-border-width) solid var(--bit-color-line);
  border-radius: var(--bit-radius-10px);
  box-shadow: var(--bit-shadow-md);
}

.bit-segmented-control__option {
  position: relative;
  display: flex;
}

.bit-segmented-control__option + .bit-segmented-control__option {
  border-left: var(--bit-border-width) solid var(--bit-color-line);
}

.bit-segmented-control__label {
  display: inline-flex;
  align-items: center;
  height: calc(var(--_bit-size-height) - 2 * var(--bit-border-width));
  padding: 0 var(--_bit-size-padding);
  font-family: var(--bit-font-body);
  font-size: var(--_bit-size-text);
  font-weight: var(--bit-weight-bold);
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
}

.bit-segmented-control__input:not(:checked):not(:disabled) + .bit-segmented-control__label:hover {
  background: var(--bit-color-neutral-soft);
}

/* states are attributes, never classes */
.bit-segmented-control__input:checked + .bit-segmented-control__label {
  background: var(--_bit-color);
  color: var(--_bit-color-contrast);
  /* The ring lands on this fill, so it takes the fill's contrast color, as inside a solid Alert. */
  --_bit-focus-ring: var(--_bit-color-contrast);
}

.bit-segmented-control__input:disabled + .bit-segmented-control__label {
  opacity: 0.5;
  cursor: not-allowed;
}
```

In `packages/core/src/index.css`, after `@import "./components/code-block.css";`, add `@import "./components/segmented-control.css";`.

In `packages/core/src/system/reset.css`, after the `.bit-switch__input:focus-visible + .bit-switch__track { … }` rule, add:

```css

/* A segment is flush with its neighbours, so its ring sits inside it, 2px in from the edge. */
.bit-segmented-control__input:focus-visible + .bit-segmented-control__label {
  outline: var(--bit-focus-ring-width) solid var(--_bit-focus-ring, var(--bit-focus-ring-color));
  outline-offset: calc(-1 * var(--bit-focus-ring-width) - 2px);
}
```

- [ ] **Step 4: Run the core tests and confirm they pass**

Run: `pnpm --filter @bit-ds/core test`
Expected: PASS, `Tests  402 passed (402)`. The existing `'a focus ring inside a solid %s panel (its contrast color) stands out from the fill'` contrast test already proves the chosen-segment ring for all five colors in both modes.

- [ ] **Step 5: Write the failing React tests**

Create `packages/react/src/components/SegmentedControl/SegmentedControl.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest';
import { createRef, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SegmentedControl } from './SegmentedControl';
import type { SegmentedOption } from './SegmentedControl';
import { COLORS, SIZES } from '../../system/axes';
import { expectNoA11yViolations } from '../../test/a11y';

const OPTIONS: readonly SegmentedOption[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

const radio = (name: string) => screen.getByRole('radio', { name });

describe('SegmentedControl', () => {
  it('renders a fieldset with a legend and one labelled radio per option', () => {
    const { container } = render(<SegmentedControl legend="Range" options={OPTIONS} />);
    const fieldset = container.firstElementChild as HTMLElement;
    expect(fieldset.tagName).toBe('FIELDSET');
    expect(fieldset.className).toBe('bit-segmented-control bit-primary bit-md');
    expect(screen.getByRole('group', { name: 'Range' })).toBe(fieldset);
    expect(fieldset.querySelector('legend.bit-segmented-control__legend')).toHaveTextContent('Range');
    const options = fieldset.querySelector('.bit-segmented-control__options')!;
    expect([...options.children].map((label) => label.className)).toEqual(Array(3).fill('bit-segmented-control__option'));
    expect(radio('Week')).toHaveClass('bit-segmented-control__input');
    expect(radio('Week').nextElementSibling).toHaveClass('bit-segmented-control__label');
  });

  it.each(COLORS)('color=%s maps to bit-%s', (color) => {
    const { container } = render(<SegmentedControl legend="Range" options={OPTIONS} color={color} />);
    expect((container.firstElementChild as HTMLElement).classList.contains(`bit-${color}`)).toBe(true);
  });

  it.each(SIZES)('size=%s maps to bit-%s', (size) => {
    const { container } = render(<SegmentedControl legend="Range" options={OPTIONS} size={size} />);
    expect((container.firstElementChild as HTMLElement).classList.contains(`bit-${size}`)).toBe(true);
  });

  it('puts the ref, className and rest props on the fieldset', () => {
    const ref = createRef<HTMLFieldSetElement>();
    const { container } = render(
      <SegmentedControl ref={ref} legend="Range" options={OPTIONS} className="extra" data-testid="seg" />,
    );
    const fieldset = container.firstElementChild as HTMLElement;
    expect(ref.current).toBe(fieldset);
    expect(fieldset.className).toBe('bit-segmented-control bit-primary bit-md extra');
    expect(fieldset).toHaveAttribute('data-testid', 'seg');
  });

  it('the radios share one generated name, and two controls get different names', () => {
    render(
      <>
        <SegmentedControl legend="First" options={OPTIONS} />
        <SegmentedControl legend="Second" options={[{ value: 'a', label: 'A' }]} />
      </>,
    );
    const names = new Set(['Day', 'Week', 'Month'].map((n) => radio(n).getAttribute('name')));
    expect(names.size).toBe(1);
    expect(radio('A').getAttribute('name')).not.toBe([...names][0]);
  });

  it('name sets the shared name', () => {
    render(<SegmentedControl legend="Range" options={OPTIONS} name="range" />);
    for (const n of ['Day', 'Week', 'Month']) expect(radio(n)).toHaveAttribute('name', 'range');
  });

  it('uncontrolled: starts on the first option, or defaultValue; a click moves the choice and reports it', async () => {
    const onValueChange = vi.fn();
    const { unmount } = render(<SegmentedControl legend="Range" options={OPTIONS} onValueChange={onValueChange} />);
    expect(radio('Day')).toBeChecked();
    await userEvent.click(screen.getByText('Month'));
    expect(radio('Month')).toBeChecked();
    expect(onValueChange).toHaveBeenCalledWith('month');
    unmount();
    render(<SegmentedControl legend="Range" options={OPTIONS} defaultValue="week" />);
    expect(radio('Week')).toBeChecked();
  });

  it('controlled: value decides; a click only asks the parent', async () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <SegmentedControl legend="Range" options={OPTIONS} value="week" onValueChange={onValueChange} />,
    );
    await userEvent.click(screen.getByText('Day'));
    expect(onValueChange).toHaveBeenCalledWith('day');
    expect(radio('Week')).toBeChecked();
    rerender(<SegmentedControl legend="Range" options={OPTIONS} value="day" onValueChange={onValueChange} />);
    expect(radio('Day')).toBeChecked();
  });

  it('controlled through state works end to end', async () => {
    function Controlled() {
      const [range, setRange] = useState('day');
      return <SegmentedControl legend="Range" options={OPTIONS} value={range} onValueChange={setRange} />;
    }
    render(<Controlled />);
    await userEvent.click(screen.getByText('Week'));
    expect(radio('Week')).toBeChecked();
  });

  it('keyboard: one Tab stop on the chosen option, arrows move the choice', async () => {
    render(
      <>
        <SegmentedControl legend="Range" options={OPTIONS} defaultValue="week" />
        <button type="button">After</button>
      </>,
    );
    await userEvent.tab();
    expect(radio('Week')).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(radio('Month')).toBeChecked();
    expect(radio('Month')).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
  });

  it('a disabled option is disabled and cannot be chosen', async () => {
    const onValueChange = vi.fn();
    render(
      <SegmentedControl
        legend="Range"
        options={[...OPTIONS.slice(0, 2), { value: 'month', label: 'Month', disabled: true }]}
        onValueChange={onValueChange}
      />,
    );
    expect(radio('Month')).toBeDisabled();
    await userEvent.click(screen.getByText('Month'));
    expect(radio('Month')).not.toBeChecked();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('legendHidden marks the legend data-hidden, and it still names the group', () => {
    const { container, rerender } = render(<SegmentedControl legend="Range" options={OPTIONS} legendHidden />);
    const legend = container.querySelector('legend')!;
    expect(legend).toHaveAttribute('data-hidden', '');
    expect(legend).toHaveTextContent('Range');
    expect(screen.getByRole('group', { name: 'Range' })).toBeInTheDocument();
    rerender(<SegmentedControl legend="Range" options={OPTIONS} />);
    expect(legend).not.toHaveAttribute('data-hidden');
  });

  it('no options renders the legend and no radios, without throwing', () => {
    render(<SegmentedControl legend="Range" options={[]} />);
    expect(screen.getByRole('group', { name: 'Range' })).toBeInTheDocument();
    expect(screen.queryAllByRole('radio')).toEqual([]);
  });

  it('rejects an unknown color with a warning instead of emitting a class', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = render(
      // @ts-expect-error teal is not a color
      <SegmentedControl legend="Range" options={OPTIONS} color="teal" />,
    );
    expect((container.firstElementChild as HTMLElement).className).toBe('bit-segmented-control bit-md');
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it.each([false, true])('has no accessibility violations (legendHidden=%s, one option disabled)', async (legendHidden) => {
    const { container } = render(
      <SegmentedControl
        legend="Range"
        legendHidden={legendHidden}
        options={[...OPTIONS.slice(0, 2), { value: 'month', label: 'Month', disabled: true }]}
      />,
    );
    await expectNoA11yViolations(container);
  });
});
```

In `packages/react/src/index.test.tsx`:
- Change the second row of the component list to `'Field', 'Input', 'Select', 'Switch', 'Link', 'Code', 'CodeBlock', 'SegmentedControl',`.
- Add `SegmentedControl: { legend: 'x', options: [{ value: 'x', label: 'x' }], children: undefined },` to `SAMPLE_PROPS`.

- [ ] **Step 6: Run them and confirm they fail**

Run: `pnpm --filter @bit-ds/react test`
Expected: FAIL, `Failed to resolve import "./SegmentedControl"`, and the export list lacks SegmentedControl.

- [ ] **Step 7: Write SegmentedControl and export it**

Create `packages/react/src/components/SegmentedControl/SegmentedControl.tsx`:

```tsx
import { forwardRef, useId, useState } from 'react';
import type { FieldsetHTMLAttributes, ReactNode } from 'react';
import { COLORS, SIZES } from '../../system/axes';
import type { Color, Size } from '../../system/axes';
import { element, toClasses } from '../../system/toClasses';

const colors = COLORS;
const sizes = SIZES;

export interface SegmentedOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

export interface SegmentedControlProps
  extends Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, 'onChange' | 'color' | 'defaultValue'> {
  /** Names the group; read by screen readers even when hidden. */
  legend: ReactNode;
  /** Hide the legend visually. It is still read. */
  legendHidden?: boolean;
  options: readonly SegmentedOption[];
  /** The radios' shared name. Default: a generated id. */
  name?: string;
  /** The chosen value, when the parent owns it. */
  value?: string;
  /** The first chosen value, when the control owns it. Default: the first option. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Fill of the chosen option. Class: `bit-{color}`. */
  color?: Color;
  /** Segment height. Class: `bit-{size}`. */
  size?: Size;
}

/**
 * Joined segments that pick one option. Native radios underneath, so arrow keys move the choice and
 * Tab enters and leaves the group in one stop, with no custom keyboard code.
 */
export const SegmentedControl = forwardRef<HTMLFieldSetElement, SegmentedControlProps>(function SegmentedControl(
  {
    legend,
    legendHidden = false,
    options,
    name,
    value,
    defaultValue,
    onValueChange,
    color = 'primary',
    size = 'md',
    className,
    ...rest
  },
  ref,
) {
  const generatedName = useId();
  const [ownValue, setOwnValue] = useState(defaultValue ?? options[0]?.value);
  const chosen = value ?? ownValue;

  function choose(next: string) {
    if (value === undefined) setOwnValue(next);
    onValueChange?.(next);
  }

  return (
    <fieldset
      ref={ref}
      className={toClasses(
        'segmented-control',
        [
          { name: 'color', allowed: colors, value: color },
          { name: 'size', allowed: sizes, value: size },
        ],
        className,
      )}
      {...rest}
    >
      <legend className={element('segmented-control', 'legend')} data-hidden={legendHidden ? '' : undefined}>
        {legend}
      </legend>
      <div className={element('segmented-control', 'options')}>
        {options.map((option) => (
          <label key={option.value} className={element('segmented-control', 'option')}>
            <input
              type="radio"
              className={element('segmented-control', 'input')}
              name={name ?? generatedName}
              value={option.value}
              checked={option.value === chosen}
              disabled={option.disabled}
              onChange={() => choose(option.value)}
            />
            <span className={element('segmented-control', 'label')}>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
});
```

In `packages/react/src/index.ts`, after the CodeBlock exports, add:

```ts

export { SegmentedControl } from './components/SegmentedControl/SegmentedControl';
export type { SegmentedControlProps, SegmentedOption } from './components/SegmentedControl/SegmentedControl';
```

In `packages/react/scripts/verify-dist.mjs`:
- Change `EXPECTED`'s second row to end with `'SegmentedControl',`.
- Add `'SegmentedControlProps'` to the type-name list.
- Add `'.bit-segmented-control__label'` to the needle list.

In `scripts/smoke-consumer.mjs`, change the same `EXPECTED` row.

- [ ] **Step 8: Run the react tests with coverage and confirm they pass**

Run: `pnpm test:coverage`
Expected: `Tests  330 passed (330)`, with `100%` in all four columns.

- [ ] **Step 9: Write the failing gallery tests for fixed props**

In `apps/gallery/src/engine/buildProps.test.ts`, add `import { segmentedControl } from '../manifests/segmentedControl';` after the `spinner` import. Add this test before `'keeps aria-label as a prop name'`:

```ts
  it('starts from the manifest fixed props (SegmentedControl options), then adds the controls', () => {
    const props = buildProps(segmentedControl, defaultState(segmentedControl));
    expect(props.options).toBe(segmentedControl.fixedProps!.options);
    expect(props).toMatchObject({ legend: 'Range', color: 'primary', size: 'md', legendHidden: false });
  });

```

In `apps/gallery/src/code/toJsx.test.ts`, add `import { segmentedControl } from '../manifests/segmentedControl';` after the `codeBlock` import. Add this row before `'a data-attribute enum prints like any select'`:

```ts
    [
      'fixed props print after the controls, as JS literals',
      segmentedControl,
      { size: 'sm' },
      `import { SegmentedControl } from '@bit-ds/react';\n\n<SegmentedControl legend="Range" size="sm" options={[{ value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }]} />`,
    ],
```

Add this test before `'prints HTML ChildSpecs as JSX but leaves them out of the import line'`:

```ts
  it('prints every kind of fixed value: strings as attributes, numbers, booleans, arrays and objects in braces', () => {
    const withFixed: Manifest = {
      ...button,
      fixedProps: { title: 'Say "hi"', tabIndex: 0, hidden: false, data: [{ it: "it's" }] },
    };
    expect(toJsx(withFixed, defaultState(withFixed))).toBe(
      `import { Button } from '@bit-ds/react';\n\n<Button title="Say &quot;hi&quot;" tabIndex={0} hidden={false} data={[{ it: 'it\\'s' }]}>Save</Button>`,
    );
  });

```

Run: `pnpm build && pnpm --filter @bit-ds/gallery test`
Expected: FAIL, `Failed to resolve import "../manifests/segmentedControl"`.

- [ ] **Step 10: Add fixed props to the engine, and the manifest**

In `apps/gallery/src/manifests/types.ts`, above `export interface Preset {`, add:

```ts
/** A JSON-like value toJsx can print as a JS literal (SegmentedControl's options). */
export type LiteralValue = string | number | boolean | readonly LiteralValue[] | { readonly [key: string]: LiteralValue };

```

In `Manifest`, after the `children?: string | readonly ChildSpec[];` line, add:

```ts
  /** Props every render gets that the page doesn't let you change. They print after the controls' props. */
  fixedProps?: Readonly<Record<string, LiteralValue>>;
```

In `apps/gallery/src/manifests/index.ts`, replace the final `export type { … } from './types';` line with:

```ts
export type {
  Manifest,
  ManifestGroup,
  ManifestDocs,
  PropDoc,
  Control,
  ControlState,
  ControlValue,
  ChildSpec,
  LiteralValue,
  Preset,
} from './types';
```

Then add `import { segmentedControl } from './segmentedControl';` after the `codeBlock` import, and insert `segmentedControl` after `codeBlock` in `MANIFESTS`.

In `apps/gallery/src/engine/buildProps.ts`, replace the doc comment, the signature and the first line of `buildProps` (lines 4–6) with:

```ts
/**
 * Turn control state into the props object the component receives, on top of the manifest's fixed
 * props. `children` is rendered separately.
 */
export function buildProps(manifest: Manifest, state: ControlState): Record<string, unknown> {
  const props: Record<string, unknown> = { ...manifest.fixedProps };
```

In `apps/gallery/src/code/toJsx.ts`:
- Change the types import to `import type { ChildSpec, Control, ControlState, ControlValue, LiteralValue, Manifest } from '../manifests/types';`.
- Above `function isRequiredAria`, add:

```ts
/** A fixed prop's value as JS source: single-quoted strings, `{ key: value }` objects, `[a, b]` arrays. */
function literal(value: LiteralValue): string {
  if (typeof value === 'string') return singleQuoted(value);
  if (typeof value !== 'object') return String(value);
  if (Array.isArray(value)) return `[${value.map(literal).join(', ')}]`;
  const entries = Object.entries(value as Record<string, LiteralValue>).map(([key, v]) => `${key}: ${literal(v)}`);
  return `{ ${entries.join(', ')} }`;
}

/** A fixed prop as JSX: strings as attributes, everything else in braces. */
function printFixed(name: string, value: LiteralValue): string {
  return typeof value === 'string' ? `${name}="${escapeAttr(value)}"` : `${name}={${literal(value)}}`;
}

```

In `toJsx`, replace the `const props = manifest.controls …;` statement with:

```ts
  const fixed = Object.entries(manifest.fixedProps ?? {}).map(([name, value]) => printFixed(name, value));
  const props = manifest.controls
    .map((control) => printProp(control, state[control.prop] ?? defaults[control.prop]!, defaults[control.prop]!))
    .filter((p): p is string => p !== null)
    .concat(fixed)
    .map((p) => ` ${p}`)
    .join('');
```

Create `apps/gallery/src/manifests/segmentedControl.ts`:

```ts
import { COLORS, SIZES, SegmentedControl } from '@bit-ds/react';
import type { Manifest } from './types';

export const segmentedControl: Manifest = {
  name: 'SegmentedControl',
  slug: 'segmentedcontrol',
  group: 'components',
  component: SegmentedControl,
  description: 'Joined segments that pick one option. Real radios underneath: arrow keys move the choice, Tab leaves the group.',
  controls: [
    { kind: 'text', prop: 'legend', default: 'Range', alwaysPrint: true },
    { kind: 'axis', prop: 'color', values: COLORS, default: 'primary' },
    { kind: 'axis', prop: 'size', values: SIZES, default: 'md' },
    { kind: 'boolean', prop: 'legendHidden', default: false },
  ],
  fixedProps: {
    options: [
      { value: 'day', label: 'Day' },
      { value: 'week', label: 'Week' },
      { value: 'month', label: 'Month' },
    ],
  },
  presets: [
    { label: 'Success, small', state: { color: 'success', size: 'sm' } },
    { label: 'Hidden legend', state: { legendHidden: true } },
  ],
};
```

In `apps/gallery/src/manifests/registry.ts`, add `SegmentedControl,` after `Link,` in both lists.

- [ ] **Step 11: Run the gallery tests and confirm they pass**

Run: `pnpm build && pnpm --filter @bit-ds/gallery test`
Expected: PASS, `Tests  140 passed (140)`.

- [ ] **Step 12: Run every gate**

Run: `pnpm build && pnpm verify && pnpm typecheck && pnpm lint && pnpm test && pnpm test:coverage && pnpm smoke && pnpm storybook:build`
Expected:
- `dist OK: 20 components`
- core `402`, react `330`, gallery `140` passed
- coverage `100%`
- `consumer OK: 20 components`
- Storybook builds

- [ ] **Step 13: Commit**

```bash
git add packages/core/src packages/react/src packages/react/scripts/verify-dist.mjs scripts/smoke-consumer.mjs apps/gallery/src
git commit -m "feat: SegmentedControl over native radios, ringed inside the chosen segment; gallery fixed props

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Table and its four parts, and nested ChildSpecs

**Files:**
- Create: `packages/core/src/components/table.css`, `packages/core/src/__tests__/components/table.test.ts`
- Modify: `packages/core/src/index.css` (after `segmented-control.css`)
- Create: `packages/react/src/components/Table/Table.tsx` and `Table.test.tsx`
- Modify: `packages/react/src/index.ts`, `index.test.tsx`, `packages/react/scripts/verify-dist.mjs`, `scripts/smoke-consumer.mjs`
- Create: `apps/gallery/src/manifests/table.ts`
- Modify:
  - `apps/gallery/src/manifests/types.ts` (`ChildSpec.children` nests)
  - `apps/gallery/src/engine/renderManifest.tsx`
  - `apps/gallery/src/code/toJsx.ts` (`printChildSpec`, `importLine`)
  - `apps/gallery/src/manifests/manifests.test.ts` (`unknownChildren` recurses)
  - `apps/gallery/src/manifests/registry.ts`, `index.ts`
  - `apps/gallery/src/code/toJsx.test.ts`
  - `apps/gallery/src/engine/renderManifest.test.tsx`

**Interfaces:**
- Produces, all exported:
  - `Table` (`TableProps`: `striped?: boolean`), and `TableHead` and `TableBody` (`TableSectionProps`)
  - `TableRow` (`TableRowProps`) and `TableCell` (`TableCellProps`: `as?: 'th' | 'td'`)
  - The private `TableSectionContext` (`'head' | 'body'`) stays in `Table.tsx`.
- Produces, in the gallery: `ChildSpec.children?: string | readonly ChildSpec[]`. `renderManifest`, `toJsx` and the contract test all recurse.
- After this task the export lists hold 25 components: 12 existing + 13 new.

- [ ] **Step 1: Write the failing core test**

Create `packages/core/src/__tests__/components/table.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { block, readCss } from '../css';

describe('components/table.css', () => {
  const css = readCss('components/table.css');

  it('the wrapper is the card frame and scrolls sideways', () => {
    const wrapper = block(css, '.bit-table')!;
    for (const line of [
      'overflow-x: auto;',
      'border: var(--bit-border-width) solid var(--bit-color-line);',
      'border-radius: var(--bit-radius-10px);',
      'box-shadow: var(--bit-shadow-md);',
      'background: var(--bit-color-surface);',
    ]) {
      expect(wrapper).toContain(line);
    }
  });

  it('the table fills the wrapper with collapsed borders', () => {
    const table = block(css, '.bit-table__table')!;
    expect(table).toContain('width: 100%;');
    expect(table).toContain('border-collapse: collapse;');
  });

  it('cells are padded 12px by 16px', () => {
    expect(block(css, '.bit-table__cell')).toContain('padding: var(--bit-space-12px) var(--bit-space-16px);');
  });

  it('head cells are 11px pixel type in capitals over a 3px line rule', () => {
    const head = block(css, '.bit-table__head .bit-table__cell')!;
    expect(head).toContain('font-family: var(--bit-font-pixel);');
    expect(head).toContain('font-size: var(--bit-text-11px);');
    expect(head).toContain('text-transform: uppercase;');
    expect(head).toContain('border-bottom: var(--bit-border-width) solid var(--bit-color-line);');
  });

  it('body rows are split by a soft 1px line at 30% of the line color, none above the first row', () => {
    expect(block(css, '.bit-table__body .bit-table__cell')).toContain(
      'border-top: 1px solid color-mix(in srgb, var(--bit-color-line) 30%, transparent);',
    );
    expect(block(css, '.bit-table__body .bit-table__row:first-child .bit-table__cell')).toContain('border-top: 0;');
  });

  it('data-striped shades even body rows neutral-soft', () => {
    expect(block(css, '.bit-table[data-striped] .bit-table__body .bit-table__row:nth-child(even)')).toContain(
      'background: var(--bit-color-neutral-soft);',
    );
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `pnpm --filter @bit-ds/core test`
Expected: FAIL, `ENOENT … components/table.css`.

- [ ] **Step 3: Write the CSS**

Create `packages/core/src/components/table.css`:

```css
/* Table: a native table in a bordered wrapper. The wrapper scrolls sideways when the table is too
   wide and is focusable (tabindex="0"), so that scroll works from the keyboard. */
.bit-table {
  overflow-x: auto;
  color: var(--bit-color-text);
  background: var(--bit-color-surface);
  border: var(--bit-border-width) solid var(--bit-color-line);
  border-radius: var(--bit-radius-10px);
  box-shadow: var(--bit-shadow-md);
}

.bit-table__table {
  width: 100%;
  border-collapse: collapse;
}

.bit-table__cell {
  padding: var(--bit-space-12px) var(--bit-space-16px);
  text-align: left;
  vertical-align: top;
}

.bit-table__head .bit-table__cell {
  font-family: var(--bit-font-pixel);
  font-size: var(--bit-text-11px);
  font-weight: var(--bit-weight-normal);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  border-bottom: var(--bit-border-width) solid var(--bit-color-line);
}

.bit-table__body .bit-table__cell {
  border-top: 1px solid color-mix(in srgb, var(--bit-color-line) 30%, transparent);
}

.bit-table__body .bit-table__row:first-child .bit-table__cell {
  border-top: 0;
}

/* states are attributes, never classes */
.bit-table[data-striped] .bit-table__body .bit-table__row:nth-child(even) {
  background: var(--bit-color-neutral-soft);
}
```

In `packages/core/src/index.css`, after `@import "./components/segmented-control.css";`, add `@import "./components/table.css";`.

- [ ] **Step 4: Run the core tests and confirm they pass**

Run: `pnpm --filter @bit-ds/core test`
Expected: PASS, `Tests  414 passed (414)`.

- [ ] **Step 5: Write the failing React tests**

Create `packages/react/src/components/Table/Table.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { Table, TableBody, TableCell, TableHead, TableRow } from './Table';
import type { TableProps } from './Table';
import { expectNoA11yViolations } from '../../test/a11y';

function PropsTable(props: TableProps) {
  return (
    <Table {...props}>
      <TableHead>
        <TableRow>
          <TableCell>Prop</TableCell>
          <TableCell>Default</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow>
          <TableCell as="th" scope="row">
            color
          </TableCell>
          <TableCell>primary</TableCell>
        </TableRow>
        <TableRow>
          <TableCell as="th" scope="row">
            size
          </TableCell>
          <TableCell>md</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

describe('Table', () => {
  it('renders a focusable div.bit-table around table.bit-table__table, with the parts as BEM elements', () => {
    const { container } = render(<PropsTable />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.tagName).toBe('DIV');
    expect(wrapper.className).toBe('bit-table');
    expect(wrapper).toHaveAttribute('tabindex', '0');
    const table = screen.getByRole('table');
    expect(table.parentElement).toBe(wrapper);
    expect(table.className).toBe('bit-table__table');
    expect(table.querySelector('thead')!.className).toBe('bit-table__head');
    expect(table.querySelector('tbody')!.className).toBe('bit-table__body');
    expect(table.querySelector('tr')!.className).toBe('bit-table__row');
    expect([...table.querySelectorAll('th, td')].every((cell) => cell.className === 'bit-table__cell')).toBe(true);
  });

  it('TableCell is th in the head and td in the body, and as overrides it', () => {
    render(<PropsTable />);
    expect(screen.getAllByRole('columnheader').map((c) => [c.tagName, c.textContent])).toEqual([
      ['TH', 'Prop'],
      ['TH', 'Default'],
    ]);
    expect(screen.getAllByRole('rowheader').map((c) => [c.tagName, c.textContent])).toEqual([
      ['TH', 'color'],
      ['TH', 'size'],
    ]);
    expect(screen.getAllByRole('cell').map((c) => [c.tagName, c.textContent])).toEqual([
      ['TD', 'primary'],
      ['TD', 'md'],
    ]);
  });

  it('as="td" makes a plain cell even in the head', () => {
    render(
      <Table>
        <TableHead>
          <TableRow>
            <TableCell as="td">not a header</TableCell>
          </TableRow>
        </TableHead>
      </Table>,
    );
    expect(screen.getByText('not a header').tagName).toBe('TD');
  });

  it('a cell outside any section is a td', () => {
    render(
      <Table>
        <tbody>
          <TableRow>
            <TableCell>loose</TableCell>
          </TableRow>
        </tbody>
      </Table>,
    );
    expect(screen.getByText('loose').tagName).toBe('TD');
  });

  it('className goes on the wrapper; the ref and rest props go on the table', () => {
    const ref = createRef<HTMLTableElement>();
    const { container } = render(
      <Table ref={ref} className="extra" data-testid="table">
        <TableBody />
      </Table>,
    );
    const table = screen.getByTestId('table');
    expect((container.firstElementChild as HTMLElement).className).toBe('bit-table extra');
    expect(table.tagName).toBe('TABLE');
    expect(ref.current).toBe(table);
    expect(table.className).toBe('bit-table__table');
  });

  it('every part takes className and a ref', () => {
    const head = createRef<HTMLTableSectionElement>();
    const row = createRef<HTMLTableRowElement>();
    const cell = createRef<HTMLTableCellElement>();
    const body = createRef<HTMLTableSectionElement>();
    render(
      <Table>
        <TableHead ref={head} className="h">
          <TableRow ref={row} className="r">
            <TableCell ref={cell} className="c">
              Prop
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody ref={body} className="b" />
      </Table>,
    );
    expect(head.current!.className).toBe('bit-table__head h');
    expect(row.current!.className).toBe('bit-table__row r');
    expect(cell.current!.className).toBe('bit-table__cell c');
    expect(body.current!.className).toBe('bit-table__body b');
  });

  it('striped sets data-striped on the wrapper; off by default', () => {
    const { container, rerender } = render(<PropsTable striped />);
    expect(container.firstElementChild).toHaveAttribute('data-striped', '');
    rerender(<PropsTable />);
    expect(container.firstElementChild).not.toHaveAttribute('data-striped');
  });

  it('with no label the wrapper is focusable but not a region', () => {
    const { container } = render(<PropsTable />);
    expect(container.firstElementChild).not.toHaveAttribute('role');
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('aria-label makes the wrapper a region with that name, and names the table too', () => {
    render(<PropsTable aria-label="Button props" />);
    const region = screen.getByRole('region', { name: 'Button props' });
    expect(region).toHaveClass('bit-table');
    expect(screen.getByRole('table', { name: 'Button props' })).toBeInTheDocument();
  });

  it('aria-labelledby does the same', () => {
    render(
      <>
        <h2 id="props-heading">Props</h2>
        <PropsTable aria-labelledby="props-heading" />
      </>,
    );
    expect(screen.getByRole('region', { name: 'Props' })).toHaveClass('bit-table');
    expect(screen.getByRole('table', { name: 'Props' })).toBeInTheDocument();
  });

  it('rejects the legacy DOM color attribute on every part', () => {
    render(
      // @ts-expect-error color is not part of TableProps
      <Table color="danger" data-testid="table">
        {/* @ts-expect-error color is not part of TableSectionProps */}
        <TableBody color="danger" data-testid="body">
          {/* @ts-expect-error color is not part of TableRowProps */}
          <TableRow color="danger" data-testid="row">
            {/* @ts-expect-error color is not part of TableCellProps */}
            <TableCell color="danger" data-testid="cell">
              x
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    for (const id of ['table', 'body', 'row', 'cell']) expect(screen.getByTestId(id)).not.toHaveAttribute('color');
  });

  it.each([
    ['unlabelled', {}],
    ['labelled and striped', { 'aria-label': 'Button props', striped: true }],
  ])('has no accessibility violations (%s)', async (_name, props) => {
    const { container } = render(<PropsTable {...props} />);
    await expectNoA11yViolations(container);
  });
});
```

In `packages/react/src/index.test.tsx`:
- Change line 7 to `import type { ComponentType, ReactElement } from 'react';`.
- Add a third row to the component list, after the second:

```ts
        'Table', 'TableHead', 'TableBody', 'TableRow', 'TableCell',
```

- Add these rows to `SAMPLE_PROPS`:

```tsx
  Table: { children: <tbody><tr><td>x</td></tr></tbody> },
  TableHead: { children: <tr><th>x</th></tr> },
  TableBody: { children: <tr><td>x</td></tr> },
  TableRow: { children: <td>x</td> },
```

- After `SAMPLE_PROPS`, add:

```tsx

/** Table parts only render inside their table parents. The root is then the part's own element. */
const PARENTS: Record<string, { wrap: (part: ReactElement) => ReactElement; root: string }> = {
  TableHead: { wrap: (part) => <table>{part}</table>, root: 'thead' },
  TableBody: { wrap: (part) => <table>{part}</table>, root: 'tbody' },
  TableRow: { wrap: (part) => <table><tbody>{part}</tbody></table>, root: 'tr' },
  TableCell: { wrap: (part) => <table><tbody><tr>{part}</tr></tbody></table>, root: 'td' },
};
```

- In the naming-rule test, replace the `render(createElement(…))` line and the `const root = container.firstElementChild;` line with:

```tsx
    const sample = createElement(Component, { 'aria-label': 'x', children: 'x', ...SAMPLE_PROPS[name] });
    const parent = PARENTS[name];
    const { container } = render(parent ? parent.wrap(sample) : sample);
    const root = parent ? container.querySelector(parent.root) : container.firstElementChild;
```

- [ ] **Step 6: Run them and confirm they fail**

Run: `pnpm --filter @bit-ds/react test`
Expected: FAIL, `Failed to resolve import "./Table"`, and the export list lacks the five Table names.

- [ ] **Step 7: Write the Table parts and export them**

Create `packages/react/src/components/Table/Table.tsx`:

```tsx
import { createContext, forwardRef, useContext } from 'react';
import type { HTMLAttributes, TableHTMLAttributes, TdHTMLAttributes } from 'react';
import { element, toClasses, withClassName } from '../../system/toClasses';
import { dropLegacyColor } from '../../system/dropLegacyColor';

/** Which section a cell is in, so TableCell can pick th (head) or td (body). Private. */
const TableSectionContext = createContext<'head' | 'body'>('body');

export interface TableProps extends Omit<TableHTMLAttributes<HTMLTableElement>, 'color'> {
  /** Shade every other body row. Rendered as `data-striped` on the wrapper. */
  striped?: boolean;
}

/**
 * A native table in a bordered wrapper that scrolls sideways when the table is too wide. The wrapper
 * takes `className` and is always focusable, so the scroll works from the keyboard; with an
 * `aria-label` or `aria-labelledby` it is also a named region. The table takes the ref and every other prop.
 */
export const Table = forwardRef<HTMLTableElement, TableProps>(function Table(
  { striped = false, className, ...rest },
  ref,
) {
  const label = rest['aria-label'];
  const labelledBy = rest['aria-labelledby'];
  const named = label !== undefined || labelledBy !== undefined;
  return (
    <div
      className={toClasses('table', [], className)}
      data-striped={striped ? '' : undefined}
      tabIndex={0}
      role={named ? 'region' : undefined}
      aria-label={label}
      aria-labelledby={labelledBy}
    >
      <table ref={ref} className={element('table', 'table')} {...dropLegacyColor(rest)} />
    </div>
  );
});

export type TableSectionProps = Omit<HTMLAttributes<HTMLTableSectionElement>, 'color'>;

export const TableHead = forwardRef<HTMLTableSectionElement, TableSectionProps>(function TableHead(
  { className, ...rest },
  ref,
) {
  return (
    <TableSectionContext.Provider value="head">
      <thead ref={ref} className={withClassName(element('table', 'head'), className)} {...dropLegacyColor(rest)} />
    </TableSectionContext.Provider>
  );
});

export const TableBody = forwardRef<HTMLTableSectionElement, TableSectionProps>(function TableBody(
  { className, ...rest },
  ref,
) {
  return (
    <TableSectionContext.Provider value="body">
      <tbody ref={ref} className={withClassName(element('table', 'body'), className)} {...dropLegacyColor(rest)} />
    </TableSectionContext.Provider>
  );
});

export type TableRowProps = Omit<HTMLAttributes<HTMLTableRowElement>, 'color'>;

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(function TableRow({ className, ...rest }, ref) {
  return <tr ref={ref} className={withClassName(element('table', 'row'), className)} {...dropLegacyColor(rest)} />;
});

export interface TableCellProps extends Omit<TdHTMLAttributes<HTMLTableCellElement>, 'color'> {
  /** Force the element. Default: `th` inside TableHead, `td` everywhere else. */
  as?: 'th' | 'td';
}

export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(function TableCell(
  { as, className, ...rest },
  ref,
) {
  const section = useContext(TableSectionContext);
  const Cell = as ?? (section === 'head' ? 'th' : 'td');
  return <Cell ref={ref} className={withClassName(element('table', 'cell'), className)} {...dropLegacyColor(rest)} />;
});
```

In `packages/react/src/index.ts`, after the SegmentedControl exports, add:

```ts

export { Table, TableHead, TableBody, TableRow, TableCell } from './components/Table/Table';
export type { TableProps, TableSectionProps, TableRowProps, TableCellProps } from './components/Table/Table';
```

In `packages/react/scripts/verify-dist.mjs` and `scripts/smoke-consumer.mjs`, add a third row to `EXPECTED`:

```js
  'Table', 'TableHead', 'TableBody', 'TableRow', 'TableCell',
```

In `verify-dist.mjs`, also add `'TableProps', 'TableCellProps'` to the type-name list and `'.bit-table__cell'` to the needle list.

- [ ] **Step 8: Run the react tests with coverage and confirm they pass**

Run: `pnpm test:coverage`
Expected: `Tests  348 passed (348)`, with `100%` in all four columns. The naming-rule test checks `bit-table__head`, `bit-table__body`, `bit-table__row` and `bit-table__cell` on their own elements.

- [ ] **Step 9: Write the failing gallery tests for nested parts**

In `apps/gallery/src/manifests/manifests.test.ts`, replace `unknownChildren` with the recursive version:

```ts
/** ChildSpec names, nested parts included, that are neither a registered component nor an allowed HTML element. */
function unknownChildren(children: readonly ChildSpec[]): string[] {
  return children.flatMap((child) => {
    const name = child.component;
    const unknown = isHtmlElement(name) ? !HTML_CHILDREN.includes(name) : COMPONENTS[name] === undefined;
    const nested = typeof child.children === 'object' ? unknownChildren(child.children) : [];
    return unknown ? [name, ...nested] : nested;
  });
}
```

After the allowlist test, add:

```ts

  it('the allowlist check reaches nested parts (Table rows and cells)', () => {
    const nested: ChildSpec[] = [
      { component: 'TableBody', children: [{ component: 'TableRow', children: [{ component: 'tdd', children: 'typo' }] }] },
    ];
    expect(unknownChildren(nested)).toEqual(['tdd']);
  });
```

In `apps/gallery/src/code/toJsx.test.ts`, add `import { table } from '../manifests/table';` after the `segmentedControl` import. Add this test before `'prints HTML ChildSpecs as JSX but leaves them out of the import line'`:

```ts
  it('prints nested parts indented one level per depth, and imports every part once', () => {
    const small: Manifest = {
      ...table,
      children: [
        { component: 'TableBody', children: [{ component: 'TableRow', children: [{ component: 'TableCell', children: 'a' }] }] },
      ],
    };
    expect(toJsx(small, { ...defaultState(small), striped: true })).toBe(
      `import { Table, TableBody, TableCell, TableHead, TableRow } from '@bit-ds/react';\n\n<Table striped aria-label="Button props">\n  <TableBody>\n    <TableRow>\n      <TableCell>a</TableCell>\n    </TableRow>\n  </TableBody>\n</Table>`,
    );
  });

```

In `apps/gallery/src/engine/renderManifest.test.tsx`, add `import { table } from '../manifests/table';` after the `field` import. Add this test before `'renders a lowercase ChildSpec as a plain HTML element (Select needs <option>)'`:

```tsx
  it('renders nested ChildSpecs: Table head, rows and cells', () => {
    render(renderManifest(table, defaultState(table)));
    expect(screen.getByRole('region', { name: 'Button props' })).toHaveClass('bit-table');
    expect(screen.getAllByRole('columnheader').map((c) => c.textContent)).toEqual(['Prop', 'Type', 'Default']);
    expect(screen.getAllByRole('row')).toHaveLength(4);
    expect(screen.getAllByRole('cell')[0]).toHaveTextContent('color');
  });

```

Run: `pnpm build && pnpm --filter @bit-ds/gallery test`
Expected: FAIL, `Failed to resolve import "../manifests/table"`.

- [ ] **Step 10: Let ChildSpecs nest, and add the manifest**

In `apps/gallery/src/manifests/types.ts`, replace the `ChildSpec` comment and interface with:

```ts
/**
 * One child element of a compound component, as data so toJsx can print it. A PascalCase
 * `component` is a registered bit component; a lowercase one is a plain HTML element
 * (Select's `option`), following JSX's own rule. `children` is text, nested parts (Table's
 * head, rows and cells), or nothing for a self-closing element (Field's Input).
 */
export interface ChildSpec {
  component: string;
  props?: Record<string, string>;
  children?: string | readonly ChildSpec[];
}
```

Replace `apps/gallery/src/engine/renderManifest.tsx` with:

```tsx
import { createElement } from 'react';
import type { ReactElement, ReactNode } from 'react';
import type { ChildSpec, ControlState, Manifest } from '../manifests/types';
import { COMPONENTS, isHtmlElement } from '../manifests/registry';
import { buildProps } from './buildProps';

/** One ChildSpec as an element, with its nested parts rendered the same way. */
function renderChild(child: ChildSpec, index: number): ReactElement {
  const Part = isHtmlElement(child.component) ? child.component : COMPONENTS[child.component];
  if (!Part) throw new Error(`bit gallery: ChildSpec names unknown component "${child.component}"`);
  const inner = typeof child.children === 'object' ? child.children.map(renderChild) : child.children;
  return createElement(Part, { key: index, ...child.props }, inner);
}

function renderChildren(manifest: Manifest, state: ControlState): ReactNode {
  if (typeof manifest.children === 'string') return state.children ?? manifest.children;
  if (!manifest.children) return undefined;
  return manifest.children.map(renderChild);
}

/** The exact element the preview shows and toHtml serializes. */
export function renderManifest(manifest: Manifest, state: ControlState): ReactElement {
  return createElement(manifest.component, buildProps(manifest, state), renderChildren(manifest, state));
}
```

In `apps/gallery/src/code/toJsx.ts`, replace `printChildSpec` and `importLine` with:

```ts
function printChildSpec(child: ChildSpec, depth: number): string {
  const props = Object.entries(child.props ?? {})
    .map(([k, v]) => ` ${k}="${escapeAttr(v)}"`)
    .join('');
  const indent = INDENT.repeat(depth);
  const open = `${indent}<${child.component}${props}`;
  if (child.children === undefined) return `${open} />`;
  if (typeof child.children === 'string') return `${open}>${printChildren(child.children)}</${child.component}>`;
  const inner = child.children.map((part) => printChildSpec(part, depth + 1)).join('\n');
  return `${open}>\n${inner}\n${indent}</${child.component}>`;
}

/** Every bit component a ChildSpec tree names, nested parts included. HTML elements are not imported. */
function componentNames(children: readonly ChildSpec[]): string[] {
  return children.flatMap((child) => [
    ...(isHtmlElement(child.component) ? [] : [child.component]),
    ...(typeof child.children === 'object' ? componentNames(child.children) : []),
  ]);
}

function importLine(manifest: Manifest): string {
  const nested = typeof manifest.children === 'object' ? componentNames(manifest.children) : [];
  const unique = [...new Set([manifest.name, ...(manifest.parts ?? []), ...nested])].sort();
  return `import { ${unique.join(', ')} } from '@bit-ds/react';`;
}
```

Create `apps/gallery/src/manifests/table.ts`:

```ts
import { Table } from '@bit-ds/react';
import type { ChildSpec, Manifest } from './types';

/** One body row: a prop name, its type and its default. */
function row(prop: string, type: string, defaultValue: string): ChildSpec {
  return {
    component: 'TableRow',
    children: [
      { component: 'TableCell', children: prop },
      { component: 'TableCell', children: type },
      { component: 'TableCell', children: defaultValue },
    ],
  };
}

export const table: Manifest = {
  name: 'Table',
  slug: 'table',
  group: 'components',
  component: Table,
  description: 'A native table in a card frame. Head cells are th, body cells td. Wide tables scroll sideways, from the keyboard too.',
  controls: [
    { kind: 'boolean', prop: 'striped', default: false },
    { kind: 'text', prop: 'aria-label', default: 'Button props', label: 'aria-label' },
  ],
  children: [
    {
      component: 'TableHead',
      children: [
        {
          component: 'TableRow',
          children: [
            { component: 'TableCell', children: 'Prop' },
            { component: 'TableCell', children: 'Type' },
            { component: 'TableCell', children: 'Default' },
          ],
        },
      ],
    },
    {
      component: 'TableBody',
      children: [
        row('color', 'primary | danger …', 'primary'),
        row('size', 'sm | md | lg', 'md'),
        row('disabled', 'boolean', 'false'),
      ],
    },
  ],
  parts: ['TableHead', 'TableBody', 'TableRow', 'TableCell'],
  presets: [{ label: 'Striped', state: { striped: true } }],
};
```

In `apps/gallery/src/manifests/registry.ts`, add `Table, TableBody, TableCell, TableHead, TableRow` (one per line) after `Switch,` in both lists. In `apps/gallery/src/manifests/index.ts`, add `import { table } from './table';` after the `segmentedControl` import, and insert `table` after `segmentedControl` in `MANIFESTS`.

- [ ] **Step 11: Run the gallery tests and confirm they pass**

Run: `pnpm build && pnpm --filter @bit-ds/gallery test`
Expected: PASS, `Tests  145 passed (145)`. The Table page passes axe in both modes, and the contract test covers the four parts through `parts`.

- [ ] **Step 12: Run every gate**

Run: `pnpm build && pnpm verify && pnpm typecheck && pnpm lint && pnpm test && pnpm test:coverage && pnpm smoke && pnpm storybook:build`
Expected:
- `dist OK: 25 components, styles.css … bytes, themes present`
- core `414`, react `348`, gallery `145` passed
- coverage `100%`
- `consumer OK: 25 components via ESM and CJS, CSS present, types check`
- Storybook builds

- [ ] **Step 13: Commit**

```bash
git add packages/core/src packages/react/src packages/react/scripts/verify-dist.mjs scripts/smoke-consumer.mjs apps/gallery/src
git commit -m "feat: Table with head, body, row and cell parts, a keyboard-scrollable wrapper; nested gallery ChildSpecs

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: README and CONTRIBUTING, and the full gate run

The exports, the 25-name lists and the naming-rule list already landed task by task (decision 1). This task brings the docs up to date and proves the whole branch once more from a clean build.

**Files:**
- Modify: `README.md:58-62` (the interactive-components sentence and the Components section)
- Modify: `CONTRIBUTING.md:10` (step 4) and the Conventions list

**Interfaces:**
- Consumes the 25 public components from Tasks 2–9.

- [ ] **Step 1: Update the README**

In `README.md`, replace from `Both render identically. For interactive components (coming in Phase 3)…` through the end of the line `Button, Badge, Alert, Card (+ CardHeader, CardBody, CardFooter), Stack, Text, Spinner, BitLogo, ModeToggle.` with:

```markdown
Both render identically. For interactive components (Switch, SegmentedControl, CodeBlock's Copy button) the classes give the look; the React component gives the keyboard and screen-reader behavior.

## Components

- **Actions and status:** Button, Badge, Alert, Spinner
- **Layout and type:** Card (+ CardHeader, CardBody, CardFooter), Stack, Text
- **Forms:** Field, Input, Select, Switch
- **Content:** Link, Code, CodeBlock, Table (+ TableHead, TableBody, TableRow, TableCell)
- **Choice:** SegmentedControl, ModeToggle
- **Brand:** BitLogo

Every one works in light and dark mode, sits on the native element (a real `<input>`, `<select>`, radio or checkbox), and shows the one focus ring from `reset.css`.
```

- [ ] **Step 2: Update CONTRIBUTING**

In `CONTRIBUTING.md`, replace step 4 (`4. \`packages/react/src/components/<Name>/<Name>.stories.tsx\`: \`Playground\` plus one story per axis.`) with:

```markdown
4. A gallery page: `apps/gallery/src/manifests/<name>.ts`, listed in `MANIFESTS` in `apps/gallery/src/manifests/index.ts`. Add the component (and any parts a manifest's `children` names) to `COMPONENTS` in `registry.ts`. New components get no Storybook story: PR3 removes Storybook.
```

In the Conventions list, after `- Components never import CSS; the app does, once.`, add:

```markdown
- Component CSS never sets `outline` or its longhands; `system/reset.css` draws the one focus ring. A visually hidden native input (Switch, SegmentedControl) gets its ring from a `reset.css` rule on the part drawn beside it.
- Lines read `--bit-color-line`, never `--bit-color-ink`. The exceptions are listed, by selector, in `INK_EXCEPTIONS` in `packages/core/src/__tests__/system.test.ts`.
```

- [ ] **Step 3: Run every gate from a clean build**

Run: `rm -rf packages/react/dist apps/gallery/dist && pnpm build && pnpm verify && pnpm typecheck && pnpm lint && pnpm test && pnpm test:coverage && pnpm smoke && pnpm storybook:build && pnpm gallery:build`
Expected:
- `dist OK: 25 components`
- core `414`, react `348`, gallery `145` passed
- coverage Statements, Branches, Functions and Lines all `100%`
- `consumer OK: 25 components via ESM and CJS, CSS present, types check`
- `Storybook build completed successfully`
- the gallery builds (`✓ built in …`)

- [ ] **Step 4: Commit**

```bash
git add README.md CONTRIBUTING.md
git commit -m "docs: README lists all 25 components; CONTRIBUTING covers gallery pages, the ring rule and ink exceptions

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Screenshot board for the owner's sign-off (no repo changes)

**Files:**
- Create (outside the repo):
  - The PNGs, under `/private/tmp/bit-pr2-board/`. The browse CLI writes only under `/private/tmp`.
  - `~/.gstack/projects/doosemavis-bit-design-system/designs/pr2-20261003/final/board.html`, with the PNGs copied beside it.

**Interfaces:**
- Consumes the built gallery from Task 10 (`pnpm gallery:build`, output in `apps/gallery/dist`).

Use the gstack browse CLI at `~/.claude/skills/gstack/browse/dist/browse`. Never use `mcp__claude-in-chrome__*`.

- [ ] **Step 1: Serve the built gallery**

Run, in the background, from `apps/gallery`: `npx vite preview --base /bit-design-system/`
Expected: `Local: http://localhost:4173/bit-design-system/`. Every URL below starts with `http://localhost:4173/bit-design-system/#`.

- [ ] **Step 2: Capture every component in both modes**

Set up the browser and set the mode before loading each page:

```bash
B=~/.claude/skills/gstack/browse/dist/browse
mkdir -p /private/tmp/bit-pr2-board
$B viewport 1280x900
$B goto "http://localhost:4173/bit-design-system/#/"
$B js "localStorage.setItem('bit-color-mode','light')"   # then 'dark' for the second pass
```

For each mode (light, then dark), and for each route below, run `$B goto "<url>"`, then `$B wait --networkidle`, then `$B screenshot --clip 240,60,1040,560 /private/tmp/bit-pr2-board/<mode>-<name>.png`:

- `/components/field?hint=We+never+share+it.&error=Enter+your+email.&required=1`
- `/components/input`
- `/components/input?invalid=1`
- `/components/select`
- `/components/switch`
- `/components/switch?size=sm&disabled=1`
- `/components/link`
- `/components/link?color=neutral`
- `/components/code`
- `/components/codeblock`
- `/components/codeblock?language=css&code=.bit-button+%7B+height%3A+40px%3B+%7D`
- `/components/segmentedcontrol`
- `/components/segmentedcontrol?color=success&size=sm`
- `/components/table?striped=1`
- `/` (Home's three CodeBlocks), with `--clip 240,60,1040,840`

- [ ] **Step 3: Capture the states a static page doesn't show**

Light and dark each:

- **Switch on:** on `/components/switch`, run `$B click ".bit-switch__label"`, then screenshot.
- **Switch focus ring:** reload, run `$B press Tab` until `$B is focused ".bit-switch__input"` prints true, then screenshot. The ring should sit around the track.
- **SegmentedControl focus ring:** on `/components/segmentedcontrol`, run `$B click ".bit-segmented-control__option:nth-child(2)"`, then `$B press ArrowRight`, then screenshot. The ring sits inside the chosen segment. It must be white or ink, never violet on violet (Review Focus 3).
- **CodeBlock pre focus ring:** on `/components/codeblock`, run `$B js "document.querySelector('.bit-code__block pre').focus()"`, then `$B press Shift`, then screenshot. The ring must be whole inside the panel (Review Focus 4).
- **Copy states:**
  - Run `$B js "Object.defineProperty(navigator,'clipboard',{value:{writeText:()=>Promise.resolve()},configurable:true})"`, then `$B click ".bit-code__copy"`, then screenshot ("Copied").
  - Reload. Run `$B js "Object.defineProperty(navigator,'clipboard',{value:{writeText:()=>Promise.reject(new Error('x'))},configurable:true})"`, then `$B click ".bit-code__copy"`, then screenshot ("Copy failed"; the second owner note).
- **Link hover:** on `/components/link`, run `$B hover ".bit-link"`, then screenshot. Do it once more after visiting the link's `href` in the same tab and going back, which shows the visited color on the highlight (D2).

- [ ] **Step 4: Assemble `final/board.html`**

```bash
mkdir -p ~/.gstack/projects/doosemavis-bit-design-system/designs/pr2-20261003/final
cp /private/tmp/bit-pr2-board/*.png ~/.gstack/projects/doosemavis-bit-design-system/designs/pr2-20261003/final/
```

Write `board.html` beside them:
- **Layout:** a two-column grid, light left and dark right, one row per component and state, each with a caption.
- **The top of the page:**
  - D1 and D2, with their contrast numbers from this plan
  - the two owner notes (CodeBlock `pre` role, the failed Copy state in dark)
  - anything you see that looks wrong: a clipped ring, a Switch thumb off-center, a Select chevron overlapping text, Table header type that isn't pixel caps, a CodeBlock border that isn't violet in light and yellow in dark, or a Field error that isn't red

- [ ] **Step 5: Stop the server and report**

Run `$B stop` and stop the preview server. Report the board path and every problem you saw. No commit.

---

## Self-review (run 2026-10-03)

**1. Spec coverage**

| Spec requirement | Where |
|---|---|
| §1 folders, kebab CSS file, `index.css` import, export from `index.ts` | Tasks 2–9, each component's Files list |
| §1 classes from `toClasses`, naming rule (`bit-table__head`, `bit-code__block`) | Every component; `index.test.tsx` naming-rule test with `SAMPLE_PROPS` and `PARENTS` (Tasks 2, 6, 8, 9) |
| §1 forwardRef, `className` last, rest, `dropLegacyColor`; ref and `className` placement for Select and Switch | Global Constraints table; each component's "puts the ref, className and rest props…" test |
| §1 sizes through `--_bit-size-*`, colors through `--_bit-color-*` | Input, Select and SegmentedControl CSS tests |
| §1 borders, no `outline` with the longhand regex, visually hidden, disabled | Task 1 guard and `VISUALLY_HIDDEN`; every CSS test |
| §1 a gallery manifest for each component; no Storybook stories | Tasks 2–9; `storybook:build` in every gate |
| §2 five tokens, 87→92 and 18→22, knob shared, dark block declares four | Task 1 (`tokens.test.ts`, `theme-completeness.test.ts`, the light and dark value tables) |
| §2 contrast list, both modes | Task 1 `contrast.test.ts`: accent ×3, ring on code-bg, ink on success, link and visited, danger-text. Task 6 adds the Copy label. |
| §3 Field markup, ids, context merge, no cloneElement, Switch not in Field | Task 2 Field tests |
| §3 Input look, `aria-invalid` border, search left alone | Task 2 Input CSS and React tests |
| §3 Select wrapper and chevron, ref and rest on `select`, native options | Task 3 |
| §3 Switch markup, sizes, off and on look, ink edge, `left` not transform, disabled, reset ring | Task 4 |
| §3 Link colors, visited, hover, `asChild` via Slot, merge rules, throw message | Tasks 1 (Slot) and 5 |
| §3 Code look; CodeBlock markup, look, tokenizer (four languages, ten kinds, escapes, invariant), copy states, timer cleanup, focus | Task 6 |
| §3 SegmentedControl props, markup, native-radio keyboard, look, inset ring | Task 8 |
| §3 Table five exports, section context, wrapper, region label, look | Task 9 |
| §4 one manifest each, ChildSpec for option and Table, allowlist, forms group and sidebar order, Field preview wraps Input, CodeBlock controls | Tasks 2, 3, 6, 8 and 9 |
| §4 ComponentPage and Home use CodeBlock (jsx, jsx and html, shell); `.gallery-pre` and its tests removed; no mono font in `gallery.css` | Task 7 |
| §5 core, react and gallery test lists; route smoke with axe in both modes for all nine pages | Every task (routes and routes.dark iterate `MANIFESTS`) |
| §5 by eye: real-browser board | Task 11 |
| Done: 25 components in verify, every gate | Tasks 9 and 10 |

No gaps.

**2. Placeholder scan:** no "TBD", "TODO", "similar to Task N" or code-less code steps. Each test step carries the full test code, and each implementation step the full source or the exact lines to change.

**3. Type consistency:**
- `useFieldControl(own, invalid)` and `FieldControlProps`: the same in Tasks 2 and 3.
- `Slot`, `mergeProps` and `composeRefs`: the same in Tasks 1 and 5.
- `CodeLanguage`, exported from `CodeBlock.tsx`: the gallery imports it from `@bit-ds/react` in Task 6.
- `alwaysPrint` is on `TextControl` (Task 2) and `SelectControl` (Task 6).
- `ChildSpec.children` is `string | undefined` (Task 2), then `string | readonly ChildSpec[] | undefined` (Task 9). Both `renderChild` and `printChildSpec` test `typeof … === 'object'` for nesting.
- `LiteralValue` and `fixedProps` come in Task 8.
- The manifest names are `field`, `input`, `select`, `switchManifest`, `link`, `code`, `codeBlock`, `segmentedControl` and `table`, used the same way in `index.ts` and the tests.
- `INK_EXCEPTIONS` keys are `switch.css` (Task 4) and `code-block.css` (Task 6).

**4. Review Focus:** five items, each pinned to a named test in its owning task (Tasks 2, 6, 8, 6 and 1).
- Also checked and covered by tests, but not in the five: empty `options` (Task 8), an unknown CodeBlock language (Task 6), a second Copy click restarting the timer (Task 6), and a typo in a nested ChildSpec (Task 9).

