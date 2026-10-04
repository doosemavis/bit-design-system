# TODOS

## Gallery: phone and tablet layouts

- **What:** Intentional phone (<640px) and tablet (640–960px) layouts for every gallery page.
- **Why:** The gallery is computer-only for now (owner ruling, 2026-10-02). If bit is later explored on phones or in a mobile app, the desktop layout would just squeeze.
- **Pros:** Bit becomes explorable anywhere, and the work also stress-tests the components' own small-screen behavior.
- **Cons:** It adds a responsive pass to every page, plus touch-target work (44px minimum on controls).
- **Context:**
  - The 2026-10-02 design review mocked a sticky-preview phone layout: `~/.gstack/projects/doosemavis-bit-design-system/designs/responsive-20261002/compare.html`. The preview pins under the header while the controls scroll, so cause and effect stay on one screen.
  - The mock exposed a gotcha: the Playground Card must not use `overflow: hidden`, or `position: sticky` stops working.
  - The Variants and Props tables should scroll sideways with a visible edge.
  - See "Design Review Amendments" in `docs/superpowers/plans/2026-09-13-gallery.md`.
- **Depends on / blocked by:** The gallery shipping first (re-planned Tasks 8–11).

## Release: docs-only deploy path

- **What:** A `docs-deploy` workflow (manual run) that redeploys the gallery to Pages without publishing a new npm version.
- **Why:** Deferred in the 2026-10-02 eng review (D3). Today every docs fix ships as a patch release through the `v*` tag workflow.
- **Pros:** Typos and docs-only fixes go live without a version bump.
- **Cons:** It's a second release path. To keep the promise that the docs never advertise an install that fails, it must fail if `packages/` changed since the `v{version}` tag (design doc reviewer concern R3-11).
- **Context:** One release path was chosen for simplicity at 0.x with a solo owner. Revisit if patch-releases-for-typos become annoying.
- **Depends on / blocked by:** The `release.yml` tag workflow (PR3) existing first.

## Release: switch npm publishing to trusted publishing

- **Deadline:** before January 2027. npm stops letting 2FA-bypass tokens publish then, so the `NPM_TOKEN` publish will fail.
- **What:**
  - After `@bit-ds/react` 0.1.0 is on npm, go to npmjs.com → package → Settings → Trusted Publisher → GitHub Actions, and fill in:
    - owner `doosemavis`
    - repo `bit-design-system`
    - workflow `release.yml`
    - environment `npm-publish`
  - Then delete the `NPM_TOKEN` secret from the `npm-publish` environment and revoke the token on npm.
- **Why:** It removes the last long-lived npm credential stored in GitHub. Trusted publishing mints short-lived credentials per run, tied to the workflow.
- **Pros:** No stored npm secret. Publishes are attributable to the exact workflow run.
- **Cons:** A 5-minute manual step on npmjs.com. Do it before the deadline, and do not remove the token from `release.yml` until npm trusts the workflow.
- **Context:** npm trusted publishing can't create a brand-new package (verified 2026-10-02), so v0.1.0 used the token. The publish job already has `id-token: write` and installs the exact `NPM_VERSION` (11.5.1 or later), which trusted publishing requires, and since the build/publish split it runs no install, so the switch is safe.
- **Depends on / blocked by:** Nothing now. The steps are in CONTRIBUTING.md, "Releasing".

## Release: pin the publish job's actions to commit SHAs

- **What:** Pin `actions/checkout`, `actions/setup-node` and `actions/download-artifact` in the `publish` job to full commit SHAs with a `# vX.Y.Z` comment, then the rest of both workflows (security.md C3, review M5).
- **Why:** A moved tag runs new code. In `publish` that code would hold `NPM_TOKEN` and, after the trusted-publishing switch, the right to mint a publish credential.
- **Pros:** The credential job runs only reviewed action code. Dependabot's github-actions updates bump SHA pins too.
- **Cons:** `PINNED_ACTIONS` in `scripts/workflows.test.mjs` must learn the SHA form, and every bump is a PR.
- **Context:** All three are GitHub-owned. The repo still allows all actions; also consider "Require actions to be pinned to a full-length commit SHA".
- **Depends on / blocked by:** Nothing.

