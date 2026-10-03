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

