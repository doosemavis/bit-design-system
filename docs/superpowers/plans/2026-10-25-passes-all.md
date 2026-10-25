# Passes, Built Up, on Every Component Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the Passes section into one instance that builds itself up across Wireframe, Tokens, States and Final, in the approved "Blueprint" style. Lines land on the part's painted pixels, and each part lights up green in its own shape. Then roll the section out to every component page.

**Architecture:**
- **Data.** `manifest.anatomy` parts gain:
  - a `touch`: what the line touches, which is also the highlight kind;
  - `off` overrides: how the part draws nothing before it lands;
  - a shared `step` name;
  - `unseen` for top-layer parts.

  Anatomy also gains a `scene` for Final.
- **Pure core.**
  - `geometry.ts`: touch points, right-angle routes, callout placement, highlight shapes, loupe rule.
  - `build.ts`: each pass as a list of build states.
- **Runtime.**
  - `useBuild` steps through those states with timers, and is cancelable.
  - `applyOverrides` turns parts' tokens off and on.
  - `motion.ts` drives all motion through the Web Animations API, because gallery CSS may not animate.
- **Stage.** One `BuildStage` holds one instance, a diagram SVG (grid, outline, lines, dots, highlights, loupe frame), positioned callouts, state chips and the Final scene. `PassesSection` keeps PR A's shell and URL hook.

**Tech Stack:** npm workspaces, React 19 + TypeScript, react-router-dom (hash router), vitest + jsdom + Testing Library, Playwright + axe, plain CSS (gallery layout only), Web Animations API.

**Spec:** `docs/superpowers/specs/2026-10-25-passes-all-design.md`, owner-approved 2026-10-25. It builds on PR A's spec, `docs/superpowers/specs/2026-10-24-passes-design.md`, whose rules still hold unless this spec changes them.

## Global Constraints

- **Scope:** `apps/gallery/` only. No change under `packages/`, no CHANGELOG or release-notes entry, no version bump.
- **Gallery CSS is layout only.** `gallery.css` may use only the `cssGuard.ts` allowlist (display, grid*, flex*, gap, position, top/right/bottom/left, z-index, width/height and their min/max, box-sizing, aspect-ratio, contain, margin*, padding*, overflow*, clip-path, white-space, `--_gallery-*`).
  - No `transition`, `animation`, `opacity`, `transform`, `visibility`, `background`, `border` or `pointer-events` in `gallery.css`.
  - `gallery-css.exceptions.ts` gets no new entries.
- **Paint and motion live elsewhere:**
  - paint comes from bit components, from inline SVG presentation in the stage diagram, or from inline `style` set by script;
  - motion is `element.animate()` only, through `motion.ts`.
- **Highlight color:** `#3DDC74`, as `HIGHLIGHT` in `geometry.ts`. Under `(forced-colors: active)` it's `Highlight`. The dot is `r={5}`, green fill, with a 2px keyline in `var(--bit-color-text)`.
- **Graph paper:** a 16px SVG pattern of 1px lines, stroke `var(--bit-color-primary)` at `strokeOpacity={0.12}`, under the instance. Hidden in Final.
- **Lines:** right-angled. 2px stroke in `var(--bit-color-text)`. Faded lines (another callout is hot) use `strokeOpacity={0.3}`.
- **Diagram attributes** (the e2e tests read these):
  - each line is a `path` with `data-role="line"` and `data-part="<label>"`;
  - each dot is a `circle` with `data-role="dot"`, `data-part` and `data-kind="<touch.kind>"`;
  - each highlight is a `path` with `data-role="highlight"`, `data-part` and `data-kind`;
  - the loupe root has `data-role="loupe"`;
  - Final wraps the instance in `div[data-scene-slot]`.
- **Text:** at least 16px, except the 12px mono SVG labels, which the owner kept (2026-10-24). Never raise them.
- **Raw tags banned** (`lint-ban.test.ts`): button, a, input, textarea, select, table, code, pre, h1–h6. Use bit components.
- **No `as=` props. No bit `Card` inside a `Card`,** including in scenes. US spelling ("color").
- **Stacked below 600px of stage width:** callouts list under the instance, with no lines, highlights, loupe or graph paper.
- **Timing comes from tokens:** a line draws in `3 × --bit-duration-normal` (480ms), and a step holds `6 × --bit-duration-normal` (960ms). Read at runtime, falling back to 160ms.
- **Reduced motion:** no `animate()` calls at all. A pass renders its end state at once. Play holds each pass's end state for one step-hold.
- **Copy (exact):**
  - **Play** reads `Play`, and `Stop` while running.
  - **State chips:** each `anatomy.states` label, then `Try it`.
  - **Live note:** `Point at it, press it, or Tab to it`.
  - **SHOWS:**
    - wireframe: `The box only: its height and padding, measured from the page.`
    - tokens: `Each part lands as its token turns on. Point at a callout to light its part up.`
    - states: `The states its props set. Pick one, or pick Try it and use it.`
    - final: `The component in a real place, and the JSX that makes it.`
- **URL:** `?pass=` is cleaned only by `useControlState` through `withPageParams`. Pass values are `wireframe | tokens | states | final`, and the default is never written.
- **Updated failure checklist** (run on this branch and on `review/workbench`):
  1. `?color=purple&pass=tokens&utm=x` becomes `?pass=tokens` in one replace.
  2. Back after Reset keeps page keys and restores the controls.
  3. Lines re-measure after `document.fonts.ready`.
  4. Narrowing past 600px on Tokens leaves no stale lines, highlights or loupe, and the callouts stack.
  5. Tab order:
     - the inert diagram and instance are skipped;
     - Tokens reaches each callout;
     - States reaches the chip group, then the instance only after Try it.

