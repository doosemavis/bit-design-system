# Versions, "Start here" and the animated section underline: design

**Status:** approved in brainstorming on 2026-10-04 (boards `designs/versions-20261004/board.html` and `designs/sidebar-titles-20261004/board-animated.html`, plus the engineering design in chat). The owner asked for the build to be done with subagents, stopping before merge and release.

**Ships as:** a **docs-site update** on `feat/versions-0.1.1`, with **no package release**. `@bit-ds/react` stays at 0.1.0, because `packages/` hasn't changed since v0.1.0. The branch name predates this decision (owner, 2026-10-04). See §6 for the versioning rule.

## Goal

A person reading the docs can:
1. Get home and get started from the sidebar, not only from the logo.
2. See what each bit version needs (its React range) and what changed (release notes, breaking changes).
3. Pick a version from a dropdown and see **that release's** site: the pages, props and components exactly as they shipped.

## Decisions (owner, 2026-10-04)

| # | Decision |
|---|---|
| 1 | **Nav group Q1-A:** a **"Start here"** group above Foundations, with **Overview** (Home, `/`), **Getting started** (`/getting-started`), **Versions** (`/versions`) and **Release notes** (`/release-notes`). |
| 2 | **Picker Q2-A:** a labelled bit `Select` ("Version") in the header, to the left of the light/dark toggle, on every page. On any version that isn't the latest, a solid warning `Alert` runs across the top of every page. It says "You're viewing the docs for vX. Components here behave as they did in vX." and links to the latest. |
| 3 | **Pages Q3:** as shown on the board. **Getting started** has 5 steps: install (the pnpm/npm/yarn switcher moves here from Home), add the styles once, use a component, light and dark, and next steps. **Versions** has a requirements table and a breaking-changes box. **Release notes** come from `CHANGELOG.md`, with Breaking, Added and Fixed badges. Home keeps a short "Get started →" teaser. |
| 4 | **Approach 1, frozen copies:** every release's gallery is a real build of that release, kept at `/bit-design-system/vX.Y.Z/`. The latest is at the root. |
| 5 | **Section titles:** the title is darker (full text colour) with an **accent underline**. The current section's bar **grows from a 22px stub to the title's full width** (variant A): smooth, 450 ms, `cubic-bezier(.2,.8,.2,1)`. Other sections keep the 22px stub. The animation replays only when the current section **changes**, never within a section. With `prefers-reduced-motion: reduce` there is no animation, and the end state shows. It uses plain CSS keyframes and adds no dependencies. |

## 1. Data sources (one each)

### 1.1 `CHANGELOG.md` (repo root, Keep a Changelog style)
```md
# Changelog

## 0.1.1 — 2026-10-XX
### Added
- Versions page, release notes, version picker, "Start here" nav.

## 0.1.0 — 2026-10-04
### Added
- First release: 27 components, the Power Up theme, light and dark.
```
- Each heading is `## <semver> — <YYYY-MM-DD>`.
- Sections are `Breaking`, `Added`, `Changed`, `Fixed` and `Removed`, all optional.
- Bullets are plain Markdown with inline code only.
- **`apps/gallery/src/content/changelog.ts`** imports `CHANGELOG.md?raw` and exports `parseChangelog(text): Release[]`, where `interface Release { version: string; date: string; sections: Partial<Record<'Breaking'|'Added'|'Changed'|'Fixed'|'Removed', string[]>> }`. It returns newest first and throws on a malformed heading.
- **A release-gate test** fails if the `version` in `packages/react/package.json` has no CHANGELOG entry.

### 1.2 `versions.json` (generated at deploy, served at `/bit-design-system/versions.json`)

**Release-line rule (owner, 2026-10-04):** the picker lists **one entry per release line**, each pointing at that line's newest patch.
- While the major version is 0, a line is a **minor** (`0.1`, `0.2`…), because pre-1.0 minors carry breaking changes.
- From 1.0, a line is a **major** (`1`, `2`…).
- Every patch still gets its own section in Release notes.
- Only one frozen copy per line is built and kept.

