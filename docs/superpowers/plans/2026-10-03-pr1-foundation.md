# PR1 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land PR1 of the gallery stack: rename the npm scope to `@bit-ds`, switch size tokens to px names, apply the approved power-up palette with code, mono, logo and focus tokens, add Badge `shape`, extend the manifest schema, and give every component a minimal browsable page.

**Architecture:** `@bit-ds/core` owns tokens (`tokens.ts`), the power-up theme and all CSS. `@bit-ds/react` inlines core at build and exposes the props that read those tokens. `apps/gallery` consumes `@bit-ds/react` only through its built `exports` map. The gallery's manifest engine turns each component's manifest into a preview, controls and a code string. This PR changes the token names and values underneath without changing any rendered size, then adds the minimal `/components/:slug` route that PR2's new components hang on (D14).

**Tech Stack:** pnpm 9.15.9 workspaces, TypeScript 5.9 strict, React 19, Vitest 4 (node for core, jsdom for react and gallery), tsup + esbuild, react-router-dom 7 (hash router), axe-core, Storybook 10 (still built in PR1; removed in PR3).

**Spec:**
- `docs/designs/gallery-dogfood.md`: PR table, row "1 Foundation", and its merge gate. This doc wins on PR boundaries.
- `docs/superpowers/plans/2026-09-13-gallery.md`, in particular:
  - "Design Review Amendments (2026-10-02)" §A–§I
  - "Engineering Review (2026-10-02)": D9, D12, D13, D14, D15c; outside-voice items OV5 and OV6; tasks E3–E7.

## Global Constraints

- **Branch and landing:** branch `feat/foundation` from the current `main` (`1ff983c`). Open one PR targeting `main`. It merges alone, only after the owner says OK (D11).
- **Package names:** `@bit-ds/core` and `@bit-ds/gallery` are private. `@bit-ds/react` stays at version `0.0.0` with `"private": true` until PR3's T12. `apps/docs` becomes `@bit-ds/docs`.
- **Where `@bit/` may remain:** historical plans and design docs (`docs/superpowers/plans/**`, `docs/designs/**`, `TODOS.md`) keep the old name on purpose.
- **Gallery imports:** the gallery imports `@bit-ds/react` only through its `exports` map. `pnpm build` must run before gallery typecheck, test or dev, because the gallery resolves `dist/`.
- **Token rules:**
  - Components read only semantic tokens (`SEMANTIC_TOKENS`), never `--bit-palette-*`.
  - Private variables are `--_bit-*`.
  - Non-axis enums (Stack `gap`, Text `size`, Badge `shape`) render as `data-*` attributes, never classes.
- **Size names are px:**
  - `--bit-space-4px … -64px`, read by Stack `gap={16}`.
  - `--bit-radius-6px | -10px | -14px`, plus `--bit-radius-full`.
  - `--bit-text-11px | -13px | -15px | -18px | -24px | -32px`, read by Text `size={18}`, which emits `data-size`.
  - Controls keep `size="sm|md|lg"`.
  - Logged limit: the names describe power-up's scale only.
- **Canonical CSS import order is theme first:** `import '@bit-ds/react/themes/power-up.css';` then `import '@bit-ds/react/styles.css';`.
- **Palette** (amendments §C), every pair WCAG AA:
  - primary `#7C3AED` / contrast `#FFFFFF` / hover `#6527D4` / soft `#EBE1FD`
  - neutral `#FFFFFF` / `#151515` / `#E5E7E0` / `#DCDED6`
  - success `#1FA34A` / `#151515` / hover, see Decision 1 below / `#D3F1DD`
  - warning `#FFC800` / `#151515` / `#F0B400` / `#FFF1B8`
  - danger `#D91A1A` / `#FFFFFF` / `#B81414` / `#FBD5D5`
  - surfaces: bg `#EEEFE9`, surface `#FFFFFF`, ink and text `#151515`, text-muted `#4A4A5E`
- **Code theme "Ink night":** `--bit-code-*`, every color ≥ 5.6:1 on its background:
  - bg `#151515`, text `#EDEBE4`
  - keyword `#C4A7FF`, string `#7EE2A0`, tag `#7CC7FF`, component `#FFD54A`
  - attr `#FFB86B`, punct `#A3A3AE`, comment `#8E8E9A`, number `#FF9F7A`, prop `#FF8FCB`
- **`--bit-font-mono`:** `"JetBrains Mono", ui-monospace, monospace`, loaded through the theme's Google Fonts `@import`.
- **Logo tokens:** `--bit-logo-coin #FFCC00`, `-coin-light #FFF3BF`, `-coin-shade #E0B000`, `-coin-deep #F5A623`. The 16 and 64 eras read only these.
- **Focus (D9):**
  - `reset.css` draws `:focus-visible { outline: 3px solid var(--bit-color-ink); outline-offset: 3px; }`.
  - Token `--bit-focus-band: 0 0 0 3px var(--bit-color-warning)`.
  - Each interactive component's box-shadow starts with the private `--_bit-focus-band` (OV5).
- **Storybook builds** (PR1 gate). Story code is updated only so it type-checks; visual drift in soon-deleted stories is accepted.
- **Commits:** conventional (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`, `docs:`, `ci:`), ending with the single trailer line `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Code style:** immutable updates (no mutating inputs), small focused files, comments only where the code doesn't say it.

## Decisions this plan makes that the specs left open

Owner confirmed 1 and 2 on 2026-10-03 against a rendered board: `~/.gstack/projects/doosemavis-bit-design-system/designs/pr1-decisions-20261003/board.html`.

1. **Success hover is `#19943F`, not the approved `#178C3E`.** Ink `#151515` on `#178C3E` is 4.22:1, under the 4.5:1 AA floor. The existing contrast test enforces that floor, and §C promises "every pair passes WCAG AA." `#19943F` is the closest darker shade that passes (4.65:1). Every other approved pair passes (checked numerically 2026-10-03; the lowest are primary 5.70, danger 5.11 and success fill 5.56).
2. **`--bit-color-focus` is removed in Task 6.** D9 replaced the blue focus outline with an ink outline and replaced its contrast check, so nothing reads it anymore. §C's `focus #1D5BFF` existed only for that outline.
3. **The focus band is reset on the block (`.bit-button { --_bit-focus-band: 0 0 #0000 }`)** and every shadow then reads `var(--_bit-focus-band)`. This replaces OV5's per-use fallback. Custom properties inherit, so without the reset, a focused ancestor that sets the band (PR2's SegmentedControl uses `:has(:focus-visible)`) would light up every Button inside it.
4. **Off-scale values from untyped callers are dropped with a dev warning.** Examples are `gap={3}` and `size="lg"`, the old values. The `data-*` attribute is omitted, the same rule `toClasses` uses for axes. Stack then has no gap and Text falls back to 15px. Typed callers get a compile error instead.
5. **The minimal component page shows the React code as a plain `<pre>`.** D14 says "via the existing CodePanel/CodeBlock path", but those were never built (old Task 8 was superseded). CodeBlock arrives in PR2 and `toHtml` in PR3, so HTML ChildSpec support in `toHtml` lands with `toHtml`. It comes for free, because `toHtml` serializes `renderManifest`'s output.
6. **Known gap carried to PR3:** focus still jumps to the page heading when a control changes. That is §H.1, fixed in T8. Nothing deploys from `main` until PR3's release, so no visitor sees it.

## Review Focus

1. **Old size values from callers that skip type checking:** `<Stack gap={3}>` (the old 12px step) or `<Text size="lg">`. They must warn in development and render no wrong size. Pinned in Task 3, in the Stack and Text "untyped caller" tests.
2. **A stylesheet still reading a renamed token** (`var(--bit-space-4)`). In a browser that silently resolves to nothing, so the element loses its spacing with no error. Pinned in:
   - Task 2: system CSS reads only semantic tokens; old names are no longer declared.
   - Task 4: gallery.css reads only tokens the shipped theme declares.
3. **A link shared before the rename:** `#/components/stack?gap=3`. It must render the default 12px gap, not crash and not render 3px. Pinned in Task 10, "old shared links".
4. **A path that isn't a component page:** `/components/nope`, or `/components/logo` (the logo lives at `/brand/logo`). Both must render the 404, not a blank page or a duplicate route. Pinned in Task 10, "renders the 404".
5. **A Button state that drops the focus band:** hover, active and ghost replace `box-shadow`, so the yellow band could be lost exactly where people click, or leak into nested controls from a focused ancestor. Pinned in Task 6, "every box-shadow starts with the band" and "the block resets the band".

---

## File structure

| File | Task | Responsibility |
|---|---|---|
| `.github/workflows/ci.yml` | 1 | renamed filters; new old-scope grep gate |
| every `package.json`, imports, scripts, README, CONTRIBUTING, specs | 1 | `@bit/` → `@bit-ds/` |
| `packages/core/src/tokens.ts` | 2, 5, 6 | the token name list (px names; code, mono, selection, logo, focus-band) |
| `packages/core/src/themes/power-up.css` | 2, 5, 6 | the token values |
| `packages/core/src/system/{sizes,reset}.css` | 2, 5, 6 | control-size decorators; base, browser surfaces, focus |
| `packages/core/src/components/{stack,text}.css` | 2 | `data-gap` / `data-size` → px tokens |
| `packages/core/src/components/{button,badge,logo,alert,card}.css` | 2, 5, 6, 7 | renamed token reads; focus band; Badge shape; logo coin tokens |
| `packages/core/src/__tests__/px-rename.test.ts` | 2 | D13 frozen table (new) |
| `packages/core/src/__tests__/{tokens,system,contrast}.test.ts` | 2, 5, 6, 7 | token list, CSS conventions, contrast |
| `packages/react/src/system/toClasses.ts` | 3 | new `dataValue()` for `data-*` enums |
| `packages/react/src/components/{Stack,Text,Badge}/*` | 3, 7 | px props, Badge `shape`, tests, stories |
| `apps/docs/stories/Tokens.stories.tsx` | 4 | renamed radius token |
| `apps/gallery/src/manifests/*` | 4, 7, 8, 9 | migrated values, `group`, `docs`, HTML ChildSpec, sentinels |
| `apps/gallery/src/engine/{buildProps,renderManifest}.ts(x)`, `code/toJsx.ts` | 8, 9 | shared sentinel rule; HTML ChildSpec |
| `apps/gallery/src/gallery-css.test.ts` | 4 | gallery.css reads only declared tokens (new) |
| `apps/gallery/src/shell/Sidebar.tsx` (+ new test) | 9 | groups from `manifest.group`, Forms group |
| `apps/gallery/src/pages/ComponentPage.tsx`, `router.tsx`, `routes.test.tsx` | 10 | minimal component page, routes, route smoke |
| `apps/gallery/src/main.tsx`, `main.test.ts`, `pages/HomePage.tsx`, `README.md`, root `package.json` | 11 | theme-first import order; `dev` alias |

---

### Task 1: Rename the npm scope to `@bit-ds` (T1)

**Files:**
- Modify: every tracked file `git grep -lE '@bit(/|\\/)'` lists, except `docs/designs/**`, `docs/superpowers/plans/**` and `pnpm-lock.yaml`:
  - `.github/workflows/ci.yml`, `package.json`, `README.md`, `CONTRIBUTING.md`
  - `apps/docs/{package.json,.storybook/preview.ts,stories/Tokens.stories.tsx}`
  - `apps/gallery/package.json`, `apps/gallery/src/**`
  - `packages/core/{package.json,src/__tests__/smoke.test.ts}`
  - `packages/react/{package.json,tsup.config.ts,scripts/*.mjs,src/index.ts,src/index.test.tsx,src/system/*.ts}`
  - `scripts/smoke-consumer.mjs`
  - `docs/superpowers/specs/*.md`
- Modify: `pnpm-lock.yaml`, regenerated by `pnpm install`.
- Modify: `docs/superpowers/plans/2026-09-13-gallery.md`, the §I T1 Verify line only (reviewer concern R3-2).

**Interfaces:**
- Produces:
  - Package names `@bit-ds/core`, `@bit-ds/react`, `@bit-ds/gallery` and `@bit-ds/docs`.
  - Import specifiers `@bit-ds/react`, `@bit-ds/react/styles.css`, `@bit-ds/react/themes/power-up.css` and `@bit-ds/core/tokens`.
  - Every later task uses these names.

- [ ] **Step 1: Create the branch**

```bash
git checkout main && git pull --ff-only && git checkout -b feat/foundation
```

- [ ] **Step 2: Run the scope gate and watch it fail**

This is the exact check CI will run (Step 7). It catches both the plain `@bit/` and the regex-escaped `@bit\/` (in `verify-dist.mjs:32` and `Shell.test.tsx:16`).

```bash
grep -rnE '@bit(/|\\/)' packages apps scripts README.md CONTRIBUTING.md docs/superpowers/specs package.json \
  --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=coverage --exclude-dir=storybook-static
```

Expected: many matches (exit 0). That's the failing state.

- [ ] **Step 3: Rewrite the scope in every tracked file except the historical docs and the lockfile**

The pattern uses `|` as the sed delimiter: a `#` breaks under zsh. The second expression handles the regex-escaped form `@bit\/`.

```bash
git grep -lE '@bit(/|\\/)' -- . ':!docs/designs' ':!docs/superpowers/plans' ':!pnpm-lock.yaml' \
  | xargs sed -i '' -e 's|@bit/|@bit-ds/|g' -e 's|@bit\\/|@bit-ds\\/|g'
```

- [ ] **Step 4: Regenerate the lockfile and check the result**

```bash
pnpm install
git grep -nE '@bit(/|\\/)' -- pnpm-lock.yaml
```

Expected: `pnpm install` succeeds; the `git grep` prints nothing (exit 1).

Then re-run the Step 2 command. Expected: no output, exit 1.

- [ ] **Step 5: Spot-check the two escaped regexes**

```bash
grep -n "@bit-ds" packages/react/scripts/verify-dist.mjs apps/gallery/src/shell/Shell.test.tsx
```

Expected:
- `verify-dist.mjs:32` reads `!/from\s+['"]@bit-ds\/core/.test(contents)` with the message `still imports from @bit-ds/core`.
- `Shell.test.tsx:16` reads `/pnpm add @bit-ds\/react/`.

- [ ] **Step 6: Amend the old plan's T1 Verify line (R3-2)**

In `docs/superpowers/plans/2026-09-13-gallery.md`, replace this exact line:

```
  - Verify: `pnpm build && pnpm verify && pnpm test`; `grep -r "@bit/" --exclude-dir=node_modules` is empty.
```

with:

```
  - Verify: `pnpm build && pnpm verify && pnpm test`; `grep -rnE '@bit(/|\\/)' packages apps scripts README.md CONTRIBUTING.md docs/superpowers/specs package.json` (excluding node_modules, dist, coverage, storybook-static) is empty. Historical plans and design docs keep `@bit/` on purpose. CI enforces this (PR1 plan, Task 1).
```

- [ ] **Step 7: Add the gate to CI**

In `.github/workflows/ci.yml`, insert after the line `      - run: pnpm install --frozen-lockfile`:

```yaml
      # The npm scope is @bit-ds (the @bit scope belongs to another org). Historical plans and
      # design docs keep the old name on purpose, so they are outside the searched paths.
      - name: No old npm scope
        run: |
          if grep -rnE '@bit(/|\\/)' packages apps scripts README.md CONTRIBUTING.md docs/superpowers/specs package.json \
            --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=coverage --exclude-dir=storybook-static; then
            echo "Found the old npm scope above. Use @bit-ds/ instead."
            exit 1
          fi
```

