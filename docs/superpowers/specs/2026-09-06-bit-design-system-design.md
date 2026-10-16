# bit design system — design spec

**Date:** 2026-09-06
**Status:** historical. Approved in brainstorming on 2026-09-06 as the v1 design, then built and shipped as `@bit-ds/react` 0.1.0 on 2026-10-04. This file is the dated record of the plan and is not kept current. Dated _Superseded_ notes mark where the build moved away from it. The current architecture is in [`/ARCHITECTURE.md`](../../../ARCHITECTURE.md), and where the two disagree, ARCHITECTURE.md and the code win.
**Repo:** `github.com/doosemavis/bit-design-system` (public, MIT)

## 1. Purpose and constraints

`bit` is an open-source React component library and design system built for one audience: an entry-level engineer who has to use it, change what a component looks like, and add a new option to it without reading a glossary.

Its visual identity is retro video games. The system ships **themes**, one per retro-game era or franchise vibe. The first theme, `power-up`, is "late-90s Mario chunkiness on PostHog's bold, bordered page." Future themes reuse every component unchanged and only swap token values.

Constraints that shaped every decision below:

- **Demo and portfolio purposes.** Optimize for clarity and showing the conventions off, not for production hardening (no i18n, no RTL, no SSR edge cases in v1).
- **Junior-first naming.** One vocabulary at every layer. No themed component names, no abbreviations, no value-based token names.  _Superseded (2026-10-03, D13): space, radius and text tokens are named by their value (`--bit-space-16px`); see §3.2._
- **React only in v1.** Tokens and component CSS live in a framework-agnostic package so a second framework can be added later without a rewrite.
- **Open source, unpublished for now.** Packages carry `"private": true` until a publish decision is made.  _Superseded (2026-10-04, 0.1.0): `@bit-ds/react` is public on npm, published with provenance (`publishConfig` in `packages/react/package.json`). `@bit-ds/core` stays private and is inlined at build._

## 2. The naming rule

**The word a junior types as a prop is the same word in the CSS class and the same word in the token.** Grep any one of them and you find the others.

```
<Button color="primary">            prop
class="bit-button bit-primary"     class
--bit-color-primary                token
```

### 2.1 Prefix

All classes and custom properties are prefixed `bit-` / `--bit-`. Internal (private) custom properties are prefixed `--_bit-` and are never part of the public API.

### 2.2 Class grammar

