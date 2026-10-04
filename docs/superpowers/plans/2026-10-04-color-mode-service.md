# Color Mode Service (0.1.1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `@bit-ds/react` 0.1.1 with two additions, and rewrite the gallery's Getting started step 4 around them with no minified script:
- `data-mode="system"`, which follows the visitor's OS in pure CSS
- a `colorMode` service object that switches the mode from any file

**Architecture:**
- **CSS:** a `system` value in the core theme, with a parity test.
- **Store:** a `ColorModeService` class with one shared `colorMode` instance holds the mode. `useColorMode` and `ModeToggle` become thin wrappers over it.
- **Docs:** the gallery and docs teach the two-line model, and the release bookkeeping moves to 0.1.1.

**Tech Stack:** CSS, React 19 `useSyncExternalStore`, Vitest, node:test, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-04-color-mode-service-design.md`. It is binding, and every task must read it.

## Global Constraints

- **Branch and commits.** Work on `feat/color-mode-service`. Commit messages follow `<type>(<scope>): …` and end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Don't push, tag or publish.
- **Nothing existing breaks.** These keep working as they do today:
  - `data-mode="light|dark"`
  - `useColorMode()`, still returning `{ mode, setMode }`
  - `ModeToggle`
  - `COLOR_MODE_SCRIPT`
  - `COLOR_MODES`
  - `COLOR_MODE_STORAGE_KEY`

  Existing tests stay green. The only exception is where the spec changes a test's subject: `COLOR_MODE_SCRIPT` now behaves as described in spec §2.
- **Exact names:**
  - the class `ColorModeService` and its shared instance `colorMode`
  - the type `ColorModePreference = ColorMode | 'system'`
  - the methods `mode` (getter), `preference` (getter), `set(p)`, `toggle()` and `onChange(fn) => unsubscribe`
- **Storage.** The key stays `bit-color-mode`, and it only ever holds `light` or `dark`. Choosing `system` removes the key.
- **Coverage.** `@bit-ds/react` keeps **100%** coverage.
- **Gallery.** Use bit components only (the raw-tag lint ban applies). `gallery.css` stays layout-only, with any paint exceptions documented.
- **Owner style.** Plain English. Write root scripts as `npm run …`.
- **Don't edit `eslint.config.js`.**
- **Versioning (owner rule).** While on 0.x, features and fixes are a patch and breaking changes are a minor. This work is **0.1.1**.

## Review Focus

1. **A developer's fixed default.** `<html data-mode="light">` with nothing saved stays light on a dark OS, and an OS change doesn't flip it. (T2 tests this.)
2. **A garbage saved value.** For example `localStorage['bit-color-mode'] = 'blue'`. It's ignored without throwing, and the attribute or the OS decides instead. (T2 tests this.)
3. **SSR and Node import.** Importing the package and reading `colorMode.mode` and `.preference` with no `window` doesn't throw. (T2's node test.)
4. **`system` inside a dark subtree.** A nested `data-mode` still works per element: the CSS block is per element, not root-only. (T1 tests this.)
5. **The gallery's own first paint.** With a dark OS and nothing saved, the gallery paints dark before React loads. (T5 checks this in e2e by reading `--bit-color-bg` before any interaction.)

## Dependency waves (5 subagents)

| Wave | Tasks | Needs |
|---|---|---|
| 1 (parallel) | T1: CSS `system` value and parity test<br>T2: `ColorModeService`, wrappers and exports<br>T3: release bookkeeping (version, CHANGELOG, CONTRIBUTING, README, verify-dist, smoke)<br>T4: gallery (index.html, step 4, disclosure, manifest, tokens readout) | Nothing. T3 and T4 code against the spec's names. |
| 2 | T5: integration. e2e for the system first paint, toggle persistence and step 4, then `smoke:full` and the full gate on the merged branch. | T1–T4 |

---

### Task 1: CSS `system` value and parity test

**Spec:** §1.

**Files:**
- `packages/core/src/themes/power-up.css`
- a new test in `packages/core/src/__tests__/` (reuse the `css.ts` helpers if they parse blocks)
- `light-frozen.test.ts`, only if it snapshots the shared selector list

**Interfaces it produces:**
- `[data-mode="system"]` in the shared selector list
- `@media (prefers-color-scheme: dark) { [data-mode="system"] { …the same declarations as [data-mode="dark"]… } }`

- [ ] **Step 1: Write the failing tests.**
  - **Parity:** the declarations inside the system media block equal those of `[data-mode="dark"]`, compared as property→value maps, including `color-scheme`.
  - **Shared list:** the shared selector list includes `[data-mode="system"]`.
  - **Subtree:** the system block's selector is `[data-mode="system"]`, so it applies to any element, not only `:root` or `html`.
- [ ] **Step 2: Run them and check they fail.** Run `pnpm --filter @bit-ds/core test`.
- [ ] **Step 3: Implement it in `power-up.css`.** Put this comment above the media block: "Keep in step with [data-mode="dark"]; the parity test enforces it."
- [ ] **Step 4: Run them and check they pass.** Then run `pnpm build && pnpm verify` and the core tests. The contrast tests must still pass.
- [ ] **Step 5: Commit.** Message: `feat(core): data-mode="system" follows the OS in CSS`

### Task 2: `ColorModeService`, wrappers and exports

**Spec:** §2.

**Files:**
- `packages/react/src/mode/colorMode.ts`
- `packages/react/src/mode/colorMode.test.tsx`
- `packages/react/src/mode/colorMode.node.test.ts`
- `packages/react/src/index.ts`
- the ModeToggle tests, only if they rely on internals

**Interfaces it produces:**
- The spec §2 API, exactly.
- Exports: `colorMode`, `ColorModeService`, and `type ColorModePreference`.
- `useColorMode(): { mode, setMode }` is unchanged. Adding `preference` to it is allowed.
- `COLOR_MODE_SCRIPT` becomes the exact string given in spec §2.

- [ ] **Step 1: Write the failing tests.** Start each test from a fresh store with `resetColorModeStore`.
  - **Startup precedence:**
    - A saved `dark` beats the attribute `light`.
    - The attribute `light`, `dark` or `system` is respected.
    - With no attribute, the root gets `system`.
    - A garbage saved value is ignored.
  - **`set`:**
    - `set('dark')` writes to storage and to the root.
    - `set('system')` removes the key and writes `system`.
    - `set('nope')` is ignored.
  - **`toggle`:** it flips the resolved mode and saves it.
  - **`onChange`:** it fires on a change, and the unsubscribe function stops it.
  - **OS change** (with a mocked `matchMedia`):
    - On `system`, it notifies with the new mode.
    - On `light`, it doesn't notify.
  - **Storage throws:** `set` still applies for this visit, and reads fall back to the attribute or the OS.
  - **Existing behaviour:** the hook still returns `{ mode, setMode }` and re-renders on `colorMode.set`. ModeToggle still works.
  - **Node:** importing the module gives `colorMode.mode` = `'light'` and `.preference` = `'system'`. `set` does nothing, and nothing throws.
  - **`COLOR_MODE_SCRIPT`,** run in jsdom:
    - A saved `dark` → `dark`.
    - Nothing saved and no attribute → `system`.
    - Nothing saved with the attribute `light` → stays `light`.
    - A garbage value is ignored.
- [ ] **Step 2: Run them and check they fail.** Run `pnpm --filter @bit-ds/react test`.
- [ ] **Step 3: Implement it.**
  - Use a class with private fields. Start it up lazily on first use, never at import.
  - Feed `useSyncExternalStore` like this:
    - subscribe: `colorMode.onChange`
    - snapshot: `colorMode.mode`
    - server snapshot: `'light'`
  - Keep the "one intentional piece of mutable state" comment, moved onto the class.
- [ ] **Step 4: Check coverage and types.** `pnpm test:coverage` must report 100%. Then run `pnpm typecheck` and `pnpm lint`.
- [ ] **Step 5: Commit.** Message: `feat(react): colorMode service; set the mode from any file`

### Task 3: Release bookkeeping

**Spec:** §4, plus the export list in §2.

**Files:**
- `packages/react/package.json`: version `0.1.1`
- `CHANGELOG.md`: the `## 0.1.1 — 2026-10-04` entry from spec §4
- `CONTRIBUTING.md`: the 0.x wording for "When to release" from spec §4
- `README.md`: the dark-mode line
- `packages/react/scripts/verify-dist.mjs`: add `colorMode` and `ColorModeService` to `EXPECTED`
- `scripts/smoke-consumer.mjs`: use `colorMode`, as spec §2 describes
- `scripts/*.test.mjs`: only where they pin these values

