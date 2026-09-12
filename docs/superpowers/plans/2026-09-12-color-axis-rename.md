# Color Axis Rename and Consumer Packaging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the `tone` axis to `color` everywhere, move `@bit/core` to a devDependency of `@bit/react`, and add a consumer smoke test that installs the packed tarball into a fresh project with npm.

**Architecture:** The rename is mechanical and touches three layers that must move together: the core token constants and system CSS (with its private variables), the React components and their tests and stories, and the docs. Classes and public tokens do not change. The packaging fix follows from how tsup already inlines core; the smoke test proves the published shape works for a consumer who has never heard of pnpm.

**Tech Stack:** unchanged from Phase 1 (pnpm 9, TypeScript 5.9, Vitest 4, tsup 8). The smoke test uses `pnpm pack`, `npm install`, and Node's `node:child_process`.

**Spec:** `docs/superpowers/specs/2026-09-12-gallery-and-color-axis-addendum.md` sections A and B (amending `docs/superpowers/specs/2026-09-06-bit-design-system-design.md`).

## Global Constraints

- Prefix rules unchanged: public classes `bit-…`, public tokens `--bit-…`, private variables `--_bit-…`.
- The decorator classes `bit-primary | bit-neutral | bit-success | bit-warning | bit-danger` and the public tokens `--bit-color-{value}`, `-contrast`, `-hover`, `-soft` are **unchanged**.
- After the rename, the axis is `color` ∈ `primary | neutral | success | warning | danger`; the constant is `COLORS`; the type is `Color`; the system file is `system/colors.css`; the private variables are `--_bit-color`, `--_bit-color-contrast`, `--_bit-color-hover`, `--_bit-color-soft`.
- Decorator emission order stays `color → variant → size`; defaults always emitted (or replaced by a caller-supplied `bit-{value}` in `className`); `className` last.
- No file under `packages/`, `apps/`, `README.md`, or `CONTRIBUTING.md` may contain the whole words `tone`, `tones`, `TONES`, or `Tone` when the branch is done. Verified by `git grep -w -E 'tone|tones|TONES|Tone' -- packages apps README.md CONTRIBUTING.md` printing nothing.
- `@bit/core` is a **devDependency** of `@bit/react`; `@radix-ui/react-slot` stays a dependency; React stays a peer dependency.
- Tests first; coverage threshold 80% in `@bit/react` (currently 100%); commit messages `<type>: <description>`.

## File Structure

```
packages/core/src/tokens.ts                     TONES→COLORS, Tone→Color, comments
packages/core/src/system/colors.css             renamed from tones.css; --_bit-color*
packages/core/src/index.css                     import line
packages/core/src/components/{button,badge,alert,spinner}.css   --_bit-color*
packages/core/src/__tests__/{tokens,system,contrast}.test.ts   COLORS, colors.css, --_bit-color
packages/react/src/system/axes.ts               COLORS, Color re-exports
packages/react/src/system/toClasses.test.ts     axis name 'color' in fixtures and warning text
packages/react/src/components/*/               prop color, const colors, type Color, tests, stories
packages/react/src/index.ts, index.test.tsx     exports and contract test
packages/react/scripts/verify-dist.mjs          type names
apps/docs/stories/Tokens.stories.tsx            COLORS
README.md, CONTRIBUTING.md                      wording
docs/superpowers/specs/2026-09-06-…design.md    base-spec text the addendum lists
packages/react/package.json                     @bit/core → devDependencies
scripts/smoke-consumer.mjs                      new: pack, npm install into a temp project, import
package.json (root)                             "smoke" script
.github/workflows/ci.yml                        smoke step
```

---

### Task 1: Rename the axis in `@bit/core`

**Files:**
- Rename: `packages/core/src/system/tones.css` → `packages/core/src/system/colors.css`
- Modify: `packages/core/src/tokens.ts`, `packages/core/src/index.css`, `packages/core/src/components/button.css`, `badge.css`, `alert.css`, `spinner.css`
- Test: `packages/core/src/__tests__/tokens.test.ts`, `system.test.ts`, `contrast.test.ts`

