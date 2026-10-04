# PR3c: Release, design

**Status:** approved in chat on 2026-10-04. The owner asked to build straight through with subagents and to stop before the publish.

**Ships as:** its own PR on `feat/pr3c-release`. This is the last PR before the first npm publish of `@bit-ds/react`.

**Scope sources:**
- the 2026-10-02 engineering review in `docs/superpowers/plans/2026-09-13-gallery.md`: amendment T11; D3, D4, D8 and D16; OV7 and OV8; E10, E11 and E12
- `docs/designs/gallery-dogfood.md` (the release section)
- `TODOS.md`
- research notes: `.superpowers/sdd/pr3c-prep/scope-research.md`

**Where the review and this spec disagree, this spec wins.** It records the later decisions.

## Goal

Merging this PR makes the repo ready to release. To publish, the owner pushes `v0.1.0` on `main` and approves one job. CI then:
1. publishes the exact tarball it smoke-tested,
2. checks that a stranger can install it from npm,
3. deploys the gallery to Pages.

`npm view @bit-ds/react version` then matches the `v0.1.0` badge on the gallery's Home page.

## Owner setup (verified 2026-10-04)

| Item | State |
|---|---|
| `NPM_TOKEN` secret in the `npm-publish` environment | set 2026-10-03 |
| `npm-publish` environment | branch policy (tags `v*`) plus a required reviewer |
| `github-pages` environment | branch policy (`main`, `v*`); the Pages source is GitHub Actions |
| Tag ruleset "release tags" (24400189) on `refs/tags/v*` | active |
| `@bit-ds/react` on npm | not published (404) |
| The `@bit-ds` org exists, and the token can publish to it | **owner to confirm**; this can't be checked without npm auth |

## Decisions

| # | Decision | Source |
|---|---|---|
| 1 | One workflow file, `release.yml`, with a `dry-run` job on PRs and `guard` → `publish` → `deploy` on a `v*` tag. No `release-dry-run.yml`, no `docs-deploy.yml`. | eng review D4, D16; this replaces T11's three files |
| 2 | No docs-only deploy. It stays a TODO. | eng review D3; `TODOS.md` |
| 3 | First version `0.1.0`. `@bit-ds/react` drops `"private": true`. `@bit-ds/core` stays private, because it is bundled in. | dogfood:103,107 |
| 4 | Publish the smoke-tested tarball: `npm publish <tgz> --provenance --access public`. | OV7 |
| 5 | The consumer smoke test runs in release.yml's `dry-run` job, not in ci.yml. ci.yml keeps today's `pnpm smoke` step, and the Vite and Chromium stage is skipped there (see §5). | OV8 |
| 6 | `snippets.mjs` is plain ESM, and the single source for the package name, install commands, style imports and `fullFile`. `install.ts` and `styleImports.ts` re-export from it. No TS runner. | E12, plus the ruling for open question 4 |
| 7 | `eslint.config.js` keeps its `storybook-static` ignore. It is harmless, and the file is guarded by the owner's config-protection hook. | ruling |
| 8 | The e2e (Playwright and axe) tests join CI as their own job. 3b deferred this here. | 3b spec |
| 9 | Node: CI uses Node 22. The publish job pins Node ≥ 22.14 and npm ≥ 11.5.1, which provenance and later trusted publishing need. | TODOS |

## 1. Remove Storybook

