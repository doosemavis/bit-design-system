# Changelog

Package releases only. Docs-site changes don't appear here. One bullet per line.

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
