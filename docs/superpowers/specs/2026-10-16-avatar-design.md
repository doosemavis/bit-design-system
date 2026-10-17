# Avatar

**Status:** owner picked the look on the board (2026-10-16); built on `feat/avatar`, awaiting localhost review.
**Source:** base spec §4.3: "Avatar · sizes ✓ · `src`, `name` → initials fallback". The spec's "Radix Avatar" is superseded: bit builds on native elements (ARCHITECTURE §4, "Implementation model").

## Owner picks (board, 2026-10-16)

- **Shape: all three**, as a `shape` prop (`data-shape`, not a class, like Badge's): `circle` (default; 2px line border, hard shadow), `square` (the 6px radius of a square Badge) and `pixel` (square corners, 3px border, initials in the pixel font).
- **Color: one color you choose**, `neutral` by default, on the shared color axis (`color` prop or `bit-{color}` class). No color picked from the name.
- **Extras: none in v1.** AvatarGroup and a status dot are later, separate PRs.

## API

```tsx
<Avatar name="Ada Lovelace" src="/ada.png" />
<Avatar name="Grace Hopper" color="primary" size="lg" shape="pixel" flat />
```

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `name` | `string` | required | The accessible name, and the source of the initials |
| `src` | `string` | | The photo. Missing, or failing to load, shows the initials |
| `color` | `Color` | `'neutral'` | Class `bit-{color}`: the fill behind the initials |
| `size` | `Size` | `'md'` | Class `bit-{size}`: the control heights, 32 / 40 / 48px, so an Avatar lines up with a Button |
| `shape` | `'circle' \| 'square' \| 'pixel'` | `'circle'` | `data-shape` |
| `flat` | `boolean` | `false` | Class `bit-flat`: no hard shadow |

Everything else spreads on the root `<span>`; `ref` is the root.

## Markup

```html
<span class="bit-avatar bit-neutral bit-md" data-shape="circle" role="img" aria-label="Ada Lovelace">
  <span class="bit-avatar__initials" aria-hidden="true">AL</span>
  <img class="bit-avatar__image" src="/ada.png" alt="">
</span>
```

- The root is `role="img"` named by `name`, so a screen reader hears one image, "Ada Lovelace", whether the photo or the initials show. The `<img>` is `alt=""` inside it.
- The initials are always rendered under the photo: they show while it loads and stay when it fails. On `error` the `<img>` is removed (no broken-image icon). A new `src` tries again.
- **Initials:** the first letter of the first word and of the last word, uppercased (`Ada Lovelace` → `AL`, `Cher` → `C`, `Mary Ann Evans` → `ME`). Letters are read by code point, so an emoji or accented letter isn't split.
- Beside a visible name (a list row, a Button), pass `aria-hidden` so the name isn't heard twice.

## Styles (`core/components/avatar.css`)

- Size from `--_bit-size-height`. The initials are the body font, bold, at 40% of the height. `pixel` uses the pixel font at 25%.
- Fill `--_bit-color`, initials `--_bit-color-contrast`, border `--bit-color-line`, shadow `--bit-shadow-sm`.
- Forced colors: the fill drops, so the initials and border use the system text color.

## Not in v1

AvatarGroup (overlap, `max`, "+N"), a status dot, a color picked from the name, an `alt` separate from `name`, and loading or error callbacks.

## Tests

- React: classes and decorators, `data-shape` (and an unknown shape warns), initials rules, photo then error fallback and retry on a new `src`, `role="img"` with its name, ref and `className` last, axe for every color × shape.
- Core: the layer import and the token rules the system test already checks; contrast of the initials on each fill.
- Gallery: a manifest page (controls, presets, docs), listed on Home under Feedback, in the sidebar under Components.