Check the rest of the file now reads `@bit-ds/react` in the build comment and `pnpm --filter @bit-ds/core test` / `pnpm --filter @bit-ds/gallery test`.

- [ ] **Step 8: Run the full local gate**

```bash
pnpm build && pnpm verify && pnpm typecheck && pnpm lint \
  && pnpm --filter @bit-ds/core test && pnpm test:coverage && pnpm --filter @bit-ds/gallery test \
  && pnpm smoke && pnpm storybook:build
```

Expected:
- every command passes
- `verify` prints `dist OK: 11 components`
- `smoke` prints `consumer OK`
- gallery 60/60 (Task 7's count)

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
refactor: rename the npm scope to @bit-ds

The @bit scope belongs to another npm org. CI now fails on any @bit/ (or
regex-escaped @bit\/) left in packages, apps, scripts, the README,
CONTRIBUTING or the specs; historical plans and design docs keep it.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Core tokens get px names, proven by a frozen value table (T2 core, D13)

**Files:**
- Create: `packages/core/src/__tests__/px-rename.test.ts`
- Modify:
  - `packages/core/src/tokens.ts` (full rewrite below)
  - `packages/core/src/themes/power-up.css`: shape, typography and space blocks
  - `packages/core/src/system/sizes.css` (full rewrite)
  - `packages/core/src/components/stack.css` and `text.css` (full rewrites)
  - `packages/core/src/components/{alert,badge,button,card,logo}.css` and `packages/core/src/system/reset.css`, through the rename script
- Test: `packages/core/src/__tests__/{tokens,system}.test.ts`

**Interfaces:**
- Consumes: package names from Task 1.
- Produces:
  - `TEXT_SIZES = [11, 13, 15, 18, 24, 32] as const` and `SPACE_STEPS = [4, 8, 12, 16, 24, 32, 48, 64] as const`, with `type TextSize` and `type SpaceStep` (unions of those numbers), all exported from `@bit-ds/core/tokens`.
  - Token names `--bit-space-{n}px`, `--bit-radius-{6|10|14}px`, `--bit-radius-full`, `--bit-text-{n}px`.
  - CSS hooks `.bit-stack[data-gap="{n}"]` and `.bit-text[data-size="{n}"]`.
  - Task 3 consumes all of this.

**Expected red state:** after this task, `packages/react` and `apps/gallery` stop type-checking, because `gap={3}` and `size="md"` are no longer valid. Task 3 fixes react; Task 4 fixes the gallery. This task's gate is core alone.

- [ ] **Step 1: Write the frozen table test**

Create `packages/core/src/__tests__/px-rename.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { SPACE_STEPS, TEXT_SIZES } from '../tokens';
import { parseCustomProps, readCss, resolveVar } from './css';

/**
 * D13 regression contract: the px rename changes names, never rendered sizes.
 * Frozen 2026-10-03 from power-up's values before the rename. Never edit a row to make a test pass;
 * a failing row means a size really changed.
 */
const FROZEN: readonly (readonly [oldName: string, newName: string, px: string])[] = [
  ['--bit-space-1', '--bit-space-4px', '4px'],
  ['--bit-space-2', '--bit-space-8px', '8px'],
  ['--bit-space-3', '--bit-space-12px', '12px'],
  ['--bit-space-4', '--bit-space-16px', '16px'],
  ['--bit-space-5', '--bit-space-24px', '24px'],
  ['--bit-space-6', '--bit-space-32px', '32px'],
  ['--bit-space-7', '--bit-space-48px', '48px'],
  ['--bit-space-8', '--bit-space-64px', '64px'],
  ['--bit-radius-sm', '--bit-radius-6px', '6px'],
  ['--bit-radius-md', '--bit-radius-10px', '10px'],
  ['--bit-radius-lg', '--bit-radius-14px', '14px'],
  ['--bit-text-xs', '--bit-text-11px', '11px'],
  ['--bit-text-sm', '--bit-text-13px', '13px'],
  ['--bit-text-md', '--bit-text-15px', '15px'],
  ['--bit-text-lg', '--bit-text-18px', '18px'],
  ['--bit-text-xl', '--bit-text-24px', '24px'],
  ['--bit-text-2xl', '--bit-text-32px', '32px'],
];

const theme = parseCustomProps(readCss('themes/power-up.css'));

describe('px rename (D13 frozen table)', () => {
  it.each(FROZEN)('%s → %s still renders %s in power-up', (_old, newName, px) => {
    expect(resolveVar(theme, newName)).toBe(px);
  });

  it.each(FROZEN)('%s is no longer declared', (oldName) => {
    expect(theme.has(oldName)).toBe(false);
  });

  it.each(SPACE_STEPS)('stack.css maps data-gap="%i" to its px space token', (n) => {
    expect(readCss('components/stack.css')).toContain(`.bit-stack[data-gap="${n}"] { gap: var(--bit-space-${n}px); }`);
  });

  it.each(TEXT_SIZES)('text.css maps data-size="%i" to its px text token', (n) => {
    expect(readCss('components/text.css')).toContain(`.bit-text[data-size="${n}"] { font-size: var(--bit-text-${n}px); }`);
  });

  it('Text with no size renders 15px, the old md', () => {
    expect(readCss('components/text.css')).toMatch(/\.bit-text \{[^}]*font-size: var\(--bit-text-15px\);/);
  });
});
```

- [ ] **Step 2: Update the token list test**

In `packages/core/src/__tests__/tokens.test.ts`:

Replace

```ts
  it('has the five colors, three sizes, six text sizes', () => {
    expect(COLORS).toEqual(['primary', 'neutral', 'success', 'warning', 'danger']);
    expect(SIZES).toEqual(['sm', 'md', 'lg']);
    expect(TEXT_SIZES).toEqual(['xs', 'sm', 'md', 'lg', 'xl', '2xl']);
  });
```

with

```ts
  it('has the five colors, three control sizes, six px text sizes, eight px space steps', () => {
    expect(COLORS).toEqual(['primary', 'neutral', 'success', 'warning', 'danger']);
    expect(SIZES).toEqual(['sm', 'md', 'lg']);
    expect(TEXT_SIZES).toEqual([11, 13, 15, 18, 24, 32]);
    expect(SPACE_STEPS).toEqual([4, 8, 12, 16, 24, 32, 48, 64]);
  });
```

Change the import line to `import { SEMANTIC_TOKENS, COLORS, SIZES, SPACE_STEPS, TEXT_SIZES } from '../tokens';`.

In the `expected` array, replace these three lines:

```ts
      '--bit-border-width', '--bit-radius-sm', '--bit-radius-md', '--bit-radius-lg', '--bit-radius-full',
      ...
      '--bit-text-xs', '--bit-text-2xl', '--bit-leading-tight', '--bit-leading-normal', '--bit-weight-normal', '--bit-weight-bold',
      '--bit-space-1', '--bit-space-8',
```

with

```ts
      '--bit-border-width', '--bit-radius-6px', '--bit-radius-10px', '--bit-radius-14px', '--bit-radius-full',
      ...
      '--bit-text-11px', '--bit-text-32px', '--bit-leading-tight', '--bit-leading-normal', '--bit-weight-normal', '--bit-weight-bold',
      '--bit-space-4px', '--bit-space-64px',
```

The `...` stands for the unchanged lines between them. Leave those as they are. The count stays **67**.

- [ ] **Step 3: Update the system test**

In `packages/core/src/__tests__/system.test.ts`, replace the whole `describe('system/sizes.css', …)` block with:

```ts
describe('system/sizes.css', () => {
  const css = readCss('system/sizes.css');
  /** Control text sizes in px. Frozen with the rename: sm 13px, md 15px, lg 18px. */
  const CONTROL_TEXT = { sm: 13, md: 15, lg: 18 } as const;

  it.each(SIZES)('.bit-%s remaps height, padding, and text', (size) => {
    const body = block(css, `.bit-${size}`);
    expect(body).toContain(`--_bit-size-height: var(--bit-control-height-${size});`);
    expect(body).toContain(`--_bit-size-padding: var(--bit-control-padding-${size});`);
    expect(body).toContain(`--_bit-size-text: var(--bit-text-${CONTROL_TEXT[size]}px);`);
  });

  it.each(['xs', 'xl', '2xl'])('declares no .bit-%s decorator (Text sizes are data-size now)', (name) => {
    expect(block(css, `.bit-${name}`)).toBeNull();
  });
});
```

Change the import to `import { SEMANTIC_TOKENS, SIZES, COLORS } from '../tokens';`, since `TEXT_SIZES` is no longer used here.

Then add this block after the `describe('index.css', …)` block:

```ts
describe('system/*.css conventions', () => {
  for (const file of listCss('system')) {
    it(`${file}: every var(--bit-…) it reads is a semantic token`, () => {
      const reads = [...readCss(`system/${file}`).matchAll(/var\((--bit-[a-zA-Z0-9-]+)/g)].map((m) => m[1]!);
      for (const name of reads) expect(SEMANTIC_TOKENS).toContain(name);
    });
  }
});
```

Also widen the component-file read check from `/var\((--bit-[a-zA-Z0-9-]+)\)/g` to `/var\((--bit-[a-zA-Z0-9-]+)/g`. That makes it catch `var(--bit-x, fallback)` too.

- [ ] **Step 4: Run the core tests and watch them fail**

Run: `pnpm --filter @bit-ds/core test`

Expected: FAIL:
- `px-rename.test.ts`: `Token --bit-space-4px is not declared`
- `tokens.test.ts`: `TEXT_SIZES` mismatch
- `system.test.ts`: `--_bit-size-text: var(--bit-text-13px);`

- [ ] **Step 5: Rewrite `tokens.ts`**

Replace `packages/core/src/tokens.ts` with:

```ts
/** Every public class and custom property starts with this. */
export const PREFIX = 'bit';

/** The five color roles. Same words as the `color` prop and the `bit-{color}` class. */
export const COLORS = ['primary', 'neutral', 'success', 'warning', 'danger'] as const;
/** Control sizes. Same words as the `size` prop and the `bit-{size}` class. */
export const SIZES = ['sm', 'md', 'lg'] as const;
/**
 * Text sizes in px. Same numbers as Text's `size` prop, its `data-size` attribute and the
 * `--bit-text-{n}px` token. The names describe power-up's scale; revisit if a theme needs another.
 */
export const TEXT_SIZES = [11, 13, 15, 18, 24, 32] as const;
/** Space in px. Same numbers as Stack's `gap` prop, its `data-gap` attribute and the `--bit-space-{n}px` token. */
export const SPACE_STEPS = [4, 8, 12, 16, 24, 32, 48, 64] as const;
/** Corner radii in px, as `--bit-radius-{n}px`. `--bit-radius-full` (the pill) names a shape, not a size. */
const RADII = [6, 10, 14] as const;

export type Color = (typeof COLORS)[number];
export type Size = (typeof SIZES)[number];
export type TextSize = (typeof TEXT_SIZES)[number];
export type SpaceStep = (typeof SPACE_STEPS)[number];

const token = (category: string, ...parts: (string | number)[]) =>
  `--${PREFIX}-${[category, ...parts].join('-')}`;

const px = (n: number) => `${n}px`;

const colorRoleTokens = ['bg', 'surface', 'ink', 'text', 'text-muted', 'focus'].map((role) => token('color', role));

const colorTokens = COLORS.flatMap((color) => [
  token('color', color),
  token('color', color, 'contrast'),
  token('color', color, 'hover'),
  token('color', color, 'soft'),
]);

const shapeTokens = [
  token('border', 'width'),
  ...RADII.map((n) => token('radius', px(n))),
  token('radius', 'full'),
  ...['sm', 'md', 'lg', 'inset'].map((s) => token('shadow', s)),
  token('gloss'),
];

const typeTokens = [
  ...['display', 'body', 'pixel'].map((f) => token('font', f)),
  ...TEXT_SIZES.map((n) => token('text', px(n))),
  token('leading', 'tight'),
  token('leading', 'normal'),
  token('weight', 'normal'),
  token('weight', 'bold'),
];

const spaceTokens = SPACE_STEPS.map((n) => token('space', px(n)));

const controlTokens = [
  ...SIZES.map((s) => token('control', 'height', s)),
  ...SIZES.map((s) => token('control', 'padding', s)),
];

const motionTokens = [
  token('press', 'offset'),
  token('duration', 'fast'),
  token('duration', 'normal'),
  token('motion', 'power-up'),
];

/**
 * The complete tier-2 token set. Every theme must declare every one of these.
 * Components read only these names (never tier-1 `--bit-palette-*` values).
 */
export const SEMANTIC_TOKENS: readonly string[] = [
  ...colorRoleTokens,
  ...colorTokens,
  ...shapeTokens,
  ...typeTokens,
  ...spaceTokens,
  ...controlTokens,
  ...motionTokens,
];
```

- [ ] **Step 6: Rename the theme's shape, type and space values**

In `packages/core/src/themes/power-up.css`, make these replacements. Values are unchanged; only names change.

```css
  --bit-radius-sm: 6px;
  --bit-radius-md: 10px;
  --bit-radius-lg: 14px;
```

→

```css
  --bit-radius-6px: 6px;
  --bit-radius-10px: 10px;
  --bit-radius-14px: 14px;
```

```css
  --bit-text-xs: 11px;
  --bit-text-sm: 13px;
  --bit-text-md: 15px;
  --bit-text-lg: 18px;
  --bit-text-xl: 24px;
  --bit-text-2xl: 32px;
```

→

```css
  --bit-text-11px: 11px;
  --bit-text-13px: 13px;
  --bit-text-15px: 15px;
  --bit-text-18px: 18px;
  --bit-text-24px: 24px;
  --bit-text-32px: 32px;
```

```css
  --bit-space-1: 4px;
  --bit-space-2: 8px;
  --bit-space-3: 12px;
  --bit-space-4: 16px;
  --bit-space-5: 24px;
  --bit-space-6: 32px;
  --bit-space-7: 48px;
  --bit-space-8: 64px;
```

→

```css
  --bit-space-4px: 4px;
  --bit-space-8px: 8px;
  --bit-space-12px: 12px;
  --bit-space-16px: 16px;
  --bit-space-24px: 24px;
  --bit-space-32px: 32px;
  --bit-space-48px: 48px;
  --bit-space-64px: 64px;
```

- [ ] **Step 7: Rewrite `sizes.css`, `stack.css` and `text.css`**

`packages/core/src/system/sizes.css`:

```css
/* Size decorators for controls. sm/md/lg set height, padding, and text size.
   Text does not use these: its size is a px number rendered as data-size (see components/text.css). */
.bit-sm {
  --_bit-size-height: var(--bit-control-height-sm);
  --_bit-size-padding: var(--bit-control-padding-sm);
  --_bit-size-text: var(--bit-text-13px);
}

.bit-md {
  --_bit-size-height: var(--bit-control-height-md);
  --_bit-size-padding: var(--bit-control-padding-md);
  --_bit-size-text: var(--bit-text-15px);
}

.bit-lg {
  --_bit-size-height: var(--bit-control-height-lg);
  --_bit-size-padding: var(--bit-control-padding-lg);
  --_bit-size-text: var(--bit-text-18px);
}
```

`packages/core/src/components/stack.css`:

```css
/* Stack: flex layout driven by data attributes (layout is not a design axis, so no decorator classes).
   gap is a px value on the space scale; each value reads the token with the same number. */
.bit-stack {
  display: flex;
}

.bit-stack[data-direction="column"] { flex-direction: column; }
.bit-stack[data-direction="row"] { flex-direction: row; }
.bit-stack[data-wrap] { flex-wrap: wrap; }

.bit-stack[data-gap="4"] { gap: var(--bit-space-4px); }
.bit-stack[data-gap="8"] { gap: var(--bit-space-8px); }
.bit-stack[data-gap="12"] { gap: var(--bit-space-12px); }
.bit-stack[data-gap="16"] { gap: var(--bit-space-16px); }
.bit-stack[data-gap="24"] { gap: var(--bit-space-24px); }
.bit-stack[data-gap="32"] { gap: var(--bit-space-32px); }
.bit-stack[data-gap="48"] { gap: var(--bit-space-48px); }
.bit-stack[data-gap="64"] { gap: var(--bit-space-64px); }

.bit-stack[data-align="start"] { align-items: flex-start; }
.bit-stack[data-align="center"] { align-items: center; }
.bit-stack[data-align="end"] { align-items: flex-end; }
.bit-stack[data-align="stretch"] { align-items: stretch; }

.bit-stack[data-justify="start"] { justify-content: flex-start; }
.bit-stack[data-justify="center"] { justify-content: center; }
.bit-stack[data-justify="end"] { justify-content: flex-end; }
.bit-stack[data-justify="between"] { justify-content: space-between; }
```

`packages/core/src/components/text.css`:

```css
/* Text: size is a px number rendered as data-size; each value reads the token with the same number.
   With no data-size (or an unknown one) Text renders 15px. 24 and 32 switch to the display face. */
.bit-text {
  margin: 0;
  font-family: var(--bit-font-body);
  font-size: var(--bit-text-15px);
  line-height: var(--bit-leading-normal);
  color: var(--bit-color-text);
}

.bit-text[data-size="11"] { font-size: var(--bit-text-11px); }
.bit-text[data-size="13"] { font-size: var(--bit-text-13px); }
.bit-text[data-size="15"] { font-size: var(--bit-text-15px); }
.bit-text[data-size="18"] { font-size: var(--bit-text-18px); }
.bit-text[data-size="24"] { font-size: var(--bit-text-24px); }
.bit-text[data-size="32"] { font-size: var(--bit-text-32px); }

.bit-text[data-weight="normal"] { font-weight: var(--bit-weight-normal); }
.bit-text[data-weight="bold"] { font-weight: var(--bit-weight-bold); }

/* 24 and 32 switch to the display face, which has one weight. This rule comes after the weight rules
   at the same specificity, so font-weight: 400 wins and the browser never synthesizes a faux bold. */
.bit-text[data-size="24"],
.bit-text[data-size="32"] {
  font-family: var(--bit-font-display);
  font-weight: 400;
  line-height: var(--bit-leading-tight);
  letter-spacing: 0.01em;
}

.bit-text.bit-neutral {
  color: var(--bit-color-text-muted);
}
```

- [ ] **Step 8: Rename every remaining token read in core CSS**

This one-off script rewrites `var(--bit-<old>)` to `var(--bit-<new>)`. It runs on the files that still read old names. Don't commit it.

```bash
node -e '
const fs = require("node:fs");
const MAP = {
  "space-1": "space-4px", "space-2": "space-8px", "space-3": "space-12px", "space-4": "space-16px",
  "space-5": "space-24px", "space-6": "space-32px", "space-7": "space-48px", "space-8": "space-64px",
  "radius-sm": "radius-6px", "radius-md": "radius-10px", "radius-lg": "radius-14px",
  "text-xs": "text-11px", "text-sm": "text-13px", "text-md": "text-15px",
  "text-lg": "text-18px", "text-xl": "text-24px", "text-2xl": "text-32px",
};
const OLD = /var\(--bit-(space-[1-8]|radius-(?:sm|md|lg)|text-(?:xs|sm|md|lg|xl|2xl))\)/g;
for (const file of process.argv.slice(1)) {
  const before = fs.readFileSync(file, "utf8");
  const after = before.replace(OLD, (_m, name) => `var(--bit-${MAP[name]})`);
  if (after !== before) { fs.writeFileSync(file, after); console.log("renamed in", file); }
}' packages/core/src/components/*.css packages/core/src/system/*.css
```

Expected output:

```
renamed in packages/core/src/components/alert.css
renamed in packages/core/src/components/badge.css
renamed in packages/core/src/components/button.css
renamed in packages/core/src/components/card.css
renamed in packages/core/src/components/logo.css
renamed in packages/core/src/system/reset.css
```

Spot-check `logo.css`. It should now read `font-size: var(--bit-text-32px);` and `calc(var(--bit-text-32px) * 1.5)`.

- [ ] **Step 9: Run the core tests and watch them pass**

Run: `pnpm --filter @bit-ds/core test && pnpm --filter @bit-ds/core typecheck`

Expected: PASS. The suites are px-rename (17 + 17 + 8 + 6 + 1), tokens, system, contrast, theme-completeness and smoke.

- [ ] **Step 10: Commit**

```bash
git add packages/core
git commit -m "$(cat <<'EOF'
feat(core): px-named space, radius and type tokens

--bit-space-{4..64}px, --bit-radius-{6,10,14}px and --bit-text-{11..32}px replace
the step and t-shirt names. A frozen table (D13) proves every token still
renders the same px in power-up and that no old name is declared. Stack and
Text read data-gap / data-size with the px number. Controls keep sm|md|lg.

react and gallery stop type-checking until the next two commits migrate them.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: React Stack `gap` and Text `size` take px numbers (T2 react, D13)

**Files:**
- Modify:
  - `packages/react/src/system/toClasses.ts` (add `DataAxis`, `dataValue`; generalize `warnUnknown`)
  - `packages/react/src/components/Stack/Stack.tsx` and `packages/react/src/components/Text/Text.tsx`
  - `packages/react/src/components/Stack/Stack.stories.tsx` and `packages/react/src/components/Text/Text.stories.tsx`
- Test:
  - `packages/react/src/system/toClasses.test.ts`
  - `packages/react/src/components/Stack/Stack.test.tsx` and `packages/react/src/components/Text/Text.test.tsx` (full rewrites)
  - `packages/react/src/index.test.tsx`

**Interfaces:**
- Consumes: `TEXT_SIZES`, `SPACE_STEPS`, `TextSize` and `SpaceStep` from `@bit-ds/core/tokens` (Task 2), re-exported by `src/system/axes.ts` (unchanged).
- Produces:
  - `export interface DataAxis { name: string; allowed: readonly (string | number)[]; value: string | number | undefined }`
  - `export function dataValue(blockName: string, axis: DataAxis): string | undefined`, which Task 7 (Badge) uses.
  - `StackProps.gap?: SpaceStep`, default `12`; `TextProps.size?: TextSize`, default `15`.

- [ ] **Step 1: Write the `dataValue` tests**

In `packages/react/src/system/toClasses.test.ts`, change the import to `import { toClasses, element, withClassName, dataValue } from './toClasses';` and append:

```ts
describe('dataValue', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('returns an allowed value as a string', () => {
    expect(dataValue('stack', { name: 'gap', allowed: [4, 8], value: 8 })).toBe('8');
    expect(dataValue('badge', { name: 'shape', allowed: ['pill', 'square'], value: 'square' })).toBe('square');
  });

  it('returns undefined without warning when no value is given', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(dataValue('stack', { name: 'gap', allowed: [4, 8], value: undefined })).toBeUndefined();
    expect(warn).not.toHaveBeenCalled();
  });

  it('drops an unknown value and warns in development, naming the allowed values', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(dataValue('stack', { name: 'gap', allowed: [4, 8], value: 3 })).toBeUndefined();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain('bit-stack received gap="3"');
    expect(warn.mock.calls[0]?.[0]).toContain('4 | 8');
  });

  it('a numeric string is not the number: "8" is unknown when the scale is numbers', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(dataValue('stack', { name: 'gap', allowed: [4, 8], value: '8' })).toBeUndefined();
  });

  it('does not warn in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    dataValue('stack', { name: 'gap', allowed: [4, 8], value: 3 });
    expect(warn).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Rewrite the Stack tests**

Replace `packages/react/src/components/Stack/Stack.test.tsx`:

```tsx
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Stack } from './Stack';
import { SPACE_STEPS } from '../../system/axes';

describe('Stack', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders a column with a 12px gap by default and no decorator classes', () => {
    render(<Stack data-testid="s">x</Stack>);
    const el = screen.getByTestId('s');
    expect(el.className).toBe('bit-stack');
    expect(el).toHaveAttribute('data-direction', 'column');
    expect(el).toHaveAttribute('data-gap', '12');
    expect(el).not.toHaveAttribute('data-align');
    expect(el).not.toHaveAttribute('data-justify');
    expect(el).not.toHaveAttribute('data-wrap');
  });

  it('exposes layout props as data attributes', () => {
    render(<Stack direction="row" gap={32} align="center" justify="between" wrap data-testid="s">x</Stack>);
    const el = screen.getByTestId('s');
    expect(el).toHaveAttribute('data-direction', 'row');
    expect(el).toHaveAttribute('data-gap', '32');
    expect(el).toHaveAttribute('data-align', 'center');
    expect(el).toHaveAttribute('data-justify', 'between');
    expect(el).toHaveAttribute('data-wrap', '');
  });

  it.each(SPACE_STEPS)('gap={%i} renders data-gap with the same px number', (n) => {
    render(<Stack gap={n} data-testid="s">x</Stack>);
    expect(screen.getByTestId('s')).toHaveAttribute('data-gap', String(n));
  });

  it('gap={4} is 4px now, not the old fourth step (16px)', () => {
    render(<Stack gap={4} data-testid="s">x</Stack>);
    expect(screen.getByTestId('s')).toHaveAttribute('data-gap', '4');
  });

  it('drops an off-scale gap from an untyped caller and warns in development', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // @ts-expect-error 3 was the old step for 12px; gap is the px value now
    render(<Stack gap={3} data-testid="s">x</Stack>);
    expect(screen.getByTestId('s')).not.toHaveAttribute('data-gap');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain('gap="3"');
  });

  it('appends className last', () => {
    render(<Stack className="extra" data-testid="s">x</Stack>);
    expect(screen.getByTestId('s').className).toBe('bit-stack extra');
  });

  it('rejects the legacy DOM color attribute and does not render it', () => {
    render(
      // @ts-expect-error color is not part of StackProps
      <Stack color="danger" data-testid="s">
        x
      </Stack>,
    );
    expect(screen.getByTestId('s')).not.toHaveAttribute('color');
  });
});
```

- [ ] **Step 3: Rewrite the Text tests**

Replace `packages/react/src/components/Text/Text.test.tsx`:

```tsx
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { Text } from './Text';
import { TEXT_SIZES } from '../../system/axes';
import { expectNoA11yViolations } from '../../test/a11y';

describe('Text', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders a <p> at 15px and normal weight by default', () => {
    render(<Text>Hello</Text>);
    const el = screen.getByText('Hello');
    expect(el.tagName).toBe('P');
    expect(el.className).toBe('bit-text');
    expect(el).toHaveAttribute('data-size', '15');
    expect(el).toHaveAttribute('data-weight', 'normal');
  });

  it('renders the element given by `as` and maps size, color, and weight', () => {
    render(<Text as="h2" size={32} color="neutral" weight="bold">Title</Text>);
    const el = screen.getByRole('heading', { level: 2 });
    expect(el.className).toBe('bit-text bit-neutral');
    expect(el).toHaveAttribute('data-size', '32');
    expect(el).toHaveAttribute('data-weight', 'bold');
  });

  it.each(TEXT_SIZES)('size={%i} renders data-size with the same px number', (n) => {
    render(<Text size={n}>x</Text>);
    expect(screen.getByText('x')).toHaveAttribute('data-size', String(n));
  });

  it('drops an old size name from an untyped caller and warns in development', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // @ts-expect-error "lg" was the old name for 18px; size is the px value now
    render(<Text size="lg">x</Text>);
    expect(screen.getByText('x')).not.toHaveAttribute('data-size');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain('size="lg"');
  });

  it('appends className last and forwards the ref', () => {
    const ref = createRef<HTMLElement>();
    render(<Text ref={ref} as="span" className="extra">x</Text>);
    expect(screen.getByText('x').className).toBe('bit-text extra');
    expect(ref.current).toBe(screen.getByText('x'));
  });

  it('has no accessibility violations as a heading', async () => {
    const { container } = render(<Text as="h1" size={24}>Press Start</Text>);
    await expectNoA11yViolations(container);
  });
});
```

- [ ] **Step 4: Pin the exported scales**

In `packages/react/src/index.test.tsx`, inside `it('exports the prefix and axes', …)`, add after the `SIZES` line:

```ts
    expect(lib.TEXT_SIZES).toEqual([11, 13, 15, 18, 24, 32]);
    expect(lib.SPACE_STEPS).toEqual([4, 8, 12, 16, 24, 32, 48, 64]);
```

- [ ] **Step 5: Run the react tests and watch them fail**

Run: `pnpm --filter @bit-ds/react test`

Expected: FAIL. Typical messages:
- `dataValue is not a function`
- `expected 'bit-stack' to have attribute data-gap="12"`, received `"3"`
- Text `className` is `"bit-text bit-md"`

- [ ] **Step 6: Add `dataValue` to `toClasses.ts`**

In `packages/react/src/system/toClasses.ts`, replace the `warnUnknown` function with:

```ts
function warnUnknown(blockName: string, axis: DataAxis): void {
  if (process.env.NODE_ENV === 'production') return;
  console.warn(
    `[bit] ${block(blockName)} received ${axis.name}="${axis.value}" but only ` +
      `${axis.allowed.join(' | ')} are allowed. The value was dropped.`,
  );
}

/** A non-axis enum rendered as a `data-*` attribute: its prop name, allowed values, and the value passed. */
export interface DataAxis {
  name: string;
  allowed: readonly (string | number)[];
  value: string | number | undefined;
}

/**
 * The attribute value for a non-axis enum (Stack `gap`, Text `size`, Badge `shape`). Returns
 * undefined, so React omits the attribute, when no value is given or the value is not allowed.
 * An unknown value also warns in development, like `toClasses`. This is where untyped callers
 * still passing the old step numbers (`gap={3}`) or size names (`size="lg"`) are caught.
 */
export function dataValue(blockName: string, axis: DataAxis): string | undefined {
  if (axis.value === undefined) return undefined;
  if (!axis.allowed.includes(axis.value)) {
    warnUnknown(blockName, axis);
    return undefined;
  }
  return String(axis.value);
}
```

`Axis` (`allowed: readonly string[]`) is assignable to `DataAxis`, so `toClasses`' existing `warnUnknown(blockName, axis)` call still compiles.

- [ ] **Step 7: Rewrite `Stack.tsx`**

```tsx
import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { SPACE_STEPS } from '../../system/axes';
import type { SpaceStep } from '../../system/axes';
import { dataValue, toClasses } from '../../system/toClasses';
import { dropLegacyColor } from '../../system/dropLegacyColor';

export interface StackProps extends Omit<HTMLAttributes<HTMLDivElement>, 'color'> {
  /** Flex direction. Rendered as `data-direction`. */
  direction?: 'row' | 'column';
  /** Gap in px on the space scale (4, 8, 12, 16, 24, 32, 48, 64). Rendered as `data-gap`; reads `--bit-space-{gap}px`. */
  gap?: SpaceStep;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between';
  wrap?: boolean;
}

export const Stack = forwardRef<HTMLDivElement, StackProps>(function Stack(
  { direction = 'column', gap = 12, align, justify, wrap = false, className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={toClasses('stack', [], className)}
      data-direction={direction}
      data-gap={dataValue('stack', { name: 'gap', allowed: SPACE_STEPS, value: gap })}
      data-align={align}
      data-justify={justify}
      data-wrap={wrap ? '' : undefined}
      {...dropLegacyColor(rest)}
    />
  );
});
```

- [ ] **Step 8: Rewrite `Text.tsx`**

```tsx
import { createElement, forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { TEXT_SIZES } from '../../system/axes';
import type { TextSize } from '../../system/axes';
import { dataValue, toClasses } from '../../system/toClasses';

/** Only `neutral` (muted) is supported on Text in v1; see the plan note. */
const colors = ['neutral'] as const;

export type TextElement = 'p' | 'span' | 'div' | 'label' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export interface TextProps extends HTMLAttributes<HTMLElement> {
  /** Which element to render. Styling comes from `size`, not from the tag. */
  as?: TextElement;
  /** Size in px (11, 13, 15, 18, 24, 32). Rendered as `data-size`; reads `--bit-text-{size}px`. 24 and 32 use the display face. */
  size?: TextSize;
  /** `neutral` renders muted text. */
  color?: (typeof colors)[number];
  /**
   * Rendered as `data-weight`. Has no visible effect at 24 and 32: those sizes use the
   * display face, which ships a single weight, so a heavier value would be browser-synthesized.
   */
  weight?: 'normal' | 'bold';
}

export const Text = forwardRef<HTMLElement, TextProps>(function Text(
  { as = 'p', size = 15, color, weight = 'normal', className, ...rest },
  ref,
) {
  return createElement(as, {
    ref,
    className: toClasses('text', [{ name: 'color', allowed: colors, value: color }], className),
    'data-size': dataValue('text', { name: 'size', allowed: TEXT_SIZES, value: size }),
    'data-weight': weight,
    ...rest,
  });
});
```

- [ ] **Step 9: Update the two stories so they type-check**

`Stack.stories.tsx`:
- `args: { direction: 'column', gap: 3, wrap: false }` → `args: { direction: 'column', gap: 12, wrap: false }`
- `args: { direction: 'row', gap: 2, align: 'center' }` → `args: { direction: 'row', gap: 8, align: 'center' }`

`Text.stories.tsx`:
- `size: 'md'` → `size: 15`
- `{size}: Press Start` → `{size}px: Press Start`
- `args: { as: 'h1', size: '2xl', children: 'Press Start' }` → `args: { as: 'h1', size: 32, children: 'Press Start' }`

- [ ] **Step 10: Run the react gate**

```bash
pnpm --filter @bit-ds/react test && pnpm --filter @bit-ds/react typecheck \
  && pnpm build && pnpm verify && pnpm storybook:build
```

Expected: all PASS; react coverage still ≥ 80% (`pnpm test:coverage`).

- [ ] **Step 11: Commit**

```bash
git add packages/react
git commit -m "$(cat <<'EOF'
feat(react): Stack gap and Text size take px numbers

gap={16} reads --bit-space-16px and size={18} reads --bit-text-18px, rendered as
data-gap / data-size. Defaults keep their px (gap 12, size 15). A new
dataValue() drops off-scale values from untyped callers with a dev warning,
so an old gap={3} or size="lg" never renders a wrong size.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Migrate the gallery and docs call sites to px (T2 gallery, E4, OV6)

**Files:**
- Modify:
  - `apps/gallery/src/manifests/stack.ts` and `apps/gallery/src/manifests/text.ts`
  - `apps/gallery/src/pages/{HomePage,NotFoundPage,TokensPage}.tsx`
  - `apps/gallery/src/shell/Sidebar.tsx`
  - `apps/gallery/src/engine/{ControlsPanel,Presets,Matrix}.tsx`
  - `apps/gallery/src/gallery.css` and `apps/docs/stories/Tokens.stories.tsx`, through the rename script
- Create: `apps/gallery/src/gallery-css.test.ts`
- Test:
  - `apps/gallery/src/manifests/manifests.test.ts`
  - `apps/gallery/src/code/toJsx.test.ts`
  - `apps/gallery/src/engine/{buildProps,state}.test.ts`

**Interfaces:**
- Consumes: Task 3's `gap: SpaceStep` and `size: TextSize`.
- Produces:
  - Stack manifest: `gap` select over `SPACE_STEPS.map(String)`, default `'12'`.
  - Text manifest: `size` select over `TEXT_SIZES.map(String)`, default `'15'`, `numeric: true`. It is no longer an `axis` control.

- [ ] **Step 1: Write the migration and preset contract tests**

In `apps/gallery/src/manifests/manifests.test.ts`:

Add imports:

```ts
import { defaultState, parseState, serializeState } from '../engine/state';
import { stack } from './stack';
import { text } from './text';
```

Replace the size line in `axis values are the library constants`:

```ts
        if (c.prop === 'size') expect([...c.values].every((v) => ([...lib.SIZES, ...lib.TEXT_SIZES] as readonly string[]).includes(v))).toBe(true);
```

with

```ts
        if (c.prop === 'size') expect([...c.values].every((v) => (lib.SIZES as readonly string[]).includes(v))).toBe(true);
```

Append inside `describe('manifest contract', …)`:

```ts
  it('Stack gap and Text size are px numbers, migrated through the D13 table (OV6)', () => {
    expect(stack.controls.find((c) => c.prop === 'gap')).toMatchObject({
      kind: 'select',
      numeric: true,
      default: '12',
      values: ['4', '8', '12', '16', '24', '32', '48', '64'],
    });
    expect(stack.presets?.find((p) => p.label === 'Row, centered')?.state.gap).toBe('16');
    expect(text.controls.find((c) => c.prop === 'size')).toMatchObject({
      kind: 'select',
      numeric: true,
      default: '15',
      values: ['11', '13', '15', '18', '24', '32'],
    });
    expect(text.presets?.map((p) => p.state.size)).toEqual(['32', '13']);
  });

  it('every preset sets only real controls, to values those controls accept (§H.3)', () => {
    for (const m of MANIFESTS) {
      for (const preset of m.presets ?? []) {
        const expected = { ...defaultState(m), ...preset.state };
        expect(parseState(m, serializeState(m, expected)), `${m.name} / ${preset.label}`).toEqual(expected);
      }
    }
  });
```

The round trip catches both an unknown key (`serializeState` drops it) and an invalid value (`parseState` drops it).

- [ ] **Step 2: Migrate the engine test fixtures**

- `src/code/toJsx.test.ts`, case `numeric selects use braces and sentinels are omitted`: state `{ direction: 'row', gap: '5' }` → `{ direction: 'row', gap: '24' }`, and in the expected string `gap={5}` → `gap={24}`.
- `src/engine/buildProps.test.ts`: `gap: '6' }).gap).toBe(6);` → `gap: '32' }).gap).toBe(32);`.
- `src/engine/state.test.ts`, `round-trips through parseState`: `gap: '5'` → `gap: '24'`.

- [ ] **Step 3: Write the gallery token test**

Create `apps/gallery/src/gallery-css.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, it, expect } from 'vitest';

