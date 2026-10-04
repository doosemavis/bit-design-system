# PR3b: Dogfood and quality, design

**Status:** approved in brainstorming on 2026-10-04 (one board, two design sections). The owner asked for the build to go straight on through subagent-driven development.

**Ships as:** its own PR on `feat/pr3b-dogfood-quality`. It's the second of three PRs that replace the original PR3:
- **3a:** pages (merged as #10)
- **3b:** this spec
- **3c:** Storybook removal, CI, the release workflows, and the first npm publish

**Visual reference:** `~/.gstack/projects/doosemavis-bit-design-system/designs/pr3b-20261004/board.html`

**Scope sources:**
- `docs/designs/gallery-dogfood.md` (dogfooding checks)
- the PR2 and PR3a follow-ups recorded in the PR bodies of #8 and #10

## Goal

The gallery is built only from bit, and it's guarded so it stays that way. Every page passes axe in light and dark. The PR2 component follow-ups are closed.

## Decisions (owner, 2026-10-04)

| # | Decision |
|---|---|
| 1 | **The `gallery.css` rule.** Group A (hand-built controls, cards, links and eyebrows) is rebuilt on bit components. Group B (token specimens) and group C (the frame and accessibility rules) go in a documented exceptions list, one entry per selector and property, each with a reason. The test fails on anything unlisted, and it fails on stale entries. |
| 2 | **Q1-A.** Inside a solid Alert, a Link takes the Alert's text colour. Hover thickens the underline to 4px, with no highlight. |
| 3 | **Q2-A.** In forced-colours mode, an invalid Input or Select gets a 10px `border-inline-start`. |
| 4 | **Q3a-A.** A new `--bit-color-stripe` token (light: stone `#DCDED6`; dark: `#353545`). Table stripes read it, and `neutral-soft` is untouched. |
| 5 | **Q3b-A.** In dark mode, the Link hover underline turns `--bit-color-accent` (yellow). No contrast tokens change. |
| 6 | **The lint ban** uses ESLint's built-in `no-restricted-syntax`. No plugin. |
| 7 | **The CSS guard** parses with `postcss`, and the exceptions live in `apps/gallery/src/gallery-css.exceptions.ts`. |
| 8 | **e2e** uses `@axe-core/playwright` against `vite build` + `vite preview`, served at the `/bit-design-system/` base. This pulls that 3a follow-up forward from 3c. |

## 1. Component fixes (`packages/core`, `packages/react`)

Each fix is test-first. The react package keeps 100% coverage.

### 1.1 Link inside a solid Alert (`link.css`)

```css
.bit-alert.bit-solid .bit-link,
.bit-alert.bit-solid .bit-link:visited { color: inherit; }
.bit-alert.bit-solid .bit-link:hover { background: none; text-decoration-thickness: 4px; }
```

- These rules apply to every Link colour (primary and neutral).
- Outline Alerts don't change.
- **Core test:** the rules exist, and they come after the base Link colour rules (or carry enough specificity to win).

### 1.2 Forced-colours invalid edge (`input.css`, `select.css`)

```css
@media (forced-colors: active) {
  .bit-input[aria-invalid="true"],
  .bit-select__control[aria-invalid="true"] { border-inline-start-width: 10px; }
}
```

- Core test asserts both. e2e asserts the computed width under emulation (§4).

### 1.3 Stripe token

- **Theme:** `--bit-color-stripe` is added to light (`var(--bit-palette-stone)`) and dark (`#353545`).
- **Mode tokens:** it's added to `MODE_TOKENS` in `tokens.ts`.
- **Table:** `table.css` stripes read `var(--bit-color-stripe)`.
- **Docs:** the Tokens page lists it automatically, because it reads the theme.
- **Contrast** (dark, recorded in a test comment): 1.34:1 against the surface; text 10.08:1; muted 5.20:1.

### 1.4 Dark Link hover underline

```css
[data-mode="dark"] .bit-link:hover { text-decoration-color: var(--bit-color-accent); }
```

- Light mode doesn't change. If an exact match against the existing `[data-mode]` selectors is cleaner, the rule may sit in the theme file.

### 1.5 CodeBlock Copy accessible name

- The idle `aria-label` is `Copy ${label || `${language} code`}`, for example "Copy shell code" or "Copy Install command".
- The visible text stays "Copy".
- The Copied and Failed states keep their visible text as the name.
- **Why:** pages with several CodeBlocks currently have several identical "Copy" buttons.

### 1.6 One shared live region for Copy

- **New:** `packages/react/src/system/announce.ts` exports `announce(message: string)`.
  - It lazily creates a single visually-hidden `aria-live="polite"` region at the end of `document.body`.
  - Clearing and then setting the text on the next frame makes repeats re-announce.
- **CodeBlock's CopyButton** drops its own live span and calls `announce()`.
- **The gallery's `ui/CopyButton`** imports `announce` from `@bit-ds/react`. It becomes a public export, documented as a utility, not a component.
- **Tests:** a single region exists after several announcements, and the text updates.

### 1.7 Table wrapper Tab stop

- **Today:** the wrapper is always `tabIndex={0}`, and an unlabelled wrapper raises a dev warning.
- **New:** the wrapper measures `scrollWidth > clientWidth`, using a `ResizeObserver` with a safe fallback when it's absent.
  - When it overflows, it gets `tabIndex={0}` and `role="region"`.
  - Otherwise there's no `tabIndex`.
  - A label is still forwarded when one is given.
- The dev warning is removed.
- **Tests:** overflowing and non-overflowing wrappers, with a mocked `ResizeObserver`.

### 1.8 Tokenizer: TypeScript generics

- In `tokenize.ts`, `identifier<` directly after an identifier (no space), in TS and TSX sources, is a type-argument list, not JSX.
  - Examples: `useState<string>(...)`, `Array<Item>`, `forwardRef<HTMLDivElement, Props>`.
- Type names inside the list are coloured as types (the existing type token), and `<` and `>` as punctuation.
- Real JSX (`<Button`, `<div` after `(`, `return`, `=`, `{`, `,` or a line start) is unchanged.
- **Tests:** the generic forms above, plus regressions for JSX after `return (` and `=>`.

## 2. Gallery dogfooding (`apps/gallery`)

| Where | Today | After |
|---|---|---|
| `engine/ControlsPanel.tsx` | a raw `select`, a `button` drawn as a switch, two `input`s, hand-built labels and errors | `Field` + `Select`, `Switch`, `Field` + `Input` |
| `shell/ThemeSelect.tsx` | a raw `select` | `Select` (keeping today's accessible name) |
| `shell/Header.tsx` | a raw `a` brand link | `Link asChild` around the router link, `color="neutral"` |
| `shell/Sidebar.tsx` | `NavLink` with `gallery-sidebar__link` styling | `<Link asChild color="neutral"><NavLink/></Link>`. The active state stays a gallery exception (group C). |
| `engine/Preview.tsx`, `pages/home/ComponentTiles.tsx` | `section`/`div` with card CSS | `Card` (the preview bar and the tile preview stay layout-only children) |
| Eyebrows, the sidebar title, the preview title | spans with font CSS | `Text` with the matching face and size |
| `pages/home/ComponentTiles.tsx` chips | `Link` + chip CSS | `Link` + `Badge`, or a documented exception if no bit component fits |

- **The CSS** for the hand-built versions (`gallery-control__*`, `gallery-switch*`, `gallery-chip*` where replaced, `gallery-preview` card paint, `gallery-tile` card paint, and so on) is deleted.
- **No visual change is intended.** Where a bit component looks slightly different, the bit component wins.
- **Sign-off board:** before/after screenshots at 1300px and 390px, light and dark, for Playground, Home, Tokens and the sidebar, posted at `designs/pr3b-20261004/after.html`.
- **Tests:** existing gallery tests keep passing. They're updated where they asserted the old class names, and should query by role and label instead.

## 3. Guards

### 3.1 Raw-tag lint (`eslint.config.js`)

- Applies to `apps/gallery/src/**/*.tsx`, excluding `*.test.tsx`.
- Uses `no-restricted-syntax`, one selector per tag: `JSXOpeningElement[name.name="button"]` and so on.

| Banned tag | Message |
|---|---|
| `button` | Use `<Button>` (or `<Switch>`/`<SegmentedControl>`) from @bit-ds/react |
| `a` | Use `<Link>` (with `asChild` for router links) |
| `input`, `textarea` | Use `<Input>` inside `<Field>` |
| `select` | Use `<Select>` |
| `table` | Use `<Table>` |
| `code` | Use `<Code>` |
| `pre` | Use `<CodeBlock>` |
| `h1`–`h6` | Use `<Heading>` |

- **Test:** `apps/gallery/src/lint-ban.test.ts` runs ESLint's Node API on two fixture strings: one with `<button>`, which must report, and one with `<Button>`, which must be clean.

### 3.2 `gallery.css` layout-only guard

- **New file `gallery-css.exceptions.ts`** exports `readonly { selector: string; property: string; reason: string }[]`.
  - `selector` is the full selector text as written. Rules inside an at-rule are keyed with the at-rule prefixed: `@media (forced-colors: active) <selector>`.
- **The layout allowlist** (a property name or prefix): `display`, `grid*`, `gap`, `row-gap`, `column-gap`, `flex*`, `align-*`, `justify-*`, `place-*`, `order`, `position`, `inset*`, `top`, `right`, `bottom`, `left`, `z-index`, `width`, `min-width`, `max-width`, `height`, `min-height`, `max-height`, `margin*`, `padding*`, `overflow*`, `box-sizing`, `aspect-ratio`, `contain`, `isolation`, `visibility`, `clip`, `clip-path`, `white-space`, `text-overflow`, `word-break`, `overflow-wrap`, `scroll-margin*`, `scroll-padding*`, and custom properties (`--*`).
- **The test** (in `gallery-css.test.ts`) walks every declaration with postcss:
  - **Fails** if a declaration that isn't layout has no matching exception. The message names the selector and property.
  - **Fails** if an exception matches no declaration (stale).
  - **Fails** if an exception has an empty `reason`.
- **Group B entries:** `gallery-face`, `gallery-ruler__bar`, `gallery-swatch`, `gallery-shape`, the checkerboard, and the Box outlines.
- **Group C entries:** the header and sidebar background and border, the sidebar active and hover state, focus outlines (including the tile focus ring), forced-colours rules, visually-hidden, `list-style`, `scroll-behavior`, and the skip link's slide-in transform.

## 4. Playwright (`apps/gallery/e2e`)

- **`apps/gallery/playwright.config.ts`:**
  - `webServer` builds the library and the gallery, then runs `vite preview --port 4173 --strictPort`.
  - `baseURL` is `http://localhost:4173/bit-design-system/`.
  - Chromium only, `retries: 0` locally.
- **`vite.config.ts`:** `base` is `/bit-design-system/` for `build` and `preview`, and `/` for `dev`.
  - The router's `basename` reads `import.meta.env.BASE_URL`.
  - A gallery unit test pins this.
- **New dev dependency:** `@axe-core/playwright`.
- **`e2e/routes.ts`** builds the route list from `NAV` (exported from the gallery), plus `/`, the Tokens page and one unknown path (the 404 state).
- **`e2e/a11y.spec.ts`:**
  - For each route × mode (light and dark, set the way the app stores it):
    - load the page and wait for the main heading
    - run `AxeBuilder` with the `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` and `wcag22aa` tags (contrast included)
    - expect zero violations
  - Failures print the rule id, target and summary.
- **`e2e/forced-colors.spec.ts`:**
  - With `forcedColors: 'active'`, open the Input page and set the invalid state through its control.
  - Expect the computed `border-inline-start-width` of the invalid input to be `10px`.
- **Scripts:** the root `pnpm e2e` already filters to the gallery. `playwright install chromium` is documented in `CONTRIBUTING.md`.
- **Baseline:** the first run, before the dogfooding changes, is recorded in the task report. Every violation is fixed by the end of the PR. Large surprises go to the owner instead of quietly growing the PR.

## 5. Cleanups

- Derive the Foundations page list from `NAV`, the single source the sidebar uses. Today the Typography, Spacing and Tokens pages and the sidebar each list foundations.
- `TODOS.md`: nothing in this PR closes a TODO. Add one only if the axe baseline turns up deferred work.

## Gates

- `pnpm lint`, `pnpm typecheck` and `pnpm test` are green:
  - core: at least 459 tests
  - react: at least 410 tests, at 100% coverage
  - gallery: at least 494 tests
- `pnpm e2e`: zero violations on every route in both modes, plus the forced-colours check.
- `pnpm gallery:build` and `pnpm smoke` are green.

## Out of scope (3c)

- CI workflows
- removing Storybook
- `snippets.mjs`
- the README
- the version bump
- the release and docs-deploy workflows
- publishing