## Review Focus

These are failure modes the spec implies but no task's main tests cover. Each one's test is added to the task named.

1. **A resize, a font load or a mode switch while a step is running** must leave every line landing on its part when the step ends. *(Task 7 unit + Task 9 e2e: resize mid-Tokens, toggle dark mid-Tokens, then re-check the touch rule.)*
2. **Picking a pass mid-run, or clicking fast,** leaves no stale overrides, highlights or pending timers. *(Tasks 4 and 5: cancel removes every override and fires no later state.)*
3. **Changing a Playground control while the Passes section is mid-run** doesn't restart or change the build. The instance stays the default plus `base`. *(Task 8.)*
4. **Crossing the 600px stacked threshold mid-run** removes lines, highlights and the loupe in the same frame, and restores them, measured fresh, on widening. *(Task 7.)*
5. **The loupe never opens a second overlay or steals focus.** Its copy renders without `anatomy.base` and is inert. *(Task 6.)*

---

### Task 1: Anatomy data model and guard

**Files:**
- Modify: `apps/gallery/src/manifests/types.ts` (extend `AnatomyPart`, `ManifestAnatomy`, `Manifest`)
- Modify: `apps/gallery/src/manifests/button.ts` (anatomy)
- Modify: `apps/gallery/src/test/anatomyGuard.ts`
- Test: `apps/gallery/src/manifests/anatomy.test.tsx`

**Interfaces:**
- Produces (in `types.ts`):
  ```ts
  export type Edge = 'top' | 'right' | 'bottom' | 'left';
  /** What a part's line touches, and the shape it lights up in. */
  export type HighlightKind = 'ring' | 'fill' | 'bracket' | 'strip' | 'box' | 'text';
  export interface Touch {
    kind: HighlightKind;
    /** The side of the part's box the touch point sits on (ring, strip, bracket, box, text) or near (fill). */
    edge: Edge;
    /** 0–1 along that side. Default 0.5. */
    at?: number;
    /** The direction the line leaves the part. Default: `edge`. */
    leave?: Edge;
  }
  // AnatomyPart gains (keep `anchor?` until Task 7 deletes it with passViews.tsx):
    touch: Touch;
    /** Token overrides that make the part draw nothing before it lands. Absent: a measure step (it only lights up). Keys must be in `tokens`. */
    off?: Readonly<Record<string, string>>;
    /** Where `off` is set: on the instance wrapper (default), or on the part's own matched element (BitTheme). */
    offOn?: 'instance' | 'part';
    /** Parts with the same step land together. Default: `label`. */
    step?: string;
    /** Why the part has no line: it renders in the top layer (Menu list, Select listbox, Dialog). Listed only; its selector isn't checked. */
    unseen?: string;
  export interface AnatomyScene {
    /** One line for the caption: "In use: the main action in a dialog". */
    caption: string;
    /** The scene around the instance. Built from bit components only; every piece but `instance` is wrapped in `ScenePiece` (Task 6). */
    render: (instance: ReactElement) => ReactElement;
  }
  // ManifestAnatomy gains:
    /** The component's root inside `[data-instance]`, when it isn't the first child (Tooltip, Menu, Dialog). */
    root?: string;
    /** A patch every pass renders with, over the defaults (Tooltip: `{ pinned: true }`). */
    base?: Partial<ControlState>;
    scene: AnatomyScene;
  // Manifest gains:
  /** Why this page has no Passes section (Logo). Every manifest has `anatomy` or this. */
  passesExempt?: string;
  ```
- Produces (in `anatomyGuard.ts`): `offErrors(manifest: Manifest): string[]`, which returns one message per `off` key that isn't in its part's `tokens`, as `<slug> anatomy "<label>": off sets <key>, which the part doesn't list`.

- [ ] **Step 1: Write the failing tests** in `anatomy.test.tsx`:
  - Replace the distinct-anchor test with `'%s: parts on one element touch different points'`. The key is `` `${part.selector} ${part.touch.kind} ${part.touch.edge} ${part.touch.at ?? 0.5}` ``, and the set size must equal the part count.
  - `'%s: off only sets the part's own tokens'`: `expect(offErrors(manifest)).toEqual([])`.
  - In `'%s: every selector matches the default instance'`, skip parts with `unseen`, and render with `{ ...defaultState(m), ...m.anatomy!.base }`.
  - Fixture `'fails an off key the part does not list'`: Face with `tokens: ['--bit-color-primary']` and `off: { '--bit-shadow-md': 'none' }`. Expect `['button anatomy "Face": off sets --bit-shadow-md, which the part doesn\'t list']`.
- [ ] **Step 2: Run them; expect failures.** Run `cd apps/gallery && npx vitest run src/manifests/anatomy.test.tsx`. Expect it to fail with type errors: no `touch` and no `offErrors`.
- [ ] **Step 3: Implement the types and `offErrors`.** Then give Button's parts these new fields, in this order (the mockup's landing order), keeping each part's existing `anchor`:

  | label | touch | off |
  |---|---|---|
  | Edge | `{ kind: 'ring', edge: 'top', at: 0.68 }` | `{ '--bit-border-width': '0px' }` |
  | Face | `{ kind: 'fill', edge: 'left', at: 0.3, leave: 'top' }` | `{ '--bit-color-primary': 'transparent' }` |
  | Size | `{ kind: 'bracket', edge: 'left' }` | none (a measure step) |
  | Shadow | `{ kind: 'strip', edge: 'bottom', at: 0.72 }` | `{ '--bit-shadow-md': 'none' }` |

  Button's `scene` for now is `{ caption: 'In use: the main action in a dialog', render: (instance) => instance }`. Task 6 gives it the dialog.
