# bit design system — addendum: `color` axis and the gallery app

**Date:** 2026-09-12
**Status:** approved in brainstorming, pending written review
**Amends:** `2026-09-06-bit-design-system-design.md` (the base spec). Where this addendum and the base spec disagree, this addendum wins.

## A. The `tone` axis is renamed `color`

**Why.** "Color" is the word people already use for what this axis does, and it makes the vocabulary fully literal: prop `color="primary"` → class `bit-primary` → token `--bit-color-primary`. Nothing has to be translated.

**What changes.**

| Layer | Before | After |
|---|---|---|
| Prop on Button, Badge, Alert, Spinner, Text | `tone` | `color` |
| Constant / type in `@bit/core/tokens` and `@bit/react` | `TONES`, `Tone` | `COLORS`, `Color` |
| System CSS file | `system/tones.css` | `system/colors.css` |
| Private variables set by `.bit-{value}` | `--_bit-tone`, `--_bit-tone-contrast`, `--_bit-tone-hover`, `--_bit-tone-soft` | `--_bit-color`, `--_bit-color-contrast`, `--_bit-color-hover`, `--_bit-color-soft` |
| Docs | "tone" in README, CONTRIBUTING ("Add a tone"), spec §3.4, §4.1, §4.3, §5, §12 | "color" ("Add a color") |

**What does not change.** The decorator classes (`bit-primary` … `bit-danger`), the public tokens (`--bit-color-{value}`, `-contrast`, `-hover`, `-soft`), the values themselves, and the `variant` and `size` axes.

**TypeScript note.** React's `HTMLAttributes` already declares a legacy `color?: string`. Component props narrow it to the `Color` union, so `color="red"` is a type error instead of a stray DOM attribute. That is the desired behavior.

**Base spec text affected.** §3.4 ("Tone decorators are global…" → "Color decorators…"), §4.1 (`tone` → `color` in the axes block), §4.3 (table column), §5.1, §8.2 ("each tone × variant" → "each color × variant"), §12 decisions log gains a row: "Axis name | `color` | `tone` | the word people already use; aligns with `--bit-color-*`".

## B. Packaging fix and consumer smoke test

`@bit/react` inlines `@bit/core` at build time (tsup `noExternal`) and copies its CSS into `dist`, so `@bit/core` must be a **devDependency**, not a dependency; otherwise a tarball install in a fresh project tries to fetch `@bit/core` from the registry and fails.

A **consumer smoke test** joins §8.3's system tests: a script packs `@bit/react` with `pnpm pack`, installs the tarball into a temporary project with `npm install`, imports the ESM and CJS entries, typechecks a small TypeScript consumer against the shipped declarations, and checks that `styles.css` and `themes/power-up.css` exist. It runs in CI. Consumers may use any package manager; the repo's own pnpm choice does not constrain them.

## C. The gallery replaces Storybook

### C.1 Decision

`apps/docs` (Storybook), every `*.stories.tsx`, and the `storybook` / `@storybook/*` devDependencies are removed. They are replaced by **`apps/gallery`**, a standalone Vite + React + TypeScript single-page app that consumes `@bit/react` through its published `exports` map, exactly as a consumer would. The gallery is the only documentation surface and is published to GitHub Pages from `main`.

Base spec §6 (package layout, "apps/docs Storybook 9…"), §8 ("Every component ships `X.tsx`, `X.test.tsx`, `X.stories.tsx`"), §9 Phase 4 ("Storybook deploy + Chromatic"), and §10 are amended accordingly. The new rule: **every component ships `X.tsx`, `X.test.tsx`, and a manifest entry in `apps/gallery/src/manifests/`.**

### C.2 Requirements

1. **Standalone.** No docs framework, no Storybook, no UI kit other than bit itself. Dependencies: `react`, `react-dom`, `react-router-dom`, `@bit/react`. Dev: `vite`, `@vitejs/plugin-react`, `typescript`, `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@playwright/test`.
2. **Interactive controls.** Each component page lets the visitor change every axis (`color`, `variant`, `size`) and every boolean prop live, plus a text field where the component has one (Alert `title`, Spinner `aria-label`).
3. **Copy code.** A code panel with two tabs: **React** (the JSX for the current state, with its import line) and **HTML** (the exact markup with `bit-*` classes), each with a copy button.
4. **Polish.** The gallery dogfoods bit's components and tokens for its own UI; keyboard-accessible controls with visible labels; a skip link; focus moves to the page heading on route change; responsive down to phone width; lazy-loaded pages; a 404 route.

### C.3 App shell and routes

Three-region shell: header (BitLogo at `sm`, app name, theme select, GitHub link), sidebar grouped as **Foundations**, **Components**, **Brand** (collapses behind a menu button on narrow screens), and a main region targeted by the skip link.

Hash routing via react-router's `createHashRouter` so deep links work on GitHub Pages:

```
#/                    Home: logo, three-line install, the naming rule, "two ways to use"
#/tokens              Swatches per color (fill, hover, soft) and the full semantic token table
#/components/:name    One page per component, driven by its manifest
#/brand/logo          BitLogo with size, interval, animated, freeze controls
*                     404 with a link home
```

The gallery's own layout uses Card, Button, Badge, Text, and Stack. What they cannot express (sidebar, controls grid, code block, stage) lives in a gallery stylesheet that reads only `--bit-*` tokens, so a theme switch restyles the gallery too.

### C.4 Manifest and controls engine