const require = createRequire(import.meta.url);
/** The theme exactly as consumers get it, through @bit-ds/react's exports map (run `pnpm build` first). */
const theme = readFileSync(require.resolve('@bit-ds/react/themes/power-up.css'), 'utf8');
const galleryCss = readFileSync(new URL('./gallery.css', import.meta.url), 'utf8');

const declared = new Set([...theme.matchAll(/(--bit-[a-zA-Z0-9-]+)\s*:/g)].map((m) => m[1]!));
const reads = [...galleryCss.matchAll(/var\((--bit-[a-zA-Z0-9-]+)/g)].map((m) => m[1]!);

describe('gallery.css', () => {
  it('reads only tokens the theme declares (a browser would silently ignore a renamed one)', () => {
    expect(reads.filter((name) => !declared.has(name))).toEqual([]);
  });

  it('never reads tier-1 palette values', () => {
    expect(reads.filter((name) => name.startsWith('--bit-palette-'))).toEqual([]);
  });
});
```

- [ ] **Step 4: Run the gallery tests and watch them fail**

```bash
pnpm build && pnpm --filter @bit-ds/gallery test
```

Expected: FAIL:
- `gallery-css.test.ts` lists `--bit-space-4`, `--bit-space-2`, …
- the manifest migration test (`default: '3'`)
- the preset round trip for Stack (`gap: '4'` is still valid) and Text (`size: '2xl'` is dropped)
- `toJsx`, `buildProps` and `state` fixtures

- [ ] **Step 5: Migrate the manifests**

`apps/gallery/src/manifests/stack.ts`:
- `description: 'Flex layout on the 4px space scale. Every prop is a data attribute, never a class.'` → `description: 'Flex layout. gap is a px value on the space scale. Every prop is a data attribute, never a class.'`
- `{ kind: 'select', prop: 'gap', values: SPACE_STEPS.map(String), default: '3', numeric: true },` → `default: '12'`
- `{ label: 'Row, centered', state: { direction: 'row', align: 'center', gap: '4' } },` → `gap: '16'`

`apps/gallery/src/manifests/text.ts`:
- `description: 'Typography. The element comes from \`as\`; the look comes from \`size\`.',` → `description: 'Typography. The element comes from \`as\`; the look comes from \`size\`, in px.',`
- `{ kind: 'axis', prop: 'size', values: TEXT_SIZES, default: 'md' },` → `{ kind: 'select', prop: 'size', values: TEXT_SIZES.map(String), default: '15', numeric: true },`
- `{ label: 'Display heading', state: { as: 'h2', size: '2xl' } },` → `size: '32'`
- `{ label: 'Muted caption', state: { size: 'sm', color: 'neutral' } },` → `size: '13'`

- [ ] **Step 6: Migrate every call site through the D13 table**

Old step to px: gap 2→8, 3→12, 4→16, 6→32. Old size to px: xs→11, lg→18, 2xl→32.

| File | Old | New |
|---|---|---|
| `pages/HomePage.tsx` | `<Stack gap={6}>` | `<Stack gap={32}>` |
| `pages/HomePage.tsx` | `<Stack gap={3}>` | `<Stack gap={12}>` |
| `pages/HomePage.tsx` | `<Stack gap={2}>` | `<Stack gap={8}>` |
| `pages/HomePage.tsx` | `<Text as="h1" size="2xl">` | `<Text as="h1" size={32}>` |
| `pages/HomePage.tsx` | `<Text size="lg">` | `<Text size={18}>` |
| `pages/NotFoundPage.tsx` | `<Stack gap={4}>` | `<Stack gap={16}>` |
| `pages/NotFoundPage.tsx` | `<Text as="h1" size="2xl">` | `<Text as="h1" size={32}>` |
| `pages/TokensPage.tsx` | `<Text as="h1" size="2xl">` | `<Text as="h1" size={32}>` |
| `shell/Sidebar.tsx` | `<Text as="h2" size="xs" className="gallery-sidebar__title">` | `<Text as="h2" size={11} className="gallery-sidebar__title">` |
| `engine/ControlsPanel.tsx` | `<Text as="h2" size="lg" id="controls-heading">` | `<Text as="h2" size={18} id="controls-heading">` |
| `engine/Presets.tsx` | `<Text as="h2" size="lg" id="presets-heading">` | `<Text as="h2" size={18} id="presets-heading">` |
| `engine/Matrix.tsx` | `<Text as="h2" size="lg" id="matrix-heading">` | `<Text as="h2" size={18} id="matrix-heading">` |

Then confirm nothing old is left:

```bash
grep -rnE 'gap=\{[0-9]\}|size="(xs|xl|2xl)"|<Text[^>]*size="(sm|md|lg)"' apps/gallery/src
```

Expected: no output.

- [ ] **Step 7: Rename the token reads in gallery.css and the docs story**

This is the same one-off script as Task 2, Step 8, repeated here so this task stands alone:

```bash
node -e '
const fs = require("node:fs");
const MAP = {
  "space-1": "space-4px", "space-2": "space-8px", "space-3": "space-12px", "space-4": "space-16px",
  "space-5": "space-24px", "space-6": "space-32px", "space-7": "space-48px", "space-8": "space-64px",
  "radius-sm": "radius-6px", "radius-md": "radius-10px", "radius-lg": "radius-14px",
  "text-xs": "text-11px", "text-sm": "text-13px", "text-md": "text-15px",
  "text-lg": "text-18px", "text-xl": "text-24px", "text-2xl": "text-32px",
};
const OLD = /var\(--bit-(space-[1-8]|radius-(?:sm|md|lg)|text-(?:xs|sm|md|lg|xl|2xl))\)/g;
for (const file of process.argv.slice(1)) {
  const before = fs.readFileSync(file, "utf8");
  const after = before.replace(OLD, (_m, name) => `var(--bit-${MAP[name]})`);
  if (after !== before) { fs.writeFileSync(file, after); console.log("renamed in", file); }
}' apps/gallery/src/gallery.css apps/docs/stories/Tokens.stories.tsx
```

Expected: `renamed in` both files. Then check none remain:

```bash
grep -rnE -- '--bit-(space-[0-9]\b|radius-(sm|md|lg)\b|text-(xs|sm|md|lg|xl|2xl)\b)' apps packages/core/src packages/react/src --include='*.css' --include='*.ts' --include='*.tsx'
```

Expected: no output. With ugrep (the local `grep`), drop the `--include` flags if it warns.

- [ ] **Step 8: Run the whole repo gate**

```bash
pnpm build && pnpm verify && pnpm typecheck && pnpm lint \
  && pnpm --filter @bit-ds/core test && pnpm test:coverage && pnpm --filter @bit-ds/gallery test \
  && pnpm storybook:build
```

Expected: all PASS. The whole repo type-checks again.

- [ ] **Step 9: Commit**

```bash
git add apps
git commit -m "$(cat <<'EOF'
refactor(gallery): migrate gap and size call sites to px

Every Stack gap and Text size call site, the Stack and Text manifests and the
token reads in gallery.css move through the D13 table (gap 4 → 16, size "2xl" →
32, …). A new test fails if gallery.css reads a token the shipped theme does
not declare, and the contract test now checks every preset round-trips through
the URL state unchanged.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Power-up palette, code, mono, selection and logo tokens (T3)

**Files:**
- Modify:
  - `packages/core/src/themes/power-up.css` (full rewrite)
  - `packages/core/src/tokens.ts` (add `CODE_KINDS`, code, logo, mono and selection tokens)
  - `packages/core/src/system/reset.css` (browser surfaces)
  - `packages/core/src/components/logo.css` (16 and 64 eras)
- Test: `packages/core/src/__tests__/{tokens,contrast,system}.test.ts`

**Interfaces:**
- Consumes: Task 2's `tokens.ts`.
- Produces:
  - `export const CODE_KINDS = ['text', 'keyword', 'string', 'tag', 'component', 'attr', 'punct', 'comment', 'number', 'prop'] as const` (PR2's CodeBlock tokenizer maps onto these).
  - Tokens `--bit-code-bg` and `--bit-code-{kind}`, `--bit-font-mono`, `--bit-color-selection`, and `--bit-logo-coin`, `-coin-light`, `-coin-shade`, `-coin-deep`. `SEMANTIC_TOKENS` grows from 67 to **84**.

- [ ] **Step 1: Write the failing token, contrast and surface tests**

`tokens.test.ts`:
- Change the import to `import { SEMANTIC_TOKENS, COLORS, SIZES, SPACE_STEPS, TEXT_SIZES, CODE_KINDS } from '../tokens';`.
- Change `contains exactly 67 unique names` to 84 in the title and in both assertions (`toHaveLength(84)`, `.size).toBe(84)`).
- Append:

```ts
  it('includes the code, mono, selection, and logo tokens (amendments §C)', () => {
    expect(CODE_KINDS).toEqual(['text', 'keyword', 'string', 'tag', 'component', 'attr', 'punct', 'comment', 'number', 'prop']);
    const expected = [
      '--bit-code-bg',
      ...CODE_KINDS.map((kind) => `--bit-code-${kind}`),
      '--bit-font-mono',
      '--bit-color-selection',
      '--bit-logo-coin', '--bit-logo-coin-light', '--bit-logo-coin-shade', '--bit-logo-coin-deep',
    ];
    for (const name of expected) expect(SEMANTIC_TOKENS).toContain(name);
  });
```

`contrast.test.ts`:
- Change the import to `import { CODE_KINDS, COLORS } from '../tokens';`.
- Add `const CODE_MIN = 5.6;` under `AA_NON_TEXT`.
- Append inside the `describe.each`:

```ts
  it.each(CODE_KINDS)('code %s is at least 5.6:1 on the code background (Ink night)', (kind) => {
    expect(contrastRatio(resolveColor(`--bit-code-${kind}`), resolveColor('--bit-code-bg'))).toBeGreaterThanOrEqual(CODE_MIN);
  });

  it('selected text (ink on the selection color) is readable', () => {
    expect(contrastRatio(resolveColor('--bit-color-ink'), resolveColor('--bit-color-selection'))).toBeGreaterThanOrEqual(AA_TEXT);
  });
```

`system.test.ts`, append:

```ts
describe('system/reset.css browser surfaces (amendments §C)', () => {
  const css = readCss('system/reset.css');

  it('selection is the selection color with ink text', () => {
    const body = block(css, '::selection');
    expect(body).toContain('background: var(--bit-color-selection);');
    expect(body).toContain('color: var(--bit-color-ink);');
  });

  it('the caret is primary and scrollbars are an ink thumb on a neutral-soft track', () => {
    const root = block(css, ':root');
    expect(root).toContain('caret-color: var(--bit-color-primary);');
    expect(root).toContain('scrollbar-color: var(--bit-color-ink) var(--bit-color-neutral-soft);');
    expect(block(css, '*')).toContain('scrollbar-width: thin;');
  });
});

describe('components/logo.css', () => {
  const css = readCss('components/logo.css');

  it('the eras read the logo coin tokens, never primary or warning, so the palette swap leaves the logo gold', () => {
    expect(css).not.toMatch(/--bit-color-(primary|warning)/);
    for (const name of ['--bit-logo-coin', '--bit-logo-coin-light', '--bit-logo-coin-shade', '--bit-logo-coin-deep']) {
      expect(css).toContain(`var(${name})`);
    }
  });
});
```

- [ ] **Step 2: Run and watch them fail**

Run: `pnpm --filter @bit-ds/core test`

Expected: FAIL:
- `CODE_KINDS` is undefined
- length 67 ≠ 84
- `Token --bit-code-text is not declared`
- `block(css, '::selection')` is null
- logo.css still reads `--bit-color-primary`

- [ ] **Step 3: Extend `tokens.ts`**

In `packages/core/src/tokens.ts`:

Add after the `RADII` line:

```ts
/** Syntax-color kinds for code. CodeBlock's tokenizer (PR2) emits these; each reads `--bit-code-{kind}`. */
export const CODE_KINDS = ['text', 'keyword', 'string', 'tag', 'component', 'attr', 'punct', 'comment', 'number', 'prop'] as const;
```

Replace

```ts
const colorRoleTokens = ['bg', 'surface', 'ink', 'text', 'text-muted', 'focus'].map((role) => token('color', role));
```

with

```ts
const colorRoleTokens = ['bg', 'surface', 'ink', 'text', 'text-muted', 'focus', 'selection'].map((role) =>
  token('color', role),
);
```

Replace `...['display', 'body', 'pixel'].map((f) => token('font', f)),` with `...['display', 'body', 'pixel', 'mono'].map((f) => token('font', f)),`.

Add before the `SEMANTIC_TOKENS` doc comment:

```ts
const codeTokens = [token('code', 'bg'), ...CODE_KINDS.map((kind) => token('code', kind))];

/** The BitLogo's coin golds. Fixed brand colors, so a palette change never recolors the logo. */
const logoTokens = ['coin', 'coin-light', 'coin-shade', 'coin-deep'].map((part) => token('logo', part));
```

Append `...codeTokens,` and `...logoTokens,` to the end of the `SEMANTIC_TOKENS` array.

- [ ] **Step 4: Rewrite `power-up.css`**

Replace `packages/core/src/themes/power-up.css` with:

```css
/* bit theme: power-up
   Late-90s platformer chunkiness on a cool paper page: violet primary, coin-yellow warning.
   Tier 1 (palette) is private to this file. Tier 2 (semantic) is the public API
   and must list every name in tokens.ts — the theme-completeness test enforces it. */

@import url("https://fonts.googleapis.com/css2?family=Lilita+One&family=Nunito:wght@600;700;800&family=Press+Start+2P&family=Bungee&family=JetBrains+Mono:wght@400;700&display=swap");

:root,
[data-theme="power-up"] {
  /* ---------- tier 1: palette ---------- */
  --bit-palette-violet: #7C3AED;
  --bit-palette-violet-dark: #6527D4;
  --bit-palette-violet-soft: #EBE1FD;
  --bit-palette-yellow: #FFC800;
  --bit-palette-yellow-dark: #F0B400;
  --bit-palette-yellow-soft: #FFF1B8;
  --bit-palette-green: #1FA34A;
  /* The review approved #178C3E, but ink on it is 4.22:1 (under AA). #19943F is the closest darker shade that passes (4.65:1). */
  --bit-palette-green-dark: #19943F;
  --bit-palette-green-soft: #D3F1DD;
  --bit-palette-red: #D91A1A;
  --bit-palette-red-dark: #B81414;
  --bit-palette-red-soft: #FBD5D5;
  --bit-palette-blue: #1D5BFF;
  --bit-palette-ink: #151515;
  --bit-palette-stone: #DCDED6;
  --bit-palette-stone-light: #E5E7E0;
  --bit-palette-slate: #4A4A5E;
  --bit-palette-paper: #EEEFE9;
  --bit-palette-white: #FFFFFF;
  --bit-palette-coin: #FFCC00;
  --bit-palette-coin-light: #FFF3BF;
  --bit-palette-coin-shade: #E0B000;
  --bit-palette-coin-deep: #F5A623;

  /* ---------- tier 2: color ---------- */
  --bit-color-bg: var(--bit-palette-paper);
  --bit-color-surface: var(--bit-palette-white);
  --bit-color-ink: var(--bit-palette-ink);
  --bit-color-text: var(--bit-palette-ink);
  --bit-color-text-muted: var(--bit-palette-slate);
  --bit-color-focus: var(--bit-palette-blue);
  --bit-color-selection: var(--bit-palette-yellow);

  --bit-color-primary: var(--bit-palette-violet);
  --bit-color-primary-contrast: var(--bit-palette-white);
  --bit-color-primary-hover: var(--bit-palette-violet-dark);
  --bit-color-primary-soft: var(--bit-palette-violet-soft);

  --bit-color-neutral: var(--bit-palette-white);
  --bit-color-neutral-contrast: var(--bit-palette-ink);
  --bit-color-neutral-hover: var(--bit-palette-stone-light);
  --bit-color-neutral-soft: var(--bit-palette-stone);

  --bit-color-success: var(--bit-palette-green);
  --bit-color-success-contrast: var(--bit-palette-ink);
  --bit-color-success-hover: var(--bit-palette-green-dark);
  --bit-color-success-soft: var(--bit-palette-green-soft);

  --bit-color-warning: var(--bit-palette-yellow);
  --bit-color-warning-contrast: var(--bit-palette-ink);
  --bit-color-warning-hover: var(--bit-palette-yellow-dark);
  --bit-color-warning-soft: var(--bit-palette-yellow-soft);

  --bit-color-danger: var(--bit-palette-red);
  --bit-color-danger-contrast: var(--bit-palette-white);
  --bit-color-danger-hover: var(--bit-palette-red-dark);
  --bit-color-danger-soft: var(--bit-palette-red-soft);

  /* ---------- tier 2: shape (where the retro look lives) ---------- */
  --bit-border-width: 3px;
  --bit-radius-6px: 6px;
  --bit-radius-10px: 10px;
  --bit-radius-14px: 14px;
  --bit-radius-full: 999px;
  --bit-shadow-sm: 2px 2px 0 var(--bit-color-ink);
  --bit-shadow-md: 4px 4px 0 var(--bit-color-ink);
  --bit-shadow-lg: 6px 6px 0 var(--bit-color-ink);
  --bit-shadow-inset: inset 3px 3px 0 rgba(21, 21, 21, 0.12);
  --bit-gloss: inset 0 3px 0 rgba(255, 255, 255, 0.4);

  /* ---------- tier 2: typography ---------- */
  --bit-font-display: "Lilita One", "Arial Black", sans-serif;
  --bit-font-body: "Nunito", "Segoe UI", sans-serif;
  --bit-font-pixel: "Press Start 2P", monospace;
  --bit-font-mono: "JetBrains Mono", ui-monospace, monospace;
  --bit-text-11px: 11px;
  --bit-text-13px: 13px;
  --bit-text-15px: 15px;
  --bit-text-18px: 18px;
  --bit-text-24px: 24px;
  --bit-text-32px: 32px;
  --bit-leading-tight: 1.1;
  --bit-leading-normal: 1.5;
  --bit-weight-normal: 600;
  --bit-weight-bold: 800;

  /* ---------- tier 2: space ---------- */
  --bit-space-4px: 4px;
  --bit-space-8px: 8px;
  --bit-space-12px: 12px;
  --bit-space-16px: 16px;
  --bit-space-24px: 24px;
  --bit-space-32px: 32px;
  --bit-space-48px: 48px;
  --bit-space-64px: 64px;

  /* ---------- tier 2: controls ---------- */
  --bit-control-height-sm: 32px;
  --bit-control-height-md: 40px;
  --bit-control-height-lg: 48px;
  --bit-control-padding-sm: 10px;
  --bit-control-padding-md: 14px;
  --bit-control-padding-lg: 18px;

  /* ---------- tier 2: motion ---------- */
  --bit-press-offset: 2px;
  --bit-duration-fast: 80ms;
  --bit-duration-normal: 160ms;
  --bit-motion-power-up: bit-power-up;

  /* ---------- tier 2: code ("Ink night": every color is at least 5.6:1 on --bit-code-bg) ---------- */
  --bit-code-bg: var(--bit-palette-ink);
  --bit-code-text: #EDEBE4;
  --bit-code-keyword: #C4A7FF;
  --bit-code-string: #7EE2A0;
  --bit-code-tag: #7CC7FF;
  --bit-code-component: #FFD54A;
  --bit-code-attr: #FFB86B;
  --bit-code-punct: #A3A3AE;
  --bit-code-comment: #8E8E9A;
  --bit-code-number: #FF9F7A;
  --bit-code-prop: #FF8FCB;

  /* ---------- tier 2: logo (fixed coin golds; never primary or warning) ---------- */
  --bit-logo-coin: var(--bit-palette-coin);
  --bit-logo-coin-light: var(--bit-palette-coin-light);
  --bit-logo-coin-shade: var(--bit-palette-coin-shade);
  --bit-logo-coin-deep: var(--bit-palette-coin-deep);
}
```

- [ ] **Step 5: Add the browser surfaces to `reset.css`**

In `packages/core/src/system/reset.css`, add after the `*, *::before, *::after` rule:

```css
:root {
  caret-color: var(--bit-color-primary);
  scrollbar-color: var(--bit-color-ink) var(--bit-color-neutral-soft);
}

/* scrollbar-width does not inherit, so every scroll container needs it. */
* {
  scrollbar-width: thin;
}

::selection {
  background: var(--bit-color-selection);
  color: var(--bit-color-ink);
}
```

- [ ] **Step 6: Point the logo's 16 and 64 eras at the coin tokens**

In `packages/core/src/components/logo.css`, replace

```css
  background: linear-gradient(
    180deg,
    var(--bit-color-primary-soft) 0 34%,
    var(--bit-color-primary) 34% 67%,
    var(--bit-color-warning) 67% 100%
  );
```

with

```css
  background: linear-gradient(
    180deg,
    var(--bit-logo-coin-light) 0 34%,
    var(--bit-logo-coin) 34% 67%,
    var(--bit-logo-coin-deep) 67% 100%
  );
```

Then replace

```css
  color: var(--bit-color-primary);
  -webkit-text-stroke: 1.5px var(--bit-color-ink);
  paint-order: stroke fill;
  text-shadow:
    1px 1px 0 var(--bit-color-primary-hover),
    2px 2px 0 var(--bit-color-primary-hover),
    3px 3px 0 var(--bit-color-primary-hover),
    4px 4px 0 var(--bit-color-primary-hover),
```

with

```css
  color: var(--bit-logo-coin);
  -webkit-text-stroke: 1.5px var(--bit-color-ink);
  paint-order: stroke fill;
  text-shadow:
    1px 1px 0 var(--bit-logo-coin-shade),
    2px 2px 0 var(--bit-logo-coin-shade),
    3px 3px 0 var(--bit-logo-coin-shade),
    4px 4px 0 var(--bit-logo-coin-shade),
```

The colors are the same values the logo had before (`#FFF3BF`, `#FFCC00`, `#F5A623`, `#E0B000`), so the logo doesn't change.

- [ ] **Step 7: Run the core tests and the build**

```bash
pnpm --filter @bit-ds/core test && pnpm build && pnpm verify && pnpm --filter @bit-ds/gallery test
```

Expected: all PASS. Contrast covers 5 colors × fill and hover, soft, text/muted, focus, the code kinds and selection.

- [ ] **Step 8: Commit**

```bash
git add packages/core
git commit -m "$(cat <<'EOF'
feat(core): violet and yellow palette, Ink-night code, mono, logo tokens

Primary is violet #7C3AED and warning is yellow #FFC800; every pair passes AA.
Success hover is #19943F instead of the approved #178C3E, which was 4.22:1.
Adds --bit-code-* (each at least 5.6:1), --bit-font-mono (JetBrains Mono),
--bit-color-selection, thin ink scrollbars, a primary caret, and coin-gold logo
tokens so the palette swap leaves the logo unchanged.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Focus ring as an ink outline plus a yellow band (D9, E3, OV5, E7 reset)

**Files:**
- Modify:
  - `packages/core/src/system/reset.css` (focus rules)
  - `packages/core/src/components/button.css` (focus band)
  - `packages/core/src/themes/power-up.css` (remove `--bit-palette-blue` and `--bit-color-focus`; add `--bit-focus-band`)
  - `packages/core/src/tokens.ts` (drop the `focus` color role; add `focus-band`)
- Test: `packages/core/src/__tests__/{system,contrast,tokens}.test.ts`

**Interfaces:**
- Consumes: Task 5's theme and tokens.
- Produces:
  - Token `--bit-focus-band: 0 0 0 3px var(--bit-color-warning)`. `--bit-color-focus` is gone, and the count stays 84.
  - The pattern every interactive component follows (PR2 adds Link, Input, Select, Switch, SegmentedControl and CodeBlock's copy button):
    - the block resets `--_bit-focus-band: 0 0 #0000`
    - every `box-shadow` starts with `var(--_bit-focus-band)`
    - `:focus-visible` sets `--_bit-focus-band: var(--bit-focus-band)`
    - the test list `INTERACTIVE` in `system.test.ts` names the files that must follow it

- [ ] **Step 1: Write the failing focus tests**

`system.test.ts`, append:

```ts
describe('focus ring (D9)', () => {
  const reset = readCss('system/reset.css');

  it('reset.css draws a 3px ink outline at a 3px offset on :focus-visible', () => {
    const body = block(reset, ':focus-visible');
    expect(body).toContain('outline: 3px solid var(--bit-color-ink);');
    expect(body).toContain('outline-offset: 3px;');
  });

  it('programmatic focus targets (tabindex="-1", e.g. a page heading) show no ring', () => {
    expect(block(reset, '[tabindex="-1"]:focus')).toContain('outline: none;');
  });

  it.each(listCss('components'))('%s never sets outline, so nothing can override the ink ring', (file) => {
    expect(readCss(`components/${file}`)).not.toMatch(/\boutline\s*:/);
  });

  /** Interactive components carry the yellow band. PR2 adds link, input, select, switch, segmented-control, code. */
  const INTERACTIVE = ['button.css'] as const;

  describe.each(INTERACTIVE)('%s', (file) => {
    const css = readCss(`components/${file}`);
    const blockName = file.replace(/\.css$/, '');

    it('every box-shadow starts with the band, so no variant, hover, or active state can drop it', () => {
      const shadows = [...css.matchAll(/box-shadow:\s*([^;]+);/g)].map((m) => m[1]!.trim());
      expect(shadows.length).toBeGreaterThan(0);
      for (const shadow of shadows) expect(shadow.startsWith('var(--_bit-focus-band)')).toBe(true);
    });

    it('the block resets the band, so a focused ancestor cannot leak it into this component', () => {
      expect(block(css, `.bit-${blockName}`)).toContain('--_bit-focus-band: 0 0 #0000;');
    });

    it(':focus-visible turns the band on from the theme token', () => {
      expect(block(css, `.bit-${blockName}:focus-visible`)).toContain('--_bit-focus-band: var(--bit-focus-band);');
    });
  });
});
```

`contrast.test.ts`: replace the whole `it('focus ring is visible against the page', …)` with:

```ts
  it('focus: the ink outline stands out from the page, surfaces, and every color fill', () => {
    const ink = resolveColor('--bit-color-ink');
    for (const bg of ['--bit-color-bg', '--bit-color-surface', ...COLORS.map((c) => `--bit-color-${c}`)]) {
      expect(contrastRatio(ink, resolveColor(bg)), bg).toBeGreaterThanOrEqual(AA_NON_TEXT);
    }
  });

  it('focus: the band is 3px of warning yellow, which stands out from the ink ring around it', () => {
    expect(map.get('--bit-focus-band')).toBe('0 0 0 3px var(--bit-color-warning)');
    expect(contrastRatio(resolveColor('--bit-color-warning'), resolveColor('--bit-color-ink'))).toBeGreaterThanOrEqual(AA_NON_TEXT);
  });
```

`tokens.test.ts`: in the shape/type/space `expected` list, replace `'--bit-color-focus',` with `'--bit-focus-band',`. Then append:

```ts
  it('has no --bit-color-focus (D9 draws the ring in ink)', () => {
    expect(SEMANTIC_TOKENS).not.toContain('--bit-color-focus');
  });
```

- [ ] **Step 2: Run and watch them fail**

Run: `pnpm --filter @bit-ds/core test`

Expected: FAIL:
- `outline: 3px solid var(--bit-color-ink);` is missing
- `block(reset, '[tabindex="-1"]:focus')` is null
- button shadows start with `var(--bit-shadow-md)`
- `--bit-focus-band` is undefined
- `--bit-color-focus` is still listed

- [ ] **Step 3: Swap the focus tokens**

`tokens.ts`:
- `['bg', 'surface', 'ink', 'text', 'text-muted', 'focus', 'selection']` → `['bg', 'surface', 'ink', 'text', 'text-muted', 'selection']`
- Add `const focusTokens = [token('focus', 'band')];` above `codeTokens`.
- Add `...focusTokens,` to `SEMANTIC_TOKENS` after `...motionTokens,`.

`power-up.css`:
- Delete the lines `  --bit-palette-blue: #1D5BFF;` and `  --bit-color-focus: var(--bit-palette-blue);`.
- Add after the motion block:

```css
  /* ---------- tier 2: focus ---------- */
  /* The yellow band interactive components draw inside reset.css's ink outline (D9). */
  --bit-focus-band: 0 0 0 3px var(--bit-color-warning);
```

- [ ] **Step 4: Replace the focus rule in `reset.css`**

Replace

```css
:focus-visible {
  outline: 3px solid var(--bit-color-focus);
  outline-offset: 2px;
}
```

with

```css
/* Focus (D9): an ink outline on everything, which no component sets or overrides. Interactive
   components add a yellow band inside it through --_bit-focus-band (see button.css). */
:focus-visible {
  outline: 3px solid var(--bit-color-ink);
  outline-offset: 3px;
}

/* Programmatic focus targets (a page heading focused after navigation) show no ring.
   Real controls are never tabindex="-1", so they keep theirs. */
[tabindex="-1"]:focus {
  outline: none;
}
```

- [ ] **Step 5: Thread the band through every Button shadow**

In `packages/core/src/components/button.css`, make these changes in order:

1. In `.bit-button { … }`, add `--_bit-focus-band: 0 0 #0000;` as the first declaration, with this comment above it: `/* Reset here so a focused ancestor's band (custom properties inherit) can't leak in. */`. Then change `box-shadow: var(--bit-shadow-md);` to `box-shadow: var(--_bit-focus-band), var(--bit-shadow-md);`.
2. `.bit-button.bit-solid`: `box-shadow: var(--bit-gloss), var(--bit-shadow-md);` → `box-shadow: var(--_bit-focus-band), var(--bit-gloss), var(--bit-shadow-md);`
3. `.bit-button.bit-ghost`: `box-shadow: none;` → `box-shadow: var(--_bit-focus-band);`
4. Solid hover: `box-shadow: var(--bit-gloss), var(--bit-shadow-sm);` → `box-shadow: var(--_bit-focus-band), var(--bit-gloss), var(--bit-shadow-sm);`
5. Outline hover: `box-shadow: var(--bit-shadow-sm);` → `box-shadow: var(--_bit-focus-band), var(--bit-shadow-sm);`
6. Active (the four-selector rule): `box-shadow: none;` → `box-shadow: var(--_bit-focus-band);`
7. Add after the active rule:

```css
/* focus: the band is the first layer of every box-shadow above, so this only switches it on */
.bit-button:focus-visible {
  --_bit-focus-band: var(--bit-focus-band);
}
```

- [ ] **Step 6: Run the core tests, the build and the full gate**

```bash
pnpm --filter @bit-ds/core test && pnpm build && pnpm verify && pnpm test:coverage && pnpm --filter @bit-ds/gallery test
```

Expected: all PASS. The gallery's `gallery-css.test.ts` still passes: gallery.css never read `--bit-color-focus` (`grep -n color-focus apps/gallery/src/gallery.css` prints nothing).

- [ ] **Step 7: Check it in a real browser**

Run `pnpm gallery`, open http://localhost:5173 and press Tab until the header's GitHub button is focused.

Expected: a yellow band hugs the button and an ink ring sits 3px outside it. Hover keeps the band.

Stop the server.

- [ ] **Step 8: Commit**

```bash
git add packages/core
git commit -m "$(cat <<'EOF'
feat(core): ink focus outline with a yellow band (D9)

reset.css draws a 3px ink outline at a 3px offset that no component overrides;
Button adds a 3px warning-yellow band as the first layer of every box-shadow, so
hover, active and ghost keep it. The band is reset on the block so it can't
leak from a focused ancestor. tabindex="-1" targets show no ring.
--bit-color-focus is gone; contrast now checks ink against the page, surfaces
and every fill, and yellow against ink.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Badge `shape` (T5)

**Files:**
- Modify:
  - `packages/react/src/components/Badge/Badge.tsx` and `Badge.stories.tsx`
  - `packages/core/src/components/badge.css`
  - `apps/gallery/src/manifests/badge.ts`
- Test:
  - `packages/react/src/components/Badge/Badge.test.tsx`
  - `packages/core/src/__tests__/system.test.ts`
  - `apps/gallery/src/code/toJsx.test.ts`

**Interfaces:**
- Consumes: `dataValue` (Task 3) and `--bit-radius-6px` (Task 2).
- Produces: `BadgeProps.shape?: 'pill' | 'square'`, default `'pill'`, rendered as `data-shape`.

- [ ] **Step 1: Write the failing tests**

`Badge.test.tsx`:
- Change the vitest import to `import { afterEach, describe, expect, it, vi } from 'vitest';`.
- Add these tests inside the `describe`:

```tsx
  it('is a pill by default and square on request, as data-shape (not a class)', () => {
    render(<Badge data-testid="pill">A</Badge>);
    render(<Badge shape="square" data-testid="square">B</Badge>);
    expect(screen.getByTestId('pill')).toHaveAttribute('data-shape', 'pill');
    expect(screen.getByTestId('square')).toHaveAttribute('data-shape', 'square');
    expect(screen.getByTestId('square').className).toBe('bit-badge bit-neutral bit-solid bit-md');
  });

  describe('unknown shape', () => {
    afterEach(() => vi.restoreAllMocks());

    it('is dropped with a dev warning', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      // @ts-expect-error only pill and square exist
      render(<Badge shape="round" data-testid="b">C</Badge>);
      expect(screen.getByTestId('b')).not.toHaveAttribute('data-shape');
      expect(warn.mock.calls[0]?.[0]).toContain('shape="round"');
    });
  });
```

`system.test.ts`, append:

```ts
describe('components/badge.css', () => {
  const css = readCss('components/badge.css');
  it('a pill reads radius-full; data-shape="square" reads the 6px radius', () => {
    expect(block(css, '.bit-badge')).toContain('border-radius: var(--bit-radius-full);');
    expect(block(css, '.bit-badge[data-shape="square"]')).toContain('border-radius: var(--bit-radius-6px);');
  });
});
```

`toJsx.test.ts`:
- Add `import { badge } from '../manifests/badge';`.
- Add this case to the `it.each` table:

```ts
    [
      'a data-attribute enum prints like any select',
      badge,
      { shape: 'square' },
      `import { Badge } from '@bit-ds/react';\n\n<Badge shape="square">New</Badge>`,
    ],
```

- [ ] **Step 2: Run and watch them fail**

```bash
pnpm --filter @bit-ds/react test && pnpm --filter @bit-ds/core test
```

Expected: FAIL. `data-shape` is missing, and the badge.css square block is null.

- [ ] **Step 3: Implement**

`Badge.tsx`, full file:

```tsx
import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { COLORS } from '../../system/axes';
import type { Color } from '../../system/axes';
import { dataValue, toClasses } from '../../system/toClasses';

/** Badge supports a subset of the global axes. Add a value here and a rule in core/components/badge.css. */
const colors = COLORS;
const variants = ['solid', 'outline'] as const;
const sizes = ['sm', 'md'] as const;
/** Not a global axis, so it renders as a data attribute rather than a class. */
const shapes = ['pill', 'square'] as const;

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Color role. Class: `bit-{color}`. */
  color?: Color;
  variant?: (typeof variants)[number];
  size?: (typeof sizes)[number];
  /** `pill` is fully rounded; `square` uses the 6px radius. Rendered as `data-shape`. */
  shape?: (typeof shapes)[number];
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { color = 'neutral', variant = 'solid', size = 'md', shape = 'pill', className, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={toClasses(
        'badge',
        [
          { name: 'color', allowed: colors, value: color },
          { name: 'variant', allowed: variants, value: variant },
          { name: 'size', allowed: sizes, value: size },
        ],
        className,
      )}
      data-shape={dataValue('badge', { name: 'shape', allowed: shapes, value: shape })}
      {...rest}
    />
  );
});
```

`badge.css`, append:

```css
.bit-badge[data-shape="square"] {
  border-radius: var(--bit-radius-6px);
}
```

`Badge.stories.tsx`:
- `args: { children: 'New', color: 'neutral', variant: 'solid', size: 'md' }` → `args: { children: 'New', color: 'neutral', variant: 'solid', size: 'md', shape: 'pill' }`
- Add `shape: { control: 'radio', options: ['pill', 'square'] },` to `argTypes`.

`apps/gallery/src/manifests/badge.ts`:
- `description: 'A small label. Solid or outline, two sizes.'` → `description: 'A small label. Solid or outline, two sizes, pill or square.'`
- Add `{ kind: 'select', prop: 'shape', values: ['pill', 'square'], default: 'pill' },` after the size axis.
- Add `{ label: 'Square tag', state: { shape: 'square', variant: 'outline' } },` to `presets`.

- [ ] **Step 4: Run the gate**

```bash
pnpm --filter @bit-ds/core test && pnpm --filter @bit-ds/react test && pnpm build && pnpm verify \
  && pnpm --filter @bit-ds/gallery test && pnpm typecheck && pnpm storybook:build