- [ ] **Step 4: Run the tests and typecheck; expect a pass.** Run `npx vitest run src/manifests/anatomy.test.tsx && npm run typecheck -w @bit-ds/gallery`.
- [ ] **Step 5: Commit:** `feat(gallery): anatomy parts touch their part and can switch their tokens off`.

### Task 2: Geometry

**Files:**
- Create: `apps/gallery/src/pages/component/passes/geometry.ts`
- Test: `apps/gallery/src/pages/component/passes/geometry.test.ts`

**Interfaces:**
- Consumes: `Touch`, `Edge`, `HighlightKind` (Task 1).
- Produces:
  ```ts
  export const HIGHLIGHT = '#3DDC74';
  export interface Point { x: number; y: number }
  export interface Rect { x: number; y: number; width: number; height: number }
  export interface PartMetrics { borderWidth: number; radius: number; shadowX: number; shadowY: number }
  export function parseShadow(boxShadow: string): { x: number; y: number }; // first "Xpx Ypx" offset, or {0,0} for none
  export function partMetrics(el: Element): PartMetrics;                   // from getComputedStyle
  export function resolveTouch(box: Rect, m: PartMetrics, touch: Touch): Point;
  export function routeLine(from: Point, leave: Edge, to: Point): Point[];   // right angles only
  export function calloutTarget(leave: Edge, anchor: Point, instance: Rect, height: number): number; // wanted top
  export function placeCallouts(items: readonly { key: string; target: number; height: number }[], top: number, bottom: number, gap: number): Map<string, number>;
  export function highlightShape(kind: HighlightKind, edge: Edge, box: Rect, m: PartMetrics): { d: string; paint: 'stroke' | 'hatch' | 'solid' };
  export function needsLoupe(kind: HighlightKind, m: PartMetrics, box: Rect): boolean;
  export function highlightColor(): string; // HIGHLIGHT, or 'Highlight' under forced colors
  ```

- [ ] **Step 1: Write the failing tests**, with box `{ x: 100, y: 50, width: 100, height: 52 }` and metrics `{ borderWidth: 3, radius: 10, shadowX: 4, shadowY: 4 }`:
  - `resolveTouch` returns:
    - for `ring`/top/0.68: `{ x: 168, y: 51.5 }` (the middle of the top stroke);
    - for `fill`/left/0.3: `{ x: 113, y: 65.6 }` (border + 10px in, 30% down);
    - for `bracket`/left: `{ x: 90, y: 76 }`;
    - for `strip`/bottom/0.72: `{ x: 172, y: 104 }` (the middle of the 4px bottom strip);
    - for `strip`/right/0.5: `{ x: 202, y: 76 }`;
    - for `box`/top/0.5: `{ x: 150, y: 50 }`;
    - for `text`/bottom/0.5: `{ x: 150, y: 104 }`.
  - `routeLine`:
    - leaving `top`, from `{x:113,y:65}` to `{x:40,y:20}`: `[{113,65},{113,20},{40,20}]`;
    - leaving `left`, from `{x:90,y:76}` to `{x:40,y:76}`: `[{90,76},{40,76}]`;
    - leaving `left` with different y's: four points, the elbow at the x midpoint.
    - Every segment is horizontal or vertical (a property check over 20 random pairs).
  - `calloutTarget`: leaving `top` puts the callout's bottom 24px above `instance.y`; leaving `left` centers it on `anchor.y`.
  - `placeCallouts`: two items with target 100 and heights 40, gap 16, give 100 and 156. Items never go above `top`, and they shift up from `bottom` when they'd overflow.
  - `highlightShape`:
    - `strip` gives `paint: 'solid'`, and a path covering only x∈[200,204] (right strip) and y∈[102,106] (bottom strip);
    - `fill` gives `paint: 'hatch'`, inset by 3;
    - `ring` gives `paint: 'stroke'`.
  - `needsLoupe`: strip with shadow 4 is true; ring with border 3 is false; box with height 1 is true; box 40×20 is false.
  - `parseShadow('4px 4px 0 rgb(0,0,0)')` is `{x:4,y:4}`, and `parseShadow('none')` is `{x:0,y:0}`.
  - `highlightColor()` is `HIGHLIGHT`, or `'Highlight'` with `matchMedia('(forced-colors: active)')` stubbed true.
- [ ] **Step 2: Run them; expect failures.** Run `npx vitest run src/pages/component/passes/geometry.test.ts`. Expect FAIL: module missing.
- [ ] **Step 3: Implement `geometry.ts`.** The rules the tests don't pin:
  - fill sits `borderWidth + 10` in from its edge;
  - bracket sits 10px outside;
  - text sits 2px under the box;
  - `needsLoupe` is true only for `strip` and `box`, when their thin side is under 6px (a ring traces the whole box, so it stays visible).
- [ ] **Step 4: Run the tests; expect a pass.**
- [ ] **Step 5: Commit:** `feat(gallery): passes geometry: touch points on painted pixels, right-angle routes`.

### Task 3: Build model

**Files:**
- Create: `apps/gallery/src/pages/component/passes/build.ts`
- Test: `apps/gallery/src/pages/component/passes/build.test.ts`

