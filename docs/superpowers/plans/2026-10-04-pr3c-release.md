# PR3c: Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the repo releasable. A `v0.1.0` tag on `main`, approved by the owner, publishes the smoke-tested tarball of `@bit-ds/react`, verifies the install from npm, and deploys the gallery to Pages.

**Architecture:**
- Storybook goes, and the gallery is the only docs site.
- One plain-ESM `snippets.mjs` is the source for every install and import snippet. The gallery, the README test and the consumer smoke test all read it.
- A pure, unit-tested `scripts/release-steps.mjs` holds the release logic.
- One `release.yml` (PR dry-run; tag → guard → publish → deploy) calls those helpers.
- `ci.yml` gains the e2e job.

**Tech Stack:**
- pnpm 9, Node 22, TypeScript 5.9
- Vite 7, Vitest, Playwright
- GitHub Actions, npm provenance

**Spec:** `docs/superpowers/specs/2026-10-04-pr3c-release-design.md`. It is binding. **Every task below names the spec section that holds its exact values. Read that section first, and use its values verbatim.**

## Global Constraints

- Branch: `feat/pr3c-release`. Commit messages are `<type>(<scope>): <description>`, ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Do not push; the controller pushes.
- The package version is `0.1.0`. The package name is `@bit-ds/react`. The repo is `https://github.com/doosemavis/bit-design-system`. Pages is at `https://doosemavis.github.io/bit-design-system/`.
- `@bit-ds/core` stays private and is never a runtime dependency of `@bit-ds/react`.
- React keeps 100% coverage. Test counts only go up, apart from deliberate removals, which must be named in the report. The current counts are core 489, react 437 and gallery 542, with e2e 52/52.
- Do not edit `eslint.config.js`. The owner's config-protection hook guards it.
- Never run `npm publish` without `--dry-run`. Never push tags. Never touch GitHub settings or secrets.
- Comments and docs are in plain English, in short sentences.
- Every `ci.yml` step must pass locally before a task is DONE, in this order:
  1. `pnpm install --frozen-lockfile`
  2. the scope grep
  3. `pnpm build && pnpm verify`
  4. `pnpm typecheck`
  5. `pnpm lint`
  6. core tests
  7. `pnpm test:coverage`
  8. gallery tests
  9. `pnpm smoke`
  10. the final build step that ci.yml has at that point
- A `vite preview` on port 4173 may belong to the owner. Stop it with `lsof -ti tcp:4173 | xargs kill` before running e2e.

## Review Focus

1. **A tag that doesn't match the package version, or a tag commit that isn't on `main`.** `guard` must fail before `publish` runs. Covered by Task 5's tests and Task 6's structure test.
2. **A re-run after a partial failure.** When the version already exists on npm, `publish` must skip `npm publish` and still run `verify-install`, and `deploy` must run. Covered by Task 5 (`shouldPublish`) and Task 6 (step conditions).
3. **Registry lag right after publishing.** `verify-install` must retry 6 times, 10 s apart, and then fail with the attempt count. Covered by Task 5's tests.
4. **A tarball that ships junk or misses files.** Only `dist/`, `package.json`, `README.md` and `LICENSE` may ship, and `@bit-ds/core` must not be a dependency. Covered by Task 3 (verify-dist) and Task 4 (smoke).
5. **The style import order breaking in a real bundler,** so the fonts `@import` doesn't stay first. Covered by Task 4's Vite stage.

---

### Task 1: Remove Storybook

**Spec:** §1. **Files:**
- Delete: `apps/docs/` and the 8 `*.stories.tsx` files
- Modify:
  - `packages/react/package.json`, root `package.json`
  - `packages/react/vitest.config.ts`
  - `.gitignore`, `.github/workflows/ci.yml`
  - `README.md`, `CONTRIBUTING.md`
  - the two specs named in §1
  - `pnpm-lock.yaml` (regenerated)

- [ ] **Step 1: Prove what's there.** Run `git grep -il storybook` and save the list in the report.
- [ ] **Step 2: Delete.**
  ```bash
  git rm -r apps/docs
  git rm packages/react/src/components/*/*.stories.tsx packages/react/src/logo/BitLogo.stories.tsx
  ```
