# Icon: a curated Material Symbols set, as a component and as classes (0.1.6)

Date: 2026-10-08. Branch: `feat/icon-0.1.6`.
Boards (all in `~/.gstack/projects/doosemavis-bit-design-system/designs/icons-20261008/`):
- `board.html`: where icons come from. The owner picked an open-source set over hand-drawn, bring-your-own or Lucide.
- `weight.html` and `variants.html`: the pixelarticons weight and variants. The owner liked Bold 2×2 but found the solid pixel icons "messy and unreadable".
- `eras.html`: one set per console era, 8/16/32/64-bit. The owner picked **32-bit, Material Symbols Sharp, weight 700**.
- `gallery.html`: the "All icons" section. The owner picked **A, Copy on every tile**.

## Owner's intent
- "Add icon component that has all of the [icons] listed and each icon displayed allows the user to copy the code needed for that specific icon."
- "I still want the icons to be able to be used with className just like the other components too please, with the prefix used in our standardized naming conventions. bit-icon-{iconName} as an example."
- Icons must read clearly next to bit's bold borders and type, including the filled versions. The owner asked for "a more clear iconography across the board", which led to the 32-bit pick.
- No company logos.
- One set everywhere: icons don't change with the logo's era.
- It ships as **0.1.6**. The owner will tweak after it's built and released.

## Decisions taken during brainstorming
| Question | Pick |
|---|---|
| Source | Material Symbols, **Sharp** style, **weight 700**, from `@material-symbols/svg-700` (Apache 2.0) |
| Treatment | The artwork ships as drawn: no thickening, no 2×2 brush (that was only for pixel sets) |
| Catalogue | A **curated** set: 300 icons, each with its fill version, so **600 icons** |
| API | One `<Icon>` component plus one small data export per icon (`iconFavorite`), so unused icons drop out of bundles |
| Classes | `bit-icon bit-icon-{name}`, plus the usual `bit-{color}` and `bit-{size}` |
| Fill | A separate name (`iconFavoriteFill`, `bit-icon-favorite-fill`), not a prop |
| Gallery | Layout A: a tile per icon with its own Copy button, a React/HTML toggle and a Regular/Fill toggle |

## 1. Library

### `Icon` API
```tsx
import { Icon, iconFavorite, iconDelete } from '@bit-ds/react';

<Icon icon={iconFavorite} />                                         // decorative
<Icon icon={iconDelete} color="danger" size="lg" label="Delete" />   // meaningful
```

```ts
export interface IconData {
  /** Material name with `_` → `-`, plus `-fill` for a fill icon: 'keyboard-arrow-down', 'favorite-fill'. */
  readonly name: string;
  /** One SVG path on Material's 960-unit grid (viewBox "0 -960 960 960"). */
  readonly path: string;
}

export interface IconProps extends Omit<SVGAttributes<SVGSVGElement>, 'color'> {
  icon: IconData;
  /** Class: `bit-{color}`. Left off: the icon is drawn in the surrounding text colour (currentColor). */
  color?: Color;
  /** sm 16px, md 20px, lg 24px. Class: `bit-{size}`. */
  size?: Size;            // default 'md'
  /** Gives the icon a meaning for screen readers. Without it the icon is decorative. */
  label?: string;
}
```

| Prop | Default | Class | Notes |
|---|---|---|---|
| `icon` | required | `bit-icon-{icon.name}` | An `iconX` export |
| `size` | `'md'` | `bit-{size}` | 16 / 20 / 24px |
| `color` | none (currentColor) | `bit-{color}` | `toClasses` with `COLORS`; no class when left off |
| `label` | none | none | See accessibility |

### Markup
```html
<!-- <Icon icon={iconFavorite} /> -->
<svg class="bit-icon bit-icon-favorite bit-md" viewBox="0 -960 960 960" aria-hidden="true" focusable="false">
  <path d="M…"></path>
</svg>
<!-- with label="Favourite" -->
<svg class="bit-icon bit-icon-favorite bit-md" viewBox="0 -960 960 960" role="img" aria-label="Favourite" focusable="false">…</svg>
```
- `Icon` is a `forwardRef` to the `<svg>`. Rest props pass through, and `className` is merged by `toClasses` as everywhere else.
- The svg's fill is `currentColor` in CSS. Colour comes from the `color` property set by `bit-{color}`.
- The React Icon never needs `icons.css`. Its artwork is inline.
- An unknown `color` or `size` behaves as `toClasses` already does for other components.

### Accessibility
- No `label`: `aria-hidden="true"`. The icon is decoration, and the text next to it carries the meaning.
- With `label`: `role="img"` and `aria-label={label}`, and no `aria-hidden`.
- `focusable="false"` always, so old Edge/IE never tab to it.
- Icon-only buttons put the name on the button (`<Button aria-label="Close"><Icon icon={iconClose} /></Button>`), as Button's docs already say. The Icon page's usage notes say this too.
- Forced colours: the inline svg uses `currentColor`, so it follows the system text colour. A mask icon (classes) gets `background-color: CanvasText` and `forced-color-adjust: none` so it stays visible.

