# Component Workbench (Passes + Theme Drawer) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Status:** roadmap plan. Owner rulings recorded 2026-10-24 (see "Owner decisions"). Each PR below gets its own spec (`docs/superpowers/specs/`) and a task-level plan before it starts. Run `/plan-eng-review` and `/plan-design-review` on this file first.

**Goal:** Turn each component page into a workbench (mockup Option 5, approved 2026-10-24, with the pass control from Option 1; see Ruling 7):
- **Passes:** step one live component through four layers: Wireframe, Tokens, States and Final.
- **Theme drawer:** tweak a small set of theme tokens, see each change marked on the Tokens pass, and export a theme file.
- **Surface token and status bar:** a page surface pattern each theme sets, and a pinned arcade status bar.

**Why this order:** Passes ships value alone and needs no library change. The drawer needs role tokens first (PR C), because today's tokens are named after their values (`--bit-radius-10px`). A theme that sets `--bit-radius-10px: 6px` breaks the naming rule.

**Mockups:** the "Bit — Passes & Theme Builder mockups" canvas. Option 1 is PR A, Option 5 is the target, and Option 3 is the drawer's control set. Where a mockup and this plan disagree, this plan wins: the whole stage is not a button (A5), the pass control stays above the stage (Ruling 7), and the status bar has no 1UP tag or clock (Ruling 8).

**Tech stack (unchanged):** npm workspaces, React 19 + TypeScript, tsup, vitest + jsdom + Testing Library (80% coverage gate on `@bit-ds/react`), Playwright + axe (light and dark on every page), and plain CSS in `packages/core`.

---

## Global Constraints (carried from earlier plans)

- **Gallery CSS is layout only.** Anything that paints goes in `gallery-css.exceptions.ts` with a reason, or is built from bit components. See Decision 1.
- **Library CSS reads tokens only.** A raw value needs a same-line comment.
- **Library states are attributes, never classes.** Forced colors use system colors.
- **Coverage:** `@bit-ds/react` stays at or above its 80% gate (`npm run test:coverage`), with no istanbul-ignore.
- **The gallery builds against `dist/`.** Run `npm run build` before gallery tests or e2e.
- **State lives in the URL.** The pass and drawer values are query params, so every view is shareable and Back works.
- **Motion:** visual only. Content and focus are ready at once. Under `prefers-reduced-motion: reduce` nothing animates.
- **Desktop only for now** (owner ruling 2026-10-02). The phone layout stays in TODOS.md.
- **Commits:** conventional, named paths only (never `git add -A`). Don't edit `eslint.config.js`.

---

## Owner decisions (ruled 2026-10-24)

1. **How the stage paints.** It needs a dot-grid surface, leader lines and callout chips. Options:
   - (a) Add gallery CSS exceptions for the stage, grouped as "C: workbench".
   - (b) Build the stage from bit `Box`/`Card` plus one inline SVG for the lines. No new gallery paint.

   *Recommendation: (b) for PR A. (a) for the dot grid only if PR E's token doesn't land first.*

   **Ruling: (b).** The stage is a plain bit surface until PR E's `--bit-surface-pattern` adds the dots. No new gallery CSS exceptions.
2. **What the States pass shows.** Hover and press can't be forced without CSS hooks. Options:
   - (a) Prop-driven states only: default, disabled, loading, checked, invalid. Hover and press are a "try it" note on a live instance.
   - (b) Add a `data-bit-preview-state` hook to library CSS, which mirrors every `:hover`/`:active` rule.

   *Recommendation: (a). (b) doubles the state CSS and can drift.*

   **Ruling: (a).** The States pass shows prop states, then one live "Try it" instance for hover, press and focus. Variants (Outline, Ghost) stay in the Variants section.
3. **Role token names** (PR C): the starting list is in PR C below.

   **Ruling:** approved as written.
4. **Version for role tokens:** fold them into 0.2.0, which already removes the deprecated text sizes, or ship them as 0.1.x additions first. *Recommendation: add them in 0.1.x (additive, no breaks), then switch component CSS in 0.2.0.*

   **Ruling: add the tokens and switch component CSS in 0.1.12.** Waiting for 0.2.0 would leave the drawer's corner and shadow controls doing nothing until then. The one behavior change goes in the CHANGELOG (see C5).