**Interfaces it consumes:** the T2 names, taken from the spec. T2 runs in parallel, so verify-dist and smoke only pass once T2 has merged. Write those changes now anyway. Prove what you can without T2 (for example `node --test` of the scripts), and say in the report what you couldn't run. T5 runs the real verify.

- [ ] **Step 1: Write the failing test.** The gallery changelog gate test (`RELEASES[0].version === pkg.version`) passes today. Bump the version first, run the test, and watch it fail until the CHANGELOG entry exists.
- [ ] **Step 2: Add the CHANGELOG entry** exactly as spec §4 gives it, using the dash format the parser accepts.
- [ ] **Step 3: Update CONTRIBUTING, README, verify-dist and the smoke consumer.** In the smoke consumer, after rendering, call `colorMode.set('dark')` and assert `document.documentElement.dataset.mode === 'dark'`. Match the consumer's existing assertion style.
- [ ] **Step 4: Run the gate.** Run `node --test 'scripts/*.test.mjs'`, the gallery tests (which include the changelog gate) and lint. If `pnpm verify` and smoke need T2's export, skip them and note that in the report.
- [ ] **Step 5: Commit.** Message: `chore(release): 0.1.1, colorMode service and data-mode="system"`

### Task 4: Gallery

**Spec:** §3.

