# Contributing to bit

Every change follows the same shape: write the failing test, make it pass, add the gallery page, commit with `<type>: <description>`.

## Add a component

1. `packages/core/src/components/<name>.css`: styles that read only semantic `--bit-*` tokens (never `--bit-palette-*`) and the private `--_bit-color-*` / `--_bit-size-*` variables. Add `@import "./components/<name>.css";` to `packages/core/src/index.css` (the system test fails if you forget).
2. `packages/react/src/components/<Name>/<Name>.test.tsx`: copy `Button.test.tsx`, keep the same checks (root class, decorators, className last, ref, a11y).
3. `packages/react/src/components/<Name>/<Name>.tsx`: `forwardRef`, a `const` per supported axis at the top, `toClasses('<kebab-name>', axes, className)`, spread `...rest` on the root.
4. A gallery page: `apps/gallery/src/manifests/<name>.ts`, listed in `MANIFESTS` in `apps/gallery/src/manifests/index.ts`. Add the component (and any parts a manifest's `children` names) to `COMPONENTS` in `registry.ts`. Every manifest needs a `docs` block: `badges`, at least one `usage.do` and one `usage.dont`, a `props` row for every control with `className: 'bit-{color}'` (or `'bit-{variant}'`, `'bit-{size}'`) on each axis prop, and at least one `a11y` line. The contract test in `manifests.test.ts` checks each row's default and values against its control. Set `interactive: true` when the component's markup needs React to work (ModeToggle, CodeBlock); its page then offers React code only. To give it a large Home tile, add its slug to `HEADLINERS` in `apps/gallery/src/pages/home/ComponentTiles.tsx`; for a compact tile's icon, add it to `GLYPHS` there.
5. Export from `packages/react/src/index.ts` and add the name to the list in `index.test.tsx`, to `EXPECTED` in `packages/react/scripts/verify-dist.mjs`, and to `EXPECTED` in `scripts/smoke-consumer.mjs`.

A guide page under Foundations (Typography, Spacing) is a route in `apps/gallery/src/router.tsx`, an entry in `NAV` in `apps/gallery/src/shell/Sidebar.tsx`, and a row in `PAGE_ROUTES` in `apps/gallery/src/test/smokeRoutes.ts`, which the light and dark route smokes share. Build it only from bit components; anything the gallery alone needs goes in `gallery.css` and reads only `--bit-*` tokens.

The class-contract test checks that `<Name>` renders `bit-<kebab-name>`, and `<Parent><Part>` renders `bit-<parent>__<part>`.

## Add a value to an axis on one component

Add it to that component's `const` (for example `variants`) and add a `.bit-<component>.bit-<value> { }` rule in its CSS file. That is the whole change.

## Add a color to the whole system

1. Four tokens in every theme: `--bit-color-<color>`, `-contrast`, `-hover`, `-soft`.
2. One rule in `packages/core/src/system/colors.css`.
3. Add the word to `COLORS` in `packages/core/src/tokens.ts`.
4. Add its dark `-soft` value to each theme's `[data-mode="dark"]` block and to `MODE_TOKENS` in `tokens.ts`.

The contrast test verifies the new color's text is readable on its fill.

## Add a theme

Copy `packages/core/src/themes/power-up.css` to `<theme>.css`, change the tier-1 palette and any tier-2 values, keep every token name. A theme also needs a `[data-mode="dark"]` rule that declares exactly the tokens in `MODE_TOKENS` (`packages/core/src/tokens.ts`). Add it to `THEMES` in `apps/gallery/src/shell/themes.ts`, after adding its CSS import in `apps/gallery/src/main.tsx`. Run `pnpm --filter @bit-ds/core test`.

## Testing

### End-to-end and accessibility

```bash
pnpm --filter @bit-ds/gallery exec playwright install chromium   # once
pnpm e2e
```

`pnpm e2e` builds the library and the gallery, serves the build with `vite preview` at `/bit-design-system/`, and runs axe (WCAG 2.2 AA, contrast included) on every page in light and dark, plus a forced-colours check.

## Releasing

Releases are cut from a tag. Only admins can push `v*` tags.

1. Bump `version` in `packages/react/package.json` in a PR.
2. Merge the PR to `main`.
3. Tag the merge commit and push the tag: `git tag vX.Y.Z && git push origin vX.Y.Z`.
4. In GitHub Actions, approve the `publish` job. It uses the `npm-publish` environment, which needs a reviewer.

The `release.yml` workflow then runs three jobs:

- `guard` checks that the tag equals `v` plus the package version, and that the commit is on `main`.
- `publish` smoke-tests the packed tarball, then runs `npm publish` with provenance on that same file. It skips the publish when that version already exists. Then it waits for npm to show the new version, and installs it to check it.
- `deploy` publishes the gallery to https://doosemavis.github.io/bit-design-system/.

The check first polls `npm view @bit-ds/react@<version> version` until npm prints the version. It tries up to 40 times, 15 seconds apart (about 10 minutes), because npm's CDN can serve a cached 404 for a few minutes after a publish. An E404 means "not yet"; any other npm error fails at once. Then it installs the version and imports it, retrying up to 10 times, 15 seconds apart.

If the publish worked but the check or the deploy failed, re-run the failed jobs. The publish is skipped because the version exists. Never re-tag.

Before tagging, you can run `pnpm smoke:full` and `pnpm e2e` locally. Both need Chromium installed once. `smoke:full` uses the root `playwright` package, so install it from the repo root:

```bash
pnpm exec playwright install chromium
```

Keep the root `playwright` and the gallery's `@playwright/test` on the same version, so both use the same Chromium.

## Conventions

- Classes: `bit-block`, `bit-block__element`, `bit-value`. No `--modifier` classes, no camelCase.
- Booleans are attributes, never classes. So are layout values that aren't design axes: Stack's `gap`, Text's `size`, Heading's `data-level`, Box's `data-p` and friends. bit has no utility classes.
- Components never import CSS; the app does, once.
- Component CSS never sets `outline` or its longhands; `system/reset.css` draws the one focus ring. A visually hidden native input (Switch, SegmentedControl) gets its ring from a `reset.css` rule on the part drawn beside it.
- Lines read `--bit-color-line`, never `--bit-color-ink`. The exceptions are listed, by selector, in `INK_EXCEPTIONS` in `packages/core/src/__tests__/system.test.ts`.
- Theme names describe a look, not a trademark.
- `@bit-ds/core` is a devDependency of `@bit-ds/react` because tsup inlines it; `pnpm smoke` proves the packed tarball installs with npm into a fresh project. Consumers can use any package manager.