**Interfaces:**
- Consumes: the Phase 1 core package as it stands.
- Produces: `@bit/core/tokens` exports `COLORS` (same five values) and type `Color`; `TONES`/`Tone` no longer exist. `system/colors.css` defines `.bit-{color}` rules setting `--_bit-color`, `--_bit-color-contrast`, `--_bit-color-hover`, `--_bit-color-soft`. Component CSS reads only the new private names.

- [ ] **Step 1: Change the core tests to the new names (RED)**

In `packages/core/src/__tests__/tokens.test.ts`: import `COLORS` instead of `TONES`; the first test's title becomes `'has the five colors, three sizes, six text sizes'` and its assertion `expect(COLORS).toEqual([...])`; the loop test title becomes `'includes the four color tokens for every color'` and iterates `COLORS`. Everything else unchanged.

In `packages/core/src/__tests__/system.test.ts`: import `COLORS` instead of `TONES`; `describe('system/tones.css')` → `describe('system/colors.css')`; `readCss('system/tones.css')` → `readCss('system/colors.css')`; the test title `'.bit-%s remaps the four private tone variables'` → `'.bit-%s remaps the four private color variables'`; the loop iterates `COLORS`; the expected declaration string becomes `` `--_bit-color${suffix}: var(--bit-color-${color}${suffix});` `` (rename the loop variable `tone` → `color`). In the `index.css` test, the expected system import list becomes `['reset', 'colors', 'sizes', 'motion']`. In the components-conventions block, leave the logic as is (it only checks prefixes).

In `packages/core/src/__tests__/contrast.test.ts`: import `COLORS`; every `it.each(TONES)` → `it.each(COLORS)`; rename loop variables `tone` → `color` and test titles `'tone %s: …'` → `'color %s: …'`.

Run: `pnpm --filter @bit/core test`
Expected: FAIL — `COLORS` is not exported, `system/colors.css` does not exist.

- [ ] **Step 2: Rename the CSS file and its variables**

```bash
git mv packages/core/src/system/tones.css packages/core/src/system/colors.css
```

In `packages/core/src/system/colors.css`, replace the header comment with:

```css
/* Color decorators. Written once; every component reads the private variables.
   Adding a color = four tokens in each theme + one rule here. */
```

and replace every `--_bit-tone` with `--_bit-color` (20 occurrences: four per rule, five rules). The rule selectors and the `var(--bit-color-…)` right-hand sides do not change.

In `packages/core/src/index.css`, change `@import "./system/tones.css";` to `@import "./system/colors.css";` and update the comment if it names the file.