5. **The drawer's home:**
   - (a) A gallery-only panel.
   - (b) A new library `Sheet` component (a side panel built on the native `<dialog>`, like Dialog).

   *Recommendation: (a) now, and (b) as its own spec later. It's a good component to add.*

   **Ruling: (a).** A non-modal gallery panel, so the page stays live while you tweak. A library `Sheet` gets its own spec later.

### Further rulings (from the plan review, 2026-10-24)

6. **The caption panel stays.** Under the stage: what this pass shows, and what it reads (see A5).
7. **The pass control stays above the stage on every page** (Option 1). Option 5's left rail and "Compare with Final" are not adopted.
8. **The status bar shows the fields in E2 only.** No 1UP tag, no clock.
9. **No gallery-only release notes.** Release notes stay built from `CHANGELOG.md`, which only has version sections. The PR body and the live site are the record for gallery-only PRs.
10. **Dialog in PR B:** its Tokens pass lists tokens without leader lines, with a listed exemption. It opens only with `showModal()`, which would make the page inert.

---

## PR A: Passes on the Button page (gallery only, no release)

**Outcome:** the Button page gains a Passes section between Playground and Variants. Visitors step through four passes, and the URL holds `?pass=wireframe|tokens|states|final`.

### Data: `manifest.anatomy`

Add to `apps/gallery/src/manifests/types.ts`:

```ts
/** One labeled part of a component, for the Tokens pass. */
export interface AnatomyPart {
  /** Shown on the callout chip: "Face", "Knob", "Track". */
  label: string;
  /** Selector for the part inside the preview root. The first match is measured. */
  selector: string;
  /** Public tokens the part reads, as `--bit-…` names. Each must exist and be read by the component's CSS. */
  tokens: readonly string[];
  /** Which side of the stage its chip sits on. */
  side: 'left' | 'right';
}

export interface ManifestAnatomy {
  parts: readonly AnatomyPart[];
  /** Control states for the States pass: each a label and a ControlState patch. */
  states: readonly { label: string; state: ControlState }[];
}
```

Add `anatomy?: ManifestAnatomy` to `Manifest`. Pages without it don't show the section.

### Tasks

- [ ] **A1. Types and Button data.** Add the types and `button.anatomy`:
  - Face: `--bit-color-primary`, `--bit-weight-bold`.
  - Edge: `--bit-border-width`, `--bit-radius-10px`.
  - Shadow: `--bit-shadow-md`.
  - Size: `--bit-control-height-md`.

  States: Default, Disabled, Loading (props). Hover, press and focus come from the live "Try it" instance (Ruling 2). Outline and Ghost are variants, not states.
