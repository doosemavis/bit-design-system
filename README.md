<p align="center"><img src="https://raw.githubusercontent.com/doosemavis/bit-design-system/main/assets/bit-logo.svg" width="353" alt="bit Design System"></p>

<p align="center">
  <a href="https://www.npmjs.com/package/@bit-ds/react"><img src="https://img.shields.io/npm/v/@bit-ds/react?label=npm&color=7c3aed" alt="npm version"></a>
  <a href="https://doosemavis.github.io/bit-design-system/"><img src="https://img.shields.io/badge/docs-gallery-7c3aed" alt="Docs and component gallery"></a>
  <a href="https://github.com/doosemavis/bit-design-system/actions/workflows/ci.yml"><img src="https://github.com/doosemavis/bit-design-system/actions/workflows/ci.yml/badge.svg" alt="CI status"></a>
  <a href="https://github.com/doosemavis/bit-design-system/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@bit-ds/react?color=7c3aed" alt="MIT license"></a>
</p>

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

## Contents

- [How it's tested](#how-its-tested)
- [Install](#install)
- [The naming rule](#the-naming-rule)
- [Two ways to use every static component](#two-ways-to-use-every-static-component)
- [Icons](#icons)
- [Components](#components)
- [Utilities](#utilities)
- [Themes](#themes) · [Light and dark](#light-and-dark)
- [Fonts](#fonts)
- [Links](#links)
- [Contributing](#contributing)

## How it's tested

<p align="right"><sub><a href="#contents">↑ Contents</a></sub></p>

Every pull request runs all of this in CI ([workflow](https://github.com/doosemavis/bit-design-system/blob/main/.github/workflows/ci.yml)). Releases publish only from a tagged commit on `main`, and the release job runs the package checks again before publishing:

- **Unit tests** (Vitest and Testing Library) for every component, with 100% statement, branch, function and line coverage on `@bit-ds/react`.
- **Accessibility in unit tests:** all 21 components run [axe-core](https://github.com/dequelabs/axe-core) on what they render. Select is checked both closed and open.
- **Accessibility in a real browser:** Playwright opens every docs page in light and dark mode and fails on any axe violation of the WCAG 2.0, 2.1 and 2.2 A and AA rules.
- **Keyboard and focus:** Select's keyboard model (arrows, Home and End, Page Up and Page Down, typeahead, Enter, Space, Escape, Tab) is tested key by key, along with where focus goes and how it behaves in a form (`required`, reset, `form="id"`).
- **Dialog and Tabs:** Dialog is tested for focus moving in (to `data-autofocus`), Esc and the × closing it, focus returning to the opener, and an `alert` dialog ignoring clicks on the dimmed page; in a real browser, Playwright checks the page behind is inert and won't take focus. Tabs are tested for the one Tab stop, arrows (swapped right-to-left), Home and End, skipping disabled tabs, and manual activation.
- **Color contrast, computed:** tests read the theme tokens and compute WCAG contrast ratios in light and dark, so a color change that drops text below 4.5:1 fails the build.
- **Forced colors (Windows High Contrast):** Playwright runs pages with `forced-colors: active` and checks that states such as invalid still show without color.
- **The published package:** before every release the built package is installed into a fresh TypeScript app, type-checked, and imported through both ESM and CommonJS. A Vite app checks that the CSS and fonts load, all from the package, with nothing from a third party.

There is no screenshot-diff (visual regression) suite yet. Visual changes are reviewed with light and dark screenshots before they merge.

## Install

<p align="right"><sub><a href="#contents">↑ Contents</a></sub></p>

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

<p align="right"><sub><a href="#contents">↑ Contents</a></sub></p>

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

`flat` on Badge, Card and Table drops the hard shadow. It is the class `bit-flat`, so `<Card className="bit-flat">` does the same.

## Two ways to use every static component

<p align="right"><sub><a href="#contents">↑ Contents</a></sub></p>

```tsx
<Card><CardHeader>Stats</CardHeader></Card>
<div className="bit-card bit-solid"><div className="bit-card__header">Stats</div></div>
```

Both render identically. Switch and SegmentedControl are native inputs, so their markup works as plain HTML too. ModeToggle and CodeBlock's Copy button need React: the classes give the look, and the React component gives the behavior (the stored mode, the clipboard).

## Icons

<p align="right"><sub><a href="#contents">↑ Contents</a></sub></p>

300 Material Symbols icons (Sharp, weight 700), each with a fill version. Browse them and copy any one from the Icon page of the docs.

```tsx
import { Icon, iconDelete, iconFavorite } from '@bit-ds/react';

<Icon icon={iconDelete} color="danger" label="Delete" />
<Icon icon={iconFavorite} iconFilled />
```

`iconFilled` draws the filled version of any icon. A `label`, `aria-label` or `aria-labelledby` names it for screen readers; without one it is hidden from them.

Your bundler keeps only the icons you import. To use icons as plain classes instead, import the icon stylesheet once:

```css
@import '@bit-ds/react/icons.css';
```

```html
<span class="bit-icon bit-icon-delete bit-danger bit-iconFilled" aria-hidden="true"></span>
```

The class form works on any element except `<svg>`.

`icons.css` is separate from `styles.css` (about 46 KB gzipped), so apps that only use `<Icon>` never load it.

For a button that is only an icon, use `IconButton`; `Tooltip` shows a name on hover and focus:

```tsx
import { Button, IconButton, Tooltip, iconDelete } from '@bit-ds/react';

<IconButton icon={iconDelete} label="Delete" tooltip="Delete" />
<Tooltip content="Copy link"><Button>Share</Button></Tooltip>
```

An `IconButton` shows no tooltip unless you give `tooltip`.

The package is MIT. The icon artwork is Apache 2.0: Material Symbols by Google, Apache License 2.0. The licence ships in the package at `dist/icons/LICENSE-material-symbols.txt`.

## Components

<p align="right"><sub><a href="#contents">↑ Contents</a></sub></p>

- **Actions and status:** Button, Badge, Alert, Spinner
- **Layout and type:** Card (+ CardHeader, CardBody, CardFooter), Stack, Box, Text, Heading
- **Forms:** Field, Input, Select, Switch
- **Content:** Link, Code, CodeBlock, Table (+ TableHead, TableBody, TableRow, TableCell)
- **Choice:** SegmentedControl, ModeToggle
- **Overlays and navigation:** Dialog (+ DialogHeader, DialogBody, DialogFooter, DialogClose), Tabs (+ TabList, Tab, TabPanel)
- **Icons:** Icon, with 300 Material Symbols icons and their fill versions (`iconFavorite`, …), each drawn filled with `iconFilled`
- **Icon buttons and hints:** IconButton, Tooltip
- **Brand:** BitLogo

Every one works in light and dark mode, and anything focusable shows the one focus ring from `reset.css`. Input, Switch and SegmentedControl sit on the real native element (an `<input>`, a checkbox or radios), so keyboards and screen readers work as browsers intend. Select is a bit-drawn combobox (the WAI-ARIA select-only combobox) with full keyboard support and single or multi-select, so its list looks the same in every browser; hidden native inputs carry its value (one per chosen value with `multiple`), so `name`, `required`, `disabled`, `form` and form reset work as they do on a native `<select>`. Dialog is the native modal `<dialog>`: focus moves in, the page behind is inert, Esc closes it, and focus returns to what opened it. Tabs follow the WAI-ARIA tabs pattern, with one Tab stop and arrow keys between tabs.

- `Heading` takes `size` in px, every 2px from 20 to 44 (default 32), and the size picks the tag for the page outline: 40 and up is an h1, 32 to 38 an h2, 26 to 30 an h3, 24 an h4, 22 an h5, 20 an h6. `Text`'s `size` is 14, 16, 18, 24, 32 or 40; body text is 16. A Text inside a Text renders inline: `<Text>You have <Text weight="bold">3 coins</Text> left.</Text>`. Text also takes `italic`, `underline` and `strikethrough`.
- `Box` pads and offsets one element on the space scale (`padding`, `paddingX`, `paddingTop`, … and the same for `margin`). When props overlap, the most specific wins: `paddingTop` beats `paddingY`, which beats `padding`. Use `Stack` for space between things.
- `Switch` carries its own label; don't wrap it in `Field`.
- `SegmentedControl` is native radios (checkboxes with `multiple`), so the arrow keys move the choice. With `multiple`, each segment is a Tab stop and Space toggles it.
- `Link` takes `color="primary"` or `color="neutral"` only.
- `CodeBlock` takes an optional `label` (default `` `${language} code` ``). Its code area is a named region, so give each CodeBlock a unique `label` when a page has several in the same language. A failed copy turns the Copy button solid danger red.

## Utilities

<p align="right"><sub><a href="#contents">↑ Contents</a></sub></p>

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

`useCopyToClipboard(text)` runs a Copy button of your own, the same way CodeBlock's does.

```tsx
import { Button, useCopyToClipboard } from '@bit-ds/react';

const { state, label, copy } = useCopyToClipboard(command);
<Button color={state === 'failed' ? 'danger' : 'neutral'} onClick={() => void copy()}>{label}</Button>
```

- `label` reads "Copy", then "Copied" or "Copy failed" for two seconds; `state` is `idle`, `copied` or `failed`.
- `copy()` resolves `true` when the text reached the clipboard and never rejects. It announces the result with `announce()`.
- With several Copy buttons on a page, give each an `aria-label` such as "Copy install command" while `state` is `idle`.

## Themes

<p align="right"><sub><a href="#contents">↑ Contents</a></sub></p>

A theme is one CSS file that fills in every semantic token. Switch with an attribute:

```html
<html data-theme="power-up">
```

### Light and dark

<p align="right"><sub><a href="#contents">↑ Contents</a></sub></p>

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

## Fonts

<p align="right"><sub><a href="#contents">↑ Contents</a></sub></p>

The fonts ship in the package. The theme's `@font-face` rules load Lilita One, Nunito, Press Start 2P, Audiowide and JetBrains Mono from woff2 files next to it (`themes/fonts/`), so your bundler serves them from your own site with nothing extra to import.

- The theme makes no third-party requests: no Google Fonts, and no CSP exception for a font host. `font-src 'self'` covers it; add `data:` if your bundler inlines small files (Vite does under 4 KB).
- Each face is split into every subset Google Fonts serves for it (latin, latin-ext, and cyrillic, greek or vietnamese where the font has them), each with its own `unicode-range`, so the browser downloads only the files for the scripts a page shows.
- The theme points at its fonts with relative `url()`s. Vite, Next.js and Create React App handle these out of the box. A hand-written webpack 5 config needs a rule for them: `{ test: /\.woff2$/, type: 'asset/resource' }`.
- The fonts are licensed under the SIL Open Font License 1.1. Each family's license (`OFL-<font>.txt`) ships beside its fonts in `themes/fonts/`.

## Links

<p align="right"><sub><a href="#contents">↑ Contents</a></sub></p>

- Docs: https://doosemavis.github.io/bit-design-system/
- Design spec: https://github.com/doosemavis/bit-design-system/blob/main/docs/superpowers/specs/2026-09-06-bit-design-system-design.md
- Source and issues: https://github.com/doosemavis/bit-design-system

## Contributing

<p align="right"><sub><a href="#contents">↑ Contents</a></sub></p>

Working on bit itself? See [CONTRIBUTING.md](https://github.com/doosemavis/bit-design-system/blob/main/CONTRIBUTING.md).

MIT.