- [ ] **Step 3: Edit the config files.**
  - Remove `storybook` and `@storybook/react-vite` from `packages/react/package.json` devDependencies.
  - Remove the root `storybook` and `storybook:build` scripts.
  - Remove the stories exclude in `packages/react/vitest.config.ts`.
  - Remove `storybook-static/` in `.gitignore`.
  - In `ci.yml`, replace `- run: pnpm storybook:build` with `- run: pnpm --filter @bit-ds/gallery build`, and remove `--exclude-dir=storybook-static` from the scope grep.
- [ ] **Step 4: Update the docs.**
  - README: drop the Storybook row in the scripts table.
  - CONTRIBUTING:10: drop "PR3 removes Storybook".
  - CONTRIBUTING:32: point theme registration at `apps/gallery/src/shell/themes.ts`. Read that file to confirm it's the theme list.
  - Specs: add the one-line "Superseded (2026-10-04, PR3c): Storybook removed; the gallery is the docs site." note beside each Storybook mention named in §1. Don't delete the historical text.
- [ ] **Step 5: Regenerate the lockfile.** Run `pnpm install`, which must succeed. Run `git grep -il storybook` again. Expected: only the specs, which carry their "Superseded" notes, the history in `docs/superpowers/plans/*`, and `eslint.config.js`. List the result in the report.
- [ ] **Step 6: Gate.** Run every ci.yml step (Global Constraints). Expected green. React coverage stays at 100% after the exclude is removed, because stories no longer exist.
- [ ] **Step 7: Commit.** `chore: remove Storybook; the gallery is the docs site`

---

### Task 2: `snippets.mjs`, one source for install and import snippets

**Spec:** §3. **Files:**
- Create:
  - `apps/gallery/src/content/snippets.mjs`
  - `apps/gallery/src/content/snippets.d.mts`
  - `apps/gallery/src/content/snippets.test.ts`
- Modify:
  - `apps/gallery/src/content/install.ts`
  - `apps/gallery/src/content/styleImports.ts`
  - `apps/gallery/src/code/fullFile.ts`

**Interfaces (produced):**
```ts
// snippets.d.mts
export declare const PACKAGE_NAME: '@bit-ds/react';
export declare const PACKAGE_MANAGERS: readonly ['pnpm', 'npm', 'yarn'];
export declare const INSTALL_COMMANDS: Readonly<Record<'pnpm' | 'npm' | 'yarn', string>>;
export declare const STYLE_IMPORTS: string;
export declare const STYLE_COMMENT: string;
export declare function fullFile(parts: { importLine: string; element: string }): string;
```

- [ ] **Step 1: Write the failing test** in `snippets.test.ts`:
  ```ts
  import { readFileSync } from 'node:fs';
  import { describe, expect, it } from 'vitest';
  import { INSTALL_COMMANDS, PACKAGE_MANAGERS, PACKAGE_NAME, STYLE_COMMENT, STYLE_IMPORTS, fullFile } from './snippets.mjs';

  const pkg = JSON.parse(readFileSync(new URL('../../../../packages/react/package.json', import.meta.url), 'utf8')) as { name: string };

  describe('snippets.mjs', () => {
    it('names the real package', () => expect(PACKAGE_NAME).toBe(pkg.name));
    it('has one install command per package manager, each ending in the package name', () => {
      expect([...PACKAGE_MANAGERS]).toEqual(['pnpm', 'npm', 'yarn']);
      expect(INSTALL_COMMANDS).toEqual({ pnpm: 'pnpm add @bit-ds/react', npm: 'npm install @bit-ds/react', yarn: 'yarn add @bit-ds/react' });
    });
    it('imports the theme first, then the styles', () => {
      expect(STYLE_IMPORTS).toBe("import '@bit-ds/react/themes/power-up.css';\nimport '@bit-ds/react/styles.css';");
    });
    it('fullFile wraps an element in a pasteable Example component', () => {
      expect(fullFile({ importLine: "import { Button } from '@bit-ds/react';", element: '<Button>Save</Button>' })).toBe(
        `${STYLE_COMMENT}\n${STYLE_IMPORTS}\nimport { Button } from '@bit-ds/react';\n\nexport function Example() {\n  return (\n    <Button>Save</Button>\n  );\n}\n`,
      );
    });
  });
  ```
  Check the `new URL(...)` depth against the real path from `apps/gallery/src/content/`. If this file runs under jsdom and `new URL` breaks `readFileSync`, add `// @vitest-environment node`, as `gallery-css.test.ts` does.
