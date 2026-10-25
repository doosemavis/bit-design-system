# Passes, built up: every component page (workbench PR B)

**Roadmap:** `docs/superpowers/plans/2026-10-24-workbench.md`, PR B. This design grows PR B past the roadmap's text, at the owner's request (2026-10-25).
**Builds on:** PR A (`docs/superpowers/specs/2026-10-24-passes-design.md`, branch `feat/workbench-passes-button`, #91). This branch, `feat/workbench-passes-all`, is stacked on it.
**Mockups:** `.superpowers/brainstorm/96894-1792939142/content/` in this worktree (gitignored): `build-up-directions.html` (A, B and C side by side; the owner picked A) and `blueprint-lines.html` (A, with measured lines and highlights; the owner approved it).
**Scope:** `apps/gallery/` only. No library change and no release of its own: it ships in the workbench bulk merge.

## Why

PR A gave the Button page four passes: Wireframe, Tokens, States, Final. The owner's verdict: "Right now it's okay, but there's no continuity or wow factor just yet." Each pass is a separate picture you flip to. Nothing ties one to the next.

What the owner wants a reader to come away with, in their words: "the very basics of how this component can be used, the basic building blocks of what each UI piece does for the component," shown "in a modern interactive way that takes this retro vibe to the next level of web design."

So PR B does two things:

1. **Reworks the Passes section into one piece that builds itself up.** The same instance goes from a wireframe to the finished component across all four passes. Parts land one at a time, and each one names itself as it lands.
2. **Rolls that out to every component page**, which was the roadmap's original PR B.

## What the owner decided

- **Continuity means one piece being built up.** The passes are stages of one build, not four views. (Owner: "Yes, the passes should build up as one piece.")
- **Direction A, "Blueprint morph",** over B (an exploded 3D stack) and C (an arcade HUD). The look is calm and precise: an engineering drawing coming to life on graph paper.
- **Lines must touch their part and clearly emphasize it.** (Owner: "make sure that the lines drawn to the different aspects of the component actually touch and clearly emphasize what it is referencing or displaying.") The approved mockup shows this:
  - every line ends exactly on its part, at a dot;
  - lines are right-angled;
  - as a part lands, it lights up in its own real shape;
  - pointing at or focusing a callout lights its part up again and fades the other lines;
  - a part too small to see gets a magnifier.
- **Final shows the component in use.** In the mockup, the Save Button settles into a small "Save changes?" dialog. Approved with the mockup: "That looks good for now, we can move forward on that."

## Goals

- A reader can name each part of a component and say what it does, after one play-through.
- A reader sees one realistic place the component is used.
- The four passes read as one continuous build on every page, with the same rhythm, the same kinds of highlight and the same caption, so moving from Button to Card to Menu feels like one system.
- Every line is honest: it lands on the part it names, and the part it shows is the part that reads the token.

## Non-goals

- No library change. Tokens, components and their CSS stay as they are (PR C changes tokens).
- No theme drawer and no CHANGED markers (PR D).
- No status bar (PR E).
- No new passes. There are still four.

## Anti-goals: it fails even if it works when

- **A line floats near its part instead of touching it,** or touches the wrong one. This is the owner's explicit complaint about the current mockups.
- **The animation lies.** A part shown landing must be the part that reads that token. Faked paint that doesn't match how the component is really built teaches the wrong thing.
- **Motion blocks reading.** Content and focus are ready at once, and under `prefers-reduced-motion: reduce` nothing moves (roadmap global constraint).
- **It turns into a game gimmick.** The owner chose calm A over loud C. No sound, no score, no flashing beyond a part's single highlight.
- **The page jumps.** Stepping through passes must not move the caption or the sections below (PR A G1).
- **It's tuned to Button.** Card, Menu and Table have more parts and other shapes; the system must size and route itself from each component's own data.

## Constraints

- **Gallery CSS is layout only.** Anything that paints is built from bit components, or is inline presentation inside the stage's diagram SVG (the pattern `ColorFlow` and PR A's lines already use). `gallery-css.exceptions.ts` gets no new entries (Decision 1 (b)).
- **Text is at least 16px.** The 12px mono SVG labels stay, by the owner's 2026-10-24 call. Don't raise them.
- **No `as=` props, no Card inside a Card, US spelling** ("color").
- **Desktop first.** Below 600px of stage width the callouts stack under the instance as a list with no lines (PR A §6), and the magnifier and highlights don't show.
- **URL:** `?pass=` stays the page key, cleaned only by `useControlState` through `withPageParams` (PR A §1).
- **The standing failure-mode checklist** (from the roadmap memory, 2026-10-24) is rechecked on this branch and again on `review/workbench`:
  1. `?color=purple&pass=tokens&utm=x` becomes `?pass=tokens` in one replace.
  2. Back after Reset keeps page keys and restores the controls.
  3. Lines re-measure after `document.fonts.ready`.
  4. Narrowing past 600px on Tokens leaves no stale lines, and the callouts stack.
  5. Tab order skips the inert diagram, and States reaches only "Try it".

