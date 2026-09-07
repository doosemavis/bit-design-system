# bit design system — design spec

**Date:** 2026-09-06
**Status:** approved in brainstorming, pending written review
**Repo:** `github.com/doosemavis/bit-design-system` (public, MIT)

## 1. Purpose and constraints

`bit` is an open-source React component library and design system built for one audience: an entry-level engineer who has to use it, change what a component looks like, and add a new option to it without reading a glossary.

Its visual identity is retro video games. The system ships **themes**, one per retro-game era or franchise vibe. The first theme, `power-up`, is "late-90s Mario chunkiness on PostHog's bold, bordered page." Future themes reuse every component unchanged and only swap token values.

Constraints that shaped every decision below:

- **Demo and portfolio purposes.** Optimize for clarity and showing the conventions off, not for production hardening (no i18n, no RTL, no SSR edge cases in v1).
- **Junior-first naming.** One vocabulary at every layer. No themed component names, no abbreviations, no value-based token names.
- **React only in v1.** Tokens and component CSS live in a framework-agnostic package so a second framework can be added later without a rewrite.
- **Open source, unpublished for now.** Packages carry `"private": true` until a publish decision is made.

## 2. The naming rule

**The word a junior types as a prop is the same word in the CSS class and the same word in the token.** Grep any one of them and you find the others.

```
<Button tone="primary">            prop
class="bit-button bit-primary"     class
--bit-color-primary                token
```

### 2.1 Prefix

All classes and custom properties are prefixed `bit-` / `--bit-`. Internal (private) custom properties are prefixed `--_bit-` and are never part of the public API.

### 2.2 Class grammar

| Kind | Pattern | Example |
|---|---|---|
| Block (component root) | `bit-{kebab-case component}` | `Button` → `bit-button`, `IconButton` → `bit-icon-button` |
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

Grammar: `--bit-{category}-{role}[-{modifier}]`. This is the complete list. Every theme must define every name; a test enforces it (§8.3).

**Color**

| Token | Meaning |
|---|---|
| `--bit-color-bg` | page background |
| `--bit-color-surface` | card / panel background |
| `--bit-color-ink` | borders, outlines, hard shadows |
| `--bit-color-text` | default text |
| `--bit-color-text-muted` | secondary text |
| `--bit-color-focus` | focus ring |
| `--bit-color-{tone}` | fill for the tone |
| `--bit-color-{tone}-contrast` | text on that fill |
| `--bit-color-{tone}-hover` | fill on hover |
| `--bit-color-{tone}-soft` | tinted background (alerts, ghost hover) |

`{tone}` ∈ `primary | neutral | success | warning | danger` (4 tokens × 5 tones = 20).

**Shape** (this is where the retro look lives)

| Token | power-up value |
|---|---|
| `--bit-border-width` | `3px` |
| `--bit-radius-sm` / `-md` / `-lg` / `-full` | `6px` / `10px` / `14px` / `999px` |
| `--bit-shadow-sm` / `-md` / `-lg` | `2px 2px 0 ink` / `4px 4px 0 ink` / `6px 6px 0 ink` |
| `--bit-shadow-inset` | `inset 3px 3px 0 rgba(ink, .12)` on inputs |
| `--bit-gloss` | `inset 0 3px 0 rgba(255,255,255,.4)` highlight lip on buttons |

**Typography**

| Token | power-up value |
|---|---|
| `--bit-font-display` | `'Lilita One', cursive` |
| `--bit-font-body` | `'Nunito', sans-serif` |
| `--bit-font-pixel` | `'Press Start 2P', monospace` (micro-labels only) |
| `--bit-text-xs` / `-sm` / `-md` / `-lg` / `-xl` / `-2xl` | `11 / 13 / 15 / 18 / 24 / 32px` |
| `--bit-leading-tight` / `-normal` | `1.1` / `1.5` |
| `--bit-weight-normal` / `-bold` | `600` / `800` |

