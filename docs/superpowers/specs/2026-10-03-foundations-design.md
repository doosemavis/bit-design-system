# Foundations: Heading, Box, and the Typography and Spacing pages, design

**Status:** approved in brainstorming on 2026-10-03, on two boards. This written spec awaits the owner's review.

**Ships as:** its own PR on `feat/foundations`, after PR2 (#8, merged) and before PR3, which brings the final pages, the dogfooding lint, the release and the first npm publish.

**Visual reference:** `~/.gstack/projects/doosemavis-bit-design-system/designs/foundations-20261003/`
- `board.html`: heading scale H1 was chosen, and Box props were extended to all four sides.
- `board-2.html`: the two new gallery pages.

## Goal

Before the first npm publish, bit gives consumers a native way to do two things without utility classes:
- **Set headings:** semantic levels, styled from the existing type scale.
- **Space a box:** padding and margin on the existing space scale.

The gallery gains Typography and Spacing guide pages under Foundations. The 2026-09-06 spec's decision to reject utility-first classes stands. Both new components follow bit's prop → data attribute → token rule, the same as Stack's `gap`.

## Decisions (owner, 2026-10-03)

| # | Decision |
|---|---|
| 1 | **Heading scale uses today's type scale (board option H1).** No new tokens. |
| 2 | **Box spacing props cover all four sides,** plus the X and Y shorthands, for both padding and margin. |
| 3 | **Typography and Spacing are new pages in the Foundations sidebar group,** alongside Tokens. Heading and Box also get normal component pages, with playgrounds, under Components. |

## 1. `Heading` (`bit-heading`)

```ts
type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
interface HeadingProps extends Omit<HTMLAttributes<HTMLHeadingElement>, 'color'> {
  level: HeadingLevel;    // required; renders <h{level}>
  size?: HeadingLevel;    // optional visual level; defaults to `level`
}
```

**Markup:** `<h{level} class="bit-heading" data-level={size ?? level}>`. The ref, `className` and rest props go on the heading, and `dropLegacyColor` is applied to rest.
- `level` decides the tag, so the outline stays correct.
- `size` decides the look, so an h2 can look like an h3.
- An unknown `level` or `size` follows the existing `dataValue` rule: the attribute is dropped and a dev warning fires. With `level` unknown, the tag falls back to `h2`.

**Look (`components/heading.css`):**
- `margin: 0`, because spacing belongs to Stack and Box.
- `color: var(--bit-color-text)`.

| `data-level` | Font | Size | Weight | Line height | Extra |
|---|---|---|---|---|---|
| 1 | `--bit-font-display` | `--bit-text-32px` | 400 | `--bit-leading-tight` | `letter-spacing: 0.01em` |
| 2 | display | `--bit-text-24px` | 400 | tight | `0.01em` |
| 3 | display | `--bit-text-18px` | 400 | tight | `0.01em` |
| 4 | `--bit-font-body` | `--bit-text-15px` | `--bit-weight-bold` | `1.3` | none |
| 5 | body | `--bit-text-13px` | bold | `1.3` | none |
| 6 | `--bit-font-pixel` | `--bit-text-11px` | 400 | `1.4` | `text-transform: uppercase; letter-spacing: 0.08em` |

- **Display weight:** display levels use weight 400 because the display face ships one weight. This is the same rule `text.css` uses to avoid a synthesized bold.
- **Base rule:** with no `data-level`, the heading renders like level 2. That base rule is the h2 look.

## 2. `Box` (`bit-box`)

```ts
type Space = 0 | SpaceStep; // 0, 4, 8, 12, 16, 24, 32, 48, 64
interface BoxProps extends Omit<HTMLAttributes<HTMLElement>, 'color'> {
  as?: 'div' | 'section' | 'article' | 'aside' | 'header' | 'footer' | 'main' | 'nav' | 'span'; // default 'div'
  padding?: Space;  paddingX?: Space;  paddingY?: Space;
  paddingTop?: Space;  paddingRight?: Space;  paddingBottom?: Space;  paddingLeft?: Space;
  margin?: Space;   marginX?: Space;   marginY?: Space;
  marginTop?: Space;   marginRight?: Space;   marginBottom?: Space;   marginLeft?: Space;
}
```

**Markup:** `<{as} class="bit-box">` with one data attribute per prop that is passed. The attribute names are:

| Padding prop | Attribute | Margin prop | Attribute |
|---|---|---|---|
| `padding` | `data-p` | `margin` | `data-m` |
| `paddingX` | `data-px` | `marginX` | `data-mx` |
| `paddingY` | `data-py` | `marginY` | `data-my` |
| `paddingTop` | `data-pt` | `marginTop` | `data-mt` |
| `paddingRight` | `data-pr` | `marginRight` | `data-mr` |
| `paddingBottom` | `data-pb` | `marginBottom` | `data-mb` |
| `paddingLeft` | `data-pl` | `marginLeft` | `data-ml` |

The prop names are the public API. The short attribute names keep the DOM compact, and the gallery's HTML tab shows them.
- **Values:** go through `dataValue`. An unknown value drops the attribute and fires a dev warning.
- **Ref, `className`, rest:** all go on the element, and `dropLegacyColor` is applied to rest.

**Look (`components/box.css`):**
- `.bit-box` itself sets **nothing**; there is no base rule. A plain Box is an unstyled `div`: no colors, borders or shadows, which is Card's job.
- Per prop and value, the rule is `.bit-box[data-<attr>="<n>"] { <property>: var(--bit-space-<n>px); }`. A value of `0` sets `0`.
- **Precedence: the most specific prop wins,** regardless of the order the props are written. The CSS is ordered in three tiers of equal specificity, and the later tier wins:
  1. all sides (`p`, `m`)
  2. the axes (`px` and `py`, `mx` and `my`)
  3. single sides

  So `paddingTop` beats `paddingY`, which beats `padding`.
- The axis and side rules use physical properties: `padding-left` and `padding-right` for X, matching the prop names.

## 3. Gallery

**Component pages:** Heading and Box each get a manifest in `apps/gallery/src/manifests/`, in group `components`.
- **Heading manifest:**
  - controls: `level` (select 1–6, numeric, `alwaysPrint`), `size` (select `none` or 1–6, numeric), `children` (text, default "Build with bit")
  - preset: "h2 that looks like h3"
- **Box manifest:**
  - controls: `padding`, `paddingX`, `paddingY`, `margin`, `marginTop` (selects of `none`, 0, 4…64, numeric) and `as`
  - the preview child is a Badge or a short Text, so the padding is visible
  - The preview stage outlines the Box with a gallery-only dashed accent, so the space can be seen. The outline is styled in `gallery.css`, reading tokens only.

**New pages:** routes `/typography` and `/spacing`, with sidebar entries under Foundations in this order: Tokens, Typography, Spacing. Both pages are built only from bit components: Heading, Text, Card, Table, Code, CodeBlock, Stack and Box. They contain:
- **Typography:**
  - the faces (four cards: display, body, pixel, mono, each with its token and use)
  - the heading levels (a Table of example, tag/size/face and code)
  - the Text sizes (18, 15, 13 muted)
  - Do and Don't (Alerts or Cards in success and danger soft)
- **Spacing:**
  - the scale (a ruler of eight bars with their tokens)
  - "Stack or Box?" (two Cards with live examples and CodeBlocks)
  - the Box props Table
  - the precedence note

Layouts follow `board-2.html`.

**Unchanged:** the Tokens page.

## 4. Testing and done criteria

**React** (100% coverage kept):
- **Heading:** the tag follows `level`; `data-level` follows `size ?? level`; an invalid `level` or `size` is dropped with a warning and falls back to `h2`. Ref, `className` and rest props land on the heading. axe passes on all six levels.
- **Box:** each of the 14 props emits its attribute; `0` emits `"0"`; an invalid value is dropped with a warning; `as` changes the element. Ref, `className` and rest props land on the element. axe passes.

**Core:**
- `heading.css` and `box.css` read only declared tokens, and neither sets `outline`.
- Heading: each level's declarations match the table, and display levels use weight 400.
- Box: a rule exists for every attribute × value (14 × 9), the tiers come in the order all, then axis, then side, and no `.bit-box` rule sets anything other than padding or margin.

**Gallery:**
- The manifest contract test passes, and the route smoke test runs axe on `/typography`, `/spacing`, `/components/heading` and `/components/box`.
- The sidebar lists Tokens, Typography and Spacing under Foundations.

**By eye:** a real-browser board of both pages and both component pages, in light and dark, for the owner's sign-off.

**Done:** Heading and Box are public, giving 27 components, and every gate is green: build, verify, typecheck, lint, tests, coverage, smoke, `storybook:build`.

## Effects on later work

- **PR3:**
  - The dogfooding lint can require `Heading` for gallery titles, which today are `Text as="h1"`.
  - The Home page's title layout is unchanged; the logo is already the h1.
