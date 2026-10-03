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

- **What:**
  - After `@bit-ds/react` 0.1.0 is on npm, go to npmjs.com → package → Settings → Trusted Publisher → GitHub Actions, and fill in:
    - owner `doosemavis`
    - repo `bit-design-system`
    - workflow `release.yml`
    - environment `npm-publish`
  - Then delete the `NPM_TOKEN` secret from the `npm-publish` environment and revoke the token on npm.
- **Why:** It removes the last long-lived npm credential stored in GitHub. Trusted publishing mints short-lived credentials per run, tied to the workflow.
- **Pros:** No stored npm secret. Publishes are attributable to the exact workflow run.
- **Cons:** A 5-minute manual step that can only happen after the first publish.
- **Context:** npm trusted publishing can't create a brand-new package (verified 2026-10-02), so v0.1.0 must use the token. The publish job already pins Node ≥ 22.14 / npm ≥ 11.5.1, which trusted publishing requires.
- **Depends on / blocked by:** PR3 merged and v0.1.0 released.
