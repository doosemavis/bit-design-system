<p align="center"><img src="https://raw.githubusercontent.com/doosemavis/bit-design-system/main/assets/bit-logo.svg" width="353" alt="bit Design System"></p>

# bit

React components and design tokens for the bit design system.

```tsx
<Button color="primary" size="lg">Save</Button>
// renders: <button class="bit-button bit-primary bit-solid bit-lg">
// reads:   --bit-color-primary, --bit-control-height-lg
```

Themes are swappable and named after retro-game eras. The first theme is **power-up**.

Browse every component, with live controls and copyable code, in the docs: https://doosemavis.github.io/bit-design-system/

Versions and release notes: [all versions](https://doosemavis.github.io/bit-design-system/#/versions) and [release notes](https://doosemavis.github.io/bit-design-system/#/release-notes).

## Install

Needs React 19 (`react` and `react-dom` ^19).

Install `@bit-ds/react` with your package manager:

```bash
pnpm add @bit-ds/react
# or
npm install @bit-ds/react
# or
yarn add @bit-ds/react
```

Then add the styles once, theme first, and use a component. CSS imported in React is global, so one import in your
entry file (`src/main.tsx` in Vite, `app/layout.tsx` in Next.js) styles every component in the app:

```tsx
import '@bit-ds/react/themes/power-up.css';
import '@bit-ds/react/styles.css';
import { Button } from '@bit-ds/react';
```

Or put the styles at the very top of your global stylesheet (`src/index.css` or `app/globals.css`) instead:

```css
@import '@bit-ds/react/themes/power-up.css';
@import '@bit-ds/react/styles.css';
```

## The naming rule

| You write (prop) | Or write (className) | Class it emits | Token |
| --- | --- | --- | --- |
| `color="primary"` | `className="bit-primary"` | `bit-primary` | `--bit-color-primary` |
| `variant="outline"` | `className="bit-outline"` | `bit-outline` | (per component CSS) |
| `size="lg"` | `className="bit-lg"` | `bit-lg` | `--bit-control-height-lg` |
| `<CardHeader>` | | `bit-card__header` | |

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

Both render identically. Switch and SegmentedControl are native inputs, so their markup works as plain HTML too. ModeToggle and CodeBlock's Copy button need React: the classes give the look, and the React component gives the behavior (the stored mode, the clipboard).

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

## Utilities

`announce()` says a short message to screen readers, for results that appear without a focus move, such as "Saved".

```tsx
import { announce } from '@bit-ds/react';

announce('Saved');
```

- It uses one shared, visually hidden live region.
- It is safe during server rendering, where it does nothing.
- It follows focus into an open modal dialog, so the message is still heard there.
- When calls overlap, the last message wins.
- bit's CodeBlock Copy button uses it.

## Themes

A theme is one CSS file that fills in every semantic token. Switch with an attribute:

```html
<html data-theme="power-up">
```

### Light and dark

Set the theme and the mode on `<html>`:

```html
<html data-theme="power-up" data-mode="system">
```

`data-mode` is `light`, `dark` or `system`. `system` follows the visitor's OS in CSS alone, so there's no flash and no script. To change the mode from any file, use the `colorMode` service: `colorMode.set('dark')`, `colorMode.toggle()`, and `colorMode.mode` for what's showing.

The color mode script is optional. You only need it when visitors can save a choice (with `<ModeToggle />` or `colorMode.set`) and you want that choice before the first paint. Put it inline in `<head>`, before your CSS:

```tsx
import { COLOR_MODE_SCRIPT } from '@bit-ds/react';

<head>
  <script>{COLOR_MODE_SCRIPT}</script>
</head>
```

It applies a saved choice; with none it sets `system` when `<html>` has no `data-mode`.

- A strict Content Security Policy needs a hash or nonce for the inline script.
- SSR frameworks need `suppressHydrationWarning` on `<html>`, because the script sets `data-mode` before React hydrates.
- `useColorMode()` returns `{ mode, setMode }`. `<ModeToggle />` is a ready-made light/dark switch. Neither needs a provider.
- A subtree can be dark inside a light page with `data-mode="dark"`, but it paints its own background: give it `background: var(--bit-color-bg)`.
- A `data-mode` hard-coded in your HTML wins until the visitor toggles.

The theme file starts with a Google Fonts `@import`; if your bundler concatenates stylesheets, import the theme before other CSS so the `@import` stays first. Self-hosted fonts are planned.

## Links

- Docs: https://doosemavis.github.io/bit-design-system/
- Design spec: https://github.com/doosemavis/bit-design-system/blob/main/docs/superpowers/specs/2026-09-06-bit-design-system-design.md
- Source and issues: https://github.com/doosemavis/bit-design-system

## Contributing

Working on bit itself? See [CONTRIBUTING.md](https://github.com/doosemavis/bit-design-system/blob/main/CONTRIBUTING.md).

MIT.