- Delete `apps/docs/` and the 8 stories: Alert, Badge, Button, Card, Spinner, Stack and Text under `packages/react/src/components/`, plus `packages/react/src/logo/BitLogo.stories.tsx`.
- `packages/react/package.json`: remove the `storybook` and `@storybook/react-vite` devDependencies.
- `packages/react/vitest.config.ts`: drop the stories coverage exclude.
- Root `package.json`: remove the `storybook` and `storybook:build` scripts.
- `.gitignore`: drop `storybook-static/`.
- `ci.yml`: the last step, `pnpm storybook:build`, becomes `pnpm --filter @bit-ds/gallery build`. The "No old npm scope" grep drops its `--exclude-dir=storybook-static`.
- `README.md` and `CONTRIBUTING.md`: remove the Storybook row and mentions. CONTRIBUTING:32 ("add themes to `apps/docs/.storybook/preview.ts`") changes to the gallery's `shell/themes.ts`.
- Specs: in `2026-09-06-bit-design-system-design.md` (lines about Storybook 9, §3.2, §4, §5.1, §7 and the Phase tables) and `2026-09-12-gallery-and-color-axis-addendum.md` (§C.2.4), add a one-line "Superseded (2026-10-04, PR3c): Storybook removed; the gallery is the docs site." next to each mention. Don't rewrite history.
- The lockfile is regenerated with `pnpm install`.
- **Check:** `git grep -i storybook` returns only the spec "Superseded" notes, CHANGELOG-style history in plans, and the `eslint.config.js` ignore.

## 2. Package metadata (`packages/react/package.json`)

- `"version": "0.1.0"`; remove `"private": true`.
- Add:
  - `"repository": { "type": "git", "url": "git+https://github.com/doosemavis/bit-design-system.git", "directory": "packages/react" }` (provenance needs it)
  - `"homepage": "https://doosemavis.github.io/bit-design-system/"`
  - `"bugs": { "url": "https://github.com/doosemavis/bit-design-system/issues" }`
  - `"license": "MIT"`, if it isn't already present (it must match `LICENSE`)
  - `"keywords"`: `react`, `design-system`, `components`, `css`, `retro`
  - `"publishConfig": { "access": "public", "provenance": true }`
- `files` stays `["dist"]`. npm adds README and LICENSE itself; the package README is a copy (see §4).
- `verify-dist.mjs` gains checks that:
  - `package.json` is not private
  - it has the repository URL above
  - `files` is `["dist"]`
  - `@bit-ds/core` is not in `dependencies`
- The gallery Home badge reads the version, so it now shows `v0.1.0`. Update any gallery test that pins `v0.0.0`.

## 3. `snippets.mjs`: one source for the install snippets

**`apps/gallery/src/content/snippets.mjs`** (plain ESM, no imports):
```js
export const PACKAGE_NAME = '@bit-ds/react';
export const PACKAGE_MANAGERS = ['pnpm', 'npm', 'yarn'];
export const INSTALL_COMMANDS = { pnpm: `pnpm add ${PACKAGE_NAME}`, npm: `npm install ${PACKAGE_NAME}`, yarn: `yarn add ${PACKAGE_NAME}` };
export const STYLE_IMPORTS = "import '@bit-ds/react/themes/power-up.css';\nimport '@bit-ds/react/styles.css';";
export const STYLE_COMMENT = '// once per app: skip if already in your entry file';
/** A pasteable file: style imports, the component import, and an Example component returning the element. */
export function fullFile({ importLine, element }) { /* same output as today's gallery fullFile */ }
```

- **`snippets.d.mts`** declares the types: the `PACKAGE_MANAGERS` tuple, a `Record` for `INSTALL_COMMANDS`, and the `fullFile` signature.
- **`install.ts`** keeps its browser helpers (storage, `isPackageManager`, the default). It re-exports `PACKAGE_NAME`, `PACKAGE_MANAGERS` and `INSTALL_COMMANDS` from `./snippets.mjs`, and its `PackageManager` type derives from them.
- **`styleImports.ts`** re-exports `STYLE_IMPORTS`.
- **`code/fullFile.ts`** keeps its `fullFile(jsx: string)` signature for gallery callers. It splits the string into an import line and an element, and calls `snippets.fullFile({ importLine, element })`. `STYLE_COMMENT` moves to `snippets.mjs`.
- **Tests:** the existing install, fullFile and InstallCommand tests stay green unchanged. A new `snippets.test.ts` pins every export, and checks that `PACKAGE_NAME` equals `packages/react/package.json`'s `name`.

## 4. README

