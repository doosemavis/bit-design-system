# PR3a Gallery Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the gallery into the finished documentation site for the first npm release:
- a layout-C page for every component
- a full Tokens page
- an onboarding Home with an install switcher
- the shell bugs fixed
- className decorators taught (Amendment 1)

**Architecture:**
- **Library (`@bit-ds/react`, `@bit-ds/core`):**
  - CodeBlock gains a public `actions` slot in its bar.
  - Table cells centre vertically.
  - `SEMANTIC_TOKENS` is re-exported from `@bit-ds/react`, so the gallery reads the token list through the package it already consumes.
- **Gallery shell (wave 1):**
  - Focus moves only when the pathname changes.
  - History pushes for discrete changes and replaces, after a 400ms debounce, for typed ones.
  - One in-page link helper serves the skip link and every section bar.
  - Lazy pages get loading and error states, and the 404 suggests the closest component.
  - One media-query hook drives the phone layout.
  - Shared page parts: `PageHeader`, `PageSection`, `SectionBar` and `CopyButton`.
- **Gallery pages (wave 2):**
  - Each page gets a folder of small parts: `pages/component/`, `pages/tokens/` and `pages/home/`.
  - Three data lists drive the ComponentPage code footer, the Props table and the Home naming rule: `CODE_FORMATS`, `PROP_COLUMNS` and `NAMING_COLUMNS`. A new format or column is one entry.

**Tech Stack:**
- pnpm 9.15.9 workspaces, TypeScript 5.9 strict, React 19
- react-router-dom 7 (hash router), Vite 7, tsup
- Vitest 4: jsdom for react and gallery, node for core
- Testing Library, user-event 14, axe-core 4

**Spec:** `docs/superpowers/specs/2026-10-03-pr3a-gallery-pages-design.md`, including "Amendment 1: className decorators".

Visual references, both in `~/.gstack/projects/doosemavis-bit-design-system/designs/pr3a-20261003/`:
- `board.html`
- `board-classname.html` (Amendment 1)

**How this plan was checked:**
- **Scratch worktree:** every code block was run in a scratch worktree off `faf1ec1`. That is the code base of spec commit `50a066e`, which changed only the spec.
- **Sequential run:** the tasks were applied in plan order: T1, T2, T3a (two commits), T3b, T3c, T4, T5 and T6. After each one, build, verify, tests, coverage, typecheck and lint were green. The full gate, smoke and Storybook included, was green at the end.
- **Parallel tasks alone:** each parallel task was also run alone on its real base:
  - T3b on T3a's first commit: green
  - T5 alone on wave 1: react 409, gallery 306
  - T6 alone on wave 1: gallery 313
- **Red steps:** the ones for CodeBlock, `useControlState` and `useFocusHeading` were replayed against the old code. Every other red step fails because a module or export doesn't exist yet.
- **Real browser:** the built gallery was loaded at 390px wide. `document.documentElement.scrollWidth` was 390 on twelve routes:
  - `/`, `/tokens`, `/typography`, `/spacing`, `/brand/logo`, `/nope`
  - `/components/button`, `/components/table`, `/components/segmentedcontrol`, `/components/field`, `/components/codeblock`, `/components/nope`

## Where the code contradicted the spec or the brief, and what this plan does

1. **There is no `toHtml` and no full-file wrapper.**
   - The spec calls the HTML rule "the existing `toHtml` rule", but `toHtml` was deferred in PR1 (its plan's Decision 5) and never built.
   - T4 builds `code/toHtml.ts` from the design in Task 8 of the 2026-09-13 gallery plan.
   - T4 also builds `code/fullFile.ts`, following `docs/designs/gallery-dogfood.md`.
   - "Static" becomes a manifest flag. T3a adds `Manifest.interactive`, which is true for ModeToggle and CodeBlock, the two components that need React to work at all.
2. **The gallery can't reach `SEMANTIC_TOKENS`.**
   - Only `@bit-ds/core` exports it. That package is private, and the gallery depends only on `@bit-ds/react`.
   - T5 re-exports it from `@bit-ds/react`, and verify-dist checks it there:

     ```ts
     export { PREFIX, SEMANTIC_TOKENS } from '@bit-ds/core/tokens';
     ```

     The list still comes from core's export.
   - This sat in T1 until T1 was built ahead of the plan from spec §1–2, which doesn't mention it, so it moved to the only task that needs it.
3. **CodeBlock's bar isn't in `code.css`.**
   - It is in `packages/core/src/components/code-block.css`.
   - T1 edits that file and `__tests__/components/code-block.test.ts`.
   - Reviewer: if the early-built T1 changed `code.css` instead, that is the deviation to fix.
4. **"Browse components →" targets `/components/button` today, not `/components/alert`.**
   - The spec says "the first component in the sidebar, today `/components/alert`".
   - The sidebar follows `MANIFESTS`, which starts with Button.
   - T6 computes the target from `NAV`, so it follows the sidebar either way.
5. **Bad shared values were never rewritten.**
   - §7.6 calls this existing behaviour, but the code only reset the values; the URL kept `?color=purple`.
   - T2 adds the rewrite: the `canonical` effect in `useControlState`, using `replace`.
6. **The spec asks for "Cards in soft success and soft danger", but Card has no color.**
   - T4 uses outline Alerts (the soft fill) with `role="note"`. The Typography page already does this (foundations plan, decision 10).
   - A gallery color rule on a Card would also fail 3b's layout-only CSS test.
7. **Amendment 1's tip line would teach a class Link doesn't have.**
   - The rule says "`{v}` is `danger` for color", but Link's color axis is `primary | neutral`.
   - `toClasses` would keep `bit-primary` and add an unstyled `bit-danger`.
   - `classTip` uses `danger` only when the axis offers it. Otherwise it uses the axis's last value, so Link's tip shows `className="bit-neutral"`. A test pins this.
8. **The decomposition kept its shape, with these moves:**
   - **New helpers go to T2 in wave 1.** All three wave-2 tasks would otherwise create the same files:
     - `ui/CopyButton.tsx` (the import chip and the token rows)
     - `ui/PageHeader.tsx`, `ui/PageSection.tsx` and `ui/SectionBar.tsx` (both section bars)
     - `content/styleImports.ts` (the full file and Home step 2)
     - `test/matchMedia.ts`
   - **The route components move.** T2 moves `ComponentRoute` and `LogoRoute` into `pages/ComponentRoute.tsx`, so T4 owns `ComponentPage.tsx` alone.
   - **`toJsx.ts`:** T4 owns it, as directed. Nothing in wave 1 touches it.
   - **T3 splits in three:**
     - T3a and T3b each write ten manifests' docs, in parallel.
     - T3a's first commit is types and contract only. The controller merges it before T3b starts.
     - T3c is a five-minute join that makes `docs` required once both halves are in.

## Decisions this plan makes that the spec left open (owner: confirm in review)

1. **Active preset.**
   - A preset is active when every value it sets holds in the current state.
   - Two compatible presets can both be pressed, such as Danger outline and Loading.
   - Active is `color="primary" variant="solid"` with `aria-pressed="true"`; inactive is neutral ghost.
2. **Error page.**
   - It has an h1, "Something went wrong", above the spec's danger Alert (`role="alert"`) and the primary "Reload page" Button.
   - Without an h1, `useFocusHeading` would poll every animation frame forever.
   - The errorElement sits on a pathless route under the Shell, so the header and sidebar stay usable.
3. **Unknown-slug page.**
   - It shows "Go to {Name}" with a hidden →, then an h2 "Every component" over the list of Links.
   - Matching compares slugs and ignores case. A tie goes to the earlier manifest in sidebar order.
   - `/components/logo` suggests BitLogo at `/brand/logo`.
4. **Phone layout.**
   - `useMediaQuery('(max-width: 720px)')` decides whether GitHub renders in the header or in the sheet, so a test can check it.
   - jsdom has no matchMedia, so the hook reads false there.
   - The sheet stays open only on the page it was opened on. Any navigation, Back included, closes it, with no effect needed.
   - Escape closes the sheet and returns focus to Menu.
5. **Empty-children errors.**
   - Button uses the §E text.
   - Link: "A Link needs text, or screen readers read out the address instead."
   - Switch: "A Switch needs a label, or screen readers announce just \"switch, off\"."
   - The field shows the error in a raw `<p>`, with `aria-invalid` and `aria-describedby`; 3b moves ControlsPanel onto bit Field.
6. **Variants headers** are the prop values as you'd type them: `color`, `solid`, `outline`, `ghost`. A single axis gets one body row and no row header.
7. **Code mode.**
   - The mode (Props | className | HTML) and the "Full file" switch are local state on the page, as the React/HTML choice would have been.
   - An unavailable mode falls back to Props.
   - The code region keeps its name, "Example code".
8. **Tokens page.**
   - The table is named "Token values", because the section region is already "All tokens" and two regions can't share a name.
   - The filter matches token names only, which is what the empty state's name-format example teaches.
   - The count Badge has `role="status"`.
   - The surface row is the six tokens the spec names: bg, surface, text, text-muted, ink, and focus (`--bit-focus-ring-color`).
9. **Large Home tiles** use a stretched link.
   - The footer Link's `::after` covers the whole tile.
   - The live preview sits outside the link and is `inert`, so each tile is one link with no nested interactive content. axe passes.
10. **Compact tile glyphs** come from the board:

    | Component | Glyph |
    |---|---|
    | Badge | `+1` |
    | Box | `□` |
    | Code | `<>` |
    | CodeBlock | `{}` |
    | Heading | `H` |
    | Link | `a` |
    | ModeToggle | `◐` |
    | Spinner | `◌` |
    | Stack | `≡` |
    | Table | `▦` |
    | Text | `Aa` |

    A new component falls back to its first letter. The glyphs are set in mono, because the pixel face lacks most of them.
11. **New copy the spec didn't give** (owner, please read):
    - **Tokens intro:** "Every value a theme sets, read live from this page, so they follow the light and dark switch."
    - **Get started:** the three help lines in T6.
    - **Tokens empty state:** "Token names look like `--bit-color-primary` or `--bit-space-16px`. Try part of one, such as color or space."
    - **Manifest docs:** all of the `docs` content in T3a and T3b.
12. **Typography face chips.**
    - Every face sample gets `min-height: var(--bit-space-48px)` and sits on its floor (`display: flex; align-items: flex-end`).
    - The four token chips then line up.
13. **Props table wrapping.** Prop, Default and Class stay on one line (`.gallery-nowrap`); Type and Description wrap.
14. **In-page links.**
    - The skip link and the section bars keep `href="#id"`, so they read and copy as links, and they call `preventDefault` on click.
    - Focus moved by script draws no ring on `main` or on a `tabindex="-1"` heading.
15. **`gallery.css` markers.** T2 adds three markers, one section per wave-2 page. See "Parallelism and merge".

## Global Constraints

- **Branch and spec:** `feat/gallery-pages`, spec at `50a066e`. One PR to `main`.
- **Build before the gallery:** the gallery uses `@bit-ds/react` through its built `exports` map. Run `pnpm build` before any gallery test or typecheck.
- **Library change 1** (§1):
  - `CodeBlockProps.actions?: ReactNode`: "Extra controls in the bar, rendered between the language label and Copy."
  - A `<div class="bit-code__actions">` wraps the slot, before Copy. Nothing renders when `actions` is absent.
  - The actions and Copy are grouped on the right with `gap: var(--bit-space-8px)`.
  - Copy always copies the current `code`.
- **Library change 2** (§2): `.bit-table__cell { vertical-align: middle; }`.
- **No new tokens and no Storybook stories.** `pnpm storybook:build` must keep passing.
- **Exact strings.** Copy these verbatim:
  - **Home tagline:** "A retro-game React design system for people new to design systems. The prop you type is the class it emits is the token it reads."
  - **Home Buttons:** "Browse components →" (primary) and "See the tokens" (outline)
  - **Home steps:** "Install", "Add the styles once" and "Use a component"
  - **Install commands:** `pnpm add @bit-ds/react`, `npm install @bit-ds/react` and `yarn add @bit-ds/react`
  - **Install switcher:**
    - The default is pnpm.
    - The `localStorage` key is `bit-gallery-package-manager`.
    - The SegmentedControl is size sm, labelled "Package manager".
  - **Lazy page:** "Loading <Name>…" after 300ms
  - **Page error:** "This page didn't load. Check your connection and try again." and a primary "Reload page" Button
  - **Unknown slug:** "No component called “x”"
  - **Generic 404:** "Back to home"
  - **Tokens filter:** a Field "Filter", a Badge "N of M tokens", "No tokens match “x”." and "Clear filter"
  - **Tokens links:** "See Typography →" and "See Spacing →"
  - **Code footer:**
    - The modes are "Props | className | HTML".
    - The Switch reads "Full file".
    - The tip reads "Prefer classes? `className="bit-{v}"` works the same as `{prop}="{v}"`."
  - **Naming-rule columns:** "You write (prop) | Or write (className) | Class it emits | Token | Result"
- **History:** text and number edits are debounced 400ms and replace the history entry. Selects, switches, presets and Reset push one.
- **Phone breakpoint:** `(max-width: 720px)`, the same query the CSS uses.
- **Gallery CSS:**
  - It goes in `gallery.css`.
  - It reads only `--bit-*` tokens; `gallery-css.test.ts` checks this.
  - Class names use the `gallery-*` prefix.
- **Repeated CodeBlocks or Tables on one page:** each gets a unique `label` or `aria-label`, because they are named regions.
- **Commits:**
  - Use conventional prefixes: `feat:`, `feat(gallery):`, `fix(gallery):` and `docs:`.
  - Each commit ends with the single trailer line `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Gates:** every task ends with all of these green:

  ```bash
  pnpm build && pnpm verify && pnpm test && pnpm test:coverage && pnpm typecheck && pnpm lint && pnpm smoke && pnpm storybook:build
  ```

  - React coverage must print `100%` for Statements, Branches, Functions and Lines.
  - The threshold is 80%, so read the summary, not the exit code.
- **GateGuard:** a PreToolUse hook may block the first Write of a new file. If it does, state these facts, then retry the identical call:
  - the callers: SDD executes this plan
  - that no duplicate exists: the file is listed as "Create" in this task
  - the data shape: none
  - the quote: "okay, keep going"
- **No `rm -rf`:** a hook blocks it.
  - Use `git rm` for deletions.
  - `pnpm build` and `vite build` already start clean.
- **Not in this PR:**
  - **3b:** the ESLint raw-HTML ban, the gallery.css layout-only test, Playwright and the component follow-ups
  - **3c:** Storybook removal, CI, `snippets.mjs`, the version bump and the publish

## Review Focus

1. **Typing in a control, then leaving the page within 400ms.**
   - The pending write must not land on the next page's URL.
   - Why: `setSearchParams` navigates relative to wherever the router is by then.
   - Pinned in T2, `useControlState.test.tsx`: "leaving the page during the 400ms cancels the write, so the next page keeps its URL".
2. **Typing, then pressing Back within 400ms.**
   - The unsent word must not be written, and must not come back.
   - Pinned in T2: "Back during the 400ms drops the unsent word and never writes it".
3. **A component URL typed by hand.**
   - Examples: `/components/Button`, `/components/buton` and `/components/%3Cimg%20src%3Dx%3E`.
   - Expected: the suggestion ignores case, and the slug shows as text, never as markup.
   - Pinned in T2, in `closestManifest.test.ts` ("ignoring case") and in `routes.test.tsx` ("a slug that looks like markup is shown as text").
4. **A visitor whose storage is blocked** (Safari private mode, or cookies off).
   - The install switcher must still work for the visit, and fall back to pnpm without throwing.
   - Pinned in T6, `InstallCommand.test.tsx`: "blocked storage falls back to pnpm and the switcher still works for the visit".
5. **Keyboard and screen-reader users on Home's live tiles.**
   - Each tile must be one link, with no focusable button, radio or input inside it.
   - Pinned in T6, `HomePage.test.tsx`: axe on the whole page, and "large tiles show a live, inert preview".

---

## Parallelism and merge

**Order:**
1. T1 is already being built ahead of the plan.
2. **Wave 1:** T2, T3a and T3b run in parallel.
   - T3a's first commit (types and contract) is merged before T3b starts.
   - T3c joins them once T3a and T3b are both merged.
3. **Wave 2:** T4, T5 and T6 run in parallel.
4. T7 last.

| Wave | Task | Owns (no other task in its wave touches these) |
|---|---|---|
| pre | T1 library (built ahead of the plan) | the CodeBlock, code-block.css and table.css files and their tests, `verify-dist.mjs` (one needle), `README.md` (one bullet) |
| 1 | T2 shell | `router.tsx`, `shell/**`, `ui/**`, `content/styleImports.ts`, `engine/useControlState*`, `pages/ComponentRoute.tsx`, `pages/ComponentPage.tsx` (removing the routes), `pages/NotFoundPage.tsx`, `pages/UnknownComponentPage.tsx`, `pages/closestManifest*`, `test/matchMedia.ts`, `focusAndHistory.test.tsx`, `main.test.ts`, `routes.test.tsx`, `gallery.css`, `gallery-css.test.ts` |
| 1 | T3a docs, first half | `manifests/types.ts`, `manifests/manifests.test.ts`, and `alert`, `badge`, `bitLogo`, `box`, `button`, `card`, `code`, `codeBlock`, `field` and `heading` (`.ts`) |
| 1 | T3b docs, second half | `input`, `link`, `modeToggle`, `segmentedControl`, `select`, `spinner`, `stack`, `switch`, `table` and `text` (`.ts`) |
| 1 (join) | T3c | `manifests/types.ts`, `manifests/manifests.test.ts` |
| 2 | T4 component page | `code/**` (`toJsx.ts` included), `engine/` (all but `useControlState`), `pages/ComponentPage*`, `pages/component/**`, `routes.test.tsx`, `routes.dark.test.tsx`, `gallery-css.test.ts`, the component-page section of `gallery.css` |
| 2 | T5 tokens | `pages/TokensPage*`, `pages/tokens/**`, `packages/react/src/index.ts`, `index.test.tsx`, `verify-dist.mjs` (the export check), the tokens-page section of `gallery.css` |
| 2 | T6 home | `pages/HomePage*`, `pages/home/**`, `content/install.ts`, `content/InstallCommand*`, `env.d.ts`, `version.test.ts`, `vite.config.ts`, `vitest.config.ts`, `shell/Shell.test.tsx`, `README.md`, the home-page section of `gallery.css` |

**T3a, T3b and T3c handshake.** This plan picks the first of the controller's two options: **T3a's first commit is types and contract only.**
- **T3a, commit 1.** It completes `ManifestDocs`, and adds `PropDoc.className` and `Manifest.interactive`.
  - `Manifest.docs` stays optional for now, so every manifest without docs still typechecks.
  - It also adds the contract tests, run over `DOCUMENTED`, the manifests that have docs so far.
  - The controller merges this commit, then starts T3b on top of it.
- **T3a commit 2 and T3b run in parallel.** Neither one touches the other's files. Each half's manifests pass the contract as they land.
- **T3c runs after T3a and T3b are both merged.**
  - It makes `docs` required.
  - It runs the contract over every manifest, as one test per manifest.
  - It adds the two checks that span both halves: the empty-children list and the interactive list.

**Shared-file hotspots:**
- **`gallery.css`:**
  - **Wave 1:** T2 only. T2 ends the file with three empty markers, in this order:

    ```css
    /* ---------- component page ---------- */

    /* ---------- tokens page ---------- */

    /* ---------- home page ---------- */
    ```

  - **Wave 2:** each task inserts only directly under its own marker.
  - T4 also deletes the old "presets and matrix" section and adds one `gap` line to `.gallery-preview__bar`. Both are above the markers, and no other task touches them.
- **`routes.test.tsx`:**
  - **Wave 1:** T2 updates the 404 tests, adds the bad-values test, and scopes the sidebar test to the nav.
  - **Wave 2:** T4 alone. The `/tokens` axe smoke for T5 is the row T4 adds to `FOUNDATION_PAGES`.
- **`manifests/types.ts`:**
  - T3a's first commit, then T3c.
  - Nothing in wave 2 edits it; T4 reads `interactive`, `docs` and `PropDoc.className`.
- **`manifests/manifests.test.ts`:** T3a in both of its commits, then T3c. T3b never touches it.
- **`router.tsx`:** T2 only. No wave-2 page needs a route change, because `/tokens` and `/` already exist.
- **`shell/Shell.test.tsx`:**
  - **Wave 1:** T2 adds the skip link and sheet tests.
  - **Wave 2:** T6 deletes the two old Home tests.
- **`gallery-css.test.ts`:** T2 in wave 1, then T4 in wave 2.
- **`README.md`:**
  - T1 adds one CodeBlock bullet.
  - T6 rewrites Install and the naming table.
- **`packages/react/src/index.ts`:** T5 only. T1 no longer touches it.

**Merge rule.** Resolve any conflict in a shared list or file as the union, in plan order: T1, T2, T3a, T3b, T3c, T4, T5, T6.
- In `gallery.css`, each page's block stays under its own marker.
- In test files, keep both tasks' `it` blocks, in task order.
- After every merge, run the full gate command before starting the next wave.

**Expected test counts** (core, react, gallery; baseline 455, 403, 178):

| After | core | react | gallery | Notes |
|---|---|---|---|---|
| T1 | 457 | 408 | 178 | |
| T2 | 457 | 408 | 233 | +55 |
| T3a commit 1 | 457 | 408 | 236 | +3 |
| T3a commit 2 | 457 | 408 | 238 | +2 |
| T3b | 457 | 408 | 238 | +0: the contract tests cover its manifests |
| T3c | 457 | 408 | 297 | +59 |
| T4 | 457 | 408 | 392 | +95 |
| T5 | 457 | 409 | 401 | +1 react, +9 gallery. T5 alone on wave 1: react 409, gallery 306. |
| T6 | 457 | 409 | 417 | +16, counting the two Home tests it removes from Shell.test. T6 alone on wave 1: gallery 313. |

All gallery counts include T2. Without T2, subtract 55.

Throughout, `pnpm verify` prints `dist OK: 27 components` and `pnpm smoke` prints `consumer OK: 27 components`.

---

### Task 1: Library: CodeBlock `actions` and Table cells centred

> **Built ahead of the plan from spec §1–2; the plan text is the review reference.**
> - The controller is building T1 in a separate worktree. Review that build against the file list and the summaries below.
> - The CSS is in `code-block.css`, not `code.css`. Coverage stays at 100%.
> - `SEMANTIC_TOKENS` is not part of T1; T5 owns it.

**Files:**
- Modify: `packages/react/src/components/CodeBlock/CodeBlock.tsx` and `CodeBlock.test.tsx`
- Modify: `packages/core/src/components/code-block.css` and `packages/core/src/__tests__/components/code-block.test.ts`
- Modify: `packages/core/src/components/table.css` and `packages/core/src/__tests__/components/table.test.ts`
- Modify: `packages/react/scripts/verify-dist.mjs`, adding one CSS needle, `'.bit-code__actions'`, after `'.bit-code__copy'`
- Modify: `README.md`, adding one bullet after the CodeBlock `label` bullet:
  > `CodeBlock` takes an optional `actions` slot: extra controls in its bar, between the language label and Copy (the gallery's package-manager switcher). Copy always copies the current `code`.

**Interfaces:**
- Produces `CodeBlockProps.actions?: ReactNode`, rendered as `<div class="bit-code__actions">` between `.bit-code__lang` and `.bit-code__copy`. Nothing renders when `actions` is absent. The gallery's InstallCommand uses it.
- Produces `.bit-table__cell { vertical-align: middle; }`.

**The code:**

```diff
--- a/packages/react/src/components/CodeBlock/CodeBlock.tsx
+++ b/packages/react/src/components/CodeBlock/CodeBlock.tsx
@@ -20,6 +20,8 @@ export interface CodeBlockProps extends Omit<HTMLAttributes<HTMLDivElement>, 'ch
    * Give each CodeBlock on a page a unique label when several share a language; the code area is a named region.
    */
   label?: string;
+  /** Extra controls in the bar, rendered between the language label and Copy. */
+  actions?: ReactNode;
 }
 
 /** Plain text stays a bare string; every other token is a span the CSS colors by `data-kind`. */
@@ -32,9 +34,9 @@ function renderToken(token: CodeToken, index: number): ReactNode {
   );
 }
 
