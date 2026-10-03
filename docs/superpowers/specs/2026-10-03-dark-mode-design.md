# Dark mode for bit: design

**Status:** approved in brainstorming on 2026-10-03, section by section. Awaiting the owner's review of this written spec.
**Ships as:** its own PR, after PR1 (#5, merged) and before PR2 (nine new components). PR2's components are then built and tested in both modes from the start.
**Visual reference:** the locked board is `~/.gstack/projects/doosemavis-bit-design-system/designs/dark-mode-20261003/board-v3.html`. Rounds 1–2 and `light-focus.html` record the options that were considered.

## Goal

People using bit, and visitors to the gallery, can switch between light and dark with a toggle in the top bar. A visitor whose system is set to dark lands in dark mode with no white flash. Their explicit choice is remembered across pages and reloads. Every component looks right and passes WCAG AA in both modes.

## Decisions (owner, 2026-10-03)

| # | Decision |
|---|---|
| 1 | **Audience: public in bit.** The theme service and the toggle ship in `@bit-ds/react`, and the gallery is their first user. |
| 2 | **Dark look: "Arcade Night"** (direction A). A near-black page with Slate-grey borders and hard grey shadows. Brand fills, logo golds and code colors are unchanged. |
| 3 | **Slate greys, 2% darker than round 2:** border `#79798F`, shadow `#464658`. |
| 4 | **Focus ring: one ring, no band.** Light: **violet** `#7C3AED`, 2px wide, 2px gap. Dark: **yellow** `#FFC800`, 2px wide, 1px gap. |
| 5 | **Flat solid buttons.** The gloss highlight (`--bit-gloss`) is removed in both modes, so solid buttons match badges and outline buttons. |
| 6 | **Switcher: Light / Dark.** The system setting decides until the first click. After that, the choice is remembered. There is no "System" option. |
| 7 | **Model: a mode inside the theme** (approach A). `data-theme="power-up"` picks the theme and `data-mode="light|dark"` picks the mode. Both live in `power-up.css`. |

Considered and not chosen:
- Dark as a separate theme file (themes × modes multiply, and consumers import two files).
- CSS `light-dark()` (colors only, Safari 17.5+, harder to contrast-test).
- Cartridge (black lines vanish on charcoal).
- Neon (everything reads purple).
- A yellow-only light focus ring (1.3:1 against the light page, which fails).

## 1. Tokens and the theme file

### Mode mechanism

- `power-up.css` keeps its light tokens on `:root, [data-theme="power-up"]` and adds `color-scheme: light`.
- A dark block, `[data-mode="dark"] { color-scheme: dark; … }`, overrides only the mode tokens listed below. It applies on the root or on any element, so a subtree can be dark inside a light page, for example a dark preview in the gallery.
- Logged limit: when a second theme exists, the dark selector must be scoped per theme. That is revisited then.

### Token changes (tier 2, public)

| Change | Token | Light | Dark |
|---|---|---|---|
| new | `--bit-color-line` (every component border) | `var(--bit-color-ink)` = `#151515` | `#79798F` |
| new | `--bit-color-shadow` (the `--bit-shadow-sm/md/lg` tokens are built from it) | `#151515` | `#464658` |
| new | `--bit-focus-ring-color` | `#7C3AED` | `#FFC800` |
| new | `--bit-focus-ring-width` | `2px` | (same) |
| new | `--bit-focus-ring-offset` | `2px` | `1px` |
| removed | `--bit-focus-band` | (gone) | (gone) |
| removed | `--bit-gloss` | (gone) | (gone) |

`SEMANTIC_TOKENS` changes from 84 to 87: +line, +shadow, +3 focus-ring tokens, −focus-band, −gloss.

`--bit-color-ink` stays `#151515` in both modes. It remains the dark ink used for text on bright fills and for selected text. It no longer draws borders.

### Dark block values (`MODE_TOKENS`, the exact set the dark block declares)

| Token | Dark value |
|---|---|
| `--bit-color-bg` | `#15151C` |
| `--bit-color-surface` | `#20202A` |
| `--bit-color-text` | `#EDEBE4` |
| `--bit-color-text-muted` | `#A9A9BC` |
| `--bit-color-line` | `#79798F` |
| `--bit-color-shadow` | `#464658` |
| `--bit-color-neutral` / `-contrast` / `-hover` / `-soft` | `#2B2B37` / `#EDEBE4` / `#343442` / `#2B2B37` |
| `--bit-color-primary-soft` | `#2E2352` |
| `--bit-color-success-soft` | `#173A25` |
| `--bit-color-warning-soft` | `#3B3212` |
| `--bit-color-danger-soft` | `#40191B` |
| `--bit-shadow-inset` | `inset 3px 3px 0 rgba(0, 0, 0, 0.4)` |
| `--bit-code-bg` | `#0B0B10` |
| `--bit-focus-ring-color` | `#FFC800` |
| `--bit-focus-ring-offset` | `1px` |

Unchanged in dark: the fills, contrast colors and hovers of primary, success, warning and danger; selection; the logo coins; every `--bit-code-*` text color; type, space, radius, control and motion tokens.

### CSS changes

- **`reset.css` draws the one ring:** `:focus-visible { outline: var(--bit-focus-ring-width) solid var(--bit-focus-ring-color); outline-offset: var(--bit-focus-ring-offset); }`. The scoped programmatic-focus rule from PR1 stays.
- **Every component border reads `--bit-color-line` instead of `--bit-color-ink`.** That covers button, badge, alert, card and spinner.
- **The logo:** its era outlines and drop shadows are checked on the dark page in a real browser. If they vanish, they read `--bit-color-shadow` instead of ink. Light rendering is unchanged.
- **`button.css` loses the band machinery:** the `--_bit-focus-band` reset, the band layer in every box-shadow, and the `:focus-visible` band rule all go. It also loses `var(--bit-gloss)`.

## 2. The theme service (public, `@bit-ds/react`)

| Export | What it is |
|---|---|
| `type ColorMode = 'light' \| 'dark'` and `COLOR_MODES` | The two modes. |
| `useColorMode(): { mode: ColorMode; setMode(mode: ColorMode): void }` | A hook backed by one module-level store. It uses `useSyncExternalStore`, so it needs no provider and every caller stays in sync. |
| `COLOR_MODE_STORAGE_KEY = 'bit-color-mode'` | The `localStorage` key. Only an explicit choice is stored. |
| `COLOR_MODE_SCRIPT` | A string holding a tiny self-contained script for `<head>`. It sets `document.documentElement.dataset.mode` before first paint: the stored choice if valid, otherwise the OS preference (`prefers-color-scheme: dark`), otherwise `light`. |
| `<ModeToggle size?: 'sm' \| 'md' />` | The pill: "☀ Light" and "☾ Dark" as two `<button>`s in a labelled `role="group"` (default label "Color mode"). The active button has `aria-pressed="true"` and the warning-yellow fill. Root class `bit-mode-toggle`, with its CSS in core. |

Behavior:
- **No stored choice:** the mode follows the OS preference, and it follows live OS changes too.
- **After `setMode`:** the choice is stored and the page root gets `data-mode`. OS changes are then ignored.
- **The store's initial value** is whatever `data-mode` the script set. If the script didn't run, the store resolves the mode the same way the script does.

Error handling:
- **`localStorage` throws or is unavailable:** the mode works in memory for the visit and isn't remembered. Nothing throws.
- **No `window` (SSR or node):** the hook returns `light`, `setMode` does nothing, and the server snapshot is `light`.
- **No `matchMedia`:** the mode falls back to `light`.

Not in scope: a "System" option, per-component mode props, and more than two modes.

## 3. Gallery changes

- **Header:** the `<ModeToggle size="sm" />` sits next to the GitHub button.
- **`ThemeSelect`:** it renders only when there is more than one *theme*. This pulls plan §H.5 forward from PR3, because a one-option dropdown next to the pill would look broken.
- **`index.html`:** `COLOR_MODE_SCRIPT` goes inline in `<head>`, before the CSS. A test asserts the inline copy matches the export.
- **`gallery.css`:** borders read `--bit-color-line`. The existing gallery.css token test catches any unknown name.
- **ModeToggle manifest:** ModeToggle gets one, in group `components`, because the contract test requires every component export to have one. Its preview really switches the site's mode.
- **Unchanged:** component pages, previews and code need no changes. Storybook only has to keep building, since PR3 removes it.

## 4. Testing and done criteria

**Core**
- The completeness test checks two things: the light block declares every `SEMANTIC_TOKENS` name, and the dark block declares exactly `MODE_TOKENS`.
- Every contrast check runs twice: on light, and on light with the dark overrides applied. New checks:
  - focus ring vs page and surface ≥ 3:1
  - line vs page ≥ 3:1
  - text on every soft background ≥ 4.5:1
- Tests assert there is no band, no gloss, and no component `outline:`.
- A frozen light-values test proves light is unchanged apart from three intended changes: the violet ring, the 2px ring, and no gloss.

**React**
- `useColorMode` is tested for:
  - OS-follow before any choice
  - a remembered choice
  - live OS change ignored after a choice
  - storage throwing
  - no `window`
- `COLOR_MODE_SCRIPT` is executed in jsdom with stubbed storage and `matchMedia`, and the test checks the `data-mode` it sets.
- `ModeToggle` is tested for:
  - `aria-pressed`
  - click switches the mode
  - keyboard
  - axe clean in both modes

**Gallery**
- The header shows the toggle, and a click flips `data-mode` on `<html>`.
- The choice survives a remount.
- The route smoke test (axe on every page) runs in both modes.
- The `index.html` script matches the export.

**By eye:** before the PR, every component page is screenshotted in both modes in a real browser and assembled into a board for the owner to sign off.

**Done:** a visitor with a dark OS lands on Arcade Night with no white flash. Clicking "☀ Light" keeps light on every page and after a reload. Every color pair passes AA in both modes, and the gates are green. Those gates are build, verify, typecheck, lint, the core/react/gallery tests, smoke, and the Storybook build.

## Effects on later work

- **PR2:** interactive components no longer thread a focus band. They get the ring from `reset.css`. The PR2 checklist in memory is updated to match.
- **Breaking for consumers** (0.x, unpublished):
  - `--bit-gloss` and `--bit-focus-band` are removed.
  - Borders read `--bit-color-line`. It equals ink in light, so light rendering is unchanged.