Example, once 0.2.0 exists:
```json
{ "latest": "0.2",
  "lines": [
    { "line": "0.2", "version": "0.2.0", "date": "2026-11-XX", "path": "/bit-design-system/",      "react": "^19.0.0", "reactDom": "^19.0.0",
      "breaking": [ { "version": "0.2.0", "items": ["`Button` drops the `size` prop."] } ] },
    { "line": "0.1", "version": "0.1.3", "date": "2026-10-XX", "path": "/bit-design-system/v0.1/", "react": "^19.0.0", "reactDom": "^19.0.0" } ] }
```
- `breaking` is optional: the releases in that line with CHANGELOG `Breaking` items, newest first, read from the **current** CHANGELOG at deploy. It's left out when there are none. An archived copy's own CHANGELOG stops at its tag, so the Versions page reads newer lines' breaking changes from here.
- The latest line is served at the root. Older lines are served at `/bit-design-system/v<line>/`, which keeps the URL stable when a line gets another patch.
- Right after 0.1.1 ships there is **one** line, `0.1` (latest). That's expected: 0.1.0 and 0.1.1 share a line.
- **`scripts/versions.mjs`** is pure and has node tests. It builds this file from:
  - the `v*` tags reachable from HEAD (`git tag --list 'v*' --merged HEAD`), grouped into lines by `lineOf(version)`: `0.x.y → "0.x"`, `n.x.y → "n"` for n ≥ 1, keeping the newest patch per line
  - each chosen tag's `packages/react/package.json`, read with `git show <tag>:…`, for `peerDependencies.react` and `['react-dom']`
  - the dates and `Breaking` items in the current CHANGELOG, parsed once with the gallery's shared `CHANGELOG_HEADING`
- Unit tests cover:
  - grouping (`0.1.0, 0.1.1, 0.2.0 → 0.2, 0.1(=0.1.1)`)
  - the 1.0 boundary (`0.9.4, 1.0.0, 1.2.3, 2.0.0 → 2, 1(=1.2.3), 0.9(=0.9.4)`)
  - pre-release tags (`v1.0.0-rc.1`), which are ignored
- In local dev the gallery reads `apps/gallery/public/versions.json`. That file is gitignored and generated by `npm run versions`. If it's missing, the picker shows "dev (unreleased)".

## 2. Frozen copies (deploy)

The `deploy` job in `release.yml` changes to these steps:
1. Build the **current** gallery as before, at root base `/bit-design-system/`, into `site/`.
2. For **each older line** (§1.2), using that line's newest patch tag:
   - Add a git worktree at the tag, then run `pnpm install --frozen-lockfile` and the library build.
   - In `apps/gallery`, run `vite build --base /bit-design-system/v<line>/ --outDir <site>/v<line>`. `--base` overrides the old config, and the hash router needs no change.
   - Cache each tag's built output with `actions/cache`, keyed on the tag. A new patch in an old line gives a new key, so that line rebuilds once.
3. Write `site/versions.json` (§1.2).
4. **Inject the old-version banner.**
   - Copy `scripts/version-banner.js` to the site root. It is dependency-free and has no build step.
   - Add `<script src="/bit-design-system/version-banner.js" defer>` to every archived `index.html`.
   - The script fetches `versions.json`. If its own path isn't the latest, it renders the warning banner and a plain `<select>`, styled with bit's own CSS classes (`bit-select`, `bit-alert`), that switches versions. On the latest it does nothing.
   - It also skips any build that already has `data-bit-version-picker` on `<html>`, so 0.1.1 and later don't get a second picker.
5. Upload `site/` as the Pages artifact.

