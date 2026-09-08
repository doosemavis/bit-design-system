<p align="center"><img src="assets/bit-logo.svg" width="320" alt="bit"></p>

# bit

A React design system for people who are new to design systems. One vocabulary everywhere: the prop you type is the class it emits is the token it reads.

```tsx
<Button tone="primary" size="lg">Save</Button>
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
import '@bit/react/styles.css';
import '@bit/react/themes/power-up.css';
import { Button } from '@bit/react';
```

## The naming rule

| You write | Class | Token |
| --- | --- | --- |
| `tone="primary"` | `bit-primary` | `--bit-color-primary` |
| `variant="outline"` | `bit-outline` | (per component CSS) |
| `size="lg"` | `bit-lg` | `--bit-control-height-lg` |
| `<CardHeader>` | `bit-card__header` | |

Three axes, same names on every component that has them:

- `tone`: `primary` `neutral` `success` `warning` `danger`
- `variant`: `solid` `outline` `ghost`
- `size`: `sm` `md` `lg`

Booleans are attributes, never classes: `disabled`, `aria-invalid`, `data-loading`.

A decorator in `className` replaces the prop's decorator for that axis: `<Button className="bit-danger">` is a danger button.

## Two ways to use every static component

```tsx
<Card><CardHeader>Stats</CardHeader></Card>
<div className="bit-card bit-solid"><div className="bit-card__header">Stats</div></div>
```

Both render identically. For interactive components (coming in Phase 3) the classes give the look; the React component gives the keyboard and screen-reader behavior.

## Components (Phase 1)

Button, Badge, Alert, Card (+ CardHeader, CardBody, CardFooter), Stack, Text, Spinner, BitLogo.

## Themes

A theme is one CSS file that fills in every semantic token. Switch with an attribute:

```html
<html data-theme="power-up">
```

Adding a theme: copy `packages/core/src/themes/power-up.css`, change the values, run `pnpm --filter @bit/core test`. The test fails if any token is missing or any tone fails WCAG AA contrast.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm storybook` | component docs on http://localhost:6006 |
| `pnpm test` | all unit, a11y, and system tests |
| `pnpm test:coverage` | react tests with the 80% gate |
| `pnpm build && pnpm verify` | build `@bit/react` and prove the dist is consumable |
| `pnpm logo:svg` | regenerate `assets/bit-logo.svg` |

## Docs

- Design spec: `docs/superpowers/specs/2026-09-06-bit-design-system-design.md`
- Contributing recipes: `CONTRIBUTING.md`

MIT.