-/** A dark code panel with editor colors, a language label and a Copy button. */
+/** A dark code panel with editor colors, a language label, optional bar actions and a Copy button. */
 export const CodeBlock = forwardRef<HTMLDivElement, CodeBlockProps>(function CodeBlock(
-  { code, language, copy = true, label, className, ...rest },
+  { code, language, copy = true, label, actions, className, ...rest },
   ref,
 ) {
   const tokens = useMemo(() => tokenize(code, language), [code, language]);
@@ -42,6 +44,7 @@ export const CodeBlock = forwardRef<HTMLDivElement, CodeBlockProps>(function Cod
     <div ref={ref} className={withClassName(element('code', 'block'), className)} data-language={language} {...dropLegacyColor(rest)}>
       <div className={element('code', 'bar')}>
         <span className={element('code', 'lang')}>{language}</span>
+        {actions ? <div className={element('code', 'actions')}>{actions}</div> : null}
         {copy ? <CopyButton code={code} /> : null}
       </div>
       <pre className={element('code', 'pre')} tabIndex={0} role="region" aria-label={label || `${language} code`}>
```

```diff
--- a/packages/core/src/components/code-block.css
+++ b/packages/core/src/components/code-block.css
@@ -30,6 +30,15 @@
   color: var(--bit-code-punct);
 }
 
+/* The bar's actions slot (an install switcher, say). margin-left: auto pushes it right, so the label stays
+   left and the actions and Copy sit together on the right, 8px apart (the bar's gap). */
+.bit-code__actions {
+  display: flex;
+  align-items: center;
+  gap: var(--bit-space-8px);
+  margin-left: auto;
+}
+
 /* A small light button on the dark bar, edged in ink like the board. */
 .bit-code__copy {
   padding: var(--bit-space-4px) var(--bit-space-8px);
```

```diff
--- a/packages/core/src/components/table.css
+++ b/packages/core/src/components/table.css
@@ -17,7 +17,7 @@
 .bit-table__cell {
   padding: var(--bit-space-12px) var(--bit-space-16px);
   text-align: left;
-  vertical-align: top;
+  vertical-align: middle;
 }
 
 .bit-table__head .bit-table__cell {
```

**The tests (TDD: write them first and see them fail):**
- **React, `CodeBlock.test.tsx`** (+5 tests, before `'copy={false} shows no button and no status'`):
  - The actions render inside `.bit-code__actions`. The bar's children are, in order: `bit-code__lang`, `bit-code__actions`, `bit-code__copy`, `bit-code__status`.
  - With no actions, there is no wrapper. The bar is lang, copy, status.
  - Actions still render with `copy={false}`, as the last thing in the bar.
  - After a rerender with new `code`, Copy writes the new code.
  - A SegmentedControl ("Package manager", `legendHidden`, size sm) in the slot passes axe.
- **Core, `code-block.test.ts`** (+1 test):
  - `.bit-code__actions` declares `display: flex;`, `align-items: center;`, `gap: var(--bit-space-8px);` and `margin-left: auto;`.
  - `.bit-code__bar` keeps `gap: var(--bit-space-8px);`.
- **Core, `table.test.ts`** (+1 test): `decl(block(css, '.bit-table__cell')!, 'vertical-align')` is `'middle'`. Import `decl` from `../css`.

The exact test code, as it was run in the scratch build:

```diff
--- a/packages/react/src/components/CodeBlock/CodeBlock.test.tsx
+++ b/packages/react/src/components/CodeBlock/CodeBlock.test.tsx
@@ -4,6 +4,7 @@ import { act, fireEvent, render, screen } from '@testing-library/react';
 import { CodeBlock } from './CodeBlock';
 import { COPY_RESET_MS } from './CopyButton';
 import { CODE_LANGUAGES } from './tokenize';
+import { SegmentedControl } from '../SegmentedControl/SegmentedControl';
 import { expectNoA11yViolations } from '../../test/a11y';
 
 const JSX = `<Button color="danger">Delete</Button>`;
@@ -190,6 +191,72 @@ describe('CodeBlock', () => {
     expect(vi.getTimerCount()).toBe(0);
   });
 
+  it('actions render in the bar, wrapped in bit-code__actions, between the language label and Copy', () => {
+    const { container } = render(
+      <CodeBlock code="pnpm add @bit-ds/react" language="shell" actions={<button type="button">pnpm</button>} />,
+    );
+    const bar = container.querySelector('.bit-code__bar')!;
+    const actions = bar.querySelector('.bit-code__actions')!;
+    expect(actions.tagName).toBe('DIV');
+    expect(actions).toContainElement(screen.getByRole('button', { name: 'pnpm' }));
+    expect([...bar.children].map((child) => child.className)).toEqual([
+      'bit-code__lang',
+      'bit-code__actions',
+      'bit-code__copy',
+      'bit-code__status',
+    ]);
+  });
+
+  it('without actions, the bar renders no actions wrapper', () => {
+    const { container } = render(<CodeBlock code={JSX} language="jsx" />);
+    expect(container.querySelector('.bit-code__actions')).toBeNull();
+    expect([...container.querySelector('.bit-code__bar')!.children].map((child) => child.className)).toEqual([
+      'bit-code__lang',
+      'bit-code__copy',
+      'bit-code__status',
+    ]);
+  });
+
+  it('actions still render when copy={false}, as the last thing in the bar', () => {
+    const { container } = render(
+      <CodeBlock code="x" language="shell" copy={false} actions={<button type="button">npm</button>} />,
+    );
+    const bar = container.querySelector('.bit-code__bar')!;
+    expect(bar.lastElementChild).toHaveClass('bit-code__actions');
+    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual(['npm']);
+  });
+
+  it('Copy copies the current code prop, so a switcher that changes code changes what is copied', async () => {
+    const writeText = vi.fn(() => Promise.resolve());
+    stubClipboard(writeText);
+    const { rerender } = render(<CodeBlock code="pnpm add @bit-ds/react" language="shell" actions={<span>switcher</span>} />);
+    rerender(<CodeBlock code="npm install @bit-ds/react" language="shell" actions={<span>switcher</span>} />);
+    await click(screen.getByRole('button', { name: 'Copy' }));
+    expect(writeText).toHaveBeenCalledWith('npm install @bit-ds/react');
+  });
+
+  it('a SegmentedControl in the actions slot has no accessibility violations', async () => {
+    const { container } = render(
+      <CodeBlock
+        code="pnpm add @bit-ds/react"
+        language="shell"
+        actions={
+          <SegmentedControl
+            legend="Package manager"
+            legendHidden
+            size="sm"
+            options={[
+              { value: 'pnpm', label: 'pnpm' },
+              { value: 'npm', label: 'npm' },
+            ]}
+          />
+        }
+      />,
+    );
+    expect(screen.getByRole('group', { name: 'Package manager' })).toBeInTheDocument();
+    await expectNoA11yViolations(container);
+  });
+
   it('copy={false} shows no button and no status', () => {
     const { container } = render(<CodeBlock code="x" language="shell" copy={false} />);
     expect(screen.queryByRole('button')).toBeNull();
```

```diff
--- a/packages/core/src/__tests__/components/code-block.test.ts
+++ b/packages/core/src/__tests__/components/code-block.test.ts
@@ -34,6 +34,15 @@ describe('components/code-block.css', () => {
     expect(lang).toContain('color: var(--bit-code-punct);');
   });
 
+  it('the actions slot sits on the right with Copy, 8px apart, and leaves the label on the left', () => {
+    const actions = block(css, '.bit-code__actions')!;
+    expect(actions).not.toBeNull();
+    for (const line of ['display: flex;', 'align-items: center;', 'gap: var(--bit-space-8px);', 'margin-left: auto;']) {
+      expect(actions).toContain(line);
+    }
+    expect(block(css, '.bit-code__bar')).toContain('gap: var(--bit-space-8px);');
+  });
+
   it('the pre scrolls sideways in 13px mono at line-height 1.6, without ligatures', () => {
     const pre = block(css, '.bit-code__pre')!;
     for (const line of [
```

```diff
--- a/packages/core/src/__tests__/components/table.test.ts
+++ b/packages/core/src/__tests__/components/table.test.ts
@@ -1,5 +1,5 @@
 import { describe, it, expect } from 'vitest';
-import { block, readCss } from '../css';
+import { block, decl, readCss } from '../css';
 
 describe('components/table.css', () => {
   const css = readCss('components/table.css');
@@ -27,6 +27,10 @@ describe('components/table.css', () => {
     expect(block(css, '.bit-table__cell')).toContain('padding: var(--bit-space-12px) var(--bit-space-16px);');
   });
 
+  it('cells centre their content vertically, so a short label sits level with a tall sample', () => {
+    expect(decl(block(css, '.bit-table__cell')!, 'vertical-align')).toBe('middle');
+  });
+
   it('head cells are 11px pixel type in capitals over a 3px line rule', () => {
     const head = block(css, '.bit-table__head .bit-table__cell')!;
     expect(head).toContain('font-family: var(--bit-font-pixel);');
```

**Gates and commit:**
- Run every gate. Expect:
  - `dist OK: 27 components`
  - core `457`, react `408` and gallery `178`
  - coverage `100%` four times
  - `consumer OK: 27 components`
- Commit with `feat: CodeBlock actions slot in the bar, and Table cells centred vertically`, ending with the trailer line.

---

### Task 2: Shell fixes (spec §7) and the shared page parts

**Files** (all under `apps/gallery/src/`):
- Create:
  - **`ui/`:**
    - `scrollToSection.ts`, `InPageLink.tsx` and `useMediaQuery.ts`
    - `CopyButton.tsx`, `PageHeader.tsx`, `PageSection.tsx` and `SectionBar.tsx`
    - tests: `scrollToSection.test.tsx`, `useMediaQuery.test.tsx`, `CopyButton.test.tsx` and `SectionBar.test.tsx`
  - **`shell/`:** `PageLoading.tsx` and `PageError.tsx`, with tests
  - **`pages/`:** `ComponentRoute.tsx`, `UnknownComponentPage.tsx`, `closestManifest.ts` and `closestManifest.test.ts`
  - **Other:** `content/styleImports.ts`, `test/matchMedia.ts` and `focusAndHistory.test.tsx`
- Modify:
  - **`shell/`:** `useFocusHeading.ts` (and its test), `Shell.tsx`, `Header.tsx`, `Sidebar.tsx`, `Shell.test.tsx` and `Header.test.tsx`
  - **`engine/`:** `useControlState.ts` and its test
  - **`pages/`:** `ComponentPage.tsx` and `NotFoundPage.tsx`
  - **Other:** `router.tsx`, `routes.test.tsx`, `main.test.ts`, `gallery.css` and `gallery-css.test.ts`

**Interfaces:**
- **Consumes:**
  - From `manifests/index.ts`: `MANIFESTS`, `findManifest` and `routeFor`
  - From `engine/state.ts`: `parseState` and `serializeState`
  - From bit: `Link`, `Button`, `Heading`, `Alert`, `Spinner`, `Stack` and `Text`
- **Produces** (T4, T5 and T6 rely on these exact names):
  - **In-page links:**
    - `scrollToSection(id: string): boolean`
    - `InPageLink({ targetId, ...LinkProps })`
  - **Page parts:**
    - `PageHeader({ eyebrow: string; title: string; children?: ReactNode })`
    - `PageSection({ id, title, children })`
    - `interface SectionLink { id: string; title: string }`
    - `SectionBar({ sections: readonly SectionLink[] })`, which renders `nav[aria-label="On this page"]`
  - **Copy:** `CopyButton({ text: string; label: string })` and `COPY_RESET_MS = 2000`
  - **Breakpoint:** `useMediaQuery(query: string): boolean` and `NARROW_QUERY = '(max-width: 720px)'`
  - **Style imports:** `STYLE_IMPORTS` (`content/styleImports.ts`): the two imports, theme first, joined by `\n`
  - **Test helper:** `stubMatchMedia(query: string): () => void` (`test/matchMedia.ts`)
  - **URL state:** `TYPING_DEBOUNCE_MS = 400`. `useControlState` keeps its `ControlStateApi` shape.
  - **Loading and errors:**
    - `PageLoading({ name })`, `ComponentLoading()` and `LOADING_DELAY_MS = 300`
    - `PageError({ onReload? })`
  - **Routes and the 404:**
    - `ComponentRoute` and `LogoRoute`, now in `pages/ComponentRoute.tsx`
    - `UnknownComponentPage({ slug })`
    - `closestManifest(slug, manifests?)`, `editDistance(a, b)` and `MAX_SUGGESTION_DISTANCE = 3`
  - **Header and sidebar:**
    - `GitHubLink()`
    - `Header` takes `narrow` and forwards a ref to the Menu button.
    - `Sidebar` takes `footer?: ReactNode`.
  - **CSS:**
    - the classes `.gallery-eyebrow`, `.gallery-section-bar`, `.gallery-link-list`, `.gallery-visually-hidden` and `.gallery-sidebar__footer`
    - the three section markers

- [ ] **Step 1: Write the failing tests for the shared parts**

Create `apps/gallery/src/test/matchMedia.ts`:

```ts
/**
 * jsdom has no matchMedia. Install one where only `query` matches (every other query, such as the color
 * mode's prefers-color-scheme, stays false), and return a function that removes it again.
 */
export function stubMatchMedia(query: string): () => void {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (asked: string) => ({
      matches: asked === query,
      media: asked,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
  return () => {
    Reflect.deleteProperty(window, 'matchMedia');
  };
}
```

Create `apps/gallery/src/ui/scrollToSection.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { scrollToSection } from './scrollToSection';
import { InPageLink } from './InPageLink';

afterEach(() => {
  Reflect.deleteProperty(Element.prototype, 'scrollIntoView');
});

describe('scrollToSection', () => {
  it('scrolls the target into view, makes it focusable with tabIndex -1, and focuses it', () => {
    const scrollIntoView = vi.fn();
    Object.defineProperty(Element.prototype, 'scrollIntoView', { value: scrollIntoView, configurable: true });
    render(<h2 id="usage">Usage</h2>);
    expect(scrollToSection('usage')).toBe(true);
    const heading = screen.getByRole('heading', { name: 'Usage' });
    expect(heading).toHaveAttribute('tabindex', '-1');
    expect(document.activeElement).toBe(heading);
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start' });
  });

  it('keeps a tabindex the target already has', () => {
    render(<main id="main" tabIndex={0} />);
    scrollToSection('main');
    expect(document.getElementById('main')).toHaveAttribute('tabindex', '0');
  });

  it('returns false and moves nothing when no element has the id', () => {
    expect(scrollToSection('missing')).toBe(false);
    expect(document.activeElement).toBe(document.body);
  });
});

describe('InPageLink', () => {
  it('is a bit Link to #id that focuses the target and does not follow the href', async () => {
    render(
      <>
        <InPageLink targetId="props">Props</InPageLink>
        <h2 id="props">Props table</h2>
      </>,
    );
    const link = screen.getByRole('link', { name: 'Props' });
    expect(link).toHaveAttribute('href', '#props');
    expect(link).toHaveClass('bit-link');
    const before = window.location.href;
    await userEvent.click(link);
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Props table' }));
    expect(window.location.href).toBe(before);
  });
});
```

Create `apps/gallery/src/ui/useMediaQuery.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { afterEach, describe, it, expect } from 'vitest';
import { NARROW_QUERY, useMediaQuery } from './useMediaQuery';
import { stubMatchMedia } from '../test/matchMedia';

function Probe() {
  return <p>{useMediaQuery(NARROW_QUERY) ? 'narrow' : 'wide'}</p>;
}

let restore: (() => void) | undefined;
afterEach(() => restore?.());

describe('useMediaQuery', () => {
  it('is the phone breakpoint the CSS uses', () => {
    expect(NARROW_QUERY).toBe('(max-width: 720px)');
  });

  it('is false without matchMedia (jsdom), so tests get the desktop layout', () => {
    render(<Probe />);
    expect(screen.getByText('wide')).toBeInTheDocument();
  });

  it('is true while the query matches', () => {
    restore = stubMatchMedia(NARROW_QUERY);
    render(<Probe />);
    expect(screen.getByText('narrow')).toBeInTheDocument();
  });
});
```

Create `apps/gallery/src/ui/CopyButton.test.tsx`:

```tsx
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { COPY_RESET_MS, CopyButton } from './CopyButton';
import { expectNoA11yViolations } from '../test/a11y';

function stubClipboard(writeText: ((text: string) => Promise<void>) | undefined): void {
  Object.defineProperty(navigator, 'clipboard', { value: writeText ? { writeText } : undefined, configurable: true });
}

async function click(element: HTMLElement): Promise<void> {
  await act(async () => {
    fireEvent.click(element);
  });
}

afterEach(() => {
  Reflect.deleteProperty(navigator, 'clipboard');
  vi.useRealTimers();
});

describe('CopyButton', () => {
  it('reads "Copy", is named by its label, and has no accessibility violations', async () => {
    const { container } = render(<CopyButton text="var(--bit-color-bg)" label="Copy --bit-color-bg" />);
    const button = screen.getByRole('button', { name: 'Copy --bit-color-bg' });
    expect(button).toHaveTextContent('Copy');
    expect(button).toHaveClass('bit-button', 'bit-sm', 'bit-outline', 'bit-neutral');
    await expectNoA11yViolations(container);
  });

  it('copies its text, shows and announces "Copied", then reads "Copy" again after 2000ms', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn(() => Promise.resolve());
    stubClipboard(writeText);
    render(<CopyButton text="import { Button } from '@bit-ds/react';" label="Copy import line" />);
    await click(screen.getByRole('button'));
    expect(writeText).toHaveBeenCalledWith("import { Button } from '@bit-ds/react';");
    expect(screen.getByRole('button')).toHaveTextContent('Copied');
    expect(screen.getByRole('status')).toHaveTextContent('Copied');
    act(() => vi.advanceTimersByTime(COPY_RESET_MS));
    expect(screen.getByRole('button', { name: 'Copy import line' })).toHaveTextContent('Copy');
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('a blocked or missing clipboard shows "Copy failed" in danger, without throwing', async () => {
    stubClipboard(undefined);
    render(<CopyButton text="x" label="Copy x" />);
    await click(screen.getByRole('button'));
    expect(screen.getByRole('button')).toHaveTextContent('Copy failed');
    expect(screen.getByRole('button')).toHaveClass('bit-danger');
  });

  it('unmounting while the clipboard is busy starts no timer', async () => {
    vi.useFakeTimers();
    let finish: () => void = () => {};
    stubClipboard(() => new Promise<void>((resolve) => (finish = resolve)));
    const { unmount } = render(<CopyButton text="x" label="Copy x" />);
    fireEvent.click(screen.getByRole('button'));
    unmount();
    await act(async () => finish());
    expect(vi.getTimerCount()).toBe(0);
  });
});
```

Create `apps/gallery/src/ui/SectionBar.test.tsx`:

```tsx
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { SectionBar } from './SectionBar';
import { PageSection } from './PageSection';
import { PageHeader } from './PageHeader';
import { expectNoA11yViolations } from '../test/a11y';

const SECTIONS = [
  { id: 'section-one', title: 'One' },
  { id: 'section-two', title: 'Two' },
];

function Page() {
  return (
    <>
      <PageHeader eyebrow="Foundations" title="Sample" />
      <SectionBar sections={SECTIONS} />
      {SECTIONS.map((section) => (
        <PageSection key={section.id} {...section}>
          <p>{section.title} body</p>
        </PageSection>
      ))}
    </>
  );
}

describe('PageHeader, SectionBar and PageSection', () => {
  it('the header is an eyebrow in pixel type, then the h1', () => {
    render(<PageHeader eyebrow="Components" title="Button" />);
    expect(screen.getByText('Components')).toHaveClass('gallery-eyebrow', 'bit-text');
    expect(screen.getByRole('heading', { level: 1, name: 'Button' })).toBeInTheDocument();
  });

  it('a section is a region named by its h2, which can take focus', () => {
    render(<Page />);
    const region = screen.getByRole('region', { name: 'Two' });
    expect(within(region).getByRole('heading', { level: 2, name: 'Two' })).toHaveAttribute('tabindex', '-1');
  });

  it('each link focuses its h2 and leaves the route and query alone', async () => {
    const router = createMemoryRouter([{ path: '/page', element: <Page /> }], { initialEntries: ['/page?x=1'] });
    const { container } = render(<RouterProvider router={router} />);
    const bar = screen.getByRole('navigation', { name: 'On this page' });
    await userEvent.click(within(bar).getByRole('link', { name: 'Two' }));
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 2, name: 'Two' }));
    expect(router.state.location.pathname).toBe('/page');
    expect(router.state.location.search).toBe('?x=1');
    await expectNoA11yViolations(container);
  });
});
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `pnpm build && pnpm --filter @bit-ds/gallery test -- src/ui`
Expected: FAIL. Every file fails to resolve its import: `./scrollToSection`, `./useMediaQuery`, `./CopyButton` and `./SectionBar`.

- [ ] **Step 3: Write the shared parts**

Create `apps/gallery/src/ui/scrollToSection.ts`:

```ts
/**
 * Scroll an element on this page into view and move focus to it, leaving the URL alone. Under the hash
 * router an `href="#id"` would become the route `/id`, so the skip link and the section bars call this
 * instead of following their href. A target that isn't focusable gets `tabIndex = -1`, which lets it take
 * focus without joining the Tab order. Returns false when no element has that id.
 */
export function scrollToSection(id: string): boolean {
  const target = document.getElementById(id);
  if (!target) return false;
  if (!target.hasAttribute('tabindex')) target.tabIndex = -1;
  // jsdom has no scrollIntoView; browsers all do.
  target.scrollIntoView?.({ block: 'start' });
  target.focus({ preventScroll: true });
  return true;
}
```

Create `apps/gallery/src/ui/InPageLink.tsx`:

```tsx
import { Link } from '@bit-ds/react';
import type { LinkProps } from '@bit-ds/react';
import { scrollToSection } from './scrollToSection';

export interface InPageLinkProps extends Omit<LinkProps, 'href' | 'onClick' | 'asChild'> {
  /** The id of the element on this page to scroll to and focus. */
  targetId: string;
}

/**
 * A bit Link to a spot on the current page. It scrolls there and moves focus, and never changes the
 * route. The href stays `#id` so the link still reads as a link and shows where it goes.
 */
export function InPageLink({ targetId, ...rest }: InPageLinkProps) {
  return (
    <Link
      {...rest}
      href={`#${targetId}`}
      onClick={(event) => {
        event.preventDefault();
        scrollToSection(targetId);
      }}
    />
  );
}
```

Create `apps/gallery/src/ui/useMediaQuery.ts`:

```ts
import { useCallback, useSyncExternalStore } from 'react';

/** The gallery's one breakpoint: the phone layout, matching `@media (max-width: 720px)` in gallery.css. */
export const NARROW_QUERY = '(max-width: 720px)';

function mediaList(query: string): MediaQueryList | null {
  return typeof window.matchMedia === 'function' ? window.matchMedia(query) : null;
}

/** True while the media query matches. False where matchMedia doesn't exist (jsdom, old browsers). */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = mediaList(query);
      list?.addEventListener('change', onChange);
      return () => list?.removeEventListener('change', onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => mediaList(query)?.matches ?? false,
    () => false,
  );
}
```

Create `apps/gallery/src/ui/CopyButton.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react';
import { Button } from '@bit-ds/react';

type CopyState = 'idle' | 'copied' | 'failed';

const LABELS: Record<CopyState, string> = { idle: 'Copy', copied: 'Copied', failed: 'Copy failed' };

/** How long "Copied" or "Copy failed" shows before the button reads "Copy" again. Same as CodeBlock's. */
export const COPY_RESET_MS = 2000;

export interface CopyButtonProps {
  /** Exactly what lands on the clipboard. */
  text: string;
  /**
   * The button's accessible name while idle, e.g. "Copy import line". Start it with "Copy" so the visible
   * word stays in the name (WCAG 2.5.3). Pages with many Copy buttons need it to tell them apart.
   */
  label: string;
}

/** True when the text reached the clipboard. A missing or refusing clipboard is false, never a throw. */
async function writeClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * A small Copy button for gallery chips and table rows (CodeBlock has its own). "Copied" or "Copy failed"
 * shows for two seconds, and a visually hidden status line announces it.
 */
export function CopyButton({ text, label }: CopyButtonProps) {
  const [state, setState] = useState<CopyState>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(timer.current);
    };
  }, []);

  async function copy() {
    const ok = await writeClipboard(text);
    if (!mounted.current) return;
    clearTimeout(timer.current);
    setState(ok ? 'copied' : 'failed');
    timer.current = setTimeout(() => setState('idle'), COPY_RESET_MS);
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        color={state === 'failed' ? 'danger' : 'neutral'}
        aria-label={state === 'idle' ? label : undefined}
        onClick={() => void copy()}
      >
        {LABELS[state]}
      </Button>
      <span className="gallery-visually-hidden" role="status">
        {state === 'idle' ? '' : LABELS[state]}
      </span>
    </>
  );
}
```

Create `apps/gallery/src/ui/PageHeader.tsx`:

```tsx
import type { ReactNode } from 'react';
import { Heading, Stack, Text } from '@bit-ds/react';

interface PageHeaderProps {
  /** The small pixel-type line above the title: the sidebar group the page sits in. */
  eyebrow: string;
  /** The page's h1. */
  title: string;
  /** What follows the title: the intro line, and on component pages the import chip and badges. */
  children?: ReactNode;
}

/** The top of a gallery page: eyebrow, h1, then whatever introduces the page. */
export function PageHeader({ eyebrow, title, children }: PageHeaderProps) {
  return (
    <Stack gap={8} align="start">
      <Text as="p" size={11} className="gallery-eyebrow">
        {eyebrow}
      </Text>
      <Heading level={1}>{title}</Heading>
      {children}
    </Stack>
  );
}
```

Create `apps/gallery/src/ui/PageSection.tsx`:

```tsx
import type { ReactNode } from 'react';
import { Heading, Stack } from '@bit-ds/react';

export interface SectionLink {
  /** The h2's id: what a section-bar link scrolls to and focuses. */
  id: string;
  /** The h2's text, and the section-bar link's text. */
  title: string;
}

interface PageSectionProps extends SectionLink {
  children: ReactNode;
}

/** A page section named by its h2. The h2 takes tabIndex -1, so a section bar can move focus to it. */
export function PageSection({ id, title, children }: PageSectionProps) {
  return (
    <section aria-labelledby={id}>
      <Stack gap={12}>
        <Heading level={2} id={id} tabIndex={-1}>
          {title}
        </Heading>
        {children}
      </Stack>
    </section>
  );
}
```

Create `apps/gallery/src/ui/SectionBar.tsx`:

```tsx
import { InPageLink } from './InPageLink';
import type { SectionLink } from './PageSection';

interface SectionBarProps {
  sections: readonly SectionLink[];
}

/**
 * The row of in-page links under a page's header (Playground, Variants, …; Color, Type, …). Each one
 * scrolls to its section and focuses the h2, and the route never changes.
 */
export function SectionBar({ sections }: SectionBarProps) {
  return (
    <nav aria-label="On this page" className="gallery-section-bar">
      <ul className="gallery-link-list">
        {sections.map((section) => (
          <li key={section.id}>
            <InPageLink targetId={section.id}>{section.title}</InPageLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

Create `apps/gallery/src/content/styleImports.ts`:

```ts
/**
 * The two stylesheet imports every app adds once, theme first: the theme's Google Fonts `@import` must stay
 * at the top when a bundler joins the CSS. The gallery's own entry (main.tsx), the component pages' full
 * file and Home's "Add the styles once" step all use exactly this text.
 */
export const STYLE_IMPORTS = "import '@bit-ds/react/themes/power-up.css';\nimport '@bit-ds/react/styles.css';";
```

Run: `pnpm --filter @bit-ds/gallery test -- src/ui`
Expected: PASS, 14 tests in 4 files.

- [ ] **Step 4: Write the failing focus and history tests**

Replace `apps/gallery/src/engine/useControlState.test.tsx` with:

```tsx
import { render, act, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { TYPING_DEBOUNCE_MS, useControlState } from './useControlState';
import type { ControlStateApi } from './useControlState';
import { button } from '../manifests/button';
import { numberControlFixture } from '../test/fixtures';

let api: ControlStateApi | undefined;

/** Renders inside the router and hands the hook's API to the test through a module variable. */
function Probe() {
  api = useControlState(button);
  return <span data-testid="color">{String(api.state.color)}</span>;
}

function NumberProbe() {
  api = useControlState(numberControlFixture);
  return null;
}

function setup(initial: string) {
  const router = createMemoryRouter(
    [
      { path: '/x', element: <Probe /> },
      { path: '/n', element: <NumberProbe /> },
      { path: '/elsewhere', element: <p>elsewhere</p> },
    ],
    { initialEntries: [initial] },
  );
  const utils = render(<RouterProvider router={router} />);
  return { router, ...utils };
}

/** Let the debounce run out (fake timers) and React and the router settle. */
async function wait(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
}

afterEach(() => {
  vi.useRealTimers();
});

describe('useControlState', () => {
  it('reads the initial state from the query', () => {
    setup('/x?color=danger');
    expect(api?.state.color).toBe('danger');
  });

  it('a shared link with bad values shows the defaults and is rewritten in place, keeping the good ones', async () => {
    const { router } = setup('/x?color=purple&size=lg&utm=mail');
    expect(api?.state).toMatchObject({ color: 'primary', size: 'lg' });
    await waitFor(() => expect(router.state.location.search).toBe('?size=lg'));
    expect(router.state.historyAction).toBe('REPLACE');
  });

  it('a clean URL is left alone', () => {
    const { router } = setup('/x?color=danger');
    expect(router.state.location.search).toBe('?color=danger');
    expect(router.state.historyAction).toBe('POP');
  });

  it('setProp writes the query and pushes history so Back undoes it', () => {
    const { router } = setup('/x');
    act(() => api?.setProp('variant', 'outline'));
    expect(router.state.location.search).toBe('?variant=outline');
    act(() => api?.setProp('loading', true));
    expect(router.state.location.search).toBe('?variant=outline&loading=1');
    expect(api?.state).toMatchObject({ variant: 'outline', loading: true });
  });

  it('apply merges several props and reset clears the query', () => {
    const { router } = setup('/x?size=lg');
    act(() => api?.apply({ color: 'danger', variant: 'outline' }));
    expect(router.state.location.search).toBe('?color=danger&variant=outline&size=lg');
    act(() => api?.reset());
    expect(router.state.location.search).toBe('');
    expect(api?.state.size).toBe('md');
  });

  it('a select, a preset and Reset each push: Back steps through them one at a time', async () => {
    const { router } = setup('/x');
    act(() => api?.setProp('color', 'danger'));
    act(() => api?.apply({ variant: 'ghost', size: 'sm' }));
    act(() => api?.reset());
    expect(router.state.historyAction).toBe('PUSH');
    await act(() => router.navigate(-1));
    expect(router.state.location.search).toBe('?color=danger&variant=ghost&size=sm');
    await act(() => router.navigate(-1));
    expect(router.state.location.search).toBe('?color=danger');
    await act(() => router.navigate(-1));
    expect(router.state.location.search).toBe('');
    expect(api?.state.color).toBe('primary');
  });

  it('typing shows at once and reaches the URL 400ms after the last keystroke, as a replace', async () => {
    vi.useFakeTimers();
    const { router } = setup('/x');
    act(() => api?.setProp('children', 'G'));
    await wait(TYPING_DEBOUNCE_MS - 100);
    act(() => api?.setProp('children', 'Go'));
    expect(api?.state.children).toBe('Go');
    await wait(TYPING_DEBOUNCE_MS - 1);
    expect(router.state.location.search).toBe('');
    await wait(1);
    expect(router.state.location.search).toBe('?children=Go');
    expect(router.state.historyAction).toBe('REPLACE');
    expect(api?.state.children).toBe('Go');
  });

  it('a word typed after a select replaces the select entry, so one Back undoes both', async () => {
    vi.useFakeTimers();
    const { router } = setup('/x');
    act(() => api?.setProp('color', 'danger'));
    act(() => api?.setProp('children', 'Go'));
    await wait(TYPING_DEBOUNCE_MS);
    expect(router.state.location.search).toBe('?color=danger&children=Go');
    await act(() => router.navigate(-1));
    expect(router.state.location.search).toBe('');
  });

  it('number edits are typed too: debounced and replaced', async () => {
    vi.useFakeTimers();
    const { router } = setup('/n');
    act(() => api?.setProp('interval', '7'));
    expect(api?.state.interval).toBe('7');
    expect(router.state.location.search).toBe('');
    await wait(TYPING_DEBOUNCE_MS);
    expect(router.state.location.search).toBe('?interval=7');
    expect(router.state.historyAction).toBe('REPLACE');
  });

  it('a select while a word is pending pushes both at once and cancels the pending replace', async () => {
    vi.useFakeTimers();
    const { router } = setup('/x');
    act(() => api?.setProp('children', 'Go'));
    act(() => api?.setProp('color', 'danger'));
    expect(router.state.location.search).toBe('?color=danger&children=Go');
    expect(router.state.historyAction).toBe('PUSH');
    await wait(TYPING_DEBOUNCE_MS);
    expect(router.state.historyAction).toBe('PUSH');
  });

  it('Back during the 400ms drops the unsent word and never writes it', async () => {
    vi.useFakeTimers();
    const { router } = setup('/x');
    act(() => api?.setProp('color', 'danger'));
    act(() => api?.setProp('children', 'Go'));
    await act(() => router.navigate(-1));
    await wait(TYPING_DEBOUNCE_MS);
    expect(router.state.location.search).toBe('');
    expect(api?.state.children).toBe('Save');
  });

  it('leaving the page during the 400ms cancels the write, so the next page keeps its URL', async () => {
    vi.useFakeTimers();
    const { router } = setup('/x');
    act(() => api?.setProp('children', 'Go'));
    await act(() => router.navigate('/elsewhere'));
    await wait(TYPING_DEBOUNCE_MS);
    expect(router.state.location.pathname).toBe('/elsewhere');
    expect(router.state.location.search).toBe('');
  });
});
```

Append two tests to `apps/gallery/src/shell/useFocusHeading.test.tsx`:

```diff
--- a/apps/gallery/src/shell/useFocusHeading.test.tsx
+++ b/apps/gallery/src/shell/useFocusHeading.test.tsx
@@ -41,4 +41,39 @@ describe('useFocusHeading', () => {
     await act(() => router.navigate('/samples'));
     await waitFor(() => expect(document.activeElement).toBe(getByText('Real title')));
   });
+
+  it('a query-only change (a control on a component page) keeps focus where it is', async () => {
+    const router = createMemoryRouter(
+      [{ element: <Layout />, children: [{ path: '/page', element: <h1>Page</h1> }] }],
+      { initialEntries: ['/page'] },
+    );
+    render(<RouterProvider router={router} />);
+    const input = document.createElement('input');
+    document.body.append(input);
+    input.focus();
+    await act(() => router.navigate('/page?color=danger'));
+    await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
+    expect(document.activeElement).toBe(input);
+    input.remove();
+  });
+
+  it('coming back to the first page is a page change too, so its heading takes focus', async () => {
+    const router = createMemoryRouter(
+      [
+        {
+          element: <Layout />,
+          children: [
+            { path: '/', element: <h1>Home</h1> },
+            { path: '/other', element: <h1>Other</h1> },
+          ],
+        },
+      ],
+      { initialEntries: ['/'] },
+    );
+    const { getByText } = render(<RouterProvider router={router} />);
+    await act(() => router.navigate('/other'));
+    await waitFor(() => expect(document.activeElement).toBe(getByText('Other')));
+    await act(() => router.navigate('/'));
+    await waitFor(() => expect(document.activeElement).toBe(getByText('Home')));
+  });
 });
```

Create `apps/gallery/src/focusAndHistory.test.tsx`. It holds the spec's page-level checks: a keystroke keeps focus, and Back undoes a select.

```tsx
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { renderAt } from './test/renderRoute';

/** Plan §H.1 on a real component page: controls keep focus, and Back undoes a discrete change. */
describe('component page focus and history', () => {
  it('a keystroke keeps focus in the field, and the word reaches the URL as one replace', async () => {
    const { router } = renderAt('/components/button');
    await screen.findByRole('heading', { level: 1, name: 'Button' });
    const field = screen.getByLabelText('children');
    await userEvent.clear(field);
    await userEvent.type(field, 'Go');
    expect(document.activeElement).toBe(field);
    expect(within(screen.getByRole('region', { name: 'Button preview' })).getByRole('button', { name: 'Go' })).toHaveClass('bit-button');
    await waitFor(() => expect(router.state.location.search).toBe('?children=Go'));
    expect(router.state.historyAction).toBe('REPLACE');
    expect(document.activeElement).toBe(field);
  });

  it('a select keeps focus on the select, and Back undoes it', async () => {
    const { router } = renderAt('/components/button');
    await screen.findByRole('heading', { level: 1, name: 'Button' });
    const color = screen.getByLabelText('color');
    await userEvent.selectOptions(color, 'danger');
    expect(document.activeElement).toBe(color);
    expect(router.state.location.search).toBe('?color=danger');
    expect(router.state.historyAction).toBe('PUSH');
    await act(() => router.navigate(-1));
    expect(router.state.location.search).toBe('');
    expect(screen.getByLabelText('color')).toHaveValue('primary');
  });
});
```

- [ ] **Step 5: Run them and confirm they fail**

Run: `pnpm --filter @bit-ds/gallery test -- useControlState useFocusHeading focusAndHistory`
Expected: FAIL. Replayed against the old code:
- **useControlState:** four tests fail:
  - "typing shows at once…"
  - "a word typed after a select…"
  - "number edits…"
  - "Back during the 400ms…"
- **The bad-values test** sees `'?color=purple&size=lg&utm=mail'`.
- **useFocusHeading:** "a query-only change … keeps focus where it is" fails, because focus jumps to the h1.
- **focusAndHistory:** "a keystroke keeps focus" fails, because each keystroke pushes and steals focus.

- [ ] **Step 6: Key focus on the pathname; push and replace history; rewrite bad values**

Replace `apps/gallery/src/shell/useFocusHeading.ts` with:

```ts
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/** The page's own h1, skipping presentational samples such as the Typography page's heading table. */
const PAGE_HEADING = 'main h1:not([role="presentation"]):not([role="none"])';

/**
 * When the page changes (a new pathname, not the first load), move focus to the page's h1 so screen
 * readers announce the new page. A query-only change (a control on a component page) is the same page,
 * so focus stays where the visitor is typing. Pages are lazy, so the h1 may not exist yet: poll one
 * animation frame at a time until it does, and stop if the page changes again. The last pathname lives
 * in a ref compared by value, so StrictMode's double-invoked mount effect can't count as a change.
 */
export function useFocusHeading(): void {
  const { pathname } = useLocation();
  const shown = useRef(pathname);
  useEffect(() => {
    if (pathname === shown.current) return;
    shown.current = pathname;
    let cancelled = false;
    const tryFocus = () => {
      if (cancelled) return;
      const heading = document.querySelector<HTMLHeadingElement>(PAGE_HEADING);
      if (!heading) {
        requestAnimationFrame(tryFocus);
        return;
      }
      heading.tabIndex = -1;
      heading.focus();
    };
    tryFocus();
    return () => {
      cancelled = true;
    };
  }, [pathname]);
}
```

Replace `apps/gallery/src/engine/useControlState.ts` with:

```ts
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ControlState, ControlValue, Manifest } from '../manifests/types';
import { parseState, serializeState } from './state';

/** A text or number edit reaches the URL this long after the last keystroke. */
export const TYPING_DEBOUNCE_MS = 400;

export interface ControlStateApi {
  state: ControlState;
  setProp: (prop: string, value: ControlValue) => void;
  apply: (partial: Partial<ControlState>) => void;
  reset: () => void;
}

/** Text and number controls (and the children text) are typed, one keystroke at a time. */
function isTyped(manifest: Manifest, prop: string): boolean {
  if (prop === 'children') return typeof manifest.children === 'string';
  const kind = manifest.controls.find((control) => control.prop === prop)?.kind;
  return kind === 'text' || kind === 'number';
}

/** An edit not yet in the URL, and the query it was typed on top of. */
interface Draft {
  query: string;
  state: ControlState;
}

/**
 * Page state lives in the query string, so every state is a link.
 * - Selects, switches, presets and Reset push a history entry, so Back undoes them.
 * - Typing shows at once but replaces the current entry 400ms after the last keystroke, so Back skips
 *   the keystrokes and a word is one step, not five.
 * A draft only counts while the URL still holds the query it was typed on. Back, Forward or a push moves
 * the URL, which drops the draft and cancels its timer; so does leaving the page.
 * A URL with invalid or unknown values is rewritten to the values shown, with replace (§E).
 */
export function useControlState(manifest: Manifest): ControlStateApi {
  const [search, setSearch] = useSearchParams();
  const query = search.toString();
  const parsed = useMemo(() => parseState(manifest, search), [manifest, search]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const state = draft !== null && draft.query === query ? draft.state : parsed;

  useEffect(() => {
    setDraft((current) => (current !== null && current.query !== query ? null : current));
    return () => clearTimeout(timer.current);
  }, [query]);

  // A shared link with bad or unknown values shows the defaults; rewrite its URL to match, in place.
  const canonical = useMemo(() => serializeState(manifest, parsed).toString(), [manifest, parsed]);
  useEffect(() => {
    if (canonical !== query) setSearch(new URLSearchParams(canonical), { replace: true });
  }, [canonical, query, setSearch]);

  const push = useCallback(
    (next: ControlState) => {
      clearTimeout(timer.current);
      setDraft(null);
      setSearch(serializeState(manifest, next));
    },
    [manifest, setSearch],
  );

  const apply = useCallback(
    (partial: Partial<ControlState>) => {
      const next: ControlState = { ...state };
      for (const [key, value] of Object.entries(partial)) if (value !== undefined) next[key] = value;
      push(next);
    },
    [state, push],
  );

  const setProp = useCallback(
    (prop: string, value: ControlValue) => {
      const next: ControlState = { ...state, [prop]: value };
      if (!isTyped(manifest, prop)) {
        push(next);
        return;
      }
      setDraft({ query, state: next });
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setSearch(serializeState(manifest, next), { replace: true }), TYPING_DEBOUNCE_MS);
    },
    [manifest, query, state, push, setSearch],
  );

  const reset = useCallback(() => push(parseState(manifest, new URLSearchParams())), [manifest, push]);

  return { state, setProp, apply, reset };
}
```

Run: `pnpm --filter @bit-ds/gallery test -- useControlState useFocusHeading focusAndHistory`
Expected: PASS.

- [ ] **Step 7: Write the failing tests for loading, errors, the 404 and the closest name**

Create `apps/gallery/src/pages/closestManifest.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { closestManifest, editDistance } from './closestManifest';

describe('editDistance', () => {
  it.each([
    ['button', 'button', 0],
    ['buton', 'button', 1],
    ['butto', 'button', 1],
    ['bootn', 'button', 3],
    ['', 'box', 3],
    ['nope', 'code', 2],
    ['co', 'box', 2],
  ])('%s → %s is %i', (a, b, distance) => {
    expect(editDistance(a, b)).toBe(distance);
  });
});

describe('closestManifest', () => {
  it('suggests the nearest slug, ignoring case', () => {
    expect(closestManifest('buton')?.name).toBe('Button');
    expect(closestManifest('Button')?.name).toBe('Button');
    expect(closestManifest('segmentedcontrl')?.name).toBe('SegmentedControl');
  });

  it('suggests the logo for /components/logo, which lives under Brand', () => {
    expect(closestManifest('logo')?.name).toBe('BitLogo');
  });

  it('suggests nothing past three edits', () => {
    expect(closestManifest('accordion')).toBeUndefined();
    expect(closestManifest('zzzzzzzz')).toBeUndefined();
  });

  it('breaks a tie by sidebar order: "co" is 2 from both box and code, and Box comes first', () => {
    expect(closestManifest('co')?.name).toBe('Box');
  });
});
```

Create `apps/gallery/src/shell/PageLoading.test.tsx`:

```tsx
import { act, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { ComponentLoading, LOADING_DELAY_MS, PageLoading } from './PageLoading';

afterEach(() => {
  vi.useRealTimers();
});

describe('PageLoading', () => {
  it('shows nothing for the first 300ms, then a Spinner and "Loading <Name>…"', () => {
    vi.useFakeTimers();
    const { container } = render(<PageLoading name="Tokens" />);
    act(() => vi.advanceTimersByTime(LOADING_DELAY_MS - 1));
    expect(container).toBeEmptyDOMElement();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByRole('status', { name: 'Loading Tokens…' })).toHaveClass('bit-spinner');
    expect(screen.getByText('Loading Tokens…')).toHaveAttribute('aria-hidden', 'true');
  });

  it('a page that arrives in time never shows it, and leaves no timer behind', () => {
    vi.useFakeTimers();
    const { unmount } = render(<PageLoading name="Tokens" />);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('on a component route it names the component, or says "component" for an unknown slug', () => {
    vi.useFakeTimers();
    for (const [path, label] of [
      ['/components/button', 'Loading Button…'],
      ['/components/nope', 'Loading component…'],
    ] as const) {
      const router = createMemoryRouter([{ path: '/components/:slug', element: <ComponentLoading /> }], {
        initialEntries: [path],
      });
      const { unmount } = render(<RouterProvider router={router} />);
      act(() => vi.advanceTimersByTime(LOADING_DELAY_MS));
      expect(screen.getByRole('status', { name: label })).toBeInTheDocument();
      unmount();
    }
  });
});
```

Create `apps/gallery/src/shell/PageError.test.tsx`:

```tsx
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { PageError } from './PageError';
import { Shell } from './Shell';
import { buildRoutes } from '../router';
import { expectNoA11yViolations } from '../test/a11y';

function Broken(): never {
  throw new Error('chunk failed to load');
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('PageError', () => {
  it('a page that throws shows the danger Alert and Reload inside the shell, header and sidebar intact', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const onReload = vi.fn();
    const router = createMemoryRouter(
      [{ element: <Shell />, children: [{ errorElement: <PageError onReload={onReload} />, children: [{ index: true, element: <Broken /> }] }] }],
      { initialEntries: ['/'] },
    );
    const { container } = render(<RouterProvider router={router} />);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveClass('bit-alert', 'bit-danger');
    expect(alert).toHaveTextContent("This page didn't load. Check your connection and try again.");
    expect(screen.getByRole('heading', { level: 1, name: 'Something went wrong' })).toBeInTheDocument();
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(within(screen.getByRole('navigation', { name: 'Gallery' })).getByRole('link', { name: 'Tokens' })).toBeInTheDocument();
    const reload = screen.getByRole('button', { name: 'Reload page' });
    expect(reload).toHaveClass('bit-primary', 'bit-solid');
    await userEvent.click(reload);
    expect(onReload).toHaveBeenCalledTimes(1);
    await expectNoA11yViolations(container);
  });

  it('the real route table catches page errors one level under the shell', () => {
    const [shell] = buildRoutes();
    const [pages] = shell!.children!;
    expect(pages!.path).toBeUndefined();
    expect((pages!.errorElement as { type: unknown }).type).toBe(PageError);
    expect(pages!.children!.map((route) => (route.index ? '(index)' : route.path))).toEqual([
      '(index)',
      'tokens',
      'typography',
      'spacing',
      'components/:slug',
      'brand/logo',
      '*',
    ]);
  });
});
```

In `apps/gallery/src/routes.test.tsx`:
- Replace the old 404 test with the unknown-slug tests.
- Add the bad-values test.
- Name the preview Button, so T4's preset buttons in the same region don't make it ambiguous.
- Scope the sidebar click to the sidebar nav, so T6's Home tiles don't add a second "Badge" link.

```diff
--- a/apps/gallery/src/routes.test.tsx
+++ b/apps/gallery/src/routes.test.tsx
@@ -1,4 +1,4 @@
-import { screen, within } from '@testing-library/react';
+import { screen, waitFor, within } from '@testing-library/react';
 import userEvent from '@testing-library/user-event';
 import { describe, it, expect, beforeEach } from 'vitest';
 import { MANIFESTS, routeFor } from './manifests';
@@ -74,15 +74,44 @@ describe('component routes (route smoke, D14)', () => {
     expect(container.querySelector('.gallery-preview__stage > .bit-box')).not.toBeNull();
   });
 
-  it.each(['/components/nope', '/components/logo'])('%s renders the 404 (the logo lives at /brand/logo)', async (path) => {
-    renderAt(path);
-    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Page not found');
+  it.each([
+    ['/components/nope', 'nope', 'Go to Code', '/components/code'],
+    ['/components/buton', 'buton', 'Go to Button', '/components/button'],
+    ['/components/logo', 'logo', 'Go to BitLogo', '/brand/logo'],
+  ])('%s names the typo and suggests the closest component', async (path, slug, suggestion, href) => {
+    const { container } = renderAt(path);
+    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(`No component called “${slug}”`);
+    expect(screen.getByRole('link', { name: suggestion })).toHaveAttribute('href', href);
+    await expectNoA11yViolations(container);
+  });
+
+  it('an unknown slug with nothing close lists every component as a Link, and suggests none', async () => {
+    renderAt('/components/accordion');
+    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('No component called “accordion”');
+    expect(screen.queryByRole('link', { name: /^Go to / })).toBeNull();
+    const list = screen.getByRole('heading', { level: 2, name: 'Every component' }).parentElement!;
+    expect(within(list).getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual(MANIFESTS.map(routeFor));
+  });
+
+  it('a slug that looks like markup is shown as text', async () => {
+    renderAt('/components/%3Cimg%20src%3Dx%3E');
+    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('No component called “<img src=x>”');
+    expect(document.querySelector('main img')).toBeNull();
+  });
+
+  it('bad shared values reset to their defaults and the URL is rewritten with replace (§E)', async () => {
+    const { router } = renderAt('/components/button?color=purple&size=lg');
+    await screen.findByRole('heading', { level: 1, name: 'Button' });
+    const preview = screen.getByRole('region', { name: 'Button preview' });
+    expect(within(preview).getByRole('button', { name: 'Save' })).toHaveClass('bit-primary', 'bit-lg');
+    await waitFor(() => expect(router.state.location.search).toBe('?size=lg'));
+    expect(router.state.historyAction).toBe('REPLACE');
   });
 
   it('sidebar links reach component pages', async () => {
     renderAt('/');
     await screen.findByRole('heading', { level: 1 });
-    await userEvent.click(screen.getByRole('link', { name: 'Badge' }));
+    await userEvent.click(within(screen.getByRole('navigation', { name: 'Gallery' })).getByRole('link', { name: 'Badge' }));
     expect(await screen.findByRole('heading', { level: 1, name: 'Badge' })).toBeInTheDocument();
   });
 });
```

Run: `pnpm --filter @bit-ds/gallery test`
Expected: FAIL. `closestManifest`, `PageLoading` and `PageError` don't resolve, and the unknown-slug routes still say "Page not found".

- [ ] **Step 8: Write the loading and error states, the 404 pages and the router**

Create `apps/gallery/src/pages/closestManifest.ts`:

```ts
import { MANIFESTS } from '../manifests';
import type { Manifest } from '../manifests';

/** Suggest a page only when the typo is this close: at most three letters added, dropped or changed. */
export const MAX_SUGGESTION_DISTANCE = 3;

/** Levenshtein distance: the fewest single-letter inserts, deletes or swaps that turn a into b. */
export function editDistance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      const swap = previous[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1);
      current.push(Math.min(previous[j]! + 1, current[j - 1]! + 1, swap));
    }
    previous = current;
  }
  return previous[b.length]!;
}

/**
 * The manifest whose slug is nearest the slug someone typed, ignoring case, if it is within
 * MAX_SUGGESTION_DISTANCE. Ties go to the earlier manifest, which is sidebar order.
 */
export function closestManifest(slug: string, manifests: readonly Manifest[] = MANIFESTS): Manifest | undefined {
  const typed = slug.toLowerCase();
  let best: { manifest: Manifest; distance: number } | undefined;
  for (const manifest of manifests) {
    const distance = editDistance(typed, manifest.slug);
    if (distance <= MAX_SUGGESTION_DISTANCE && (best === undefined || distance < best.distance)) {
      best = { manifest, distance };
    }
  }
  return best?.manifest;
}
```

Create `apps/gallery/src/shell/PageLoading.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Spinner, Stack, Text } from '@bit-ds/react';
import { findManifest } from '../manifests';

/** A page that arrives within this long shows no loading state at all, so fast loads don't flash. */
export const LOADING_DELAY_MS = 300;

interface PageLoadingProps {
  /** The page's name, as in "Loading Tokens…". */
  name: string;
}

/** The Suspense fallback for a lazy page: nothing for 300ms, then a Spinner and "Loading <Name>…". */
export function PageLoading({ name }: PageLoadingProps) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), LOADING_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);
  if (!visible) return null;
  const label = `Loading ${name}…`;
  return (
    <Stack direction="row" gap={12} align="center">
      <Spinner aria-label={label} />
      {/* The Spinner's status role already announces the label. */}
      <Text aria-hidden="true">{label}</Text>
    </Stack>
  );
}

/** The fallback for `/components/:slug`: names the component when the slug is a real one. */
export function ComponentLoading() {
  const { slug = '' } = useParams();
  return <PageLoading name={findManifest(slug)?.name ?? 'component'} />;
}
```

Create `apps/gallery/src/shell/PageError.tsx`:

```tsx
import { Alert, Button, Heading, Stack } from '@bit-ds/react';

interface PageErrorProps {
  /** Tests pass a spy; the app reloads the browser tab, which fetches the page's code again. */
  onReload?: () => void;
}

function reloadTab(): void {
  window.location.reload();
}

/**
 * The route errorElement: shown inside the shell when a page throws or its lazy chunk fails to load
 * (a dropped connection, or a deploy that replaced the chunk). The header and sidebar stay usable.
 */
export function PageError({ onReload = reloadTab }: PageErrorProps) {
  return (
    <Stack gap={16} align="start">
      <Heading level={1}>Something went wrong</Heading>
      <Alert color="danger" role="alert">
        This page didn't load. Check your connection and try again.
      </Alert>
      <Button onClick={onReload}>Reload page</Button>
    </Stack>
  );
}
```

Replace `apps/gallery/src/pages/NotFoundPage.tsx` with the version below; its title is now a `Heading`, per §7.8:

```tsx
import { Button, Heading, Stack, Text } from '@bit-ds/react';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <Stack gap={16} align="start">
      <Heading level={1}>Page not found</Heading>
      <Text>That route does not exist. The sidebar lists every page.</Text>
      <Button asChild>
        <Link to="/">Back to home</Link>
      </Button>
    </Stack>
  );
}
```

Create `apps/gallery/src/pages/UnknownComponentPage.tsx`:

```tsx
import { Heading, Link, Stack, Text } from '@bit-ds/react';
import { Link as RouterLink } from 'react-router-dom';
import { MANIFESTS, routeFor } from '../manifests';
import { closestManifest } from './closestManifest';

interface UnknownComponentPageProps {
  /** The slug from the URL, exactly as typed. React escapes it like any text. */
  slug: string;
}

/** `/components/<typo>`: names the typo, suggests the closest component, and lists every one. */
export function UnknownComponentPage({ slug }: UnknownComponentPageProps) {
  const closest = closestManifest(slug);
  return (
    <Stack gap={24}>
      <Stack gap={12} align="start">
        <Heading level={1}>No component called “{slug}”</Heading>
        {closest ? (
          <Text size={18}>
            <Link asChild>
              <RouterLink to={routeFor(closest)}>
                Go to {closest.name} <span aria-hidden="true">→</span>
              </RouterLink>
            </Link>
          </Text>
        ) : null}
      </Stack>
      <Stack gap={12}>
        <Heading level={2}>Every component</Heading>
        <ul className="gallery-link-list">
          {MANIFESTS.map((manifest) => (
            <li key={manifest.slug}>
              <Link asChild>
                <RouterLink to={routeFor(manifest)}>{manifest.name}</RouterLink>
              </Link>
            </li>
          ))}
        </ul>
      </Stack>
    </Stack>
  );
}
```

Create `apps/gallery/src/pages/ComponentRoute.tsx`. The two route components move here from `ComponentPage.tsx`, so T4 owns that file alone:

```tsx
import { useParams } from 'react-router-dom';
import { findManifest, routeFor } from '../manifests';
import { bitLogo } from '../manifests/bitLogo';
import { ComponentPage } from './ComponentPage';
import { UnknownComponentPage } from './UnknownComponentPage';

/**
 * `/components/:slug`. An unknown slug, or a manifest routed elsewhere (the logo is under Brand), gets the
 * unknown-component page with the closest match.
 */
export function ComponentRoute() {
  const { slug = '' } = useParams();
  const manifest = findManifest(slug);
  if (!manifest || routeFor(manifest) !== `/components/${slug}`) return <UnknownComponentPage slug={slug} />;
  return <ComponentPage key={manifest.slug} manifest={manifest} />;
}

/** `/brand/logo`. */
export function LogoRoute() {
  return <ComponentPage manifest={bitLogo} />;
}
```

In `apps/gallery/src/pages/ComponentPage.tsx`, delete `ComponentRoute`, `LogoRoute` and the imports only they used:

```diff
--- a/apps/gallery/src/pages/ComponentPage.tsx
+++ b/apps/gallery/src/pages/ComponentPage.tsx
@@ -1,15 +1,11 @@
-import { useParams } from 'react-router-dom';
 import { CodeBlock, Stack, Text } from '@bit-ds/react';
-import { findManifest, routeFor } from '../manifests';
 import type { Manifest } from '../manifests';
-import { bitLogo } from '../manifests/bitLogo';
 import { useControlState } from '../engine/useControlState';
 import { renderManifest } from '../engine/renderManifest';
 import { Presets } from '../engine/Presets';
 import { Preview } from '../engine/Preview';
 import { ControlsPanel } from '../engine/ControlsPanel';
 import { toJsx } from '../code/toJsx';
-import { NotFoundPage } from './NotFoundPage';
 
 interface ComponentPageProps {
   manifest: Manifest;
@@ -41,16 +37,3 @@ export function ComponentPage({ manifest }: ComponentPageProps) {
     </Stack>
   );
 }
-
-/** `/components/:slug`. Unknown slugs, and manifests routed elsewhere (the logo is under Brand), get the 404. */
-export function ComponentRoute() {
-  const { slug = '' } = useParams();
-  const manifest = findManifest(slug);
-  if (!manifest || routeFor(manifest) !== `/components/${slug}`) return <NotFoundPage />;
-  return <ComponentPage key={manifest.slug} manifest={manifest} />;
-}
-
-/** `/brand/logo`. */
-export function LogoRoute() {
-  return <ComponentPage manifest={bitLogo} />;
-}
```

Replace `apps/gallery/src/router.tsx` with:

```tsx
import { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { createHashRouter } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { Shell } from './shell/Shell';
import { ComponentLoading, PageLoading } from './shell/PageLoading';
import { PageError } from './shell/PageError';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';

// Pages other than home are lazy so the first paint ships only the shell and home.
const TokensPage = lazy(() => import('./pages/TokensPage').then((m) => ({ default: m.TokensPage })));
const TypographyPage = lazy(() => import('./pages/TypographyPage').then((m) => ({ default: m.TypographyPage })));
const SpacingPage = lazy(() => import('./pages/SpacingPage').then((m) => ({ default: m.SpacingPage })));
const ComponentRoute = lazy(() => import('./pages/ComponentRoute').then((m) => ({ default: m.ComponentRoute })));
const LogoRoute = lazy(() => import('./pages/ComponentRoute').then((m) => ({ default: m.LogoRoute })));

function lazyPage(page: ReactNode, fallback: ReactNode) {
  return <Suspense fallback={fallback}>{page}</Suspense>;
}

/** Route table shared by the hash router (app) and memory routers (tests). */
export function buildRoutes(): RouteObject[] {
  return [
    {
      element: <Shell />,
      children: [
        {
          // Pathless, so a page that throws or fails to load shows PageError inside the shell.
          errorElement: <PageError />,
          children: [
            { index: true, element: <HomePage /> },
            { path: 'tokens', element: lazyPage(<TokensPage />, <PageLoading name="Tokens" />) },
            { path: 'typography', element: lazyPage(<TypographyPage />, <PageLoading name="Typography" />) },
            { path: 'spacing', element: lazyPage(<SpacingPage />, <PageLoading name="Spacing" />) },
            { path: 'components/:slug', element: lazyPage(<ComponentRoute />, <ComponentLoading />) },
            { path: 'brand/logo', element: lazyPage(<LogoRoute />, <PageLoading name="Logo" />) },
            { path: '*', element: <NotFoundPage /> },
          ],
        },
      ],
    },
  ];
}

export const router = createHashRouter(buildRoutes());
```

- [ ] **Step 9: Write the failing shell tests: skip link, phone header and sheet**

```diff
--- a/apps/gallery/src/shell/Shell.test.tsx
+++ b/apps/gallery/src/shell/Shell.test.tsx
@@ -1,4 +1,4 @@
-import { screen, waitFor, within } from '@testing-library/react';
+import { act, screen, waitFor, within } from '@testing-library/react';
 import userEvent from '@testing-library/user-event';
 import { describe, it, expect, beforeEach } from 'vitest';
 import { renderAt } from '../test/renderRoute';
@@ -41,7 +41,17 @@ describe('Shell', () => {
     renderAt('/');
     const skip = await screen.findByRole('link', { name: 'Skip to content' });
     expect(skip).toHaveAttribute('href', '#main');
-    expect(document.getElementById('main')).not.toBeNull();
+    expect(skip).toHaveClass('bit-link', 'gallery-skip');
+    expect(document.getElementById('main')).toHaveAttribute('tabindex', '-1');
+  });
+
+  it('the skip link focuses main and keeps the route (a #main href would be the route /main)', async () => {
+    const { router } = renderAt('/components/button?color=danger');
+    await screen.findByRole('heading', { level: 1, name: 'Button' });
+    await userEvent.click(screen.getByRole('link', { name: 'Skip to content' }));
+    expect(document.activeElement).toBe(document.getElementById('main'));
+    expect(router.state.location.pathname).toBe('/components/button');
+    expect(router.state.location.search).toBe('?color=danger');
   });
 
   it('does not move focus to the heading on first load', async () => {
@@ -77,4 +87,28 @@ describe('Shell', () => {
     expect(button).toHaveAttribute('aria-expanded', 'true');
     expect(screen.getByRole('navigation', { name: 'Gallery' })).toHaveAttribute('data-open', '');
   });
+
+  it('Escape closes the sheet and hands focus back to Menu', async () => {
+    renderAt('/');
+    const button = await screen.findByRole('button', { name: 'Menu' });
+    await userEvent.click(button);
+    within(screen.getByRole('navigation', { name: 'Gallery' })).getByRole('link', { name: 'Tokens' }).focus();
+    await userEvent.keyboard('{Escape}');
+    expect(button).toHaveAttribute('aria-expanded', 'false');
+    expect(screen.getByRole('navigation', { name: 'Gallery' })).not.toHaveAttribute('data-open');
+    expect(document.activeElement).toBe(button);
+  });
+
+  it('navigating closes the sheet, by a link in it or by Back', async () => {
+    const { router } = renderAt('/');
+    const button = await screen.findByRole('button', { name: 'Menu' });
+    await userEvent.click(button);
+    await userEvent.click(within(screen.getByRole('navigation', { name: 'Gallery' })).getByRole('link', { name: 'Badge' }));
+    expect(await screen.findByRole('heading', { level: 1, name: 'Badge' })).toBeInTheDocument();
+    expect(button).toHaveAttribute('aria-expanded', 'false');
+    await userEvent.click(button);
+    expect(button).toHaveAttribute('aria-expanded', 'true');
+    await act(() => router.navigate(-1));
+    expect(button).toHaveAttribute('aria-expanded', 'false');
+  });
 });
```

```diff
--- a/apps/gallery/src/shell/Header.test.tsx
+++ b/apps/gallery/src/shell/Header.test.tsx
@@ -1,7 +1,9 @@
 import { screen, within } from '@testing-library/react';
 import userEvent from '@testing-library/user-event';
-import { describe, it, expect, beforeEach } from 'vitest';
+import { describe, it, expect, beforeEach, afterEach } from 'vitest';
 import { renderAt } from '../test/renderRoute';
+import { stubMatchMedia } from '../test/matchMedia';
+import { NARROW_QUERY } from '../ui/useMediaQuery';
 
 describe('Header color mode', () => {
   beforeEach(() => {
@@ -42,3 +44,27 @@ describe('Header color mode', () => {
     expect(within(again).getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'true');
   });
 });
+
+describe('Header at phone width', () => {
+  let restore: () => void = () => {};
+  afterEach(() => restore());
+
+  it('is Menu, the logo and the mode toggle; GitHub moves into the sidebar sheet', async () => {
+    restore = stubMatchMedia(NARROW_QUERY);
+    renderAt('/');
+    const header = await screen.findByRole('banner');
+    expect(within(header).getByRole('button', { name: 'Menu' })).toBeInTheDocument();
+    expect(within(header).getByRole('link', { name: 'bit Design System, gallery home' })).toBeInTheDocument();
+    expect(within(header).getByRole('group', { name: 'Color mode' })).toBeInTheDocument();
+    expect(within(header).queryByRole('link', { name: 'GitHub' })).toBeNull();
+    const nav = screen.getByRole('navigation', { name: 'Gallery' });
+    expect(within(nav).getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/doosemavis/bit-design-system');
+  });
+
+  it('on a wide screen GitHub stays in the header and the sheet has none', async () => {
+    renderAt('/');
+    const header = await screen.findByRole('banner');
+    expect(within(header).getByRole('link', { name: 'GitHub' })).toBeInTheDocument();
+    expect(within(screen.getByRole('navigation', { name: 'Gallery' })).queryByRole('link', { name: 'GitHub' })).toBeNull();
+  });
+});
```

Run: `pnpm --filter @bit-ds/gallery test -- shell`
Expected: FAIL.
- The skip link is a raw `<a>` without `bit-link`, and clicking it changes the route.
- `main` has no tabindex.
- At phone width the header still shows GitHub.
- Escape does nothing.

- [ ] **Step 10: Build the skip link, the phone header and the sheet**

Replace `apps/gallery/src/shell/Header.tsx` with:

```tsx
import { forwardRef } from 'react';
import { BitLogo, Button, ModeToggle } from '@bit-ds/react';
import { Link } from 'react-router-dom';
import { ThemeSelect } from './ThemeSelect';
import { THEMES } from './themes';

export const REPO_URL = 'https://github.com/doosemavis/bit-design-system';

/** The GitHub button. The header shows it on wide screens; at phone width it moves into the sidebar sheet. */
export function GitHubLink() {
  return (
    <Button asChild variant="outline" size="sm" color="neutral">
      <a href={REPO_URL} target="_blank" rel="noreferrer">
        GitHub
      </a>
    </Button>
  );
}

interface HeaderProps {
  menuOpen: boolean;
  onToggleMenu: () => void;
  /** At phone width the header is Menu, the logo and the mode toggle only. */
  narrow: boolean;
}

/** The ref goes on the Menu button, so closing the sheet with Escape can hand focus back to it. */
export const Header = forwardRef<HTMLButtonElement, HeaderProps>(function Header({ menuOpen, onToggleMenu, narrow }, ref) {
  return (
    <header className="gallery-header">
      <Button
        ref={ref}
        className="gallery-header__menu"
        variant="ghost"
        size="sm"
        aria-expanded={menuOpen}
        aria-controls="gallery-nav"
        onClick={onToggleMenu}
      >
        Menu
      </Button>
      <Link to="/" className="gallery-header__brand" aria-label="bit Design System, gallery home">
        <BitLogo size="sm" />
      </Link>
      <div className="gallery-header__tools">
        {/* The theme dropdown appears once a second theme exists (plan §H.5); light/dark is a mode. */}
        {THEMES.length > 1 ? <ThemeSelect /> : null}
        <ModeToggle size="sm" />
        {narrow ? null : <GitHubLink />}
      </div>
    </header>
  );
});
```

In `apps/gallery/src/shell/Sidebar.tsx`:

```diff
--- a/apps/gallery/src/shell/Sidebar.tsx
+++ b/apps/gallery/src/shell/Sidebar.tsx
@@ -1,3 +1,4 @@
+import type { ReactNode } from 'react';
 import { NavLink } from 'react-router-dom';
 import { Text } from '@bit-ds/react';
 import { MANIFESTS, routeFor } from '../manifests';
@@ -32,9 +33,11 @@ interface SidebarProps {
   items: readonly NavItem[];
   open: boolean;
   onNavigate: () => void;
+  /** Shown after the groups: the GitHub button, when the header is too narrow for it. */
+  footer?: ReactNode;
 }
 
-export function Sidebar({ items, open, onNavigate }: SidebarProps) {
+export function Sidebar({ items, open, onNavigate, footer }: SidebarProps) {
   return (
     <nav id="gallery-nav" className="gallery-sidebar" aria-label="Gallery" data-open={open ? '' : undefined}>
       {GROUPS.map((group) => {
@@ -57,6 +60,7 @@ export function Sidebar({ items, open, onNavigate }: SidebarProps) {
           </section>
         );
       })}
+      {footer ? <div className="gallery-sidebar__footer">{footer}</div> : null}
     </nav>
   );
 }
```

Replace `apps/gallery/src/shell/Shell.tsx` with:

```tsx
import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header, GitHubLink } from './Header';
import { Sidebar, NAV } from './Sidebar';
import type { NavItem } from './Sidebar';
import { useFocusHeading } from './useFocusHeading';
import { InPageLink } from '../ui/InPageLink';
import { NARROW_QUERY, useMediaQuery } from '../ui/useMediaQuery';

interface ShellProps {
  nav?: readonly NavItem[];
}

/** Three regions: header, sidebar, main. The skip link is the first focusable element. */
export function Shell({ nav = NAV }: ShellProps) {
  const { pathname } = useLocation();
  const narrow = useMediaQuery(NARROW_QUERY);
  // The sheet stays open only on the page it was opened on, so any navigation closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const menuOpen = openOn === pathname;
  const menuButton = useRef<HTMLButtonElement>(null);
  useFocusHeading();

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpenOn(null);
      menuButton.current?.focus();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen]);

  return (
    <div className="gallery-shell">
      <InPageLink targetId="main" className="gallery-skip">
        Skip to content
      </InPageLink>
      <Header
        ref={menuButton}
        narrow={narrow}
        menuOpen={menuOpen}
        onToggleMenu={() => setOpenOn((open) => (open === pathname ? null : pathname))}
      />
      <Sidebar
        items={nav}
        open={menuOpen}
        onNavigate={() => setOpenOn(null)}
        footer={narrow ? <GitHubLink /> : null}
      />
      <main id="main" className="gallery-main" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
```

- [ ] **Step 11: The CSS and its tests, and the entry-file check**

In `apps/gallery/src/gallery-css.test.ts`, add two tests at the end:

```diff
--- a/apps/gallery/src/gallery-css.test.ts
+++ b/apps/gallery/src/gallery-css.test.ts
@@ -53,4 +53,14 @@ describe('gallery.css', () => {
     expect(galleryCss).toMatch(/\.gallery-control__label\s*\{[^}]*font-family: var\(--bit-font-mono\);/);
     expect(galleryCss).toMatch(/\.gallery-matrix__table th\s*\{[^}]*font-family: var\(--bit-font-mono\);/);
   });
+
+  it('every face sample is one height and sits on its floor, so the token chips line up across the cards', () => {
+    expect(galleryCss).toMatch(
+      /\.gallery-face \{\s*min-height: var\(--bit-space-48px\);\s*display: flex;\s*align-items: flex-end;\s*\}/,
+    );
+  });
+
+  it('script-moved focus on main and on tabIndex -1 targets draws no ring; real controls keep theirs', () => {
+    expect(galleryCss).toMatch(/\.gallery-main:focus,\s*\.gallery-main \[tabindex="-1"\]:focus \{\s*outline: none;\s*\}/);
+  });
 });
```

In `apps/gallery/src/main.test.ts`:

```diff
--- a/apps/gallery/src/main.test.ts
+++ b/apps/gallery/src/main.test.ts
@@ -2,6 +2,7 @@
 
 import { readFileSync } from 'node:fs';
 import { describe, it, expect } from 'vitest';
+import { STYLE_IMPORTS } from './content/styleImports';
 
 const main = readFileSync(new URL('./main.tsx', import.meta.url), 'utf8');
 
@@ -12,4 +13,8 @@ describe('main.tsx', () => {
     expect(theme).toBeGreaterThanOrEqual(0);
     expect(styles).toBeGreaterThan(theme);
   });
+
+  it('starts its CSS with exactly STYLE_IMPORTS, the lines Home and the full file teach', () => {
+    expect(main).toContain(STYLE_IMPORTS);
+  });
 });
```

In `apps/gallery/src/gallery.css`:
- Replace the h1-only focus rule.
- Replace `.gallery-loading` (its component is gone) with the link list and the visually hidden class.
- Add the eyebrow, the section bar, the sidebar footer and the face-sample rule.
- End the file with the three wave-2 markers.

```diff
--- a/apps/gallery/src/gallery.css
+++ b/apps/gallery/src/gallery.css
@@ -129,6 +129,11 @@ html {
   color: var(--bit-color-primary-contrast);
 }
 
+/* At phone width the GitHub button moves out of the header into the sheet, under the groups. */
+.gallery-sidebar__footer {
+  margin-top: var(--bit-space-24px);
+}
+
 .gallery-main {
   grid-area: main;
   padding: var(--bit-space-32px) var(--_gallery-gutter);
@@ -136,7 +141,10 @@ html {
   width: 100%;
 }
 
-.gallery-main h1:focus {
+/* Focus moved by script (the page h1 after navigation, main after the skip link, a section's h2 from a
+   section bar) lands on things that aren't controls, so it draws no ring. */
+.gallery-main:focus,
+.gallery-main [tabindex="-1"]:focus {
   outline: none;
 }
 
@@ -153,10 +161,43 @@ html {
   border-bottom: var(--bit-border-width) solid var(--bit-color-line);
 }
 
-.gallery-loading {
+/* The unknown-component page lists every component as a row of Links that wraps. */
+.gallery-link-list {
+  list-style: none;
+  margin: 0;
+  padding: 0;
+  display: flex;
+  flex-wrap: wrap;
+  gap: var(--bit-space-12px) var(--bit-space-16px);
+}
+
+/* A page's eyebrow: the sidebar group above the h1, in the sidebar titles' pixel caps. */
+.gallery-eyebrow {
+  font-family: var(--bit-font-pixel);
+  text-transform: uppercase;
+  letter-spacing: 0.08em;
   color: var(--bit-color-text-muted);
 }
 
+/* The in-page links under a page header. */
+.gallery-section-bar {
+  padding-block: var(--bit-space-8px);
+  border-block: var(--bit-border-width) solid var(--bit-color-line);
+}
+
+/* Read by screen readers, invisible on screen: the gallery Copy button's status line. */
+.gallery-visually-hidden {
+  position: absolute;
+  width: 1px;
+  height: 1px;
+  margin: -1px;
+  padding: 0;
+  overflow: hidden;
+  clip-path: inset(50%);
+  white-space: nowrap;
+  border: 0;
+}
+
 @media (max-width: 720px) {
   .gallery-shell {
     grid-template-columns: minmax(0, 1fr);
@@ -330,7 +371,14 @@ html {
 }
 
 /* A face sample on the Typography page, set in the font token data-face names. Text size 24 gives the
-   base size; the pixel and mono samples step down so their wide letters fit a card. */
+   base size; the pixel and mono samples step down so their wide letters fit a card. Every sample takes the
+   same height and sits on its floor, so the token chips under the four samples line up across the cards. */
+.gallery-face {
+  min-height: var(--bit-space-48px);
+  display: flex;
+  align-items: flex-end;
+}
+
 .gallery-face[data-face="display"] {
   font-family: var(--bit-font-display);
   font-weight: 400;
@@ -381,3 +429,9 @@ html {
 .bit-box.gallery-outline {
   outline: 2px dashed var(--bit-color-accent);
 }
+
+/* ---------- component page ---------- */
+
+/* ---------- tokens page ---------- */
+
+/* ---------- home page ---------- */
```

- [ ] **Step 12: Run the gallery tests**

Run: `pnpm build && pnpm --filter @bit-ds/gallery test`
Expected: PASS, `Tests  233 passed (233)` on T1. Add 5 for T3a and 59 for T3c if they have merged.

- [ ] **Step 13: Run every gate**

Run: `pnpm build && pnpm verify && pnpm test && pnpm test:coverage && pnpm typecheck && pnpm lint && pnpm smoke && pnpm storybook:build`

Expected:
- core `457`, react `408` and gallery `233`
- coverage `100%`
- `27 components` on the dist and consumer lines
- `Storybook build completed successfully`

- [ ] **Step 14: Commit**

```bash
git add apps/gallery/src
git commit -m "fix(gallery): focus on page change only, push and replace history, skip link, loading and error states, closest-name 404, phone header and sheet

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3a: Manifest types, the docs contract, and docs for the first ten manifests

**Files:**
- Modify: `apps/gallery/src/manifests/types.ts` and `apps/gallery/src/manifests/manifests.test.ts`
- Modify: `alert.ts`, `badge.ts`, `bitLogo.ts`, `box.ts`, `button.ts`, `card.ts`, `code.ts`, `codeBlock.ts`, `field.ts` and `heading.ts`, all in `apps/gallery/src/manifests/`

**Interfaces:**
- **Consumes:** nothing new.
- **Produces, in commit 1** (T3b, T3c and T4 rely on these):
  - `ManifestDocs`, now complete: `badges: readonly string[]`, `usage: { do; dont }`, `props: readonly PropDoc[]`, `a11y: readonly string[]` and `emptyChildrenError?: string`
  - `PropDoc.className?: string`, holding `bit-{color}`, `bit-{variant}` or `bit-{size}` on axis rows only
  - `Manifest.interactive?: boolean`
  - `Manifest.docs?`, optional until T3c
- **Produces, in commit 2:**
  - docs on its ten manifests
  - `interactive: true` on CodeBlock
  - `emptyChildrenError` on Button

**This task makes two commits.** The controller merges commit 1 before starting T3b. Do not put any manifest's docs in commit 1.

- [ ] **Step 1: Write the contract tests over the documented manifests**

In `apps/gallery/src/manifests/manifests.test.ts`:

```diff
--- a/apps/gallery/src/manifests/manifests.test.ts
+++ b/apps/gallery/src/manifests/manifests.test.ts
@@ -8,7 +8,7 @@ import { text } from './text';
 import { heading } from './heading';
 import { box } from './box';
 import { toJsx } from '../code/toJsx';
-import type { ChildSpec, ControlState } from './types';
+import type { ChildSpec, ControlState, Manifest, ManifestDocs } from './types';
 
 /** ChildSpec names, nested parts included, that are neither a registered component nor an allowed HTML element. */
 function unknownChildren(children: readonly ChildSpec[]): string[] {
@@ -29,6 +29,9 @@ const COMPONENT_EXPORTS = Object.keys(lib)
   .filter((name) => /^[A-Z][a-z]/.test(name))
   .sort();
 
+/** The manifests that have docs so far. T3c replaces this with every manifest, once docs are required. */
+const DOCUMENTED = MANIFESTS.filter((m): m is Manifest & { docs: ManifestDocs } => m.docs !== undefined);
+
 /** Compound parts are documented on their parent's page, not their own. */
 const PARTS = MANIFESTS.flatMap((m) => m.parts ?? []);
 
@@ -155,6 +158,35 @@ describe('manifest contract', () => {
     }
   });
 
+  it('documented manifests have complete docs: at least one Do, one Don\'t, one prop and one a11y line, none blank', () => {
+    for (const m of DOCUMENTED) {
+      const { usage, props, a11y, badges } = m.docs;
+      expect(usage.do.length, `${m.name} do`).toBeGreaterThan(0);
+      expect(usage.dont.length, `${m.name} dont`).toBeGreaterThan(0);
+      expect(props.length, `${m.name} props`).toBeGreaterThan(0);
+      expect(a11y.length, `${m.name} a11y`).toBeGreaterThan(0);
+      const lines = [...badges, ...usage.do, ...usage.dont, ...a11y, ...props.flatMap((p) => [p.name, p.type, p.description])];
+      expect(lines.filter((line) => line.trim() === ''), m.name).toEqual([]);
+    }
+  });
+
+  it('documented manifests document every prop their controls expose, once', () => {
+    for (const m of DOCUMENTED) {
+      const documented = m.docs.props.map((p) => p.name);
+      expect(new Set(documented).size, `${m.name} duplicate prop rows`).toBe(documented.length);
+      expect(m.controls.map((c) => c.prop).filter((prop) => !documented.includes(prop)), m.name).toEqual([]);
+    }
+  });
+
+  it('documented manifests give every axis prop row its bit-{prop} class, and no other row one', () => {
+    for (const m of DOCUMENTED) {
+      const axes = new Set<string>(m.controls.filter((c) => c.kind === 'axis').map((c) => c.prop));
+      for (const row of m.docs.props) {
+        expect(row.className, `${m.name}.${row.name}`).toBe(axes.has(row.name) ? `bit-{${row.name}}` : undefined);
+      }
+    }
+  });
+
   it('groups are the sidebar groups, and only the logo is brand', () => {
     for (const m of MANIFESTS) expect(['components', 'forms', 'brand']).toContain(m.group);
     expect(MANIFESTS.filter((m) => m.group === 'brand').map((m) => m.name)).toEqual(['BitLogo']);
```

These tests pass trivially until a manifest has docs. T3c turns them into one test per manifest, over all of them. The existing test "every preset sets only real controls, to values those controls accept (§H.3)" already validates presets against their controls, as the spec asks. Keep it.

- [ ] **Step 2: Complete the types; `docs` stays optional for now**

```diff
--- a/apps/gallery/src/manifests/types.ts
+++ b/apps/gallery/src/manifests/types.ts
@@ -72,17 +72,25 @@ export type ManifestGroup = 'components' | 'forms' | 'brand';
 /** One row of a component page's Props table. */
 export interface PropDoc {
   name: string;
+  /** The type as you'd write it in TypeScript: `'sm' | 'md' | 'lg'`, `boolean`, `ReactNode`. */
   type: string;
+  /** The value when the prop is left off, written as code (`'md'`, `false`). Omit it for a required prop. */
   default?: string;
+  /** The decorator class an axis prop emits, `bit-{color}`, `bit-{variant}` or `bit-{size}`. Only axis props have one. */
+  className?: string;
   description: string;
 }
 
-/** Everything a component page shows besides the playground (layout C, PR3). */
+/** Everything a component page shows besides the playground (layout C). Every manifest has one. */
 export interface ManifestDocs {
-  badges?: readonly string[];
-  usage?: { do: readonly string[]; dont: readonly string[] };
-  props?: readonly PropDoc[];
-  a11y?: readonly string[];
+  /** Short facts shown under the import line, such as "Native <button>". May be empty. */
+  badges: readonly string[];
+  /** When to reach for the component, and when not to. At least one of each. */
+  usage: { do: readonly string[]; dont: readonly string[] };
+  /** Every prop the controls expose, plus any other a newcomer needs. At least one. */
+  props: readonly PropDoc[];
+  /** What the component does for keyboard and screen-reader users, and what it leaves to you. At least one. */
+  a11y: readonly string[];
   /** The children control's error when the visitor empties it, e.g. Button's screen-reader warning. */
   emptyChildrenError?: string;
 }
@@ -104,6 +112,14 @@ export interface Manifest {
   presets?: readonly Preset[];
   /** Compound parts documented on this page; the import line lists them. */
   parts?: readonly string[];
-  /** Page content beyond the playground. Optional until PR3 fills every manifest and makes it required. */
+  /**
+   * Page content beyond the playground: badges, usage, props and accessibility. Optional only until T3a and
+   * T3b have written every manifest's docs; T3c makes it required.
+   */
   docs?: ManifestDocs;
+  /**
+   * The component needs React to work (state, storage, the clipboard), so its page offers React code only.
+   * Every other component's markup works as plain HTML with bit's CSS, and its page offers an HTML tab.
+   */
+  interactive?: boolean;
 }
```

- [ ] **Step 3: Run the gates and make commit 1**

Run: `pnpm build && pnpm verify && pnpm test && pnpm test:coverage && pnpm typecheck && pnpm lint && pnpm smoke && pnpm storybook:build`
Expected: all green; gallery `236` with T2, or `181` without it.

```bash
git add apps/gallery/src/manifests/types.ts apps/gallery/src/manifests/manifests.test.ts
git commit -m "feat(gallery): complete ManifestDocs, PropDoc.className, Manifest.interactive, and the docs contract

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

Tell the controller that commit 1 is ready to merge, so T3b can start.

- [ ] **Step 4: Write the failing tests for this half**

In `apps/gallery/src/manifests/manifests.test.ts`:

```diff
--- a/apps/gallery/src/manifests/manifests.test.ts
+++ b/apps/gallery/src/manifests/manifests.test.ts
@@ -7,6 +7,8 @@ import { stack } from './stack';
 import { text } from './text';
 import { heading } from './heading';
 import { box } from './box';
+import { button } from './button';
+import { codeBlock } from './codeBlock';
 import { toJsx } from '../code/toJsx';
 import type { ChildSpec, ControlState, Manifest, ManifestDocs } from './types';
 
@@ -187,6 +189,14 @@ describe('manifest contract', () => {
     }
   });
 
+  it("Button's empty-children error is the §E text", () => {
+    expect(button.docs?.emptyChildrenError).toBe('A Button needs text or an aria-label, or screen readers announce just "button".');
+  });
+
+  it('CodeBlock documents its actions slot', () => {
+    expect(codeBlock.docs?.props.find((p) => p.name === 'actions')?.type).toBe('ReactNode');
+  });
+
   it('groups are the sidebar groups, and only the logo is brand', () => {
     for (const m of MANIFESTS) expect(['components', 'forms', 'brand']).toContain(m.group);
     expect(MANIFESTS.filter((m) => m.group === 'brand').map((m) => m.name)).toEqual(['BitLogo']);
```

Run: `pnpm --filter @bit-ds/gallery test -- manifests`
Expected: FAIL. `button.docs` and `codeBlock.docs` are undefined.

- [ ] **Step 5: Write the docs for alert, badge, bitLogo, box, button, card, code, codeBlock, field and heading**

Each manifest gets a `docs` block as its last property. Write the text for a reader new to design systems.
- Axis prop rows carry `className`.
- CodeBlock also gets `interactive: true`.
- Button carries the §E empty-children error.

```diff
--- a/apps/gallery/src/manifests/alert.ts
+++ b/apps/gallery/src/manifests/alert.ts
@@ -17,4 +17,50 @@ export const alert: Manifest = {
     { label: 'Danger solid', state: { color: 'danger', variant: 'solid', title: 'Something broke' } },
     { label: 'No title', state: { title: '' } },
   ],
+  docs: {
+    badges: ['role="status"', 'Title in the display face'],
+    usage: {
+      do: [
+        'Say what happened and what to do next: "Saved. You can close this tab."',
+        'Use outline (the soft fill) for most messages, and solid when it must stand out.',
+      ],
+      dont: [
+        'Stack several Alerts at the top of a page. Merge them, or show the most important one.',
+        'Use the default role for guidance that never changes: it is announced as news. Give it role="note".',
+      ],
+    },
+    props: [
+      {
+        name: 'color',
+        className: 'bit-{color}',
+        type: "'primary' | 'neutral' | 'success' | 'warning' | 'danger'",
+        default: "'neutral'",
+        description: 'The color role: success for done, warning for take care, danger for failed.',
+      },
+      {
+        name: 'variant',
+        className: 'bit-{variant}',
+        type: "'solid' | 'outline'",
+        default: "'outline'",
+        description: "outline uses the color's soft background; solid fills with the color.",
+      },
+      {
+        name: 'title',
+        type: 'string',
+        description: "The alert's own heading, in the display face. It is not the native title tooltip.",
+      },
+      {
+        name: 'role',
+        type: 'string',
+        default: "'status'",
+        description: 'Use "alert" for an urgent error, "note" for guidance that isn\'t news.',
+      },
+      { name: 'children', type: 'ReactNode', description: 'The message.' },
+    ],
+    a11y: [
+      'role="status" by default, so screen readers announce it politely when it appears, without moving focus.',
+      'Use role="alert" only for errors that need attention now: it interrupts whatever is being read.',
+      "The title is styled text, not a heading, so it doesn't change the page outline.",
+    ],
+  },
 };
```

```diff
--- a/apps/gallery/src/manifests/badge.ts
+++ b/apps/gallery/src/manifests/badge.ts
@@ -19,4 +19,45 @@ export const badge: Manifest = {
     { label: 'Warning outline', state: { color: 'warning', variant: 'outline' } },
     { label: 'Square tag', state: { shape: 'square', variant: 'outline' } },
   ],
+  docs: {
+    badges: ['Static <span>', 'Pill or square'],
+    usage: {
+      do: [
+        'Use a Badge for a short status or a count: "New", "Beta", "3".',
+        'Pick the color for its meaning: success for done, warning for waiting, danger for failed.',
+      ],
+      dont: [
+        "Make a Badge clickable. It's a <span>; use a Button or a Link for actions.",
+        'Put a sentence in a Badge. One or two words.',
+      ],
+    },
+    props: [
+      {
+        name: 'color',
+        className: 'bit-{color}',
+        type: "'primary' | 'neutral' | 'success' | 'warning' | 'danger'",
+        default: "'neutral'",
+        description: 'The color role.',
+      },
+      {
+        name: 'variant',
+        className: 'bit-{variant}',
+        type: "'solid' | 'outline'",
+        default: "'solid'",
+        description: "solid fills with the color; outline uses the color's soft background.",
+      },
+      { name: 'size', className: 'bit-{size}', type: "'sm' | 'md'", default: "'md'", description: 'Text size and padding.' },
+      {
+        name: 'shape',
+        type: "'pill' | 'square'",
+        default: "'pill'",
+        description: "pill is fully rounded; square uses the 6px radius. Rendered as data-shape, because shape isn't a shared axis.",
+      },
+      { name: 'children', type: 'ReactNode', description: 'The label.' },
+    ],
+    a11y: [
+      'A Badge is plain text in a <span>, read inline with the text around it.',
+      "Color alone doesn't reach everyone, so say it in the words too: \"Failed\", not just red.",
+    ],
+  },
 };
```

```diff
--- a/apps/gallery/src/manifests/bitLogo.ts
+++ b/apps/gallery/src/manifests/bitLogo.ts
@@ -12,4 +12,30 @@ export const bitLogo: Manifest = {
     { kind: 'select', prop: 'era', values: ['none', ...ERAS.map(String)], default: 'none', numeric: true },
   ],
   presets: [{ label: 'Pinned at 32-bit', state: { era: '32' } }],
+  docs: {
+    badges: ['role="img"', 'Four eras'],
+    usage: {
+      do: [
+        'Use the logo once per page, in the header or as the home page title.',
+        'Pin an era with era when a screenshot or a print must look the same every time.',
+      ],
+      dont: [
+        'Recolor or stretch it; the coin golds are fixed brand colors.',
+        'Use it as decoration beside the name "bit"; it already says "bit Design System".',
+      ],
+    },
+    props: [
+      { name: 'size', className: 'bit-{size}', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Overall size.' },
+      {
+        name: 'era',
+        type: '8 | 16 | 32 | 64',
+        description: 'Pin one era. Leave it off and each page load shows the next: 8 → 16 → 32 → 64.',
+      },
+    ],
+    a11y: [
+      'role="img" with the name "bit Design System"; the letters inside are hidden from screen readers.',
+      'Inside a link, the link takes that name too, so add context such as "gallery home" with aria-label.',
+      'The era animation stops when people ask their system to reduce motion.',
+    ],
+  },
 };
```

```diff
--- a/apps/gallery/src/manifests/box.ts
+++ b/apps/gallery/src/manifests/box.ts
@@ -30,4 +30,42 @@ export const box: Manifest = {
     { label: 'Y beats padding', state: { paddingY: '0' } },
     { label: 'Pushed down', state: { marginTop: '32' } },
   ],
+  docs: {
+    badges: ['Layout', 'Most specific wins'],
+    usage: {
+      do: [
+        'Use Box to pad or offset one element on the space scale.',
+        'Use the most specific prop you mean: paddingX={24} for the sides, not padding plus overrides.',
+      ],
+      dont: [
+        'Use Box for the space between siblings. Use Stack and its gap.',
+        'Expect vertical margin on as="span": a span is inline, so marginTop does nothing to it.',
+      ],
+    },
+    props: [
+      {
+        name: 'padding',
+        type: '0 | 4 | 8 | 12 | 16 | 24 | 32 | 48 | 64',
+        description: 'All four sides. The same scale goes for paddingTop, paddingRight, paddingBottom and paddingLeft.',
+      },
+      { name: 'paddingX', type: '0 | 4 | … | 64', description: 'Left and right. Beats padding.' },
+      { name: 'paddingY', type: '0 | 4 | … | 64', description: 'Top and bottom. Beats padding; a single side beats it.' },
+      {
+        name: 'margin',
+        type: '0 | 4 | … | 64',
+        description: 'All four sides, outside the border. marginX, marginY and the four sides work like padding.',
+      },
+      { name: 'marginTop', type: '0 | 4 | … | 64', description: 'Space above. Beats marginY and margin.' },
+      {
+        name: 'as',
+        type: "'div' | 'section' | 'article' | 'aside' | 'header' | 'footer' | 'main' | 'nav' | 'span'",
+        default: "'div'",
+        description: 'Which element to render. span is inline, so vertical margins do nothing on it.',
+      },
+    ],
+    a11y: [
+      'A Box is the element you pick with as, and adds no role of its own.',
+      'as="nav" or as="section" changes what screen readers announce, so pick it for meaning, not looks.',
+    ],
+  },
 };
```

```diff
--- a/apps/gallery/src/manifests/button.ts
+++ b/apps/gallery/src/manifests/button.ts
@@ -20,4 +20,57 @@ export const button: Manifest = {
     { label: 'Ghost small', state: { variant: 'ghost', size: 'sm' } },
     { label: 'Loading', state: { loading: true } },
   ],
+  docs: {
+    badges: ['Native <button>', 'Keyboard ready', 'asChild for links'],
+    usage: {
+      do: [
+        'Use one solid Button per view, for the main action (Save, Send, Create).',
+        'Use outline or ghost for the other actions beside it.',
+        'Label it with a verb that says what happens: "Delete project", not "OK".',
+      ],
+      dont: [
+        "Line up three solid Buttons; the eye can't pick one.",
+        "Use a Button to go to another page. That's a Link, or Button asChild around your router's link.",
+        'Leave a Button with no text and no aria-label.',
+      ],
+    },
+    props: [
+      {
+        name: 'color',
+        className: 'bit-{color}',
+        type: "'primary' | 'neutral' | 'success' | 'warning' | 'danger'",
+        default: "'primary'",
+        description: 'The color role. Reads the --bit-color-{color} tokens.',
+      },
+      {
+        name: 'variant',
+        className: 'bit-{variant}',
+        type: "'solid' | 'outline' | 'ghost'",
+        default: "'solid'",
+        description: 'How loud it is. Solid for the one main action, outline and ghost for the rest.',
+      },
+      { name: 'size', className: 'bit-{size}', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Height and padding.' },
+      {
+        name: 'loading',
+        type: 'boolean',
+        default: 'false',
+        description: 'Shows a spinner, sets aria-busy and blocks clicks. The label stays, so people still know what it does.',
+      },
+      { name: 'disabled', type: 'boolean', default: 'false', description: "The native disabled attribute: it can't be clicked or focused." },
+      {
+        name: 'asChild',
+        type: 'boolean',
+        default: 'false',
+        description: "Puts Button's classes on its one child (an <a>, a router link) instead of rendering a <button>.",
+      },
+      { name: 'children', type: 'ReactNode', description: 'The label.' },
+    ],
+    a11y: [
+      'Renders a native <button type="button">, so Enter and Space press it and it never submits a form by surprise.',
+      'loading sets aria-busy="true" and keeps the label, so screen readers still announce the action.',
+      'The focus ring comes from reset.css and nothing removes it.',
+      'A Button with only an icon needs an aria-label.',
+    ],
+    emptyChildrenError: 'A Button needs text or an aria-label, or screen readers announce just "button".',
+  },
 };
```

```diff
--- a/apps/gallery/src/manifests/card.ts
+++ b/apps/gallery/src/manifests/card.ts
@@ -15,4 +15,36 @@ export const card: Manifest = {
   ],
   parts: ['CardHeader', 'CardBody', 'CardFooter'],
   presets: [{ label: 'Outline', state: { variant: 'outline' } }],
+  docs: {
+    badges: ['Compound', 'Header, body, footer'],
+    usage: {
+      do: [
+        'Group one topic: a title in CardHeader, the content in CardBody, actions in CardFooter.',
+        'Use outline when the Card sits on another surface.',
+      ],
+      dont: [
+        'Put Cards inside Cards. Use Stack or Box for the space inside one.',
+        'Wrap a whole page in a Card.',
+      ],
+    },
+    props: [
+      {
+        name: 'variant',
+        className: 'bit-{variant}',
+        type: "'solid' | 'outline'",
+        default: "'solid'",
+        description: 'solid is a filled surface with a hard shadow; outline is a border only.',
+      },
+      {
+        name: 'children',
+        type: 'ReactNode',
+        description: 'The parts: CardHeader, CardBody and CardFooter, in that order. Each one is optional.',
+      },
+    ],
+    a11y: [
+      'A Card is a plain <div> and adds no role.',
+      'CardHeader is styled text. When the title belongs in the page outline, put a Heading inside it.',
+      'Actions in CardFooter are ordinary Buttons, in the Tab order where you read them.',
+    ],
+  },
 };
```

```diff
--- a/apps/gallery/src/manifests/code.ts
+++ b/apps/gallery/src/manifests/code.ts
@@ -9,4 +9,22 @@ export const code: Manifest = {
   description: 'Inline code: a small mono chip inside running text. The border follows the mode accent.',
   controls: [],
   children: 'color="danger"',
+  docs: {
+    badges: ['Inline <code>', 'Mono'],
+    usage: {
+      do: [
+        'Use Code for a prop, a value or a file name inside a sentence: color="danger".',
+        'Keep it to a few words.',
+      ],
+      dont: [
+        'Use Code for more than one line. Use CodeBlock.',
+        'Use Code for emphasis.',
+      ],
+    },
+    props: [{ name: 'children', type: 'ReactNode', description: 'The code, shown exactly as written.' }],
+    a11y: [
+      'A real <code> element; screen readers read it as part of the sentence.',
+      'The accent border follows the mode, and the text keeps full contrast in both modes.',
+    ],
+  },
 };
```

```diff
--- a/apps/gallery/src/manifests/codeBlock.ts
+++ b/apps/gallery/src/manifests/codeBlock.ts
@@ -20,4 +20,42 @@ export const codeBlock: Manifest = {
     { label: 'Shell', state: { language: 'shell', code: 'pnpm add @bit-ds/react' } },
     { label: 'No Copy button', state: { copy: false } },
   ],
+  docs: {
+    badges: ['Copy button', 'jsx · html · css · shell'],
+    usage: {
+      do: [
+        'Use CodeBlock for anything people should copy: install commands, snippets, config.',
+        'Give each CodeBlock a unique label when a page has several in the same language.',
+      ],
+      dont: [
+        'Use CodeBlock for a word or two in a sentence. Use Code.',
+        'Turn copy off on a snippet people are meant to paste.',
+      ],
+    },
+    props: [
+      { name: 'code', type: 'string', description: 'Required. The code, exactly as written; it is also what Copy copies.' },
+      {
+        name: 'language',
+        type: "'jsx' | 'html' | 'css' | 'shell'",
+        description: 'Required. Picks the syntax colors and the label in the bar.',
+      },
+      { name: 'copy', type: 'boolean', default: 'true', description: 'Shows the Copy button.' },
+      {
+        name: 'label',
+        type: 'string',
+        default: '`${language} code`',
+        description: 'The name of the code area, which is a region. Make it unique on the page.',
+      },
+      {
+        name: 'actions',
+        type: 'ReactNode',
+        description: "Extra controls in the bar, between the language label and Copy, such as the gallery's package-manager switcher.",
+      },
+    ],
+    a11y: [
+      'The code area is a named, focusable region, so keyboard users can scroll long lines.',
+      'Copy announces "Copied" or "Copy failed" through a hidden status line.',
+    ],
+  },
+  interactive: true,
 };
```

```diff
--- a/apps/gallery/src/manifests/field.ts
+++ b/apps/gallery/src/manifests/field.ts
@@ -19,4 +19,38 @@ export const field: Manifest = {
     { label: 'With an error', state: { error: 'Enter your email.' } },
     { label: 'Required', state: { required: true } },
   ],
+  docs: {
+    badges: ['Wires the ids', 'One Input or Select'],
+    usage: {
+      do: [
+        'Wrap every Input and Select in a Field, so it has a visible label.',
+        'Use hint for help that is always true, and error for what went wrong and how to fix it.',
+      ],
+      dont: [
+        'Wrap a Switch in a Field; Switch carries its own label.',
+        'Rely on the placeholder as the label. It disappears as soon as someone types.',
+      ],
+    },
+    props: [
+      { name: 'label', type: 'ReactNode', description: 'Required. The visible label, tied to the control with for and id.' },
+      { name: 'hint', type: 'ReactNode', description: 'Help text under the control, read as its description.' },
+      {
+        name: 'error',
+        type: 'ReactNode',
+        description: 'Shown under the control in danger text. It marks the control invalid and is read as its description.',
+      },
+      {
+        name: 'required',
+        type: 'boolean',
+        default: 'false',
+        description: 'Shows a "*" (hidden from screen readers) and passes required to the control.',
+      },
+      { name: 'children', type: 'ReactElement', description: 'Exactly one Input or Select.' },
+    ],
+    a11y: [
+      'The label points at the control, so clicking it focuses the control and screen readers read it.',
+      'hint and error are linked with aria-describedby, and error also sets aria-invalid on the control.',
+      'The ids come from useId, so two Fields on one page never clash.',
+    ],
+  },
 };
```

```diff
--- a/apps/gallery/src/manifests/heading.ts
+++ b/apps/gallery/src/manifests/heading.ts
@@ -15,4 +15,30 @@ export const heading: Manifest = {
   ],
   children: 'Build with bit',
   presets: [{ label: 'h2 that looks like h3', state: { level: '2', size: '3' } }],
+  docs: {
+    badges: ['h1 to h6', 'level ≠ look'],
+    usage: {
+      do: [
+        'Pick level for the outline: one h1 per page, then h2 for sections, h3 inside them.',
+        'Use size when a heading should look smaller than its level.',
+      ],
+      dont: [
+        'Skip levels (an h4 straight after the h1) to get a smaller look. Use size.',
+        'Use a bold Text where a heading belongs.',
+      ],
+    },
+    props: [
+      { name: 'level', type: '1 | 2 | 3 | 4 | 5 | 6', description: 'Required. Renders <h{level}>, so the page outline stays correct.' },
+      {
+        name: 'size',
+        type: '1 | 2 | 3 | 4 | 5 | 6',
+        description: 'The look, when it differs from level. Rendered as data-level; defaults to level.',
+      },
+      { name: 'children', type: 'ReactNode', description: 'The title.' },
+    ],
+    a11y: [
+      'Renders a real <h1> to <h6>; screen-reader users jump between headings to scan a page.',
+      'size changes only the look, so an h2 that looks like an h3 is still announced as level 2.',
+    ],
+  },
 };
```

- [ ] **Step 6: Run the gates and make commit 2**

Run: `pnpm build && pnpm verify && pnpm test && pnpm test:coverage && pnpm typecheck && pnpm lint && pnpm smoke && pnpm storybook:build`
Expected: all green; gallery `238` with T2.

```bash
git add apps/gallery/src/manifests
git commit -m "docs(gallery): docs for Alert, Badge, BitLogo, Box, Button, Card, Code, CodeBlock, Field and Heading

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3b: Docs for the other ten manifests

**Files:**
- Modify: `input.ts`, `link.ts`, `modeToggle.ts`, `segmentedControl.ts`, `select.ts`, `spinner.ts`, `stack.ts`, `switch.ts`, `table.ts` and `text.ts`, all in `apps/gallery/src/manifests/`

**Interfaces:**
- **Consumes:** T3a commit 1: `ManifestDocs`, `PropDoc.className`, `Manifest.interactive`, and the contract tests over `DOCUMENTED`.
- **Produces:**
  - docs on its ten manifests
  - `interactive: true` on ModeToggle
  - `emptyChildrenError` on Link and Switch

- [ ] **Step 1: Confirm that T3a's type commit is on your base**

T3b starts only after the controller has merged T3a commit 1. Check that it is there:

Run: `grep -n "className?: string" apps/gallery/src/manifests/types.ts && grep -n "const DOCUMENTED" apps/gallery/src/manifests/manifests.test.ts`
Expected: one line from each file. If either is missing, stop and ask the controller to merge T3a commit 1.

Do not edit `types.ts` or `manifests.test.ts`.

- [ ] **Step 2: Write the docs**

Each manifest gets a `docs` block as its last property. Write the text for a reader new to design systems.
- Axis prop rows carry `className`.
- ModeToggle also gets `interactive: true`.
- Link and Switch carry an empty-children error.

```diff
--- a/apps/gallery/src/manifests/input.ts
+++ b/apps/gallery/src/manifests/input.ts
@@ -20,4 +20,38 @@ export const input: Manifest = {
     { label: 'Search', state: { type: 'search', 'aria-label': 'Search', placeholder: 'Search components' } },
     { label: 'Disabled', state: { disabled: true } },
   ],
+  docs: {
+    badges: ['Native <input>', 'Recessed'],
+    usage: {
+      do: [
+        'Put Input in a Field for a visible label, a hint and an error.',
+        'Pick the type that matches the data (email, search, password), so phones show the right keyboard.',
+      ],
+      dont: [
+        'Use an Input with no Field and no aria-label: screen readers would announce just "edit text".',
+        'Use the placeholder for instructions; it disappears as soon as someone types.',
+      ],
+    },
+    props: [
+      { name: 'size', className: 'bit-{size}', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Control height.' },
+      { name: 'type', type: "'text' | 'email' | 'search' | 'password' | …", default: "'text'", description: 'The native input type.' },
+      {
+        name: 'aria-label',
+        type: 'string',
+        description: "Names the input when there's no visible label. Inside a Field, leave it off: the Field's label names it.",
+      },
+      { name: 'placeholder', type: 'string', description: 'An example value shown while the input is empty.' },
+      {
+        name: 'invalid',
+        type: 'boolean',
+        default: 'false',
+        description: 'Marks the value wrong: aria-invalid="true" and a danger border. A Field with an error does the same.',
+      },
+      { name: 'disabled', type: 'boolean', default: 'false', description: "The native disabled attribute: it can't be edited or focused." },
+    ],
+    a11y: [
+      'A real <input>, so typing, autofill and the keyboard work as browsers intend.',
+      "Inside a Field it takes the Field's id, hint and error, so screen readers read all three.",
+    ],
+  },
 };
```

```diff
--- a/apps/gallery/src/manifests/link.ts
+++ b/apps/gallery/src/manifests/link.ts
@@ -13,4 +13,39 @@ export const link: Manifest = {
   ],
   children: 'Read the install guide',
   presets: [{ label: 'Neutral', state: { color: 'neutral' } }],
+  docs: {
+    badges: ['Native <a>', 'asChild for router links'],
+    usage: {
+      do: [
+        'Use a Link to go somewhere: another page, a section, a site.',
+        'Write link text that makes sense alone: "Read the install guide", not "click here".',
+      ],
+      dont: [
+        'Use a Link for an action that changes something. Use a Button.',
+        'Use color="neutral" for the only link in a paragraph; it hides among the text.',
+      ],
+    },
+    props: [
+      {
+        name: 'color',
+        className: 'bit-{color}',
+        type: "'primary' | 'neutral'",
+        default: "'primary'",
+        description: 'primary reads the link tokens (with a visited color); neutral is body text. Only these two pass contrast in both modes.',
+      },
+      { name: 'href', type: 'string', description: 'Where it goes.' },
+      {
+        name: 'asChild',
+        type: 'boolean',
+        default: 'false',
+        description: "Puts Link's classes on its one child, such as your router's link, instead of rendering an <a>.",
+      },
+      { name: 'children', type: 'ReactNode', description: 'The link text.' },
+    ],
+    a11y: [
+      'A real <a href>, so Enter follows it and screen readers list it with the other links.',
+      'Underlined as well as colored, so it reads as a link without relying on color.',
+    ],
+    emptyChildrenError: 'A Link needs text, or screen readers read out the address instead.',
+  },
 };
```

```diff
--- a/apps/gallery/src/manifests/modeToggle.ts
+++ b/apps/gallery/src/manifests/modeToggle.ts
@@ -8,4 +8,31 @@ export const modeToggle: Manifest = {
   component: ModeToggle,
   description: 'The light/dark switch. It follows your system until you click, then remembers. Try it: it switches this whole site.',
   controls: [{ kind: 'axis', prop: 'size', values: ['sm', 'md'], default: 'md' }],
+  docs: {
+    badges: ['Remembers the choice', 'Needs React'],
+    usage: {
+      do: [
+        'Put one ModeToggle in your header. Every ModeToggle on the page shares one store, so they always agree.',
+        'Inline COLOR_MODE_SCRIPT in your <head>, so a dark-mode visitor never sees a light flash.',
+      ],
+      dont: [
+        'Build your own light/dark switch beside it. Call useColorMode() when you need the mode in code.',
+        "Use it to switch themes. Light and dark are modes of one theme; themes are separate CSS files.",
+      ],
+    },
+    props: [
+      { name: 'size', className: 'bit-{size}', type: "'sm' | 'md'", default: "'md'", description: 'Control size.' },
+      {
+        name: 'aria-label',
+        type: 'string',
+        default: "'Color mode'",
+        description: "Names the group for screen readers. Change it only when the page's language isn't English.",
+      },
+    ],
+    a11y: [
+      'A labelled group of two real buttons, Light and Dark; the current one has aria-pressed="true".',
+      "It follows the visitor's system setting until they click, then remembers their choice.",
+    ],
+  },
+  interactive: true,
 };
```

```diff
--- a/apps/gallery/src/manifests/segmentedControl.ts
+++ b/apps/gallery/src/manifests/segmentedControl.ts
@@ -24,4 +24,40 @@ export const segmentedControl: Manifest = {
     { label: 'Success, small', state: { color: 'success', size: 'sm' } },
     { label: 'Hidden legend', state: { legendHidden: true } },
   ],
+  docs: {
+    badges: ['Native radios', 'Arrow keys'],
+    usage: {
+      do: [
+        'Use SegmentedControl to pick one of two to four options that should all be visible.',
+        'Give it a legend that names the choice; hide it with legendHidden when the context says it.',
+      ],
+      dont: [
+        'Use it for five or more options. Use a Select.',
+        'Use it for on and off. Use a Switch.',
+      ],
+    },
+    props: [
+      { name: 'legend', type: 'ReactNode', description: 'Required. Names the group; read by screen readers even when hidden.' },
+      {
+        name: 'color',
+        className: 'bit-{color}',
+        type: "'primary' | 'neutral' | 'success' | 'warning' | 'danger'",
+        default: "'primary'",
+        description: 'The fill of the chosen option.',
+      },
+      { name: 'size', className: 'bit-{size}', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Segment height.' },
+      { name: 'legendHidden', type: 'boolean', default: 'false', description: 'Hides the legend from sight. It is still read.' },
+      { name: 'options', type: 'readonly { value: string; label: ReactNode; disabled?: boolean }[]', description: 'Required. The choices, in order.' },
+      {
+        name: 'value',
+        type: 'string',
+        description: 'The chosen value, when the parent owns it. Use with onValueChange, or use defaultValue.',
+      },
+      { name: 'onValueChange', type: '(value: string) => void', description: 'Called with the new value when the choice changes.' },
+    ],
+    a11y: [
+      'Native radios in a fieldset, so Tab enters and leaves the group in one stop and the arrow keys move the choice.',
+      'The legend names the group for screen readers, even when legendHidden hides it from sight.',
+    ],
+  },
 };
```

```diff
--- a/apps/gallery/src/manifests/select.ts
+++ b/apps/gallery/src/manifests/select.ts
@@ -23,4 +23,37 @@ export const select: Manifest = {
     { label: 'Small', state: { size: 'sm' } },
     { label: 'Disabled', state: { disabled: true } },
   ],
+  docs: {
+    badges: ['Native <select>', 'Native options list'],
+    usage: {
+      do: [
+        'Use Select to pick one of five or more options. Put it in a Field for a visible label.',
+        'Use SegmentedControl instead when there are two to four options and all should show.',
+      ],
+      dont: [
+        'Use a Select for yes or no. Use a Switch.',
+        'Use a Select to navigate to another page.',
+      ],
+    },
+    props: [
+      { name: 'size', className: 'bit-{size}', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Control height. The class goes on the wrapper.' },
+      {
+        name: 'aria-label',
+        type: 'string',
+        description: "Names the select when there's no visible label. Inside a Field, leave it off.",
+      },
+      {
+        name: 'invalid',
+        type: 'boolean',
+        default: 'false',
+        description: 'Marks the choice wrong: aria-invalid="true" and a danger border.',
+      },
+      { name: 'disabled', type: 'boolean', default: 'false', description: 'The native disabled attribute.' },
+      { name: 'children', type: 'ReactNode', description: 'The <option> elements.' },
+    ],
+    a11y: [
+      "The browser's own <select> and options list, so every keyboard and screen reader already knows it.",
+      "Inside a Field it takes the Field's id, hint and error.",
+    ],
+  },
 };
```

```diff
--- a/apps/gallery/src/manifests/spinner.ts
+++ b/apps/gallery/src/manifests/spinner.ts
@@ -13,4 +13,32 @@ export const spinner: Manifest = {
     { kind: 'text', prop: 'aria-label', default: 'Loading coins', label: 'aria-label' },
   ],
   presets: [{ label: 'Large neutral', state: { color: 'neutral', size: 'lg' } }],
+  docs: {
+    badges: ['role="status"', 'aria-label required'],
+    usage: {
+      do: [
+        "Show a Spinner when something takes more than a moment and you can't say how long.",
+        'Say what is loading in its aria-label: "Loading coins".',
+      ],
+      dont: [
+        'Show a Spinner for a wait under 300ms; it only flashes.',
+        "Put a Spinner inside a Button. Use the Button's loading prop.",
+      ],
+    },
+    props: [
+      {
+        name: 'color',
+        className: 'bit-{color}',
+        type: "'primary' | 'neutral' | 'success' | 'warning' | 'danger'",
+        default: "'primary'",
+        description: 'The color role.',
+      },
+      { name: 'size', className: 'bit-{size}', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Diameter.' },
+      { name: 'aria-label', type: 'string', description: 'Required. What screen readers announce, such as "Loading coins".' },
+    ],
+    a11y: [
+      'role="status" and the required aria-label, so screen readers announce what is loading.',
+      'The spin stops for people who ask their system to reduce motion.',
+    ],
+  },
 };
```

```diff
--- a/apps/gallery/src/manifests/stack.ts
+++ b/apps/gallery/src/manifests/stack.ts
@@ -23,4 +23,41 @@ export const stack: Manifest = {
     { label: 'Row, centered', state: { direction: 'row', align: 'center', gap: '16' } },
     { label: 'Row, space between', state: { direction: 'row', justify: 'between' } },
   ],
+  docs: {
+    badges: ['Layout', 'Data attributes, no classes'],
+    usage: {
+      do: [
+        'Use Stack for the space between things: a column of fields, a row of Buttons.',
+        'Pick gap from the space scale: 8 inside a group, 16 to 24 between groups.',
+      ],
+      dont: [
+        "Add margins to the children to space them. That's what gap is for.",
+        'Use Stack to pad one element. Use Box.',
+      ],
+    },
+    props: [
+      { name: 'direction', type: "'column' | 'row'", default: "'column'", description: 'Which way the children run.' },
+      {
+        name: 'gap',
+        type: '4 | 8 | 12 | 16 | 24 | 32 | 48 | 64',
+        default: '12',
+        description: 'Space between children in px. Rendered as data-gap; reads --bit-space-{gap}px.',
+      },
+      {
+        name: 'align',
+        type: "'stretch' | 'start' | 'center' | 'end'",
+        description: 'Cross-axis alignment: left to right in a column, top to bottom in a row. Unset, children stretch.',
+      },
+      {
+        name: 'justify',
+        type: "'start' | 'center' | 'end' | 'between'",
+        description: 'Main-axis alignment. between pushes the first and last children to the ends.',
+      },
+      { name: 'wrap', type: 'boolean', default: 'false', description: 'Lets a row wrap onto more lines when it runs out of room.' },
+    ],
+    a11y: [
+      'A Stack is a plain <div> and adds no role; screen readers read the children in source order.',
+      'direction="row" never reorders anything, so the Tab order always matches what people see.',
+    ],
+  },
 };
```

```diff
--- a/apps/gallery/src/manifests/switch.ts
+++ b/apps/gallery/src/manifests/switch.ts
@@ -17,4 +17,32 @@ export const switchManifest: Manifest = {
     { label: 'Small', state: { size: 'sm' } },
     { label: 'Disabled', state: { disabled: true } },
   ],
+  docs: {
+    badges: ['role="switch"', 'Own label'],
+    usage: {
+      do: [
+        'Use a Switch for a setting that takes effect at once: "Sound", "Wi-Fi".',
+        'Write the label as the thing being turned on, not a question.',
+      ],
+      dont: [
+        'Use a Switch in a form that needs a Submit; a checkbox says "this is part of the form" better.',
+        'Wrap it in a Field; it carries its own label.',
+      ],
+    },
+    props: [
+      { name: 'size', className: 'bit-{size}', type: "'sm' | 'md'", default: "'md'", description: 'Track size. The class goes on the label.' },
+      { name: 'disabled', type: 'boolean', default: 'false', description: "The native disabled attribute: it can't be toggled or focused." },
+      {
+        name: 'checked',
+        type: 'boolean',
+        description: 'On or off, when the parent owns the value. Pair it with onChange, or use defaultChecked.',
+      },
+      { name: 'children', type: 'ReactNode', description: 'The visible label.' },
+    ],
+    a11y: [
+      'A real checkbox with role="switch", so screen readers say "switch, on" or "switch, off".',
+      'Clicking the label toggles it, and Space toggles it from the keyboard.',
+    ],
+    emptyChildrenError: 'A Switch needs a label, or screen readers announce just "switch, off".',
+  },
 };
```

```diff
--- a/apps/gallery/src/manifests/table.ts
+++ b/apps/gallery/src/manifests/table.ts
@@ -48,4 +48,34 @@ export const table: Manifest = {
   ],
   parts: ['TableHead', 'TableBody', 'TableRow', 'TableCell'],
   presets: [{ label: 'Striped', state: { striped: true } }],
+  docs: {
+    badges: ['Native <table>', 'Scrolls sideways'],
+    usage: {
+      do: [
+        'Use a Table for data people compare across rows: props, prices, scores.',
+        'Give it an aria-label or aria-labelledby, so its scroll area is a named region.',
+      ],
+      dont: [
+        'Use a Table for layout. Use Stack or a grid.',
+        'Leave out TableHead; the head cells tell screen readers what each column is.',
+      ],
+    },
+    props: [
+      { name: 'striped', type: 'boolean', default: 'false', description: 'Shades every other body row. Rendered as data-striped.' },
+      {
+        name: 'aria-label',
+        type: 'string',
+        description: 'Names the table and its scroll area, which then becomes a region screen readers can jump to.',
+      },
+      {
+        name: 'children',
+        type: 'ReactNode',
+        description: 'TableHead and TableBody, with TableRows of TableCells. Cells are th in the head and td in the body.',
+      },
+    ],
+    a11y: [
+      'A native <table>, so screen readers announce rows, columns and the head cell for each value.',
+      'The frame scrolls sideways when the table is wider than the screen, and it is focusable, so the keyboard can scroll it too.',
+    ],
+  },
 };
```

```diff
--- a/apps/gallery/src/manifests/text.ts
+++ b/apps/gallery/src/manifests/text.ts
@@ -18,4 +18,43 @@ export const text: Manifest = {
     { label: 'Display heading', state: { as: 'h2', size: '32' } },
     { label: 'Muted caption', state: { size: '13', color: 'neutral' } },
   ],
+  docs: {
+    badges: ['Typography', 'size in px'],
+    usage: {
+      do: [
+        'Use Text for body copy, labels and captions; pick the look with size.',
+        'Use color="neutral" for hints and captions that should step back.',
+      ],
+      dont: [
+        'Use Text as="h2" for a section title. Use Heading, which requires a level.',
+        'Use size to make body text tiny; 13 is the smallest for reading.',
+      ],
+    },
+    props: [
+      {
+        name: 'as',
+        type: "'p' | 'span' | 'div' | 'label' | 'h1' | … | 'h6'",
+        default: "'p'",
+        description: 'Which element to render. The look comes from size, not from the tag.',
+      },
+      {
+        name: 'size',
+        type: '11 | 13 | 15 | 18 | 24 | 32',
+        default: '15',
+        description: 'Size in px. Rendered as data-size; reads --bit-text-{size}px. 24 and 32 use the display face.',
+      },
+      { name: 'color', type: "'neutral'", description: 'neutral renders muted text. Leave it off for the normal text color.' },
+      {
+        name: 'weight',
+        type: "'normal' | 'bold'",
+        default: "'normal'",
+        description: 'Rendered as data-weight. No effect at 24 and 32, where the display face has one weight.',
+      },
+      { name: 'children', type: 'ReactNode', description: 'The text.' },
+    ],
+    a11y: [
+      'Text renders the element you choose, so as="p" is a paragraph to screen readers.',
+      'A big Text is still not a heading. Screen-reader users move through a page by its headings, so titles need Heading.',
+    ],
+  },
 };
```

- [ ] **Step 3: Run the contract and confirm it holds**

Run: `pnpm build && pnpm --filter @bit-ds/gallery test -- manifests`
Expected: PASS. The three `DOCUMENTED` contract tests now check these ten manifests too.

These are TDD's red and green for data. To see the contract catch a mistake, delete one Don't line from any of your manifests and run it again: it fails with `<Name> dont`. Then put the line back.

- [ ] **Step 4: Run every gate**

Run: `pnpm build && pnpm verify && pnpm test && pnpm test:coverage && pnpm typecheck && pnpm lint && pnpm smoke && pnpm storybook:build`
Expected: all green; gallery `236` on T3a commit 1 with T2 (T3b adds no tests).

- [ ] **Step 5: Commit**

```bash
git add apps/gallery/src/manifests
git commit -m "docs(gallery): docs for Input, Link, ModeToggle, SegmentedControl, Select, Spinner, Stack, Switch, Table and Text

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3c: Join: `docs` required, one contract test per manifest

Run this after T3a (both commits) and T3b are merged. It is a single commit.

**Files:**
- Modify: `apps/gallery/src/manifests/types.ts` and `apps/gallery/src/manifests/manifests.test.ts`

**Interfaces:**
- **Consumes:** all 20 manifests with docs.
- **Produces:** `Manifest.docs: ManifestDocs`, now required. T4 reads `manifest.docs.*` without `?.`.

- [ ] **Step 1: Write the per-manifest contract and the cross-half checks**

In `apps/gallery/src/manifests/manifests.test.ts`, replace the three `DOCUMENTED` tests with one test per manifest, and add the empty-children list and the interactive list:

```diff
--- a/apps/gallery/src/manifests/manifests.test.ts
+++ b/apps/gallery/src/manifests/manifests.test.ts
@@ -10,7 +10,7 @@ import { box } from './box';
 import { button } from './button';
 import { codeBlock } from './codeBlock';
 import { toJsx } from '../code/toJsx';
-import type { ChildSpec, ControlState, Manifest, ManifestDocs } from './types';
+import type { ChildSpec, ControlState } from './types';
 
 /** ChildSpec names, nested parts included, that are neither a registered component nor an allowed HTML element. */
 function unknownChildren(children: readonly ChildSpec[]): string[] {
@@ -31,9 +31,6 @@ const COMPONENT_EXPORTS = Object.keys(lib)
   .filter((name) => /^[A-Z][a-z]/.test(name))
   .sort();
 
-/** The manifests that have docs so far. T3c replaces this with every manifest, once docs are required. */
-const DOCUMENTED = MANIFESTS.filter((m): m is Manifest & { docs: ManifestDocs } => m.docs !== undefined);
-
 /** Compound parts are documented on their parent's page, not their own. */
 const PARTS = MANIFESTS.flatMap((m) => m.parts ?? []);
 
@@ -160,41 +157,49 @@ describe('manifest contract', () => {
     }
   });
 
-  it('documented manifests have complete docs: at least one Do, one Don\'t, one prop and one a11y line, none blank', () => {
-    for (const m of DOCUMENTED) {
+  it.each(MANIFESTS.map((m) => [m.name, m] as const))(
+    '%s has complete docs: at least one Do, one Don\'t, one prop and one a11y line, none blank',
+    (_name, m) => {
       const { usage, props, a11y, badges } = m.docs;
-      expect(usage.do.length, `${m.name} do`).toBeGreaterThan(0);
-      expect(usage.dont.length, `${m.name} dont`).toBeGreaterThan(0);
-      expect(props.length, `${m.name} props`).toBeGreaterThan(0);
-      expect(a11y.length, `${m.name} a11y`).toBeGreaterThan(0);
+      expect(usage.do.length, 'do').toBeGreaterThan(0);
+      expect(usage.dont.length, 'dont').toBeGreaterThan(0);
+      expect(props.length, 'props').toBeGreaterThan(0);
+      expect(a11y.length, 'a11y').toBeGreaterThan(0);
       const lines = [...badges, ...usage.do, ...usage.dont, ...a11y, ...props.flatMap((p) => [p.name, p.type, p.description])];
-      expect(lines.filter((line) => line.trim() === ''), m.name).toEqual([]);
-    }
+      expect(lines.filter((line) => line.trim() === '')).toEqual([]);
+    },
+  );
+
+  it.each(MANIFESTS.map((m) => [m.name, m] as const))('%s documents every prop its controls expose, once', (_name, m) => {
+    const documented = m.docs.props.map((p) => p.name);
+    expect(new Set(documented).size, 'duplicate prop rows').toBe(documented.length);
+    expect(m.controls.map((c) => c.prop).filter((prop) => !documented.includes(prop))).toEqual([]);
   });
 
-  it('documented manifests document every prop their controls expose, once', () => {
-    for (const m of DOCUMENTED) {
-      const documented = m.docs.props.map((p) => p.name);
-      expect(new Set(documented).size, `${m.name} duplicate prop rows`).toBe(documented.length);
-      expect(m.controls.map((c) => c.prop).filter((prop) => !documented.includes(prop)), m.name).toEqual([]);
+  it.each(MANIFESTS.map((m) => [m.name, m] as const))('%s gives every axis prop row its bit-{prop} class, and no other row one', (_name, m) => {
+    const axes = new Set<string>(m.controls.filter((c) => c.kind === 'axis').map((c) => c.prop));
+    for (const row of m.docs.props) {
+      expect(row.className, row.name).toBe(axes.has(row.name) ? `bit-{${row.name}}` : undefined);
     }
   });
 
-  it('documented manifests give every axis prop row its bit-{prop} class, and no other row one', () => {
-    for (const m of DOCUMENTED) {
-      const axes = new Set<string>(m.controls.filter((c) => c.kind === 'axis').map((c) => c.prop));
-      for (const row of m.docs.props) {
-        expect(row.className, `${m.name}.${row.name}`).toBe(axes.has(row.name) ? `bit-{${row.name}}` : undefined);
-      }
+  it('only manifests with a children text control carry an empty-children error', () => {
+    for (const m of MANIFESTS) {
+      if (m.docs.emptyChildrenError !== undefined) expect(typeof m.children, m.name).toBe('string');
     }
+    expect(MANIFESTS.filter((m) => m.docs.emptyChildrenError).map((m) => m.name)).toEqual(['Button', 'Link', 'Switch']);
   });
 
-  it("Button's empty-children error is the §E text", () => {
-    expect(button.docs?.emptyChildrenError).toBe('A Button needs text or an aria-label, or screen readers announce just "button".');
+  it('Button\'s empty-children error is the §E text', () => {
+    expect(button.docs.emptyChildrenError).toBe('A Button needs text or an aria-label, or screen readers announce just "button".');
   });
 
   it('CodeBlock documents its actions slot', () => {
-    expect(codeBlock.docs?.props.find((p) => p.name === 'actions')?.type).toBe('ReactNode');
+    expect(codeBlock.docs.props.find((p) => p.name === 'actions')?.type).toBe('ReactNode');
+  });
+
+  it('only ModeToggle and CodeBlock are interactive (no HTML tab): they need React to work', () => {
+    expect(MANIFESTS.filter((m) => m.interactive).map((m) => m.name)).toEqual(['ModeToggle', 'CodeBlock']);
   });
 
   it('groups are the sidebar groups, and only the logo is brand', () => {
```

- [ ] **Step 2: Make `docs` required**

```diff
--- a/apps/gallery/src/manifests/types.ts
+++ b/apps/gallery/src/manifests/types.ts
@@ -112,11 +112,8 @@ export interface Manifest {
   presets?: readonly Preset[];
   /** Compound parts documented on this page; the import line lists them. */
   parts?: readonly string[];
-  /**
-   * Page content beyond the playground: badges, usage, props and accessibility. Optional only until T3a and
-   * T3b have written every manifest's docs; T3c makes it required.
-   */
-  docs?: ManifestDocs;
+  /** Page content beyond the playground: badges, usage, props and accessibility. */
+  docs: ManifestDocs;
   /**
    * The component needs React to work (state, storage, the clipboard), so its page offers React code only.
    * Every other component's markup works as plain HTML with bit's CSS, and its page offers an HTML tab.
```

- [ ] **Step 3: Run every gate**

Run: `pnpm build && pnpm verify && pnpm test && pnpm test:coverage && pnpm typecheck && pnpm lint && pnpm smoke && pnpm storybook:build`
Expected: all green; gallery `297`. That is 59 more than before: four `it.each` blocks over 20 manifests, the two list tests, less the three `DOCUMENTED` tests.

- [ ] **Step 4: Commit**

```bash
git add apps/gallery/src/manifests
git commit -m "feat(gallery): manifest docs required; the contract runs per manifest

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: The layout-C ComponentPage (spec §3, Amendment 1 §1–2)

**Files** (paths under `apps/gallery/src/`):
- Create:
  - `code/toHtml.ts`, `code/toHtml.test.tsx`, `code/fullFile.ts` and `code/fullFile.test.ts`
  - `code/codeFormats.ts`, `code/CodePanel.tsx`, `code/CodePanel.test.tsx` and `code/toJsx.className.test.tsx`
  - `engine/VariantsTable.tsx` and `engine/VariantsTable.test.tsx`
  - `pages/component/ComponentHeader.tsx`, `pages/component/DocsSections.tsx`, `pages/component/Playground.tsx` and `pages/component/sections.ts`
  - `pages/ComponentPage.test.tsx`
- Modify:
  - `code/toJsx.ts`
  - `engine/Presets.tsx`, `engine/Preview.tsx` and `engine/ControlsPanel.tsx`, with their tests
  - `pages/ComponentPage.tsx`
  - `routes.test.tsx` and `routes.dark.test.tsx`
  - `gallery.css` (the component-page section) and `gallery-css.test.ts`
- Delete: `engine/Matrix.tsx` and `engine/Matrix.test.tsx`

**Interfaces:**
- **Consumes:**
  - **From T2:** `PageHeader`, `PageSection`, `SectionBar`, `SectionLink`, `CopyButton`, `STYLE_IMPORTS`, and `useControlState` (`ControlStateApi`)
  - **From T3c:** the required `Manifest.docs`, `Manifest.interactive` and `PropDoc.className`
- **Produces:**
  - **Code output:**
    - `toJsx(manifest, state, options?: { decorators?: 'props' | 'className' })`
    - `toHtml(element)` and `prettyHtml(html)`
    - `fullFile(jsx)` and `STYLE_COMMENT`
    - `CODE_FORMATS: readonly CodeFormat[]` and `codeFor(format, manifest, state, wholeFile)`
  - **Page logic:**
    - `variantAxes(manifest): { row?: AxisControl; column: AxisControl } | null`
    - `isPresetActive(preset, state)`
    - `PROP_COLUMNS`, `classTip(manifest)` and `importChip(manifest)`
    - `SECTIONS` and `componentSections(manifest)`
  - **Section ids:** `section-playground`, `section-variants`, `section-usage`, `section-props` and `section-accessibility`

- [ ] **Step 1: Write the failing code tests**

Create `apps/gallery/src/code/toHtml.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { prettyHtml, toHtml } from './toHtml';
import { renderManifest } from '../engine/renderManifest';
import { defaultState } from '../engine/state';
import { button } from '../manifests/button';
import { card } from '../manifests/card';
import { input } from '../manifests/input';
import { select } from '../manifests/select';

describe('prettyHtml', () => {
  it('puts one element per line with two-space indents and keeps text-only elements on one line', () => {
    expect(prettyHtml('<div class="a"><span>hi</span><p>there</p></div>')).toBe(
      '<div class="a">\n  <span>hi</span>\n  <p>there</p>\n</div>',
    );
  });

  it('void and self-closed elements take one line and no closing tag', () => {
    expect(prettyHtml('<label>Name<input type="text"/></label><br/>')).toBe('<label>Name\n  <input type="text"/>\n</label>\n<br/>');
  });
});

describe('toHtml', () => {
  it("prints the preview's element: Button's classes, type and label", () => {
    expect(toHtml(renderManifest(button, { ...defaultState(button), color: 'danger' }))).toBe(
      '<button class="bit-button bit-danger bit-solid bit-md" type="button">Save</button>',
    );
  });

  it('prints compound parts nested and indented', () => {
    expect(toHtml(renderManifest(card, defaultState(card)))).toBe(
      [
        '<div class="bit-card bit-solid">',
        '  <div class="bit-card__header">Stats</div>',
        '  <div class="bit-card__body">3 coins collected</div>',
        '  <div class="bit-card__footer">Updated today</div>',
        '</div>',
      ].join('\n'),
    );
  });

  it('prints plain HTML children (Select options) and void elements (Input)', () => {
    expect(toHtml(renderManifest(select, defaultState(select)))).toContain('  <option value="success">success</option>');
    expect(toHtml(renderManifest(input, defaultState(input)))).toMatch(/^<input class="bit-input bit-md"[^>]*\/>$/);
  });

  it('escapes markup typed into the children control', () => {
    expect(toHtml(renderManifest(button, { ...defaultState(button), children: '<b>"hi"</b>' }))).toContain(
      '>&lt;b&gt;&quot;hi&quot;&lt;/b&gt;</button>',
    );
  });
});
```

Create `apps/gallery/src/code/fullFile.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { fullFile, STYLE_COMMENT } from './fullFile';
import { STYLE_IMPORTS } from '../content/styleImports';
import { toJsx } from './toJsx';
import { defaultState } from '../engine/state';
import { card } from '../manifests/card';

describe('fullFile', () => {
  it('wraps a one-line element in the style imports, the component import and an Example component', () => {
    expect(fullFile("import { Button } from '@bit-ds/react';\n\n<Button>Save</Button>")).toBe(
      [
        STYLE_COMMENT,
        "import '@bit-ds/react/themes/power-up.css';",
        "import '@bit-ds/react/styles.css';",
        "import { Button } from '@bit-ds/react';",
        '',
        'export function Example() {',
        '  return (',
        '    <Button>Save</Button>',
        '  );',
        '}',
        '',
      ].join('\n'),
    );
  });

  it('puts the theme first (its font @import must lead the CSS) and says the styles go in once', () => {
    const file = fullFile(toJsx(card, defaultState(card)));
    expect(file.startsWith(`// once per app: skip if already in your entry file\n${STYLE_IMPORTS}\n`)).toBe(true);
  });

  it('indents every line of a multi-line element inside return ( … )', () => {
    const file = fullFile(toJsx(card, defaultState(card)));
    expect(file).toContain('  return (\n    <Card>\n      <CardHeader>Stats</CardHeader>\n');
    expect(file).toContain('      <CardFooter>Updated today</CardFooter>\n    </Card>\n  );\n}\n');
  });
});
```

Create `apps/gallery/src/code/toJsx.className.test.tsx`. Its round trip covers every non-default value of every axis on every manifest, 41 cases:

```tsx
import { createElement } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { toJsx } from './toJsx';
import { defaultState } from '../engine/state';
import { buildProps } from '../engine/buildProps';
import { renderManifest } from '../engine/renderManifest';
import { MANIFESTS } from '../manifests';
import { button } from '../manifests/button';
import { segmentedControl } from '../manifests/segmentedControl';
import { stack } from '../manifests/stack';
import type { AxisControl, ControlState, Manifest } from '../manifests/types';

const AS_CLASSES = { decorators: 'className' } as const;

describe("toJsx with { decorators: 'className' } (Amendment 1)", () => {
  it('prints the changed axes as one className, in control order, and leaves their props out', () => {
    expect(toJsx(button, { ...defaultState(button), color: 'danger', variant: 'outline' }, AS_CLASSES)).toBe(
      "import { Button } from '@bit-ds/react';\n\n<Button className=\"bit-danger bit-outline\">Save</Button>",
    );
  });

  it('with every axis at its default it prints no className, the same as Props mode', () => {
    expect(toJsx(button, defaultState(button), AS_CLASSES)).toBe(toJsx(button, defaultState(button)));
  });

  it('keeps every other prop where Props mode prints it', () => {
    expect(toJsx(button, { ...defaultState(button), size: 'lg', loading: true }, AS_CLASSES)).toContain(
      '<Button className="bit-lg" loading>Save</Button>',
    );
    expect(toJsx(segmentedControl, { ...defaultState(segmentedControl), color: 'success' }, AS_CLASSES)).toContain(
      '<SegmentedControl legend="Range" className="bit-success" options=',
    );
  });

  it('a manifest with no axis prints exactly what Props mode does', () => {
    const state = { ...defaultState(stack), gap: '24' };
    expect(toJsx(stack, state, AS_CLASSES)).toBe(toJsx(stack, state));
  });
});

/** The className the className-mode snippet prints, or undefined when it prints none. */
const printedClassName = (manifest: Manifest, state: ControlState) => /className="([^"]*)"/.exec(toJsx(manifest, state, AS_CLASSES))?.[1];

/** The element the className-mode snippet describes: the changed axis props swapped for its className. */
function classNameElement(manifest: Manifest, state: ControlState): ReactElement {
  const defaults = defaultState(manifest);
  const changedAxis = (prop: string) => manifest.controls.some((c) => c.kind === 'axis' && c.prop === prop && state[prop] !== defaults[prop]);
  const props = Object.fromEntries(Object.entries(buildProps(manifest, state)).filter(([prop]) => !changedAxis(prop)));
  const { children } = renderManifest(manifest, state).props as { children?: ReactNode };
  return createElement(manifest.component, { ...props, className: printedClassName(manifest, state) }, children);
}

const rootClasses = (element: ReactElement) => {
  const { container, unmount } = render(element);
  const classes = [...container.firstElementChild!.classList].sort();
  unmount();
  return classes;
};

const AXIS_CASES = MANIFESTS.flatMap((manifest) =>
  manifest.controls
    .filter((c): c is AxisControl => c.kind === 'axis')
    .flatMap((axis) =>
      axis.values.filter((v) => v !== axis.default).map((value) => [manifest.name, axis.prop, value, manifest] as const),
    ),
);

describe('className mode round trip', () => {
  it.each(AXIS_CASES)('%s %s="%s": the className snippet renders the same root classes as the props snippet', (_n, prop, value, manifest) => {
    const state = { ...defaultState(manifest), [prop]: value };
    expect(printedClassName(manifest, state)).toBe(`bit-${value}`);
    expect(rootClasses(classNameElement(manifest, state))).toEqual(rootClasses(renderManifest(manifest, state)));
  });
});
```

Create `apps/gallery/src/code/CodePanel.test.tsx`:

```tsx
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { CodePanel } from './CodePanel';
import { CODE_FORMATS } from './codeFormats';
import { defaultState } from '../engine/state';
import { button } from '../manifests/button';
import { code as codeManifest } from '../manifests/code';
import { modeToggle } from '../manifests/modeToggle';
import { stack } from '../manifests/stack';
import { codeBlock } from '../manifests/codeBlock';
import { expectNoA11yViolations } from '../test/a11y';

const shown = () => screen.getByRole('region', { name: 'Example code' }).textContent;
const formatNames = () =>
  within(screen.getByRole('group', { name: 'Code format' }))
    .getAllByRole('radio')
    .map((radio) => radio.closest('label')!.textContent);

afterEach(() => {
  Reflect.deleteProperty(navigator, 'clipboard');
});

describe('CodePanel', () => {
  it('starts on Props: the toJsx snippet in a jsx CodeBlock named "Example code"', async () => {
    const { container } = render(<CodePanel manifest={button} state={{ ...defaultState(button), color: 'danger' }} />);
    expect(screen.getByRole('radio', { name: 'Props' })).toBeChecked();
    expect(shown()).toBe("import { Button } from '@bit-ds/react';\n\n<Button color=\"danger\">Save</Button>");
    expect(container.querySelector('.bit-code__block')).toHaveAttribute('data-language', 'jsx');
    await expectNoA11yViolations(container);
  });

  it('className prints the changed axes as classes', async () => {
    render(<CodePanel manifest={button} state={{ ...defaultState(button), color: 'danger', variant: 'outline' }} />);
    await userEvent.click(screen.getByRole('radio', { name: 'className' }));
    expect(shown()).toBe("import { Button } from '@bit-ds/react';\n\n<Button className=\"bit-danger bit-outline\">Save</Button>");
  });

  it('HTML shows the markup the preview renders, and hides the Full file switch', async () => {
    const { container } = render(<CodePanel manifest={button} state={defaultState(button)} />);
    await userEvent.click(screen.getByRole('radio', { name: 'HTML' }));
    expect(shown()).toBe('<button class="bit-button bit-primary bit-solid bit-md" type="button">Save</button>');
    expect(container.querySelector('.bit-code__block')).toHaveAttribute('data-language', 'html');
    expect(screen.queryByRole('switch', { name: 'Full file' })).toBeNull();
  });

  it('Full file wraps Props and className code alike', async () => {
    render(<CodePanel manifest={button} state={{ ...defaultState(button), color: 'danger' }} />);
    await userEvent.click(screen.getByRole('switch', { name: 'Full file' }));
    expect(shown()).toContain("// once per app: skip if already in your entry file\nimport '@bit-ds/react/themes/power-up.css';");
    expect(shown()).toContain('export function Example() {\n  return (\n    <Button color="danger">Save</Button>\n  );\n}');
    await userEvent.click(screen.getByRole('radio', { name: 'className' }));
    expect(shown()).toContain('    <Button className="bit-danger">Save</Button>\n');
  });

  it('Copy copies whichever mode is showing', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    render(<CodePanel manifest={button} state={{ ...defaultState(button), size: 'lg' }} />);
    await userEvent.click(screen.getByRole('radio', { name: 'className' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    });
    expect(writeText).toHaveBeenCalledWith("import { Button } from '@bit-ds/react';\n\n<Button className=\"bit-lg\">Save</Button>");
  });

  it.each([
    ['Button (axes, static)', button, ['Props', 'className', 'HTML']],
    ['ModeToggle (an axis, interactive)', modeToggle, ['Props', 'className']],
    ['Code (no axis, static)', codeManifest, ['Props', 'HTML']],
  ] as const)('%s offers %j', (_name, manifest, formats) => {
    render(<CodePanel manifest={manifest} state={defaultState(manifest)} />);
    expect(formatNames()).toEqual(formats);
  });

  it('CodeBlock has no axis and is interactive: only Props is left, so the switch is hidden', () => {
    render(<CodePanel manifest={codeBlock} state={defaultState(codeBlock)} />);
    expect(screen.queryByRole('group', { name: 'Code format' })).toBeNull();
    expect(screen.getByRole('switch', { name: 'Full file' })).toBeInTheDocument();
  });

  it('Stack has no axis: no className option', () => {
    render(<CodePanel manifest={stack} state={defaultState(stack)} />);
    expect(formatNames()).toEqual(['Props', 'HTML']);
  });

  it('the switcher lists CODE_FORMATS in order, so a new format is one entry', () => {
    render(<CodePanel manifest={button} state={defaultState(button)} />);
    expect(screen.getAllByRole('radio').map((r) => r.getAttribute('value'))).toEqual(CODE_FORMATS.map((f) => f.id));
  });
});
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `pnpm build && pnpm --filter @bit-ds/gallery test -- src/code`
Expected: FAIL.
- `./toHtml`, `./fullFile`, `./CodePanel` and `./codeFormats` don't resolve.
- In `toJsx.className.test.tsx`, toJsx ignores the third argument, so it prints `color="danger" variant="outline"` and the round trip finds no className.

- [ ] **Step 3: Write `toHtml`, `fullFile`, the className option, the formats and the panel**

Create `apps/gallery/src/code/toHtml.ts`:

```ts
import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const INDENT = '  ';

/**
 * One element per line with two-space indents; an element holding only text stays on one line. React
 * escapes `<`, `>` and quotes inside text and attributes, so splitting on tags is safe.
 */
export function prettyHtml(html: string): string {
  const parts = html.match(/<[^>]+>|[^<]+/g) ?? [];
  const lines: string[] = [];
  let depth = 0;
  let open: string | null = null; // an opening tag, held back to see whether only text follows

  const flush = () => {
    if (open === null) return;
    lines.push(INDENT.repeat(depth) + open);
    depth += 1;
    open = null;
  };

  for (const part of parts) {
    if (part.startsWith('</')) {
      if (open !== null) {
        lines.push(INDENT.repeat(depth) + open + part);
        open = null;
      } else {
        depth = Math.max(0, depth - 1);
        lines.push(INDENT.repeat(depth) + part);
      }
    } else if (part.startsWith('<')) {
      flush();
      const name = /^<([a-zA-Z][\w-]*)/.exec(part)?.[1]?.toLowerCase() ?? '';
      if (VOID.has(name) || part.endsWith('/>')) lines.push(INDENT.repeat(depth) + part);
      else open = part;
    } else if (open !== null) {
      open += part;
    } else {
      lines.push(INDENT.repeat(depth) + part);
    }
  }
  flush();
  return lines.join('\n');
}

/** The markup the preview's element renders, so the HTML tab can never drift from what you see. */
export function toHtml(element: ReactElement): string {
  return prettyHtml(renderToStaticMarkup(element));
}
```

Create `apps/gallery/src/code/fullFile.ts`:

```ts
import { STYLE_IMPORTS } from '../content/styleImports';

/** Above the style imports in the full file: they belong in the app's entry file, once. */
export const STYLE_COMMENT = '// once per app: skip if already in your entry file';

const BODY_INDENT = '    ';

/**
 * Wrap a toJsx snippet (import line, blank line, element) in a file you can paste and run: the style
 * imports, the component import, and an `Example` component that returns the element. Gallery-private.
 */
export function fullFile(jsx: string): string {
  const split = jsx.indexOf('\n\n');
  const importLine = jsx.slice(0, split);
  const element = jsx.slice(split + 2);
  const body = element
    .split('\n')
    .map((line) => BODY_INDENT + line)
    .join('\n');
  return `${STYLE_COMMENT}\n${STYLE_IMPORTS}\n${importLine}\n\nexport function Example() {\n  return (\n${body}\n  );\n}\n`;
}
```

In `apps/gallery/src/code/toJsx.ts`, add the option:

```diff
--- a/apps/gallery/src/code/toJsx.ts
+++ b/apps/gallery/src/code/toJsx.ts
@@ -85,12 +85,40 @@ function importLine(manifest: Manifest): string {
   return `import { ${unique.join(', ')} } from '@bit-ds/react';`;
 }
 
+export interface ToJsxOptions {
+  /**
+   * `'props'` (the default) prints every axis as its prop: `color="danger"`. `'className'` prints the
+   * non-default axes as one `className="bit-danger bit-outline"`, in control order, where the first of
+   * them would have been, and leaves those props out. Both render the same classes.
+   */
+  decorators?: 'props' | 'className';
+}
+
+/** True when an axis control's value differs from its default, so it emits a class worth printing. */
+function axisChanged(control: Control, state: ControlState, defaults: ControlState): boolean {
+  return control.kind === 'axis' && (state[control.prop] ?? defaults[control.prop]) !== defaults[control.prop];
+}
+
+/** `className="bit-danger bit-outline"`: one class per changed axis, in control order. */
+function decoratorClassName(manifest: Manifest, state: ControlState, defaults: ControlState): string {
+  const classes = manifest.controls
+    .filter((control) => axisChanged(control, state, defaults))
+    .map((control) => `bit-${String(state[control.prop])}`);
+  return `className="${escapeAttr(classes.join(' '))}"`;
+}
+
 /** The React snippet for the current state: import line, blank line, element. Pure. */
-export function toJsx(manifest: Manifest, state: ControlState): string {
+export function toJsx(manifest: Manifest, state: ControlState, options: ToJsxOptions = {}): string {
   const defaults = defaultState(manifest);
   const fixed = Object.entries(manifest.fixedProps ?? {}).map(([name, value]) => printFixed(name, value));
+  const asClasses = options.decorators === 'className';
+  // In className mode the attribute takes the place of the first changed axis; -1 when none changed.
+  const classAt = asClasses ? manifest.controls.findIndex((control) => axisChanged(control, state, defaults)) : -1;
   const props = manifest.controls
-    .map((control) => printProp(control, state[control.prop] ?? defaults[control.prop]!, defaults[control.prop]!))
+    .map((control, index) => {
+      if (asClasses && control.kind === 'axis') return index === classAt ? decoratorClassName(manifest, state, defaults) : null;
+      return printProp(control, state[control.prop] ?? defaults[control.prop]!, defaults[control.prop]!);
+    })
     .filter((p): p is string => p !== null)
     .concat(fixed)
     .map((p) => ` ${p}`)
```

Create `apps/gallery/src/code/codeFormats.ts`. A new code mode is one entry here.

```ts
import type { CodeLanguage } from '@bit-ds/react';
import type { ControlState, Manifest } from '../manifests/types';
import { renderManifest } from '../engine/renderManifest';
import { toJsx } from './toJsx';
import { toHtml } from './toHtml';
import { fullFile } from './fullFile';

/**
 * One option in the Playground's code switcher. To add a mode, add an entry here: the SegmentedControl,
 * the CodeBlock and the tests all read this list.
 */
export interface CodeFormat {
  /** The SegmentedControl value. */
  id: string;
  /** The SegmentedControl label. */
  label: string;
  language: CodeLanguage;
  /** False hides the option for this manifest. */
  available: (manifest: Manifest) => boolean;
  /** Whether the "Full file" Switch applies to this format. */
  fullFile: boolean;
  code: (manifest: Manifest, state: ControlState) => string;
}

/** Props, then className (only with an axis to write as a class), then HTML (only for static components). */
export const CODE_FORMATS: readonly CodeFormat[] = [
  {
    id: 'props',
    label: 'Props',
    language: 'jsx',
    available: () => true,
    fullFile: true,
    code: (manifest, state) => toJsx(manifest, state),
  },
  {
    id: 'className',
    label: 'className',
    language: 'jsx',
    available: (manifest) => manifest.controls.some((control) => control.kind === 'axis'),
    fullFile: true,
    code: (manifest, state) => toJsx(manifest, state, { decorators: 'className' }),
  },
  {
    id: 'html',
    label: 'HTML',
    language: 'html',
    // An interactive component's markup alone doesn't work.
    available: (manifest) => !manifest.interactive,
    fullFile: false,
    code: (manifest, state) => toHtml(renderManifest(manifest, state)),
  },
];

/** The code to show for one format, wrapped in the full file when asked and the format allows it. */
export function codeFor(format: CodeFormat, manifest: Manifest, state: ControlState, wholeFile: boolean): string {
  const code = format.code(manifest, state);
  return wholeFile && format.fullFile ? fullFile(code) : code;
}
```

Create `apps/gallery/src/code/CodePanel.tsx`:

```tsx
import { useState } from 'react';
import { CodeBlock, SegmentedControl, Switch } from '@bit-ds/react';
import type { ControlState, Manifest } from '../manifests/types';
import { CODE_FORMATS, codeFor } from './codeFormats';

interface CodePanelProps {
  manifest: Manifest;
  state: ControlState;
}

/**
 * The Playground's footer: a SegmentedControl picks the format (Props | className | HTML, whichever
 * apply), a "Full file" Switch wraps the JSX in a file you can paste, and a CodeBlock shows the code with
 * Copy. The choice is local to the page; an unavailable one falls back to Props.
 */
export function CodePanel({ manifest, state }: CodePanelProps) {
  const formats = CODE_FORMATS.filter((format) => format.available(manifest));
  const [formatId, setFormatId] = useState(formats[0]!.id);
  const [wholeFile, setWholeFile] = useState(false);
  const format = formats.find((f) => f.id === formatId) ?? formats[0]!;
  return (
    <div className="gallery-codepanel">
      <div className="gallery-codepanel__bar">
        {formats.length > 1 ? (
          <SegmentedControl
            legend="Code format"
            legendHidden
            size="sm"
            options={formats.map((f) => ({ value: f.id, label: f.label }))}
            value={format.id}
            onValueChange={setFormatId}
          />
        ) : null}
        {format.fullFile ? (
          <Switch size="sm" checked={wholeFile} onChange={(event) => setWholeFile(event.target.checked)}>
            Full file
          </Switch>
        ) : null}
      </div>
      <CodeBlock code={codeFor(format, manifest, state, wholeFile)} language={format.language} label="Example code" />
    </div>
  );
}
```

Run: `pnpm --filter @bit-ds/gallery test -- src/code`
Expected: PASS.

- [ ] **Step 4: Write the failing engine tests (presets, preview, controls, variants)**

Replace `apps/gallery/src/engine/Presets.test.tsx` with:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { isPresetActive, Presets } from './Presets';
import { defaultState } from './state';
import { button } from '../manifests/button';
import { spinner } from '../manifests/spinner';

describe('isPresetActive', () => {
  it('is true while every value the preset sets holds', () => {
    const preset = { label: 'Danger outline', state: { color: 'danger', variant: 'outline' } };
    expect(isPresetActive(preset, defaultState(button))).toBe(false);
    expect(isPresetActive(preset, { ...defaultState(button), color: 'danger' })).toBe(false);
    expect(isPresetActive(preset, { ...defaultState(button), color: 'danger', variant: 'outline', size: 'lg' })).toBe(true);
  });
});

describe('Presets', () => {
  it('renders one ghost button per preset in a "Presets" group and applies its state', async () => {
    const onApply = vi.fn();
    render(<Presets manifest={button} state={defaultState(button)} onApply={onApply} />);
    const buttons = screen.getAllByRole('button');
    expect(screen.getByRole('group', { name: 'Presets' })).toBeInTheDocument();
    expect(buttons.map((b) => b.textContent)).toEqual(['Danger outline', 'Ghost small', 'Loading']);
    for (const b of buttons) {
      expect(b).toHaveClass('bit-ghost', 'bit-sm');
      expect(b).toHaveAttribute('aria-pressed', 'false');
    }
    await userEvent.click(buttons[0]!);
    expect(onApply).toHaveBeenCalledWith({ color: 'danger', variant: 'outline' });
  });

  it('the preset matching the current state is pressed and solid', () => {
    render(<Presets manifest={button} state={{ ...defaultState(button), variant: 'ghost', size: 'sm' }} onApply={() => {}} />);
    const active = screen.getByRole('button', { name: 'Ghost small' });
    expect(active).toHaveAttribute('aria-pressed', 'true');
    expect(active).toHaveClass('bit-solid', 'bit-primary');
    expect(screen.getByRole('button', { name: 'Loading' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('renders nothing when a manifest has no presets', () => {
    const { container } = render(<Presets manifest={{ ...spinner, presets: undefined }} state={{}} onApply={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });
});
```

Replace `apps/gallery/src/engine/Preview.test.tsx` with:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { Preview } from './Preview';

describe('Preview', () => {
  it('renders its children on a labelled stage and toggles the checkerboard with a bit Switch', async () => {
    render(
      <Preview label="Button preview" presets={<span>presets here</span>}>
        <button>hi</button>
      </Preview>,
    );
    const stage = screen.getByRole('region', { name: 'Button preview' });
    expect(stage).toContainElement(screen.getByRole('button', { name: 'hi' }));
    expect(stage).toContainElement(screen.getByText('presets here'));
    expect(stage).not.toHaveAttribute('data-checkerboard');
    const toggle = screen.getByRole('switch', { name: 'Checkerboard' });
    expect(toggle).toHaveClass('bit-switch__input');
    await userEvent.click(toggle);
    expect(stage).toHaveAttribute('data-checkerboard', '');
  });
});
```

In `apps/gallery/src/engine/ControlsPanel.test.tsx`:

```diff
--- a/apps/gallery/src/engine/ControlsPanel.test.tsx
+++ b/apps/gallery/src/engine/ControlsPanel.test.tsx
@@ -7,6 +7,7 @@ import { defaultState } from './state';
 import type { ControlState, ControlValue, Manifest } from '../manifests/types';
 import { button } from '../manifests/button';
 import { spinner } from '../manifests/spinner';
+import { badge as badgeManifest } from '../manifests/badge';
 import { expectNoA11yViolations } from '../test/a11y';
 
 interface HarnessProps {
@@ -81,6 +82,31 @@ describe('ControlsPanel', () => {
     expect(screen.getByLabelText('aria-label')).toHaveValue('Loading coins');
   });
 
+  it('Controls is an h3 under the Playground h2', () => {
+    render(<ControlsPanel manifest={button} state={defaultState(button)} onChange={() => {}} onReset={() => {}} />);
+    expect(screen.getByRole('heading', { level: 3, name: 'Controls' })).toBeInTheDocument();
+  });
+
+  it("emptied children show the manifest's error, tied to the field and marking it invalid", async () => {
+    const { container } = render(
+      <ControlsPanel manifest={button} state={{ ...defaultState(button), children: '' }} onChange={() => {}} onReset={() => {}} />,
+    );
+    const field = screen.getByLabelText('children');
+    expect(field).toHaveAttribute('aria-invalid', 'true');
+    expect(field).toHaveAccessibleDescription('A Button needs text or an aria-label, or screen readers announce just "button".');
+    expect(container.querySelector('.gallery-control__error')).toHaveTextContent('⚠ A Button needs text');
+    await expectNoA11yViolations(container);
+  });
+
+  it('a manifest without an empty-children error shows none, and children with text show none', () => {
+    const { container, rerender } = render(
+      <ControlsPanel manifest={badgeManifest} state={{ ...defaultState(badgeManifest), children: '' }} onChange={() => {}} onReset={() => {}} />,
+    );
+    expect(container.querySelector('.gallery-control__error')).toBeNull();
+    rerender(<ControlsPanel manifest={button} state={defaultState(button)} onChange={() => {}} onReset={() => {}} />);
+    expect(screen.getByLabelText('children')).not.toHaveAttribute('aria-invalid');
+  });
+
   it('Reset calls onReset', async () => {
     const onReset = vi.fn();
     render(<ControlsPanel manifest={button} state={defaultState(button)} onChange={() => {}} onReset={onReset} />);
```

Create `apps/gallery/src/engine/VariantsTable.test.tsx`:

```tsx
import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { variantAxes, VariantsTable } from './VariantsTable';
import { defaultState } from './state';
import { button } from '../manifests/button';
import { card } from '../manifests/card';
import { spinner } from '../manifests/spinner';
import { stack } from '../manifests/stack';
import { expectNoA11yViolations } from '../test/a11y';

describe('variantAxes', () => {
  it('uses color as rows and variant as columns when both exist', () => {
    expect(variantAxes(button)).toMatchObject({ row: { prop: 'color' }, column: { prop: 'variant' } });
  });

  it('falls back to the first axis alone, and to null with no axis', () => {
    expect(variantAxes(card)).toEqual({ column: card.controls[0] });
    expect(variantAxes(spinner)?.column.prop).toBe('color');
    expect(variantAxes(spinner)?.row).toBeUndefined();
    expect(variantAxes(stack)).toBeNull();
  });
});

describe('VariantsTable', () => {
  it('draws one cell per color × variant, carrying the playground state into each', async () => {
    const { container } = render(
      <VariantsTable manifest={button} axes={variantAxes(button)!} state={{ ...defaultState(button), size: 'lg', children: 'Go' }} />,
    );
    const table = screen.getByRole('region', { name: 'Button variants' });
    const cells = within(table).getAllByRole('button', { name: 'Go' });
    expect(cells).toHaveLength(5 * 3);
    expect(cells.every((c) => c.classList.contains('bit-lg'))).toBe(true);
    expect(cells.filter((c) => c.classList.contains('bit-danger') && c.classList.contains('bit-ghost'))).toHaveLength(1);
    expect(within(table).getAllByRole('columnheader').map((th) => th.textContent)).toEqual(['color', 'solid', 'outline', 'ghost']);
    expect(within(table).getAllByRole('rowheader').map((th) => th.textContent)).toEqual(['primary', 'neutral', 'success', 'warning', 'danger']);
    await expectNoA11yViolations(container);
  });

  it('a single axis is one row under a head of its values', () => {
    const { container } = render(<VariantsTable manifest={card} axes={variantAxes(card)!} state={defaultState(card)} />);
    expect(screen.getAllByRole('columnheader').map((th) => th.textContent)).toEqual(['solid', 'outline']);
    expect(screen.queryAllByRole('rowheader')).toEqual([]);
    expect(container.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(container.querySelectorAll('tbody .bit-card')).toHaveLength(2);
  });
});
```

Delete the Matrix and its test:

```bash
git rm apps/gallery/src/engine/Matrix.tsx apps/gallery/src/engine/Matrix.test.tsx
```

Run: `pnpm --filter @bit-ds/gallery test -- src/engine`
Expected: FAIL.
- `isPresetActive` and `./VariantsTable` don't exist.
- Presets has no `state` prop and no group.
- The checkerboard is still a raw `gallery-switch`.
- Controls is an h2.
- No children error shows.

- [ ] **Step 5: Write the engine changes**

Replace `apps/gallery/src/engine/Presets.tsx` with:

```tsx
import { Button } from '@bit-ds/react';
import type { ControlState, Manifest, Preset } from '../manifests/types';

/** A preset is active while every value it sets holds in the current state. Two compatible ones can both be. */
export function isPresetActive(preset: Preset, state: ControlState): boolean {
  return Object.entries(preset.state).every(([prop, value]) => value === undefined || state[prop] === value);
}

interface PresetsProps {
  manifest: Manifest;
  state: ControlState;
  onApply: (partial: Partial<ControlState>) => void;
}

/**
 * Quick states in the preview bar, as ghost Buttons. Each applies its values on top of the current state.
 * An active preset is pressed (aria-pressed="true") and solid. On a phone the row scrolls sideways.
 */
export function Presets({ manifest, state, onApply }: PresetsProps) {
  if (!manifest.presets || manifest.presets.length === 0) return null;
  return (
    <div className="gallery-presets" role="group" aria-label="Presets">
      {manifest.presets.map((preset) => {
        const active = isPresetActive(preset, state);
        return (
          <Button
            key={preset.label}
            size="sm"
            color={active ? 'primary' : 'neutral'}
            variant={active ? 'solid' : 'ghost'}
            aria-pressed={active}
            onClick={() => onApply(preset.state)}
          >
            {preset.label}
          </Button>
        );
      })}
    </div>
  );
}
```

Replace `apps/gallery/src/engine/Preview.tsx` with:

```tsx
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Switch } from '@bit-ds/react';

interface PreviewProps {
  label: string;
  /** The preset buttons, shown in the bar between the title and the checkerboard switch. */
  presets?: ReactNode;
  children: ReactNode;
}

/** The stage the live component sits on. Checkerboard helps judge ghost and outline variants. */
export function Preview({ label, presets, children }: PreviewProps) {
  const [checkerboard, setCheckerboard] = useState(false);
  return (
    <section className="gallery-preview" aria-label={label} data-checkerboard={checkerboard ? '' : undefined}>
      <div className="gallery-preview__bar">
        <span className="gallery-preview__title">Preview</span>
        {presets}
        <Switch size="sm" checked={checkerboard} onChange={(event) => setCheckerboard(event.target.checked)}>
          Checkerboard
        </Switch>
      </div>
      <div className="gallery-preview__stage">{children}</div>
    </section>
  );
}
```

In `apps/gallery/src/engine/ControlsPanel.tsx`:

```diff
--- a/apps/gallery/src/engine/ControlsPanel.tsx
+++ b/apps/gallery/src/engine/ControlsPanel.tsx
@@ -1,4 +1,4 @@
-import { Button, Text } from '@bit-ds/react';
+import { Button, Heading } from '@bit-ds/react';
 import type { Control, ControlState, ControlValue, Manifest } from '../manifests/types';
 
 interface ControlsPanelProps {
@@ -12,10 +12,12 @@ interface FieldProps {
   control: Control;
   value: ControlValue | undefined;
   onChange: (prop: string, value: ControlValue) => void;
+  /** Shown under a text field, which is then marked invalid (the emptied children of a Button, say). */
+  error?: string;
 }
 
 /** One form control per manifest entry. Labels are the prop names so the panel doubles as API docs. */
-function Field({ control, value, onChange }: FieldProps) {
+function Field({ control, value, onChange, error }: FieldProps) {
   const label = ('label' in control && control.label) || control.prop;
   const id = `control-${control.prop}`;
 
@@ -80,7 +82,8 @@ function Field({ control, value, onChange }: FieldProps) {
           />
         </div>
       );
-    case 'text':
+    case 'text': {
+      const errorId = `${id}-error`;
       return (
         <div className="gallery-control">
           <label className="gallery-control__label" htmlFor={id}>
@@ -91,22 +94,33 @@ function Field({ control, value, onChange }: FieldProps) {
             className="gallery-control__input"
             type="text"
             value={String(value ?? control.default)}
+            aria-invalid={error ? true : undefined}
+            aria-describedby={error ? errorId : undefined}
             onChange={(event) => onChange(control.prop, event.target.value)}
           />
+          {error ? (
+            <p className="gallery-control__error" id={errorId}>
+              <span aria-hidden="true">⚠ </span>
+              {error}
+            </p>
+          ) : null}
         </div>
       );
+    }
   }
 }
 
 export function ControlsPanel({ manifest, state, onChange, onReset }: ControlsPanelProps) {
   const childrenControl: Control | null =
     typeof manifest.children === 'string' ? { kind: 'text', prop: 'children', default: manifest.children } : null;
+  // Emptied children: the preview and code show the empty component, and the field says what that costs.
+  const childrenError = state.children === '' ? manifest.docs.emptyChildrenError : undefined;
   return (
     <section className="gallery-controls" aria-labelledby="controls-heading">
       <div className="gallery-controls__head">
-        <Text as="h2" size={18} id="controls-heading">
+        <Heading level={3} id="controls-heading">
           Controls
-        </Text>
+        </Heading>
         <Button variant="ghost" size="sm" color="neutral" onClick={onReset}>
           Reset
         </Button>
@@ -115,7 +129,9 @@ export function ControlsPanel({ manifest, state, onChange, onReset }: ControlsPa
         {manifest.controls.map((control) => (
           <Field key={control.prop} control={control} value={state[control.prop]} onChange={onChange} />
         ))}
-        {childrenControl ? <Field control={childrenControl} value={state.children} onChange={onChange} /> : null}
+        {childrenControl ? (
+          <Field control={childrenControl} value={state.children} onChange={onChange} error={childrenError} />
+        ) : null}
       </div>
     </section>
   );
```

Create `apps/gallery/src/engine/VariantsTable.tsx`:

```tsx
import { Table, TableBody, TableCell, TableHead, TableRow } from '@bit-ds/react';
import type { AxisControl, ControlState, Manifest } from '../manifests/types';
import { renderManifest } from './renderManifest';

/** One row per color and one column per variant; or a single axis as one row (no `row`). */
export interface VariantAxes {
  row?: AxisControl;
  column: AxisControl;
}

/** color × variant when both exist; otherwise the first axis alone; null when there is no axis. */
export function variantAxes(manifest: Manifest): VariantAxes | null {
  const axes = manifest.controls.filter((c): c is AxisControl => c.kind === 'axis');
  if (axes.length === 0) return null;
  const color = axes.find((a) => a.prop === 'color');
  const variant = axes.find((a) => a.prop === 'variant');
  if (color && variant) return { row: color, column: variant };
  return { column: axes[0]! };
}

interface VariantsTableProps {
  manifest: Manifest;
  axes: VariantAxes;
  /** The playground's state, so size, text and booleans carry into every cell. */
  state: ControlState;
}

/** Every combination, drawn live, in a bit Table. */
export function VariantsTable({ manifest, axes, state }: VariantsTableProps) {
  const { row, column } = axes;
  const cell = (rowValue: string | undefined, columnValue: string) => {
    const cellState: ControlState = { ...state, [column.prop]: columnValue };
    if (row && rowValue !== undefined) cellState[row.prop] = rowValue;
    return <TableCell key={columnValue}>{renderManifest(manifest, cellState)}</TableCell>;
  };
  return (
    <Table aria-label={`${manifest.name} variants`}>
      <TableHead>
        <TableRow>
          {row ? <TableCell>{row.prop}</TableCell> : null}
          {column.values.map((value) => (
            <TableCell key={value}>{value}</TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {row ? (
          row.values.map((rowValue) => (
            <TableRow key={rowValue}>
              <TableCell as="th" scope="row">
                {rowValue}
              </TableCell>
              {column.values.map((columnValue) => cell(rowValue, columnValue))}
            </TableRow>
          ))
        ) : (
          <TableRow>{column.values.map((columnValue) => cell(undefined, columnValue))}</TableRow>
        )}
      </TableBody>
    </Table>
  );
}
```

Run: `pnpm --filter @bit-ds/gallery test -- src/engine`
Expected: PASS.

- [ ] **Step 6: Write the failing page tests**

Create `apps/gallery/src/pages/ComponentPage.test.tsx`:

```tsx
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { renderAt } from '../test/renderRoute';
import { button } from '../manifests/button';
import { importChip } from './component/ComponentHeader';
import { PROP_COLUMNS } from './component/DocsSections';

async function open(path: string, name: string) {
  const utils = renderAt(path);
  await screen.findByRole('heading', { level: 1, name });
  return utils;
}

const region = (name: string) => screen.getByRole('region', { name });
const main = () => screen.getByRole('main');

describe('ComponentPage (layout C)', () => {
  it('the header: eyebrow, h1, description, the import chip with Copy, and the badges', async () => {
    await open('/components/card', 'Card');
    expect(within(main()).getByText('Components')).toHaveClass('gallery-eyebrow');
    const chip = screen.getByText("import { Card, CardHeader, CardBody, CardFooter } from '@bit-ds/react';");
    expect(chip).toHaveClass('bit-code');
    expect(screen.getByRole('button', { name: 'Copy import line' })).toBeInTheDocument();
    expect(screen.getByText('Compound')).toHaveClass('bit-badge', 'bit-outline');
  });

  it('importChip lists the component, then its parts', () => {
    expect(importChip(button)).toBe("import { Button } from '@bit-ds/react';");
  });

  it('renders the five sections in order, and the section bar links to each', async () => {
    await open('/components/button', 'Button');
    const titles = ['Playground', 'Variants', 'Usage', 'Props', 'Accessibility'];
    expect(within(main()).getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(titles);
    const bar = screen.getByRole('navigation', { name: 'On this page' });
    expect(within(bar).getAllByRole('link').map((link) => link.textContent)).toEqual(titles);
  });

  it('a section-bar link focuses its h2 and leaves the route and the state alone', async () => {
    const { router } = await open('/components/button?color=danger', 'Button');
    await userEvent.click(within(screen.getByRole('navigation', { name: 'On this page' })).getByRole('link', { name: 'Props' }));
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 2, name: 'Props' }));
    expect(router.state.location.pathname).toBe('/components/button');
    expect(router.state.location.search).toBe('?color=danger');
  });

  it('a component with no axis has no Variants section and no Variants link', async () => {
    await open('/components/stack', 'Stack');
    expect(within(main()).queryByRole('heading', { level: 2, name: 'Variants' })).toBeNull();
    expect(within(screen.getByRole('navigation', { name: 'On this page' })).queryByRole('link', { name: 'Variants' })).toBeNull();
  });

  it('the active preset is pressed; applying another moves the press', async () => {
    await open('/components/button?variant=ghost&size=sm', 'Button');
    const presets = within(region('Button preview')).getByRole('group', { name: 'Presets' });
    expect(within(presets).getByRole('button', { name: 'Ghost small' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(within(presets).getByRole('button', { name: 'Loading' }));
    expect(within(presets).getByRole('button', { name: 'Loading' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('the Variants table has one cell per color × variant', async () => {
    await open('/components/button', 'Button');
    expect(within(region('Button variants')).getAllByRole('button', { name: 'Save' })).toHaveLength(15);
  });

  it('Usage shows Do and Don\'t as soft success and danger notes', async () => {
    await open('/components/button', 'Button');
    const notes = screen.getAllByRole('note');
    expect(notes.map((n) => n.querySelector('.bit-alert__title')!.textContent)).toEqual(['Do', "Don't"]);
    expect(notes[0]).toHaveClass('bit-success', 'bit-outline');
    expect(notes[1]).toHaveClass('bit-danger', 'bit-outline');
    expect(within(notes[0]!).getAllByRole('listitem')).toHaveLength(button.docs.usage.do.length);
  });

  it('Props is a Table of prop, type, default and description from docs.props', async () => {
    await open('/components/button', 'Button');
    const table = region('Button props');
    expect(within(table).getAllByRole('columnheader').map((th) => th.textContent)).toEqual(PROP_COLUMNS.map((c) => c.header));
    expect(within(table).getAllByRole('row')).toHaveLength(button.docs.props.length + 1);
    const color = within(table).getByText('color').closest('tr')!;
    expect(within(color).getByText("'primary'")).toHaveClass('bit-code');
  });

  it('the Props table has a Class column: bit-{prop} on axis rows, — elsewhere', async () => {
    await open('/components/button', 'Button');
    const table = region('Button props');
    const classOf = (name: string) => within(table).getByText(name, { selector: 'code' }).closest('tr')!.cells[3]!;
    expect(classOf('variant')).toHaveTextContent('bit-{variant}');
    expect(within(classOf('variant')).getByText('bit-{variant}')).toHaveClass('bit-code');
    expect(classOf('loading')).toHaveTextContent('—');
  });

  it.each([
    ['/components/button', 'Button', 'className="bit-danger"', 'color="danger"'],
    ['/components/card', 'Card', 'className="bit-outline"', 'variant="outline"'],
    ['/components/link', 'Link', 'className="bit-neutral"', 'color="neutral"'],
  ])('%s: the tip under Props says className works the same as the prop', async (path, name, asClass, asProp) => {
    await open(path, name);
    const tip = screen.getByText(/^Prefer classes\?/);
    expect(tip).toHaveTextContent(`Prefer classes? ${asClass} works the same as ${asProp}.`);
  });

  it('no axis, no tip', async () => {
    await open('/components/stack', 'Stack');
    expect(screen.queryByText(/^Prefer classes\?/)).toBeNull();
  });

  it('the code footer offers Props, className and HTML, and each switches the code', async () => {
    await open('/components/button?color=danger', 'Button');
    expect(region('Example code').textContent).toContain('<Button color="danger">Save</Button>');
    await userEvent.click(screen.getByRole('radio', { name: 'className' }));
    expect(region('Example code').textContent).toContain('<Button className="bit-danger">Save</Button>');
    await userEvent.click(screen.getByRole('radio', { name: 'HTML' }));
    expect(region('Example code').textContent).toContain('<button class="bit-button bit-danger bit-solid bit-md" type="button">Save</button>');
  });

  it('a component without an axis has no className option', async () => {
    await open('/components/stack', 'Stack');
    expect(screen.queryByRole('radio', { name: 'className' })).toBeNull();
  });

  it('Accessibility is a bullet list from docs.a11y', async () => {
    await open('/components/button', 'Button');
    const section = region('Accessibility');
    expect(within(section).getAllByRole('listitem').map((li) => li.textContent)).toEqual([...button.docs.a11y]);
  });

  it("emptied children: the preview shows the empty component, the code a self-closing tag, the field the manifest's error", async () => {
    await open('/components/button?children=', 'Button');
    expect(within(region('Button preview')).getByRole('button', { name: '' })).toBeEmptyDOMElement();
    expect(region('Example code').textContent).toBe("import { Button } from '@bit-ds/react';\n\n<Button />");
    expect(screen.getByLabelText('children')).toHaveAccessibleDescription(button.docs.emptyChildrenError!);
  });

  it('the code footer switches to HTML for a static component, and has no format switch for an interactive one', async () => {
    await open('/components/badge', 'Badge');
    await userEvent.click(screen.getByRole('radio', { name: 'HTML' }));
    expect(region('Example code').textContent).toBe('<span class="bit-badge bit-neutral bit-solid bit-md" data-shape="pill">New</span>');
  });

  it('the logo page lives under Brand', async () => {
    await open('/brand/logo', 'BitLogo');
    expect(within(main()).getByText('Brand')).toHaveClass('gallery-eyebrow');
  });
});
```

In `apps/gallery/src/routes.test.tsx`:
- Find the code panel by its region.
- Controls is now an h3, and four h2s are checked on every page.
- `/tokens` joins the axe smoke.

```diff
--- a/apps/gallery/src/routes.test.tsx
+++ b/apps/gallery/src/routes.test.tsx
@@ -5,14 +5,14 @@ import { MANIFESTS, routeFor } from './manifests';
 import { renderAt } from './test/renderRoute';
 import { expectNoA11yViolations } from './test/a11y';
 
-/** The React code panel: the CodeBlock in the section headed "React". */
+/** The Playground's code panel: the CodeBlock whose code region is "Example code". */
 function reactPanel(): HTMLElement {
-  const section = screen.getByRole('heading', { level: 2, name: 'React' }).closest('section')!;
-  return section.querySelector<HTMLElement>('.bit-code__block')!;
+  return screen.getByRole('region', { name: 'Example code' }).closest<HTMLElement>('.bit-code__block')!;
 }
 
 /** The Foundations guide pages and their h1s. */
 const FOUNDATION_PAGES = [
+  ['/tokens', 'Tokens'],
   ['/typography', 'Typography'],
   ['/spacing', 'Spacing'],
 ] as const;
@@ -23,13 +23,16 @@ describe('component routes (route smoke, D14)', () => {
   });
 
   it.each(MANIFESTS.map((m) => [m.name, m] as const))(
-    '%s: heading, live preview, controls and code, with no axe violations',
+    '%s: heading, the five sections, live preview, controls and code, with no axe violations',
     async (_name, manifest) => {
       const { container } = renderAt(routeFor(manifest));
       expect(await screen.findByRole('heading', { level: 1, name: manifest.name })).toBeInTheDocument();
       const preview = screen.getByRole('region', { name: `${manifest.name} preview` });
       expect(preview.querySelector('[class*="bit-"]')).not.toBeNull();
-      expect(screen.getByRole('heading', { level: 2, name: 'Controls' })).toBeInTheDocument();
+      expect(screen.getByRole('heading', { level: 3, name: 'Controls' })).toBeInTheDocument();
+      for (const name of ['Playground', 'Usage', 'Props', 'Accessibility']) {
+        expect(screen.getByRole('heading', { level: 2, name })).toBeInTheDocument();
+      }
       expect(reactPanel()).toHaveAttribute('data-language', 'jsx');
       expect(reactPanel().querySelector('pre')!.textContent).toMatch(/^import \{ .+ \} from '@bit-ds\/react';\n\n</);
       await expectNoA11yViolations(container);
```

In `apps/gallery/src/routes.dark.test.tsx`, add `/tokens` to the dark axe smoke:

```diff
--- a/apps/gallery/src/routes.dark.test.tsx
+++ b/apps/gallery/src/routes.dark.test.tsx
@@ -6,6 +6,7 @@ import { expectNoA11yViolations } from './test/a11y';
 
 /** The Foundations guide pages and their h1s. */
 const FOUNDATION_PAGES = [
+  ['/tokens', 'Tokens'],
   ['/typography', 'Typography'],
   ['/spacing', 'Spacing'],
 ] as const;
```

Run: `pnpm --filter @bit-ds/gallery test -- ComponentPage routes`
Expected: FAIL. The page still has the old layout:
- no section bar
- no Variants, Usage, Props or Accessibility
- no "Example code" switch

- [ ] **Step 7: Write the page**

Create `apps/gallery/src/pages/component/ComponentHeader.tsx`:

```tsx
import { Badge, Code, Stack, Text } from '@bit-ds/react';
import type { Manifest, ManifestGroup } from '../../manifests/types';
import { PageHeader } from '../../ui/PageHeader';
import { CopyButton } from '../../ui/CopyButton';

const GROUP_LABELS: Record<ManifestGroup, string> = { components: 'Components', forms: 'Forms', brand: 'Brand' };

/** `import { Name, ...parts } from '@bit-ds/react';`: the component first, then its parts in page order. */
export function importChip(manifest: Manifest): string {
  return `import { ${[manifest.name, ...(manifest.parts ?? [])].join(', ')} } from '@bit-ds/react';`;
}

/** Eyebrow, h1, description, the import chip with Copy, and the manifest's badges. */
export function ComponentHeader({ manifest }: { manifest: Manifest }) {
  const line = importChip(manifest);
  return (
    <PageHeader eyebrow={GROUP_LABELS[manifest.group]} title={manifest.name}>
      <Text size={18}>{manifest.description}</Text>
      <Stack direction="row" gap={8} align="center" wrap>
        <Code>{line}</Code>
        <CopyButton text={line} label="Copy import line" />
      </Stack>
      {manifest.docs.badges.length > 0 ? (
        <Stack direction="row" gap={8} wrap>
          {manifest.docs.badges.map((badge) => (
            <Badge key={badge} variant="outline" shape="square">
              {badge}
            </Badge>
          ))}
        </Stack>
      ) : null}
    </PageHeader>
  );
}
```

Create `apps/gallery/src/pages/component/DocsSections.tsx`. A new Props-table column is one entry in `PROP_COLUMNS`.

```tsx
import type { ReactNode } from 'react';
import { Alert, Box, Code, Stack, Table, TableBody, TableCell, TableHead, TableRow, Text } from '@bit-ds/react';
import type { AxisControl, Manifest, ManifestDocs, PropDoc } from '../../manifests/types';

/** Do and Don't: soft success and soft danger, read as notes rather than live status. */
export function UsageLists({ usage }: { usage: ManifestDocs['usage'] }) {
  return (
    <Box className="gallery-grid">
      <Alert color="success" title="Do" role="note">
        <ul className="gallery-bullets">
          {usage.do.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </Alert>
      <Alert color="danger" title="Don't" role="note">
        <ul className="gallery-bullets">
          {usage.dont.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </Alert>
    </Box>
  );
}

/** A cell with nothing to show: no default, or no class. */
function None() {
  return (
    <Text as="span" color="neutral">
      —
    </Text>
  );
}

/** One Props-table column. To add a column, add an entry here. */
export interface PropColumn {
  header: string;
  cell: (prop: PropDoc) => ReactNode;
  /** Keep the cell on one line (short code); long types and descriptions wrap. */
  nowrap?: boolean;
}

export const PROP_COLUMNS: readonly PropColumn[] = [
  { header: 'Prop', cell: (prop) => <Code>{prop.name}</Code>, nowrap: true },
  { header: 'Type', cell: (prop) => <Code>{prop.type}</Code> },
  { header: 'Default', cell: (prop) => (prop.default === undefined ? <None /> : <Code>{prop.default}</Code>), nowrap: true },
  { header: 'Class', cell: (prop) => (prop.className === undefined ? <None /> : <Code>{prop.className}</Code>), nowrap: true },
  { header: 'Description', cell: (prop) => prop.description },
];

/**
 * The example the tip under the Props table uses: the color axis if there is one, otherwise the first axis,
 * at `danger` for color (when the axis offers it), otherwise at the axis's last value. Null without an axis.
 */
export function classTip(manifest: Manifest): { prop: string; value: string } | null {
  const axes = manifest.controls.filter((control): control is AxisControl => control.kind === 'axis');
  const axis = axes.find((control) => control.prop === 'color') ?? axes[0];
  if (!axis) return null;
  const value = axis.prop === 'color' && axis.values.includes('danger') ? 'danger' : axis.values[axis.values.length - 1]!;
  return { prop: axis.prop, value };
}

export function PropsTable({ manifest }: { manifest: Manifest }) {
  const tip = classTip(manifest);
  return (
    <Stack gap={8}>
      <Table aria-label={`${manifest.name} props`}>
        <TableHead>
          <TableRow>
            {PROP_COLUMNS.map((column) => (
              <TableCell key={column.header}>{column.header}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {manifest.docs.props.map((prop) => (
            <TableRow key={prop.name}>
              {PROP_COLUMNS.map((column) => (
                <TableCell key={column.header} className={column.nowrap ? 'gallery-nowrap' : undefined}>
                  {column.cell(prop)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {tip ? (
        <Text size={13}>
          Prefer classes? <Code>{`className="bit-${tip.value}"`}</Code> works the same as <Code>{`${tip.prop}="${tip.value}"`}</Code>.
        </Text>
      ) : null}
    </Stack>
  );
}

export function A11yList({ lines }: { lines: readonly string[] }) {
  return (
    <ul className="gallery-bullets">
      {lines.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  );
}
```

Create `apps/gallery/src/pages/component/Playground.tsx`:

```tsx
import type { Manifest } from '../../manifests/types';
import type { ControlStateApi } from '../../engine/useControlState';
import { renderManifest } from '../../engine/renderManifest';
import { Presets } from '../../engine/Presets';
import { Preview } from '../../engine/Preview';
import { ControlsPanel } from '../../engine/ControlsPanel';
import { CodePanel } from '../../code/CodePanel';

interface PlaygroundProps {
  manifest: Manifest;
  controls: ControlStateApi;
}

/** Preview (with presets) beside the controls, and the code under both. Under 720px the controls stack. */
export function Playground({ manifest, controls }: PlaygroundProps) {
  const { state, setProp, apply, reset } = controls;
  return (
    <div className="gallery-playground">
      <div className="gallery-playground__top">
        <Preview label={`${manifest.name} preview`} presets={<Presets manifest={manifest} state={state} onApply={apply} />}>
          {renderManifest(manifest, state)}
        </Preview>
        <ControlsPanel manifest={manifest} state={state} onChange={setProp} onReset={reset} />
      </div>
      <CodePanel manifest={manifest} state={state} />
    </div>
  );
}
```

Create `apps/gallery/src/pages/component/sections.ts`:

```ts
import type { Manifest } from '../../manifests/types';
import type { SectionLink } from '../../ui/PageSection';
import { variantAxes } from '../../engine/VariantsTable';

export const SECTIONS = {
  playground: { id: 'section-playground', title: 'Playground' },
  variants: { id: 'section-variants', title: 'Variants' },
  usage: { id: 'section-usage', title: 'Usage' },
  props: { id: 'section-props', title: 'Props' },
  accessibility: { id: 'section-accessibility', title: 'Accessibility' },
} as const satisfies Record<string, SectionLink>;

/** The page's sections in order. Variants only when the component has an axis to draw. */
export function componentSections(manifest: Manifest): SectionLink[] {
  return [
    SECTIONS.playground,
    ...(variantAxes(manifest) ? [SECTIONS.variants] : []),
    SECTIONS.usage,
    SECTIONS.props,
    SECTIONS.accessibility,
  ];
}
```

Replace `apps/gallery/src/pages/ComponentPage.tsx` with:

```tsx
import { Stack } from '@bit-ds/react';
import type { Manifest } from '../manifests';
import { useControlState } from '../engine/useControlState';
import { variantAxes, VariantsTable } from '../engine/VariantsTable';
import { PageSection } from '../ui/PageSection';
import { SectionBar } from '../ui/SectionBar';
import { ComponentHeader } from './component/ComponentHeader';
import { Playground } from './component/Playground';
import { A11yList, PropsTable, UsageLists } from './component/DocsSections';
import { componentSections, SECTIONS } from './component/sections';

interface ComponentPageProps {
  manifest: Manifest;
}

/** Layout C: header, section bar, then Playground, Variants, Usage, Props and Accessibility. State lives in the URL. */
export function ComponentPage({ manifest }: ComponentPageProps) {
  const controls = useControlState(manifest);
  const axes = variantAxes(manifest);
  return (
    <Stack gap={32}>
      <Stack gap={16}>
        <ComponentHeader manifest={manifest} />
        <SectionBar sections={componentSections(manifest)} />
      </Stack>
      <PageSection {...SECTIONS.playground}>
        <Playground manifest={manifest} controls={controls} />
      </PageSection>
      {axes ? (
        <PageSection {...SECTIONS.variants}>
          <VariantsTable manifest={manifest} axes={axes} state={controls.state} />
        </PageSection>
      ) : null}
      <PageSection {...SECTIONS.usage}>
        <UsageLists usage={manifest.docs.usage} />
      </PageSection>
      <PageSection {...SECTIONS.props}>
        <PropsTable manifest={manifest} />
      </PageSection>
      <PageSection {...SECTIONS.accessibility}>
        <A11yList lines={manifest.docs.a11y} />
      </PageSection>
    </Stack>
  );
}
```

- [ ] **Step 8: The CSS and its tests**

In `apps/gallery/src/gallery-css.test.ts`:

```diff
--- a/apps/gallery/src/gallery-css.test.ts
+++ b/apps/gallery/src/gallery-css.test.ts
@@ -51,7 +51,6 @@ describe('gallery.css', () => {
   it('never hardcodes a font stack: mono labels read --bit-font-mono', () => {
     expect(galleryCss).not.toMatch(/monospace/);
     expect(galleryCss).toMatch(/\.gallery-control__label\s*\{[^}]*font-family: var\(--bit-font-mono\);/);
-    expect(galleryCss).toMatch(/\.gallery-matrix__table th\s*\{[^}]*font-family: var\(--bit-font-mono\);/);
   });
 
   it('every face sample is one height and sits on its floor, so the token chips line up across the cards', () => {
@@ -63,4 +62,22 @@ describe('gallery.css', () => {
   it('script-moved focus on main and on tabIndex -1 targets draws no ring; real controls keep theirs', () => {
     expect(galleryCss).toMatch(/\.gallery-main:focus,\s*\.gallery-main \[tabindex="-1"\]:focus \{\s*outline: none;\s*\}/);
   });
+
+  it('the Matrix is gone: Variants is a bit Table', () => {
+    expect(galleryCss).not.toMatch(/gallery-matrix/);
+  });
+
+  it('the playground puts the controls beside the preview, and under it below 720px', () => {
+    expect(galleryCss).toMatch(/\.gallery-playground__top \{[^}]*grid-template-columns: minmax\(0, 1fr\) 16rem;/);
+    expect(galleryCss).toMatch(
+      /@media \(max-width: 720px\) \{\s*\.gallery-playground__top \{\s*grid-template-columns: minmax\(0, 1fr\);\s*\}\s*\}/,
+    );
+  });
+
+  it('the presets scroll sideways in one row instead of widening the page', () => {
+    const presets = /\.gallery-presets \{([^}]*)\}/.exec(galleryCss)![1]!;
+    expect(presets).toContain('overflow-x: auto;');
+    expect(presets).toContain('min-width: 0;');
+    expect(presets).not.toContain('flex-wrap');
+  });
 });
```

In `apps/gallery/src/gallery.css`:
- Add `gap` to `.gallery-preview__bar`.
- Delete the whole "presets and matrix" section.
- Insert the component-page block directly under `/* ---------- component page ---------- */`.

```diff
--- a/apps/gallery/src/gallery.css
+++ b/apps/gallery/src/gallery.css
@@ -295,6 +295,7 @@ html {
 .gallery-preview__bar {
   display: flex;
   align-items: center;
+  gap: var(--bit-space-12px);
   justify-content: space-between;
   padding: var(--bit-space-8px) var(--bit-space-12px);
   border-bottom: var(--bit-border-width) solid var(--bit-color-line);
@@ -332,36 +333,6 @@ html {
   outline: 2px dashed var(--bit-color-accent);
 }
 
-/* ---------- presets and matrix ---------- */
-.gallery-presets__row {
-  display: flex;
-  flex-wrap: wrap;
-  gap: var(--bit-space-8px);
-  margin-top: var(--bit-space-8px);
-}
-
-.gallery-matrix__scroll {
-  overflow-x: auto;
-  margin-top: var(--bit-space-8px);
-}
-
-.gallery-matrix__table {
-  border-collapse: separate;
-  border-spacing: var(--bit-space-12px);
-}
-
-.gallery-matrix__table th {
-  font-family: var(--bit-font-mono);
-  font-size: var(--bit-text-13px);
-  font-weight: var(--bit-weight-normal);
-  color: var(--bit-color-text-muted);
-  text-align: left;
-}
-
-.gallery-matrix__table td {
-  vertical-align: middle;
-}
-
 /* ---------- foundations pages ---------- */
 /* Cards side by side, as many as fit at 12rem or wider: the faces, Do and Don't, Stack or Box. */
 .gallery-grid {
@@ -431,6 +402,69 @@ html {
 }
 
 /* ---------- component page ---------- */
+/* Preview and controls side by side, the code under both. Under 720px the controls stack under the preview. */
+.gallery-playground {
+  display: grid;
+  gap: var(--bit-space-16px);
+}
+
+.gallery-playground__top {
+  display: grid;
+  grid-template-columns: minmax(0, 1fr) 16rem;
+  align-items: start;
+  gap: var(--bit-space-16px);
+}
+
+.gallery-codepanel {
+  display: grid;
+  gap: var(--bit-space-8px);
+}
+
+.gallery-codepanel__bar {
+  display: flex;
+  flex-wrap: wrap;
+  align-items: center;
+  gap: var(--bit-space-16px);
+}
+
+/* The presets sit in the preview bar between the title and the checkerboard switch. They take the room
+   left over and scroll sideways in one row when it runs out. */
+.gallery-presets {
+  flex: 1;
+  min-width: 0;
+  display: flex;
+  gap: var(--bit-space-8px);
+  overflow-x: auto;
+}
+
+.gallery-presets > * {
+  flex: none;
+}
+
+/* Short code (a prop name, a default, a class) stays on one line in the Props table; long types wrap. */
+.gallery-nowrap {
+  white-space: nowrap;
+}
+
+.gallery-control__error {
+  margin: 0;
+  font-size: var(--bit-text-13px);
+  color: var(--bit-color-danger-text);
+}
+
+/* Do and Don't, and the Accessibility list. */
+.gallery-bullets {
+  margin: 0;
+  padding-left: var(--bit-space-24px);
+  display: grid;
+  gap: var(--bit-space-4px);
+}
+
+@media (max-width: 720px) {
+  .gallery-playground__top {
+    grid-template-columns: minmax(0, 1fr);
+  }
+}
 
 /* ---------- tokens page ---------- */
 
```

- [ ] **Step 9: Run the gallery tests**

Run: `pnpm build && pnpm --filter @bit-ds/gallery test`
Expected: PASS, `Tests  392 passed (392)` on wave 1.

- [ ] **Step 10: Run every gate**

Run: `pnpm build && pnpm verify && pnpm test && pnpm test:coverage && pnpm typecheck && pnpm lint && pnpm smoke && pnpm storybook:build`
Expected: all green.

- [ ] **Step 11: Commit**

```bash
git add -A apps/gallery/src
git commit -m "feat(gallery): layout-C component page: header, section bar, Playground with Props | className | HTML, Variants table, Usage, Props with classes, Accessibility

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: The Tokens page (spec §4) and `SEMANTIC_TOKENS` from `@bit-ds/react`

**Files:**
- Modify:
  - `packages/react/src/index.ts` and `packages/react/src/index.test.tsx`
  - `packages/react/scripts/verify-dist.mjs` (the export check)
  - `apps/gallery/src/pages/TokensPage.tsx`
  - `apps/gallery/src/gallery.css` (the tokens-page section)
- Create:
  - `apps/gallery/src/pages/tokens/tokenValues.ts`, `ColorSection.tsx`, `CompactRows.tsx`, `ShapeSection.tsx` and `AllTokens.tsx`
  - `apps/gallery/src/pages/TokensPage.test.tsx`

**Interfaces:**
- **Consumes:**
  - From T2: `PageHeader`, `PageSection`, `SectionBar` and `CopyButton`
  - From bit: `useColorMode`, `COLORS`, `TEXT_SIZES` and `SPACE_STEPS`
  - Existing gallery classes: `.gallery-face[data-face]`, `.gallery-ruler__bar` and `.gallery-grid`
- **Produces:**
  - `SEMANTIC_TOKENS: readonly string[]` (92 names), exported from `@bit-ds/react`
  - `readTokenValues(mode, names?)` and `useTokenValues(): TokenValues`
  - `filterTokens(names, filter)` and `SURFACE_TOKENS`
  - the section ids `tokens-color`, `tokens-type`, `tokens-space`, `tokens-shape` and `tokens-all`

- [ ] **Step 1: Export `SEMANTIC_TOKENS` from `@bit-ds/react`, test first**

In `packages/react/src/index.test.tsx`:

```diff
--- a/packages/react/src/index.test.tsx
+++ b/packages/react/src/index.test.tsx
@@ -78,6 +78,13 @@ describe('public index', () => {
     expect(lib.SPACE_STEPS).toEqual([4, 8, 12, 16, 24, 32, 48, 64]);
   });
 
+  it('exports SEMANTIC_TOKENS, the 92 tier-2 token names every theme declares, from @bit-ds/core', () => {
+    expect(lib.SEMANTIC_TOKENS).toHaveLength(92);
+    expect(lib.SEMANTIC_TOKENS).toContain('--bit-color-primary');
+    expect(lib.SEMANTIC_TOKENS).toContain('--bit-space-64px');
+    expect(lib.SEMANTIC_TOKENS.every((name) => name.startsWith('--bit-'))).toBe(true);
+  });
+
   it.each(componentNames)('%s renders the root class the naming rule predicts', (name) => {
     const Component = (lib as Record<string, unknown>)[name] as ComponentType<Record<string, unknown>>;
     const sample = createElement(Component, { 'aria-label': 'x', children: 'x', ...SAMPLE_PROPS[name] });
```

Run: `pnpm --filter @bit-ds/react test -- index`
Expected: FAIL, because `lib.SEMANTIC_TOKENS` is undefined.

```diff
--- a/packages/react/src/index.ts
+++ b/packages/react/src/index.ts
@@ -1,4 +1,4 @@
-export { PREFIX } from '@bit-ds/core/tokens';
+export { PREFIX, SEMANTIC_TOKENS } from '@bit-ds/core/tokens';
 export { COLORS, SIZES, TEXT_SIZES, SPACE_STEPS, VARIANTS } from './system/axes';
 export type { Color, Size, TextSize, SpaceStep, Variant } from './system/axes';
 
```

```diff
--- a/packages/react/scripts/verify-dist.mjs
+++ b/packages/react/scripts/verify-dist.mjs
@@ -27,12 +27,14 @@ for (const name of EXPECTED) assert.ok(cjs[name], `CJS export missing: ${name}`)
 assert.equal(cjs.PREFIX, 'bit');
 assert.equal(typeof cjs.COLOR_MODE_SCRIPT, 'string', 'CJS export missing: COLOR_MODE_SCRIPT');
 assert.equal(typeof cjs.useColorMode, 'function', 'CJS export missing: useColorMode');
+assert.equal(cjs.SEMANTIC_TOKENS?.length, 92, 'CJS export missing: SEMANTIC_TOKENS (92 names)');
 
 // 2. ESM entry
 const esm = await import(resolve(dist, 'index.js'));
 for (const name of EXPECTED) assert.ok(esm[name], `ESM export missing: ${name}`);
 assert.equal(typeof esm.COLOR_MODE_SCRIPT, 'string', 'ESM export missing: COLOR_MODE_SCRIPT');
 assert.equal(typeof esm.useColorMode, 'function', 'ESM export missing: useColorMode');
+assert.equal(esm.SEMANTIC_TOKENS?.length, 92, 'ESM export missing: SEMANTIC_TOKENS (92 names)');
 
 // 3. Types
 assert.ok(existsSync(resolve(dist, 'index.d.cts')), 'index.d.cts missing (CJS types entry)');
```

Run: `pnpm build && pnpm verify && pnpm test:coverage`
Expected: `dist OK: 27 components`, and react `409` at `100%`.

- [ ] **Step 2: Write the failing page test**

Create `apps/gallery/src/pages/TokensPage.test.tsx`. jsdom computes custom properties from a `<style>`, including the `[data-mode="dark"]` rule, but it loads no CSS files and doesn't resolve `var()`. So the test injects literal values.

```tsx
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, afterEach, beforeAll, describe, it, expect } from 'vitest';
import { SEMANTIC_TOKENS } from '@bit-ds/react';
import { renderAt } from '../test/renderRoute';
import { filterTokens } from './tokens/AllTokens';
import { expectNoA11yViolations } from '../test/a11y';

/** jsdom loads no CSS, so give it a few literal token values, light and dark, to compute. */
const THEME = `
  :root { --bit-color-primary: #7C3AED; --bit-color-neutral: #FFFFFF; --bit-color-bg: #EEEFE9; --bit-radius-6px: 6px; }
  [data-mode="dark"] { --bit-color-neutral: #2B2B37; --bit-color-bg: #15151C; }
`;
let style: HTMLStyleElement;

beforeAll(() => {
  style = document.createElement('style');
  style.textContent = THEME;
  document.head.append(style);
});

afterAll(() => style.remove());

afterEach(() => {
  localStorage.clear();
});

async function open() {
  const utils = renderAt('/tokens');
  await screen.findByRole('heading', { level: 1, name: 'Tokens' });
  return utils;
}

const card = (color: string) => screen.getByRole('group', { name: `${color} tokens` });

describe('TokensPage', () => {
  it('has the Foundations eyebrow, a section bar, and the five sections in order, with no axe violations', async () => {
    const { container } = await open();
    const main = screen.getByRole('main');
    expect(within(main).getByText('Foundations')).toHaveClass('gallery-eyebrow');
    const titles = ['Color', 'Type', 'Space', 'Shape', 'All tokens'];
    expect(within(main).getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(titles);
    const bar = screen.getByRole('navigation', { name: 'On this page' });
    expect(within(bar).getAllByRole('link').map((l) => l.textContent)).toEqual(titles);
    await expectNoA11yViolations(container);
  });

  it('the color cards show values computed from the live page, on the first render', async () => {
    await open();
    expect(within(card('primary')).getByText('#7C3AED')).toHaveClass('bit-code');
    expect(within(card('neutral')).getByText('#FFFFFF')).toBeInTheDocument();
    expect(within(card('danger')).getAllByText(/fill|hover|soft|contrast/).map((el) => el.textContent)).toEqual([
      'fill',
      'hover',
      'soft',
      'contrast',
    ]);
    expect(within(screen.getByRole('group', { name: 'Surface tokens' })).getByText('#EEEFE9')).toBeInTheDocument();
  });

  it('switching the mode re-reads the values', async () => {
    await open();
    await userEvent.click(within(screen.getByRole('banner')).getByRole('button', { name: 'Dark' }));
    expect(within(card('neutral')).getByText('#2B2B37')).toBeInTheDocument();
    expect(within(screen.getByRole('group', { name: 'Surface tokens' })).getByText('#15151C')).toBeInTheDocument();
    await userEvent.click(within(screen.getByRole('banner')).getByRole('button', { name: 'Light' }));
    expect(within(card('neutral')).getByText('#FFFFFF')).toBeInTheDocument();
  });

  it('Type and Space are one compact row each, linking to their pages', async () => {
    await open();
    expect(screen.getByRole('link', { name: 'See Typography' })).toHaveAttribute('href', '/typography');
    expect(screen.getByRole('link', { name: 'See Spacing' })).toHaveAttribute('href', '/spacing');
    const type = screen.getByRole('region', { name: 'Type' });
    expect([...type.querySelectorAll('.gallery-face')].map((el) => el.textContent)).toEqual([
      'Lilita One',
      'Nunito',
      'Press Start',
      'JetBrains Mono',
    ]);
    expect(screen.getByRole('region', { name: 'Space' }).querySelectorAll('.gallery-ruler__bar')).toHaveLength(8);
  });

  it('Shape has a tile per radius and shadow token, with its name and value', async () => {
    await open();
    const shape = screen.getByRole('region', { name: 'Shape' });
    expect(shape.querySelectorAll('.gallery-shape')).toHaveLength(8);
    expect(within(shape).getByText('--bit-radius-6px')).toHaveClass('bit-code');
    expect(within(shape).getByText('6px')).toBeInTheDocument();
  });

  it('All tokens: every token with a count, and a Copy for each that copies var(--name)', async () => {
    await open();
    const count = screen.getByText(`${SEMANTIC_TOKENS.length} of ${SEMANTIC_TOKENS.length} tokens`);
    expect(count).toHaveClass('bit-badge');
    expect(count).toHaveAttribute('role', 'status');
    const table = screen.getByRole('region', { name: 'Token values' });
    expect(within(table).getAllByRole('row')).toHaveLength(SEMANTIC_TOKENS.length + 1);
    expect(within(table).getByRole('button', { name: 'Copy var(--bit-color-primary)' })).toBeInTheDocument();
  });

  it('the filter narrows the table and the count', async () => {
    await open();
    await userEvent.type(screen.getByLabelText('Filter'), 'SPACE');
    const table = screen.getByRole('region', { name: 'Token values' });
    expect(within(table).getAllByRole('row')).toHaveLength(8 + 1);
    expect(screen.getByText(`8 of ${SEMANTIC_TOKENS.length} tokens`)).toBeInTheDocument();
  });

  it('no match: the message, the name format, and Clear filter, which restores the list and focuses the field', async () => {
    await open();
    const field = screen.getByLabelText('Filter');
    await userEvent.type(field, 'sparkle');
    expect(screen.queryByRole('region', { name: 'Token values' })).toBeNull();
    expect(screen.getByText('No tokens match “sparkle”.')).toBeInTheDocument();
    expect(screen.getByText('--bit-color-primary', { selector: 'code' })).toBeInTheDocument();
    expect(screen.getByText(`0 of ${SEMANTIC_TOKENS.length} tokens`)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Clear filter' }));
    expect(field).toHaveValue('');
    expect(document.activeElement).toBe(field);
    expect(screen.getByRole('region', { name: 'Token values' })).toBeInTheDocument();
  });
});

describe('filterTokens', () => {
  it('matches part of a name, ignoring case and outer spaces; empty keeps every name', () => {
    expect(filterTokens(['--bit-color-bg', '--bit-space-4px'], ' COLOR ')).toEqual(['--bit-color-bg']);
    expect(filterTokens(['--bit-color-bg'], '')).toEqual(['--bit-color-bg']);
    expect(filterTokens(['--bit-color-bg'], 'zzz')).toEqual([]);
  });
});
```

Run: `pnpm --filter @bit-ds/gallery test -- TokensPage`
Expected: FAIL, because `./tokens/AllTokens` doesn't resolve.

- [ ] **Step 3: Write the parts**

Create `apps/gallery/src/pages/tokens/tokenValues.ts`. It reads the values during render, so the first paint has them, and reads them again when the mode changes.

```ts
import { useMemo } from 'react';
import { SEMANTIC_TOKENS, useColorMode } from '@bit-ds/react';
import type { ColorMode } from '@bit-ds/react';

/** Every public token's value as the page computes it right now. */
export interface TokenValues {
  /** The mode these values were read in. */
  mode: ColorMode;
  /** Token name → computed value, e.g. `--bit-color-primary` → `#7C3AED`. Empty when the theme lacks one. */
  values: ReadonlyMap<string, string>;
}

/** Read each token from the live document's computed style, so the values match the theme and the mode. */
export function readTokenValues(mode: ColorMode, names: readonly string[] = SEMANTIC_TOKENS): TokenValues {
  const style = getComputedStyle(document.documentElement);
  return { mode, values: new Map(names.map((name) => [name, style.getPropertyValue(name).trim()])) };
}

/**
 * The token values for the current mode. Read during render, so the first paint already has them (no blank
 * flash), and read again whenever the mode changes.
 */
export function useTokenValues(): TokenValues {
  const { mode } = useColorMode();
  return useMemo(() => readTokenValues(mode), [mode]);
}
```

Create `apps/gallery/src/pages/tokens/ColorSection.tsx`:

```tsx
import { Card, CardBody, CardHeader, Code, COLORS, Stack, Text } from '@bit-ds/react';
import type { TokenValues } from './tokenValues';

const ROLES = [
  ['fill', ''],
  ['hover', '-hover'],
  ['soft', '-soft'],
  ['contrast', '-contrast'],
] as const;

/** The page-wide colors that aren't one of the five roles. */
export const SURFACE_TOKENS = [
  ['bg', '--bit-color-bg'],
  ['surface', '--bit-color-surface'],
  ['text', '--bit-color-text'],
  ['text-muted', '--bit-color-text-muted'],
  ['ink', '--bit-color-ink'],
  ['focus', '--bit-focus-ring-color'],
] as const;

/** A square of the token's own color, read live through var(). Decoration: the name and value say it. */
function Swatch({ token }: { token: string }) {
  return <span className="gallery-swatch" style={{ background: `var(${token})` }} aria-hidden="true" />;
}

function SwatchRow({ name, token, values }: { name: string; token: string; values: TokenValues }) {
  return (
    <Stack direction="row" gap={8} align="center">
      <Swatch token={token} />
      <Stack gap={4}>
        <Text as="span" size={13} weight="bold">
          {name}
        </Text>
        <Code>{values.values.get(token)}</Code>
      </Stack>
    </Stack>
  );
}

/** One Card per color role, headed in its fill and contrast, then the surface tokens in a row. */
export function ColorSection({ values }: { values: TokenValues }) {
  return (
    <Stack gap={16}>
      <div className="gallery-grid">
        {COLORS.map((color) => (
          <Card key={color} aria-label={`${color} tokens`} role="group">
            <CardHeader style={{ background: `var(--bit-color-${color})`, color: `var(--bit-color-${color}-contrast)` }}>
              {color}
            </CardHeader>
            <CardBody>
              <Stack gap={8}>
                {ROLES.map(([role, suffix]) => (
                  <SwatchRow key={role} name={role} token={`--bit-color-${color}${suffix}`} values={values} />
                ))}
              </Stack>
            </CardBody>
          </Card>
        ))}
      </div>
      <Stack direction="row" gap={16} wrap role="group" aria-label="Surface tokens">
        {SURFACE_TOKENS.map(([name, token]) => (
          <SwatchRow key={token} name={name} token={token} values={values} />
        ))}
      </Stack>
    </Stack>
  );
}
```

Create `apps/gallery/src/pages/tokens/CompactRows.tsx`:

```tsx
import { Box, Link, Stack, SPACE_STEPS, Text, TEXT_SIZES } from '@bit-ds/react';
import { Link as RouterLink } from 'react-router-dom';

const FACES = [
  ['display', 'Lilita One'],
  ['body', 'Nunito'],
  ['pixel', 'Press Start'],
  ['mono', 'JetBrains Mono'],
] as const;

function SeeMore({ to, page }: { to: string; page: string }) {
  return (
    <Link asChild>
      <RouterLink to={to}>
        See {page} <span aria-hidden="true">→</span>
      </RouterLink>
    </Link>
  );
}

/** The four faces by name, each in its own face, the text sizes as samples, and a link to Typography. */
export function TypeRow() {
  return (
    <Stack direction="row" gap={24} align="end" wrap>
      {FACES.map(([face, name]) => (
        <Text key={face} as="span" size={24} className="gallery-face" data-face={face}>
          {name}
        </Text>
      ))}
      <Stack direction="row" gap={12} align="end" wrap>
        {TEXT_SIZES.map((size) => (
          <Text key={size} as="span" size={size}>
            {size}
          </Text>
        ))}
      </Stack>
      <SeeMore to="/typography" page="Typography" />
    </Stack>
  );
}

/** The eight space steps as bars drawn by Box padding, with their numbers, and a link to Spacing. */
export function SpaceRow() {
  return (
    <Stack direction="row" gap={24} align="end" wrap>
      <Stack direction="row" gap={12} align="end" wrap>
        {SPACE_STEPS.map((step) => (
          <Stack key={step} gap={4} align="center">
            <Box paddingLeft={step} className="gallery-ruler__bar" aria-hidden="true" />
            <Text as="span" size={13} color="neutral">
              {step}
            </Text>
          </Stack>
        ))}
      </Stack>
      <SeeMore to="/spacing" page="Spacing" />
    </Stack>
  );
}
```

Create `apps/gallery/src/pages/tokens/ShapeSection.tsx`:

```tsx
import { Code, SEMANTIC_TOKENS, Stack, Text } from '@bit-ds/react';
import type { CSSProperties } from 'react';
import type { TokenValues } from './tokenValues';

const RADII = SEMANTIC_TOKENS.filter((name) => name.startsWith('--bit-radius-'));
const SHADOWS = SEMANTIC_TOKENS.filter((name) => name.startsWith('--bit-shadow-'));

function ShapeTile({ token, style, values }: { token: string; style: CSSProperties; values: TokenValues }) {
  return (
    <Stack gap={8} align="start">
      <span className="gallery-shape" style={style} aria-hidden="true" />
      <Code>{token}</Code>
      <Text as="span" size={13} color="neutral">
        {values.values.get(token)}
      </Text>
    </Stack>
  );
}

/** A tile per radius and per shadow, drawn with the token itself, labelled with its name and value. */
export function ShapeSection({ values }: { values: TokenValues }) {
  return (
    <div className="gallery-grid">
      {RADII.map((token) => (
        <ShapeTile key={token} token={token} style={{ borderRadius: `var(${token})` }} values={values} />
      ))}
      {SHADOWS.map((token) => (
        <ShapeTile key={token} token={token} style={{ boxShadow: `var(${token})` }} values={values} />
      ))}
    </div>
  );
}
```

Create `apps/gallery/src/pages/tokens/AllTokens.tsx`:

```tsx
import { useRef, useState } from 'react';
import {
  Badge,
  Button,
  Code,
  Field,
  Input,
  SEMANTIC_TOKENS,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Text,
} from '@bit-ds/react';
import { CopyButton } from '../../ui/CopyButton';
import type { TokenValues } from './tokenValues';

/** Names containing the filter text, ignoring case and surrounding spaces. An empty filter keeps them all. */
export function filterTokens(names: readonly string[], filter: string): readonly string[] {
  const query = filter.trim().toLowerCase();
  return query === '' ? names : names.filter((name) => name.toLowerCase().includes(query));
}

/** Every public token: a filter with its count, then name, current value and Copy (`var(--name)`). */
export function AllTokens({ values }: { values: TokenValues }) {
  const [filter, setFilter] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const shown = filterTokens(SEMANTIC_TOKENS, filter);
  const clear = () => {
    setFilter('');
    input.current?.focus();
  };
  return (
    <Stack gap={12}>
      <Stack direction="row" gap={12} align="end" wrap>
        <Field label="Filter">
          <Input ref={input} type="search" value={filter} onChange={(event) => setFilter(event.target.value)} />
        </Field>
        <Badge role="status" variant="outline" shape="square">
          {`${shown.length} of ${SEMANTIC_TOKENS.length} tokens`}
        </Badge>
      </Stack>
      {shown.length === 0 ? (
        <Stack gap={8} align="start">
          <Text>No tokens match “{filter.trim()}”.</Text>
          <Text size={13} color="neutral">
            Token names look like <Code>--bit-color-primary</Code> or <Code>--bit-space-16px</Code>. Try part of one, such as
            color or space.
          </Text>
          <Button variant="outline" color="neutral" size="sm" onClick={clear}>
            Clear filter
          </Button>
        </Stack>
      ) : (
        <Table aria-label="Token values">
          <TableHead>
            <TableRow>
              <TableCell>Token</TableCell>
              <TableCell>Value</TableCell>
              <TableCell>Copy</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {shown.map((name) => (
              <TableRow key={name}>
                <TableCell>
                  <Code>{name}</Code>
                </TableCell>
                <TableCell>{values.values.get(name)}</TableCell>
                <TableCell>
                  <CopyButton text={`var(${name})`} label={`Copy var(${name})`} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Stack>
  );
}
```

Replace `apps/gallery/src/pages/TokensPage.tsx` with:

```tsx
import { Stack, Text } from '@bit-ds/react';
import { PageHeader } from '../ui/PageHeader';
import { PageSection } from '../ui/PageSection';
import { SectionBar } from '../ui/SectionBar';
import { useTokenValues } from './tokens/tokenValues';
import { ColorSection } from './tokens/ColorSection';
import { SpaceRow, TypeRow } from './tokens/CompactRows';
import { ShapeSection } from './tokens/ShapeSection';
import { AllTokens } from './tokens/AllTokens';

const SECTIONS = {
  color: { id: 'tokens-color', title: 'Color' },
  type: { id: 'tokens-type', title: 'Type' },
  space: { id: 'tokens-space', title: 'Space' },
  shape: { id: 'tokens-shape', title: 'Shape' },
  all: { id: 'tokens-all', title: 'All tokens' },
} as const;

/** Foundations: the theme's whole public API, with values computed live in the current mode. */
export function TokensPage() {
  const values = useTokenValues();
  return (
    <Stack gap={32}>
      <Stack gap={16}>
        <PageHeader eyebrow="Foundations" title="Tokens">
          <Text size={18}>
            Every value a theme sets, read live from this page, so they follow the light and dark switch.
          </Text>
        </PageHeader>
        <SectionBar sections={Object.values(SECTIONS)} />
      </Stack>
      <PageSection {...SECTIONS.color}>
        <ColorSection values={values} />
      </PageSection>
      <PageSection {...SECTIONS.type}>
        <TypeRow />
      </PageSection>
      <PageSection {...SECTIONS.space}>
        <SpaceRow />
      </PageSection>
      <PageSection {...SECTIONS.shape}>
        <ShapeSection values={values} />
      </PageSection>
      <PageSection {...SECTIONS.all}>
        <AllTokens values={values} />
      </PageSection>
    </Stack>
  );
}
```

- [ ] **Step 4: The CSS**

In `apps/gallery/src/gallery.css`, insert this directly under `/* ---------- tokens page ---------- */`:

```css
/* A color sample: the token's own color, set inline through var(), edged so white and the page bg show. */
.gallery-swatch {
  flex: none;
  width: var(--bit-space-24px);
  height: var(--bit-space-24px);
  border: 2px solid var(--bit-color-line);
  border-radius: var(--bit-radius-6px);
}

/* A shape sample: a surface square that takes one radius or shadow token inline. */
.gallery-shape {
  width: var(--bit-space-64px);
  height: var(--bit-space-48px);
  background: var(--bit-color-surface);
  border: var(--bit-border-width) solid var(--bit-color-line);
}
```

- [ ] **Step 5: Run the gallery tests**

Run: `pnpm --filter @bit-ds/gallery test`
Expected: PASS: `Tests  306 passed (306)` on wave 1, or `401` after T4.

- [ ] **Step 6: Run every gate**

Run: `pnpm build && pnpm verify && pnpm test && pnpm test:coverage && pnpm typecheck && pnpm lint && pnpm smoke && pnpm storybook:build`
Expected: all green, with react `409`.

- [ ] **Step 7: Commit**

```bash
git add packages/react apps/gallery/src/pages apps/gallery/src/gallery.css
git commit -m "feat(gallery): Tokens page with live computed values, compact Type and Space rows, Shape, and the All tokens filter; SEMANTIC_TOKENS exported

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Home, InstallCommand and the version (spec §5–6, Amendment 1 §3)

**Files** (bare paths are under `apps/gallery/src/`):
- Create:
  - `content/install.ts`, `content/InstallCommand.tsx` and `content/InstallCommand.test.tsx`
  - `pages/home/ComponentTiles.tsx`, `pages/home/GetStarted.tsx` and `pages/home/NamingRule.tsx`
  - `pages/HomePage.test.tsx`, `env.d.ts` and `version.test.ts`
- Modify:
  - `pages/HomePage.tsx` and `shell/Shell.test.tsx`
  - `apps/gallery/vite.config.ts` and `apps/gallery/vitest.config.ts`
  - `gallery.css` (the home-page section) and `README.md`

**Interfaces:**
- **Consumes:**
  - From T1: CodeBlock `actions`
  - From T2: `STYLE_IMPORTS`
  - Existing: `NAV` (`shell/Sidebar.tsx`), `MANIFESTS`, `routeFor`, `renderManifest` and `defaultState`
- **Produces:**
  - **For PR3c's `snippets.mjs`:**
    - `PACKAGE_NAME`, `PACKAGE_MANAGERS` and `PackageManager`
    - `INSTALL_COMMANDS`, `DEFAULT_PACKAGE_MANAGER` and `PACKAGE_MANAGER_STORAGE_KEY`
    - `isPackageManager`, `readPackageManager` and `writePackageManager`
  - **Components:** `InstallCommand()`
  - **Version:** `__BIT_VERSION__` (a global const), plus `BIT_VERSION` and `DEFINE` from `vite.config.ts`
  - **Home:** `BROWSE_TARGET`, `isLargeTile`, `NAMING_ROWS` and `NAMING_COLUMNS`. A new naming-rule column is one entry in `NAMING_COLUMNS`.

- [ ] **Step 1: Write the failing tests**

Create `apps/gallery/src/content/InstallCommand.test.tsx`:

```tsx
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { InstallCommand } from './InstallCommand';
import { INSTALL_COMMANDS, PACKAGE_MANAGER_STORAGE_KEY, readPackageManager, writePackageManager } from './install';
import { expectNoA11yViolations } from '../test/a11y';

const command = () => screen.getByRole('region', { name: 'Install command' }).textContent;

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
  Reflect.deleteProperty(navigator, 'clipboard');
});

describe('install commands', () => {
  it('are pnpm add, npm install and yarn add, for @bit-ds/react', () => {
    expect(INSTALL_COMMANDS).toEqual({
      pnpm: 'pnpm add @bit-ds/react',
      npm: 'npm install @bit-ds/react',
      yarn: 'yarn add @bit-ds/react',
    });
    expect(PACKAGE_MANAGER_STORAGE_KEY).toBe('bit-gallery-package-manager');
  });

  it('nothing stored, an unknown value, or blocked storage all read as pnpm', () => {
    expect(readPackageManager()).toBe('pnpm');
    localStorage.setItem(PACKAGE_MANAGER_STORAGE_KEY, 'bun');
    expect(readPackageManager()).toBe('pnpm');
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(readPackageManager()).toBe('pnpm');
  });

  it('a blocked write is silent', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => writePackageManager('yarn')).not.toThrow();
  });
});

describe('InstallCommand', () => {
  it('shows pnpm by default, in a shell CodeBlock with the switcher in its bar, left of Copy', async () => {
    const { container } = render(<InstallCommand />);
    expect(command()).toBe('pnpm add @bit-ds/react');
    expect(screen.getByRole('radio', { name: 'pnpm' })).toBeChecked();
    const bar = container.querySelector('.bit-code__bar')!;
    expect(bar.querySelector('.bit-code__actions')).toContainElement(screen.getByRole('group', { name: 'Package manager' }));
    expect(bar.querySelector('.bit-code__actions + .bit-code__copy')).not.toBeNull();
    expect(container.querySelector('.bit-segmented-control')).toHaveClass('bit-sm');
    await expectNoA11yViolations(container);
  });

  it('each manager shows its command', async () => {
    render(<InstallCommand />);
    await userEvent.click(screen.getByRole('radio', { name: 'npm' }));
    expect(command()).toBe('npm install @bit-ds/react');
    await userEvent.click(screen.getByRole('radio', { name: 'yarn' }));
    expect(command()).toBe('yarn add @bit-ds/react');
  });

  it('Copy copies the selected command', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    render(<InstallCommand />);
    await userEvent.click(screen.getByRole('radio', { name: 'yarn' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    });
    expect(writeText).toHaveBeenCalledWith('yarn add @bit-ds/react');
  });

  it('the pick persists and is restored on the next visit', async () => {
    const first = render(<InstallCommand />);
    await userEvent.click(screen.getByRole('radio', { name: 'npm' }));
    expect(localStorage.getItem(PACKAGE_MANAGER_STORAGE_KEY)).toBe('npm');
    first.unmount();
    render(<InstallCommand />);
    expect(screen.getByRole('radio', { name: 'npm' })).toBeChecked();
    expect(command()).toBe('npm install @bit-ds/react');
  });

  it('blocked storage falls back to pnpm and the switcher still works for the visit', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    render(<InstallCommand />);
    expect(command()).toBe('pnpm add @bit-ds/react');
    await userEvent.click(screen.getByRole('radio', { name: 'yarn' }));
    expect(command()).toBe('yarn add @bit-ds/react');
  });

  it('an unknown stored value falls back to pnpm', () => {
    localStorage.setItem(PACKAGE_MANAGER_STORAGE_KEY, 'bun');
    render(<InstallCommand />);
    expect(command()).toBe('pnpm add @bit-ds/react');
  });
});
```

Create `apps/gallery/src/version.test.ts`:

```ts
// @vitest-environment node
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, it, expect } from 'vitest';
import { BIT_VERSION } from '../vite.config';

const require = createRequire(import.meta.url);
const pkg = JSON.parse(readFileSync(require.resolve('@bit-ds/react/package.json'), 'utf8')) as { version: string };

describe('__BIT_VERSION__', () => {
  it("is @bit-ds/react's package.json version, inlined at build time", () => {
    expect(BIT_VERSION).toBe(pkg.version);
    expect(__BIT_VERSION__).toBe(pkg.version);
  });

  it('is a semver version (0.0.0 until PR3c sets the release)', () => {
    expect(__BIT_VERSION__).toMatch(/^\d+\.\d+\.\d+/);
  });
});
```

Create `apps/gallery/src/pages/HomePage.test.tsx`:

```tsx
import { screen, within } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderAt } from '../test/renderRoute';
import { expectNoA11yViolations } from '../test/a11y';
import { MANIFESTS, routeFor } from '../manifests';
import { NAV } from '../shell/Sidebar';
import { STYLE_IMPORTS } from '../content/styleImports';
import { NAMING_COLUMNS } from './home/NamingRule';
import { BROWSE_TARGET } from './HomePage';

async function open() {
  const utils = renderAt('/');
  await screen.findByRole('heading', { level: 1, name: 'bit Design System' });
  return utils;
}

const main = () => screen.getByRole('main');

describe('HomePage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('the hero: BitLogo as the h1, the tagline, and two Buttons, with no axe violations', async () => {
    const { container } = await open();
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(within(h1).getByRole('img', { name: 'bit Design System' })).toHaveClass('bit-lg');
    expect(
      screen.getByText(
        'A retro-game React design system for people new to design systems. The prop you type is the class it emits is the token it reads.',
      ),
    ).toBeInTheDocument();
    const browse = screen.getByRole('link', { name: 'Browse components' });
    expect(browse).toHaveClass('bit-button', 'bit-primary', 'bit-solid');
    expect(browse).toHaveAttribute('href', BROWSE_TARGET);
    expect(screen.getByRole('link', { name: 'See the tokens' })).toHaveClass('bit-outline');
    expect(screen.getByRole('link', { name: 'See the tokens' })).toHaveAttribute('href', '/tokens');
    await expectNoA11yViolations(container);
  });

  it('Browse components goes to the first component in the sidebar', () => {
    expect(BROWSE_TARGET).toBe(NAV.find((item) => item.group === 'Components')!.to);
  });

  it('Components and Forms are h2s with counts from the manifests', async () => {
    await open();
    for (const [title, group] of [
      ['Components', 'components'],
      ['Forms', 'forms'],
    ] as const) {
      const heading = within(main()).getByRole('heading', { level: 2, name: title });
      expect(heading.parentElement).toHaveTextContent(`${title}${MANIFESTS.filter((m) => m.group === group).length}`);
    }
  });

  it('one tile per manifest except the logo, each one Link to its page', async () => {
    await open();
    const tiles = MANIFESTS.filter((m) => m.group !== 'brand');
    for (const m of tiles) {
      const links = within(main()).getAllByRole('link', { name: m.name });
      expect(links.map((l) => l.getAttribute('href')), m.name).toEqual([routeFor(m)]);
    }
    expect(within(main()).queryByRole('link', { name: 'BitLogo' })).toBeNull();
  });

  it('large tiles show a live, inert preview: Alert, Button, Card, SegmentedControl and the four Forms', async () => {
    const { container } = await open();
    const large = [...container.querySelectorAll('.gallery-tile')].map((tile) => tile.querySelector('a')!.textContent!.replace(' →', ''));
    expect(large).toEqual(['Button', 'Alert', 'Card', 'SegmentedControl', 'Field', 'Input', 'Select', 'Switch']);
    for (const preview of container.querySelectorAll('.gallery-tile__preview')) {
      expect(preview).toHaveAttribute('inert');
      expect(preview.querySelector('[class*="bit-"]')).not.toBeNull();
    }
  });

  it('Get started: three numbered steps, the version Badge, the install switcher and the style imports', async () => {
    await open();
    const steps = within(main()).getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(steps).toEqual(['Install', 'Add the styles once', 'Use a component']);
    // version.test.ts pins __BIT_VERSION__ to @bit-ds/react's package.json.
    expect(screen.getByText(`v${__BIT_VERSION__}`)).toHaveClass('bit-badge');
    expect(screen.getByRole('region', { name: 'Install command' }).textContent).toBe('pnpm add @bit-ds/react');
    expect(screen.getByRole('region', { name: 'Style imports' }).textContent).toBe(STYLE_IMPORTS);
    expect(screen.getByRole('region', { name: 'First component' }).textContent).toBe(
      "import { Button } from '@bit-ds/react';\n\n<Button>Save</Button>",
    );
  });

  it('the naming rule has five columns, and its Result column renders real Buttons', async () => {
    await open();
    const table = screen.getByRole('region', { name: 'The naming rule' });
    expect(within(table).getAllByRole('columnheader').map((th) => th.textContent)).toEqual([
      'You write (prop)',
      'Or write (className)',
      'Class it emits',
      'Token',
      'Result',
    ]);
    expect(NAMING_COLUMNS).toHaveLength(5);
    const buttons = within(table).getAllByRole('button', { name: 'Save' });
    expect(buttons.map((b) => b.className)).toEqual([
      'bit-button bit-primary bit-solid bit-md',
      'bit-button bit-primary bit-outline bit-md',
      'bit-button bit-primary bit-solid bit-lg',
    ]);
    expect(within(table).getByText('className="bit-outline"')).toHaveClass('bit-code');
    expect(within(table).getByText('--bit-control-height-lg')).toHaveClass('bit-code');
  });
});
```

In `apps/gallery/src/shell/Shell.test.tsx`, delete the two old Home tests. `HomePage.test.tsx` replaces them, and the old install block and the "two ways" card are gone:

```diff
--- a/apps/gallery/src/shell/Shell.test.tsx
+++ b/apps/gallery/src/shell/Shell.test.tsx
@@ -9,34 +9,6 @@ describe('Shell', () => {
     document.documentElement.dataset.theme = 'power-up';
   });
 
-  it('home shows the logo, the install lines, and the naming rule', async () => {
-    const { container } = renderAt('/');
-    expect((await screen.findAllByRole('img', { name: 'bit Design System' })).length).toBeGreaterThan(0);
-    const heading = screen.getByRole('heading', { level: 1, name: 'bit Design System' });
-    expect(within(heading).getByRole('img', { name: 'bit Design System' })).toBeInTheDocument();
-    // The old separate "bit" h1 is gone: the logo is the heading.
-    expect(screen.queryByText('bit', { selector: 'h1' })).toBeNull();
-    const install = container.querySelector('.bit-code__block[data-language="shell"] pre');
-    expect(install?.textContent).toBe(
-      "pnpm add @bit-ds/react\nimport '@bit-ds/react/themes/power-up.css';\nimport '@bit-ds/react/styles.css';",
-    );
-    expect(screen.getByText('bit-primary')).toBeInTheDocument();
-    await expectNoA11yViolations(container);
-  });
-
-  it('home shows its three snippets as CodeBlocks: install in shell, then the React and HTML ways', async () => {
-    const { container } = renderAt('/');
-    await screen.findByRole('heading', { level: 1 });
-    const blocks = [...container.querySelectorAll('.bit-code__block')];
-    expect(blocks.map((b) => b.getAttribute('data-language'))).toEqual(['shell', 'jsx', 'html']);
-    expect(blocks[1]!.querySelector('pre')!.textContent).toBe('<Card><CardHeader>Stats</CardHeader></Card>');
-    expect(blocks[2]!.querySelector('pre')!.textContent).toBe(
-      '<div class="bit-card bit-solid"><div class="bit-card__header">Stats</div></div>',
-    );
-    expect(blocks[1]!.querySelector('[data-kind="component"]')).toHaveTextContent('Card');
-    expect(container.querySelector('pre.gallery-pre')).toBeNull();
-  });
-
   it('has a skip link that targets main', async () => {
     renderAt('/');
     const skip = await screen.findByRole('link', { name: 'Skip to content' });
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `pnpm build && pnpm --filter @bit-ds/gallery test -- InstallCommand version HomePage`
Expected: FAIL.
- `./InstallCommand` and `./install` don't resolve.
- `BIT_VERSION` isn't exported from `vite.config`.
- `__BIT_VERSION__` is not defined.
- Home has no tiles or naming columns.

- [ ] **Step 3: The install module and the switcher**

Create `apps/gallery/src/content/install.ts`:

```ts
/**
 * The install commands, in one place. The gallery's InstallCommand reads them; PR3c's snippets.mjs and the
 * consumer smoke test will import them too, so every install line anywhere matches.
 */
export const PACKAGE_NAME = '@bit-ds/react';

export const PACKAGE_MANAGERS = ['pnpm', 'npm', 'yarn'] as const;
export type PackageManager = (typeof PACKAGE_MANAGERS)[number];

export const INSTALL_COMMANDS: Readonly<Record<PackageManager, string>> = {
  pnpm: `pnpm add ${PACKAGE_NAME}`,
  npm: `npm install ${PACKAGE_NAME}`,
  yarn: `yarn add ${PACKAGE_NAME}`,
};

export const DEFAULT_PACKAGE_MANAGER: PackageManager = 'pnpm';

/** Where the visitor's pick is remembered. */
export const PACKAGE_MANAGER_STORAGE_KEY = 'bit-gallery-package-manager';

export function isPackageManager(value: unknown): value is PackageManager {
  return typeof value === 'string' && (PACKAGE_MANAGERS as readonly string[]).includes(value);
}

/** The remembered pick. Blocked storage, nothing stored, or an unknown value all give pnpm. */
export function readPackageManager(): PackageManager {
  try {
    const stored = window.localStorage.getItem(PACKAGE_MANAGER_STORAGE_KEY);
    return isPackageManager(stored) ? stored : DEFAULT_PACKAGE_MANAGER;
  } catch {
    return DEFAULT_PACKAGE_MANAGER;
  }
}

/** Remember the pick. Blocked storage (private browsing) keeps it for this visit only, silently. */
export function writePackageManager(manager: PackageManager): void {
  try {
    window.localStorage.setItem(PACKAGE_MANAGER_STORAGE_KEY, manager);
  } catch {
    // Storage is blocked: the pick lasts until the page closes.
  }
}
```

Create `apps/gallery/src/content/InstallCommand.tsx`:

```tsx
import { useState } from 'react';
import { CodeBlock, SegmentedControl } from '@bit-ds/react';
import { INSTALL_COMMANDS, isPackageManager, PACKAGE_MANAGERS, readPackageManager, writePackageManager } from './install';
import type { PackageManager } from './install';

const OPTIONS = PACKAGE_MANAGERS.map((manager) => ({ value: manager, label: manager }));

/**
 * The install command in the visitor's package manager. A small SegmentedControl in the CodeBlock's bar
 * picks pnpm, npm or yarn; the pick is remembered, and Copy copies the command shown.
 */
export function InstallCommand() {
  const [manager, setManager] = useState<PackageManager>(readPackageManager);
  const choose = (value: string) => {
    if (!isPackageManager(value)) return;
    setManager(value);
    writePackageManager(value);
  };
  return (
    <CodeBlock
      code={INSTALL_COMMANDS[manager]}
      language="shell"
      label="Install command"
      actions={
        <SegmentedControl
          legend="Package manager"
          legendHidden
          size="sm"
          options={OPTIONS}
          value={manager}
          onValueChange={choose}
        />
      }
    />
  );
}
```

- [ ] **Step 4: The version, through Vite `define`**

Replace `apps/gallery/vite.config.ts` with:

```ts
import { createRequire } from 'node:module';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** Served from https://doosemavis.github.io/bit-design-system/ in production, from / in dev. */
export const PAGES_BASE = '/bit-design-system/';

const require = createRequire(import.meta.url);

/** @bit-ds/react's version, read at build time from its package.json. Home shows it as `v{version}`. */
export const BIT_VERSION: string = (require('@bit-ds/react/package.json') as { version: string }).version;

/** Compile-time constants, shared with vitest.config.ts so tests see the same values. */
export const DEFINE = { __BIT_VERSION__: JSON.stringify(BIT_VERSION) };

export default defineConfig(({ command }) => ({
  base: command === 'build' ? PAGES_BASE : '/',
  define: DEFINE,
  plugins: [react()],
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
}));
```

In `apps/gallery/vitest.config.ts`, add the same constant, so tests see it:

```diff
--- a/apps/gallery/vitest.config.ts
+++ b/apps/gallery/vitest.config.ts
@@ -1,8 +1,10 @@
 import { defineConfig } from 'vitest/config';
 import react from '@vitejs/plugin-react';
+import { DEFINE } from './vite.config';
 
 export default defineConfig({
   plugins: [react()],
+  define: DEFINE,
   test: {
     environment: 'jsdom',
     setupFiles: ['./vitest.setup.ts'],
```

Create `apps/gallery/src/env.d.ts` (`tsconfig.json` already includes `src`):

```ts
/** @bit-ds/react's version, inlined at build time by Vite `define` (see vite.config.ts). */
declare const __BIT_VERSION__: string;
```

- [ ] **Step 5: Home**

Create `apps/gallery/src/pages/home/ComponentTiles.tsx`:

```tsx
import { Badge, Heading, Link, Stack } from '@bit-ds/react';
import { Link as RouterLink } from 'react-router-dom';
import { MANIFESTS, routeFor } from '../../manifests';
import type { Manifest } from '../../manifests';
import { renderManifest } from '../../engine/renderManifest';
import { defaultState } from '../../engine/state';

/** Components that get a large live tile. Every Forms component does too. */
const HEADLINERS: readonly string[] = ['alert', 'button', 'card', 'segmentedcontrol'];

/** The icon chip on a compact tile. A component missing here shows its first letter. */
const GLYPHS: Readonly<Record<string, string>> = {
  badge: '+1',
  box: '□',
  code: '<>',
  codeblock: '{}',
  heading: 'H',
  link: 'a',
  modetoggle: '◐',
  spinner: '◌',
  stack: '≡',
  table: '▦',
  text: 'Aa',
};

export function isLargeTile(manifest: Manifest): boolean {
  return manifest.group === 'forms' || HEADLINERS.includes(manifest.slug);
}

/**
 * A live preview on top, the name and → below; the whole tile is one Link. The preview is inert: it shows
 * the component but takes no clicks or focus, so the tile stays a single link.
 */
function LargeTile({ manifest }: { manifest: Manifest }) {
  return (
    <div className="gallery-tile">
      <div className="gallery-tile__preview" inert>
        {renderManifest(manifest, defaultState(manifest))}
      </div>
      <Link asChild color="neutral" className="gallery-tile__link">
        <RouterLink to={routeFor(manifest)}>
          {manifest.name} <span aria-hidden="true">→</span>
        </RouterLink>
      </Link>
    </div>
  );
}

function CompactTile({ manifest }: { manifest: Manifest }) {
  return (
    <Link asChild color="neutral" className="gallery-chip">
      <RouterLink to={routeFor(manifest)}>
        <span className="gallery-chip__glyph" aria-hidden="true">
          {GLYPHS[manifest.slug] ?? manifest.name.charAt(0)}
        </span>
        {manifest.name}
        <span aria-hidden="true">→</span>
      </RouterLink>
    </Link>
  );
}

function TileGroup({ title, manifests }: { title: string; manifests: readonly Manifest[] }) {
  const large = manifests.filter(isLargeTile);
  const compact = manifests.filter((m) => !isLargeTile(m));
  return (
    <Stack gap={16}>
      <Stack direction="row" gap={8} align="center">
        <Heading level={2}>{title}</Heading>
        <Badge variant="outline">{String(manifests.length)}</Badge>
      </Stack>
      {large.length > 0 ? (
        <div className="gallery-tiles">
          {large.map((m) => (
            <LargeTile key={m.slug} manifest={m} />
          ))}
        </div>
      ) : null}
      {compact.length > 0 ? (
        <div className="gallery-chips">
          {compact.map((m) => (
            <CompactTile key={m.slug} manifest={m} />
          ))}
        </div>
      ) : null}
    </Stack>
  );
}

/** Every component and form control as a tile, from the manifests, so a new one shows up by itself. */
export function ComponentTiles() {
  return (
    <Stack gap={32}>
      <TileGroup title="Components" manifests={MANIFESTS.filter((m) => m.group === 'components')} />
      <TileGroup title="Forms" manifests={MANIFESTS.filter((m) => m.group === 'forms')} />
    </Stack>
  );
}
```

Create `apps/gallery/src/pages/home/GetStarted.tsx`:

```tsx
import type { ReactNode } from 'react';
import { Badge, CodeBlock, Heading, Stack, Text } from '@bit-ds/react';
import { InstallCommand } from '../../content/InstallCommand';
import { STYLE_IMPORTS } from '../../content/styleImports';

const FIRST_COMPONENT = "import { Button } from '@bit-ds/react';\n\n<Button>Save</Button>";

interface StepProps {
  n: number;
  title: string;
  /** Shown after the title, outside the heading: the version on the Install step. */
  aside?: ReactNode;
  help: string;
  children: ReactNode;
}

function Step({ n, title, aside, help, children }: StepProps) {
  return (
    <Stack gap={8}>
      <Stack direction="row" gap={8} align="center" wrap>
        <Badge color="warning" shape="square">
          {String(n)}
        </Badge>
        <Heading level={3}>{title}</Heading>
        {aside}
      </Stack>
      <Text>{help}</Text>
      {children}
    </Stack>
  );
}

/** Three numbered steps: install, add the styles once, use a component. */
export function GetStarted() {
  return (
    <Stack gap={24}>
      <Step
        n={1}
        title="Install"
        aside={
          <Badge variant="outline" shape="square">
            {`v${__BIT_VERSION__}`}
          </Badge>
        }
        help="Add the React package with your package manager."
      >
        <InstallCommand />
      </Step>
      <Step n={2} title="Add the styles once" help="In your app's entry file. The theme comes first, then the component styles.">
        <CodeBlock code={STYLE_IMPORTS} language="jsx" label="Style imports" />
      </Step>
      <Step n={3} title="Use a component" help="Import it and write the props. The prop you type is the class it emits.">
        <CodeBlock code={FIRST_COMPONENT} language="jsx" label="First component" />
      </Step>
    </Stack>
  );
}
```

Create `apps/gallery/src/pages/home/NamingRule.tsx`:

```tsx
import type { ReactNode } from 'react';
import { Button, Code, Table, TableBody, TableCell, TableHead, TableRow, Text } from '@bit-ds/react';
import type { ButtonProps } from '@bit-ds/react';

/** One decorator, three ways to say it, and what it reads. */
interface NamingRow {
  prop: string;
  className: string;
  emits: string;
  /** A real token name, or null when each component's own CSS decides. */
  token: string | null;
  /** The live Button the Result column renders. */
  result: ButtonProps;
}

export const NAMING_ROWS: readonly NamingRow[] = [
  { prop: 'color="primary"', className: 'className="bit-primary"', emits: 'bit-primary', token: '--bit-color-primary', result: { color: 'primary' } },
  { prop: 'variant="outline"', className: 'className="bit-outline"', emits: 'bit-outline', token: null, result: { variant: 'outline' } },
  { prop: 'size="lg"', className: 'className="bit-lg"', emits: 'bit-lg', token: '--bit-control-height-lg', result: { size: 'lg' } },
];

/** One naming-rule column. To add a column, add an entry here. */
export interface NamingColumn {
  header: string;
  cell: (row: NamingRow) => ReactNode;
}

export const NAMING_COLUMNS: readonly NamingColumn[] = [
  { header: 'You write (prop)', cell: (row) => <Code>{row.prop}</Code> },
  { header: 'Or write (className)', cell: (row) => <Code>{row.className}</Code> },
  { header: 'Class it emits', cell: (row) => <Code>{row.emits}</Code> },
  {
    header: 'Token',
    cell: (row) =>
      row.token === null ? (
        <Text as="span" size={13} color="neutral">
          per component CSS
        </Text>
      ) : (
        <Code>{row.token}</Code>
      ),
  },
  { header: 'Result', cell: (row) => <Button {...row.result}>Save</Button> },
];

/** The prop you type is the class it emits is the token it reads, with a real Button in each row. */
export function NamingRule() {
  return (
    <Table aria-label="The naming rule">
      <TableHead>
        <TableRow>
          {NAMING_COLUMNS.map((column) => (
            <TableCell key={column.header}>{column.header}</TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {NAMING_ROWS.map((row) => (
          <TableRow key={row.emits}>
            {NAMING_COLUMNS.map((column) => (
              <TableCell key={column.header}>{column.cell(row)}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

Replace `apps/gallery/src/pages/HomePage.tsx` with:

```tsx
import { BitLogo, Button, Heading, Stack, Text } from '@bit-ds/react';
import { Link } from 'react-router-dom';
import { NAV } from '../shell/Sidebar';
import { ComponentTiles } from './home/ComponentTiles';
import { GetStarted } from './home/GetStarted';
import { NamingRule } from './home/NamingRule';

/** Where "Browse components" goes: the first component in the sidebar, whatever that becomes. */
export const BROWSE_TARGET = NAV.find((item) => item.group === 'Components')!.to;

export function HomePage() {
  return (
    <Stack gap={48}>
      <Stack gap={16} align="start">
        <Heading level={1}>
          <BitLogo size="lg" />
        </Heading>
        <Text size={18}>
          A retro-game React design system for people new to design systems. The prop you type is the class it emits is
          the token it reads.
        </Text>
        <Stack direction="row" gap={12} wrap>
          <Button asChild size="lg">
            <Link to={BROWSE_TARGET}>
              Browse components <span aria-hidden="true">→</span>
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" color="neutral">
            <Link to="/tokens">See the tokens</Link>
          </Button>
        </Stack>
      </Stack>
      <ComponentTiles />
      <Stack gap={16}>
        <Heading level={2}>Get started</Heading>
        <GetStarted />
      </Stack>
      <Stack gap={16}>
        <Heading level={2}>The naming rule</Heading>
        <NamingRule />
      </Stack>
    </Stack>
  );
}
```

In `apps/gallery/src/gallery.css`, insert this directly under `/* ---------- home page ---------- */`:

```css
/* Large tiles: a live preview over a footer link. The link's ::after covers the tile, so the whole tile
   is one link while the preview inside stays inert. */
.gallery-tiles {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
  gap: var(--bit-space-16px);
}

.gallery-tile {
  position: relative;
  display: grid;
  grid-template-rows: minmax(8rem, auto) auto;
  overflow: hidden;
  background: var(--bit-color-surface);
  border: var(--bit-border-width) solid var(--bit-color-line);
  border-radius: var(--bit-radius-14px);
  box-shadow: var(--bit-shadow-md);
}

.gallery-tile__preview {
  display: grid;
  place-items: center;
  padding: var(--bit-space-16px);
  overflow: hidden;
  border-bottom: var(--bit-border-width) solid var(--bit-color-line);
}

.gallery-tile__link {
  padding: var(--bit-space-12px) var(--bit-space-16px);
}

.gallery-tile__link::after {
  content: "";
  position: absolute;
  inset: 0;
}

/* Compact tiles: a glyph chip, the name and →, all one link. */
.gallery-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--bit-space-12px);
}

.gallery-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--bit-space-8px);
  padding: var(--bit-space-8px) var(--bit-space-12px);
  background: var(--bit-color-surface);
  border: var(--bit-border-width) solid var(--bit-color-line);
  border-radius: var(--bit-radius-10px);
}

.gallery-chip__glyph {
  display: inline-grid;
  place-items: center;
  width: var(--bit-space-24px);
  height: var(--bit-space-24px);
  font-family: var(--bit-font-mono);
  font-size: var(--bit-text-13px);
  background: var(--bit-color-neutral-soft);
  border: 2px solid var(--bit-color-line);
  border-radius: var(--bit-radius-6px);
}
```

- [ ] **Step 6: README: all three install commands and the className column**

```diff
--- a/README.md
+++ b/README.md
@@ -14,14 +14,17 @@ Themes are swappable and named after retro-game eras. The first theme is **power
 
 ## Install
 
-The packages are workspace-private for now. Clone the repo and run Storybook:
+Once `@bit-ds/react` is published, install it with your package manager:
 
 ```bash
-pnpm install
-pnpm storybook
+pnpm add @bit-ds/react
+# or
+npm install @bit-ds/react
+# or
+yarn add @bit-ds/react
 ```
 
-When published, using it will be three lines:
+Then add the styles once, theme first, and use a component:
 
 ```tsx
 import '@bit-ds/react/themes/power-up.css';
@@ -29,14 +32,16 @@ import '@bit-ds/react/styles.css';
 import { Button } from '@bit-ds/react';
 ```
 
+Until then the packages are workspace-private. Clone the repo, run `pnpm install`, then `pnpm gallery` to browse every component.
+
 ## The naming rule
 
-| You write | Class | Token |
-| --- | --- | --- |
-| `color="primary"` | `bit-primary` | `--bit-color-primary` |
-| `variant="outline"` | `bit-outline` | (per component CSS) |
-| `size="lg"` | `bit-lg` | `--bit-control-height-lg` |
-| `<CardHeader>` | `bit-card__header` | |
+| You write (prop) | Or write (className) | Class it emits | Token |
+| --- | --- | --- | --- |
+| `color="primary"` | `className="bit-primary"` | `bit-primary` | `--bit-color-primary` |
+| `variant="outline"` | `className="bit-outline"` | `bit-outline` | (per component CSS) |
+| `size="lg"` | `className="bit-lg"` | `bit-lg` | `--bit-control-height-lg` |
+| `<CardHeader>` | | `bit-card__header` | |
 
 Three axes, same names on every component that has them:
 
```

- [ ] **Step 7: Run the gallery tests**

Run: `pnpm build && pnpm --filter @bit-ds/gallery test`
Expected: PASS: `Tests  313 passed (313)` on wave 1, or `417` after T4 and T5.

- [ ] **Step 8: Run every gate, and build the gallery**

Run: `pnpm build && pnpm verify && pnpm test && pnpm test:coverage && pnpm typecheck && pnpm lint && pnpm smoke && pnpm storybook:build && pnpm gallery:build`
Expected: all green, and the gallery builds (`✓ built in …`).

- [ ] **Step 9: Commit**

```bash
git add README.md apps/gallery
git commit -m "feat(gallery): Home with live tiles, get-started steps, install switcher and the five-column naming rule; version via Vite define

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Verification board (real browser; fixes only for real bugs)

Run this after wave 2 is merged and every gate is green on the merged branch.

**Files:**
- Create, outside the repo:
  - the PNGs, under `/private/tmp/bit-pr3a-board/`. The browse CLI writes only under `/private/tmp`.
  - `~/.gstack/projects/doosemavis-bit-design-system/designs/pr3a-20261003/final/board.html`, with the PNGs copied beside it
- The repo changes only to fix a real bug found here. Each fix gets:
  - a failing test first
  - the full gate
  - its own `fix(gallery):` commit

**Interfaces:**
- **Consumes:** the built gallery: `pnpm gallery:build`, output in `apps/gallery/dist`.

Use the gstack browse CLI at `~/.claude/skills/gstack/browse/dist/browse`. Never use `mcp__claude-in-chrome__*`.

- [ ] **Step 1: Build and serve**

Run `pnpm gallery:build`. Then run this in the background, from `apps/gallery`:

```bash
npx vite preview --base /bit-design-system/
```

Expected: `Local: http://localhost:4173/bit-design-system/`. Every URL below starts with `http://localhost:4173/bit-design-system/#`.

- [ ] **Step 2: Set the mode, then reload**

A hash `goto` doesn't reload the page. So set the stored mode, then reload:

```bash
B=~/.claude/skills/gstack/browse/dist/browse
mkdir -p /private/tmp/bit-pr3a-board
$B viewport 1200x1600
$B goto "http://localhost:4173/bit-design-system/#/"
$B js "localStorage.setItem('bit-color-mode','light')"   # 'dark' for the second pass
$B js "location.reload()"
$B js "document.documentElement.dataset.mode"            # prints light (then dark)
```

- [ ] **Step 3: Capture the five pages, at both widths and in both modes**

Loop over:
- each mode: light, then dark
- each width: `$B viewport 1200x1600`, then `$B viewport 390x1600`
- each route:
  - `/` (home)
  - `/tokens`
  - `/components/button`
  - `/components/table`
  - `/components/nope` (the 404)

For each combination, run:

```bash
$B goto "<url>"
$B wait "main h1"
$B screenshot /private/tmp/bit-pr3a-board/<mode>-<width>-<name>.png
```

That makes 20 PNGs.

- [ ] **Step 4: Check that no page scrolls sideways at 390px**

Set `$B viewport 390x900`. Then, for each route below, run `$B goto`, `$B wait "main h1"`, and:

```bash
$B js "document.documentElement.scrollWidth"
```

The routes:
- `/`, `/tokens`, `/typography`, `/spacing`, `/brand/logo`, `/nope` and `/components/nope`
- every `/components/<slug>` in `MANIFESTS`:
  - button, badge, alert, card, stack, box and text
  - heading, spinner, modetoggle, link, code and codeblock
  - segmentedcontrol, table, field, input, select and switch

Expected: `390` or less on every route. Record the numbers on the board.

- [ ] **Step 5: Check by hand, at 390 and at 1200**

- **The sheet:**
  - Menu opens it, and GitHub is inside it.
  - Escape closes it, and focus returns to Menu.
- **The section bars:** a link focuses its h2, and the hash in the address bar doesn't change.
- **The skip link:**
  - Tab once from the address bar, then press Enter: focus lands on main.
  - The route doesn't change.
- **The code footer:**
  - Open `/components/button?color=danger` and pick className.
  - The code reads `<Button className="bit-danger">Save</Button>`.
- **The tokens filter:**
  - Type `sparkle`, and the empty state shows.
  - Clear filter brings the list back.
- **The install switcher:** pick yarn and reload; yarn is still picked.
- **The Typography faces:** the four token chips line up.

- [ ] **Step 6: Assemble `final/board.html`**

```bash
mkdir -p ~/.gstack/projects/doosemavis-bit-design-system/designs/pr3a-20261003/final
cp /private/tmp/bit-pr3a-board/*.png ~/.gstack/projects/doosemavis-bit-design-system/designs/pr3a-20261003/final/
```

Write `board.html` beside them:
- **Layout:** a grid with light on the left and dark on the right, one row per page and width, each with a caption.
- **At the top:**
  - the `scrollWidth` table from Step 4
  - the Step 5 checklist, each item marked pass or fail
  - this plan's decisions 1–15
  - anything that looks wrong

- [ ] **Step 7: Stop and report**

Run `$B stop`, and stop the preview server. Report:
- the board path
- every problem found
- every fix commit

If nothing needed fixing, there is no commit.

---

## Self-review (run 2026-10-03)

**1. Spec coverage**

| Spec requirement | Where |
|---|---|
| §1 CodeBlock `actions`: markup, layout, Copy copies the current code, and tests at 100% | T1 |
| §1 manifest doc line for `actions` | T3a, the CodeBlock manifest's `actions` row |
| §2 Table `vertical-align: middle`, with its core test | T1 |
| §3 header: eyebrow, h1, description, import chip with Copy, badges | T4 `ComponentHeader`; T2 `PageHeader` and `CopyButton` |
| §3 section bar: preventDefault, scroll, focus the h2, no URL change | T2 `SectionBar`, `InPageLink` and `scrollToSection`; T4 page test |
| §3 presets: ghost Buttons, and the active one pressed and solid | T4 `Presets` and `isPresetActive` |
| §3 checkerboard Switch | T4 `Preview` |
| §3 controls beside the preview, stacked under 720px | T4 CSS and CSS test |
| §3 footer: format switch, Full file and CodeBlock | T4 `CodePanel` and `codeFormats` |
| §3 HTML only for static components; full file gallery-private | T4 `toHtml` and `fullFile` |
| §3 Variants: a Table, the Matrix deleted, the axis rules | T4 `VariantsTable` |
| §3 Variants omitted from the page and the bar when there's no axis | T4 `sections.ts` |
| §3 Usage in soft success and danger, the Props Table, the Accessibility list | T4 `DocsSections`; see contradiction 6 |
| §3 docs required and complete | T3a, T3b, T3c |
| §3 contract test: Do, Don't, prop, a11y; control props in docs; presets | T3a commit 1, then T3c |
| §3 empty children: empty preview, self-closing code, the manifest's error | T4 `ControlsPanel` and page test; T3a and T3b set the errors |
| §4 Tokens: values computed on first render and on a mode change | T5 `tokenValues` |
| §4 Tokens: header, section bar, Color, compact Type and Space, Shape | T5 |
| §4 Tokens: All tokens with filter, count, empty state, Clear and Copy | T5 `AllTokens` |
| §4 the token list from `SEMANTIC_TOKENS` | T5, which also adds the export |
| §5 Home: hero; tiles grouped, with counts from the manifests | T6 |
| §5 Home: large and compact tiles, one Link each | T6 `ComponentTiles` |
| §5 Home: Get started with the version, naming rule with real Buttons | T6 |
| §5 version through Vite `define`, with a test; `v0.0.0` | T6 `vite.config.ts` and `version.test.ts` |
| §6 InstallCommand: markup, commands and `content/install.ts` | T6 |
| §6 InstallCommand: default, storage and its fallbacks; README | T6 |
| §7.1 focus moves on a pathname change only | T2 `useFocusHeading` |
| §7.2 push and replace history, 400ms | T2 `useControlState` |
| §7.2 tests: a keystroke keeps focus, Back undoes a select | T2 `focusAndHistory.test.tsx` |
| §7.3 skip link | T2 `Shell` and `InPageLink` |
| §7.4 Spinner after 300ms, and the errorElement | T2 `PageLoading`, `PageError` and `router.tsx` |
| §7.5 unknown slug: the closest name, and every component as a Link | T2 |
| §7.5 other bad paths keep the generic 404 | T2 |
| §7.6 bad values reset, and the URL is rewritten with replace | T2; see contradiction 5 |
| §7.7 phone header and sheet | T2 |
| §7.7 controls stack and presets scroll; tables scroll | T4 CSS; T7 measures `scrollWidth` |
| §7.8 Heading titles | T2 (404 and unknown slug); T4, T5 and T6 on their pages. Typography and Spacing already used Heading. |
| §7.9 face-chip baseline | T2 CSS and test; T7 checks it by eye |
| §8 route smoke: axe in light and dark, `/tokens` included | T4 `routes.test.tsx` and `routes.dark.test.tsx` |
| §8 by eye: board at 1200 and 390, light and dark, with `scrollWidth` | T7 |
| A1 §1 Props, className and HTML: availability and the toJsx option | T4 `codeFormats` and `toJsx.ts` |
| A1 §1 Full file, Copy, and falling back to Props | T4 `CodePanel` and its tests |
| A1 §2 `PropDoc.className` and its contract test | T3a commit 1, then T3c |
| A1 §2 the Class column and the tip line | T4 `PROP_COLUMNS` and `classTip` |
| A1 §3 five-column naming rule, and the README column | T6 |
| A1 tests: toJsx example and defaults, round trip | T4 |
| A1 tests: ComponentPage modes and Copy, Props column and tip | T4 |
| A1 tests: Home table columns | T6 |

No gaps.

**2. Placeholder scan:**
- No "TBD", "TODO", "similar to Task N" or code-free code steps.
- Every new file is given in full.
- Every edit is a diff from the task's own starting point.
- Wave-2 CSS is an exact block under a named marker.

**3. Type consistency:**
- `SectionLink` is defined once, in `ui/PageSection.tsx`. `SectionBar`, T4's `sections.ts` and T5's `SECTIONS` all use it.
- `Manifest.docs` is optional from T3a commit 1 until T3c, and required after. Nothing outside the manifests reads `docs` before T3c; T4 runs after it.
- `PackageManager` and `INSTALL_COMMANDS` match across `install.ts`, `InstallCommand` and the tests.
- `__BIT_VERSION__` is declared in `env.d.ts`, and `DEFINE` defines it in both Vite configs.
- `AxisControl` is reused by `variantAxes` and `classTip`.
- `ToJsxOptions.decorators` is `'props' | 'className'` everywhere it appears.
- **Labels** match between components and tests:
  - regions "Example code", "Install command", "Token values" and "All tokens"
  - the groups "Presets" and "Package manager"
  - the nav "On this page"
- `PROP_COLUMNS`, `CODE_FORMATS` and `NAMING_COLUMNS` are each the single source their tests read.

**4. Review Focus:** five items, each pinned to a named test in its owning task (T2, T2, T2, T6, T6). Also covered by tests, but not in the five:
- a Link tip that would teach an unsupported class (T4)
- the duplicate "All tokens" region name (T5, through axe)
- script-moved focus leaving a ring on main (T2, CSS test)
