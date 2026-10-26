# Role Tokens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add nine role tokens, switch every component corner and shadow to them with zero rendered change, show them on the Tokens page, and prepare release 0.1.12.

**Architecture:** Role tokens are tier-2 aliases (`--bit-radius-control: var(--bit-radius-10px)`) declared in power-up's first token block, so they re-resolve in mode subtrees. Component CSS reads only roles; a frozen declaration table and a guard test keep it that way in CI, and a temporary local pixel diff proves the switch.

**Tech Stack:** plain CSS in `packages/core`, TypeScript token list, vitest (core and gallery), Playwright (gallery e2e), npm workspaces.

**Spec:** `docs/superpowers/specs/2026-10-26-role-tokens-design.md` (the token table there is the binding mapping).

## Global Constraints

- Not one pixel changes in light or dark. A failing frozen row or pixel diff means the mapping is wrong; never edit a frozen row or a baseline to pass.
- Library CSS reads tokens only; a raw value needs a same-line comment.
- `--bit-radius-full` and `--bit-shadow-inset` stay in component CSS. `--_bit-lift` / `--_bit-lift-radius` take the same role as the declaration they shadow.
- Gallery CSS is layout only and keeps reading the scale; `gallery-css.exceptions.ts` is untouched.
- `@bit-ds/react` coverage stays at or above 80%, no istanbul-ignore.
- The gallery builds against `dist/`: `npm run build -w @bit-ds/react` before gallery tests or e2e.
- Commits: conventional, named paths only (never `git add -A`), end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Don't edit `eslint.config.js`.
- US spelling "color" in everything new.
- Machine heat: one heavy process at a time; `vitest run`, never watch mode.

## Review Focus

1. **Dark subtree:** a `.bit-dark` element inside a light page must give Card and Button the dark shadow color through the role tokens. Pinned by Task 2's resolve test in both modes and Task 3's dark pixel pass.
2. **`data-mode="system"` copy:** the build duplicates the dark block for a dark OS; roles live in the first block, so they must still resolve there. Pinned by Task 3's pixel pass with `colorScheme: 'dark'` on a `system` page.
3. **Focus-ring lift:** a focused Button, Checkbox, Radio, Switch or Slider thumb moves its shadow under the ring via `--_bit-lift`; a missed lift shows a double or missing shadow. Pinned by the frozen table (lift rows) and a focused-state shot in the pixel spec.
4. **Solid Button hover:** its shadow drops from control to control-hover; hover state is in the pixel spec.
5. **Theme authors:** a second theme file missing a role token must fail `theme-completeness` with the token's name. Already enforced once `SEMANTIC_TOKENS` includes the roles; Task 2 checks the message names it.

---

### Task 1: Freeze today's values and capture pixel baselines

**Files:**
- Create: `packages/core/src/__tests__/role-switch.frozen.test.ts`
- Create: `apps/gallery/e2e/role-tokens-pixels.spec.ts`

**Interfaces:**
- Produces: `FROZEN_SHAPES` rows `[file, selector, property, light, dark]` used by Task 3; the pixel spec run with `ROLE_PIXELS=capture` / `ROLE_PIXELS=compare`.

