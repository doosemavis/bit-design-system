# Passes on the Button page (workbench PR A)

**Roadmap:** `docs/superpowers/plans/2026-10-24-workbench.md`, PR A, with the owner rulings recorded there on 2026-10-24.
**Mockup:** Option 1 ("Passes: render-pass stage") on the "Bit — Passes & Theme Builder mockups" canvas.
**Scope:** `apps/gallery/` only. No library change, no release.

The Button page gains a **Passes** section between Playground and Variants. It steps one Button through four layers:

1. **Wireframe:** its measured box.
2. **Tokens:** which token each part reads.
3. **States:** the states its props set.
4. **Final:** the finished Button and its JSX.

The URL holds the pass (`?pass=tokens`), so every view is a link and Back steps through them.

## Owner rulings this spec follows

- **Decision 1 (b):** the stage is built from bit components plus one inline SVG. No new gallery CSS exceptions; the dot grid waits for PR E's token.
- **Decision 2 (a):** the States pass shows prop states, then one live "Try it" instance for hover, press and focus.
- **Ruling 6:** a caption panel under the stage says what the pass shows and what it reads.
- **Ruling 7:** the pass control sits above the stage (Option 1), not in a side rail.
- **Ruling 9:** no release-notes entry. The PR body and the live site are the record.
- **Engineering review, D1–D4** (2026-10-24): one owner for URL cleanup, the Final pass reads its real classes, one shared measuring hook, and the smaller file arrangement. See the review record at the end.

## Files

| File | New? | What |
|---|---|---|
| `src/engine/pageParams.ts` (+ test) | new | The page-key registry and `withPageParams` (§1) |
| `src/engine/useControlState.ts` (+ test) | changed | The one URL cleaner: controls and page keys together (§1) |
| `src/manifests/types.ts` | changed | `AnatomyPart`, `ManifestAnatomy`, `Manifest.anatomy` (§2) |
| `src/manifests/button.ts` | changed | Button's anatomy (§2) |
| `src/manifests/anatomy.test.ts` | new | The anatomy guard (§3) |
| `src/manifests/manifests.test.ts` | changed | No control prop is a page key (§1) |
| `src/pages/component/passes/useStageMeasure.ts` (+ test) | new | The shared measuring hook (§4) |
| `src/pages/component/passes/passViews.tsx` (+ test) | new | The four pass views and the line and dimension math (§5) |
| `src/pages/component/passes/PassesSection.tsx` (+ test) | new | The section, its URL hook and its captions (§6) |
| `src/pages/component/sections.ts`, `src/pages/ComponentPage.tsx` | changed | Wiring (§6) |
| `src/gallery.css` | changed | Layout only (§6) |
| `src/routes.test.tsx` | changed | Pass routes (§8) |
| `e2e/passes.spec.ts` | new | Real-browser checks (§8) |

## 1. URL: one cleaner for controls and page keys

**Found while writing this spec:** `useControlState` rewrites the query to its canonical form on every render (`useControlState.ts:55-58`), and `serializeState` keeps only control keys. Today, `#/components/button?pass=tokens` would lose `pass` at once, and so would every control edit and Reset.

**The fix (review D1: one owner).** Page-level keys register with the control engine, and `useControlState` stays the only code that rewrites the URL.

- **`engine/pageParams.ts`** (new) holds:
  ```ts
  interface PageParam {
    /** The canonical value to keep, or undefined to drop the key (its default, or a value it doesn't know). */
    parse: (raw: string) => string | undefined;
  }
  export const PAGE_PARAMS: Readonly<Record<string, PageParam>> = { pass: { parse: parsePass } };
  export function withPageParams(next: URLSearchParams, current: URLSearchParams): URLSearchParams;
  ```
  - `withPageParams` returns a new `URLSearchParams`: `next`'s control keys, then each page key from `current` that parses to a value, in `PAGE_PARAMS` order. It never mutates either input.
  - `parsePass` keeps `tokens`, `states` and `final`. It drops `wireframe` (the default) and anything unknown.
  - PR D registers its `t.*` keys here the same way.
- **`useControlState`** builds its canonical query, its pushes and its debounced replace through `withPageParams`. This gives three guarantees:
  - a control edit, a preset and Reset all keep `pass`;
  - `?pass=wireframe` and `?pass=xray` are cleaned in the same `replace` that cleans controls;
  - no other code rewrites the URL.

  `serializeState` stays a pure control serializer, so its tests don't change.