- [ ] **Step 2: Run it and check it fails.** Run `pnpm --filter @bit-ds/gallery test -- snippets`. Expected: it fails because the module is not found.
- [ ] **Step 3: Implement `snippets.mjs`.** Use the spec §3 constants verbatim. `fullFile({ importLine, element })` must give byte-for-byte the output of today's `code/fullFile.ts` for the same input: indent every element line by 4 spaces. Write `snippets.d.mts` with the interface above.
- [ ] **Step 4: Re-export from the existing modules.**
  - `install.ts`: `export { PACKAGE_NAME, PACKAGE_MANAGERS, INSTALL_COMMANDS } from './snippets.mjs';`. Keep `PackageManager` as `(typeof PACKAGE_MANAGERS)[number]`, and keep the storage helpers unchanged.
  - `styleImports.ts`: `export { STYLE_IMPORTS } from './snippets.mjs';`.
  - `code/fullFile.ts`:
    ```ts
    import { STYLE_COMMENT, fullFile as fullFileParts } from '../content/snippets.mjs';
    export { STYLE_COMMENT };
    /** Wrap a toJsx snippet (import line, blank line, element) in a file you can paste and run. Gallery-private. */
    export function fullFile(jsx: string): string {
      const split = jsx.indexOf('\n\n');
      return fullFileParts({ importLine: jsx.slice(0, split), element: jsx.slice(split + 2) });
    }
    ```
  - If TypeScript or Vite can't resolve `.mjs` with its `.d.mts`, check that tsconfig `moduleResolution` is `bundler`, and report what was needed.
- [ ] **Step 5: Run every gallery test.** Run `pnpm --filter @bit-ds/gallery test && pnpm typecheck && pnpm lint`. Expected: green. The existing install, fullFile and InstallCommand tests pass unchanged.
- [ ] **Step 6: Commit.** `refactor(gallery): snippets.mjs is the one source for install and import snippets`

---

### Task 3: Package metadata, 0.1.0 and the package README

**Spec:** §2, plus §4's "Package README". **Files:**
- Modify:
  - `packages/react/package.json`
  - `packages/react/scripts/verify-dist.mjs`
  - `.gitignore`
  - gallery tests that pin `v0.0.0` (grep for them)
- Create: `packages/react/scripts/prepack.mjs`

- [ ] **Step 1: Write the failing checks.** In `verify-dist.mjs`, add a section that reads `../package.json` and asserts:
  - `private` is not `true`
  - `version` is `'0.1.0'`
  - `repository.url` is `'git+https://github.com/doosemavis/bit-design-system.git'` and `repository.directory` is `'packages/react'`
  - `files` deep-equals `['dist']`
  - `publishConfig.access` is `'public'`
  - `dependencies` has no `@bit-ds/core`
- [ ] **Step 2: Run it and check it fails.** Run `pnpm build && pnpm verify`. Expected: it fails on `private` or `version`.
- [ ] **Step 3: Implement the metadata.** Edit `packages/react/package.json` per §2, keeping existing fields. Check the root `LICENSE` holder and type, and set `license` to match.
- [ ] **Step 4: Add the prepack script.**
  - `packages/react/scripts/prepack.mjs` copies the repo-root `README.md` and `LICENSE` into `packages/react/`.
  - Add `"prepack": "node scripts/prepack.mjs"` to the package's scripts.
  - Add `packages/react/README.md` and `packages/react/LICENSE` to `.gitignore`. Check first that `packages/react/README.md` isn't tracked today; if it is, report it and keep it tracked.
  - Check with `cd packages/react && npm pack --dry-run`. The listing must be exactly `dist/**`, `package.json`, `README.md` and `LICENSE`. Paste the listing in the report.
- [ ] **Step 5: Update the version tests.** Run `grep -rn "0\.0\.0" apps/gallery/src` and update the tests that pin the Home badge version to `v0.1.0`. Leave unrelated matches alone.
- [ ] **Step 6: Gate.** Run every ci.yml step. Expected: green.
- [ ] **Step 7: Commit.** `feat(react): 0.1.0 package metadata for the first publish`

---

### Task 4: Consumer smoke test with a real Vite app and Chromium

