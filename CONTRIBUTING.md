# Contributing to bit

Every change follows the same shape: write the failing test, make it pass, add the story, commit with `<type>: <description>`.

## Add a component

1. `packages/core/src/components/<name>.css`: styles that read only semantic `--bit-*` tokens (never `--bit-palette-*`) and the private `--_bit-tone-*` / `--_bit-size-*` variables. Add `@import "./components/<name>.css";` to `packages/core/src/index.css` (the system test fails if you forget).
2. `packages/react/src/components/<Name>/<Name>.test.tsx`: copy `Button.test.tsx`, keep the same checks (root class, decorators, className last, ref, a11y).
3. `packages/react/src/components/<Name>/<Name>.tsx`: `forwardRef`, a `const` per supported axis at the top, `toClasses('<kebab-name>', axes, className)`, spread `...rest` on the root.
4. `packages/react/src/components/<Name>/<Name>.stories.tsx`: `Playground` plus one story per axis.
5. Export from `packages/react/src/index.ts` and add the name to the list in `index.test.tsx` and to `EXPECTED` in `packages/react/scripts/verify-dist.mjs`.

The class-contract test checks that `<Name>` renders `bit-<kebab-name>`, and `<Parent><Part>` renders `bit-<parent>__<part>`.

## Add a value to an axis on one component

Add it to that component's `const` (for example `variants`) and add a `.bit-<component>.bit-<value> { }` rule in its CSS file. That is the whole change.

## Add a tone to the whole system

1. Four tokens in every theme: `--bit-color-<tone>`, `-contrast`, `-hover`, `-soft`.
2. One rule in `packages/core/src/system/tones.css`.
3. Add the word to `TONES` in `packages/core/src/tokens.ts`.

The contrast test verifies the new tone's text is readable on its fill.

## Add a theme

Copy `packages/core/src/themes/power-up.css` to `<theme>.css`, change the tier-1 palette and any tier-2 values, keep every token name. Add it to `THEMES` in `apps/docs/.storybook/preview.ts` with a CSS import. Run `pnpm --filter @bit/core test`.

## Conventions

- Classes: `bit-block`, `bit-block__element`, `bit-value`. No `--modifier` classes, no camelCase.
- Booleans are attributes, never classes.
- Components never import CSS; the app does, once.
- Theme names describe a look, not a trademark.
