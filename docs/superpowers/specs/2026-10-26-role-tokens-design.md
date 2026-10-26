# Role tokens (workbench PR C, release 0.1.12)

**Status:** owner picked corners option A on 2026-10-26 ("keep every pixel"). Roadmap: `docs/superpowers/plans/2026-10-24-workbench.md`, PR C.

## Why

A theme should change roles (how round a button is, how far a card floats), not sizes. Today component CSS reads the
size scale directly (`--bit-radius-10px`, `--bit-shadow-md`), so the only way to make buttons squarer is to set
`--bit-radius-10px: 4px`, which breaks the naming rule and also squares every other 10px thing. PR D's theme drawer
needs knobs that each move one role. This PR adds role tokens that point at the scale, and switches component CSS to
them. Nothing renders differently.

## Goals

- Nine role tokens in `tokens.ts` and power-up tier 2, each pointing at today's scale step.
- Every corner and shadow in component CSS reads a role token, never a size step.
- Not one pixel changes, in light or dark. Proven by a frozen unit table (CI) and a local pixel diff.
- The Tokens page shows each role and the step it equals.
- Release 0.1.12: CHANGELOG, version, lockfile.

## Non-goals

- No new values, no theme changes, no visual change. Option A was picked precisely so nothing moves.
- The drawer (PR D). This PR only gives it something to turn.
- The Passes anatomy data (roadmap C4). It lives on the unmerged Passes branches (#91, #95), whose future the owner
  hasn't decided. Whoever lands those later renames the tokens there; the anatomy guard flags every miss.
- Gallery CSS keeps reading the scale. It's the docs site's own chrome, not a component, and isn't themed by the drawer.
- The outline-shadow offsets (TODOS "Tokens: outline shadow offsets") stay as they are.

## Anti-goals

- A rendered change anywhere, in any mode. If the pixel diff shows one, the mapping is wrong, not the baseline.
- A role token a theme can't reason about: each one names what it styles, not where it sits in the scale.

## The tokens (owner ruling: option A)

| Role token | power-up value | Read by |
|---|---|---|
| `--bit-radius-control` | `var(--bit-radius-10px)` | Button, Input, Select's control, Textarea (and its scrollbar), SegmentedControl's options, Slider's number-box step buttons and unit tab |
| `--bit-radius-surface` | `var(--bit-radius-10px)` | Alert, CodeBlock, Dialog, Menu, Navbar, Select's list, Table, Tabs' slot and panel |
| `--bit-radius-card` | `var(--bit-radius-14px)` | Card |
| `--bit-radius-chip` | `var(--bit-radius-6px)` | Badge and Avatar (square shape), Code, CodeBlock's copy button, Checkbox box, Menu items, Navbar bar links, Select options, Slider thumb, bubble and blocks, Tabs' tab and label, Tooltip |
| `--bit-shadow-control` | `var(--bit-shadow-md)` | Button (and solid), SegmentedControl's options |
| `--bit-shadow-control-hover` | `var(--bit-shadow-sm)` | the solid Button on hover (it sinks one press offset, so its shadow shrinks by the same amount) |
| `--bit-shadow-surface` | `var(--bit-shadow-md)` | Alert (solid), CodeBlock, Menu, Navbar, Select's list, Table, Tabs' slot and panel |
| `--bit-shadow-raised` | `var(--bit-shadow-lg)` | Card (solid), Dialog |
| `--bit-shadow-chip` | `var(--bit-shadow-sm)` | Avatar, Badge, Checkbox box, ModeToggle, Navbar bar's current link, Radio dot, Slider thumb and blocks, Switch track |

The roadmap listed five names (control, surface, chip radii; control, surface shadows). Its table assumed Alert,
CodeBlock, Table and Dialog sat at 14px with Card; they are 10px, so option A gives Card its own `radius-card`. The
other three shadow names are my calls (see "Calls"), needed so the guard can ban `sm`/`md`/`lg` in component CSS
without changing a pixel.

**Unchanged:** `--bit-radius-full` (a shape, the pill, not a size) and `--bit-shadow-inset` (already a role: the
field well). Component CSS keeps reading both. `--_bit-lift` and `--_bit-lift-radius` (the focus-ring shadow move)
read the same role as the declaration they shadow.

**Where they're declared:** power-up's first token block (tier 2: shape, after the scale). That block also matches
the bare mode selectors, so a role token re-resolves in a dark subtree just as the scale shadows do. The dark block
doesn't declare them: they aren't mode tokens (MODE_TOKENS stays as is).

**Export:** `tokens.ts` adds `ROLE_TOKENS` (the nine names, in the order above) and spreads it into
`SEMANTIC_TOKENS` after the shape tokens. `SEMANTIC_TOKENS` goes from 110 to 119. `@bit-ds/react` re-exports
`ROLE_TOKENS` beside `SEMANTIC_TOKENS`.

## Proving nothing moved

1. **Frozen declaration table (unit, CI, stays).** Before any CSS changes, generate a table of every component and
   system CSS declaration that reads a radius or shadow token: file, selector, property, and its value resolved
   through power-up, in light and in dark. After the switch, the same declarations must resolve to the same values.
   Same contract as `px-rename.test.ts`: never edit a row to make it pass.
2. **Guard (unit, CI, stays).** No file under `packages/core/src/components/` or `system/` reads
   `--bit-radius-{n}px` or `--bit-shadow-{sm|md|lg}`. The failure names the file, line and token, and the role to use.
3. **Pixel diff (Playwright, local only, this PR only).** Screenshot every component page's Variants section and
   the Tokens page, light and dark, on the base build; switch; compare byte for byte. Gated by an env var so CI
   skips it, and deleted in the last task. Its baselines live in the git-ignored `.superpowers/` workspace.

## Tokens page

The shape section's radius card keeps listing the scale (`6`, `10`, `14`, `full`) and the shadow card keeps `sm`,
`md`, `lg`, `inset`. A new **roles** card lists the nine role tokens, each with a preview drawn with that token, its
name, its value, and the scale token it equals (found by matching computed values, so another theme's file shows
its own mapping; no match shows just the value). Copy works as on every other row.

## Docs and release

- **CHANGELOG `## 0.1.12`:**
  - *Added:* the nine role tokens and `ROLE_TOKENS`. The size scale is unchanged.
  - *Changed:* components read role tokens now, so overriding a size token on part of a page (say
    `--bit-radius-10px` on one section) no longer reaches the components there. Override the role token instead
    (`--bit-radius-control`).
- `packages/react/package.json` 0.1.12 and the lockfile, as in the 0.1.11 release PR.
- ARCHITECTURE tier 2 and CONTRIBUTING "writing a theme": one line each on role tokens.
- No tag in this PR. The tag waits for the workbench bulk merge, and the npm token has to be fixed first (it
  expires about 2026-11-02; see TODOS "trusted publishing").

## Calls I made (owner can overrule)

- `--bit-shadow-control-hover`, so a theme that changes button shadows keeps the hover drop matched.
- `--bit-shadow-raised` (Card and Dialog) and `--bit-shadow-chip` (small parts), so no component reads `sm`/`md`/`lg`.
- Tooltip, Code, tabs and menu items are chips; the Slider's number box parts are controls.
- `radius-full` and `shadow-inset` stay as they are.
- The anatomy rename (C4) waits for the Passes decision.
- The pixel diff is local and temporary; the frozen table is what CI keeps.

## Left to the builder

Commit granularity inside a task, the frozen table's file layout, and the pixel spec's page list beyond "every
component page and the Tokens page".