**Spec:** §5. **Files:**
- Modify:
  - `scripts/smoke-consumer.mjs`
  - root `package.json` (the `smoke:full` script, plus the `playwright` devDependency at the same version as the gallery's `@playwright/test`)

**Interfaces (consumed):** `snippets.mjs` from Task 2 (`INSTALL_COMMANDS`, `PACKAGE_NAME`, `STYLE_IMPORTS`, `fullFile`). The `prepack` script from Task 3 runs automatically when `pnpm pack` runs.

- [ ] **Step 1: Run today's smoke to get a baseline.** Run `pnpm smoke`. Expected: green.
- [ ] **Step 2: Extend the script.**
  - Add `'announce'` to `EXPECTED`.
  - Import `snippets.mjs` by relative path (`../apps/gallery/src/content/snippets.mjs`). Assert that every `INSTALL_COMMANDS` value ends with ` ${PACKAGE_NAME}`, and that `PACKAGE_NAME` equals `packages/react/package.json` `name`.
  - Assert that the tarball contains `package/README.md` and `package/LICENSE`, using `tar -tzf`.
- [ ] **Step 3: Add the Vite stage.** It runs when `process.argv.includes('--vite') || process.env.SMOKE_VITE === '1'`, and follows §5 steps 1–6.
  - Install `vite`, `@vitejs/plugin-react`, `react` and `react-dom` with npm. Pin them to the versions in `apps/gallery/package.json`.
  - Write the Vite config with the React plugin, then `index.html`, `src/main.jsx` and `src/App.jsx`. App.jsx is `fullFile({...})`, followed by `export default Example;`.
  - Run `npx vite build`.
  - Read `dist/assets/*.css`. Assert that the first `@import` in the file is the Google Fonts URL, and that it comes before any rule.
  - Start `npx vite preview --port <free port> --strictPort` as a child process.
  - Launch `playwright.chromium`. Wait for the page, then assert:
    - the button has class `bit-button bit-primary`
    - `getComputedStyle(button).backgroundColor === 'rgb(124, 58, 237)'`
  - Kill the preview and close the browser in `finally`.
- [ ] **Step 4: Run both modes.** Run `pnpm smoke`; it must stay green and not run the Vite stage. Run `pnpm smoke:full`; it must be green. Paste both outputs. If Chromium is missing, run `pnpm exec playwright install chromium` once.
- [ ] **Step 5: Gate.** Run every ci.yml step. Expected: green.
- [ ] **Step 6: Commit.** `test: consumer smoke builds a real Vite app and checks the Button in Chromium`

---

### Task 5: `scripts/release-steps.mjs`, pure release helpers with unit tests

**Spec:** §6. **Files:**
- Create: `scripts/release-steps.mjs`, `scripts/release-steps.test.mjs`

**Interfaces (produced):**
- `expectedTag(version)`
- `checkTag({ tag, version })`
- `shouldPublish({ publishedVersions, version })`
- `retry(fn, { attempts = 6, delayMs = 10_000, sleep = defaultSleep })`
- CLI `node scripts/release-steps.mjs <check-tag TAG | should-publish | verify-install VERSION>`:
  - `check-tag` reads the version from `packages/react/package.json` and exits 1 with the message on a mismatch.
  - `should-publish` runs `npm view @bit-ds/react versions --json`. A 404 means no versions. It prints `true` or `false`, and with `GITHUB_OUTPUT` set it also appends `publish=true|false`.
  - `verify-install` uses a scratch dir in `os.tmpdir()`. It runs `npm init -y`, then `npm install @bit-ds/react@VERSION`, then `node -e "import('@bit-ds/react').then(m=>{if(!m.Button)process.exit(1)})"`, all inside `retry`.

- [ ] **Step 1: Write the failing tests** with `node:test` and `node:assert/strict`:
  ```js
  import { test } from 'node:test';
  import assert from 'node:assert/strict';
  import { checkTag, expectedTag, retry, shouldPublish } from './release-steps.mjs';

  test('expectedTag prefixes v', () => assert.equal(expectedTag('0.1.0'), 'v0.1.0'));
  test('checkTag passes on a match', () => assert.doesNotThrow(() => checkTag({ tag: 'v0.1.0', version: '0.1.0' })));
  test('checkTag throws on a mismatch, naming both', () =>
    assert.throws(() => checkTag({ tag: 'v0.1.1', version: '0.1.0' }), /tag v0\.1\.1 does not match package version 0\.1\.0/));
  test('shouldPublish is false when the version exists', () =>
    assert.equal(shouldPublish({ publishedVersions: ['0.1.0'], version: '0.1.0' }), false));
  test('shouldPublish is true for a new version, and when nothing is published', () => {
    assert.equal(shouldPublish({ publishedVersions: ['0.1.0'], version: '0.1.1' }), true);
    assert.equal(shouldPublish({ publishedVersions: [], version: '0.1.0' }), true);
  });
  test('retry succeeds on attempt 3 without waiting for real', async () => {
    let calls = 0; const waits = [];
    const value = await retry(async () => { calls += 1; if (calls < 3) throw new Error('not yet'); return 'ok'; },
      { attempts: 6, delayMs: 10_000, sleep: async (ms) => { waits.push(ms); } });
    assert.equal(value, 'ok'); assert.equal(calls, 3); assert.deepEqual(waits, [10_000, 10_000]);
  });
  test('retry gives up after 6 attempts and says so', async () => {
    let calls = 0;
    await assert.rejects(retry(async () => { calls += 1; throw new Error('404'); }, { sleep: async () => {} }),
      /failed after 6 attempts: 404/);
    assert.equal(calls, 6);
  });
  ```
- [ ] **Step 2: Run them and check they fail.** Run `node --test scripts/`. Expected: they fail because the module is not found.
- [ ] **Step 3: Implement the helpers and the CLI.** Run the CLI only when `import.meta.url === pathToFileURL(process.argv[1]).href`. Errors print a one-line message to stderr and exit 1.
- [ ] **Step 4: Run the tests and check the CLI by hand.**
  - `node --test scripts/` must be green.
  - `node scripts/release-steps.mjs check-tag v0.1.0` must exit 0. This needs Task 3's 0.1.0; if it isn't merged on the branch yet, report that.
  - `node scripts/release-steps.mjs check-tag v9.9.9` must exit 1 with the message.
  - `node scripts/release-steps.mjs should-publish` must print `true`, because the package isn't published yet.
  - Don't run `verify-install` against npm; the package doesn't exist yet. Say so in the report.
- [ ] **Step 5: Commit.** `feat(scripts): release-steps helpers for the tag guard, publish skip and install check`

---

### Task 6: Workflows: the ci.yml e2e job and release.yml

**Spec:** §7. **Files:**
- Modify: `.github/workflows/ci.yml`
- Create:
  - `.github/workflows/release.yml`
  - `scripts/workflows.test.mjs` (run by `node --test scripts/`)
- Modify: root `package.json` (add a `yaml` devDependency only if `actionlint` isn't installed)

**Interfaces (consumed):**
- `pnpm smoke:full` (Task 4)
- `node scripts/release-steps.mjs check-tag | should-publish | verify-install` (Task 5)
- `pnpm gallery:build` (existing)

- [ ] **Step 1: Write the failing structure test** in `scripts/workflows.test.mjs`. Parse both files with `yaml`, and assert:
  - **ci.yml:**
    - job `ci` has a step running `node --test scripts/`
    - no step mentions `storybook`
    - job `e2e` exists with `needs: ci`, and has steps that install Chromium and run `pnpm e2e`
  - **release.yml:**
    - `on.pull_request` and `on.push.tags` include `'v*'`
    - the jobs are exactly `dry-run`, `guard`, `publish` and `deploy`
    - `dry-run` runs only on `pull_request`, and the other three only on tag pushes (check their `if:`)
    - `publish.needs` is `guard`, `publish.environment` is `npm-publish`, and `publish.permissions['id-token']` is `'write'`
    - `publish` has a step whose run includes `npm publish` with `--provenance` and `--access public`, gated by the `should-publish` output
    - `publish` has a `verify-install` step with `if: always()`, or one that runs after publish is skipped
    - `deploy.needs` is `publish`, and `deploy.environment.name` is `github-pages`
    - no step runs `npm publish` without `--dry-run` outside `publish`
- [ ] **Step 2: Run it and check it fails.** Run `node --test scripts/`.
- [ ] **Step 3: Write `release.yml`** per §7. Copy the pnpm and node setup exactly from today's ci.yml (`pnpm/action-setup` version, `cache: pnpm`).
  - The `publish` job:
    - sets `registry-url: https://registry.npmjs.org` on setup-node
    - runs `npm i -g npm@^11.5.1`
    - packs with `pnpm --filter @bit-ds/react pack --pack-destination "$RUNNER_TEMP/out"`
    - runs `pnpm smoke:full`
    - has an `id: decide` step running `should-publish`
    - publishes with `if: steps.decide.outputs.publish == 'true'`, using `npm publish "$RUNNER_TEMP"/out/*.tgz --provenance --access public` and `env: NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}`
    - runs `verify-install "${GITHUB_REF_NAME#v}"`
  - The `deploy` job uses `actions/configure-pages@v5`, `actions/upload-pages-artifact@v3` with `path: apps/gallery/dist`, and `actions/deploy-pages@v4`, with `environment: { name: github-pages, url: ${{ steps.deployment.outputs.page_url }} }`.
- [ ] **Step 4: Edit `ci.yml`.**
  - Add `- run: node --test scripts/` after the gallery tests.
  - Add the `e2e` job per §7:
    - cache `~/.cache/ms-playwright`, keyed on the `@playwright/test` version from the lockfile
    - `pnpm --filter @bit-ds/gallery exec playwright install --with-deps chromium`
    - `pnpm e2e`
    - `actions/upload-artifact@v4` of `apps/gallery/playwright-report` with `if: failure()`
- [ ] **Step 5: Run the test, and actionlint if you have it.** `node --test scripts/` must be green. If `actionlint` is on PATH, run `actionlint` and paste its output. If not, say so.
- [ ] **Step 6: Gate.** Run every ci.yml step, including the new `node --test scripts/`. Also run `pnpm e2e` after stopping port 4173. Expected: green, with e2e 52/52.
- [ ] **Step 7: Commit.** `ci: release.yml (dry-run, guard, publish, deploy) and an e2e job in CI`

---

### Task 7: README, CONTRIBUTING, TODOS, stale docs and the README sync test

**Spec:** §4 and §8. **Files:**
- Modify: `README.md`, `CONTRIBUTING.md`, `TODOS.md`, `docs/designs/gallery-dogfood.md`
- Create: `apps/gallery/src/readme-sync.test.ts`

- [ ] **Step 1: Write the failing sync test:**
  ```ts
  // @vitest-environment node
  import { readFileSync } from 'node:fs';
  import { describe, expect, it } from 'vitest';
  import { INSTALL_COMMANDS, STYLE_IMPORTS } from './content/snippets.mjs';

  const readme = readFileSync(new URL('../../../README.md', import.meta.url), 'utf8');

  describe('README stays in sync with the snippets the gallery and smoke test use', () => {
    it.each(Object.entries(INSTALL_COMMANDS))('has the %s install command', (_, command) => expect(readme).toContain(command));
    it('has the style imports, theme first, verbatim', () => expect(readme).toContain(STYLE_IMPORTS));
    it('no longer says the package is unpublished', () => expect(readme).not.toMatch(/Until then|Once published|workspace-private/i));
    it('links the live docs and documents announce()', () => {
      expect(readme).toContain('https://doosemavis.github.io/bit-design-system/');
      expect(readme).toMatch(/announce\(/);
    });
  });
  ```
- [ ] **Step 2: Run it and check it fails.**
- [ ] **Step 3: Edit the README** per §4: remove the unpublished wording, add the live docs link near the top, add a "Utilities" section for `announce()` with a short example, and add `pnpm e2e` to the scripts table. Plain English, short sentences.
- [ ] **Step 4: Edit CONTRIBUTING** per §8: add a "Releasing" section with the four steps and the recovery note. Mention that `pnpm smoke:full` and `pnpm e2e` need Chromium installed once.
- [ ] **Step 5: Edit TODOS and the stale docs.**
  - TODOS.md: add the five follow-ups from §8, in the file's existing format (What, Why, Pros, Cons, Context, Depends on).
  - `docs/designs/gallery-dogfood.md`: add "Superseded (2026-10-04)" notes where it specifies `docs-deploy` or three workflow files, pointing at the 3c spec.
- [ ] **Step 6: Gate.** Run every ci.yml step. Expected: green.
- [ ] **Step 7: Commit.** `docs: README, CONTRIBUTING releasing guide, TODOS follow-ups`

---

### Task 8: Final verification (controller)

- [ ] Run every ci.yml step locally, plus `pnpm e2e` and `pnpm smoke:full`.
- [ ] Run `cd packages/react && npm pack --dry-run`. The listing must be only `dist/**`, `package.json`, `README.md` and `LICENSE`.
- [ ] Run `npm publish <tgz> --dry-run --access public` on the packed tarball.
- [ ] Push, open the PR, and watch `ci`, `e2e` and `release / dry-run` go green.
