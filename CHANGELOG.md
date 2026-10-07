# Changelog

Package releases only. Docs-site changes don't appear here. One bullet per line.

## 0.1.4 — 2026-10-07
### Breaking
- `Select` draws its own list instead of the browser's, so it looks the same in every browser: themed in light and dark, sliding down from the box (or up, when there's no room below). The list opens in the browser's top layer with the Popover API (Chrome and Edge 114+, Safari 17+, Firefox 125+), so cards, tables and scrolling panels never clip it; older browsers get a fixed-position fallback.
- `Select` takes `options={[{ value, label, disabled? }]}` and `value` / `defaultValue` / `onValueChange={(value: string) => …}`, plus `placeholder`. `<option>` children, the native `onChange` event and the `<select>` element are gone; the ref is now the trigger `<button>`.
- In a form, `Select` still behaves like a native select: `name` submits the chosen value, `required` blocks an empty submit and moves focus to the Select, `disabled` submits nothing, `form="id"` ties it to a form elsewhere on the page, and a form reset puts it back to `defaultValue`.
### Added
- `SelectOption` type.
- Select works without a mouse: Enter, Space or the arrows open it; the arrows, Home, End, Page Up and Page Down move; typing jumps to an option; Enter or Space chooses; Escape closes the list (and only the list, not a dialog around it); Tab chooses and moves on. The list also closes when focus or the window leaves it. Screen readers hear a combo box with its label and value, and each option as you move.
### Changed
- The neutral colour is a visible slate: `#5F6372` with white text in light, `#9A9EB0` with ink text in dark (it was white on white, and barely different from the dark surface). `--bit-color-neutral-soft` is unchanged.
- SegmentedControl segments press like a Button: the segment under the pointer sinks one step, sinks fully while pressed, and springs back on release. The bar itself never moves.
### Fixed
- Field's label names a Select's list as well as its box. A Field's `required` (or the Select's own) marks the box `aria-required` and blocks an empty submit, as on a native select.
- The neutral Spinner's arc shows in dark mode: it reads the text colour there, where the light steel nearly matched the ring.

## 0.1.3 — 2026-10-06
### Added
- `useCopyToClipboard(text)` and the `CopyState` type: run a Copy button of your own the same way CodeBlock does. `copy()` resolves `true` when the text reached the clipboard and never rejects.
- SegmentedControl `multiple`: native checkboxes, `value`/`defaultValue` as `string[]`, and `onValueChange` called with the chosen values in option order. Nothing is chosen by default, and every segment can be turned off. Its props are the new `SegmentedControlMultipleProps` type; `SegmentedControlProps` stays the single-select props, unchanged. Pass `multiple` as a literal: a `boolean` variable doesn't type-check, so render the two cases separately.
- CodeBlock colours `language="ts"` and `language="tsx"`: TypeScript keywords, and generics such as `<T,>` and `<T extends U>` that are not JSX tags.
### Changed
- CodeBlock and Table scrollbars follow the theme. The track is the panel's own background (the dark code background, or the Table's surface), and the thumb is a solid bar in `--bit-color-accent` (violet in light, yellow in dark), set in from the edge so an even strip of track shows around it. The whole 14px bar stays draggable, and hovering doesn't change it. Firefox gets the same colours on its thin scrollbar.
- The Power Up theme loads its fonts from files in the package (`themes/fonts/`) instead of Google Fonts, so visitors' browsers make no third-party request. Every alphabet Google served is included, and a browser downloads a file only when the page uses its characters. Vite, Next.js and Create React App need no changes; a hand-written webpack 5 config needs a rule for `.woff2` files (`type: 'asset/resource'`). A strict CSP needs only `font-src 'self'` (plus `data:` if your bundler inlines small files). The SIL OFL licenses ship next to the fonts.
- `@bit-ds/react` has no runtime dependencies: Button `asChild` uses the package's own Slot instead of `@radix-ui/react-slot`. A single child element behaves as before.
### Fixed
- CodeBlock colours code in linear time. A large crafted input could freeze the page before (200 kB of `{` took about 30 seconds). Code longer than 50,000 characters shows as plain text.
- Link `asChild`: a callback ref on the child is no longer detached and re-attached on every render, and React 19 ref cleanup functions run.

## 0.1.2 — 2026-10-05
### Added
- Theme tokens for inline `Code`: `--bit-code-inline-text`, `--bit-code-inline-bg`, `--bit-code-inline-bg-on-tint` and `--bit-code-inline-selection`. Custom themes should declare all four in `:root` and in the dark block. A theme from 0.1.1 still works: `Code` falls back to `--bit-code-text`, `--bit-code-bg` and `--bit-color-selection`, without the old accent border.
### Changed
- Inline `Code` puts the accent in its text (light violet in light mode, yellow in dark) and has no visible border. In dark mode it sits on a lighter grey, and on the near-black CodeBlock colour inside Alerts, Card footers and hovered Links. Overriding `--bit-code-bg`, `--bit-code-text` or `--bit-color-accent` no longer restyles it in dark mode; override the `--bit-code-inline-*` tokens instead.
- Selected text inside inline `Code` highlights in lilac in dark mode, so it never matches the yellow text.
- Text is never smaller than 13px: Heading level 6, Table column headers and the CodeBlock language label go from 11px to 13px, and inline `Code` stays at 13px or more inside 13px text.
- `Text size={11}`, the 11 in `TEXT_SIZES` and `--bit-text-11px` are deprecated and will be removed in 0.2.0. Use 13. `Text size={11}` logs a one-time warning in development.

## 0.1.1 — 2026-10-04
### Added
- `data-mode="system"` follows the visitor's OS in CSS alone.
- The `colorMode` service (`set`, `toggle`, `mode`, `preference`, `onChange`), usable from any file.
### Changed
- `COLOR_MODE_SCRIPT` now only applies a saved choice. Following the OS is handled by `data-mode="system"`.
- `<html>` now holds `data-mode="system"` until the visitor chooses. Read `colorMode.mode` (or `useColorMode().mode`) for what's showing, and pair your own `[data-mode="dark"]` CSS with `@media (prefers-color-scheme: dark) { [data-mode="system"] … }`.
- If you pasted the 0.1.0 script into `index.html`, replace it with `data-mode="system"`. The old script still works, but it pins the mode for the visit.

## 0.1.0 — 2026-10-04
### Added
- First public release: 27 components, the Power Up theme, light and dark modes, the gallery.