- **Install:** keep the three commands and the theme-first imports. Delete the "Once published / Until then workspace-private" wording.
- **Live docs:** add "Live docs: https://doosemavis.github.io/bit-design-system/" near the top.
- **Utilities:** a new section documents `announce(message)`. It says something to screen readers through one shared, visually hidden live region. It is safe to call during server rendering, follows focus into an open modal dialog, and when calls overlap, the last message wins.
- **Scripts table:** drop the Storybook row and add `pnpm e2e`.
- **`apps/gallery/src/readme-sync.test.ts`:** README contains `STYLE_IMPORTS` verbatim and all three `INSTALL_COMMANDS` verbatim (E10).
- **Package README:** a `prepack` script in `packages/react` copies the root `README.md` and `LICENSE` into the package, so npm shows them. Both copies are gitignored. `verify-dist` or the smoke test checks that the tarball includes README.md.

## 5. Consumer smoke test (`scripts/smoke-consumer.mjs`)

Keep today's stages: pack once, npm install the tarball, ESM and CJS checks, CSS files, and the TypeScript check. Then:
- **`EXPECTED`** gains `announce`.
- **Install commands:** import `snippets.mjs`. Assert that each `INSTALL_COMMANDS` value ends with the package's real `name`.
- **New stage, a Vite app.** It runs only with `--vite` or when `SMOKE_VITE=1`, so release.yml runs it and ci.yml's `pnpm smoke` doesn't (OV8).
  1. In the consumer, install `vite`, `@vitejs/plugin-react`, `react` and `react-dom`.
  2. Write `index.html`.
  3. Write `main.jsx`: `STYLE_IMPORTS`, then a render of `App`.
  4. Write `App.jsx`: built from `fullFile({ importLine: "import { Button } from '@bit-ds/react';", element: '<Button>Save</Button>' })`, exporting `Example` as the app.
  5. Run `vite build`. Assert that the built CSS still contains the theme's Google Fonts `@import` at the top: it survives a Vite build, and `STYLE_IMPORTS` is the single source of order.
  6. `vite preview` on a free port, then Chromium through `playwright` (a root devDependency). Assert that the button has class `bit-button bit-primary` and computed `background-color: rgb(124, 58, 237)`. Close everything, even on failure.
- **Root scripts:**
  - `"smoke": "node scripts/smoke-consumer.mjs"` is unchanged.
  - Add `"smoke:full": "node scripts/smoke-consumer.mjs --vite"`.

## 6. `scripts/release-steps.mjs` (pure helpers, unit-tested)

```js
export function expectedTag(version) // → `v${version}`
export function checkTag({ tag, version }) // throws Error('tag v0.1.1 does not match package version 0.1.0')
export function shouldPublish({ publishedVersions, version }) // false when the version is already on npm
export async function retry(fn, { attempts = 6, delayMs = 10_000, sleep }) // calls fn until it resolves; after the last attempt, rethrows the last error with the attempt count
```

A thin CLI calls these: `node scripts/release-steps.mjs check-tag <tag>`, `should-publish`, and `verify-install <version>`. `verify-install` scaffolds a scratch dir, runs `npm install @bit-ds/react@<version>` and imports it, using `retry`.

Tests (`scripts/release-steps.test.mjs`, run with `node --test scripts/`):
- a tag/version mismatch throws
- a matching tag passes
- the version-exists case skips publishing
- `retry` succeeds on attempt 3
- `retry` exhausts after 6 attempts and throws with the count
- `sleep` is injected, so the tests don't wait

## 7. Workflows

### `ci.yml`

- Add `node --test scripts/`.
- Swap Storybook for the gallery build (§1).
- Add a second job, `e2e`, that runs after `ci`:
  1. install
  2. build
  3. cache `~/.cache/ms-playwright` keyed on the Playwright version
  4. `pnpm --filter @bit-ds/gallery exec playwright install --with-deps chromium`
  5. `pnpm e2e`
  6. upload `playwright-report` on failure

### `release.yml`