**When the site deploys (owner, 2026-10-04: docs changes don't make a release):**
- **On a `v*` tag:** after publish, as today.
- **On a push to `main`:** a `docs` job runs the same site build, only if `git diff --quiet <latest v* tag> HEAD -- packages/` passes. If the library has changed but isn't released yet, the job skips with a notice, so the root never shows unreleased component behaviour as the current version. The next tag deploys it.
- **`workflow_dispatch` (a manual "Run workflow" of Release on `main`):** the same guard.
- **Concurrency:** the tag deploy and the main deploy share the `pages` concurrency group, with cancel-in-progress off.
- **Archives are frozen at their line's last tag.** Docs fixes made after a line's last release don't reach its archived copy. That's accepted.

**Logic lives in `scripts/build-versioned-site.mjs`.** It takes `--out`, `--current-dist`, `--as-older` and `--cache` (plus `--check` and `--cache-key`). There is no `--tags` flag: it reads the tags from git (`git tag --list 'v*' --merged HEAD`). It has node tests for the path mapping and the injection, and is called by `release.yml`.

**Deploy dry-run (PR):** the release `dry-run` job runs `node scripts/build-versioned-site.mjs --out $RUNNER_TEMP/site --as-older v0.1.0`. `--as-older` treats the given tag as an older line, even though it shares a line with the current version. That exercises archiving, the injected banner and switching before a second real line exists. The job then asserts:
- `index.html` exists at the root
- `v<line>/index.html` exists for each older line, including the `--as-older` one
- `versions.json` is valid
- the banner is injected into archived copies only

## 3. The picker (gallery)

- **`apps/gallery/src/shell/VersionSelect.tsx`:**
  - a bit `Field` + `Select`, sm size, labelled "Version"
  - sits in the header to the left of `ModeToggle`; at phone width it sits in the Menu sheet with the GitHub button
  - options come from `versions.json`, one per line, labelled like `0.2 (latest) · 0.2.0` and `0.1 · 0.1.3`
  - the current build's line, `lineOf(__BIT_VERSION__)`, is selected
  - with a single line, the select still shows it, disabled, with the title "Only one release line so far"
- **Changing the selection** goes to `<path>#<current hash route>`, so the reader stays on the same page. If that page doesn't exist in the target version, that copy's own NotFound page links home.
- **Before `versions.json` loads**, the select shows only the current version.
- **If the fetch fails**, the select stays on the current version, disabled, with a title. It never throws.
- **Banner:** if the current build isn't `latest`, `<OldVersionBanner>` (a solid warning `Alert`, `role="status"`) renders above the routes on every page.
- `<html data-bit-version-picker>` is set once the picker mounts.

## 4. "Start here" pages and nav

- **`NAV`** (`apps/gallery/src/shell/Sidebar.tsx`): add a new group, `'Start here'`, first: Overview `/`, Getting started `/getting-started`, Versions `/versions`, Release notes `/release-notes`. `NavGroup` gains `'Start here'`. The e2e route list picks these up automatically.
- **Routes** (`router.tsx`): add three lazy pages, `GettingStartedPage`, `VersionsPage` and `ReleaseNotesPage`. They are built only from bit components; the raw-tag lint rule applies.
- **Getting started:**
  - The five steps move from `pages/home/GetStarted.tsx` (now `pages/getting-started/GetStarted.tsx`), with the install switcher and the style imports.
  - Home keeps a teaser: one line plus a Link.
  - Step 4 shows `ModeToggle` and `COLOR_MODE_SCRIPT`.
  - Step 5 links to Tokens, the naming rule on Home, and Button (the first component, with live controls).
- **Versions:**
  - a bit `Table` with columns bit / React / react-dom / Status
  - Status is a Badge: "Latest", "Viewing", or none
  - rows come from `versions.json`; if it's unavailable, the table falls back to the current build only
  - when viewing an older version, a warning outline `Alert` appears for each newer release that has a CHANGELOG `Breaking` section, read from the newer lines' `breaking` lists in `versions.json` (§1.2)
- **Release notes:**
  - releases from `parseChangelog`, newest first
  - each shows a `Heading` (version), a date `Badge`, and a list per section
  - section badges: Breaking (solid danger), Added (solid success), Changed (outline primary), Fixed (outline primary), Removed (outline neutral)
  - inline code renders as `Code`

## 5. Animated section underline

- **`gallery.css`:**
  - The title gets `color: var(--bit-color-text)`.
  - A `::after` draws the bar: `3px`, `var(--bit-color-accent)`, `width: 22px` at rest and `100%` when current.
  - `@keyframes gallery-section-fill { from { width: 22px } to { width: 100% } }`, run as `450ms cubic-bezier(.2,.8,.2,1) both`.
  - `@media (prefers-reduced-motion: reduce)` sets `animation: none`.
  - Every paint property is a documented exception with a true reason, for example "frame: current-section underline".
- **`Sidebar.tsx`:**
  - The current section is the group that holds the active route, and it gets `data-current`.
  - The animation restarts only when the current **group** changes. To do this, key the title on the group plus a counter that increments on group change.
- **Tests:**
  - Unit: navigating within a group does not re-key the title, and navigating to another group does.
  - The CSS guard still passes.
  - e2e with reduced motion: the bar is at full title width, with no running animation.

## 6. Versioning rule and docs

- **No version bump in this work.** `@bit-ds/react` stays at **0.1.0**, and the CHANGELOG has only the 0.1.0 entry.
- **The versioning rule** (owner, 2026-10-04) goes in CONTRIBUTING under "Releasing":
  - A version describes the **npm package**. Anything that changes what people install gets a version:
    - component behaviour, props and styles
    - `@bit-ds/core` tokens and CSS
    - types
    - peer ranges
    - package contents
  - Use semver: a patch for a fix, a minor for a feature, and a major for a breaking change. While on 0.x, a breaking change is a minor.
  - The docs site, CI, scripts and tests **never** trigger a version. They deploy through the `main` docs job.
  - A README-only change waits for the next real release, because npm shows the README only from a published version.
- CONTRIBUTING "Releasing" starts with "add a CHANGELOG entry", and explains the versioned site and the docs deploy.
- README gets a "Versions and release notes" line that links the live pages.

## Gates

- Every ci.yml step passes locally.
- `pnpm e2e` passes, with the 3 new routes in light and dark and zero axe violations.
- `node --test 'scripts/*.test.mjs'` passes.
- `smoke:full` passes.
- The workflow tests pin the `main` docs job's `packages/` guard and the `workflow_dispatch` trigger.
- A local `build-versioned-site.mjs --as-older v0.1.0` run is served statically. `/bit-design-system/v0.1/` must show 0.1.0's gallery with the injected banner, and the root must show the picker. Screenshots go to the owner.

## Out of scope

- library code changes
- search across versions
- per-component "added in" badges
- deleting old versions
