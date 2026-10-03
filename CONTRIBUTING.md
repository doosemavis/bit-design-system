# Contributing to bit

Every change follows the same shape: write the failing test, make it pass, add the gallery page, commit with `<type>: <description>`.

## Add a component

1. `packages/core/src/components/<name>.css`: styles that read only semantic `--bit-*` tokens (never `--bit-palette-*`) and the private `--_bit-color-*` / `--_bit-size-*` variables. Add `@import "./components/<name>.css";` to `packages/core/src/index.css` (the system test fails if you forget).
2. `packages/react/src/components/<Name>/<Name>.test.tsx`: copy `Button.test.tsx`, keep the same checks (root class, decorators, className last, ref, a11y).
3. `packages/react/src/components/<Name>/<Name>.tsx`: `forwardRef`, a `const` per supported axis at the top, `toClasses('<kebab-name>', axes, className)`, spread `...rest` on the root.
4. A gallery page: `apps/gallery/src/manifests/<name>.ts`, listed in `MANIFESTS` in `apps/gallery/src/manifests/index.ts`. Add the component (and any parts a manifest's `children` names) to `COMPONENTS` in `registry.ts`. New components get no Storybook story: PR3 removes Storybook.
5. Export from `packages/react/src/index.ts` and add the name to the list in `index.test.tsx`, to `EXPECTED` in `packages/react/scripts/verify-dist.mjs`, and to `EXPECTED` in `scripts/smoke-consumer.mjs`.

A guide page under Foundations (Typography, Spacing) is a route in `apps/gallery/src/router.tsx`, an entry in `NAV` in `apps/gallery/src/shell/Sidebar.tsx`, and a row in `FOUNDATION_PAGES` in `routes.test.tsx` and `routes.dark.test.tsx`. Build it only from bit components; anything the gallery alone needs goes in `gallery.css` and reads only `--bit-*` tokens.

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

Copy `packages/core/src/themes/power-up.css` to `<theme>.css`, change the tier-1 palette and any tier-2 values, keep every token name. A theme also needs a `[data-mode="dark"]` rule that declares exactly the tokens in `MODE_TOKENS` (`packages/core/src/tokens.ts`). Add it to `THEMES` in `apps/docs/.storybook/preview.ts` with a CSS import. Run `pnpm --filter @bit-ds/core test`.

## Conventions

- Classes: `bit-block`, `bit-block__element`, `bit-value`. No `--modifier` classes, no camelCase.
- Booleans are attributes, never classes. So are layout values that aren't design axes: Stack's `gap`, Text's `size`, Heading's `data-level`, Box's `data-p` and friends. bit has no utility classes.
- Components never import CSS; the app does, once.
- Component CSS never sets `outline` or its longhands; `system/reset.css` draws the one focus ring. A visually hidden native input (Switch, SegmentedControl) gets its ring from a `reset.css` rule on the part drawn beside it.
- Lines read `--bit-color-line`, never `--bit-color-ink`. The exceptions are listed, by selector, in `INK_EXCEPTIONS` in `packages/core/src/__tests__/system.test.ts`.
- Theme names describe a look, not a trademark.
- `@bit-ds/core` is a devDependency of `@bit-ds/react` because tsup inlines it; `pnpm smoke` proves the packed tarball installs with npm into a fresh project. Consumers can use any package manager.