**Space**: `--bit-space-1` … `--bit-space-8` = `4, 8, 12, 16, 24, 32, 48, 64px`.

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
| `--bit-motion-power-up` | keyframe name for the stepped grow (§7) |

### 3.3 Tier 3: component tokens

**Deliberately empty in v1.** A component token is added only when a real case appears where one component needs a knob the others don't.

### 3.4 How decorators are implemented

- **Tone decorators are global, written once.** `core/src/system/tones.css` maps each `bit-{tone}` class to private variables: `--_bit-tone`, `--_bit-tone-contrast`, `--_bit-tone-hover`, `--_bit-tone-soft`. Components consume the private variables. Adding a tone system-wide is: 4 semantic tokens per theme + one rule in `tones.css`.
- **Size decorators are global, written once.** `core/src/system/sizes.css` maps `bit-{size}` to `--_bit-size-height`, `--_bit-size-padding`, `--_bit-size-text`.
- **Variant decorators are per component**, because solid / outline / ghost render differently on a Button than on a Card. Each component's CSS has `.bit-button.bit-solid { }` style rules.

## 4. Component API

### 4.1 The three axes

Plain string props with fixed unions, so the editor autocompletes allowed values.

```
tone     primary | neutral | success | warning | danger
variant  solid | outline | ghost
size     sm | md | lg        (Text extends this to xs … 2xl)
```

Each component file opens with a constant listing the values it supports. That constant drives the TypeScript type and the emitted class:

```tsx
const variants = ['solid', 'outline', 'ghost'] as const;
```

Adding a variant to one component = add it to that array + add a CSS rule in the sibling `.css` file.

### 4.2 Rules every component follows

