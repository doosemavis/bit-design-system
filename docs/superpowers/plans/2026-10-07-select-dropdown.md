# Select dropdown (0.1.4): Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the native Select with a bit-drawn, theme-styled select-only combobox whose list slides down. It must look the same in every browser.

**Architecture:**
- **Library:** packages/react `Select` becomes a trigger `<button role="combobox">` plus a `role="listbox"` popover. The list renders in the top layer and is positioned by JS.
- **CSS:** packages/core `select.css` keeps today's trigger look and adds the L1 panel, option rows, the slide motion and the chevron flip.
- **Gallery:** every gallery Select moves to the new `options` API.

**Tech Stack:** React 19 with `forwardRef`, the Popover API, vitest + Testing Library + jsdom, Playwright e2e, and core CSS tested as text.

**Spec:** `docs/superpowers/specs/2026-10-07-select-dropdown-design.md`. Read it first; it holds every exact value.

## Global Constraints
- **API and version.** The breaking change is approved and ships as 0.1.4. The final API is spec §1.
- **Behaviour.** Keyboard, pointer and ARIA are spec §3 (APG select-only combobox), exactly.
- **Library CSS:** tokens only. Reduced motion means no animation; forced colours use system colours.
- **SSR:** nothing touches window or document during render; ids come from `useId`.
- **Immutability:** never mutate props, state or arrays.
- **Version and changelog:** don't edit CHANGELOG.md or versions; the controller does.
- **Commits:** conventional messages ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Don't push.
- **Done gate, every task:**
  - `pnpm build && pnpm verify`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm --filter @bit-ds/core test`
  - `pnpm test:coverage` (100% must hold)
  - `pnpm --filter @bit-ds/gallery test`
  - `node --test 'scripts/*.test.mjs'`
  - `pnpm smoke`
  - `pnpm e2e`

## Review Focus
The spec doesn't pin these, so each gets a test in its owning task.
1. **Two Selects on one page** (Task 1): opening one closes the other. Ids never collide. Outside-click handling on one doesn't swallow clicks meant for the other.
2. **The list near the viewport's bottom or right edge** (Task 1): it flips above, and it never renders past the right edge (clamp `left`).
3. **Options change while the list is open** (Task 1): the active index stays valid, and a controlled `value` that disappears falls back to the placeholder without a crash.
4. **A Select inside a `<form>`** (Task 1): Enter on the closed trigger opens the list instead of submitting the form, and the hidden input submits the chosen value.
5. **Gallery URL state** (Task 2): presets and the URL state round-trip through the new Select controls exactly as before.

---

### Task 1: The new Select (library: packages/react + packages/core)

**Files:**
- Rewrite: `packages/react/src/components/Select/Select.tsx` and `Select.test.tsx`
- Modify: `packages/core/src/components/select.css`, `packages/react/src/index.ts` (export `type SelectOption`), and `packages/react/scripts/verify-dist.mjs` (its type list)
- Modify: `scripts/smoke-consumer.mjs` (the consumer type check uses the new API, if it renders Select)
- Add or modify core CSS tests under `packages/core/src/__tests__/`
- Smaller helpers may live in their own files beside Select (e.g. `useListboxPosition.ts`, `typeahead.ts`) if each has one job and its own tests.

**Interfaces produced (used by Task 2):** `Select`, `SelectProps` and `SelectOption`, exactly as spec §1.

- [ ] **Step 1: write failing tests** for every behaviour in spec §3, the API rules in spec §1, Review Focus 1–4, and axe while closed and open. Use mocked `getBoundingClientRect` and `innerHeight` for the positioning tests.
- [ ] **Step 2: run them and see them fail.**
- [ ] **Step 3: implement.**
  - **Popover:** in jsdom, `showPopover` and `hidePopover` may be missing. Guard with a feature check that falls back to plain `display` handling, so tests and old browsers still work, and test both paths.
  - **CSS:** follow spec §2. The open state is a data attribute (states are attributes, never classes). The slide-in uses `@starting-style` or a two-step attribute, plus `transition`. Flipping above sets `data-placement="top"`.
- [ ] **Step 4: run the tests and see them pass; coverage stays at 100%.**
- [ ] **Step 5: run a headed visual check** with Playwright (`chromium.launch({ headless: false })`) on a throwaway HTML page or the gallery. Capture closed, open and flipped-up, in light and dark. Save to the shared shots folder named in the dispatch, then Read them.
- [ ] **Step 6: run the done gate and commit:** `feat(react)!: Select draws its own themed dropdown`.

### Task 2: The gallery on the new Select (after Task 1 merges)

**Files:**
- `apps/gallery/src/engine/ControlsPanel.tsx`
- `apps/gallery/src/shell/VersionSelect.tsx` and `ThemeSelect.tsx`
- `apps/gallery/src/manifests/select.ts` and `field.ts` (the ChildSpec `option` children become `options` props; the docs cover the new API, keyboard and a11y)
- any other `Select` caller
- every gallery unit test and e2e spec that used native select APIs

**Interfaces consumed:** Task 1's `Select({ options, value, onValueChange, … })`.

- [ ] **Step 1: write failing tests.**
  - The Select page's playground renders the new Select, and the printed code shows `options={options}` (hoisted).
  - The ControlsPanel controls choose values by click and by keyboard.
  - The version picker navigates.
  - An e2e test opens a Select inside the playground card. It asserts the listbox is visible, within the viewport and not clipped by the card, and that choosing updates the preview.
  - Review Focus 5: presets and URL state round-trip.
- [ ] **Step 2: run them and see them fail.**
- [ ] **Step 3: migrate every caller.**
- [ ] **Step 4: run the tests and see them pass, then run the done gate,** including `pnpm e2e` (axe on every route, light and dark).
- [ ] **Step 5: commit:** `feat(gallery): every Select uses the new dropdown`.