One manifest per component in `apps/gallery/src/manifests/`:

```ts
interface Manifest {
  name: string;                 // export name; drives title, route, and import line
  group: 'Components' | 'Brand';
  component: ComponentType<any>;
  description: string;
  axes: Array<{ prop: 'color' | 'variant' | 'size'; values: readonly string[]; default: string }>;
  booleans: Array<{ prop: string; default: boolean; label?: string }>;
  text?: { prop: string; default: string; label?: string };
  children?: string | ((state: ControlState) => ReactNode);
  presets?: Array<{ label: string; state: Partial<ControlState> }>;
}
```

Axis values are imported from `@bit/react` (`COLORS`, `VARIANTS`, `SIZES`, `TEXT_SIZES`), never retyped. A **manifest contract test** asserts every component export of `@bit/react` has a manifest and every manifest names a real export.

Engine components on every component page:

- **ControlsPanel** — one select per axis, one switch per boolean, a text field where declared, labels equal to prop names, a Reset button.
- **Preview** — the live component on a stage, with a checkerboard toggle for transparent variants.
- **CodePanel** — see C.5.
- **Presets** — a row of Badges that apply several props at once (replacing the deleted "Tones/Variants/Sizes" stories).
- **Matrix view** — a toggle that renders the component for every color × variant combination on one screen.

**Control state lives in the URL query** (`#/components/button?color=danger&variant=outline&loading=1`). Values equal to the manifest default are omitted. This yields shareable links and back-button undo.

### C.5 Code generation

- **`toJsx(manifest, state): string`** — pure. Omits props equal to defaults; booleans render bare; strings are quoted and escaped; compound components render their parts; the import line lists every export used. Unit-tested table-style.
- **`toHtml(element): string`** — renders the live element with `renderToStaticMarkup`, then pretty-prints (one element per line, two-space indent, void elements). Generated from the same element the visitor sees, so it cannot drift.
- **Copy** uses the Clipboard API; the copy Button shows "Copied" for two seconds, then reverts.
- **Highlighting** is a small in-repo tokenizer (tag, attribute, string, punctuation) mapped to theme tokens. No highlighter dependency.

### C.6 Build, scripts, deploy

- `@bit/gallery` is private. Vite `base` is `/bit-design-system/` in production builds.
- Root scripts: `pnpm gallery` (builds `@bit/react`, then dev server on :5173); `pnpm gallery:build` (builds `@bit/react`, then the gallery to `apps/gallery/dist`). A component change needs `pnpm build` again in dev; documented in CONTRIBUTING.
- `.github/workflows/ci.yml`: `pnpm storybook:build` is replaced by `pnpm gallery:build`, plus the consumer smoke test and the Playwright spec.
- `.github/workflows/deploy.yml`: on push to `main`, install → build + verify the package → build the gallery → upload artifact → deploy with the official Pages actions. Requires the one-time repo setting Settings → Pages → Source: GitHub Actions.
- README: first link is the live gallery at `https://doosemavis.github.io/bit-design-system/`.

### C.7 Testing

Unit (Vitest, jsdom, RTL; 80% threshold): `toJsx` cases; `toHtml` nesting, void elements, attribute preservation, DOM round-trip; URL state parse/serialize/defaults/back; ControlsPanel (one select per axis with the manifest's values, one switch per boolean, Reset, labels); manifest contract; route smoke with axe on every page (same two rules disabled); copy button state.

End-to-end (Playwright, one spec, in CI): home shows the logo; Button page: changing `color` and `variant` updates the preview classes and the React snippet; theme select updates `data-theme` on the root.

Build checks in CI: `pnpm gallery:build` succeeds; built `index.html` references `/bit-design-system/`; consumer smoke test passes.

## D. Sequencing

1. **PR #1** (Phase 1) merges as reviewed.
2. **`refactor/color-axis`**: section A + section B. One small plan, one review.
3. **`feat/gallery`**: section C. Roughly ten tasks: scaffold and shell; router and pages; manifests and contract test; controls engine and URL state; code generation; tokens and logo pages; gallery stylesheet; Playwright spec; Pages workflow and CI; README and CONTRIBUTING.

Phases 2–4 of the base spec follow unchanged, with "gallery manifest" substituted wherever they say "story".

## E. Decisions log

| Decision | Chosen | Rejected | Why |
|---|---|---|---|
| Axis name | `color` | `tone` | the word people already use; aligns with `--bit-color-*` |
| Docs surface | standalone gallery app | Storybook (base spec), docs framework, stories-as-data | no bolted-on tooling; controls, live preview, copy code are first-class |
| Gallery data | one manifest per component | parsing story files | stories are removed; a manifest is the system's own idea applied to docs |
| Routing | react-router hash router | history router, hand-rolled hook | deep links on Pages without rewrites; familiar to juniors |
| Package consumption | built `dist` via exports map | Vite alias to `src` | the gallery must behave like a real consumer |
| Hosting | GitHub Pages from `main` | local only, Vercel/Netlify | free, in-repo, no accounts |
| Highlighting | in-repo tokenizer | shiki/prism | four token classes suffice; no dependency |
| Package manager | keep pnpm | switch to npm | strict isolation protects the zero-dep core; consumers unaffected |
| `@bit/core` in react | devDependency | dependency | it is inlined at build; a tarball must install standalone |
| Types in the tarball | tsup dts resolves `@bit/core` | leave `@bit/core` imports in dts | a devDependency is not in the tarball; the declarations must be self-contained |
