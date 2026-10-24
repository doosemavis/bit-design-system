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

## 1. URL: a page parameter that survives control edits

**Found while writing this spec:** `useControlState` rewrites the query to its canonical form on every render (`serializeState`), and `serializeState` keeps only control keys. Today, `#/components/button?pass=tokens` would lose `pass` at once, and so would every control edit and Reset.

The fix: page-level keys get a reserved list, and the control engine carries them through.

- **`engine/pageParams.ts`** (new) holds:
  - `PAGE_PARAM_KEYS = ['pass'] as const`. PR D adds its `t.*` keys here.
  - `withPageParams(next: URLSearchParams, current: URLSearchParams): URLSearchParams`. It returns a new `URLSearchParams` with `next`'s control keys followed by `current`'s page keys, in `PAGE_PARAM_KEYS` order. It never mutates either input.
- **`useControlState`** builds its canonical query, its pushes and its debounced replace through `withPageParams`, so a control edit, a preset and Reset all keep `pass`. `serializeState` stays a pure control serializer, so its tests don't change.
- **A manifest control may not be named after a page key.** `manifests.test.ts` checks that no control `prop` is in `PAGE_PARAM_KEYS`.
- **`usePassParam()`** (`pages/component/passes/usePassParam.ts`) returns `{ pass, setPass }`:
  - **Values:** `wireframe | tokens | states | final`. The default is `wireframe`.
  - **The default is never written.** `?pass=wireframe` is rewritten to no key.
  - **An unknown value** (`?pass=xray`) shows Wireframe and is removed from the URL with `replace`, the same rule controls follow.
  - **`setPass` pushes a history entry** and keeps every control key untouched, so Back undoes a pass change the way it undoes a control change.

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
2. **The component reads it.** The test reads `packages/core/src/components/<file>.css`, where `<file>` is the kebab-case of `manifest.name`, so Button gives `button.css`. It then accepts the token when either:
   - the component CSS reads it directly (`var(--bit-color-…)`); or
   - the component CSS reads a private `--_bit-*` property, and a declaration of that property reads the token. The declaration can be in the component's file or in `packages/core/src/system/*.css`.

   **Why the second case:** Button never names `--bit-color-primary` or `--bit-control-height-md`. It reads `--_bit-color` and `--_bit-size-height`, which `system/colors.css` and `system/sizes.css` set from those tokens. One hop is enough today; the test fails with a clear message if a token sits two hops away, rather than silently searching further.
3. **The selector matches.** In jsdom, rendering the default instance into a wrapper finds at least one element for `wrapper.querySelector(selector)`.
4. **Each state patch is valid.** Its keys are real control props, and each value parses under that control.

**Failure messages name the component, the part and the token**, for example:

> button anatomy "Face": --bit-color-primary is not read by button.css, directly or through a --_bit-* property it reads

The test also proves itself on fixtures: a token that's missing, a token not in the theme, and a selector that doesn't match each fail with that message.

## 4. `useAnchors` (`pages/component/passes/useAnchors.ts`)

```ts
interface Line { part: string; from: { x: number; y: number }; to: { x: number; y: number } }
function useAnchors(stage: RefObject<HTMLElement>, parts: readonly AnatomyPart[], deps: readonly unknown[]): readonly Line[];
```

- **Measuring.** It uses `getBoundingClientRect`, relative to the stage:
  - **`from`** is the callout's edge facing the instance. Callouts are found by `data-part="<label>"`.
  - **`to`** is the anchor point on the first element matching the part's selector inside the instance wrapper (`data-instance`).
- **When it re-measures:**
  - on mount;
  - on a `ResizeObserver` callback for the stage and the instance;
  - when `document.fonts.ready` resolves;
  - when `deps` change (the pass).

  All of these go through one `requestAnimationFrame`, so a resize burst measures once.
- **When it returns no lines:**
  - when `ResizeObserver` is missing, as in jsdom without a stub;
  - in stacked mode (§6);
  - when a selector matches nothing. The guard test makes that a test failure, so it shouldn't happen live.
- **Unit tests** stub `getBoundingClientRect` and `ResizeObserver`. They check:
  - the line math for each anchor point;
  - the re-measure on an observer callback;
  - the single frame for a burst;
  - cleanup on unmount.

## 5. The four pass views (`pages/component/passes/`)

All four share one stage. It's a bit `Box` holding the instance in a wrapper with `data-instance`. The Wireframe and Tokens instances are wrapped in `inert`: they're diagrams, so a keyboard user doesn't Tab onto a Button that does nothing there. The stage's text and callouts stay readable.

- **`WireframePass`.** The instance with an SVG overlay of dimension lines:
  - its height, on the left;
  - its inline padding, along the top.

  The numbers are measured with `getComputedStyle`, never typed: "40px", "16px".
  - **No dimming.** Under Decision 1 (b), `opacity` on the instance would be new gallery paint. The overlay carries the pass on its own. If the owner wants the faded look from the mockup, it's one exceptions entry, but that's a separate call.
- **`TokensPass`.** Two callout columns with the instance between them. Each callout is a `li` holding:
  - the part label, as bit `Text`, size 14, bold;
  - one bit `Code` per token.

  The leader lines come from `useAnchors`. A screen reader hears the list: "Face, --bit-color-primary, --bit-weight-bold", and so on.