### Class-name version
```html
<!-- after importing '@bit-ds/react/icons.css' -->
<span class="bit-icon bit-icon-favorite bit-danger bit-lg" aria-hidden="true"></span>
<span class="bit-icon bit-icon-delete" role="img" aria-label="Delete"></span>
```
- `.bit-icon` base rules live in **`styles.css`** (core `components/icon.css`):
  - `display: inline-block`, `flex: none`, `vertical-align: middle`
  - width and height are `var(--_bit-icon-size)`, which is 20px by default, and `bit-sm`/`bit-md`/`bit-lg` set it to 16/20/24px
  - colour: svg `fill: currentColor`. Only an icon that carries its **own** colour class gets `color: var(--_bit-color)`, via a selector like `.bit-icon:is(.bit-primary, .bit-neutral, .bit-success, .bit-warning, .bit-danger)`. `--_bit-color` inherits, so an unscoped rule would turn an icon inside a solid primary Button purple-on-purple. A test covers this.
  - for a `span.bit-icon` (the mask form): `background-color: currentColor; mask: var(--_bit-icon) center / contain no-repeat` (plus `-webkit-mask`)
- The `bit-sm/md/lg` icon sizes are scoped to `.bit-icon.bit-{size}`, so they never touch control sizes.
- **`icons.css`** holds only one rule per icon: `.bit-icon-favorite{--_bit-icon:url("data:image/svg+xml,…")}`. It's 600 rules, measured at **245 KB raw / 46 KB gzip**. It is never part of `styles.css`.
- The React `<svg>` also carries `bit-icon-{name}`. That class is harmless without `icons.css` (it only sets a custom property), and it keeps the class names identical between the two forms.

### Naming
| Material file | `name` | React export | Class |
|---|---|---|---|
| `keyboard_arrow_down.svg` | `keyboard-arrow-down` | `iconKeyboardArrowDown` | `bit-icon-keyboard-arrow-down` |
| `favorite-fill.svg` | `favorite-fill` | `iconFavoriteFill` | `bit-icon-favorite-fill` |
- The generator fails if:
  - two names map to the same export or class
  - a name doesn't produce a valid identifier (names starting with a digit are not in the curated list)
  - a name would produce `bit-icon-button`, which the 2026-09-06 naming table reserves for a future IconButton block
- The base class `bit-icon` follows the block rule (`bit-{component}`). `bit-icon-{name}` is the owner's requested per-icon class.

## 2. Source, generator and packaging

### Source
- `@material-symbols/svg-700` is a **devDependency of `@bit-ds/react`, pinned to exactly `0.47.6`**, the same rule as the `@fontsource` fonts. Consumers never install it.
- Files used: `sharp/{name}.svg` and `sharp/{name}-fill.svg`. Every one is a single `<path>` on `viewBox="0 -960 960 960"`. The generator fails on any other shape.
- It adds no install script. `onlyBuiltDependencies` stays `[]`.

### Curated list
- `packages/core/src/icons/icons.json` is an object of **8 groups → Material names** (regular names only, since every listed icon also ships its fill):
  Arrows & navigation (39), Actions (51), Status & feedback (39), Text & editing (40), Files & data (37), Communication & people (30), Media & devices (35), Places, time & commerce (29).
- The draft list is `icons.draft.json` in the boards folder. It has no logos, no duplicates, and every name has a `-fill`.
- Group order and in-group order are the gallery's order.

### Generator: `scripts/build-icons.mjs` (`npm run icons`)
- It reads `icons.json` and the pinned package, and writes two **committed** files:
  1. `packages/react/src/icons/icons.generated.ts`: `export const iconX: IconData = { name, path };` for all 600, plus `export const ICON_GROUPS` (group → regular names, for the gallery) and a header saying "generated, do not edit".
  2. `packages/core/src/icons/icons.generated.css`: the 600 `--_bit-icon` rules, with a header naming the Material version and licence.
- Output is sorted and deterministic, so running it twice gives byte-identical files.
- A test runs the generator in memory and fails if the committed files differ, saying "run npm run icons".

### Packaging
- `packages/react/src/index.ts` exports `Icon`, `IconProps`, `IconData`, `ICON_GROUPS` and `export * from './icons/icons.generated'`.
- ESM consumers' bundlers drop unused icon consts, since `sideEffects` covers only `*.css`. CJS doesn't tree-shake, which is accepted.
- `build-css.mjs` also builds `dist/icons.css` from `icons.generated.css`, and copies the Material licence to `dist/icons/LICENSE-material-symbols.txt`.
- `package.json` `exports` gains `"./icons.css": "./dist/icons.css"`.
- `verify-dist` and `expected-exports` check that:
  - `dist/icons.css` exists and has 600 `.bit-icon-` rules
  - the licence file is present
  - the export list is the expected components plus exactly the `icon*` names from `icons.json`, worked out from the list and not hard-coded