| Kind | Pattern | Example |
|---|---|---|
| Block (component root) | `bit-{kebab-case component}` | `Button` → `bit-button`, `IconButton` → `bit-iconButton` (owner ruling 2026-10-08: the one camelCase exception, so it never collides with Icon's `bit-icon-{name}` classes) |
| Element (part of a block) | `bit-{block}__{element}` | `CardHeader` → `bit-card__header` |
| Decorator (an axis value) | `bit-{value}` | `bit-primary`, `bit-outline`, `bit-lg` |

Decorators are the same words on every component. BEM's double-dash modifier is **not** used; decorators replace it.

camelCase classes (`bit-cardHeader`) were considered and rejected: HTML and CSS are kebab-case everywhere else, case typos fail silently in CSS, and the double underscore signals "part of" at a glance.

### 2.3 Two ways to use every static component

Both produce identical output, because component CSS is plain classes in the core package and React components only emit them:

```jsx
<Card><CardHeader>Stats</CardHeader></Card>
<div className="bit-card"><div className="bit-card__header">Stats</div></div>
```

**Caveat, documented in the README:** for interactive components (Modal, Tabs, Tooltip, Dropdown menu) the classes give the appearance only. Keyboard handling, focus management, and ARIA wiring come from the React component.

## 3. Token architecture

Three tiers of CSS custom properties. **Components read only tier 2.**

### 3.1 Tier 1: primitives (per theme)

Raw values named by what they are. Each theme defines its own set; only that theme file reads them.

```css
--bit-palette-yellow: #FFCC00;  --bit-palette-red: #E52521;   --bit-palette-green: #43B047;
--bit-palette-blue: #2D7DFF;    --bit-palette-ink: #1B1B2F;   --bit-palette-cream: #F5EEDC;
--bit-palette-white: #FFFFFF;   /* plus whatever a theme needs */
```

### 3.2 Tier 2: semantic (the public API)

Grammar: `--bit-{category}-{role}[-{modifier}]`. This is the complete list. Every theme must define every name; a test enforces it (§8.3).  _Superseded (2026-10-10, 0.1.9): `SEMANTIC_TOKENS` in `packages/core/src/tokens.ts` is the canonical list, and the tables below are out of date. The changes are in the notes under each table._

**Color**

| Token | Meaning |
|---|---|
| `--bit-color-bg` | page background |
| `--bit-color-surface` | card / panel background |
| `--bit-color-ink` | borders, outlines, hard shadows |
| `--bit-color-text` | default text |
| `--bit-color-text-muted` | secondary text |
| `--bit-color-focus` | focus ring |
| `--bit-color-{color}` | fill for the color |
| `--bit-color-{color}-contrast` | text on that fill |
| `--bit-color-{color}-hover` | fill on hover |
| `--bit-color-{color}-soft` | tinted background (alerts, ghost hover) |

`{color}` ∈ `primary | neutral | success | warning | danger` (4 tokens × 5 colors = 20).  _Superseded (2026-10-03, dark mode and PR2): new roles `line`, `shadow` and `selection`, plus component color roles `accent`, `link`, `link-visited`, `danger-text`, `warning-text` (0.1.9), `knob`, `stripe` and `code-text`. `--bit-color-focus` became `--bit-focus-ring-color`, `-width` and `-offset` (`tokens.test.ts` checks that it's gone)._

**Shape** (this is where the retro look lives)

| Token | power-up value |
|---|---|
| `--bit-border-width` | `3px` |
| `--bit-radius-sm` / `-md` / `-lg` / `-full` | `6px` / `10px` / `14px` / `999px`  _Superseded (2026-10-03, D13): `--bit-radius-6px`, `-10px`, `-14px`, and `-full` for the pill._ |
| `--bit-shadow-sm` / `-md` / `-lg` | `2px 2px 0 ink` / `4px 4px 0 ink` / `6px 6px 0 ink` |
| `--bit-shadow-inset` | `inset 3px 3px 0 rgba(ink, .12)` on inputs |
| `--bit-gloss` | `inset 0 3px 0 rgba(255,255,255,.4)` highlight lip on buttons  _Superseded (2026-10-03, dark mode spec): removed; buttons are flat (`tokens.test.ts` checks that it's gone)._ |

**Typography**

| Token | power-up value |
|---|---|
| `--bit-font-display` | `'Lilita One', cursive` |
| `--bit-font-body` | `'Nunito', sans-serif` |
| `--bit-font-pixel` | `'Press Start 2P', monospace` (micro-labels only) |
| `--bit-text-xs` / `-sm` / `-md` / `-lg` / `-xl` / `-2xl` | `11 / 13 / 15 / 18 / 24 / 32px` |
| `--bit-leading-tight` / `-normal` | `1.1` / `1.5` |
| `--bit-weight-normal` / `-bold` | `600` / `800` |

_Superseded (2026-10-10, 0.1.8): text tokens are named in px on an even scale, `--bit-text-14px` to `--bit-text-40px` (11, 13 and 15 are deprecated aliases). Heading has its own scale, `--bit-heading-20px` to `--bit-heading-44px`. `--bit-font-mono` was added for code._

**Space**: `--bit-space-1` … `--bit-space-8` = `4, 8, 12, 16, 24, 32, 48, 64px`.  _Superseded (2026-10-03, D13): `--bit-space-4px` … `--bit-space-64px`, same values. The frozen table in `packages/core/src/__tests__/px-rename.test.ts` proves the rename changed no rendered size. Decision record: `docs/superpowers/plans/2026-09-13-gallery.md` (D13, §C)._

**Controls** (shared by Button, Input, Select, etc.)

| Token | sm / md / lg |
|---|---|
| `--bit-control-height-{size}` | `32 / 40 / 48px` |
| `--bit-control-padding-{size}` | `10 / 14 / 18px` (horizontal) |

**Motion**

| Token | Meaning |
|---|---|
| `--bit-press-offset` | how far a pressed control translates (`2px`) |
| `--bit-duration-fast` / `-normal` | `80ms` / `160ms` |
| `--bit-motion-power-up` | keyframe name for the stepped grow (§7)  _Superseded (2026-09-08, phase 1): never shipped as a token (`tokens.test.ts` checks that it's absent)._ |

### 3.3 Tier 3: component tokens

**Deliberately empty in v1.** A component token is added only when a real case appears where one component needs a knob the others don't.

### 3.4 How decorators are implemented

- **Color decorators are global, written once.** `core/src/system/colors.css` maps each `bit-{color}` class to private variables: `--_bit-color`, `--_bit-color-contrast`, `--_bit-color-hover`, `--_bit-color-soft`. Components consume the private variables. Adding a color system-wide is: 4 semantic tokens per theme + one rule in `colors.css`.
- **Size decorators are global, written once.** `core/src/system/sizes.css` maps `bit-{size}` to `--_bit-size-height`, `--_bit-size-padding`, `--_bit-size-text`.
- **Variant decorators are per component**, because solid / outline / ghost render differently on a Button than on a Card. Each component's CSS has `.bit-button.bit-solid { }` style rules.

## 4. Component API

### 4.1 The three axes

Plain string props with fixed unions, so the editor autocompletes allowed values.

```
color    primary | neutral | success | warning | danger
variant  solid | outline | ghost
size     sm | md | lg        (Text extends this to xs … 2xl)
```

Each component file opens with a constant listing the values it supports. That constant drives the TypeScript type and the emitted class:

```tsx
const variants = ['solid', 'outline', 'ghost'] as const;
```

Adding a variant to one component = add it to that array + add a CSS rule in the sibling `.css` file.

### 4.2 Rules every component follows

- Emits `bit-{component}` plus exactly one decorator per supported axis, so CSS can rely on their presence. The decorator is the prop's value, or the caller's `bit-{value}` from `className` if one is given for that axis — that is how `className` overrides a default.
- Appends the caller's `className` **last**, so `<Button className="bit-danger">` overrides the default color.
- Forwards its `ref` to the root DOM node.
- Spreads unknown props onto the root DOM node.
- Booleans become **attributes, never classes**: native where they exist (`disabled`, `aria-invalid`), `data-` otherwise (`data-loading`, Radix's `data-state`).  _Superseded (2026-10-08, 0.1.6): no Radix, so no `data-state`. Two shipped boolean classes, `bit-flat` and `bit-iconFilled`, break this rule and are kept until 0.2.0 (CONTRIBUTING "Conventions")._
- Compound parts are **separate named exports** (`Card`, `CardHeader`, `CardBody`, `CardFooter`), each mapping to a BEM element class.
- Form controls shadow the native `size` attribute; ours means sm / md / lg.
- Layout-only props (Stack direction, gap) are `data-` attributes, not decorators, because they are not design axes.
- Unknown axis values (possible for plain-JS callers) log a dev-only warning and are dropped. Nothing throws at runtime for a styling mistake.

### 4.3 The 20 components

_Superseded (2026-10-10, 0.1.9): the table below has 21 rows. 32 components shipped. Modal shipped as **Dialog** on the native `<dialog>` and `showModal()` (0.1.5). Avatar is not built yet and is still planned. Added: Box, Heading, Slider, Link, Code, CodeBlock, SegmentedControl, ModeToggle, BitTheme, Navbar, Icon and IconButton. The current list is the README's "Components" section and `packages/react/src/index.ts`. No Phase 3 component uses Radix._

| Component | color | variant | size | Notes |
|---|---|---|---|---|
| **Phase 1: Foundation** | | | | |
| Button | ✓ default `primary` | ✓ | ✓ | `loading` → `data-loading`; `asChild` via Radix Slot  _Superseded (2026-10-06, 0.1.3): bit's own `createSlot` (`packages/react/src/system/Slot.tsx`) keeps the Radix Slot rules, pinned by tests first, with no runtime dependency._ |
| Badge | ✓ default `neutral` | solid, outline | sm, md | |
| Alert | ✓ default `neutral` | solid, outline | | `title` prop; outline uses `-soft` bg |
| Card | | solid, outline | | `CardHeader`, `CardBody`, `CardFooter` |
| Stack | | | | `direction`, `gap`, `align`, `justify`, `wrap` as data attrs |
| Text | muted via color `neutral` | | xs … 2xl | `as` (p, span, h1–h6), `weight`  _Superseded (2026-10-10, 0.1.8): `size` is 14 to 40 in px; `as` is deprecated, and titles use Heading._ |
| Spinner | ✓ | | ✓ | `aria-label` required |
| BitLogo | | | ✓ | see §7 |
| **Phase 2: Forms** (native elements, styled) | | | | |
| Input | | | ✓ | `invalid` → `aria-invalid` |
| Textarea | | | ✓ | |
| Select | | | ✓ | native `<select>` + chevron  _Superseded (2026-10-07, 0.1.4): a bit-drawn WAI-ARIA select-only combobox (`role="combobox"` plus a `role="listbox"` in the top layer). Hidden native inputs carry the value for forms. `multiple` was added in 0.1.5. See `docs/superpowers/specs/2026-10-07-select-dropdown-design.md`._ |
| Checkbox | | | ✓ | native input, `appearance: none` |
| RadioGroup / Radio | | | ✓ | group supplies `name`, layout |
| Switch | | | ✓ | native checkbox with `role="switch"` |
| Field | | | | `label`, `hint`, `error`, `required`; wires `aria-describedby` via `useId` |
| **Phase 3: Interactive** (Radix Primitives) | | | | |
| Modal | | | ✓ | Radix Dialog; `Modal`, `ModalTrigger`, `ModalClose`; `title`, `description` props |
| Tabs | | | ✓ | Radix Tabs; `Tabs`, `TabList`, `Tab`, `TabPanel` |
| Tooltip | | | | Radix Tooltip; `content` prop wraps children |
| Menu | item color (`danger`) | | | Radix DropdownMenu; `Menu`, `MenuTrigger`, `MenuItem`, `MenuSeparator` |
| Avatar | | | ✓ | Radix Avatar; `src`, `name` → initials fallback |
| Table | | | ✓ | plain styled table; `striped` → `data-striped`; row/cell exports |

## 5. Theming

- **A theme is one CSS file** that defines its primitives and the complete semantic set under `[data-theme="{name}"]`. The first theme is also applied to `:root`, so a consumer with no attribute set still gets a fully styled app.
- **Switching** is one attribute on the root element. No JavaScript required.  _Superseded (2026-10-10, 0.1.9): a class (`bit-theme-<name>`, `bit-light`, `bit-dark`) or the attribute, on the root or on any element; `<BitTheme>` themes a subtree._ Storybook gets a toolbar dropdown.  _Superseded (2026-10-04, PR3c): Storybook removed; the gallery is the docs site._
- **Names are descriptive, never trademarks.** `power-up`, not `mario`.
- **Effects are tokens even when unwanted.** A flat theme sets `--bit-gloss: none` and `--bit-shadow-md: none`. Component CSS never knows which theme is active.
- **Fonts ship with the theme.** Each theme file starts with the Google Fonts `@import` for its faces. All power-up faces (Lilita One, Nunito, Press Start 2P, Bungee for the logo) are SIL Open Font License. Self-hosting is a Phase 4 improvement.  _Superseded (2026-10-06, 0.1.3): fonts are self-hosted from the package (`themes/fonts/`), with no third-party request._
- **Completeness is tested.** See §8.3.
- **Adding a theme:** copy `power-up.css`, change values, run the test, add it to the package `exports`.
- **Dark mode is reserved, not built:** a second attribute `data-mode="dark"` layered under the theme. v1 ships light only.  _Superseded (2026-10-03, PR #6): dark mode ("Arcade Night") shipped before 0.1.0; `data-mode="system"` follows the OS in CSS alone (0.1.1)._

### 5.1 power-up theme direction (approved mockup: "C · Power-Up")

Warm cream page, thick ink outlines, hard offset shadows, gloss lip on solid buttons, recessed inputs, chunky display headings, pixel font only for micro-labels (eyebrows, badges), readable body text. Buttons press down on hover (`translate(press-offset)` + shadow shrinks). Primary is coin yellow with ink text; danger is red; success is pipe green.

Open item: the coin icon / iconography treatment is not decided and may change.

## 6. Package layout

```
bit-design-system/
├── packages/
│   ├── core/                     @bit-ds/core   framework-agnostic, zero deps
│   │   └── src/
│   │       ├── themes/power-up.css
│   │       ├── tokens.ts             semantic token name list (drives completeness test)
│   │       ├── system/               reset.css, colors.css, sizes.css, motion.css
│   │       ├── components/           button.css, card.css, … one per component
│   │       └── index.css             imports system + every component file
│   └── react/                    @bit-ds/react  inlines core at build (core is a devDependency), depends on Radix; React is a peer dep  _Superseded (2026-10-06, 0.1.3): zero runtime dependencies._
│       └── src/
│           ├── system/               axes.ts (unions), toClasses(), warnUnknown()
│           ├── components/           Button/Button.tsx, Button.test.tsx, Button.stories.tsx
│           ├── logo/                 BitLogo
│           └── index.ts
├── apps/docs/                    Storybook 9, autodocs, theme toolbar  _Superseded (2026-10-04, PR3c): Storybook removed; the gallery is the docs site._
├── docs/superpowers/             specs and plans
├── package.json                  pnpm workspaces
└── tsconfig.base.json
```

**Tooling:** pnpm workspaces, TypeScript strict, tsup (ESM + CJS + d.ts), Vitest + React Testing Library + vitest-axe, ESLint, Storybook 9. No Turborepo or Nx.  _Superseded (2026-10-04, PR3c): Storybook removed; the gallery is the docs site._

**Package contract for `@bit-ds/react`:**

- `exports`: `.`, `./styles.css` (core index), `./themes/*.css`  _Superseded (2026-10-08, 0.1.6): adds `./icons.css` (opt-in icon classes) and `./package.json`._
- `sideEffects: ["*.css"]`
- `peerDependencies`: `react`, `react-dom`
- `"private": true` until a publish decision  _Superseded (2026-10-04, 0.1.0): public, with `publishConfig.provenance`. `verify-dist.mjs` checks the package has no `dependencies`._

Consumer experience, the whole thing:

```tsx
import '@bit-ds/react/styles.css';
import '@bit-ds/react/themes/power-up.css';
import { Button } from '@bit-ds/react';
```

## 7. The BitLogo

The wordmark is `#-bit`. **`-bit` never changes**; the number cycles through console generations, and **each number is drawn the way that generation drew type.**

| Era | Treatment (approved mockup) |
|---|---|
| 8 | pixel font, single flat color (danger red) |
| 16 | pixel font, three-band yellow→orange fill, hard 2px ink drop shadow |
| 32 | Bungee, chrome gradient (white → steel blue), white highlight + ink drop |
| 64 | Lilita One, coin yellow, ink stroke, 4-step extruded depth + ink shadow |

**Transition (approved: A2, "three-size power-up").** No fades. The outgoing number cuts out the instant the incoming one appears. The incoming number then steps through `scale(.5) → .75 → 1`, three times, settling at 1, over ≈1s, with `step-end` timing (no easing), `transform-origin: 50% 100%` so it grows upward from the baseline like the NES sprite.

**Timing.** 5s per number in demo mode (20s cycle). Pure CSS keyframes, no JS timers; four stacked spans in one grid cell with negative `animation-delay` offsets.

**Component:** `<BitLogo size interval animated freeze />`

- `freeze: 8 | 16 | 32 | 64` pins one era and stops the cycle. This is the hook for the future version / theme picker: the menu sets `freeze`; the 5s auto-cycle is demo-only.
- `prefers-reduced-motion` freezes on the first frame.
- Era treatments live in `core/src/components/logo.css` and reference semantic color tokens, so they retheme; a theme may override an era by selector.
- The grow keyframes are exported as `--bit-motion-power-up` so other components can borrow them later.

**Deliverables:** the React component, a Storybook story, and an animated SVG export for the README (GitHub renders CSS-animated SVG).  _Superseded (2026-10-04, PR3c): Storybook removed; the gallery is the docs site._

## 8. Testing and error handling

Every component ships three sibling files: `X.tsx`, `X.test.tsx`, `X.stories.tsx`. Tests are written first (TDD). Coverage threshold **80%**, enforced in CI.  _Superseded (2026-10-04, PR3c): no stories; each component has a gallery manifest instead. The 80% CI gate still stands (`packages/react/vitest.config.ts`). Measured coverage on `@bit-ds/react` at `6e9a745`: 100% of lines and functions, 99.85% of statements, 99.42% of branches._

### 8.1 Per-component unit tests (Vitest + RTL)

- Renders root class and each axis maps to the correct decorator class, defaults included.
- `className` appended last; `ref` reaches the DOM node; unknown props land on the root.
- State props produce attributes, not classes.
- Interactive components: keyboard behavior (Escape closes Modal, arrows move Tabs, focus returns to trigger).

### 8.2 Accessibility tests

`vitest-axe` against every component's default render and each color × variant. Contrast failures in a theme fail the build.  _Superseded (2026-10-10, 0.1.9): axe-core directly in unit tests (Select and Menu open and closed); Playwright runs axe on every docs page in light and dark against WCAG 2.0, 2.1 and 2.2 A and AA; contrast is computed from the theme tokens in both modes; forced-colors runs; a published-package smoke test (README "How it's tested", `.github/workflows/ci.yml`)._

### 8.3 System tests (guard the conventions)

- **Theme completeness:** parse every `themes/*.css`, collect declared `--bit-` names, fail if any name in `tokens.ts` is missing.
- **Class contract:** every component's root class equals `bit-` + kebab-case of its export name, so the docs table cannot drift.
- **Logo:** `freeze` renders only the chosen era; reduced-motion disables the animation class.

### 8.4 Error handling

Compile-time via unions. Runtime: dev-only `console.warn` for unknown axis values, then drop. Missing theme attribute falls back to `:root`. Nothing throws for a styling mistake.

## 9. Build phases

Each phase gets its own implementation plan.

1. **Foundation.** Repo scaffold, tooling, core system CSS, power-up theme, `tokens.ts`, axes + `toClasses`, Button, Badge, Alert, Card, Stack, Text, Spinner, BitLogo, Storybook with theme switcher, CI (typecheck, test, axe), README, CONTRIBUTING, LICENSE.  _Superseded (2026-10-04, PR3c): Storybook removed; the gallery is the docs site._
2. **Forms.** Input, Textarea, Select, Checkbox, RadioGroup, Switch, Field.
3. **Interactive.** Modal, Tabs, Tooltip, Menu, Avatar, Table.
4. **Distribution (documented, not built in v1).**  _Superseded (2026-10-04 to 2026-10-10): **built:** a tag-triggered release with manual approval, a tarball hash check, provenance and a post-publish integrity check (`.github/workflows/release.yml`); self-hosted fonts; dark mode; a versioned docs site. **Not built:** Changesets, Style Dictionary, Chromatic, `npx bit init`, canary builds._ Changesets + GitHub Actions publish, Style Dictionary token pipeline (JSON source → CSS / TS / Tailwind preset), Storybook deploy + Chromatic, `npx bit init`, self-hosted fonts, dark mode, canary builds.  _Superseded (2026-10-04, PR3c): Storybook removed; the gallery is the docs site._

## 10. Repo hygiene (Phase 1)

MIT license. README with the animated logo and the three-line install. `CONTRIBUTING.md` containing the "add a component", "add an axis value", and "add a theme" recipes from §4.1, §3.4, §5. GitHub Actions CI. `.superpowers/` git-ignored.

## 11. Out of scope for v1

Angular or other frameworks, dark mode, i18n / RTL, npm publishing, Style Dictionary, IconButton, Toast, visual regression testing.  _Superseded (2026-10-08): dark mode, npm publishing and IconButton shipped. The rest is still out of scope; the README says there is no visual-regression suite yet._

## 12. Decisions log

| Decision | Chosen | Rejected | Why |
|---|---|---|---|
| Naming methodology | one-vocabulary decorators + BEM block/element | pure BEM modifiers, utility-first, themed vocabulary | junior readability; grep-ability across layers |
| Element case | `bit-card__header` | `bit-cardHeader` | kebab is the HTML/CSS norm; silent case typos |
| Frameworks | React v1, CSS core separable | Web Components, React+Angular now | fastest path to a good v1 |
| Interactive a11y | Radix Primitives | hand-rolled | weeks saved, fewer a11y bugs, documented. _Superseded (2026-10-06, 0.1.3): see "Interactive behavior" below._ |
| Repo shape | pnpm monorepo, 2 packages + docs app | single package, Style Dictionary now | smallest layout that keeps the separation |
| Docs | Storybook 9 | custom Vite playground | autodocs from types; juniors know it. _Superseded (2026-10-04, PR3c): Storybook removed; the gallery is the docs site._ |
| Form controls | styled native elements | Radix Select/Checkbox | simpler, accessible by default. _Superseded (2026-10-07, 0.1.4) for Select only: see "Select" below. The other form controls are still styled native elements._ |
| Visual direction | C · Power-Up | A · Party Board, B · Ink & Cream | distinctive without hurting readability |
| Logo transition | A2 three-size stepped grow, no fades | hard cut w/ flicker, pop, roll, two-size | matches NES power-up exactly |
| Privacy | `"private": true` guard flag | private npm package | open-source repo makes a hidden package pointless. _Superseded (2026-10-04, 0.1.0): `@bit-ds/react` is public; only `@bit-ds/core` and the gallery stay private._ |
| Name | `bit`, prefix `bit-`, repo `bit-design-system` | 32-bit, Lexicon, Sprite | themes per game under one name |
| Axis name | `color` | `tone` | the word people already use; aligns with `--bit-color-*` (addendum 2026-09-12) |
| Interactive behavior | Built by hand on native elements first (`<dialog>` with `showModal()`, `<input type="range">`, native checkboxes and radios); WAI-ARIA patterns only where no native element fits (select-only combobox, menu button, tabs, tooltip) | Radix Primitives | 2026-10-06 (0.1.3, commit `f3fd5eb`): the last Radix package (`@radix-ui/react-slot`) went away, leaving `@bit-ds/react` with no runtime dependencies; `verify-dist.mjs` checks this. Dialog went on the native `<dialog>` in 0.1.5 (`specs/2026-10-07-dialog-tabs-design.md`). `TODO(owner): confirm rationale` for building every interactive component without Radix. |
| Select | A bit-drawn select-only combobox, with hidden native inputs carrying the value | Native `<select>` | 2026-10-07 (0.1.4): the owner wanted the list styled to match bit, and "every browser must look the same", so `appearance: base-select` was ruled out (`specs/2026-10-07-select-dropdown-design.md`). The hidden inputs keep `name`, `required`, `form` and reset working (CHANGELOG 0.1.4). |
| Scale token names | Named by value (`--bit-space-16px`, `--bit-radius-10px`, `--bit-text-16px`) | Ordinal and t-shirt names (`--bit-space-4`, `--bit-radius-md`) | 2026-10-02 (D13, `plans/2026-09-13-gallery.md` §C and the D13 question): the frozen table in `px-rename.test.ts` proves the rename changed no rendered size. Logged ceiling: the names describe power-up's values; revisit when a second theme needs a different scale. `TODO(owner): confirm rationale` for value names over ordinal names. |
| Cascade layers | `@layer bit.reset, bit.tokens, bit.components`, declared at the top of `styles.css`, every theme and `icons.css` | Unlayered CSS | 2026-10-10 (0.1.9): any unlayered style in the consumer's app beats bit's, whatever its specificity, so overrides never need `!important` or a more specific selector (`packages/core/src/index.css`, CHANGELOG 0.1.9). |
| Release process | Version-bump PR, then a `v*` tag, guard, build, an approved publish with provenance, and an integrity-checked install | Changesets | 2026-10-04 (PR3c): Changesets was listed out of scope (`specs/2026-10-04-pr3c-release-design.md`). `TODO(owner): confirm rationale`. One package with one maintainer may be the reason, but nothing records it. |
| Theming scope | Theme and mode classes or attributes on any element, and `<BitTheme>` for a subtree | Root-only theming | 2026-10-10 (0.1.9): a part of the page, such as a dark sidebar on a light page or a second loaded theme, can take its own mode or theme (CHANGELOG 0.1.9; README "Part of the page"). |