- [ ] **A2. Anatomy guard test** (`manifests/anatomy.test.ts`). For every manifest with `anatomy`:
  - every token is in `SEMANTIC_TOKENS` from `packages/core/src/tokens.ts`;
  - every token is read by that component: in its CSS file in `packages/core/src/components/`, directly or through a `--_bit-*` private property. Many private properties are set in `packages/core/src/system/*.css` (Button's `--_bit-color` in `colors.css`, `--_bit-size-height` in `sizes.css`), so the guard follows them there too. Without that, the Face and Size chips fail on day one;
  - every selector matches inside a rendered preview.

  This keeps the callouts honest when the CSS changes.
- [ ] **A3. `useAnchors` hook** (`engine/useAnchors.ts`). It measures each part's box relative to the stage with `getBoundingClientRect`, and re-measures on `ResizeObserver` and font load. It returns `{ part, x, y }` for the SVG leader lines. Unit test it with a stubbed rect.
- [ ] **A4. Pass views** (`pages/component/passes/`):
  - **`WireframePass`:** the live preview at reduced opacity, plus an overlay drawn from `getComputedStyle`: height, padding and gap as dimension lines. The numbers are measured, never typed.
  - **`TokensPass`:** the live preview, chips in left and right columns, and an SVG of leader lines from `useAnchors`. The chips are bit `Code` elements. Each chip has a hidden description naming its part, so a screen reader hears "Face reads --bit-color-primary".
  - **`StatesPass`:** one preview per `anatomy.states` entry in a row, each labeled, then one live "Try it" instance with a note to hover, press and Tab to it.
  - **`FinalPass`:** the existing `Preview` plus the printed JSX (reuse the code printer).
- [ ] **A5. `PassesSection`.** It holds:
  - a bit `SegmentedControl`, with the four passes as options and the value in the URL;
  - a Next `Button`;
  - a progress line ("2 of 4 seen", with decorative pips marked `aria-hidden`);
  - the stage, a `Box` with `role="group"` and an `aria-label` naming the pass;
  - a caption panel under the stage (Ruling 6): "What this pass shows", one line per pass shared by every component, and "Reads", built from the data (measured sizes on Wireframe, `anatomy` tokens on Tokens, the state props on States, props to classes on Final).

  Clicking the stage does not advance it, because stage-as-button nests interactive content. The Next button does. Wire it into `ComponentPage` and `sections.ts`, so the SectionBar lists "Passes".
- [ ] **A6. Tests:**
  - unit tests for the section: URL sync, Next wraps from Final to Wireframe, and seen-count;
  - add the passes to `routes.test.tsx`;
  - e2e: visit each `?pass=` value and run axe in light and dark (this also starts the TODO "axe on toggled and open states").
- [ ] **A7. Docs:** README "Contents" if the section is linked there. No release-notes entry (Ruling 9).

**Done when:** the Button page shows all four passes, axe is clean in both modes, the anatomy guard passes, and the mockup's Option 1 behavior works with the keyboard alone.

---

## PR B: Passes for every component (gallery only)

- [ ] **B1.** Write `anatomy` for the remaining 32 manifests, a group at a time, in the sidebar's groups (`shell/navGroups.ts`: Actions, Text inputs, Choice inputs, Feedback, Navigation, Layout, Type, Theming, Brand). Use one commit per group, so review stays small. Brand (Logo) gets an exemption unless the PR B spec finds parts worth calling out.
- [ ] **B2.** Overlays need parts: Menu, Select and Tooltip show their open state on the stage, using each manifest's existing `demo` with a forced-open prop. Dialog gets the exemption from Ruling 10. The PR B spec checks that each forced-open overlay stays inside the stage without trapping focus; any that can't gets the same exemption: its Tokens pass lists its tokens without leader lines.
- [ ] **B3.** Extend `manifests.test.ts`: every manifest in `components` and `forms` has `anatomy` (or a listed exemption with a reason).
- [ ] **B4.** e2e: axe each pass on every page. Watch the run time; split the spec by group if it grows past the CI budget.

---

## PR C: Role tokens (library, release 0.1.12)

**Why:** themes change roles (control corners, card corners), not sizes. The size tokens stay as the scale; role tokens point at them.

Starting list (Decision 3), each defaulting to today's value in power-up:

| Role token | Points at | Read by |
|---|---|---|
| `--bit-radius-control` | `--bit-radius-10px` | Button, IconButton, Input, Select, Textarea, SegmentedControl, Menu items |
| `--bit-radius-surface` | `--bit-radius-14px` | Card, Box, Dialog, Alert, Table, CodeBlock |
| `--bit-radius-chip` | `--bit-radius-6px` | Badge, Code, Tooltip, Checkbox |
| `--bit-shadow-control` | `--bit-shadow-md` | Button, IconButton, SegmentedControl |
| `--bit-shadow-surface` | `--bit-shadow-lg` | Card, Dialog |

- [ ] **C1.** Add the names to `tokens.ts` (`ROLE_TOKENS`) and to `themes/power-up.css` tier 2. The theme-completeness test will demand them.
- [ ] **C2.** Switch component CSS from size tokens to role tokens, one component per commit (Decision 4 ruling: in 0.1.12). Screenshots must not change: add a Playwright pixel diff on the Variants tables for this PR only.
- [ ] **C3.** Guard test: component CSS doesn't read `--bit-radius-{n}px` or `--bit-shadow-{sm|md|lg}` directly any more (the outline offsets in TODOS.md stay as they are).
- [ ] **C4.** Update the anatomy data from PR A/B to name role tokens. The guard from A2 will flag every miss.
- [ ] **C5.** Tokens page: show each role token with the size it points at. CHANGELOG "Added": role tokens; size tokens unchanged. CHANGELOG "Changed": components now read role tokens, so overriding a size token (say `--bit-radius-10px`) on part of a page no longer reaches the components there. Override the role token instead.
- [ ] **C6.** Release 0.1.12 through the existing `release.yml`. Do TODOS "trusted publishing" before this if it's close to January.

---

## PR D: Theme drawer (gallery)

**Outcome:** a "Tweak theme" button in the header opens a side panel on any component page. Changes apply live to the stage and are marked CHANGED on the Tokens pass, a Was/Now table lists them, and Export downloads `my-theme.css`.

- [ ] **D1. Drawer shell.** A gallery panel (Decision 5a): a landmark `aside` with a heading. It closes with Esc and its close button, and focus moves into it on open and back to the trigger on close.
- [ ] **D2. Controls** (all bit components):
  - Primary: radio swatches, with a list of colors that pass AA with white text.
  - Corners (control and surface): SegmentedControl.
  - Shadow depth: Slider.
  - Surface pattern: added in PR E.

  The values go in URL params (`?t.primary=0b7a75&t.radius-control=6`).
- [ ] **D3. Apply.** Wrap the page content in `BitTheme` with an inline style setting only the changed role tokens. The derived tokens (`-hover`, `-soft`) are computed with `color-mix()` in the override, not typed by the visitor.
- [ ] **D4. Contrast check.** Compute WCAG contrast for `primary` against `primary-contrast`. Show the ratio, and block Export under 4.5:1 with a message naming the fix. Unit test the maths against the ratios recorded in `power-up.css` comments.
- [ ] **D5. CHANGED markers.** `TokensPass` reads the override map, marks chips whose token changed, and adds the Was/Now table under the stage.
- [ ] **D6. Export.** Build the CSS text from the override map, scoped to `.bit-theme-my-theme` and `[data-theme="my-theme"]` the way `power-up.css` documents. Offer Copy (the existing `useCopyToClipboard`) and Download (a Blob). Snapshot-test the generated text.
- [ ] **D7. e2e:** open the drawer, change primary, check the stage color and the CHANGED chip, export, and assert the file contents. Run axe with the drawer open.

---

## PR E: Surface token and status bar

- [ ] **E1. `--bit-surface-pattern`:** a `background-image` value, set per theme (power-up: dots at 14px). Add it to `tokens.ts` and the theme. The gallery page background reads it. Components never paint it. Under forced colors it becomes `none`.
- [ ] **E2. Status bar** (`shell/StatusBar.tsx`): pinned to the bottom, in the pixel face. It shows:
  - version (from `buildVersion.ts`);
  - theme (with `*` when the drawer has changes);
  - mode;
  - the current pass on component pages;
  - Snake's best (from `arcade/bestScore.ts`, hidden when 0).

  It is a `footer` landmark with plain text, not a live region, so it never interrupts a screen reader. No 1UP tag or clock (Ruling 8).
- [ ] **E3.** The drawer's Surface control from D2 switches the pattern.
- [ ] **E4.** Tests and axe as above. No gallery-css exceptions: Decision 1 was ruled (b).

---

## Review Focus (for `/plan-eng-review`)

1. **Leader lines on resize, zoom and font load:** `useAnchors` must re-measure. Test it with a ResizeObserver stub, and in e2e at 200% zoom.
2. **Anatomy drift:** the A2 guard is the only thing stopping callouts from lying after a CSS change. It must fail loudly with the component and token names.
3. **Overrides vs mode:** a theme override set on a light page must still let dark mode re-resolve the shadows, because shadows are built from mode tokens. Test the drawer in both modes.
4. **URL length:** drawer params plus control state must stay readable. Use short keys, and drop values equal to the default.
5. **Export correctness:** the exported file must work when loaded after `styles.css` in the smoke consumer (`npm run smoke`).

## Rough sizing

Part-time, alongside the job search: A ≈ 3 days, B ≈ 3–4 days, C ≈ 3 days, D ≈ 4–5 days, E ≈ 1–2 days. Ship A first. It's useful alone and links well from a resume.