- **A manifest control may not be named after a page key.** `manifests.test.ts` checks that no control `prop` is a key of `PAGE_PARAMS`.
- **`usePassParam()`** (inside `PassesSection.tsx`) only reads and pushes. It returns:
  - **`pass`:** `parsePass` of the current `?pass=`, or `wireframe`.
  - **`setPass(next)`:** pushes a history entry built from the current control keys plus the new pass, omitted when it's the default. Back undoes a pass change the way it undoes a control change.

  It never replaces, so it can't race the cleaner.
- **The segmented control pushes once per change.** Arrowing from Wireframe to Final is three history entries, the same as arrowing through a Playground select today.

## 2. Data: `manifest.anatomy`

Added to `apps/gallery/src/manifests/types.ts`:

```ts
/** Where a leader line meets the component: a point on the part's box. */
export type AnchorPoint = 'center' | 'top' | 'bottom' | 'left' | 'right' | 'bottom-right';

/** One labeled part of a component, for the Tokens pass. */
export interface AnatomyPart {
  /** Shown above the part's token chips: "Face", "Edge". */
  label: string;
  /** Selector for the part inside the instance's wrapper. The first match is measured. */
  selector: string;
  /** Public tokens the part reads, as `--bit-…` names. Each must exist and be read by the component (§3). */
  tokens: readonly string[];
  /** Which column its callout sits in. */
  side: 'left' | 'right';
  /** Where its leader line lands on the part. Default: the middle of the edge facing its column. */
  anchor?: AnchorPoint;
}

export interface ManifestAnatomy {
  parts: readonly AnatomyPart[];
  /** The States pass: each a label and a patch over the default state. */
  states: readonly { label: string; state: Partial<ControlState> }[];
  /**
   * The component's file in `packages/core/src/components/`, when it isn't the kebab-case of the name:
   * RadioGroup reads `radio.css`, BitTheme reads `theme.css`. Button needs none.
   */
  css?: string;
}
```

`Manifest` gains `anatomy?: ManifestAnatomy`. A page without it shows no Passes section, and its section bar doesn't list one.

**This differs from the roadmap in two ways.** A part is one callout holding all its tokens, with one leader line, rather than a line per token; four lines read better than six on a 40px Button. And a state is a `Partial<ControlState>` patch, rather than a whole state.

**Button's data** (`manifests/button.ts`):

| Part | Side | Anchor | Tokens |
|---|---|---|---|
| Face | left | center | `--bit-color-primary`, `--bit-weight-bold` |
| Size | left | left | `--bit-control-height-md` |
| Edge | right | top | `--bit-border-width`, `--bit-radius-10px` |
| Shadow | right | bottom-right | `--bit-shadow-md` |

All four parts use `selector: '.bit-button'`. Button has one element, and the anchors spread the lines over it.

States: Default `{}`, Disabled `{ disabled: true }`, Loading `{ loading: true }`.

### The instance is fixed

Every pass renders the manifest's **default** state, through `renderManifest(manifest, { ...defaultState(manifest), ...patch }, { sample: true })`. It does not follow the Playground's state.

**Why:** the chips are data written for one state. If the Playground picked `color="danger"`, a Passes instance that followed it would be red while its Face chip still said `--bit-color-primary`. The passes teach one reference Button; the Playground is where you change it. The caption says so: "The default Button. Change it in the Playground above."

## 3. Anatomy guard (`manifests/anatomy.test.ts`)

For every manifest with `anatomy`, and every part:

1. **The token is a theme token:** it's in `SEMANTIC_TOKENS` (from `@bit-ds/react`).
2. **The component reads it.** The test reads `packages/core/src/components/<file>.css`. `<file>` is `anatomy.css` when set, otherwise the kebab-case of `manifest.name` (Button gives `button.css`). The test fails when that file doesn't exist. It then accepts the token when either:
   - the component CSS reads it directly (`var(--bit-color-…)`); or
   - the component CSS reads a private `--_bit-*` property, and a declaration of that property reads the token. The declaration can be in the component's file or in `packages/core/src/system/*.css`.

   **Why the second case:** Button never names `--bit-color-primary` or `--bit-control-height-md`. It reads `--_bit-color` and `--_bit-size-height`:
   - `system/colors.css:7` declares `--_bit-color: var(--bit-color-primary)`;
   - `system/sizes.css:10` declares `--_bit-size-height: var(--bit-control-height-md)`.

   One hop is enough today. The test fails with a clear message if a token sits two hops away, rather than silently searching further.
3. **The selector matches.** In jsdom, rendering the default instance into a wrapper finds at least one element for `wrapper.querySelector(selector)`.
4. **Each state patch is valid.** Its keys are real control props, and each value parses under that control.

