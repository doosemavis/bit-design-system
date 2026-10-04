# Color mode service and `data-mode="system"`: design

**Status:** Approved by the owner in chat on 2026-10-04 (board: `designs/no-flash-20261004/board-service.html`). It builds on `2026-10-03-dark-mode-design.md`. The owner asked for this model specifically. It mirrors an Angular design system they've used: you set a default theme in `index.html`, then switch it through an imported service.

**Ships as:** `@bit-ds/react` **0.1.1**. It's a library feature and isn't breaking. The owner's rule for 0.x: features and fixes are patches, breaking changes are minors. With npm's `^0.1.0` ranges, that lets every consumer pick the feature up automatically. The work lands on branch `feat/color-mode-service` and stops before merge, tag and publish.

## Goal

An entry-level engineer can:
1. **Set the default mode in `index.html`** with one readable attribute and no script: `<html data-mode="system">`, `"light"` or `"dark"`.
2. **Switch the mode from any file** through an imported service object: `colorMode.set('dark')`, `colorMode.toggle()`, `colorMode.mode`.
3. **Skip the minified no-flash script** in almost every case. It shrinks to an optional, readable two-line snippet. It only matters when a visitor's saved choice differs from their OS setting.

None of these break:
- `data-mode="light|dark"` on any element
- `useColorMode()`
- `<ModeToggle />`
- `COLOR_MODE_SCRIPT`
- `COLOR_MODES`
- `COLOR_MODE_STORAGE_KEY`

## 1. CSS: the `system` value (`packages/core/src/themes/power-up.css`)

- The shared block's selector list gains `[data-mode="system"]`. An element set to system then re-declares the shared tokens, the same way light and dark already do.
- A new `@media (prefers-color-scheme: dark) { [data-mode="system"] { … } }` holds **the same declarations** as the `[data-mode="dark"]` block, including `color-scheme: dark`. On a light-preferring OS the element gets the root's light tokens.
- No attribute still means light in CSS, as today. At startup the service turns a missing attribute into `system` (§2), which keeps today's follow-the-OS behaviour for hook users.
- **Parity test (core):** the `system` dark block and the `[data-mode="dark"]` block must declare the same property set with the same values. That stops a token being added to one and forgotten in the other. The theme-completeness and mode-token tests stay green.

## 2. The service (`packages/react/src/mode/colorMode.ts`)

The service is a class with one shared instance, the React equivalent of an Angular service provided in root. There is one store because there is one page root.

```ts
export type ColorMode = 'light' | 'dark';                 // what is showing (unchanged)
export type ColorModePreference = ColorMode | 'system';   // what was asked for; the HTML attribute's words

export class ColorModeService {
  /** What is showing right now: 'light' or 'dark' ('system' resolved against the OS). */
  get mode(): ColorMode;
  /** What was asked for: the saved choice, else the page's data-mode, else 'system'. */
  get preference(): ColorModePreference;
  /** Switch and remember. 'system' forgets the saved choice and follows the OS again. */
  set(preference: ColorModePreference): void;
  /** Switch to the opposite of what is showing, and remember it. */
  toggle(): void;
  /** Call `listener(mode)` whenever the showing mode changes (a choice or an OS change). Returns an unsubscribe. */
  onChange(listener: (mode: ColorMode) => void): () => void;
}

/** The shared service. Import it anywhere: colorMode.set('dark'). */
export const colorMode: ColorModeService;
```

- **Naming:** `set('system')` replaces the board's `followSystem()`, so the same three words work in HTML and in code. This is the one change from the board. Flag it to the owner in the plan review.
- **Startup is lazy.** It runs on the first `mode`, `preference`, `set`, `toggle`, `onChange` or hook subscribe, never at import, so SSR and node imports stay safe. The steps:
  1. Precedence is: a valid saved choice (`localStorage['bit-color-mode']`), then the page root's `data-mode` if it's `light`, `dark` or `system`, then `system`.
  2. If there's a saved choice, it's written to the root's `data-mode`.
  3. If the root has no attribute, it gets `data-mode="system"`.
  4. A developer's fixed `light` or `dark` default is left alone.
- **`set(p)`:**
  - `light` and `dark` are saved to storage and written to the root.
  - `system` removes the saved choice and writes `system` to the root.
  - Unknown values, and calls without a window, are ignored, as `setColorMode` does today.
  - If storage fails (for example in private mode), that's tolerated as today: the choice lasts for that visit only.
- **OS listener:** a `matchMedia` change notifies listeners only while the preference is `system`. CSS already repaints on its own; the listener keeps `mode` and the hooks in sync.
- **No window (SSR, node):** `mode` returns `'light'` and `preference` returns `'system'`. Nothing throws.
- **Mutable state** lives inside the one instance, which stays the package's single documented exception. The existing comment moves onto the class.
- **Thin wrappers over `colorMode`, so nothing drifts:**
  - `useColorMode()` returns exactly `{ mode, setMode }`, as today. It uses `useSyncExternalStore` over `colorMode.onChange` and `colorMode.mode`, with `'light'` as the server snapshot. It may also return `preference`, which is additive.
  - `ModeToggle` is unchanged.
  - `resetColorModeStore()` (tests only) resets the instance.
  - `resolveColorMode()` stays exported internally only if tests use it; otherwise remove it.