**Interfaces:**
- Consumes: `ManifestAnatomy` (Task 1), `Pass`, `PASSES` (`engine/pageParams.ts`).
- Produces:
  ```ts
  export interface BuildState {
    pass: Pass;
    landed: readonly string[];   // step names, in landing order
    fresh: string | null;        // the step that just landed (highlight for a beat)
    chip: string | null;         // States: a state label, or 'Try it'
    live: boolean;               // instance focusable (Try it, Final)
    outline: boolean; grid: boolean; lines: boolean; scene: boolean;
    note: string;                // the caption's right-hand line
  }
  export function stepNames(anatomy: ManifestAnatomy): string[];          // unique, in part order
  export function stepsOf(anatomy: ManifestAnatomy, pass: Pass): BuildState[]; // the pass's run; last = its end
  export function endOf(anatomy: ManifestAnatomy, pass: Pass): BuildState;
  ```

- [ ] **Step 1: Write the failing tests**, using Button's anatomy:
  - `stepNames` is `['Edge','Face','Size','Shadow']`. A fixture with two parts sharing `step: 'Edges'` yields one name.
  - Wireframe is one state: `landed: []`, `outline: true`, `grid: true`, `lines: false`, `scene: false`.
  - Tokens has four states with cumulative `landed`, `fresh` = the newest name, `lines: true`, `outline: false`.
    - The first note is `Edge: --bit-border-width, --bit-radius-10px`.
    - The last state has `landed` = all four and `fresh: 'Shadow'`.
  - States runs Default → Disabled → Loading → Default by `chip`, with everything landed, `lines: false` and `live: false`. `endOf(…,'states').chip` is `'Default'`.
  - Final is one state: everything landed, `grid: false`, `lines: false`, `scene: true`, `live: true`, and note `= anatomy.scene.caption`.
  - `endOf(a, p)` deep-equals the last of `stepsOf(a, p)` for every pass.
- [ ] **Step 2: Run them; expect a failure.**
- [ ] **Step 3: Implement `build.ts`.** Each note lists the step's parts as `Label: token, token`, joined by ` · ` when a step holds several parts. A measure step's note is the same.
- [ ] **Step 4: Run the tests; expect a pass.**
- [ ] **Step 5: Commit:** `feat(gallery): passes build model: each pass as a run of build states`.

### Task 4: Overrides and motion helpers

**Files:**
- Create: `apps/gallery/src/pages/component/passes/overrides.ts`, `apps/gallery/src/pages/component/passes/motion.ts`
- Test: `overrides.test.ts`, `motion.test.ts` (same folder)

**Interfaces:**
- Produces:
  ```ts
  // overrides.ts
  /** Sets each not-yet-landed part's `off` overrides; returns an undo that removes exactly what it set. */
  export function applyOverrides(wrapper: HTMLElement, parts: readonly AnatomyPart[], landed: readonly string[]): () => void;
  // motion.ts
  export function prefersReducedMotion(): boolean;
  export function durationMs(el: Element): number;               // --bit-duration-normal in ms, fallback 160
  export function drawIn(path: SVGPathElement, ms: number): Animation | null;   // stroke-dashoffset length → 0
  export function fadeIn(el: Element, ms: number): Animation | null;           // opacity 0 → 1
  export function slide(el: Element, from: DOMRect, to: DOMRect, ms: number): Animation | null; // FLIP translate+scale → none
  ```
  Every motion function returns `null`, and doesn't animate, when `prefersReducedMotion()` is true or `el.animate` is missing (jsdom).

- [ ] **Step 1: Write the failing tests:**
  - **Wrapper overrides:** with Button's parts and `landed: ['Edge']`, the wrapper gets `--bit-color-primary: transparent` and `--bit-shadow-md: none`, and not `--bit-border-width`. Calling undo leaves `wrapper.style.cssText === ''`.
  - **Part overrides:** a part with `offOn: 'part'` sets its override on `wrapper.querySelector(selector)`, not on the wrapper.
  - **A measure step** (no `off`) sets nothing.
  - **Review Focus 2:** applying for `landed: []` then undoing at once leaves no property behind, even when two parts override the same token.
  - **Motion:**
    - `durationMs` reads `--bit-duration-normal: 160ms` from a styled element and returns 160, or 160 when it's missing;
    - with `matchMedia` stubbed to reduce, `fadeIn` returns null and never calls `animate`;
    - with `animate` stubbed, `slide` passes keyframes `[{ transform: 'translate(dx,dy) scale(sx,sy)' }, { transform: 'none' }]`.
- [ ] **Step 2: Run them; expect failures.**
- [ ] **Step 3: Implement both files.** Use `style.setProperty`/`removeProperty`. Undo removes only the keys this call set. Use `test/matchMedia.ts` for the stub.
- [ ] **Step 4: Run the tests; expect a pass.**
- [ ] **Step 5: Commit:** `feat(gallery): passes overrides turn tokens off; motion runs only through animate()`.

### Task 5: `useBuild`, the runner

**Files:**
- Create: `apps/gallery/src/pages/component/passes/useBuild.ts`
- Test: `useBuild.test.tsx`

**Interfaces:**
- Consumes: `stepsOf`, `endOf`, `BuildState` (Task 3), `prefersReducedMotion`, `durationMs` (Task 4).
- Produces:
  ```ts
  export interface BuildApi {
    state: BuildState;
    /** Changes on every state change, so measuring re-runs. */
    version: number;
    /** Call right before setPass from the pass control or Next: the coming pass plays its steps if it's later. */
    markForward: () => void;
    /** Plays all four passes locally from Wireframe, then calls onDone (PassesSection pushes ?pass=final). */
    play: (onDone: () => void) => void;
    stop: () => void;
    playing: boolean;
    /** States: apply a chip (a state label, or 'Try it'). */
    pickChip: (label: string) => void;
  }
  export function useBuild(anatomy: ManifestAnatomy, pass: Pass, hold?: number): BuildApi; // hold default: 6 × durationMs(document.documentElement)
  ```