```

Expected: all PASS, including the contract test's preset round trip for `Square tag`.

- [ ] **Step 5: Commit**

```bash
git add packages apps
git commit -m "$(cat <<'EOF'
feat(react): Badge shape, pill or square

shape="square" renders data-shape and reads --bit-radius-6px; the default pill
keeps --bit-radius-full. The gallery manifest gets the control and a preset.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: One shared sentinel rule for preview and code (D12, E5)

**Files:**
- Create: `apps/gallery/src/manifests/sentinels.ts` and `apps/gallery/src/manifests/sentinels.test.ts`
- Modify: `apps/gallery/src/engine/buildProps.ts` and `apps/gallery/src/code/toJsx.ts`

**Interfaces:**
- Produces: `export function isOmittedSentinel(control: Control, value: ControlValue): boolean`. It is true only for a `select` control whose value is `'default'` or `'none'`.

**Note:** reading the code on 2026-10-03, `toJsx.ts` already checks `OMIT_SENTINELS` only inside `case 'select'`, so the drift R8 described doesn't occur today. The agreement tests below are characterization tests; they pass before and after. The red step is the new module. The value is one rule in one place, as D12 approved.

- [ ] **Step 1: Write the tests**

Create `apps/gallery/src/manifests/sentinels.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { isOmittedSentinel } from './sentinels';
import type { Control } from './types';
import { buildProps } from '../engine/buildProps';
import { defaultState } from '../engine/state';
import { toJsx } from '../code/toJsx';
import { alert } from './alert';
import { bitLogo } from './bitLogo';

const select: Control = { kind: 'select', prop: 'freeze', values: ['none', '8'], default: 'none' };
const text: Control = { kind: 'text', prop: 'title', default: 'Heads up' };
const boolean: Control = { kind: 'boolean', prop: 'loading', default: false };

describe('isOmittedSentinel', () => {
  it.each(['default', 'none'])('a select value "%s" means leave the prop off', (value) => {
    expect(isOmittedSentinel(select, value)).toBe(true);
  });

  it('a real select value is kept', () => {
    expect(isOmittedSentinel(select, '8')).toBe(false);
  });

  it.each(['default', 'none'])('a text value "%s" is real text, not a sentinel', (value) => {
    expect(isOmittedSentinel(text, value)).toBe(false);
  });

  it('booleans are never sentinels', () => {
    expect(isOmittedSentinel(boolean, false)).toBe(false);
  });
});

describe('preview and code agree on sentinels (D12)', () => {
  it('a text value "none" reaches both the preview props and the React code', () => {
    const state = { ...defaultState(alert), title: 'none' };
    expect(buildProps(alert, state).title).toBe('none');
    expect(toJsx(alert, state)).toContain('title="none"');
  });

  it('a select sentinel is left off both', () => {
    const state = defaultState(bitLogo);
    expect('freeze' in buildProps(bitLogo, state)).toBe(false);
    expect(toJsx(bitLogo, state)).not.toContain('freeze');
  });
});
```

