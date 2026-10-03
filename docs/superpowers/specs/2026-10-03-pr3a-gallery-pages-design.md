# PR3a: Gallery pages, design

**Status:** approved in brainstorming on 2026-10-03 with one board. This written spec awaits the owner's review.

**Ships as:** its own PR on `feat/gallery-pages`. It is the first of three PRs that replace the original PR3:
- **3a:** pages (this spec)
- **3b:** the dogfooding lint, Playwright, and the component follow-ups
- **3c:** Storybook removal, CI, the release workflows, and the first npm publish

**Visual reference:** `~/.gstack/projects/doosemavis-bit-design-system/designs/pr3a-20261003/board.html`, which redraws the approved 2026-10-02 mockups (`docs/designs/mockups/`) in today's style.

**Scope sources:**
- `docs/superpowers/plans/2026-09-13-gallery.md`: amendments §E (states), §H (fixes to built code) and T9 (pages)
- `docs/designs/gallery-dogfood.md`: the version display

## Goal

The gallery becomes the finished documentation site that ships with the first npm release:
- **Every component page** teaches the component: Playground, Variants, Usage, Props and Accessibility.
- **The Tokens page** shows the theme's whole public API.
- **Home** onboards a new user, with the install command in their package manager.
- **The known bugs in the built gallery are fixed:** focus jumps, history, the skip link, loading and errors, and the phone-width layout.

## Decisions (owner, 2026-10-03)

| # | Decision |
|---|---|
| 1 | **C1:** layout C for every component page. |
| 2 | **T1:** the Tokens page keeps Color, Shape and All tokens in full. Type and Space shrink to one compact row each, linking to the Typography and Spacing pages. |
| 3 | **H1:** Home shows every component as a tile, grouped Components then Forms, with large live tiles for the headline components and compact tiles for the rest. |
| 4 | **P1, install switcher:** every install command offers pnpm, npm and yarn. The switch sits in the CodeBlock bar, left of Copy, and the gallery remembers the visitor's pick. |
| 5 | **CodeBlock gains a public `actions` slot,** so the switcher can be built from bit itself. |

## 1. Library change: `CodeBlock` `actions`

```ts
interface CodeBlockProps {
  // ...existing: code, language, copy, label
  /** Extra controls in the bar, rendered between the language label and Copy. */
  actions?: ReactNode;
}
```

- **Markup:** a `<div class="bit-code__actions">` wraps the slot inside the bar, before Copy. Nothing is rendered when `actions` is absent.
- **Layout:** the bar keeps the label on the left. The actions and Copy are grouped on the right with `gap: var(--bit-space-8px)`.
- **Copy** always copies the current `code` prop. A switcher that changes `code` therefore changes what Copy copies.
- **Docs:** the CodeBlock manifest's Props table lists `actions`.
- **Tests:** react tests cover the slot rendering, its absence, and its order relative to Copy. Coverage stays at 100%.

## 2. Library change: Table cells centre vertically

- In `packages/core/src/components/table.css`, cell alignment changes from `vertical-align: top` to `vertical-align: middle`.
- The core test asserts the new value.

## 3. Component page (layout C)

Every manifest route gets the same page: 19 component pages plus Brand → Logo. In order:

**Header:**
- the eyebrow (the group name in the pixel face)
- a `Heading level={1}` with the component name
- the description
- the import chip: an inline `Code` reading `import { Name, ...parts } from '@bit-ds/react'`, plus Copy
- the manifest's `docs.badges` as Badges

**Section bar:** bit Links to Playground, Variants, Usage, Props and Accessibility. Activating one calls `preventDefault`, scrolls the section into view, and focuses its h2 (`tabIndex=-1`). The URL does not change, because hash routing would treat a fragment as a route.

**Playground:**
- **Presets:** shown as ghost Buttons. The preset whose state equals the current state shows as active (`aria-pressed="true"` and the solid look).
- **Checkerboard:** a Switch toggles the checkerboard stage.
- **Preview and controls:** side by side on desktop. Under 720px the controls stack below the preview.
- **Footer:** a SegmentedControl switches React and HTML, a "Full file" Switch wraps the JSX in the standalone example, and the code appears in a CodeBlock.
  - The HTML option appears only for static components; it is the existing `toHtml` rule.
  - The full-file wrapper is gallery-private.