- **`StatesPass`.** One tile per `anatomy.states` entry: the instance with its patch, and the label under it. The tiles are `inert`. After them comes one live, focusable **Try it** instance with the note "Point at it, press it, or Tab to it". The pass shows hover, press and focus by letting you do them.
- **`FinalPass`.** The live default instance (not inert) and its JSX. The JSX is `toJsx(manifest, defaultState(manifest))`, the snippet the Code panel prints, shown in a bit `CodeBlock` with its copy button.

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
   - **"What this pass shows":** one sentence per pass, shared by every component, kept in `passes/captions.ts`. For example, Tokens: "Each part points to the tokens it reads. Change a token and this is everything that moves."
   - **"Reads":** built from data, never typed per component:
     - Wireframe: the measured height and padding;
     - Tokens: each part's tokens;
     - States: each state's props, such as `disabled`;
     - Final: the props and their classes, such as `color="primary"` → `.bit-primary`.

**Clicking the stage does nothing.** The mockup's stage-as-button would nest interactive content (Final and Try it are live Buttons). Next and the segmented control are how you move.

**"Seen"** is component state. It counts the distinct passes shown during this visit to the page, including the first, and resets when the slug changes. It isn't in the URL.

**Wiring:**

- `SECTIONS.passes = { id: 'section-passes', title: 'Passes' }`.
- `componentSections` lists it after Playground when `manifest.anatomy` is set.
- `ComponentPage` renders it between Playground and Variants.

**Stacked mode.** When the stage is narrower than 600px, the callouts drop into one list under the instance and the leader lines go away. This happens at 200% zoom on a 1280px screen, or in a narrow window. The parts are still listed by name, so nothing is lost. A `ResizeObserver` width check drives both the layout attribute (`data-stacked`) and `useAnchors`.

**Gallery CSS:** grid and flex for the columns and the stage, the stacked layout, and the svg's position. Every property is on the layout allowlist, so `gallery-css.exceptions.ts` gets no new entries.

## 7. Keyboard and screen readers

- **Tab order:**
  1. the segmented control (one stop; arrows move between passes, as in any bit SegmentedControl);
  2. Next;
  3. then, only on States, the Try it Button;
  4. then, only on Final, the Button and the code's copy button.
- **Next keeps focus on itself** and pushes the next pass. A polite live region inside the section says "Tokens, pass 2 of 4". It speaks only for Next, because the segmented control's radios already announce their own change.
- **The focus ring** is bit's default, unchanged and always visible.
- **Reduced motion:** nothing animates. The pass change is instant in every mode, and the lines are redrawn, not tweened.
- **Forced colors:** the lines use `currentColor`, and the callouts are bit components with their existing forced-colors rules.

## 8. Tests

**Unit (vitest, jsdom):**

- **`pageParams.test.ts`:**
  - `withPageParams` keeps page keys and drops others;
  - the key order;
  - it doesn't mutate its inputs.
- **`useControlState.test.tsx`** (extended):
  - a control edit, a preset, Reset and the debounced typing replace all keep `?pass=`;
  - the canonical rewrite keeps it.
- **`usePassParam.test.tsx`:**
  - the default is omitted;
  - an unknown value is replaced;
  - `setPass` pushes and keeps control keys;
  - Back returns to the previous pass.
- **`anatomy.test.ts`:** the guard from §3, with its fixtures.
- **`useAnchors.test.ts`:** as in §4.
- **`PassesSection.test.tsx`:**
  - each `?pass=` renders its view;
  - Next wraps from Final to Wireframe and pushes a history entry;
  - the Next label names the following pass;
  - the seen count, "All 4 seen", and its reset on a new slug;
  - the live region speaks for Next only;
  - the instance follows defaults, not Playground state;
  - inert on the Wireframe, Tokens and States tiles, but not on Try it or Final.
- **Pass views:**
  - Wireframe's numbers come from computed style;
  - the Tokens callouts list each part's tokens;
  - States renders one tile per entry plus Try it;
  - Final prints `toJsx`'s snippet.
- **`manifests.test.ts`:** no control prop is a page key.
- **`routes.test.tsx`:** `#/components/button?pass=tokens` (and each other pass) renders the page with that pass.
- **`gallery-css.test.ts`:** passes unchanged, with no new exceptions.

**e2e (Playwright, new `e2e/passes.spec.ts`):**

- **Navigation:**
  - each `?pass=` value loads its pass;
  - Back and Forward step through passes picked with the control and with Next;
  - changing a Playground control keeps `?pass=`.
- **Keyboard only:** Tab to the control, arrow to Tokens, Tab to Next, press it. Then check the pass, the URL, and that the focus ring is visible on each stop (a screenshot assertion on the focused element's outline).
- **Leader lines:** at 1440px and 1024px, each line's ends fall within 1px of its callout's edge and its anchor point. At 640px (200% of a 1280px screen), the stage is stacked, has no lines, and lists every part.
- **Axe:** on each of the four passes, in light and dark (8 runs). This starts the TODOS item "axe on toggled and open states".
- **Screenshots** in headed Chromium for the owner: each pass in both modes, and the stacked layout.

The full local check list from CONTRIBUTING runs before the PR, `npm run e2e` included.

## 9. Docs

- **README "Contents":** a line only if the README links component page sections today. It doesn't, so no change is expected.
- **No CHANGELOG or release-notes entry** (Ruling 9).
- **`docs/superpowers/plans/`:** the task-level plan for this spec.

## Changes to the roadmap's PR A text

- The URL fix (§1) is new. The roadmap assumed `?pass=` would just work.
- A part is one callout with several tokens. States are patches over the default state.
- The instance is always the default state.
- Wireframe has no dimming under Decision 1 (b).
- The default pass is Wireframe. The mockup opens on Tokens, but the passes are an order to step through, so they start at 1.
- The stage is stacked below 600px, with no lines.

## Out of scope

- Passes on any other page (PR B).
- Role tokens in the chips (PR C rewrites the anatomy data).
- The drawer and CHANGED markers (PR D).
- The dot-grid surface and the status bar (PR E).
- Animating between passes.
- A "Compare with Final" view (not adopted, Ruling 7).
