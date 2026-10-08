# Contributing to bit

This repo is a pnpm workspace. Install its dependencies with `pnpm install` (run `corepack enable` once if you don't have pnpm). After that you can run any script with `npm run <name>` or `pnpm <name>`. `npm install` doesn't work inside this repo. People using the published package can install it with npm, pnpm or yarn.

## Working on bit

Clone the repo, run `pnpm install`, then `npm run dev` to start the gallery at http://localhost:5173.

### Scripts

Run each one as `npm run <name>` or `pnpm <name>`.

| Command | What it does |
| --- | --- |
| `npm run dev` | build `@bit-ds/react`, then start the gallery at http://localhost:5173 |
| `npm run preview` | build the library and the gallery, then serve the production build at http://localhost:4173/bit-design-system/, the same way Pages does |
| `npm test` | all unit, a11y, and system tests |
| `npm run test:coverage` | react tests with the coverage gate (80%) |
| `npm run build && npm run verify` | build `@bit-ds/react` and prove the dist is consumable |
| `npm run e2e` | build the library and gallery, then run Playwright with axe on every page (needs Chromium once) |
| `npm run smoke` | packs `@bit-ds/react` and installs it with npm into a throwaway project to prove the tarball works |
| `npm run smoke:full` | `npm run smoke`, then builds a Vite app from the tarball and checks the Button renders in Chromium (needs Chromium once; `SMOKE_TARBALL=<path>` tests a given tarball instead of packing) |
| `npm run logo:svg` | regenerate `assets/bit-logo.svg` |

## Making a change

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

Copy `packages/core/src/themes/power-up.css` to `<theme>.css`, change the tier-1 palette and any tier-2 values, keep every token name. A theme also needs a `[data-mode="dark"]` rule that declares exactly the tokens in `MODE_TOKENS` (`packages/core/src/tokens.ts`). Add it to `THEMES` in `apps/gallery/src/shell/themes.ts`, after adding its CSS import in `apps/gallery/src/main.tsx`. Run `pnpm --filter @bit-ds/core test`. The test fails if any token is missing or any color fails WCAG AA contrast.

Fonts are self-hosted, never loaded from a font service. A theme's `@font-face` rules point at `./fonts/<id>-<subset>-<weight>-normal.woff2`, one rule per weight and subset with that subset's `unicode-range`. Ship every subset the family's `@fontsource` package has (its `unicode.json`), in that file's order (latin last, so it wins the code points subsets share), so text in any script Google Fonts served keeps the face. Those paths resolve only in the build: `packages/react/scripts/build-css.mjs` copies each file a theme names from an `@fontsource/<id>` devDependency of `@bit-ds/react` (exact version) into `dist/themes/fonts/`, checks the `unicode-range` against the package's, and adds the family's license as `OFL-<id>.txt`. A new family needs its `@fontsource` package and an entry in `packages/react/scripts/expected-fonts.mjs`. `fonts.test.ts`, `pnpm verify` and `pnpm smoke` fail on any remote `@import` or `url()`.

### Icons

Icons come from `@material-symbols/svg-700` (an exact-version devDependency of `@bit-ds/react`, Sharp style) and the curated list in `packages/core/src/icons/icons.json`. To add one, add its Material name to a group there, run `npm run icons`, and commit `icons.json` with the two generated files (`packages/react/src/icons/icons.generated.ts`, `packages/core/src/icons/icons.generated.css`). `scripts/build-icons.test.mjs` fails when they drift. Adding an icon changes the package, so it ships in a release.

## Testing

### End-to-end and accessibility

```bash
pnpm --filter @bit-ds/gallery exec playwright install chromium   # once
npm run e2e
```

`npm run e2e` builds the library and the gallery, serves the build with `vite preview` at `/bit-design-system/`, and runs axe (WCAG 2.2 AA, contrast included) on every page in light and dark, plus a forced-colours check.

## Releasing

Releases are cut from a tag. Only admins can push `v*` tags.

1. Add a CHANGELOG entry: one bullet per line, in the sections Breaking, Added, Changed, Fixed and Removed.
2. Bump `version` in `packages/react/package.json` in a PR.
3. Merge the PR to `main`.
4. Tag the merge commit and push the tag: `git tag vX.Y.Z && git push origin vX.Y.Z`.
5. In GitHub Actions, approve the `publish` job. It uses the `npm-publish` environment, which needs a reviewer.

### When to release

A version describes the npm package. Anything that changes what people install gets a version:

- component behaviour, props and styles
- `@bit-ds/core` tokens and CSS
- types
- peer ranges
- package contents

While on 0.x: a breaking change is a **minor**; new features and fixes are a **patch**. From 1.0: patch = fix, minor = feature, major = breaking.

The docs site, CI, scripts and tests never get a version. They deploy through the `main` docs job (see "Docs site" below).

A change to the README alone waits for the next release, because npm shows the README only from a published version.

Pushing the tag starts the `release.yml` workflow. On a tag it runs:

1. `guard` checks that the tag equals `v` plus the package version, and that the commit is on `main`.
2. `build` installs, builds, verifies and packs the package, and smoke-tests that tarball in a fresh project and in Chromium. It records the tarball's sha256 and npm integrity right after packing, checks the sha256 again after the smoke test, then uploads the tarball.
3. `publish` waits for your approval in GitHub Actions. It downloads the tarball, stops if its sha256 differs from the one `build` recorded, and runs `npm publish` with provenance on that file. It skips the publish when that version already exists.
4. `verify-install` waits for npm to show the new version, checks that npm's integrity for it matches the tarball `build` packed, then installs it (with no install scripts) to check it.
5. `deploy` puts the site on https://doosemavis.github.io/bit-design-system/, once `verify-install` passes. `site-build` builds that site alongside the other jobs.

The split is a security boundary. Only `publish` sees the npm token and can mint an OIDC token, and it installs nothing and runs no third-party code: no `pnpm install`, no smoke test, no Playwright. Everything that installs packages or runs their scripts happens in `build`, which holds no credential. The same goes for the site: `site-build` builds it with no Pages permission, and `deploy` only runs `actions/deploy-pages`. `scripts/workflows.test.mjs` fails if a change breaks these rules.

No dependency runs an install script: `pnpm.onlyBuiltDependencies` in the root `package.json` is empty, so pnpm skips them all. A dependency that truly needs its install script must be added to that list on purpose, in a PR that says why.

The release pins its tools to exact versions. `NPM_VERSION` in `release.yml` is the npm that builds and publishes, and `SMOKE_PINS` in `scripts/smoke-pins.mjs` holds the versions the smoke test installs. Dependabot doesn't see either, so bump them by hand; the pull request's `dry-run` rehearses the new versions.

The check first polls `npm view @bit-ds/react@<version> version` until npm prints the version. It tries up to 40 times, 15 seconds apart (about 10 minutes), because npm's CDN can serve a cached 404 for a few minutes after a publish. An E404 means "not yet"; any other npm error fails at once. Then it compares npm's `dist.integrity` with the integrity `build` computed; a mismatch fails at once, because npm is serving different bytes from the ones that were built and tested. Then it installs the version and imports it, retrying up to 10 times, 15 seconds apart.

If the publish worked but the check or the deploy failed, re-run the failed jobs. The publish is skipped because the version exists, and the re-run reuses the tarball `build` uploaded. Never re-tag.

### Docs site

The site is versioned. `node scripts/build-versioned-site.mjs` puts the current gallery at the root. It builds each older release line (`0.1`, `0.2`, then `1`, `2` from 1.0) from that line's newest tag, in a git worktree, and serves it at `/bit-design-system/v<line>/`. It also writes `versions.json` and injects `version-banner.js` into those frozen copies. The banner warns that the copy is old and lets readers switch versions. `versions.json` carries each line's breaking changes from the current CHANGELOG, so an old copy's Versions page can warn about newer lines. Copies are cached by tag, so each line is built once.

The docs deploy needs no version. A push to `main` runs three more jobs in the same workflow: `docs-check`, then `docs-build`, which builds the site, then `docs`, which only deploys it. A manual "Run workflow" of Release on `main` does the same. They deploy the same site without a release, but only when `packages/` is unchanged since the latest `v*` tag, not counting test-only files (`*.test.*`, `__tests__/`, `src/test/`, `vitest.*` and the two export-check scripts, `verify-dist.mjs` and `expected-exports.mjs`). Otherwise they skip with a notice, and the next tag deploys. The main docs deploy doesn't wait for CI. It relies on CI having passed on the pull request, because `main` only changes through pull requests.

Pull requests rehearse this with `--as-older v0.1.0`. To see it locally, run `npm run gallery:build && node scripts/build-versioned-site.mjs --out /tmp/bit-site/bit-design-system --as-older v0.1.0`, then `python3 -m http.server 4180 -d /tmp/bit-site`, and open http://localhost:4180/bit-design-system/.

### Switch to trusted publishing (do before January 2027)

npm will stop letting 2FA-bypass tokens publish in January 2027. The release workflow uses one today (the `NPM_TOKEN` secret), so switch before then. Trusted publishing replaces the token with short-lived credentials minted for each run.

1. On npmjs.com, open `@bit-ds/react`, then Settings, then Trusted Publisher, then GitHub Actions.
2. Fill in owner `doosemavis`, repo `bit-design-system`, workflow `release.yml`, environment `npm-publish`.
3. Then delete the `NPM_TOKEN` secret from the `npm-publish` environment and revoke the token on npm.

`release.yml` is already ready for it. The `publish` job has `id-token: write`, and it installs npm `NPM_VERSION` (11.5.1 or later), which trusted publishing needs.

The switch is now safe. With trusted publishing, any code that runs in the `publish` job can mint a publish credential. Since the job split, `publish` runs no install and no third-party code, so nothing but the reviewed workflow and `scripts/release-steps.mjs` can reach that credential. Keep it that way: never add an install, `npx`, a cache or a third-party action to `publish`.

Do the npm steps first. Don't remove the token from the workflow before npm trusts it, or the next publish will fail. Once npm trusts the workflow, a later PR can drop `NODE_AUTH_TOKEN` from the publish step.

Before tagging, you can run `npm run smoke:full` and `npm run e2e` locally. Both need Chromium installed once. `smoke:full` uses the root `playwright` package, so install it from the repo root:

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
- `@bit-ds/core` is a devDependency of `@bit-ds/react` because tsup inlines it; `npm run smoke` proves the packed tarball installs with npm into a fresh project. Consumers can use any package manager.