- Emits `bit-{component}` plus one decorator per supported axis, **always, including defaults**, so CSS can rely on their presence.
- Appends the caller's `className` **last**, so `<Button className="bit-danger">` overrides the default tone.
- Forwards its `ref` to the root DOM node.
- Spreads unknown props onto the root DOM node.
- Booleans become **attributes, never classes**: native where they exist (`disabled`, `aria-invalid`), `data-` otherwise (`data-loading`, Radix's `data-state`).
- Compound parts are **separate named exports** (`Card`, `CardHeader`, `CardBody`, `CardFooter`), each mapping to a BEM element class.
- Form controls shadow the native `size` attribute; ours means sm / md / lg.
- Layout-only props (Stack direction, gap) are `data-` attributes, not decorators, because they are not design axes.
- Unknown axis values (possible for plain-JS callers) log a dev-only warning and are dropped. Nothing throws at runtime for a styling mistake.

### 4.3 The 20 components

| Component | tone | variant | size | Notes |
|---|---|---|---|---|
| **Phase 1: Foundation** | | | | |
| Button | ✓ default `primary` | ✓ | ✓ | `loading` → `data-loading`; `asChild` via Radix Slot |
| Badge | ✓ default `neutral` | solid, outline | sm, md | |
| Alert | ✓ default `neutral` | solid, outline | | `title` prop; outline uses `-soft` bg |
| Card | | solid, outline | | `CardHeader`, `CardBody`, `CardFooter` |
| Stack | | | | `direction`, `gap`, `align`, `justify`, `wrap` as data attrs |
| Text | muted via tone `neutral` | | xs … 2xl | `as` (p, span, h1–h6), `weight` |
| Spinner | ✓ | | ✓ | `aria-label` required |
| BitLogo | | | ✓ | see §7 |
| **Phase 2: Forms** (native elements, styled) | | | | |
| Input | | | ✓ | `invalid` → `aria-invalid` |
| Textarea | | | ✓ | |
| Select | | | ✓ | native `<select>` + chevron |
| Checkbox | | | ✓ | native input, `appearance: none` |
| RadioGroup / Radio | | | ✓ | group supplies `name`, layout |
| Switch | | | ✓ | native checkbox with `role="switch"` |
| Field | | | | `label`, `hint`, `error`, `required`; wires `aria-describedby` via `useId` |
| **Phase 3: Interactive** (Radix Primitives) | | | | |
| Modal | | | ✓ | Radix Dialog; `Modal`, `ModalTrigger`, `ModalClose`; `title`, `description` props |
| Tabs | | | ✓ | Radix Tabs; `Tabs`, `TabList`, `Tab`, `TabPanel` |
| Tooltip | | | | Radix Tooltip; `content` prop wraps children |
| Menu | item tone (`danger`) | | | Radix DropdownMenu; `Menu`, `MenuTrigger`, `MenuItem`, `MenuSeparator` |
| Avatar | | | ✓ | Radix Avatar; `src`, `name` → initials fallback |
| Table | | | ✓ | plain styled table; `striped` → `data-striped`; row/cell exports |

## 5. Theming

- **A theme is one CSS file** that defines its primitives and the complete semantic set under `[data-theme="{name}"]`. The first theme is also applied to `:root`, so a consumer with no attribute set still gets a fully styled app.
- **Switching** is one attribute on the root element. No JavaScript required. Storybook gets a toolbar dropdown.
- **Names are descriptive, never trademarks.** `power-up`, not `mario`.
- **Effects are tokens even when unwanted.** A flat theme sets `--bit-gloss: none` and `--bit-shadow-md: none`. Component CSS never knows which theme is active.
- **Fonts ship with the theme.** Each theme file starts with the Google Fonts `@import` for its faces. All power-up faces (Lilita One, Nunito, Press Start 2P, Bungee for the logo) are SIL Open Font License. Self-hosting is a Phase 4 improvement.
- **Completeness is tested.** See §8.3.
- **Adding a theme:** copy `power-up.css`, change values, run the test, add it to the package `exports`.
- **Dark mode is reserved, not built:** a second attribute `data-mode="dark"` layered under the theme. v1 ships light only.

### 5.1 power-up theme direction (approved mockup: "C · Power-Up")

Warm cream page, thick ink outlines, hard offset shadows, gloss lip on solid buttons, recessed inputs, chunky display headings, pixel font only for micro-labels (eyebrows, badges), readable body text. Buttons press down on hover (`translate(press-offset)` + shadow shrinks). Primary is coin yellow with ink text; danger is red; success is pipe green.

Open item: the coin icon / iconography treatment is not decided and may change.

## 6. Package layout

```
bit-design-system/
├── packages/
│   ├── core/                     @bit/core   framework-agnostic, zero deps
│   │   └── src/
│   │       ├── themes/power-up.css
│   │       ├── tokens.ts             semantic token name list (drives completeness test)
│   │       ├── system/               reset.css, tones.css, sizes.css, motion.css
│   │       ├── components/           button.css, card.css, … one per component
│   │       └── index.css             imports system + every component file
│   └── react/                    @bit/react  depends on core, Radix; React is a peer dep
│       └── src/
│           ├── system/               axes.ts (unions), toClasses(), warnUnknown()
│           ├── components/           Button/Button.tsx, Button.test.tsx, Button.stories.tsx
│           ├── logo/                 BitLogo
│           └── index.ts
├── apps/docs/                    Storybook 9, autodocs, theme toolbar
├── docs/superpowers/             specs and plans
├── package.json                  pnpm workspaces
└── tsconfig.base.json
```

**Tooling:** pnpm workspaces, TypeScript strict, tsup (ESM + CJS + d.ts), Vitest + React Testing Library + vitest-axe, ESLint, Storybook 9. No Turborepo or Nx.

**Package contract for `@bit/react`:**

- `exports`: `.`, `./styles.css` (core index), `./themes/*.css`
- `sideEffects: ["*.css"]`
- `peerDependencies`: `react`, `react-dom`
- `"private": true` until a publish decision

Consumer experience, the whole thing:

```tsx
import '@bit/react/styles.css';
import '@bit/react/themes/power-up.css';
import { Button } from '@bit/react';
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

**Deliverables:** the React component, a Storybook story, and an animated SVG export for the README (GitHub renders CSS-animated SVG).

## 8. Testing and error handling

Every component ships three sibling files: `X.tsx`, `X.test.tsx`, `X.stories.tsx`. Tests are written first (TDD). Coverage threshold **80%**, enforced in CI.

### 8.1 Per-component unit tests (Vitest + RTL)

- Renders root class and each axis maps to the correct decorator class, defaults included.
- `className` appended last; `ref` reaches the DOM node; unknown props land on the root.
- State props produce attributes, not classes.
- Interactive components: keyboard behavior (Escape closes Modal, arrows move Tabs, focus returns to trigger).

### 8.2 Accessibility tests

`vitest-axe` against every component's default render and each tone × variant. Contrast failures in a theme fail the build.

### 8.3 System tests (guard the conventions)

- **Theme completeness:** parse every `themes/*.css`, collect declared `--bit-` names, fail if any name in `tokens.ts` is missing.
- **Class contract:** every component's root class equals `bit-` + kebab-case of its export name, so the docs table cannot drift.
- **Logo:** `freeze` renders only the chosen era; reduced-motion disables the animation class.

### 8.4 Error handling

Compile-time via unions. Runtime: dev-only `console.warn` for unknown axis values, then drop. Missing theme attribute falls back to `:root`. Nothing throws for a styling mistake.

## 9. Build phases

Each phase gets its own implementation plan.

1. **Foundation.** Repo scaffold, tooling, core system CSS, power-up theme, `tokens.ts`, axes + `toClasses`, Button, Badge, Alert, Card, Stack, Text, Spinner, BitLogo, Storybook with theme switcher, CI (typecheck, test, axe), README, CONTRIBUTING, LICENSE.
2. **Forms.** Input, Textarea, Select, Checkbox, RadioGroup, Switch, Field.
3. **Interactive.** Modal, Tabs, Tooltip, Menu, Avatar, Table.
4. **Distribution (documented, not built in v1).** Changesets + GitHub Actions publish, Style Dictionary token pipeline (JSON source → CSS / TS / Tailwind preset), Storybook deploy + Chromatic, `npx bit init`, self-hosted fonts, dark mode, canary builds.

## 10. Repo hygiene (Phase 1)

MIT license. README with the animated logo and the three-line install. `CONTRIBUTING.md` containing the "add a component", "add an axis value", and "add a theme" recipes from §4.1, §3.4, §5. GitHub Actions CI. `.superpowers/` git-ignored.

## 11. Out of scope for v1

Angular or other frameworks, dark mode, i18n / RTL, npm publishing, Style Dictionary, IconButton, Toast, visual regression testing.

## 12. Decisions log

| Decision | Chosen | Rejected | Why |
|---|---|---|---|
| Naming methodology | one-vocabulary decorators + BEM block/element | pure BEM modifiers, utility-first, themed vocabulary | junior readability; grep-ability across layers |
| Element case | `bit-card__header` | `bit-cardHeader` | kebab is the HTML/CSS norm; silent case typos |
| Frameworks | React v1, CSS core separable | Web Components, React+Angular now | fastest path to a good v1 |
| Interactive a11y | Radix Primitives | hand-rolled | weeks saved, fewer a11y bugs, documented |
| Repo shape | pnpm monorepo, 2 packages + docs app | single package, Style Dictionary now | smallest layout that keeps the separation |
| Docs | Storybook 9 | custom Vite playground | autodocs from types; juniors know it |
| Form controls | styled native elements | Radix Select/Checkbox | simpler, accessible by default |
| Visual direction | C · Power-Up | A · Party Board, B · Ink & Cream | distinctive without hurting readability |
| Logo transition | A2 three-size stepped grow, no fades | hard cut w/ flicker, pop, roll, two-size | matches NES power-up exactly |
| Privacy | `"private": true` guard flag | private npm package | open-source repo makes a hidden package pointless |
| Name | `bit`, prefix `bit-`, repo `bit-design-system` | 32-bit, Lexicon, Sprite | themes per game under one name |