**Failure messages name the component, the part and the token**, for example:

> button anatomy "Face": --bit-color-primary is not read by button.css, directly or through a --_bit-* property it reads

The test also proves itself on fixtures. Each of these fails with its message:

- a token that's missing;
- a token not in the theme;
- a selector that doesn't match;
- a CSS file that doesn't exist.

## 4. `useStageMeasure` (`pages/component/passes/useStageMeasure.ts`)

Review D3: one measuring hook for everything that depends on layout.

```ts
function useStageMeasure<T>(stage: RefObject<HTMLElement | null>, measure: (stage: HTMLElement) => T, empty: T): T;
```

- **When it measures:**
  - on mount;
  - on a `ResizeObserver` callback for the stage (which also fires when the instance inside it changes size);
  - when `document.fonts.ready` resolves.

  All of these go through one `requestAnimationFrame`, so a resize burst measures once. It cleans up the observer, the frame and the font promise's result on unmount.
- **No dependency list.** Each pass view is its own component and mounts fresh when the pass changes, so a new pass always measures. Nothing for the lint rule to miss.
- **Without `ResizeObserver`** (jsdom without a stub) it returns `empty`.
- **Its three callers:**
  - **`TokensPass`** gets its leader lines from `measureLines(stage, parts)`, a pure function in `passViews.tsx`. Each line runs from its callout's edge facing the instance (callouts carry `data-part="<label>"`) to the part's anchor point on the first element matching its selector inside `[data-instance]`, relative to the stage. A selector that matches nothing gives no line; the guard makes that a test failure first.
  - **`WireframePass`** gets its dimensions from `measureBox(stage)`, also pure: the instance's height and inline padding from `getComputedStyle`.
  - **`PassesSection`** gets the stacked mode (§6) from the stage width.

## 5. The four pass views (`pages/component/passes/passViews.tsx`)

All four share one stage. It's a bit `Box` holding the instance in a wrapper with `data-instance`. The Wireframe and Tokens instances are wrapped in `inert`: they're diagrams, so a keyboard user doesn't Tab onto a Button that does nothing there. The stage's text and callouts stay readable.

- **`WireframePass`.** The instance with an SVG overlay of dimension lines:
  - its height, on the left;
  - its inline padding, along the top.

  The numbers come from `measureBox`, never typed: "40px", "16px".
  - **No dimming.** Under Decision 1 (b), `opacity` on the instance would be new gallery paint. The overlay carries the pass on its own. If the owner wants the faded look from the mockup, it's one exceptions entry, but that's a separate call.
- **`TokensPass`.** Two callout columns with the instance between them. Each callout is a `li` holding:
  - the part label, as bit `Text`, size 14, bold;
  - one bit `Code` per token.

  The leader lines come from `measureLines`. A screen reader hears the list: "Face, --bit-color-primary, --bit-weight-bold", and so on.
- **`StatesPass`.** One tile per `anatomy.states` entry: the instance with its patch, and the label under it. The tiles are `inert`. After them comes one live, focusable **Try it** instance with the note "Point at it, press it, or Tab to it". The pass shows hover, press and focus by letting you do them.
- **`FinalPass`.** The live default instance (not inert) and its JSX. The JSX is `toJsx(manifest, defaultState(manifest))`, the snippet the Code panel prints, shown in a bit `CodeBlock` with its copy button. For a default Button that's `<Button>Save</Button>`.

**The SVG** (Wireframe and Tokens) is one `svg` laid over the stage. It has:

- `aria-hidden="true"`, because the callouts and captions already carry the content;
- `stroke: currentColor` for its lines and labels, so they follow the theme and become `CanvasText` under forced colors;
- `pointer-events: none` on the svg.

The SVG's paint is inline presentation in a diagram, the pattern the Tokens page's `ColorFlow` already uses. It is not gallery CSS.

## 6. `PassesSection` (`pages/component/passes/PassesSection.tsx`)

It sits inside one bit `Card`, so nothing nests, top to bottom:

1. **The control row:**
   - a bit `SegmentedControl`, `legend="Pass"` with `legendHidden`, with the four passes as options and its value from `usePassParam`;
   - a **Next** `Button`, outline, labeled with where it goes: "Next: Tokens". From Final it wraps to "Next: Wireframe";
   - the progress line, a `Text`: "2 of 4 seen", then "All 4 seen". Its pips are decorative and `aria-hidden`.