- [ ] **Step 2: Run and watch it fail**

Run: `pnpm --filter @bit-ds/gallery test -- sentinels`

Expected: FAIL with `Failed to resolve import "./sentinels"`.

- [ ] **Step 3: Implement and use the helper**

Create `apps/gallery/src/manifests/sentinels.ts`:

```ts
import type { Control, ControlValue } from './types';

/** Select values that mean "leave the prop off". */
const OMIT_SENTINELS = new Set(['default', 'none']);

/**
 * True when a control's value means "omit this prop". Only select controls have sentinels;
 * a text control's "none" is real text. The preview (buildProps) and the code (toJsx) both use
 * this, so they cannot disagree.
 */
export function isOmittedSentinel(control: Control, value: ControlValue): boolean {
  return control.kind === 'select' && typeof value === 'string' && OMIT_SENTINELS.has(value);
}
```

`apps/gallery/src/engine/buildProps.ts`:
- Delete the `OMIT_SENTINELS` constant and its comment.
- Add `import { isOmittedSentinel } from '../manifests/sentinels';`.
- Replace `if (control.kind === 'select' && typeof value === 'string' && OMIT_SENTINELS.has(value)) continue;` with `if (isOmittedSentinel(control, value)) continue;`.

`apps/gallery/src/code/toJsx.ts`:
- Delete `const OMIT_SENTINELS = new Set(['default', 'none']);`.
- Add `import { isOmittedSentinel } from '../manifests/sentinels';`.
- In `case 'select':`, replace `if (isDefault || (typeof value === 'string' && OMIT_SENTINELS.has(value))) return null;` with `if (isDefault || isOmittedSentinel(control, value)) return null;`.

