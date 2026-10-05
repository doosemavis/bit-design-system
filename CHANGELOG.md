# Changelog

Package releases only. Docs-site changes don't appear here. One bullet per line.

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