In `packages/core/src/components/button.css`, `badge.css`, `alert.css`, `spinner.css`: replace every `--_bit-tone` with `--_bit-color` (button 6, badge 3, alert 3, spinner 1). Update any comment that says "tone" (for example button.css's first line "Reads tone via --_bit-tone-*…" → "Reads color via --_bit-color-*…").

- [ ] **Step 3: Rename the constants in `tokens.ts`**

In `packages/core/src/tokens.ts`:
- The doc comment and constant: `/** The five color roles. Same words as the `color` prop and the `bit-{color}` class. */` and `export const COLORS = ['primary', 'neutral', 'success', 'warning', 'danger'] as const;`
- `export type Color = (typeof COLORS)[number];` (replacing `Tone`)
- In the builder: `const colorTokens = COLORS.flatMap((color) => [token('color', color), token('color', color, 'contrast'), token('color', color, 'hover'), token('color', color, 'soft')]);` and use `...colorTokens` in `SEMANTIC_TOKENS` where `...toneTokens` was. `colorRoleTokens` stays as is.

- [ ] **Step 4: Run the core suite (GREEN) and verify no old names remain**

Run: `pnpm --filter @bit/core test && git grep -w -E 'tone|tones|TONES|Tone' -- packages/core`
Expected: 59 tests pass; the grep prints nothing.

- [ ] **Step 5: Commit**

```bash
git add -A packages/core
git commit -m "refactor(core): rename the tone axis to color"
```

---

### Task 2: Rename the axis in `@bit/react`, the docs app, and the docs

**Files:**
- Modify: `packages/react/src/system/axes.ts`, `packages/react/src/system/toClasses.test.ts`, `packages/react/src/index.ts`, `packages/react/src/index.test.tsx`, `packages/react/scripts/verify-dist.mjs`
- Modify: `packages/react/src/components/Button/Button.tsx`, `Button.test.tsx`, `Button.stories.tsx`; `Badge/Badge.tsx`, `.test.tsx`, `.stories.tsx`; `Alert/Alert.tsx`, `.test.tsx`, `.stories.tsx`; `Spinner/Spinner.tsx`, `.test.tsx`, `.stories.tsx`; `Text/Text.tsx`, `.test.tsx`, `.stories.tsx`; `Card/Card.stories.tsx`; `Stack/Stack.stories.tsx`
- Modify: `apps/docs/stories/Tokens.stories.tsx`
- Modify: `README.md`, `CONTRIBUTING.md`, `docs/superpowers/specs/2026-09-06-bit-design-system-design.md`

**Interfaces:**
- Consumes: `COLORS`, `Color` from Task 1.
- Produces: `@bit/react` exports `COLORS` and type `Color`; every component's color prop is `color?: Color` (Text: `color?: 'neutral'`); class output unchanged.

- [ ] **Step 1: Change the react tests to the new names (RED)**

Apply these replacements in every `*.test.tsx` and `toClasses.test.ts` under `packages/react/src`:
- `TONES` → `COLORS` (imports and loops)
- JSX props `tone=` → `color=`
- axis fixture `{ name: 'tone', allowed: TONES, value: tone }` → `{ name: 'color', allowed: COLORS, value: color }` and the helper parameter names `tone` → `color`
- expected warning text `tone="purple"` → `color="purple"`
- test titles containing `tone=` → `color=`, e.g. `'tone=%s variant=%s has no accessibility violations'` → `'color=%s variant=%s …'`
- `index.test.tsx`: `expect(lib.TONES).toHaveLength(5)` → `expect(lib.COLORS).toHaveLength(5)`

Run: `pnpm --filter @bit/react test`
Expected: FAIL — `COLORS` is not exported from `../../system/axes`; typecheck of `color=` props fails.

- [ ] **Step 2: Rename in the system layer and components**

`packages/react/src/system/axes.ts`: import and re-export `COLORS` and type `Color` from `@bit/core/tokens` in place of `TONES`/`Tone`.

`packages/react/src/index.ts`: export `COLORS` in place of `TONES` and type `Color` in place of `Tone`.

In each component file, apply exactly:
- `Button.tsx`: `const tones = TONES;` → `const colors = COLORS;`; prop `tone?: Tone;` → `color?: Color;` with JSDoc "Color role. Class: `bit-{color}`."; destructure `color = 'primary'`; axis `{ name: 'color', allowed: colors, value: color }`; import `COLORS`/`Color`.
- `Badge.tsx`: same pattern, default `'neutral'`.
- `Alert.tsx`: same pattern, default `'neutral'`.
- `Spinner.tsx`: same pattern, default `'primary'`.
- `Text.tsx`: `const tones = ['neutral'] as const;` → `const colors = ['neutral'] as const;`; prop `tone?: (typeof tones)[number];` → `color?: (typeof colors)[number];` with JSDoc "`neutral` renders muted text."; axis `{ name: 'color', allowed: colors, value: color }`. Note the base `HTMLAttributes<HTMLElement>` already has `color?: string`; the narrower union is a valid override.

Stories (still present until the gallery replaces them): in `Button`, `Badge`, `Alert`, `Spinner`, `Text` stories replace `TONES` → `COLORS`, `args.tone` → `args.color`, `argTypes.tone` → `argTypes.color`, `tone={…}` → `color={…}`, story export `Tones` → `Colors`, and loop variables. `Card.stories.tsx` and `Stack.stories.tsx`: `tone="neutral"` → `color="neutral"`.

`packages/react/scripts/verify-dist.mjs`: in the type-needle list replace `'Tone'` with `'Color'`.

`apps/docs/stories/Tokens.stories.tsx`: `TONES` → `COLORS`, loop variable `tone` → `color`, template strings `--bit-color-${color}…`.

- [ ] **Step 3: Update the docs**

`README.md`: in the naming table and the axes list replace `tone="primary"` → `color="primary"` and `- \`tone\`: …` → `- \`color\`: …`; the className sentence example stays (`bit-danger`).

`CONTRIBUTING.md`: "## Add a tone to the whole system" → "## Add a color to the whole system"; "`TONES` in `packages/core/src/tokens.ts`" → "`COLORS` …"; "One rule in `packages/core/src/system/tones.css`" → "…`colors.css`"; "The contrast test verifies the new tone's text…" → "…the new color's text…"; any `--_bit-tone-*` → `--_bit-color-*`.

`docs/superpowers/specs/2026-09-06-bit-design-system-design.md`, exactly the edits the addendum §A lists: §3.4 first bullet "**Tone decorators are global, written once.** `core/src/system/tones.css` maps each `bit-{tone}` class to private variables: `--_bit-tone`, …" → "**Color decorators are global, written once.** `core/src/system/colors.css` maps each `bit-{color}` class to private variables: `--_bit-color`, `--_bit-color-contrast`, `--_bit-color-hover`, `--_bit-color-soft`. … Adding a color system-wide is: 4 semantic tokens per theme + one rule in `colors.css`."; §4.1 axes block `tone     primary | …` → `color    primary | …`; §4.3 table header `| tone |` → `| color |` and cell text "tone `danger`" → "color `danger`"; §5.1 unchanged; §8.2 "each tone × variant" → "each color × variant"; §12 add the row `| Axis name | \`color\` | \`tone\` | the word people already use; aligns with \`--bit-color-*\` (addendum 2026-09-12) |`. Do not touch the addendum file.

- [ ] **Step 4: Run everything (GREEN) and verify no old names remain**

Run: `pnpm typecheck && pnpm lint && pnpm test && git grep -w -E 'tone|tones|TONES|Tone' -- packages apps README.md CONTRIBUTING.md`
Expected: typecheck and lint clean; core 59 and react 92 pass; the grep prints nothing. Then `pnpm test:coverage` still reports 100% and `pnpm build && pnpm verify` prints `dist OK`.

- [ ] **Step 5: Commit**

```bash
git add -A packages/react apps/docs README.md CONTRIBUTING.md docs/superpowers/specs/2026-09-06-bit-design-system-design.md
git commit -m "refactor(react): rename the tone prop to color"
```

---

### Task 3: Move `@bit/core` to devDependencies and add the consumer smoke test

**Files:**
- Modify: `packages/react/package.json`, root `package.json`, `.github/workflows/ci.yml`, `CONTRIBUTING.md`
- Create: `scripts/smoke-consumer.mjs`

**Interfaces:**
- Consumes: the built `@bit/react` (`pnpm build`), the `EXPECTED` component list (11 names) from `packages/react/scripts/verify-dist.mjs`.
- Produces: `pnpm smoke` — packs `@bit/react`, installs the tarball with npm into a temporary project, imports both entries, checks the CSS files; exits non-zero on any failure. CI runs it after `pnpm build && pnpm verify`.

- [ ] **Step 1: Move the dependency**

In `packages/react/package.json`, remove `"@bit/core": "workspace:*"` from `dependencies` and add it to `devDependencies` (alphabetically first). Run `pnpm install` so the lockfile's importer section moves it. `pnpm build && pnpm verify` must still pass (tsup inlines core via `noExternal`).

- [ ] **Step 2: Write the smoke script**

`scripts/smoke-consumer.mjs`:

```js
// Proves a stranger can `npm install` the packed @bit/react into a fresh project.
// Steps: build → pnpm pack → temp project → npm install <tarball> → import ESM + CJS → check CSS files.
import { execSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const reactPkg = join(root, 'packages', 'react');
const run = (cmd, cwd) => execSync(cmd, { cwd, stdio: 'pipe', encoding: 'utf8' });

const EXPECTED = ['Alert', 'Badge', 'BitLogo', 'Button', 'Card', 'CardBody', 'CardFooter', 'CardHeader', 'Spinner', 'Stack', 'Text'];

// 1. Build and pack into a temp directory
const work = mkdtempSync(join(tmpdir(), 'bit-smoke-'));
run('pnpm build', reactPkg);
run(`pnpm pack --pack-destination "${work}"`, reactPkg);
const tarball = readdirSync(work).find((f) => f.endsWith('.tgz'));
assert.ok(tarball, 'pnpm pack produced no tarball');

// 2. A fresh consumer project installed with npm; the react/react-dom peers resolve from the registry
const app = join(work, 'consumer');
mkdirSync(app);
writeFileSync(join(app, 'package.json'), JSON.stringify({ name: 'consumer', private: true, type: 'module' }, null, 2));
run(`npm install --no-audit --no-fund --loglevel=error "${join(work, tarball)}"`, app);

// 3. Import both entry points and check the CSS shipped
writeFileSync(
  join(app, 'check.mjs'),
  `import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import assert from 'node:assert/strict';
const expected = ${JSON.stringify(EXPECTED)};
const esm = await import('@bit/react');
for (const n of expected) assert.ok(esm[n], 'ESM missing ' + n);
assert.equal(esm.PREFIX, 'bit');
assert.deepEqual([...esm.COLORS], ['primary', 'neutral', 'success', 'warning', 'danger']);
const require = createRequire(import.meta.url);
const cjs = require('@bit/react');
for (const n of expected) assert.ok(cjs[n], 'CJS missing ' + n);
const dist = join(dirname(require.resolve('@bit/react/package.json')), 'dist');
assert.ok(existsSync(join(dist, 'styles.css')), 'styles.css missing');
assert.ok(existsSync(join(dist, 'themes', 'power-up.css')), 'themes/power-up.css missing');
console.log('consumer OK: ' + expected.length + ' components via ESM and CJS, CSS present');
`,
);
console.log(run('node check.mjs', app).trim());

rmSync(work, { recursive: true, force: true });
```

Note: `require.resolve('@bit/react/package.json')` needs `./package.json` in the exports map. Add `"./package.json": "./package.json"` to `packages/react/package.json` `exports` (a standard, harmless entry).

Root `package.json` scripts: add `"smoke": "node scripts/smoke-consumer.mjs"`.

- [ ] **Step 3: Run it**

Run: `pnpm smoke`
Expected: prints `consumer OK: 11 components via ESM and CJS, CSS present`. If `npm install` fails on peer resolution, the output names the package; do not add `--legacy-peer-deps`, report it.

- [ ] **Step 4: Wire CI and the docs**

`.github/workflows/ci.yml`: after `- run: pnpm build && pnpm verify` add `- run: pnpm smoke`. Keep the `pnpm storybook:build` step (Storybook is removed in the gallery branch, not here).

`CONTRIBUTING.md`: under Conventions add: "`@bit/core` is a devDependency of `@bit/react` because tsup inlines it; `pnpm smoke` proves the packed tarball installs with npm into a fresh project. Consumers can use any package manager."

Run: `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm verify && pnpm smoke`
Expected: all clean.

- [ ] **Step 5: Commit**

```bash
git add packages/react/package.json pnpm-lock.yaml scripts/smoke-consumer.mjs package.json .github/workflows/ci.yml CONTRIBUTING.md
git commit -m "chore: core as a devDependency and a consumer smoke test"
```

---

## Self-review

**Spec coverage:** addendum §A (rename, all layers, docs, base-spec edits) → Tasks 1–2; §B (devDependency, smoke test in CI, any package manager) → Task 3. The addendum's "what does not change" list is enforced by leaving `tokens.test.ts`'s token-name assertions and every `bit-{value}` class assertion untouched.

**Placeholder scan:** none.

**Type consistency:** `COLORS`/`Color` are introduced in Task 1 and consumed by name in Tasks 2 and 3; the smoke script's `EXPECTED` list equals `verify-dist.mjs`'s; the private-variable names match between `colors.css` and every component CSS file; `./package.json` is added to the exports map so the smoke check can locate `dist`.