- [ ] **Step 1: Write the failing tests** (fake timers, `renderHook`):
  - **Arriving without replay:** mounted at `tokens`, `state` deep-equals `endOf(a,'tokens')` at once.
  - **Forward plays:** at `wireframe`, `markForward()` then rerender with `tokens` gives Tokens step 1 immediately. After `hold`, it's step 2. After `3 × hold`, it's the end. `version` grows each time.
  - **Backward jumps:** at `states`, `markForward()` then rerender with `tokens` (an earlier pass) jumps to the Tokens end.
  - **A change without `markForward`** (Back, a link) jumps.
  - **Cancel (Review Focus 2):**
    - rerendering with `final` mid-Tokens shows the Final end, and no Tokens state fires afterwards (advance 10 × hold, still Final);
    - `stop()` mid-play freezes the current state and clears its timers (`vi.getTimerCount()` is 0).
  - **Play:**
    - `play(onDone)` goes through all four runs in order;
    - `state.pass` shows wireframe → tokens → states → final;
    - `onDone` is called once, at the end;
    - `playing` is true during the run.
  - **Reduced motion:** `markForward` + tokens gives the Tokens end at once. `play` shows each pass's end for one `hold` each.
  - **`pickChip('Disabled')`** gives `chip: 'Disabled'`, `live: false`. `pickChip('Try it')` gives `live: true`.
- [ ] **Step 2: Run them; expect failures.**
- [ ] **Step 3: Implement `useBuild`.**
  - Keep the forward flag in a ref that is consumed on the next pass change.
  - Keep one timer handle, cleared on every pass change, `stop`, `play` and unmount.
  - Compare pass order with `PASSES.indexOf`.
- [ ] **Step 4: Run the tests; expect a pass.**
- [ ] **Step 5: Commit:** `feat(gallery): useBuild steps a pass's build and cancels cleanly`.

### Task 6: Instance, scene pieces, loupe and state chips

**Files:**
- Create: `apps/gallery/src/pages/component/passes/Instance.tsx` (moved out of `passViews.tsx`, which then imports it), `ScenePiece.tsx`, `Loupe.tsx`, `StateChips.tsx`
- Modify: `apps/gallery/src/pages/component/passes/passViews.tsx` (import `Instance`), `apps/gallery/src/manifests/button.ts` (scene)
- Test: `Instance.test.tsx`, `ScenePiece.test.tsx`, `Loupe.test.tsx`, `StateChips.test.tsx`

**Interfaces:**
- Consumes: `applyOverrides` (Task 4), `Point`, `Rect` (Task 2).
- Produces:
  ```ts
  /** The manifest's defaults + anatomy.base (unless withBase is false) + patch, in div[data-instance]. Never the Playground's state. */
  export function Instance(props: { manifest: Manifest; patch?: Partial<ControlState>; inert?: boolean; withBase?: boolean }): ReactElement;
  /** A non-instance piece of a Final scene: always inert, so only the instance is live. */
  export function ScenePiece({ children }: { children: ReactNode }): ReactElement; // <div inert data-scene-piece>
  /** A 4× copy of the instance around `at`, with a measure mark of `thickness` px. data-role="loupe", aria-hidden, inert, withBase false. */
  export function Loupe(props: { manifest: Manifest; landed: readonly string[]; at: Point; thickness: number; origin: Rect }): ReactElement;
  /** The States chips: a bit SegmentedControl, legend "State" (legendHidden), options = state labels + 'Try it'. */
  export function StateChips(props: { labels: readonly string[]; value: string; onPick: (label: string) => void }): ReactElement;
  ```
- **Button's scene:**
  - caption `In use: the main action in a dialog`;
  - `render` returns a bit `Box` with a border and the "Save changes?" heading (bit `Heading` size 20) and text "Your theme edits stay in this tab until you save them.", all in `ScenePiece`;
  - a row holding `ScenePiece(<Button variant="outline">Cancel</Button>)` and the `instance`.

- [ ] **Step 1: Write the failing tests:**
  - **`Instance`:** renders the defaults merged with `base`. With `withBase={false}` it drops `base`.
  - **A scene guard,** for every manifest with anatomy (`it.each`): render `anatomy.scene.render(<span data-scene-slot />)`. Every focusable element outside `[data-scene-slot]` has an `[inert]` ancestor, and the scene contains no `.bit-card .bit-card`.
  - **`Loupe`:**
    - renders `[data-role="loupe"]` with `aria-hidden` and `inert`;
    - its instance has the same `off` overrides as the main stage for the given `landed`;
    - with a manifest whose `base` is `{ pinned: true }`, the loupe's instance renders without it (Review Focus 5);
    - its measure label reads `4px` for `thickness: 4`.
  - **`StateChips`:** lists `Default, Disabled, Loading, Try it`. Picking `Loading` calls `onPick('Loading')`. It's one tab stop.
- [ ] **Step 2: Run them; expect failures.**
- [ ] **Step 3: Implement the components and Button's scene.**
  - The loupe's copy is an `Instance` inside a wrapper with inline `transform: scale(4)` and `transformOrigin` at `at`. It runs `applyOverrides` in a layout effect.
  - The measure mark is SVG, labeled 12px mono.
- [ ] **Step 4: Run the tests; expect a pass.**
- [ ] **Step 5: Commit:** `feat(gallery): passes instance, scene pieces, loupe and state chips`.

### Task 7: `BuildStage`, the one stage