- [ ] **Step 4: Run the gallery gate**

```bash
pnpm --filter @bit-ds/gallery test && pnpm --filter @bit-ds/gallery typecheck && pnpm lint
```

Expected: all PASS; `grep -rn OMIT_SENTINELS apps/gallery/src` prints only `sentinels.ts`.

- [ ] **Step 5: Commit**

```bash
git add apps/gallery
git commit -m "$(cat <<'EOF'
refactor(gallery): one shared sentinel rule for preview and code (D12)

isOmittedSentinel() replaces the two OMIT_SENTINELS copies in buildProps and
toJsx. Tests pin that a text value "none" reaches both the preview and the
code, and a select sentinel is left off both.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Manifest schema: `group`, optional `docs`, HTML ChildSpec (§H.3)

**Files:**
- Modify:
  - `apps/gallery/src/manifests/types.ts`
  - `apps/gallery/src/manifests/registry.ts` (add `isHtmlElement`)
  - `apps/gallery/src/manifests/index.ts` (`routeFor`, type exports)
  - every manifest file (`group` value)
  - `apps/gallery/src/engine/renderManifest.tsx` and `apps/gallery/src/code/toJsx.ts`
  - `apps/gallery/src/shell/Sidebar.tsx`
- Create: `apps/gallery/src/shell/Sidebar.test.tsx`
- Test:
  - `apps/gallery/src/manifests/manifests.test.ts`
  - `apps/gallery/src/engine/renderManifest.test.tsx`
  - `apps/gallery/src/code/toJsx.test.ts`

**Interfaces:**
- Produces, for PR2's manifests and PR3's page:
  - `export type ManifestGroup = 'components' | 'forms' | 'brand'`
  - `export interface PropDoc { name: string; type: string; default?: string; description: string }`
  - `export interface ManifestDocs { badges?: readonly string[]; usage?: { do: readonly string[]; dont: readonly string[] }; props?: readonly PropDoc[]; a11y?: readonly string[]; emptyChildrenError?: string }`
  - `Manifest.group: ManifestGroup`; `Manifest.docs?: ManifestDocs` (made required in PR3)
  - `export function isHtmlElement(name: string): boolean`. A lowercase `ChildSpec.component` is a plain HTML element.
  - `NavGroup` adds `'Forms'`; the sidebar order is Foundations, Components, Forms, Brand.

- [ ] **Step 1: Write the failing tests**

`renderManifest.test.tsx`:
- Add `import type { Manifest } from '../manifests/types';`.
- Append inside the `describe`:

```tsx
  it('renders a lowercase ChildSpec as a plain HTML element (Select needs <option>)', () => {
    const withHtml: Manifest = {
      ...stack,
      children: [
        { component: 'span', props: { className: 'note' }, children: 'plain' },
        { component: 'Badge', children: 'bit' },
      ],
    };
    const { container } = render(renderManifest(withHtml, defaultState(withHtml)));
    const span = container.querySelector('span.note');
    expect(span).toHaveTextContent('plain');
    expect(span?.className).toBe('note');
    expect(container.querySelector('.bit-badge')).toHaveTextContent('bit');
  });