## The design

### 1. One stage, one instance, one build

- The Passes section keeps PR A's shell: one bit `Card`, the pass `SegmentedControl` above the stage, Next, the progress line, and the caption panel in the `CardFooter`.
- **The stage holds one instance for the whole build.** It isn't unmounted between passes, so it can visibly change. This replaces PR A's "each pass view mounts fresh" (§4); measuring must now re-run when the build changes as well as on resize and fonts.
- **Each pass is a short run of steps** (Tokens: one step per part, in anatomy order). A step is a target state of the build; moving to a pass plays its steps in order.
- **Arriving from outside doesn't replay.** Loading `?pass=tokens`, Back, Forward and Reset render that pass's finished state at once. Only moving forward through the control, Next or Play plays the steps.
- **Play** runs the whole build from Wireframe to Final. It's an extra button in the control row. It doesn't push a history entry per pass (that would flood Back); the URL ends on `?pass=final`.
- **Interrupting is always safe.** Picking another pass mid-run cancels the run and renders the picked pass. Nothing waits on an animation to finish.

### 2. How a part lands: by turning on its real tokens

This is my call, chosen to satisfy the "the animation lies" anti-goal without adding gallery paint.

- Before a part lands, the stage sets **inline custom-property overrides** so the part draws nothing. They go on the part's own matched element when that isolates the part, and on the instance's wrapper otherwise. (BitTheme re-declares every token on its own element, so its overrides must go there.) Landing removes them, and the component's own CSS (with its own transitions) brings the part in. The part appears because its token turned on, which is exactly what the Tokens pass teaches.
  - Example, Button: Edge off is `--bit-border-width: 0px`; Face off is `--bit-color-primary: transparent`; Shadow off is `--bit-shadow-md: none`.
- **Each anatomy part declares its "off" overrides** next to its tokens. The anatomy guard (PR A §3) checks that every overridden property is one the part already lists, so a part can only switch off its own tokens.
- **The wireframe outline isn't the component.** It's a dashed rectangle drawn in the stage SVG from the measured box, with the existing height and padding dimensions. It fades as the edge lands.
- **The graph paper** is a pattern in the stage SVG, under the instance, so it's diagram paint like the lines rather than gallery CSS. It fades out for Final. The owner approved this over the roadmap's "plain stage until PR E" (Q3); PR E's page dots stay as planned.
- **A token shared by several parts lands them together.** Overrides inherit, so switching `--bit-border-width` off in a Card also switches off its header and footer dividers, and in a Menu it reaches the trigger Button. Those parts share one step, and **the highlight shows every part that changed**, not only the named one. It's honest: that is what the token does. Card, Menu and Table will build in two or three lumps rather than one part per step; that's expected. (My call, from the builder check.)
- **Measure steps.** Heights, padding, radii, weights, fonts and type sizes have no "draws nothing" value, and a neutral value (radius 0, `height: auto`) would show a component that never exists. A part like Button's Size gets a **measure step**: no token changes, the part only lights up (a bracket, a radius arc, a text underline) and its callout lands. The approved mockup's Size step is exactly this. (My call.)
- **Exemptions beyond Dialog, failed overlays and Logo** are allowed only with a reason recorded in the data and checked by the test. Icon probably needs none: its glyph box and size are measure steps.

### 3. Lines that touch

- **The end of every line lies on the part's painted pixels:** on the border stroke for an edge, inside the fill for a face, inside the shadow strip for a shadow, on the bracket for a size. A green-filled dot with an ink keyline marks the exact point (owner, Q1).
- **Lines are right-angled.** They go straight out of the part, then straight into the callout. A callout placed level with its anchor gets one straight run.
- **Callouts are placed from data and measurement,** not from fixed percentages. The approved mockup's rules carry over: Size sits level with the instance; the magnifier sits under its strip, with its callout beside it.
- **AnchorPoint grows to say what is touched,** not just where on the box. PR A's `left-upper` and friends say where on the bounding box. PR B needs anchors that resolve to the border stroke (box edge plus half the border width), the fill (inside the border), the outside shadow strip (box edge plus half the shadow offset), and a sub-element's box. The exact type is left to the builder; the requirement is the painted-pixel rule above.
- **PR A's guard that parts on one element never share an anchor point** stays.