**Files:**
- Create: `apps/gallery/src/pages/component/passes/BuildStage.tsx`, `StageDiagram.tsx`, `Callouts.tsx`
- Modify: `apps/gallery/src/pages/component/passes/useStageMeasure.ts` (a `version` argument)
- Delete: `apps/gallery/src/pages/component/passes/passViews.tsx` and `passViews.test.tsx`.
  - Move `measureBox` and `renderedClasses` into `geometry.ts`, with their tests. They read `anatomy.root ?? ':scope > *'` inside `[data-instance]` (the part-root follow-up).
  - Remove `AnchorPoint` and `AnatomyPart.anchor` from `types.ts` and `button.ts`.
- Modify: `apps/gallery/src/gallery.css` (layout only), `apps/gallery/src/pages/component/passes/PassesSection.tsx` (render `BuildStage`; Task 8 finishes it)
- Test: `BuildStage.test.tsx`, `useStageMeasure.test.tsx`

**Interfaces:**
- Consumes: Tasks 2–6.
- Produces:
  ```ts
  export function useStageMeasure<T>(stage: RefObject<HTMLElement | null>, measure: (stage: HTMLElement) => T, empty: T, version?: number): T;
  export interface StageGeometry {
    instance: Rect;
    parts: { label: string; step: string; kind: HighlightKind; anchor: Point; route: Point[]; shape: ReturnType<typeof highlightShape>; loupe: boolean; calloutTop: number }[];
    stacked: boolean;
  }
  export function measureStage(stage: HTMLElement, anatomy: ManifestAnatomy): StageGeometry;
  export function BuildStage(props: { manifest: Manifest; build: BuildApi }): ReactElement;
  ```
  `BuildStage` renders `role="group"`, `aria-label="<Pass name> pass: <Name>"`, `className="gallery-passes__stage"`. It contains:
  - the diagram `svg` (`aria-hidden`, `pointerEvents="none"`): grid pattern, dashed outline and dimensions on Wireframe, lines, dots, highlights, loupe frame, using the Global Constraints' data attributes;
  - the instance (inert unless `state.live`);
  - the callouts: a `role="list"` per side, each callout `role="listitem"` with `tabIndex={0}` and `data-part`;
  - `StateChips` on States;
  - on Final, `anatomy.scene.render(<div data-scene-slot>{instance}</div>)`.

  Only landed parts get lines. Unseen parts are listed with no line.