**Files:**
- `apps/gallery/index.html`
- `apps/gallery/src/pages/GettingStartedPage.tsx` and its test
- a new disclosure in `apps/gallery/src/ui/`, if one is needed
- `apps/gallery/src/manifests/modeToggle.ts`
- `apps/gallery/src/pages/tokens/tokenValues.ts`, if it reads the attribute
- `apps/gallery/src/index-html.test.ts`, which pins the index.html attributes

**Interfaces:** show the T2 API only as code strings, with no runtime import of `colorMode`. That way the gallery builds before T2 merges. The exception is the tokens readout: if it needs the resolved mode, read it from computed style instead.

- [ ] **Step 1: Write the failing tests.**
  - **index.html:**
    - `<html>` has `data-mode="system"`.
    - The inline script is the readable snippet from spec §3.1, and the minified script is gone.
  - **Step 4:**
    - The help text matches spec §3.
    - A CodeBlock labelled "index.html" shows the exact line.
    - A CodeBlock labelled "Any file" shows the exact snippet.
    - The disclosure "Optional: use a saved choice before the page draws" is closed by default. Opening it shows the snippet and the `COLOR_MODE_SCRIPT` mention.
    - The toggle is still wrapped in `Stack align="start"`.
  - **Manifest:** the "Inline COLOR_MODE_SCRIPT" note is gone. There's a "Switch from code" example containing `colorMode.set('dark')`.
  - **Tokens readout:** with `data-mode="system"` on the root, it shows values from computed style, not from the attribute.
- [ ] **Step 2: Run them and check they fail.** Run `pnpm --filter @bit-ds/gallery test`.
- [ ] **Step 3: Implement.**
  - Build the disclosure from a bit `Button variant="ghost"` with `aria-expanded`, `aria-controls` and a region. Keep its open/closed state local.
  - Keep `gallery.css` layout-only.
- [ ] **Step 4: Run the gallery tests, typecheck and lint.** Check that the existing e2e `getting-started.spec.ts` still makes sense, and keep the toggle-width test.
- [ ] **Step 5: Commit.** Message: `feat(gallery): teach data-mode and colorMode in Getting started`

### Task 5: Integration (wave 2)

**Spec:** Gates.

**Files:**
- `apps/gallery/e2e/color-mode.spec.ts` (new)
- small fixes wherever the merged branch fails

- [ ] **Step 1: Write the e2e tests.**
  - **Dark OS, first paint:** with `page.emulateMedia({ colorScheme: 'dark' })` and nothing saved, open `#/tokens`. Immediately read `getComputedStyle(document.documentElement).getPropertyValue('--bit-color-bg')`. It must equal the dark value, and `data-mode` must be `system`.
  - **Light OS:** the same check gives the light value.
  - **Persistence:**
    1. Click ModeToggle's "Dark".
    2. Reload the page.
    3. It's still dark, and `localStorage` holds `dark`.
  - **Step 4 page:** both CodeBlocks show, and the disclosure opens.
- [ ] **Step 2: Run the full gate on the merged branch.**
  - every `ci.yml` step
  - `npm run versions && CI=1 pnpm e2e`
  - `pnpm smoke:full`
  - `pnpm verify` (verify-dist sees `colorMode`)
- [ ] **Step 3: Fix integration failures** with the smallest possible diffs, and list each fix in the report.
- [ ] **Step 4: Commit.** Message: `test(gallery): color mode e2e; integration fixes`