### 4. Emphasis: the part lights up in its own shape

- **The highlight color is bright green** (`#3DDC74` on the board), as inline presentation in the stage SVG (owner, Q1). Green collides with neither focus ring (violet in light mode, yellow in dark). Under forced colors it becomes `Highlight`.
- **A lit callout is marked by the diagram layer too**, for example a green frame or bar drawn in the SVG behind or beside it, because painting the callout itself would be gallery CSS. Its focus ring stays bit's own.
- **Each part has a highlight kind,** drawn from the measured rects in the stage SVG:

  | Kind | What lights up | Example |
  |---|---|---|
  | `ring` | the border stroke, traced | Button Edge |
  | `fill` | hatching inside the border only | Button Face |
  | `bracket` | a dimension bracket along a side | Button Size |
  | `strip` | the visible shadow strip only (right and bottom) | Button Shadow |
  | `box` | the outline of a sub-element | CardHeader, a Tab, a table cell |
  | `text` | an underline under a text run | a label, a heading |

- **When it shows:**
  - for a beat (about one second) as the part lands;
  - again while its callout is pointed at or focused, with the other lines and dots faded.
- **Callouts are focusable** (one tab stop each) so the keyboard gets the same emphasis as the mouse. This changes PR A's tab order: the stage's callouts come after Next. The instance itself stays `inert`.

### 5. The magnifier

- A part smaller than 6px in either dimension (a 4px shadow, a 2px focus ring, a 1px divider) gets a round loupe beside it. The loupe shows a scaled copy of the instance around the part, with a measure mark ("4px") drawn from the measured value, never typed.
- The line runs from the part, to the loupe, to the callout.
- The loupe's copy is `aria-hidden` and `inert`, because it's a picture of the instance.

### 6. States

- Prop states play on the same instance, from `anatomy.states` (PR A data): Default, then each patch (Disabled, Loading), then back to Default.
- **At rest, the states stay reachable.** A row of state chips sits under the stage (Default, Disabled, Loading, then **Try it**). Picking a chip applies its patch to the instance, so a reader who arrives on `?pass=states`, or uses Back, or has reduced motion, still sees every state. The playing run just steps through the same chips. (My call, from the builder check.)
- **Try it** makes the instance **live**: no longer inert, with the note "Point at it, press it, or Tab to it". Hover, press and focus are shown by letting you do them, as PR A's Decision 2 (a) ruled. Nothing fakes `:hover`. Tab order on States: the chips (one group), then the live instance once Try it is picked.

### 7. Final: the component in use

- **The grid and lines fade, and a small real-world scene builds around the instance.** For Button it's a "Save changes?" dialog with Cancel and Save, where the instance becomes Save.
- **Each manifest's anatomy gains a `scene`:** a render function that returns the scene, built only from bit components, with the instance placed in it. It also has one line of caption text, like "In use: the main action in a dialog".
- **The instance slides into its slot** with a measured slide (FLIP): measure the instance's rect, render the scene with the instance in its slot, then animate from the old rect to the new one while the scene's other pieces fade in. React may remount the instance; the slide doesn't depend on it being the same node. (My call.)
- **The scene is a picture, not a working form.** Its pieces are `inert`, except the instance, which stays live. `inert` can't be lifted on a child of an inert parent, so each sibling piece is marked inert, not the scene container; the scene API makes that the default.
- **The JSX and the "Reads" classes from PR A's Final stay,** below the scene. The scene shows where the component is used; the code shows how to write it.
- Scenes must not nest a Card in a Card (owner rule). Where a scene needs a container, use a bit `Box` with a border, or the component's natural parent (a Navbar for a Link, a Field for an Input).

### 8. Motion

- Timings use the theme's `--bit-duration-*` tokens. A step lasts about 0.9s, and a line draws in about 0.45s.
- Under `prefers-reduced-motion: reduce`, nothing animates: moving to a pass renders its end state at once (no stepping), lines appear whole, the highlight shows without a pulse, and Play steps through the four passes with a pause on each. The States chips cover what the run would have shown.
- Motion never hides content. Callouts are in the DOM and readable while their line draws.

