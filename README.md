<p align="center"><img src="assets/bit-logo.svg" width="353" alt="bit Design System"></p>

# bit

A React design system for people who are new to design systems. One vocabulary everywhere: the prop you type is the class it emits is the token it reads.

```tsx
<Button color="primary" size="lg">Save</Button>
// renders: <button class="bit-button bit-primary bit-solid bit-lg">
// reads:   --bit-color-primary, --bit-control-height-lg
```

Themes are swappable and named after retro-game eras. The first theme is **power-up**.

## Install

The packages are workspace-private for now. Clone the repo and run Storybook:

```bash
pnpm install
pnpm storybook
```

When published, using it will be three lines:

```tsx
import '@bit-ds/react/themes/power-up.css';
import '@bit-ds/react/styles.css';
import { Button } from '@bit-ds/react';
```

## The naming rule

| You write | Class | Token |
| --- | --- | --- |
| `color="primary"` | `bit-primary` | `--bit-color-primary` |
| `variant="outline"` | `bit-outline` | (per component CSS) |
| `size="lg"` | `bit-lg` | `--bit-control-height-lg` |
| `<CardHeader>` | `bit-card__header` | |

Three axes, same names on every component that has them:

- `color`: `primary` `neutral` `success` `warning` `danger`
- `variant`: `solid` `outline` `ghost`
- `size`: `sm` `md` `lg`

Booleans are attributes, never classes: `disabled`, `aria-invalid`, `data-loading`.

A decorator in `className` replaces the prop's decorator for that axis: `<Button className="bit-danger">` is a danger button.

## Two ways to use every static component

```tsx
<Card><CardHeader>Stats</CardHeader></Card>
<div className="bit-card bit-solid"><div className="bit-card__header">Stats</div></div>
```

Both render identically. For interactive components (Switch, SegmentedControl, CodeBlock's Copy button) the classes give the look; the React component gives the keyboard and screen-reader behavior.

## Components

- **Actions and status:** Button, Badge, Alert, Spinner
- **Layout and type:** Card (+ CardHeader, CardBody, CardFooter), Stack, Box, Text, Heading
- **Forms:** Field, Input, Select, Switch
- **Content:** Link, Code, CodeBlock, Table (+ TableHead, TableBody, TableRow, TableCell)
- **Choice:** SegmentedControl, ModeToggle
- **Brand:** BitLogo

Every one works in light and dark mode, and anything focusable shows the one focus ring from `reset.css`. The form controls (Input, Select, Switch, SegmentedControl) sit on the real native element (an `<input>`, `<select>`, checkbox or radio), so keyboards and screen readers work as browsers intend.

- `Heading` takes a required `level` (the tag, h1 to h6) and an optional `size` (the look), so an h2 can look like an h3.
- `Box` pads and offsets one element on the space scale (`padding`, `paddingX`, `paddingTop`, … and the same for `margin`). When props overlap, the most specific wins: `paddingTop` beats `paddingY`, which beats `padding`. Use `Stack` for space between things.
- `Switch` carries its own label; don't wrap it in `Field`.
- `SegmentedControl` is native radios, so the arrow keys move the choice.
- `Link` takes `color="primary"` or `color="neutral"` only.
- `CodeBlock` takes an optional `label` (default `` `${language} code` ``). Its code area is a named region, so give each CodeBlock a unique `label` when a page has several in the same language. A failed copy turns the Copy button solid danger red.

## Themes

A theme is one CSS file that fills in every semantic token. Switch with an attribute:

```html
<html data-theme="power-up">
```

### Light and dark

Set the theme and the mode on `<html>`:

```html
<html data-theme="power-up" data-mode="dark">
```

`data-mode` is `light` or `dark`. To pick the mode before first paint (no light flash for a dark-mode visitor), put the color mode script inline in `<head>`, before your CSS:

```tsx
import { COLOR_MODE_SCRIPT } from '@bit-ds/react';

<head>
  <script>{COLOR_MODE_SCRIPT}</script>
</head>
```

The script uses the visitor's stored choice, then the OS preference, then light.

- A strict Content Security Policy needs a hash or nonce for the inline script.
- SSR frameworks need `suppressHydrationWarning` on `<html>`, because the script sets `data-mode` before React hydrates.
- `useColorMode()` returns `{ mode, setMode }`. `<ModeToggle />` is a ready-made light/dark switch. Neither needs a provider.
- A subtree can be dark inside a light page with `data-mode="dark"`, but it paints its own background: give it `background: var(--bit-color-bg)`.
- A `data-mode` hard-coded in your HTML wins until the visitor toggles.

Adding a theme: copy `packages/core/src/themes/power-up.css`, change the values, run `pnpm --filter @bit-ds/core test`. The test fails if any token is missing or any color fails WCAG AA contrast.

The theme file starts with a Google Fonts `@import`; if your bundler concatenates stylesheets, import the theme before other CSS so the `@import` stays first. Self-hosted fonts are planned.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | build `@bit-ds/react`, then start the gallery at http://localhost:5173 |
| `pnpm storybook` | component docs on http://localhost:6006 |
| `pnpm test` | all unit, a11y, and system tests |
| `pnpm test:coverage` | react tests with the 80% gate |
| `pnpm build && pnpm verify` | build `@bit-ds/react` and prove the dist is consumable |
| `pnpm smoke` | packs `@bit-ds/react` and installs it with npm into a throwaway project to prove the tarball works |
| `pnpm logo:svg` | regenerate `assets/bit-logo.svg` |

## Docs

- Design spec: `docs/superpowers/specs/2026-09-06-bit-design-system-design.md`
- Contributing recipes: `CONTRIBUTING.md`

MIT.