2. **The stage:** a `Box` with `role="group"` and `aria-label="Tokens pass: Button"`.
3. **The caption panel** (Ruling 6): a `Box` with a top border from bit tokens (no new paint) holding:
   - **"What this pass shows":** one sentence per pass, shared by every component, kept as a constant in this file. For example, Tokens: "Each part points to the tokens it reads. Change a token and this is everything that moves."
   - **"Reads":** built from data, never typed per component:
     - Wireframe: the measured height and padding;
     - Tokens: each part's tokens;
     - States: each state's props, such as `disabled`;
     - Final (review D2): the classes the rendered element really has, read from its `classList` (`bit-button bit-primary bit-solid bit-md`), plus the line "Default props aren't printed in the code."

**Clicking the stage does nothing.** The mockup's stage-as-button would nest interactive content (Final and Try it are live Buttons). Next and the segmented control are how you move.

**"Seen"** is component state. It counts the distinct passes shown during this visit to the page, including the first. `ComponentRoute` already keys the page by slug (`ComponentRoute.tsx:15`), so the count starts over on a new component. It isn't in the URL.

**Wiring:**

- `SECTIONS.passes = { id: 'section-passes', title: 'Passes' }`.
- `componentSections` lists it after Playground when `manifest.anatomy` is set.
- `ComponentPage` renders it between Playground and Variants.

**Stacked mode.** When the stage is narrower than 600px, the callouts drop into one list under the instance and the leader lines go away. This happens at 200% zoom on a 1280px screen, or in a narrow window. The parts are still listed by name, so nothing is lost. `useStageMeasure` on the stage width sets `data-stacked`, and `TokensPass` draws no lines while it's set.

**Gallery CSS:** grid and flex for the columns and the stage, the stacked layout, and the svg's position. Every property is on the layout allowlist, so `gallery-css.exceptions.ts` gets no new entries.

## 7. Keyboard and screen readers

- **Tab order:**
  1. the segmented control (one stop; arrows move between passes, as in any bit SegmentedControl);
  2. Next;
  3. then, only on States, the Try it Button;
  4. then, only on Final, the Button and the code's copy button.
- **Next keeps focus on itself** and pushes the next pass. A polite live region inside the section says "Tokens, pass 2 of 4". The region is always in the DOM, starts empty, and is filled only by Next, because the segmented control's radios already announce their own change.
- **The focus ring** is bit's default, unchanged and always visible.
- **Reduced motion:** nothing animates. The pass change is instant in every mode, and the lines are redrawn, not tweened.
- **Forced colors:** the lines use `currentColor`, and the callouts are bit components with their existing forced-colors rules.

## 8. Tests

**Unit (vitest, jsdom):**

- **`pageParams.test.ts`:**
  - `withPageParams` keeps a page key that parses and drops one that doesn't (`wireframe`, `xray`);
  - controls come first, then page keys in registry order;
  - it doesn't mutate its inputs.
- **`useControlState.test.tsx`** (extended):
  - a control edit, a preset, Reset and the debounced typing replace all keep `?pass=tokens`;
  - the canonical rewrite cleans `?pass=xray` and `?pass=wireframe` in the same replace that cleans a bad control value.
- **`useStageMeasure.test.tsx`:**
  - it measures on mount, on an observer callback and on `fonts.ready`;
  - a burst of callbacks measures once in one frame;
  - it returns `empty` without `ResizeObserver`;
  - it cleans up on unmount.
- **`passViews.test.tsx`:**
  - `measureLines`, with stubbed rects, for each anchor point and both sides; a part with no match gives no line;
  - `measureBox` reads computed height and padding;
  - the Tokens callouts list each part's tokens;
  - States renders one tile per entry plus a focusable Try it;
  - Final prints `toJsx`'s snippet;
  - inert on the Wireframe, Tokens and States tiles, but not on Try it or Final.
- **`PassesSection.test.tsx`:**
  - `usePassParam`: a missing or bad `?pass=` reads as Wireframe; `setPass` pushes, keeps control keys and omits the default; Back returns to the previous pass;
  - each `?pass=` renders its view;
  - Next wraps from Final to Wireframe and pushes a history entry, and its label names the following pass;
  - the seen count and "All 4 seen";
  - the live region speaks for Next only;
  - the instance follows the defaults, not the Playground's state;
  - Final's Reads lists the rendered classes;
  - stacked mode below 600px draws no lines.
- **`anatomy.test.ts`:** the guard from §3, with its fixtures.
- **`manifests.test.ts`:** no control prop is a page key.
- **`routes.test.tsx`:** `#/components/button?pass=tokens` (and each other pass) renders the page with that pass.
- **`gallery-css.test.ts`:** passes unchanged, with no new exceptions.

**e2e (Playwright, new `e2e/passes.spec.ts`):**