```

`toJsx.test.ts`:
- Add `import type { Manifest } from '../manifests/types';`.
- Append:

```ts
  it('prints HTML ChildSpecs as JSX but leaves them out of the import line', () => {
    const withHtml: Manifest = {
      ...stack,
      children: [
        { component: 'span', props: { className: 'note' }, children: 'plain' },
        { component: 'Badge', children: 'bit' },
      ],
    };
    expect(toJsx(withHtml, defaultState(withHtml))).toBe(
      `import { Badge, Stack } from '@bit-ds/react';\n\n<Stack>\n  <span className="note">plain</span>\n  <Badge>bit</Badge>\n</Stack>`,
    );
  });
```

`manifests.test.ts`:
- Change the import to `import { COMPONENTS, isHtmlElement } from './registry';`.
- In `every control default is one of its values…`, replace

```ts
        for (const child of m.children) expect(COMPONENTS[child.component], child.component).toBeDefined();
```

  with

```ts
        for (const child of m.children) {
          if (!isHtmlElement(child.component)) expect(COMPONENTS[child.component], child.component).toBeDefined();
        }
```

- In `slugs are unique…`, replace `m.group === 'Brand'` with `m.group === 'brand'`.
- Append:

```ts
  it('groups are the sidebar groups, and only the logo is brand', () => {
    for (const m of MANIFESTS) expect(['components', 'forms', 'brand']).toContain(m.group);
    expect(MANIFESTS.filter((m) => m.group === 'brand').map((m) => m.name)).toEqual(['BitLogo']);
  });

  it('isHtmlElement follows JSX: lowercase is an HTML tag, PascalCase is a component', () => {
    expect(isHtmlElement('option')).toBe(true);
    expect(isHtmlElement('Badge')).toBe(false);
  });
```

Create `apps/gallery/src/shell/Sidebar.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
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

describe('Sidebar', () => {
  it('lists Foundations, Components, Brand and hides the empty Forms group', () => {
    expect(renderSidebar(NAV)).toEqual(['Foundations', 'Components', 'Brand']);
    expect(screen.getByRole('link', { name: 'Button' })).toHaveAttribute('href', '/components/button');
  });

  it('shows Forms between Components and Brand once a forms item exists', () => {
    const items: readonly NavItem[] = [...NAV, { group: 'Forms', label: 'Input', to: '/components/input' }];
    expect(renderSidebar(items)).toEqual(['Foundations', 'Components', 'Forms', 'Brand']);
    expect(screen.getByRole('link', { name: 'Input' })).toHaveAttribute('href', '/components/input');
  });
});
```

- [ ] **Step 2: Run and watch them fail**

Run: `pnpm --filter @bit-ds/gallery test`

Expected: FAIL:
- `renderManifest` throws `ChildSpec names unknown component "span"`
- `isHtmlElement` is not a function
- the group test sees `'Components'`
- the Sidebar test is missing `'Forms'`

- [ ] **Step 3: Update `types.ts`**

Replace `group: 'Components' | 'Brand';` in `Manifest` with `group: ManifestGroup;`. Add `docs?: ManifestDocs;` after `parts`, with the doc comment `/** Page content beyond the playground. Optional until PR3 fills every manifest and makes it required. */`.

Replace the `ChildSpec` doc comment with:

```ts
/**
 * One child element of a compound component, as data so toJsx can print it. A PascalCase
 * `component` is a registered bit component; a lowercase one is a plain HTML element
 * (Select's `option`), following JSX's own rule.
 */
```

Add above `export interface Manifest`:

```ts
/** Sidebar group. Forms holds Field, Input, Select and Switch from PR2. */
export type ManifestGroup = 'components' | 'forms' | 'brand';

/** One row of a component page's Props table. */
export interface PropDoc {
  name: string;
  type: string;
  default?: string;
  description: string;
}

/** Everything a component page shows besides the playground (layout C, PR3). */
export interface ManifestDocs {
  badges?: readonly string[];
  usage?: { do: readonly string[]; dont: readonly string[] };
  props?: readonly PropDoc[];
  a11y?: readonly string[];
  /** The children control's error when the visitor empties it, e.g. Button's screen-reader warning. */
  emptyChildrenError?: string;
}
```

- [ ] **Step 4: Add `isHtmlElement` and use it**

`registry.ts`, append:

```ts
/** A lowercase ChildSpec name is a plain HTML element, the same rule JSX uses for tags. */
export function isHtmlElement(name: string): boolean {
  return /^[a-z]/.test(name);
}
```

`renderManifest.tsx`:
- Change the import to `import { COMPONENTS, isHtmlElement } from '../manifests/registry';`.
- Replace `const Part = COMPONENTS[child.component];` with `const Part = isHtmlElement(child.component) ? child.component : COMPONENTS[child.component];`.

`toJsx.ts`:
- Add `import { isHtmlElement } from '../manifests/registry';`.
- In `importLine`, replace

```ts
  if (Array.isArray(manifest.children)) for (const child of manifest.children) names.push(child.component);
```

  with

```ts
  if (Array.isArray(manifest.children)) {
    for (const child of manifest.children) if (!isHtmlElement(child.component)) names.push(child.component);
  }
```

- [ ] **Step 5: Lowercase every group and update `routeFor` and the exports**

Manifests:
- In `button`, `badge`, `alert`, `card`, `stack`, `text` and `spinner`: `group: 'Components',` → `group: 'components',`.
- In `bitLogo.ts`: `group: 'Brand',` → `group: 'brand',`.

`manifests/index.ts`:
- `return manifest.group === 'Brand' ? '/brand/logo' : \`/components/${manifest.slug}\`;` → `return manifest.group === 'brand' ? '/brand/logo' : \`/components/${manifest.slug}\`;`
- Extend the type export to `export type { Manifest, ManifestGroup, ManifestDocs, PropDoc, Control, ControlState, ControlValue, ChildSpec, Preset } from './types';`.

- [ ] **Step 6: Build the sidebar groups from `group`**

In `apps/gallery/src/shell/Sidebar.tsx`, replace everything from `export type NavGroup` through `const GROUPS …;` with:

```tsx
export type NavGroup = 'Foundations' | 'Components' | 'Forms' | 'Brand';
export interface NavItem {
  group: NavGroup;
  label: string;
  to: string;
}

type PageGroup = Exclude<ManifestGroup, 'brand'>;
const GROUP_LABELS: Record<PageGroup, NavGroup> = { components: 'Components', forms: 'Forms' };

/** Foundations, then one entry per components or forms manifest, then Brand. */
export const NAV: readonly NavItem[] = [
  { group: 'Foundations', label: 'Tokens', to: '/tokens' },
  ...MANIFESTS.filter((m): m is Manifest & { group: PageGroup } => m.group !== 'brand').map((m) => ({
    group: GROUP_LABELS[m.group],
    label: m.name,
    to: routeFor(m),
  })),
  { group: 'Brand', label: 'Logo', to: '/brand/logo' },
];

const GROUPS: readonly NavGroup[] = ['Foundations', 'Components', 'Forms', 'Brand'];
```

Change the manifests import to:

```tsx
import { MANIFESTS, routeFor } from '../manifests';
import type { Manifest, ManifestGroup } from '../manifests';
```

- [ ] **Step 7: Run the gallery gate**

```bash
pnpm --filter @bit-ds/gallery test && pnpm --filter @bit-ds/gallery typecheck && pnpm lint
```

Expected: all PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/gallery
git commit -m "$(cat <<'EOF'
feat(gallery): manifest group, optional docs block, HTML child specs

group is components | forms | brand and drives the sidebar, which gains a Forms
group that stays hidden until PR2's form components exist. Manifests may carry
a docs block (usage, props, a11y, badges, emptyChildrenError) for PR3's page.
A lowercase ChildSpec renders a plain HTML element and stays out of the
import line, so Select can list <option>s.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: Minimal component page, routes and route smoke (D14, E6)

**Files:**
- Create: `apps/gallery/src/pages/ComponentPage.tsx` and `apps/gallery/src/routes.test.tsx`
- Modify: `apps/gallery/src/router.tsx`

**Interfaces:**
- Consumes:
  - `useControlState(manifest)` → `{ state, setProp, apply, reset }`
  - `renderManifest`, `Preview({ label, children })`, `ControlsPanel({ manifest, state, onChange, onReset })` and `Presets({ manifest, onApply })`
  - `toJsx`, plus `findManifest`, `routeFor` and the `bitLogo` manifest
- Produces:
  - Routes `components/:slug` and `brand/logo`.
  - `export function ComponentPage({ manifest }: { manifest: Manifest })`, whose body PR3 replaces with layout C.
  - `export function ComponentRoute()` and `export function LogoRoute()`.

- [ ] **Step 1: Write the route smoke test**

Create `apps/gallery/src/routes.test.tsx`:

```tsx
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { MANIFESTS, routeFor } from './manifests';
import { renderAt } from './test/renderRoute';
import { expectNoA11yViolations } from './test/a11y';

describe('component routes (route smoke, D14)', () => {
  beforeEach(() => {
    document.documentElement.dataset.theme = 'power-up';
  });

  it.each(MANIFESTS.map((m) => [m.name, m] as const))(
    '%s: heading, live preview, controls and code, with no axe violations',
    async (_name, manifest) => {
      const { container } = renderAt(routeFor(manifest));
      expect(await screen.findByRole('heading', { level: 1, name: manifest.name })).toBeInTheDocument();
      const preview = screen.getByRole('region', { name: `${manifest.name} preview` });
      expect(preview.querySelector('[class*="bit-"]')).not.toBeNull();
      expect(screen.getByRole('heading', { level: 2, name: 'Controls' })).toBeInTheDocument();
      expect(screen.getByText(/from '@bit-ds\/react';/)).toBeInTheDocument();
      await expectNoA11yViolations(container);
    },
  );

  it('a control change updates the preview, the code, and the URL', async () => {
    const { router } = renderAt('/components/button');
    await screen.findByRole('heading', { level: 1, name: 'Button' });
    await userEvent.selectOptions(screen.getByLabelText('color'), 'danger');
    const preview = screen.getByRole('region', { name: 'Button preview' });
    expect(within(preview).getByRole('button', { name: 'Save' })).toHaveClass('bit-danger');
    expect(screen.getByText(/<Button color="danger">Save<\/Button>/)).toBeInTheDocument();
    expect(router.state.location.search).toBe('?color=danger');
  });

  it('old shared links fall back to defaults: ?gap=3 (the pre-px step) renders the 12px default', async () => {
    renderAt('/components/stack?gap=3');
    await screen.findByRole('heading', { level: 1, name: 'Stack' });
    const preview = screen.getByRole('region', { name: 'Stack preview' });
    expect(preview.querySelector('.bit-stack')).toHaveAttribute('data-gap', '12');
  });

  it.each(['/components/nope', '/components/logo'])('%s renders the 404 (the logo lives at /brand/logo)', async (path) => {
    renderAt(path);
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Page not found');
  });

  it('sidebar links reach component pages', async () => {
    renderAt('/');
    await screen.findByRole('heading', { level: 1 });
    await userEvent.click(screen.getByRole('link', { name: 'Badge' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Badge' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run and watch it fail**

Run: `pnpm --filter @bit-ds/gallery test -- routes`

Expected: FAIL. Every manifest route renders "Page not found" instead of its heading.

- [ ] **Step 3: Write the page**

Create `apps/gallery/src/pages/ComponentPage.tsx`:

```tsx
import { useParams } from 'react-router-dom';
import { Stack, Text } from '@bit-ds/react';
import { findManifest, routeFor } from '../manifests';
import type { Manifest } from '../manifests';
import { bitLogo } from '../manifests/bitLogo';
import { useControlState } from '../engine/useControlState';
import { renderManifest } from '../engine/renderManifest';
import { Presets } from '../engine/Presets';
import { Preview } from '../engine/Preview';
import { ControlsPanel } from '../engine/ControlsPanel';
import { toJsx } from '../code/toJsx';
import { NotFoundPage } from './NotFoundPage';

interface ComponentPageProps {
  manifest: Manifest;
}

/**
 * The minimal page every component gets until PR3's layout C (D14): heading, description,
 * presets, the live preview, its controls, and the React code. State lives in the URL.
 */
export function ComponentPage({ manifest }: ComponentPageProps) {
  const { state, setProp, apply, reset } = useControlState(manifest);
  return (
    <Stack gap={24}>
      <Stack gap={8}>
        <Text as="h1" size={32}>
          {manifest.name}
        </Text>
        <Text>{manifest.description}</Text>
      </Stack>
      <Presets manifest={manifest} onApply={apply} />
      <Preview label={`${manifest.name} preview`}>{renderManifest(manifest, state)}</Preview>
      <ControlsPanel manifest={manifest} state={state} onChange={setProp} onReset={reset} />
      <section aria-labelledby="code-heading">
        <Text as="h2" size={18} id="code-heading">
          React
        </Text>
        <pre className="gallery-pre">
          <code>{toJsx(manifest, state)}</code>
        </pre>
      </section>
    </Stack>
  );
}

/** `/components/:slug`. Unknown slugs, and manifests routed elsewhere (the logo is under Brand), get the 404. */
export function ComponentRoute() {
  const { slug = '' } = useParams();
  const manifest = findManifest(slug);
  if (!manifest || routeFor(manifest) !== `/components/${slug}`) return <NotFoundPage />;
  return <ComponentPage key={manifest.slug} manifest={manifest} />;
}

/** `/brand/logo`. */
export function LogoRoute() {
  return <ComponentPage manifest={bitLogo} />;
}
```

The `key` remounts the page when the slug changes, so one component's state never carries into the next.

- [ ] **Step 4: Add the routes**

Replace `apps/gallery/src/router.tsx` with:

```tsx
import { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { createHashRouter } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { Shell } from './shell/Shell';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';

// Pages other than home are lazy so the first paint ships only the shell and home.
const TokensPage = lazy(() => import('./pages/TokensPage').then((m) => ({ default: m.TokensPage })));
const ComponentRoute = lazy(() => import('./pages/ComponentPage').then((m) => ({ default: m.ComponentRoute })));
const LogoRoute = lazy(() => import('./pages/ComponentPage').then((m) => ({ default: m.LogoRoute })));

function Loading() {
  return <p className="gallery-loading">Loading…</p>;
}

function lazyPage(page: ReactNode) {
  return <Suspense fallback={<Loading />}>{page}</Suspense>;
}

/** Route table shared by the hash router (app) and memory routers (tests). */
export function buildRoutes(): RouteObject[] {
  return [
    {
      element: <Shell />,
      children: [
        { index: true, element: <HomePage /> },
        { path: 'tokens', element: lazyPage(<TokensPage />) },
        { path: 'components/:slug', element: lazyPage(<ComponentRoute />) },
        { path: 'brand/logo', element: lazyPage(<LogoRoute />) },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ];
}

export const router = createHashRouter(buildRoutes());
```

- [ ] **Step 5: Run the gallery gate with coverage**

```bash
pnpm --filter @bit-ds/gallery test:coverage && pnpm --filter @bit-ds/gallery typecheck && pnpm lint
```

Expected: all PASS (8 manifest routes + 5 more route tests); coverage ≥ 80% on every metric.

If axe reports a violation on one page, fix the markup it names. Don't disable the rule.

- [ ] **Step 6: Check it in a real browser**

Run `pnpm gallery` and open http://localhost:5173/#/components/button.

Expected:
- Changing color updates the button, the code and the URL.
- `#/brand/logo` shows the cycling logo with its controls.
- `#/components/stack?gap=3` shows a 12px gap.

Known and accepted until PR3 T8: changing a control moves focus to the h1 (Decision 6). Stop the server.

- [ ] **Step 7: Commit**

```bash
git add apps/gallery
git commit -m "$(cat <<'EOF'
feat(gallery): minimal component pages at /components/:slug and /brand/logo

Each manifest gets a page with its heading, description, presets, live preview,
controls and React code, all driven by URL state (D14). A route smoke test runs
axe on every manifest's page, and checks that a control change reaches the
preview, code and URL, that ?gap=3 falls back to the 12px default, and that
unknown slugs and /components/logo render the 404. PR3 replaces the page body
with layout C.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: Theme-first CSS imports everywhere the gallery teaches, plus a `dev` alias (E7, R3-3)

**Files:**
- Create: `apps/gallery/src/main.test.ts`
- Modify:
  - `apps/gallery/src/main.tsx`
  - `apps/gallery/src/pages/HomePage.tsx` (`INSTALL`)
  - `apps/gallery/src/shell/Shell.test.tsx`
  - `README.md`
  - root `package.json` (`dev` script)

**Interfaces:**
- Produces: canonical order `themes/power-up.css`, then `styles.css`. In PR3, `STYLE_IMPORTS` in `apps/gallery/src/content/snippets.mjs` becomes the single source and this test compares against it.

- [ ] **Step 1: Write the failing tests**

Create `apps/gallery/src/main.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

const main = readFileSync(new URL('./main.tsx', import.meta.url), 'utf8');

describe('main.tsx', () => {
  it('imports the theme before styles.css, the order the gallery teaches (its font @import must come first)', () => {
    const theme = main.indexOf("import '@bit-ds/react/themes/power-up.css';");
    const styles = main.indexOf("import '@bit-ds/react/styles.css';");
    expect(theme).toBeGreaterThanOrEqual(0);
    expect(styles).toBeGreaterThan(theme);
  });
});
```

In `Shell.test.tsx`, replace

```ts
    expect(screen.getByText(/pnpm add @bit-ds\/react/)).toBeInTheDocument();
```

with

```ts
    const install = screen.getByText(/pnpm add @bit-ds\/react/);
    expect(install.textContent).toContain(
      "import '@bit-ds/react/themes/power-up.css';\nimport '@bit-ds/react/styles.css';",
    );
```

- [ ] **Step 2: Run and watch them fail**

Run: `pnpm --filter @bit-ds/gallery test -- main Shell`

Expected: FAIL, because `styles.css` comes first in both places.

- [ ] **Step 3: Swap the order**

`apps/gallery/src/main.tsx`: replace

```ts
import '@bit-ds/react/styles.css';
import '@bit-ds/react/themes/power-up.css';
```

with

```ts
import '@bit-ds/react/themes/power-up.css';
import '@bit-ds/react/styles.css';
```

`apps/gallery/src/pages/HomePage.tsx`: replace the `INSTALL` constant with

```ts
const INSTALL = `pnpm add @bit-ds/react
import '@bit-ds/react/themes/power-up.css';
import '@bit-ds/react/styles.css';`;
```

`README.md`: in the "When published" snippet, make the same two-line swap so the theme import comes first.

- [ ] **Step 4: Add the `dev` alias**

In the root `package.json` `scripts`, add after `"gallery"`:

```json
    "dev": "pnpm gallery",
```

This makes `pnpm dev`, and `npm run dev` after a `pnpm install`, start the gallery. The workspace still installs only with pnpm: npm can't read `workspace:*`.

In `README.md`'s commands table, add the row:

```
| `pnpm dev` | build `@bit-ds/react`, then start the gallery at http://localhost:5173 |
```

- [ ] **Step 5: Run the gate**

```bash
pnpm --filter @bit-ds/gallery test && pnpm lint && pnpm dev
```

Expected:
- the tests pass
- `pnpm dev` builds the library and serves the gallery on :5173 (stop it with Ctrl-C)
- in the browser, the fonts still load (headings in Lilita One)

- [ ] **Step 6: Commit**

```bash
git add apps/gallery README.md package.json
git commit -m "$(cat <<'EOF'
fix(gallery): import the theme before styles.css everywhere it teaches

The theme's Google Fonts @import has to come first when bundlers concatenate
CSS. main.tsx, the Home install snippet and the README now use that order, and
a test pins main.tsx to it. Adds a root `pnpm dev` alias for the gallery.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 12: PR1 merge gate and pull request

**Files:** none changed. This task proves the design doc's PR1 gate and opens the PR.

- [ ] **Step 1: Run the full PR1 gate from a clean install**

```bash
rm -rf packages/react/dist && pnpm install --frozen-lockfile \
  && pnpm build && pnpm verify && pnpm typecheck && pnpm lint \
  && pnpm --filter @bit-ds/core test && pnpm test:coverage && pnpm --filter @bit-ds/gallery test \
  && pnpm smoke && pnpm storybook:build
```

Expected: every step passes. Then run the scope gate:

```bash
grep -rnE '@bit(/|\\/)' packages apps scripts README.md CONTRIBUTING.md docs/superpowers/specs package.json \
  --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=coverage --exclude-dir=storybook-static
```

Expected: no output.

- [ ] **Step 2: Whole-branch review**

Dispatch a fresh code reviewer on the most capable model against `git diff main...HEAD`. Give it this plan's Review Focus and Decisions sections. Fix Critical and Important findings in new commits and re-run Step 1.

- [ ] **Step 3: Push and open the PR**

```bash
git push -u origin feat/foundation
gh pr create --base main --title "feat: PR1 foundation — @bit-ds scope, px tokens, palette, focus ring, Badge shape, component routes" \
  --body-file <(cat <<'EOF'
## Summary
PR1 of the gallery stack (docs/designs/gallery-dogfood.md). Lands alone on main (D11).

- **Scope:** every package is `@bit-ds/*`. CI fails on any `@bit/` left outside historical docs.
- **px tokens (D13):** space, radius and type are named in px. Stack `gap={16}` and Text `size={18}` emit `data-gap` / `data-size`. A frozen table proves no rendered size changed.
- **Palette (T3):**
  - violet primary, yellow warning
  - Ink-night code tokens, JetBrains Mono
  - selection, caret and scrollbars
  - coin-gold logo tokens, so the logo doesn't change
- **Focus (D9):** an ink outline plus a yellow band inside Button's shadow. `tabindex="-1"` targets show no ring.
- **Badge `shape`:** pill or square.
- **Manifest schema:** `group` (components | forms | brand), an optional `docs` block, HTML child specs, and a shared sentinel rule (D12).
- **Minimal component pages (D14):** `/components/:slug` and `/brand/logo`, with a route smoke that runs axe on every manifest.
- **Imports:** theme first everywhere the gallery teaches. New `pnpm dev` alias.

## Decisions for the owner
See "Decisions this plan makes" in docs/superpowers/plans/2026-10-03-pr1-foundation.md. Most notable:
- Success hover is #19943F, because the approved #178C3E fails AA (4.22:1).
- `--bit-color-focus` is removed.

## Test plan
- [ ] CI green: scope gate, build + verify, typecheck, lint, core, react coverage, gallery, smoke, Storybook build
- [ ] `pnpm dev` → Tab to the GitHub button: yellow band inside an ink ring
- [ ] #/components/button: changing color updates the preview, code and URL
- [ ] #/brand/logo cycles; #/components/logo shows the 404

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)
```

- [ ] **Step 4: Hand off**

Report the PR URL and the CI status (`gh pr checks <n>`). Merge only after the owner explicitly says OK. After the merge, PR2's plan starts from the updated `main`.

---

## Self-review (run 2026-10-03)

**Spec coverage** (design doc PR1 row + eng review E3–E7):

| Spec item | Task |
|---|---|
| T1 scope rename and the scoped grep gate (R3-2) | 1 |
| T2 px tokens: frozen table (D13) | 2 |
| T2 px tokens: Stack `gap` and Text `size` | 3 |
| T2 px tokens: call-site migration (E4/OV6) and gallery.css token check | 4 |
| Stories updated so they type-check | 3, 4, 7 |
| T3 palette, code, mono, selection, caret, scrollbar and logo tokens | 5 |
| D9 focus ring (E3, OV5) | 6 |
| T5 Badge `shape` | 7 |
| E5 `isOmittedSentinel` | 8 |
| §H.3 `group` | 9 |
| §H.3 optional `docs` | 9 |
| §H.3 HTML ChildSpec in `renderManifest` and `toJsx` | 9 (`toHtml` doesn't exist yet: Decision 5) |
| §H.3 presets validated against their controls | 4 |
| E6 minimal page and route smoke with axe | 10 |
| E7 `[tabindex="-1"]` reset | 6 |
| E7 `main.tsx` theme-first order | 11 |
| E7 scoped grep | 1 |
| PR1 gate: core, react and gallery tests; completeness; verify; Storybook; grep | 12 |

T4 (logo alignment) is PR3 by the design doc's table, so it isn't here.

**Placeholder scan:** none. Every code step shows the code. Edits name the exact old and new text.

**Type consistency:**
- `dataValue(blockName, DataAxis)`: Task 3, used by Stack, Text and Badge.
- `ManifestGroup`: Task 9, used by `Sidebar` and `routeFor`.
- `isHtmlElement`: Task 9, in `registry.ts`, used by `renderManifest`, `toJsx` and the contract test.
- `isOmittedSentinel(control, value)`: Task 8.
- `CODE_KINDS`: Task 5.
- `TEXT_SIZES` and `SPACE_STEPS` are numbers from Task 2 on.
- The token count is 67 through Task 4, then 84 from Task 5 and in Task 6.

**Review Focus:** each of the five items names its owning task's test above.