- [ ] **Step 1:** In the worktree, `npm ci` then `npm run build -w @bit-ds/react`.
- [ ] **Step 2: Write the frozen test.** Use `listCss`, `readCss`, `themeModes`, `resolveVar` from `./css`. For every declaration in `components/*.css` and `system/*.css` whose value contains `var(--bit-radius-` or `var(--bit-shadow-` (including `--_bit-lift*`), resolve every `var(--bit-…)` in the value through the light map and the dark map. Generate the table from the current CSS once (a throwaway script is fine), paste it as a literal, and assert each row's resolved light and dark values, keyed by file + selector + property (not line number). Header comment: frozen 2026-10-26 before the role switch; never edit a row to pass. Also assert the row count, so a dropped declaration fails.
- [ ] **Step 3:** `npm run test -w @bit-ds/core -- role-switch` → PASS on the unchanged CSS.
- [ ] **Step 4: Write the pixel spec.** `test.skip(!process.env.ROLE_PIXELS)`. For each component route in `e2e/routes.ts` plus the Tokens page, in light and dark (use the helpers in `e2e/mode.ts`), screenshot the Variants section (the whole main column for the Tokens page), plus a hovered solid Button and a keyboard-focused Button and Checkbox on their pages. `capture` writes PNGs to `.superpowers/role-pixels/`; `compare` reads the same name and fails on any byte difference, writing the new image beside it as `*.actual.png`. Disable animations (`animations: 'disabled'`) and wait for `document.fonts.ready`.
- [ ] **Step 5:** `ROLE_PIXELS=capture npx playwright test role-tokens-pixels` (from `apps/gallery`), then `ROLE_PIXELS=compare …` → PASS (proves the capture is deterministic).
- [ ] **Step 6: Commit** both files: `test: freeze corner and shadow values before the role-token switch`.

### Task 2: Add the role tokens

**Files:**
- Modify: `packages/core/src/tokens.ts` (new `ROLE_TOKENS`, spread into `SEMANTIC_TOKENS` after `shapeTokens`)
- Modify: `packages/core/src/themes/power-up.css` (tier 2 shape, after `--bit-shadow-inset`)
- Modify: `packages/react/src/index.ts` (re-export `ROLE_TOKENS`)
- Test: `packages/core/src/__tests__/tokens.test.ts`, `packages/core/src/__tests__/theme-completeness.test.ts`, `packages/react/src/index.test.tsx`

**Interfaces:**
- Produces: `export const ROLE_TOKENS: readonly string[]` = `--bit-radius-control`, `--bit-radius-surface`, `--bit-radius-card`, `--bit-radius-chip`, `--bit-shadow-control`, `--bit-shadow-control-hover`, `--bit-shadow-surface`, `--bit-shadow-raised`, `--bit-shadow-chip` (this order).

- [ ] **Step 1: Failing tests.**
  - `tokens.test.ts`: `SEMANTIC_TOKENS` length 119 (was 110); `ROLE_TOKENS` equals the nine names above; every role is in `SEMANTIC_TOKENS` and none is in `MODE_TOKENS`.
  - `theme-completeness.test.ts`: new case, each role resolves in power-up light and dark to its scale step: radius control/surface → `10px`, card → `14px`, chip → `6px`; shadow control/surface → the light/dark value of `--bit-shadow-md`, control-hover/chip → `--bit-shadow-sm`, raised → `--bit-shadow-lg`.
  - `index.test.tsx`: 110 → 119 and `lib.ROLE_TOKENS` has length 9.
- [ ] **Step 2:** Run core and react tests → FAIL on the new cases.
- [ ] **Step 3:** Add `ROLE_TOKENS` (with a doc comment: themes change roles, the scale stays) and the nine power-up declarations under a `/* roles: what components read; each points at a scale step */` comment.
- [ ] **Step 4:** `npm run test -w @bit-ds/core && npm run test -w @bit-ds/react` → PASS. `role-switch.frozen` still passes (no CSS read changed).
- [ ] **Step 5: Commit:** `feat(core): add role tokens for corners and shadows`.

### Task 3: Switch component CSS to roles, and guard it

**Files:**
- Modify: every file under `packages/core/src/components/` and `packages/core/src/system/scrollbar.css` listed in the spec table
- Create: `packages/core/src/__tests__/role-tokens.test.ts`

**Interfaces:**
- Consumes: `ROLE_TOKENS` (Task 2), `FROZEN_SHAPES` (Task 1).

