# The bit wordmark: design

**Status:** approved in brainstorming on 2026-10-03. Awaiting the owner's review of this written spec.
**Ships as:** its own PR, after dark mode (#6, merged) and before PR2 (nine new components).
**Visual reference:** the boards are in `~/.gstack/projects/doosemavis-bit-design-system/designs/logo-20261003/`:
- `board.html`: layout. B was chosen.
- `board-2.html`: colors and transition. C1 and T1 were chosen; the transition was later replaced by the page-load change below.
- `board-3.html`: the 32-bit font. F1, Audiowide, was chosen.

## Goal

`BitLogo` becomes a real brand mark for `@bit-ds`: a big **bit** with a small **DESIGN SYSTEM** caption underneath. The word "bit" is drawn in one of four console-era styles: 8-bit, 16-bit, 32-bit and 64-bit. Each page load shows the next era in order.

Removed: the era number (8/16/32/64), the "-bit" suffix, the timed cycle, and the NES grow ("level up") animation. Nothing on the logo moves.

## Decisions (owner, 2026-10-03)

| # | Decision |
|---|---|
| 1 | **Layout B, stacked.** A big era-styled **bit** sits over a small, steady **DESIGN SYSTEM** caption in pixel type. Both are left-aligned. |
| 2 | **Colors C1, Classic.** The era treatments keep today's colors: 8-bit red, 16-bit shaded gold, 32-bit blue chrome, 64-bit extruded gold. |
| 3 | **Every era is lowercase.** 32-bit moves from Bungee, which has capitals only, to **Audiowide**. The chrome and bevel are unchanged. |
| 4 | **The era changes on page load, in order.** Each load or refresh shows the next era: 8 → 16 → 32 → 64 → 8. The browser remembers the last one. There is no timer, and the logo never changes while someone is looking at it. |
| 5 | **The still era is 64-bit.** It is the fallback wherever the rotation can't run. |
| 6 | **Sizes, bigger as asked.** **bit** renders at 32px for `sm` (header), 48px for `md` and 72px for `lg` (Home). The caption scales with it. |

Considered and not chosen:
- Layout A, one line: too wide for the header.
- Layout C, side by side.
- Brand-violet and all-gold palettes.
- Crossfade and pixel-wipe transitions.
- A timed cycle, which owner decision 4 replaced.
- Russo One and Righteous for 32-bit.

## 1. Component API (`@bit-ds/react`)

```ts
export const ERAS = [8, 16, 32, 64] as const;   // unchanged; now names the era styles
export type Era = (typeof ERAS)[number];         // unchanged
export const LOGO_ERA_STORAGE_KEY = 'bit-logo-era';

export interface BitLogoProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'color'> {
  size?: Size;   // 'sm' | 'md' | 'lg', default 'md'
  era?: Era;     // pin one era; omit to use the page-load era
}
```

- **Removed props:** `interval` and `animated`, because nothing animates. `freeze` is renamed to `era`, since there's no cycle left to freeze. This is breaking, but the package is 0.x and unpublished.
- **Rendered markup:**
  ```html
  <span role="img" aria-label="bit Design System" class="bit-logo bit-md" data-era="32">
    <span class="bit-logo__word" aria-hidden="true">bit</span>
    <span class="bit-logo__caption" aria-hidden="true">Design System</span>
  </span>
  ```
  Only the current era is rendered, not a stack of four.
- **`className`, `style`, `ref` and the rest props** pass through as they do today. `dropLegacyColor` stays.

## 2. The page-load era

Behavior:
- **One era per page load, shared.** It's held at module level, so the header logo and the Home logo always match.
- **Choosing the era:** on first read, the logo reads `localStorage['bit-logo-era']` and moves to the next era in `ERAS`, wrapping 64 → 8. It writes that era back.
- **Missing or invalid stored value:** the era is `8`, the start of the sequence.
- **`era` prop set:** that era is shown, nothing is read or written, and the rotation is unaffected.

The hook:
- `useSyncExternalStore` with a no-op subscribe, the page-load era as the client snapshot, and `64` as the server snapshot.
- **SSR:** it renders 64-bit, then switches to the page-load era when it hydrates. A client-only app shows no change.
- **Tests:** an internal `resetLogoEra()` clears the cached value. It is not exported from the package index, the same pattern as `resetColorModeStore`.

Error handling:
- **`localStorage` throws or is unavailable:** the era is `64` on every load. Nothing throws.
- **No `window` (SSR or node):** the era is `64`.

## 3. CSS (`@bit-ds/core`)

**`components/logo.css`:**
- **Remove:** the slot grid, the suffix, the `data-animated` cycle rules, the `bit-logo-cycle` keyframes, the reduced-motion block (nothing moves), and `--_bit-logo-interval`.
- **Root:** `.bit-logo` is an `inline-flex` column, aligned to the start, with a gap of `0.18em`. Its `font-size` is set per size:
  - `sm`: `var(--bit-text-32px)`
  - `md`: `calc(var(--bit-text-32px) * 1.5)`
  - `lg`: `calc(var(--bit-text-32px) * 2.25)`
- **`.bit-logo__word`:** `line-height: 1`.
- **Era treatments** move to `.bit-logo[data-era="N"] .bit-logo__word` and keep today's values, with these exceptions:
  - 8 and 16: `font-size: 0.82em`, because Press Start 2P draws large.
  - 32: `font-family: "Audiowide", var(--bit-font-display)` and `font-size: 1em`, with the same chrome gradient and bevel.
  - 64: `font-size: 1.04em`, unchanged.
- **`.bit-logo__caption`:**
  - `font-family: var(--bit-font-pixel)`
  - `font-size: 0.25em` (8px at `sm`, 12px at `md`, 18px at `lg`)
  - `letter-spacing: 0.18em`
  - `text-transform: uppercase`
  - `color: var(--bit-color-text-muted)`
  - `line-height: 1`
  - `white-space: nowrap`

**Other files:**
- **`system/motion.css`:** delete `@keyframes bit-power-up` and its comment. `bit-spin` and the global reduced-motion rule stay.
- **`themes/power-up.css`:** delete `--bit-motion-power-up`. In the Google Fonts `@import`, swap `family=Bungee` for `family=Audiowide`.
- **`tokens.ts`:** delete `token('motion', 'power-up')`. `SEMANTIC_TOKENS` goes from 87 to 86.

## 4. Gallery, Storybook, README

- **Header and Home** keep `<BitLogo size="sm" />` and `<BitLogo size="lg" />`. Their markup is unchanged.
  - The header grows to fit the stacked mark (about 48px tall at `sm`). The screenshot board checks that it stays tidy.
- **Logo manifest:**
  - Description: `bit, with "Design System" beneath. Each page load shows the next era: 8 → 16 → 32 → 64. era pins one.`
  - Controls: `size` (axis), plus `era` (select of `none, 8, 16, 32, 64`, default `none`, numeric).
  - Presets: `Pinned at 32-bit` sets `{ era: '32' }`.
- **Gallery tests** that used the logo's `interval`, `animated` or `freeze` as fixtures switch to the new `era` control, or to a synthetic manifest where a test needs a number or boolean control.
- **Storybook:** stories show each era pinned and each size. It only has to keep building, because PR3 removes it.
- **`assets/bit-logo.svg`** (README) becomes a **static 64-bit stacked mark**. An image can't rotate per page load, and a timed animation would contradict decision 4.
  - `scripts/build-logo-svg.mjs` embeds only Lilita One (the word) and Press Start 2P (the caption).
  - The `@fontsource/bungee` dev dependency is removed.
- **`verify-dist.mjs`:** the `@keyframes bit-power-up` needle becomes `.bit-logo__caption`.
- **README:** no text change. The BitLogo props are documented by the gallery.

## 5. Testing and done criteria

**React (`BitLogo.test.tsx`, coverage stays at 100%)**
- **Markup:** it renders `role="img"` with the name "bit Design System". The word is "bit" and the caption is "Design System", and both are `aria-hidden`.
- **`era` prop:** it sets `data-era` and touches no storage.
- **Rotation:**
  - Empty storage gives 8 and stores 8.
  - Stored 8 gives 16, stored 32 gives 64, and stored 64 gives 8.
  - An invalid stored value gives 8.
- **Shared era:** two logos on one page show the same era. A second read doesn't advance it.
- **`localStorage` throws:** the era is 64 and nothing throws.
- **Server render:** `renderToString` gives 64.
- **Sizes and pass-through:** `size` sets the size class, and `className`, `style` and `ref` pass through.
- **axe:** clean.

**Core**
- `logo.css` contains no `animation`, `@keyframes` or `transform`.
- The 32-bit rule names Audiowide, and nothing under `packages/` or `scripts/` names Bungee (old docs keep their history).
- `motion.css` has no `bit-power-up`.
- The theme doesn't declare `--bit-motion-power-up`.
- `SEMANTIC_TOKENS` has 86 names, and the completeness tests pass in both modes.
- The caption's muted text keeps ≥ 4.5:1 on both pages. Existing contrast tests cover this.

**Gallery**
- The manifest contract test and the route smoke test (axe, both modes) pass.
- The Logo page's `era` select pins the preview.

**By eye:** before the PR, a board shows every era × size × mode, plus the header and Home in both modes, for the owner to sign off.

**Done:** loading the gallery four times shows 8, 16, 32 and 64 in turn, and the 32-bit is lowercase. Every gate is green: build, verify, typecheck, lint, the core, react and gallery tests, smoke, and the Storybook build.

## Effects on later work

- **PR2:** components no longer have a `bit-power-up` animation available. None planned to use it.
- **The memory note about centring the logo on the hyphen** is superseded by this spec.

## Amendment 1 (owner, 2026-10-03, at the sign-off board)

Boards `board-4.html` and `board-5.html` showed the owner the built logo in place. The owner changed three things. **These supersede the conflicting lines above.**

| # | Change | Supersedes |
|---|---|---|
| A1 | **Side-by-side lockup everywhere.** "DESIGN" and "SYSTEM" stack in two lines to the **right** of "bit", centred vertically on the word, with no divider. The gap between the word and the caption is board-5's S3 spacing without the rule: `0.4em` of the root. | Decision 1 (stacked, caption beneath) and §3's column root and `0.18em` gap |
| A2 | **Home: the logo is the page heading.** The visible "bit" `<h1>` text goes. The `<h1>` wraps `<BitLogo size="lg" />`, so its accessible name is "bit Design System". The navigation focus-to-heading behaviour is unchanged. | §4 "Header and Home … markup unchanged" (Home only) |
| A3 | **README card is snug:** about 270–300px wide, even margins, side-by-side lockup. | §4 README image width (320) |

What A1 means in CSS:
- **`.bit-logo`:** `flex-direction: row; align-items: center; gap: 0.4em`. The `color` and `white-space` stay.
- **`.bit-logo__caption`:**
  - wraps onto two lines through `width: min-content` and `white-space: normal`, so the markup stays one text node, "Design System"
  - `font-size: 0.26em`
  - `letter-spacing: 0.14em`
  - `line-height: 1.3`
  - pixel font, uppercase and muted colour are kept

Accessibility and markup are otherwise unchanged:
- the root's accessible name is "bit Design System"
- the word and the caption are `aria-hidden`
- `data-era` is on the root

**Header:** the logo gets shorter than the stacked version, because no line sits below the word.

## Amendment 2 (owner, 2026-10-03, at the second sign-off board)

| # | Change | Supersedes |
|---|---|---|
| B1 | **Every era is the same size and width.** 32-bit and 64-bit match 8-bit and 16-bit in two ways. First, the visual height of "bit" (the ascender of "b" and "t" from the baseline) is the same. Second, the word is just as **wide**, so the gap between "bit" and "DESIGN / SYSTEM" looks the same in every era. 32 and 64 reach that width with per-era `letter-spacing`, not by stretching. A page load changes only the era's style, never the logo's size or the caption's position. | §3's per-era word sizes (`0.82em` / `1em` / `1.04em`) |
| B2 | **Placement sizes stay:** `sm` in the header and `lg` on Home. `size` is placement only, and nothing about size animates. | (confirms §1) |
| B3 | **The gallery header loses the "gallery" label** beside the logo. The header link around the logo is unchanged, and so is the tab title "bit — component gallery". | §4 header |

The reference box is the 8-bit word: Press Start 2P "bit" at `0.82em`. Its ink height and advance width are the targets. 16-bit already matches it, because it uses the same font at the same size. 32-bit (Audiowide) and 64-bit (Lilita One) each get two values, both measured in a real browser and recorded in the CSS comments:
- a `font-size`, so the ink height of "bit" matches
- a `letter-spacing`, so the word's width matches

The README image (64-bit only) uses the same 64-bit ratios.