- **Triggers:** `pull_request` (job `dry-run`) and `push: tags: ['v*']` (jobs `guard`, `publish`, `deploy`). Top-level permissions are `contents: read`, and jobs raise them.
- **`dry-run`:**
  1. install
  2. build
  3. `pnpm --filter @bit-ds/react pack --pack-destination ./out`
  4. `npm publish ./out/*.tgz --dry-run --access public`
  5. `pnpm smoke:full`, with Chromium installed and cached
  6. gallery build
- **`guard`:**
  1. Checkout with `fetch-depth: 0`.
  2. `node scripts/release-steps.mjs check-tag "$GITHUB_REF_NAME"`.
  3. Assert that the tag commit is on `main`: `git merge-base --is-ancestor "$GITHUB_SHA" origin/main`.
- **`publish`** (`needs: guard`, `environment: npm-publish`, permissions `contents: read` and `id-token: write`):
  1. setup-node 22, with registry-url `https://registry.npmjs.org`
  2. `npm i -g npm@^11.5.1`
  3. install, build, pack
  4. `smoke:full` on that tarball
  5. `should-publish`
  6. if true, `npm publish ./out/*.tgz --provenance --access public`, with `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}`
  7. always, `verify-install` with the version
- **`deploy`** (`needs: publish`, `environment: github-pages`, permissions `pages: write` and `id-token: write`):
  1. install, build
  2. `pnpm gallery:build`
  3. `actions/configure-pages`, `actions/upload-pages-artifact` with path `apps/gallery/dist`, then `actions/deploy-pages`
- **Recovery** (also documented in CONTRIBUTING): if publish succeeds but verify or deploy fails, re-run the failed jobs. Publishing is skipped because the version exists, then the check and the deploy run. Never re-tag.
- **Pin actions to major tags:** `actions/checkout@v4`, `pnpm/action-setup@v4`, `actions/setup-node@v4`, `actions/cache@v4`, `actions/upload-artifact@v4`, `actions/configure-pages@v5`, `actions/upload-pages-artifact@v3` and `actions/deploy-pages@v4`. Use the same pnpm setup as ci.yml.
- **Validation:**
  - If `actionlint` is available, run it on both workflows.
  - Otherwise, a test parses both YAML files with `yaml`, a root devDependency if it isn't already present. It asserts the job names, `needs`, environments and permissions above, so a typo fails locally.

## 8. Docs and follow-ups

- **CONTRIBUTING:** add a "Releasing" section:
  1. Bump the version in `packages/react/package.json` in a PR.
  2. Merge it.
  3. Tag `vX.Y.Z` on `main` and push.
  4. Approve the `npm-publish` job.

  Include the recovery steps from §7.
- **TODOS.md:** add the 3b follow-ups:
  - light islands inside dark mode keep the dark hover underline
  - forced colours: a transparent border fallback for Code in a Table
  - axe on toggled and open control states
  - offset tokens for the outline shadows
  - verify-dist's hard-coded token count could derive from source

  Keep the trusted-publishing TODO.
- **Stale docs:** `docs/designs/gallery-dogfood.md` lines that still specify `docs-deploy` or three workflow files get a "Superseded (2026-10-04)" note pointing at this spec.

## Gates

- Every `ci.yml` step passes locally, in order: install, scope grep, build plus verify, typecheck, lint, core tests, react coverage at 100%, gallery tests, `node --test scripts/`, `pnpm smoke`, gallery build.
- `pnpm e2e` passes: 52/52 with zero axe violations.
- `pnpm smoke:full` passes locally: the Vite build and Chromium check.
- `npm publish --dry-run` on the packed tarball passes, and the tarball listing contains only `dist/`, `package.json`, `README.md` and `LICENSE`.
- The CI and release `dry-run` checks are green on the PR.

## Out of scope

- The publish itself. It is an owner action: push the `v0.1.0` tag, then approve the job.
- Trusted publishing (a TODO after 0.1.0).
- Changesets or automated version bumps.
- A docs-only deploy.