## Release: exact-key archive cache for the Pages site

- **What:** Drop `restore-keys: site-archives-v2-` from `site-build` and `docs-build`, or verify a sha256 manifest of each cached archive before reuse (security.md C6, review M6).
- **Why:** The archive cache is restored into the jobs whose output is deployed to Pages. A poisoned entry under the prefix would be served as an old version's HTML.
- **Pros:** Only an archive built for exactly this tag set is reused.
- **Cons:** Without restore-keys, each new tag rebuilds every older line once (a few minutes per line).
- **Context:** Only `main` and the tag's own ref can write those caches, and the prefix moved to v2 with the `--ignore-scripts` recipe, so no entry from before is reused.
- **Depends on / blocked by:** Nothing.

## Link: hover underline in light islands

- **What:** Give Link's hover underline a per-mode private property, so a light island (`[data-mode="light"]`) inside a dark page gets the light underline.
- **Why:** Today a light island inside a dark page still gets the dark-mode hover underline.
- **Pros:** Link looks right in every mixed-mode layout.
- **Cons:** One more private property to keep in step with the mode blocks.
- **Context:** Light-in-dark islands are rare, but the README documents dark-in-light and the reverse works the same way.
- **Depends on / blocked by:** Nothing.

## Forced colours: Code inside a Table

- **What:** Add a transparent-border fallback to Code inside a Table.
- **Why:** In forced-colours mode Code inside a Table has no pill, so only the mono font sets it apart.
- **Pros:** Inline code stays visible as code for forced-colours users.
- **Cons:** A small extra rule, plus a forced-colours check to cover it.
- **Context:** A transparent border is drawn in forced-colours mode and invisible otherwise.
- **Depends on / blocked by:** Nothing.

## Accessibility: axe on toggled and open states

- **What:** Add axe checks for toggled and open control states.
- **Why:** axe only checks each page's default state today. Open and toggled states (a checked Switch, an open Select, an error Field) are never scanned.
- **Pros:** Catches contrast and naming bugs that only show after interaction.
- **Cons:** Slower e2e runs, and each page needs steps to reach its states.
- **Context:** The e2e suite runs axe in light and dark on every page.
- **Depends on / blocked by:** Nothing.

## Tokens: outline shadow offsets

- **What:** Consider offset tokens for the outline shadow offsets.
- **Why:** The outline shadow offsets (4px and 2px) repeat the offsets in `--bit-shadow-md` and `--bit-shadow-sm`, so the two can drift apart.
- **Pros:** One place to change a shadow offset.
- **Cons:** More tokens to name, document and test across themes.
- **Context:** Worth doing only if a second theme changes the shadow sizes.
- **Depends on / blocked by:** Nothing.

## Release: derive the token count in verify-dist

- **What:** Make `verify-dist.mjs` derive the SEMANTIC_TOKENS count from the source instead of hard-coding 94.
- **Why:** The hard-coded count fails the build whenever a token is added, even when the change is right.
- **Pros:** Adding a token needs no second edit.
- **Cons:** The check must still catch a token that goes missing from the dist.
- **Context:** The count is checked against the built CSS.
- **Depends on / blocked by:** Nothing.

## Gallery: CodeBlock demo reads the install command from snippets

- **What:** The Shell example in `apps/gallery/src/manifests/codeBlock.ts` hard-codes `pnpm add @bit-ds/react`. It could read `INSTALL_COMMANDS.pnpm` from `apps/gallery/src/content/snippets.mjs`.
- **Why:** Every other install snippet comes from `snippets.mjs`, which the README sync test and the smoke test check. This one would drift if the package were renamed.
- **Pros:** One source for the install command.
- **Cons:** None worth noting.
- **Context:** Found in the PR3c final review.
- **Depends on / blocked by:** Nothing.
