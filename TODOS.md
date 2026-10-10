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
- **Depends on / blocked by:** Nothing. The gallery has shipped.

## Release: switch npm publishing to trusted publishing

- **Deadline:** before January 2027. npm stops letting 2FA-bypass tokens publish then, so the `NPM_TOKEN` publish will fail.
- **What:**
  - Go to npmjs.com → `@bit-ds/react` → Settings → Trusted Publisher → GitHub Actions, and fill in:
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

## Gallery: CodeBlock demo reads the install command from snippets

- **What:** The Shell example in `apps/gallery/src/manifests/codeBlock.ts` hard-codes `pnpm add @bit-ds/react`. It could read `INSTALL_COMMANDS.pnpm` from `apps/gallery/src/content/snippets.mjs`.
- **Why:** Every other install snippet comes from `snippets.mjs`, which the README sync test and the smoke test check. This one would drift if the package were renamed.
- **Pros:** One source for the install command.
- **Cons:** None worth noting.
- **Context:** Found in the PR3c final review.
- **Depends on / blocked by:** Nothing.

## Tests: Icon route smoke under 5s

- **Target:** 0.1.9 (missed 0.1.8).
- **What:** Make the Icon page's route smoke test (`apps/gallery/src/routes.test.tsx`, "Icon: heading, the five sections…") finish well under Vitest's 5s default, consistently on CI. Then remove `icon` from `SLOW_PAGES`, which gives it a 15s limit for now.
- **Why:** On 2026-10-09 it took 5.6s on CI and failed PR #44 once; a re-run passed. Alone it takes about 0.9s locally, so the time goes to rendering 300 icons and running axe over all of them while other test files share the runner.
- **Pros:** No flaky CI failures, and no special-case timeout to remember.
- **Cons:** Any speed-up must keep the accessibility check meaningful for the Icon page.
- **Context:** Ideas to measure first:
  - Run axe on the preview and playground only, and cover the icon grid in a test of its own that checks a sample of icons.
  - Limit axe to the rules that matter for icons (`svg-img-alt`, `role-img-alt`, `aria-hidden-focus`) on the grid.
  - Render the grid lazily, or a page of icons at a time, which may also help the real page.
  - Check whether the jsdom environment or the axe import is the slow part, with `--reporter=verbose` timings on CI.
- **Depends on / blocked by:** Nothing.

## 0.2.0 removals

- **What:** 0.2.0 deletes everything deprecated in 0.1.8:
  - `@bit-ds/core` tokens (`packages/core/src/tokens.ts`): `DEPRECATED_TEXT_SIZES`, `DEPRECATED_TEXT_SIZE_TO`, the `DeprecatedTextSize` type, and their `--bit-text-11px`, `-13px` and `-15px` entries in `typeTokens` (SEMANTIC_TOKENS goes from 114 to 111).
  - `packages/core/src/themes/power-up.css`: the 11, 13 and 15 aliases (`--bit-text-11px`, `-13px`, `-15px`).
  - `packages/core/src/components/text.css`: the deprecated `.bit-text[data-size="11"]`, `"13"` and `"15"` rules.
  - `packages/core/src/components/heading.css`: the `.bit-heading[data-level="1"]` to `"6"` rules.
  - Heading (`Heading.tsx`): the `level` prop, `LEVELS`, `HeadingLevel`, `LEVEL_SIZE`, `levelTag`, `oldLevelSize`, and the old `size={1..6}` form (so `size` is `HeadingSize` only).
  - Text (`Text.tsx`): the `as` prop and `TextElement`, and the size-deprecation branch (11, 13, 15 mapped through `DEPRECATED_TEXT_SIZE_TO`).
  - Their exports from `@bit-ds/react`: `DEPRECATED_TEXT_SIZES` and `DeprecatedTextSize` (`src/index.ts`), `DEPRECATED_TEXT_SIZE_TO` (`system/axes.ts`), `HeadingLevel` and `TextElement`.
  - Gallery: `apps/gallery/src/content/currentTokens.ts` (use `SEMANTIC_TOKENS` again), the `level` row in `manifests/heading.ts` and the `as` row in `manifests/text.ts`, and the "1 to 6 is deprecated" note in Heading's `size` row.
  - The tests for the deprecated forms: the deprecation cases in `Heading.test.tsx` and `Text.test.tsx`, the 11/13/15 token and alias checks in core's `tokens.test.ts` and `px-rename.test.ts`, the `text.css` exception in `type-floor.test.ts`, and the gallery's `SHOWN_TOKENS` in `TokensPage.test.tsx` (back to `SEMANTIC_TOKENS`).
- **Why:** Each was kept one minor version so code written for 0.1.7 keeps working, with a console warning that names the replacement.
- **Pros:** One way to size and tag headings and text, and three fewer tokens per theme.
- **Cons:** A breaking release: callers still on `level`, `as`, `size={1..6}` or text sizes 11, 13 and 15 must change their code.
- **Context:** `warnDeprecated` (`packages/react/src/system/warnDeprecated.ts`) can go too if nothing else uses it by then. 0.2.0 also revisits the class-naming exceptions listed in CONTRIBUTING.md, "Conventions" (`bit-iconButton`, `bit-iconFilled`, `bit-flat`). The release notes for 0.2.0 should list every removal with its replacement.
- **Depends on / blocked by:** The 0.2.0 release.