### 9. Rollout to every component

- **Anatomy, off overrides, highlight kinds and a scene** for each of the 32 other manifests, one commit per sidebar group (`shell/navGroups.ts`): Actions, Text inputs, Choice inputs, Feedback, Navigation, Layout, Type, Theming. Button is reworked in the first commit with the engine.
- **Overlays** (roadmap B2, owner Q2 (a)):
  - **Tooltip** shows open on the stage, from its manifest's `demo` with its open prop, if it stays inside the stage without trapping focus. If it can't, it falls to the Menu/Select rule.
  - **Menu and Select** build their trigger on the stage, and list their menu parts (list, item, selected item) in the Tokens pass with no lines, like Dialog. Select has no `open` prop, and Menu's controlled `open` moves focus into its list, so showing them open needs a library change.
  - **Follow-up, not in PR B:** a small library change so Menu and Select can be held open without taking focus. It could ride in a later release.
- **Dialog** keeps Ruling 10: it opens only with `showModal()`, which would make the page inert. Its Tokens pass lists its tokens with no lines, and its stage shows the build without opening it.
- **Logo (Brand)** gets an exemption unless its parts are worth calling out. The builder decides and records the reason.
- **Every manifest has `anatomy` or a listed exemption with a reason,** checked in `manifests.test.ts` (roadmap B3).

### 10. PR A follow-ups that land here

These were parked for PR B in #91:

- A Playground draft can be lost when you switch pass inside the 400ms debounce. Fix it.
- `?pass=` is kept on pages without Passes. Drop it there.
- `STACK_BELOW=600` and the 2rem callout line height were tuned to Button. Re-measure with real data across components.
- `measureBox` and `renderedClasses` read `[data-instance] > *`. Tooltip, Dialog and Menu need a part-root selector.
- `key in PAGE_PARAMS` matches prototype names. Use `Object.hasOwn`.
- There's a first-frame flash before the first measurement. Remove it.

(PR D's `t.*` prefix support stays with PR D.)

## Tests (what must be proven)

- **Unit:** the build timeline (steps, cancel, arriving without replay, Play's single history outcome); off overrides applied and removed per step; anchor resolution for each kind; callout placement; the reduced-motion path; the guard extensions (off overrides belong to the part; every manifest has anatomy or an exemption; every scene renders with only bit components).
- **e2e, on every page with anatomy:**
  - each line's end is within 1px of its resolved painted-pixel anchor, and its other end within 1px of its callout, at 1440px and 1024px;
  - stacked at 640px with no lines, highlights or loupe;
  - no layout jump across passes 1 to 3;
  - pointing at and focusing a callout lights its part;
  - axe on each pass, light and dark.
- Watch the e2e run time; split the spec by sidebar group if it passes the CI budget (roadmap B4).
- The standing failure-mode checklist, run by hand on this branch and on `review/workbench`.

## Left to the builder

- The exact `AnchorPoint` and highlight types, and how parts declare them.
- Step timings within the ranges above.
- The scene for each component, within the rules in §7.
- The order of parts within each pass, where the anatomy order doesn't read well.
- How the magnifier's copy is made (a second rendered instance or a clone).
- File arrangement, within the repo's small-files rule.

## For the owner: answered 2026-10-25

1. **Highlight color: bright green** (option 2 on the board), not yellow (which is bit's dark-mode focus ring) and not ink. See §4.
2. **Menu and Select: (a)**, trigger plus a no-lines list, like Dialog. No library change in PR B; the hold-open change is a follow-up. See §9.
3. **Graph paper: yes, now**, drawn in the stage's diagram SVG. See §2.

## Calls I made (check these while reading)

- **Parts land by turning their real tokens on** (inline overrides), not by painting over the component (§2).
- **Shared tokens land their parts together,** and the highlight shows everything that changed (§2).
- **Measure steps** light up parts that have no "off" value, such as size, padding, radius and type (§2).
- **State chips under the stage** keep every state reachable when nothing is playing (§6).
- **Final slides the instance into its scene slot** with a measured slide, and the JSX and Reads stay below the scene (§7).
- **Arriving from a link, Back or Reset shows a pass finished;** only moving forward plays it. Play doesn't add a history entry per pass (§1).
- **Callouts are focusable,** one tab stop each, after Next (§4).
- **A magnifier for parts under 6px** (§5).
- **One PR B** with the engine and Button first, then one commit per sidebar group (§9).