- [ ] **Step 1: Failing guard.** For every CSS file in `components/` and `system/`, fail on any `var(--bit-radius-\d+px)` or `var(--bit-shadow-(sm|md|lg))`, with a message naming file, line, token and "read a role token (ROLE_TOKENS) instead". Second case: every role in `ROLE_TOKENS` is read by at least one component file (no dead role).
- [ ] **Step 2:** `npm run test -w @bit-ds/core -- role-tokens` → FAIL listing today's ~70 reads.
- [ ] **Step 3:** Switch each declaration to its role per the spec table, one commit per component file (`refactor(core): <component> reads role tokens`). Lift lines take the same role as the line they shadow. Leave `radius-full` and `shadow-inset` alone.
- [ ] **Step 4:** `npm run test -w @bit-ds/core` → guard and frozen table PASS (frozen rows unchanged).
- [ ] **Step 5:** `npm run build -w @bit-ds/react`, then `ROLE_PIXELS=compare npx playwright test role-tokens-pixels` → PASS. Any `*.actual.png` means a wrong mapping: fix the CSS, not the baseline.
- [ ] **Step 6: Commit** the guard: `test(core): component CSS reads role tokens, never the size scale`.

### Task 4: Tokens page roles card

**Files:**
- Modify: `apps/gallery/src/pages/tokens/ShapeSection.tsx`
- Test: `apps/gallery/src/pages/TokensPage.test.tsx`, `apps/gallery/e2e/token-cards.spec.ts` (only if its card count changes)

**Interfaces:**
- Consumes: `ROLE_TOKENS` from `@bit-ds/react`.

- [ ] **Step 1: Failing test** in `TokensPage.test.tsx`: the radius card lists exactly the scale (`6`, `10`, `14`, `full`), the shadow card exactly `sm`, `md`, `lg`, `inset`, and a `roles` card lists the nine roles; with stubbed computed values where `--bit-radius-control` = `--bit-radius-10px` = `10px`, its row shows `= --bit-radius-10px`; a role whose value matches no scale token shows only its value.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Filter `RADII`/`SHADOWS` to non-role tokens; add a `TokenCard name="roles"` (full width, like shadow) whose rows preview with `borderRadius` or `boxShadow` from the token, show the value, and `= <scale token>` from the first scale token in the same family with an equal computed value. Bit components only; no new gallery CSS.
- [ ] **Step 4:** `npm run build -w @bit-ds/react && npm test -w gallery` → PASS (fix any count-based gallery test that now sees 119 tokens by reading the count from `CURRENT_TOKENS`, never by hard-coding a new number).
- [ ] **Step 5:** Check the page on localhost (`npm run dev`, Tokens page, light and dark) with the browse skill; screenshot.
- [ ] **Step 6: Commit:** `docs(gallery): roles card on the Tokens page`.

### Task 5: Docs, release prep, cleanup

**Files:**
- Modify: `CHANGELOG.md`, `packages/react/package.json`, `package-lock.json`, `ARCHITECTURE.md` (tier 2 bullet), `CONTRIBUTING.md` (theme section)
- Modify: `apps/gallery/src/pages/ReleaseNotesPage.test.tsx` only if it pins the newest section's heading kind
- Delete: `apps/gallery/e2e/role-tokens-pixels.spec.ts`

- [ ] **Step 1:** CHANGELOG `## 0.1.12 — <date of the bulk merge, leave as 2026-10-26 for now>` with the Added and Changed bullets from the spec, one bullet per line.
- [ ] **Step 2:** Version 0.1.12 in `packages/react/package.json`; `npm install --package-lock-only` to update the lockfile.
- [ ] **Step 3:** ARCHITECTURE tier 2: "Components read role tokens (`--bit-radius-control` …), which point at the value-named scale; a theme retunes roles." CONTRIBUTING theme section: a new theme declares the nine roles too (the completeness test lists them).
- [ ] **Step 4:** Delete the pixel spec (its job is done; the frozen table stays).
- [ ] **Step 5: Full local checks:** `npm run build -w @bit-ds/react`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:coverage -w @bit-ds/react`, `node --test scripts/*.test.mjs`, `npm run smoke`, `npm run e2e` (set `E2E_PORT` if 5173/4173 is busy). All pass.
- [ ] **Step 6: Commit:** `chore: release notes and version for 0.1.12`.