**Variants:** a Table with one row per color and one column per variant, drawn live. It replaces today's Matrix toggle, so `engine/Matrix.tsx` is deleted. Components without both a color axis and a variant axis show their single axis as one row. With neither axis, the section is omitted from both the page and the section bar.

**Usage:** two Cards in soft success (Do) and soft danger (Don't), listing `docs.usage.do` and `docs.usage.dont`.

**Props:** a Table with the columns prop, type, default and description, from `docs.props`.

**Accessibility:** a bullet list from `docs.a11y`.

**Docs are required:**
- Every manifest gets a complete `docs` block, written for a reader new to design systems: badges, usage, props and a11y.
- `Manifest.docs` becomes required.
- The contract test asserts every manifest has at least one Do, one Don't, one prop and one a11y line, and that every prop the controls expose appears in `docs.props`.

**Empty children:** when the `children` text control is emptied:
- The preview shows the empty component, and the code prints a self-closing tag.
- If the manifest has `docs.emptyChildrenError`, the field shows that error.

## 4. Tokens page

The page reads token values from the live document's computed style (`getComputedStyle(document.documentElement)`), so the values always match the current mode. They update when the mode changes, and they are computed on first render, so nothing flashes blank.

- **Header:** the eyebrow "Foundations", a `Heading` "Tokens", and a one-line intro. A section bar for Color, Type, Space, Shape and All tokens works like the component page's.
- **Color:**
  - One Card per semantic colour (primary, neutral, success, warning, danger). Each has a coloured header and four rows: fill, hover, soft and contrast. Each row shows a swatch, the name and the hex value.
  - Below the cards, a row of surface tokens: bg, surface, text, text-muted, ink and focus.
- **Type (compact):** one row showing the four faces by name in their own face, the text sizes 11–32 as small samples, and a "See Typography →" Link.
- **Space (compact):** one row of the eight space steps as small bars with their numbers, and a "See Spacing →" Link.
- **Shape:** tiles for each radius token and each shadow token, labelled with the token name and value.
- **All tokens:**
  - a Field and Input labelled "Filter", plus a Badge "N of M tokens"
  - a Table of token name, its value in the current mode, and Copy (which copies `var(--name)`)
  - When the filter matches nothing: the text "No tokens match “x”.", an example of the name format, and a "Clear filter" Button.
  - The token list comes from `@bit-ds/core`'s exported `SEMANTIC_TOKENS`.

## 5. Home page

In order:

1. **Hero:**
   - `BitLogo size="lg"` as the h1
   - the tagline "A retro-game React design system for people new to design systems. The prop you type is the class it emits is the token it reads."
   - a primary Button "Browse components →" (to the first component) and an outline Button "See the tokens"
2. **Components:**
   - Two `Heading level={2}` groups: "Components" with a count Badge (15), then "Forms" with a count Badge (4).
   - Large tiles go to Alert, Button, Card and SegmentedControl, and to all four Forms components. Each large tile has a small live preview on top and a footer with the name and →.
   - Every other component gets a compact tile: a small icon chip, the name and →.
   - Every tile is one Link to its page.
   - Tiles come from the manifests, so a new manifest appears automatically.
3. **Get started:** three numbered steps, each with a yellow number Badge, a `Heading level={3}`, a line of help, and a CodeBlock.
   1. **Install:** a Badge `v{version}` and the install switcher (section 6).
   2. **Add the styles once:** the two style imports, theme first.
   3. **Use a component:** the import line and `<Button>Save</Button>`.
4. **The naming rule:** a Table with the columns You write, Class, Token and Result, and three rows (`color="primary"`, `variant="outline"`, `size="lg"`). The Result column renders the real Button.

**Version:**
- The version is read from `packages/react/package.json` at build time through Vite `define` (`__BIT_VERSION__`), with a test.
- It shows `v0.0.0` until 3c sets the release version.

## 6. Install switcher (`InstallCommand`, gallery)

- **Markup:** a CodeBlock with `language="shell"`. Its `actions` holds a SegmentedControl, size sm and labelled "Package manager", with the options pnpm, npm and yarn.
- **Commands:**

  | Manager | Command |
  |---|---|
  | pnpm | `pnpm add @bit-ds/react` |
  | npm | `npm install @bit-ds/react` |
  | yarn | `yarn add @bit-ds/react` |

- **Shared source:** the commands live in one gallery module, `content/install.ts`. 3c's `snippets.mjs` and the consumer smoke test will import from it.
- **Default:** pnpm.
- **Remembering the pick:** it is stored in `localStorage` under `bit-gallery-package-manager`. Every read and write is wrapped in try/catch, so blocked storage falls back to pnpm silently. An unknown stored value also falls back to pnpm.
- **Where it's used:** wherever the gallery shows an install command. Today that is Home step 1.
- **README:** the install section lists all three commands.

## 7. Shell fixes (plan §H, §E)

1. **Focus:** `useFocusHeading` fires only when `pathname` changes, not on every location key. Changing a control no longer steals focus.
2. **History:**
   - Selects, switches, presets and Reset push a history entry.
   - Text and number edits replace the current entry, debounced 400ms.
   - Tests check that a keystroke keeps focus and that Back undoes a select.
3. **Skip link:** a bit Link that calls `preventDefault`, scrolls to `#main` and focuses it (`tabIndex=-1`). The route doesn't change. The same helper serves the section bars.
4. **Lazy pages:**
   - While a page loads, a Spinner with "Loading <Name>…" appears after 300ms.
   - A route `errorElement` shows a danger Alert, "This page didn't load. Check your connection and try again.", with a primary "Reload page" Button.
5. **Unknown component slug:**
   - The h1 reads "No component called “x”".
   - A "Go to <closest> →" Link appears when a manifest name is within edit distance 3.
   - Every component is listed as a Link.
   - Other bad paths keep the generic 404 with "Back to home".
6. **Shared links with bad values:** invalid URL values reset to their defaults, and the URL is rewritten with replace. This is existing behaviour, and a test confirms it.
7. **Phone width (390px, no horizontal page scroll):**
   - The header shows Menu, the logo and the ModeToggle; GitHub moves into the sidebar sheet.
   - The sidebar opens as a full-height sheet over the page and closes on navigation or Escape.
   - The controls stack under the preview, and the presets scroll sideways in one row.
   - Tables scroll inside their own border, which Table already does.
8. **Titles:** every gallery page title uses `Heading` instead of `Text as="h1"`/`"h2"`.
9. **Polish:** the token chips on the Typography face cards align to the same baseline.

## 8. Testing and done criteria

**React:** the CodeBlock `actions` tests, with coverage kept at 100%.

**Core:** the Table `vertical-align: middle` assertion.

**Gallery:**
- **Contract test:** `docs` is required and complete (section 3), and presets are validated against their controls.
- **Component page:** all five sections render. The section bar focuses its target without changing the route. The active preset shows `aria-pressed`. The Variants table has one cell per color × variant. Empty children show the manifest error.
- **Tokens:** the colour cards show computed values. The filter shows its count, the empty state and Clear. Copy is present.
- **Home:** there is one tile per manifest except Logo. The version Badge equals the package version. The naming rule renders real Buttons.
- **InstallCommand:** all three commands are present. Copy copies the selected one. The pick persists and is restored, blocked storage falls back to pnpm, and an unknown stored value falls back to pnpm.
- **Shell:** focus fires on pathname only. Push and replace history work. The skip link keeps the route. Loading shows after 300ms. The errorElement renders. The unknown slug suggests the closest name. At phone width the header has no GitHub button.
- **Route smoke:** axe runs on every route, `/tokens` included, in light and dark.

**By eye:** a real-browser board of Home, Tokens, Button, Table and the 404 at 1200px and at 390px, in light and dark. The board also confirms `scrollWidth <= 390` on every page at 390px.

**Done:** every gate is green: build, verify, typecheck, lint, tests, coverage, smoke and `storybook:build`.

## Not in this PR

These move to **3b**:
- the ESLint ban on raw HTML in the gallery, and rewriting ControlsPanel, Preview and ThemeSelect on bit components
- the `gallery.css` layout-only test
- Playwright
- the component follow-ups: Link inside a solid Alert, distinct Copy names, forced-colours invalid borders, the Table tab stop, TS-generics colouring, and deriving `FOUNDATION_PAGES` from NAV

These move to **3c**:
- removing Storybook
- CI and the release workflows
- `snippets.mjs`, which imports this PR's `content/install.ts`
- the release version bump
- the first publish