- [ ] **Step 1: Write the failing tests** (stub `getBoundingClientRect` and computed style as `passViews.test.tsx` did):
  - **Same instance:** stepping Wireframe → Tokens → States keeps the same `[data-instance]` node (`toBe` the same element).
  - **On Tokens step 2** (`landed: ['Edge','Face']`):
    - two `[data-role="line"]` and two `[data-role="dot"]`, each dot at `resolveTouch` of its part;
    - the wrapper carries `--bit-shadow-md: none`.
  - **Hot callouts:** focusing the Face callout marks its line and dot as hot, fades the others (`stroke-opacity="0.3"`) and shows the Face highlight. Blurring removes it.
  - **The fresh highlight** shows for the fresh step and is gone after the hold.
  - **Loupe:** `[data-role="loupe"]` shows for Shadow (a strip under 6px), with its line running strip → loupe → callout. There's no loupe for Edge.
  - **Unseen:** a fixture part with `unseen` is listed, with no line or dot.
  - **Stacked** (stage width 599): no lines, highlights, loupe or grid, and the callouts are still listed. **Review Focus 4:** crossing back to 640 mid-run re-measures and draws the lines for the current `landed`.
  - **Review Focus 1:** a ResizeObserver callback or `fonts.ready` mid-step re-runs `measureStage`, and the lines drawn are for the current `landed`.
  - **States:** the chips render, `Try it` removes `inert` from the instance, and the live note text shows.
  - **Final:**
    - the scene renders around `[data-scene-slot]`, and the grid and lines are gone;
    - `slide` is called with the instance's previous and new rects (spy on `motion.slide`);
    - the JSX `CodeBlock` and the Reads classes render below the scene.
  - **First paint:** before the first measure, the callouts render with inline `visibility: hidden`, and there's no diagram. After the measure, they're visible (fixing PR A's first-frame flash).
  - **`useStageMeasure`:** changing `version` schedules one new measure.
- [ ] **Step 2: Run them; expect failures.**
- [ ] **Step 3: Implement.**
  - `BuildStage` runs `applyOverrides` in `useLayoutEffect` keyed on `state.landed`, and undoes on change and unmount.
  - Lines draw with `drawIn` when a step lands.
  - Callout x positions come from the layout columns in `gallery.css`. The top is inline `style={{ top }}` from `placeCallouts`.
  - The stage `min-height` keeps PR A's formula, with a `27.5rem` floor.
- [ ] **Step 4: Run the tests and typecheck; expect a pass.** Run `npx vitest run src/pages/component/passes src/manifests && npm run typecheck -w @bit-ds/gallery`. `gallery-css.test.ts` must pass unchanged.
- [ ] **Step 5: Commit:** `feat(gallery): one build stage: lines land on their part and light it up`.

### Task 8: `PassesSection`, Play, and PR A's follow-ups

**Files:**
- Modify: `apps/gallery/src/pages/component/passes/PassesSection.tsx` (+ test)
- Modify: `apps/gallery/src/engine/pageParams.ts` (+ test), `apps/gallery/src/engine/useControlState.ts` (+ test), `apps/gallery/src/pages/ComponentPage.tsx`

**Interfaces:**
- Consumes: `useBuild` (Task 5), `BuildStage` (Task 7).
- Produces:
  ```ts
  // pageParams.ts
  interface PageParam { parse: (raw: string) => string | undefined; appliesTo?: (manifest: Manifest) => boolean }
  export function withPageParams(next: URLSearchParams, current: URLSearchParams, manifest?: Manifest): URLSearchParams;
  // `pass` has appliesTo: (m) => m.anatomy !== undefined. Key checks use Object.hasOwn(PAGE_PARAMS, key).
  // useControlState.ts: ControlStateApi gains
  /** The query the URL will hold once any typed draft lands: the draft's control keys (or the URL's, with no draft), then page keys from the current URL. */
  pendingQuery: () => URLSearchParams;
  // PassesSection
  export function PassesSection(props: { manifest: Manifest; pendingQuery: () => URLSearchParams }): ReactElement | null;
  ```

- [ ] **Step 1: Write the failing tests:**
  - **`pageParams.test.ts`:**
    - `withPageParams(next, ?pass=tokens, alertWithoutAnatomy)` drops `pass`;
    - with Button's manifest it keeps `pass`;
    - `setPageParam(q, 'constructor', 'x')` throws (prototype name).
  - **`useControlState.test.tsx`:**
    - the canonical rewrite on a page without anatomy removes `?pass=` in the same replace;
    - `pendingQuery()` after typing `children: 'Sav'` (inside the debounce) contains `children=Sav`.
  - **`PassesSection.test.tsx`:**
    - Typing in the Playground, then switching pass within 400ms, pushes a URL with both `children=Sav` and `pass=tokens` (the parked draft-loss fix).
    - Picking Tokens through the control plays (the first state is Tokens step 1). Loading at `?pass=tokens` shows the Tokens end.
    - Play:
      - shows `Stop` while running;
      - pushes exactly one history entry, `?pass=final`, at the end;
      - marks all four passes seen;
      - pressing `Stop` leaves the URL unchanged.
    - The control's value follows `build.state.pass` while playing.
    - Next still announces `Tokens, pass 2 of 4`.
    - The SHOWS copy matches Global Constraints for each pass.
    - **Review Focus 3:** changing a Playground control mid-run doesn't reset `build.state` or change the instance (it still has the default classes).
- [ ] **Step 2: Run them; expect failures.**
- [ ] **Step 3: Implement.**
  - `usePassParam` pushes `setPageParam(pendingQuery(), 'pass', next)`.
  - The control and Next call `build.markForward()` before `setPass`.
  - Play: `build.play(() => setPass('final'))`.
  - `ComponentPage` passes `controls.pendingQuery`.
- [ ] **Step 4: Run the tests; expect a pass.** Run `npx vitest run` (the whole gallery suite).
- [ ] **Step 5: Commit:** `feat(gallery): Play the build; keep a typed draft across a pass change; drop ?pass= where there are no passes`.

### Task 9: Button e2e

**Files:**
- Modify: `apps/gallery/e2e/passes.spec.ts`
- Create: `apps/gallery/e2e/passes-helpers.ts`

**Interfaces:**
- Produces (`passes-helpers.ts`):
  ```ts
  /** Each dot's offset from the painted-pixel rule for its part, worked out in the page from the part's own rect and computed style. */
  export async function touchErrors(page: Page): Promise<string[]>; // [] when every dot obeys the rule within 1px
  export async function calloutGaps(page: Page): Promise<string[]>; // lines whose callout end misses its callout edge by > 1px
  ```
  The rule, from the element's own rect and computed style:
  - **ring:** the dot is within `borderWidth/2 + 1` of the stroke's center line on its edge;
  - **fill:** inside the padding box;
  - **strip:** inside the shadow strip outside the box;
  - **bracket:** 9–11px outside its edge;
  - **box/text:** within 1px of the edge.

  Each dot's part comes from `data-part` and `data-kind`, matched to the anatomy part with that label, via the selector inside `[data-instance]`.

- [ ] **Step 1: Write the failing tests:**
  - **Lines touch:** at 1440px and 1024px, on the Tokens end, `touchErrors` and `calloutGaps` are `[]`.
  - **Play:** click Play, wait for `?pass=final`, then check that `[data-scene-slot] [data-instance] .bit-button` exists.
  - **Hover and focus:** hovering, then focusing, the Shadow callout shows `[data-role="highlight"][data-kind="strip"]` and `[data-role="loupe"]`.
  - **Stacked:** at 640px, stacked, with no `[data-role="line"]` and every part listed.
  - **No layout jump:** the stage height is equal on Wireframe, Tokens and States.
  - **Reduced motion:** with `page.emulateMedia({ reducedMotion: 'reduce' })`, picking Tokens shows the end state on the next frame.
  - **Review Focus 1:** resize from 1440 to 1100 mid-Tokens, and toggle dark mode mid-Tokens. After the run ends, `touchErrors` is `[]`.
  - **Axe** on each pass, in light and dark.
  - **Keep PR A's tests:** URL, Back/Forward, keyboard. Update the keyboard test for the new tab order (the failure checklist, item 5).
- [ ] **Step 2: Run them; expect failures.** Run `npm run build -w @bit-ds/react && cd apps/gallery && npx playwright test e2e/passes.spec.ts`. The new checks should fail until the stage behaves in a real browser.
- [ ] **Step 3: Fix whatever the browser shows,** in Tasks 2–8's files. Re-run each file's unit tests after each fix.
- [ ] **Step 4: Run the e2e again; expect a pass.**
- [ ] **Step 5: Commit:** `test(gallery): e2e for the built-up Button passes: touch rule, Play, stacked, axe`.

### Tasks 10–17: Rollout, one sidebar group per task

Every rollout task has the same shape and the same definition of done. Only the group differs.

**Files:**
- Modify: `apps/gallery/src/manifests/<slug>.ts` for each slug in the group.
- Modify: `apps/gallery/e2e/passes-all.spec.ts`. Create it in Task 10, then add the group each time. It's one `test.describe('Passes: <Group>')` per group, so `--grep` can run one group. It uses `passes-helpers.ts`.

**Per component, write:**
- `anatomy.parts`, with their `touch`, `off` (or none, for a measure step), `step` for parts that share a token (Spec §2), and `unseen` with its reason where it applies;
- `states`, from the component's real prop states;
- `root` when the component isn't the first child;
- `base` when needed;
- `scene`, following Spec §7.

The builder picks the parts from the component's CSS. A token that shared parts inherit means those parts share a `step`.

**Steps for each task:**
- [ ] **Step 1: Add the group to `passes-all.spec.ts`.** For each slug, load `?pass=tokens`. Check:
  - `touchErrors` and `calloutGaps` are `[]` at 1440px;
  - every part is listed;
  - axe passes on Tokens and Final, in light and dark.

  Run it and expect a failure (no anatomy yet, so no Passes section).
- [ ] **Step 2: Write the anatomy and scene** for each slug in the group.
- [ ] **Step 3: Run the unit guard.** `npx vitest run src/manifests src/pages/component/passes` must pass: tokens, off keys, selectors, distinct touches, states and the scene guard.
- [ ] **Step 4: Run the group's e2e; expect a pass.** Run `npx playwright test e2e/passes-all.spec.ts --grep "Passes: <Group>"`. Look at a Tokens and a Final screenshot for each component before committing.
- [ ] **Step 5: Commit:** `feat(gallery): passes for <Group>`.

| Task | Group | Slugs | Notes and scene suggestions (the builder may change a scene within Spec §7) |
|---|---|---|---|
| 10 | Actions | iconbutton, menu | **IconButton:** toolbar row. **Menu:** the trigger's parts are seen. The list, item and danger item are `unseen: 'Opens in the top layer'`, with `root` set to the trigger. Scene: the trigger in a Box header |
| 11 | Text inputs | field, input, textarea | **Field:** label, hint, control and error parts; scene: a two-field sign-up form. **Input:** scene inside a Field. **Textarea:** the count part; scene: a feedback form |
| 12 | Choice inputs | checkbox, radiogroup, segmentedcontrol, select, slider, switch | **RadioGroup:** `css: 'radio.css'`. **Select:** listbox parts are `unseen`, trigger parts seen. Scenes: a settings list, shipping options, a view switcher, a filter bar, a volume row, a settings row |
| 13 | Feedback | alert, avatar, badge, dialog, spinner, tooltip | **Dialog:** every part is `unseen: 'Opens only with showModal(), which would make the page inert'` (Ruling 10), with `root` set. **Tooltip:** `base: { pinned: true }`, `root` on the trigger. If its popover leaves the stage or takes focus, its parts become `unseen` (Spec §9). Scenes: the top of a form, a comment row, a nav count, a toolbar, a loading panel, a toolbar hint |
| 14 | Navigation | link, navbar, tabs | **Link:** inside a paragraph of text. **Navbar:** the top of a page. **Tabs:** a settings panel. No Card in Card |
| 15 | Layout | box, card, stack, table | **Card:** its edge, header divider and footer divider share one step (`--bit-border-width`). Scene: a dashboard row of Boxes holding this one Card. **Table:** a data page |
| 16 | Type | code, codeblock, heading, text | Mostly measure steps (size, weight, family) and `text` touches. Scenes: a sentence, a docs page, the top of an article, an article body |
| 17 | Theming and Brand | bittheme, icon, modetoggle, logo | **BitTheme:** `css: 'theme.css'`, every part `offOn: 'part'`; scene: a themed island on a page. **Icon:** glyph box and size as measure steps. **ModeToggle:** a navbar corner. **Logo:** `passesExempt: 'One drawn wordmark: it has no token parts to build.'` |

### Task 18: Coverage guard, budget and the full check

**Files:**
- Modify: `apps/gallery/src/manifests/manifests.test.ts`
- Modify: `apps/gallery/e2e/passes-all.spec.ts` (split by file only if needed)

- [ ] **Step 1: Write the test.** `'every manifest has anatomy or a passesExempt reason'`: for every manifest, `m.anatomy !== undefined || (m.passesExempt?.length ?? 0) > 0`, and not both. Check it fails on a fixture manifest with neither. Then run it on the real manifests: it passes once Tasks 10–17 are in.
- [ ] **Step 2: Check the CI budget.** Time `npx playwright test e2e/passes.spec.ts e2e/passes-all.spec.ts`. If the two files add more than 3 minutes to the e2e job, split `passes-all.spec.ts` into one file per group (`passes-<group>.spec.ts`). Don't change any assertions.
- [ ] **Step 3: Run the full local checks:**
  - `npm run build -w @bit-ds/react`
  - `npm run typecheck`
  - `npm run lint`
  - `npm test`
  - `node --test scripts/*.test.mjs`
  - `npm run smoke`
  - `npm run e2e`

  All must pass.
- [ ] **Step 4: Run the updated failure checklist by hand** on localhost (`npm run dev` from this worktree). Record each item's result in the PR body.
- [ ] **Step 5: Commit, push and open the PR.** Commit as `test(gallery): every component has passes or a reason`. Push `feat/workbench-passes-all` and open a PR against `feat/workbench-passes-button`, stacked, and not to be merged on its own. The body covers:
  - the summary;
  - the owner's picks (Blueprint, green, Menu/Select (a), graph paper);
  - the calls listed in the spec;
  - the checklist results;
  - the test plan;
  - `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