- The README credits Material Symbols (Apache 2.0) and shows both forms of the Icon.

## 3. Gallery: the Icon page

### Manifest (`manifests/icon.ts`, group `components`)
- **Description:** "A Material Symbols icon, as a React component or plain classes. 300 icons, each with a fill version."
- **Controls:**
  - `icon`, a select of about 12 common names (favorite, home, search, settings, delete, check-circle, warning, mail, person, download, add, close)
  - `fill`, a boolean
  - `color`, the axis plus "none" as the default
  - `size`, the axis, default md
  - `label`, text, default empty
- `deriveProps` turns `icon` + `fill` into the `icon` prop.
- **Printed React code** (the code engine needs an identifier printer, since this isn't a literal):
  ```tsx
  import { Icon, iconFavorite } from '@bit-ds/react';

  <Icon icon={iconFavorite} color="danger" />
  ```
- **The HTML tab** prints the class-name form (`<span class="bit-icon bit-icon-favorite bit-danger bit-md" aria-hidden="true"></span>`) and notes the extra import of `@bit-ds/react/icons.css`. It doesn't print the 600-character inline svg.
- **Presets:** "Danger delete" and "Filled heart".
- **Variants:** colour × size on one icon, via the existing Variants table.
- **Docs:**
  - badges: `Inline <svg>`, `Apache 2.0 artwork`
  - usage do/don't: use a label for a meaningful icon; put the name on the button for icon-only buttons; don't use an icon as the only cue for an error
  - props table with class names
  - a11y notes from §1

### New section: "All icons" (layout A)
- It sits after Variants and before Usage. Section id is `section-all-icons`, title "All icons", and it's added to the SectionBar.
- This section is only for Icon. `Manifest` gains an optional `extraSection?: { id: string; title: string; Component: ComponentType }`. `componentSections()` puts it after Variants, and `DocsSections` renders it there. No check for the slug is hard-coded.
- **Toolbar:**
  - a search Field + Input labelled "Search icons", matching icon **names only** (spaces and hyphens are treated alike)
  - a SegmentedControl "Copy as": React | HTML
  - a SegmentedControl "Style": Regular | Fill
- A line under the toolbar says exactly what Copy gives for the current toggles. For HTML it also names the `icons.css` import.
- **Grid:** grouped under the 8 group headings. Groups with no matches are hidden, and with no matches at all it shows "No icons match. Try another word."
- **Tile:** the icon at 32px, its `name`, and the gallery's existing `CopyButton`, labelled "Copy {name}" (WCAG 2.5.3). It shows "Copied" for two seconds and announces it.
- **Copy gives:**
  - React: `import { Icon, iconFavorite } from '@bit-ds/react';\n\n<Icon icon={iconFavorite} />`
  - HTML: `<span class="bit-icon bit-icon-favorite" aria-hidden="true"></span>`
  - With Fill, both use the `-fill` / `Fill` name.
- **Rendering:** the grid draws the icons with the real `Icon` component (all 600 are imported by the gallery, which is fine because it's a docs site). It needs no virtualisation at 300 tiles.
- **Search box state:** not saved in the URL, matching the other gallery controls.
- **Home page:** the Icon tile chip shows a real icon (for example `iconCategory`) in place of the first-letter fallback.

## 4. Testing and release

### Tests
- **`Icon` unit tests:**
  - classes for every size and colour
  - no colour class by default
  - decorative vs labelled attributes
  - `focusable="false"`
  - ref forwarding, className merge and rest props
  - the path renders
- **Generator:**
  - committed files match a fresh run
  - 600 exports and 600 CSS rules
  - names map to unique exports and classes
  - every listed name has a fill
  - a non-single-path source or a reserved `button` name makes it fail
- **CSS:**
  - core system test (icon.css imported in index.css)
  - forced-colours rule present
  - `icons.css` not included in `styles.css`
- **Gallery:**
  - Icon page renders with sections in order
  - search filters by name and shows the empty state
  - toggles change the copy text and artwork
  - Copy writes the exact text (React and HTML, regular and fill)
  - HTML tab shows the class form
  - routes and dark tests include Icon
- **e2e:** open the Icon page, search "arrow", switch to HTML + Fill, press a Copy button, and check the clipboard text.
- Coverage stays at or above the repo's thresholds.

### Release
- Bump `@bit-ds/react` to **0.1.6** (an installable change).
- CHANGELOG entry, README component list + Icon section + Material credit.
- The Versions page gets rebuilt by the release workflow. Check it live after publishing.

## Out of scope
- More icons beyond the 300, or other Material styles (outlined, rounded) or weights.
- An icon picker or fuzzy/synonym search.
- Era-switching icon sets.
- Swapping the hand-made glyphs already inside Alert/Dialog close buttons for Icon. That's a possible follow-up once Icon ships.