- **Navigation:**
  - each `?pass=` value loads its pass;
  - Back and Forward step through passes picked with the control and with Next;
  - changing a Playground control keeps `?pass=`;
  - `?pass=xray` lands on Wireframe with the key gone.
- **Keyboard only:** Tab to the control, arrow to Tokens, Tab to Next, press it. Then check the pass, the URL, and that the focus ring is visible on each stop (a screenshot assertion on the focused element's outline).
- **Leader lines:** at 1440px and 1024px, each line's ends fall within 1px of its callout's edge and its anchor point. At 640px (200% of a 1280px screen), the stage is stacked, has no lines, and lists every part.
- **Axe:** on each of the four passes, in light and dark (8 runs). This starts the TODOS item "axe on toggled and open states".
- **Screenshots** in headed Chromium for the owner: each pass in both modes, and the stacked layout.

The full local check list from CONTRIBUTING runs before the PR, `npm run e2e` included.

## 9. Docs

- **README "Contents":** no change. The README doesn't link component page sections.
- **No CHANGELOG or release-notes entry** (Ruling 9).
- **`docs/superpowers/plans/`:** the task-level plan for this spec.

## Changes to the roadmap's PR A text

- The URL fix (§1) is new. The roadmap assumed `?pass=` would just work.
- A part is one callout with several tokens. States are patches over the default state. The anatomy can name its CSS file.
- The instance is always the default state.
- Wireframe has no dimming under Decision 1 (b).
- The default pass is Wireframe. The mockup opens on Tokens, but the passes are an order to step through, so they start at 1.
- The stage is stacked below 600px, with no lines.
- One measuring hook (`useStageMeasure`) replaces `useAnchors`. The pass views share one file.

## Out of scope

- Passes on any other page (PR B).
- Role tokens in the chips (PR C rewrites the anatomy data).
- The drawer and CHANGED markers (PR D).
- The dot-grid surface and the status bar (PR E).
- Animating between passes.
- A "Compare with Final" view (not adopted, Ruling 7).

## Engineering review (2026-10-24)

Run by hand, following `/plan-eng-review`'s sections. gstack's helper scripts (review log, plan-reality rows, outside voice) were blocked by the session's permission check, so this review is **not logged in gstack**, and there was no outside-model pass.

**Scope:** 13 rows in the Files table, 5 new modules. The original arrangement had about 20 files and 8 modules; the owner chose the smaller one (D4). No features were cut.

**Findings and dispositions:**

| # | Sev | Conf | Where | Finding | Disposition |
|---|---|---|---|---|---|
| 1 | P1 | 9 | `useControlState.ts:55-58` | The control hook rewrites the URL to drop unknown keys, and the first draft added a second rewriter for `?pass=`. Two cleaners working from the same old URL can each undo the other's fix. | D1: one owner. Page keys register a parser, and `useControlState` cleans everything (§1) |
| 2 | P2 | 9 | `toJsx.ts:132` | A default Button prints as `<Button>Save</Button>`, so a props-to-classes "Reads" line for Final would name props the code doesn't show | D2: Final reads the element's real classes (§6) |
| 3 | P2 | 9 | `components/radio.css`, `theme.css` | The guard's kebab-case file rule misses RadioGroup and BitTheme | Fixed in the spec: `anatomy.css` override, plus a guard check that the file exists (§2, §3) |
| 4 | P3 | 7 | spec §4 (first draft) | `useAnchors(..., deps: unknown[])` takes a list the lint rule can't check, and Wireframe needed the same resize and font logic | D3: one `useStageMeasure`, with pass views mounting fresh (§4) |
| 5 | n/a | 8 | `ComponentRoute.tsx:15` | Checked: the page is keyed by slug, so "seen" resets on a new component with no extra code | No change needed |

**Architecture.** Data flows one way:

```
URL ?pass= ─► useControlState (the only cleaner, via PAGE_PARAMS) ─► usePassParam (read + push)
                                                                      │
manifest.anatomy + defaultState ─► pass view ─► useStageMeasure ─► measureLines / measureBox ─► SVG
```

Production failure considered: a CSS change that renames a private property. The guard fails in CI with the component, part and token named, before the callout can lie.

**Tests.** Every new branch in §1, §4, §5 and §6 has a unit test in §8. Real-browser behavior is covered in e2e: the leader-line geometry, zoom and stacking, keyboard-only use, axe on every pass, and the URL round trip. There are no LLM or eval paths.

**Performance.** No issues. Four parts, one observer, and at most one measure per frame.

**Unresolved decisions:** none.