- **`COLOR_MODE_SCRIPT` gets simpler.** It now applies only a valid saved choice, and sets `system` when the root has no attribute:
  `(function(){var d=document.documentElement,m=null;try{m=localStorage.getItem('bit-color-mode')}catch(e){}if(m==='light'||m==='dark'){d.dataset.mode=m}else if(!d.dataset.mode){d.dataset.mode='system'}})();`
  It stays exported, so existing users don't break, and what it does now is a superset of what the CSS handles.
- **New exports** in `packages/react/src/index.ts`: `colorMode`, `ColorModeService` (type and class), and the type `ColorModePreference`. Update `verify-dist` and the smoke consumer anywhere they pin the export list. The smoke consumer must call `colorMode.set('dark')` and check `document.documentElement.dataset.mode === 'dark'`.

## 3. Gallery

- **`apps/gallery/index.html`:** `<html lang="en" data-mode="system">`. The inline script becomes the readable optional snippet from §3.1, so the gallery uses what it teaches. The static `data-bit-version-picker` stays.
- **Getting started, step 4 "Light and dark":**
  - **Help text:** "Pick the default in your `index.html`, then switch it from anywhere with `colorMode`. Try the toggle."
  - **Live ModeToggle:** stays, at its own size (#15).
  - **CodeBlock "index.html":** `<html lang="en" data-mode="system">  <!-- or "light" / "dark" -->`
  - **CodeBlock "Any file":**
    ```ts
    import { colorMode } from '@bit-ds/react';

    colorMode.set('dark');   // switch and remember
    colorMode.toggle();      // light ⇄ dark
    colorMode.set('system'); // follow the visitor's OS again
    ```
  - **3.1 Disclosure, closed by default:** "Optional: use a saved choice before the page draws". Build it with bit components; if bit has no disclosure, use a `Button variant="ghost"` with `aria-expanded` that toggles the content. It holds one short paragraph and this snippet:
    ```html
    <script>
      // Use the visitor's saved choice (from the toggle) before your app loads.
      const saved = localStorage.getItem('bit-color-mode');
      if (saved) document.documentElement.dataset.mode = saved;
    </script>
    ```
    It also mentions that `COLOR_MODE_SCRIPT` is the same thing as a string, for frameworks that render `<head>` in React.
  - **Removed:** the `NO_FLASH_EXAMPLE` built from the minified string.
- **ModeToggle manifest** (`manifests/modeToggle.ts`): the usage note now points to `data-mode="system"` and `colorMode`, replacing "Inline COLOR_MODE_SCRIPT". Add a short "Switch from code" usage example with `colorMode`.
- **Tokens page** (`tokens/tokenValues.ts:26` comment): `data-mode` can now be `system`, so the live token readout must resolve against computed style, not the attribute. Verify this, and fix it if it reads the attribute.
- **e2e color-mode helpers** that set `localStorage` through `addInitScript` must keep working. A saved choice still wins.

## 4. Docs and release

- **`CHANGELOG.md`:** add `## 0.1.1 — <date>` with:
  - **Added:** `data-mode="system"` follows the visitor's OS in CSS alone.
  - **Added:** the `colorMode` service (`set`, `toggle`, `mode`, `preference`, `onChange`), usable from any file.
  - **Changed:** `COLOR_MODE_SCRIPT` now only applies a saved choice. Following the OS is handled by `data-mode="system"`.
- **`packages/react/package.json`:** version becomes `0.1.1`. The release gate test (`RELEASES[0].version === pkg.version`) enforces the CHANGELOG entry.
- **CONTRIBUTING, "When to release":** "While on 0.x: a breaking change is a **minor**; new features and fixes are a **patch**. From 1.0: patch = fix, minor = feature, major = breaking."
- **README:** the quick start's dark-mode line mentions `data-mode="system"` and `colorMode`.

## Gates

- **CI and coverage:** every `ci.yml` step passes locally. `pnpm test:coverage` keeps `@bit-ds/react` at **100%**.
- **Core:** the parity test between the system block and the dark block.
- **React unit tests:**
  - Startup precedence: a saved choice; attribute `light`, `dark` or `system`; no attribute.
  - `set` with `light`, `dark`, `system` and an unknown value.
  - `toggle`.
  - `onChange`, and unsubscribing.
  - An OS change while on `system`, and the same change ignored while on `light` or `dark`.
  - Storage throwing.
  - The hook and ModeToggle behave as before.
- **Node test:** importing the package and reading `colorMode.mode` and `.preference` without a window doesn't throw.
- **e2e:**
  - With `colorScheme: 'dark'` emulated and nothing saved, `#/tokens` shows dark tokens on first paint. Check `--bit-color-bg` before any interaction.
  - Clicking ModeToggle saves the choice, and it survives a reload.
  - Getting started step 4 shows the two code blocks, and the disclosure starts closed.
- **`pnpm smoke:full`**, with the smoke consumer using `colorMode`.
- **Release dry run:** green on the PR.

## Out of scope

- New themes.
- A `<ColorModeScript />` component (option C from the earlier board). It could follow later.
- Per-subtree services. A subtree can still use `data-mode` directly.
