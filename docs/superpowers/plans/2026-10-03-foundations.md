# Foundations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `Heading` and `Box` as public components in `@bit-ds/react` (27 in all), each with core CSS, tests and a gallery page, and add the Typography and Spacing guide pages under Foundations in the gallery.

**Architecture:**
- **Core (`@bit-ds/core`):** two CSS files and no new tokens.
  - `heading.css` gives six `data-level` looks from today's type scale.
  - `box.css` is 126 one-line rules (14 attributes × 9 values) in three precedence tiers, so the most specific prop wins whatever order the props are written in.
- **React (`@bit-ds/react`):**
  - `Heading` mirrors `Text`: `createElement` on `h{level}`, with `data-level` going through `dataValue`.
  - `Box` mirrors Stack's data attributes, with one short attribute per spacing prop and an `as` element.
- **Gallery:**
  - two manifests, and a dashed accent outline on a previewed Box in `gallery.css`
  - two lazy routes, `/typography` and `/spacing`, built only from bit components, with a few gallery-only layout classes that read only `--bit-*` tokens

**Tech Stack:** pnpm 9.15.9 workspaces, TypeScript 5.9 strict, React 19, Vitest 4 (jsdom for react and gallery, node for core), Testing Library and user-event 14, axe-core 4.13, tsup and esbuild, Vite gallery, react-router-dom 7.

**Spec:** `docs/superpowers/specs/2026-10-03-foundations-design.md`. Visual reference: `~/.gstack/projects/doosemavis-bit-design-system/designs/foundations-20261003/board.html` (the heading scale and Box props) and `board-2.html` (the two pages).

Every code block in this plan was run in a scratch worktree at `8cd02fc`, with every gate green after each task, in order. The red-step outputs were replayed there too. The four pages were checked in a real browser, in light and dark and at 390px wide, and the Box precedence and the h4 look were read back as computed styles.

## Spec deviations

None.

## Decisions this plan makes that the spec left open (owner: confirm in review)

1. **Export lists grow task by task**, as in PR2. Task 1 adds Heading, and Task 2 adds Box, to:
   - the component list in `packages/react/src/index.test.tsx`
   - `EXPECTED` in `packages/react/scripts/verify-dist.mjs` and in `scripts/smoke-consumer.mjs`
   - verify-dist's type names and CSS needles

   So no gate is red between tasks, and the lists reach 27 in Task 2.
2. **Every heading level declares all five type properties** (family, size, weight, line height, letter spacing).
   - The base rule is the h2 look, so it carries `letter-spacing: 0.01em`.
   - Levels 4 and 5 therefore declare `letter-spacing: normal` (the spec's "none"). Without it, an h2 with `size={4}` would keep display tracking (Review Focus 1).
3. **A missing `level` is treated like an unknown one.** Heading passes `String(level)` to `dataValue`, so a plain-JS `<Heading>` warns `level="undefined"` and renders an h2.
4. **Box's `as` goes through `dataValue` too.** An untyped `as="button"` falls back to `div` with a warning, the same way Heading treats an unknown level. The spec is silent on this.
5. **Exported types:** `HeadingProps`, `HeadingLevel`, `BoxProps` and `BoxElement`. The spec's `Space` (`0 | SpaceStep`) stays internal; `BoxProps['padding']` names it.
6. **Sidebar order under Components:**
   - Box comes after Stack, and Heading after Text: `[…, card, stack, box, text, heading, spinner, …]`.
   - The board drew "Box, Button, …, Heading", which looks alphabetical, but today's list isn't alphabetical, so each sits beside its sibling.
7. **Manifest defaults:**
   - **Heading:** `level` defaults to 2, so the preview is an h2 under the page's h1 and the outline stays in order. `size` defaults to `none`.
   - **Box:** `padding` defaults to 16 with `alwaysPrint`, so the outline shows space on first load and the code says why. The other spacing props default to `none`, and `as` to `div`.
   - **Box's preview child** is a primary Badge, "Inside the box".
   - **Box presets:** "Banner: wide and short", "Y beats padding" (precedence, live) and "Pushed down".
8. **The preview outline** is `.gallery-preview__stage > .bit-box { outline: 2px dashed var(--bit-color-accent); }`.
   - The child combinator outlines only the Box under test.
   - An outline takes no space, so what you see is exactly the props.
   - The accent is violet in light and yellow in dark.
   - The Spacing page's live Box uses the same declaration through `.bit-box.gallery-outline`.
9. **The Typography table's heading samples are real `Heading`s with `role="presentation"`.** They show the true look but stay out of the page outline. Otherwise the page would have two h1s and an h6 under an h2 (Review Focus 5).
10. **Do and Don't are outline Alerts** (the soft fill) **with `role="note"`.** Alert's default role is `status`, a live region, and guidance isn't news.
11. **Gallery-only CSS** (in `gallery.css`, reading only `--bit-*` tokens):
    - `.gallery-grid`: cards side by side, as many as fit
    - `.gallery-face[data-face]`: a face sample in its font token
    - `.gallery-ruler`
    - `.gallery-ruler__bar`
    - `.bit-box.gallery-outline`

    **Each ruler bar is a Box with `paddingLeft={step}` and no content.** So the scale is drawn by Box from the very tokens it names, and the bar's CSS sets no width.
12. **Board copy changes:**
    - The Typography lead says "Four faces and one scale", because the board drew four face cards but said "Three faces".
    - Component names in the leads are `Code` chips, not bold. A bold Text nested in a Text would need its own `size`.
    - Both Typography tables get the same head row (Example, middle column, Code), so every cell has a header. The board drew the Text sizes card without one.
13. **The "Stack or Box?" card titles are `<Heading level={3} size={4}>`:** h3 under the h2, in the board's body-bold look. They also show `size` at work.
14. **The live examples use Badge**, a bit component the spec's page list doesn't name, because the examples need something to space. The face names (Lilita One, Nunito, Press Start, JetBrains Mono) are power-up's, written as strings. The samples read the tokens.
15. **`FOUNDATION_PAGES` runs in `routes.dark.test.tsx` too**, not only in the route smoke test the spec names. That adds two tests.
16. **No `rm -rf` in Task 5.**
    - `pnpm build` already starts clean (tsup's `clean: true`), and `vite build` empties `apps/gallery/dist`.
    - A PreToolUse hook blocks `rm -rf` in this environment.

**Owner notes, no change made:**
- At 390px the gallery's header is wider than the screen (`scrollWidth` 461) on every page. It happens on `/components/button` today, so it predates this work.
- On `/typography`, `main h1` matches two elements: the page title and the h1-tag sample. `useFocusHeading` takes the first, the title, so focus after navigation is right. Task 6 waits on `.gallery-main > .bit-stack` instead.
- Table cells align to the top, so a row's small middle-column text sits level with the top of the big sample (Table's own look). The board drew it centred.
- The Tokens page is still a one-line stub (the spec says it is unchanged).

## Global Constraints

- **Branch:** `feat/foundations`, spec commit `8cd02fc`. One PR to `main`.
- **Gallery builds first:** the gallery uses `@bit-ds/react` through its built `exports` map. Run `pnpm build` before gallery typecheck and tests.
- **No new tokens** (decision 1): "Heading scale uses today's type scale (board option H1). No new tokens." `SEMANTIC_TOKENS` and `MODE_TOKENS` don't change.
- **Heading markup:** `<h{level} class="bit-heading" data-level={size ?? level}>`. The ref, `className` and rest props go on the heading, and `dropLegacyColor` is applied to rest.
  - `level` decides the tag.
  - `size` decides the look.
  - An unknown `level` or `size` drops the attribute with a dev warning. With `level` unknown, the tag falls back to `h2`.
- **Heading look** (`components/heading.css`): `margin: 0` and `color: var(--bit-color-text)`. With no `data-level`, the base rule is the h2 look.

  | `data-level` | Font | Size | Weight | Line height | Extra |
  |---|---|---|---|---|---|
  | 1 | `--bit-font-display` | `--bit-text-32px` | 400 | `--bit-leading-tight` | `letter-spacing: 0.01em` |
  | 2 | display | `--bit-text-24px` | 400 | tight | `0.01em` |
  | 3 | display | `--bit-text-18px` | 400 | tight | `0.01em` |
  | 4 | `--bit-font-body` | `--bit-text-15px` | `--bit-weight-bold` | `1.3` | none |
  | 5 | body | `--bit-text-13px` | bold | `1.3` | none |
  | 6 | `--bit-font-pixel` | `--bit-text-11px` | 400 | `1.4` | `text-transform: uppercase; letter-spacing: 0.08em` |

- **Box markup:** `<{as} class="bit-box">`, `as` one of `div` (default), `section`, `article`, `aside`, `header`, `footer`, `main`, `nav` or `span`. There is one data attribute per prop passed:

  | Padding prop | Attribute | Margin prop | Attribute |
  |---|---|---|---|
  | `padding` | `data-p` | `margin` | `data-m` |
  | `paddingX` | `data-px` | `marginX` | `data-mx` |
  | `paddingY` | `data-py` | `marginY` | `data-my` |
  | `paddingTop` | `data-pt` | `marginTop` | `data-mt` |
  | `paddingRight` | `data-pr` | `marginRight` | `data-mr` |
  | `paddingBottom` | `data-pb` | `marginBottom` | `data-mb` |
  | `paddingLeft` | `data-pl` | `marginLeft` | `data-ml` |

  Values are `0, 4, 8, 12, 16, 24, 32, 48, 64` and go through `dataValue`. The ref, `className` and rest props go on the element, and `dropLegacyColor` is applied to rest.
- **Box look** (`components/box.css`):
  - `.bit-box` itself sets nothing; there is no base rule.
  - The rule is `.bit-box[data-<attr>="<n>"] { <property>: var(--bit-space-<n>px); }`, and `0` sets `0`.
  - The tiers come in this order: all sides (`p`, `m`), then the axes (`px`, `py`, `mx`, `my`), then single sides. The later tier wins.
  - The properties are physical: `padding-left` and `padding-right` for X.
- **Naming rule:** the roots are `bit-heading` and `bit-box`. Layout values are data attributes, never classes, and there are no utility classes.
- **No `outline` in component CSS:** the existing per-file guard in `system.test.ts` covers the new files automatically. `outline-offset` is allowed.
- **Gallery pages** (`/typography`, `/spacing`):
  - Built only from bit components: no raw `<table>`, `<code>`, `<pre>` or heading tags.
  - Anything gallery-only goes in `gallery.css` and reads only `--bit-*` tokens.
  - Several CodeBlocks in one language each get a unique `label`, because the code area is a named region and axe's `landmark-unique` fails on duplicates.
  - The sidebar under Foundations reads Tokens, Typography, Spacing.
- **No Storybook stories** for new components. `pnpm storybook:build` must keep passing.
- **Commits:** conventional (`feat:`, `feat(gallery):`, `docs:`), each ending with the single trailer line `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Gates** (every task ends with all of them green):
  - `pnpm build`, `pnpm verify`, `pnpm typecheck`, `pnpm lint`
  - `pnpm test` (core, react, gallery)
  - `pnpm test:coverage`
  - `pnpm smoke`, `pnpm storybook:build`
- **React coverage is 100%.** The config's threshold is 80%, so read the summary: Statements, Branches, Functions and Lines must each print `100%`.
- **Code style:** small focused files, comments only where the code doesn't say it, no mutation of inputs.

## Review Focus

1. **A Heading that looks smaller than its tag** (`<Heading level={2} size={4}>`): it must take h4's body-bold look entirely, with no display letter-spacing left over from the h2 base rule. Pinned in Task 1, core test `data-level="4" matches the spec table` (`letter-spacing: normal`).
2. **A plain-JS caller that leaves `level` off,** or a spread that loses it: they get an h2 and a warning naming `level="undefined"`, never a crash or an `<hundefined>` tag. Pinned in Task 1, "a missing level (an untyped caller) is an h2 and warns, like a typo would".
3. **Any spacing prop on Box:** the camelCase prop names must never reach the DOM. React would warn "does not recognize the `paddingX` prop", and a `paddingx` attribute would ship. Pinned in Task 2, "puts the ref, className (last) and rest props on the element, and never passes spacing props to the DOM".
4. **An untyped `as` on Box** (`as="button"`): a `div` with a warning, not a button that looks like a box. Pinned in Task 2, "an unknown as from an untyped caller falls back to a div, with a warning".
5. **A screen-reader user moving by headings on the Typography page:** the six heading samples must not join the outline. Pinned in Task 3, "the outline is the page's own headings; the heading samples are not headings". The Spacing page gets the same check in Task 4.

---

## File structure

**Core** (`packages/core/src/`):
- `components/heading.css`, `components/box.css`
- `index.css`: two imports
- `__tests__/components/heading.test.ts`, `__tests__/components/box.test.ts`
- The existing per-file loops in `__tests__/system.test.ts` pick up both new files: tokens read, no palette, `--_bit-` only, no outline, no focus band and no ink. That is six tests each.

**React** (`packages/react/src/`):
- `components/Heading/Heading.tsx` and `Heading.test.tsx`
- `components/Box/Box.tsx` and `Box.test.tsx`
- `index.ts`, `index.test.tsx`
- `../scripts/verify-dist.mjs`

**Gallery** (`apps/gallery/src/`):
- `manifests/heading.ts`, `manifests/box.ts`, plus `registry.ts`, `index.ts` and `manifests.test.ts`
- `pages/TypographyPage.tsx` and `pages/SpacingPage.tsx`, each with a `.test.tsx`
- `router.tsx`, `shell/Sidebar.tsx` and `shell/Sidebar.test.tsx`
- `routes.test.tsx`, `routes.dark.test.tsx`
- `gallery.css` and `gallery-css.test.ts`

**Root:** `scripts/smoke-consumer.mjs`, `README.md`, `CONTRIBUTING.md`.

**Expected counts after each task** (from the scratch run; the baseline is core 416, react 354, gallery 146, with 25 components):

| After | core | react | gallery | dist / consumer |
|---|---|---|---|---|
| Task 1 | 432 | 370 | 149 | 26 |
| Task 2 | 455 | 403 | 153 | 27 |
| Task 3 | 455 | 403 | 166 | 27 |
| Task 4 | 455 | 403 | 174 | 27 |
| Task 5 | 455 | 403 | 174 | 27 |

### Task 1: Heading

**Files:**
- Create: `packages/core/src/components/heading.css`, `packages/core/src/__tests__/components/heading.test.ts`
- Modify: `packages/core/src/index.css` (after `text.css`)
- Create: `packages/react/src/components/Heading/Heading.tsx` and `Heading.test.tsx`
- Modify: `packages/react/src/index.ts`, `packages/react/src/index.test.tsx`, `packages/react/scripts/verify-dist.mjs`, `scripts/smoke-consumer.mjs`
- Create: `apps/gallery/src/manifests/heading.ts`
- Modify: `apps/gallery/src/manifests/registry.ts`, `apps/gallery/src/manifests/index.ts`, `apps/gallery/src/manifests/manifests.test.ts`

**Interfaces:**
- Consumes `dataValue` and `toClasses` (`packages/react/src/system/toClasses.ts`), `dropLegacyColor` (`system/dropLegacyColor.ts`) and the existing type tokens.
- Produces:
  - `Heading` (`HeadingProps extends Omit<HTMLAttributes<HTMLHeadingElement>, 'color'>` with `level: HeadingLevel` (required) and `size?: HeadingLevel`), exported
  - `HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6`, exported as a type
  - the CSS rules `.bit-heading` and `.bit-heading[data-level="1"…"6"]`
  - the gallery manifest `heading`: slug `heading`, group `'components'`. Its controls are `level` and `size` (numeric selects) and `children` "Build with bit"; its preset is "h2 that looks like h3".

- [ ] **Step 1: Write the failing core test**

Create `packages/core/src/__tests__/components/heading.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { block, decl, readCss } from '../css';

/** Spec §1's table, one row per data-level. Every level declares all five, so none inherits another's. */
const LEVELS = {
  1: { 'font-family': 'var(--bit-font-display)', 'font-size': 'var(--bit-text-32px)', 'font-weight': '400', 'line-height': 'var(--bit-leading-tight)', 'letter-spacing': '0.01em' },
  2: { 'font-family': 'var(--bit-font-display)', 'font-size': 'var(--bit-text-24px)', 'font-weight': '400', 'line-height': 'var(--bit-leading-tight)', 'letter-spacing': '0.01em' },
  3: { 'font-family': 'var(--bit-font-display)', 'font-size': 'var(--bit-text-18px)', 'font-weight': '400', 'line-height': 'var(--bit-leading-tight)', 'letter-spacing': '0.01em' },
  4: { 'font-family': 'var(--bit-font-body)', 'font-size': 'var(--bit-text-15px)', 'font-weight': 'var(--bit-weight-bold)', 'line-height': '1.3', 'letter-spacing': 'normal' },
  5: { 'font-family': 'var(--bit-font-body)', 'font-size': 'var(--bit-text-13px)', 'font-weight': 'var(--bit-weight-bold)', 'line-height': '1.3', 'letter-spacing': 'normal' },
  6: { 'font-family': 'var(--bit-font-pixel)', 'font-size': 'var(--bit-text-11px)', 'font-weight': '400', 'line-height': '1.4', 'letter-spacing': '0.08em' },
} as const;

const TYPE_PROPS = ['font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing'] as const;

describe('components/heading.css', () => {
  const css = readCss('components/heading.css');
  const level = (n: number) => block(css, `.bit-heading[data-level="${n}"]`);

  it('has no margin, because Stack and Box do the spacing, and reads the text color', () => {
    const root = block(css, '.bit-heading')!;
    expect(root).toContain('margin: 0;');
    expect(root).toContain('color: var(--bit-color-text);');
  });

  it.each(Object.entries(LEVELS))('data-level="%s" matches the spec table', (n, expected) => {
    const body = level(Number(n))!;
    expect(body).not.toBeNull();
    for (const prop of TYPE_PROPS) expect(decl(body, prop), prop).toBe(expected[prop]);
  });

  it('display levels (1–3) use weight 400, because the display face ships one weight', () => {
    for (const n of [1, 2, 3]) {
      expect(decl(level(n)!, 'font-family')).toBe('var(--bit-font-display)');
      expect(decl(level(n)!, 'font-weight')).toBe('400');
    }
  });

  it('level 6 is pixel caps; no other level transforms its text', () => {
    expect(decl(level(6)!, 'text-transform')).toBe('uppercase');
    for (const n of [1, 2, 3, 4, 5]) expect(decl(level(n)!, 'text-transform')).toBeNull();
    expect(decl(block(css, '.bit-heading')!, 'text-transform')).toBeNull();
  });

  it('with no data-level, the base rule is the h2 look', () => {
    const root = block(css, '.bit-heading')!;
    for (const prop of TYPE_PROPS) expect(decl(root, prop), prop).toBe(LEVELS[2][prop]);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `pnpm --filter @bit-ds/core test`
Expected: FAIL, `ENOENT … components/heading.css`.

- [ ] **Step 3: Write the CSS**

Create `packages/core/src/components/heading.css`:

```css
/* Heading: the tag comes from level, the look from data-level (size ?? level). No margin: Stack and Box
   do the spacing. With no data-level (or an unknown one) a heading looks like level 2. Every level sets
   all five type properties, so none inherits another level's letter-spacing or weight. Display levels
   use weight 400: the display face ships one weight, so anything heavier would be a synthesized bold. */
.bit-heading {
  margin: 0;
  color: var(--bit-color-text);
  font-family: var(--bit-font-display);
  font-size: var(--bit-text-24px);
  font-weight: 400;
  line-height: var(--bit-leading-tight);
  letter-spacing: 0.01em;
}

.bit-heading[data-level="1"] {
  font-family: var(--bit-font-display);
  font-size: var(--bit-text-32px);
  font-weight: 400;
  line-height: var(--bit-leading-tight);
  letter-spacing: 0.01em;
}

.bit-heading[data-level="2"] {
  font-family: var(--bit-font-display);
  font-size: var(--bit-text-24px);
  font-weight: 400;
  line-height: var(--bit-leading-tight);
  letter-spacing: 0.01em;
}

.bit-heading[data-level="3"] {
  font-family: var(--bit-font-display);
  font-size: var(--bit-text-18px);
  font-weight: 400;
  line-height: var(--bit-leading-tight);
  letter-spacing: 0.01em;
}

.bit-heading[data-level="4"] {
  font-family: var(--bit-font-body);
  font-size: var(--bit-text-15px);
  font-weight: var(--bit-weight-bold);
  line-height: 1.3;
  letter-spacing: normal;
}

.bit-heading[data-level="5"] {
  font-family: var(--bit-font-body);
  font-size: var(--bit-text-13px);
  font-weight: var(--bit-weight-bold);
  line-height: 1.3;
  letter-spacing: normal;
}

.bit-heading[data-level="6"] {
  font-family: var(--bit-font-pixel);
  font-size: var(--bit-text-11px);
  font-weight: 400;
  line-height: 1.4;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
```

In `packages/core/src/index.css`, after `@import "./components/text.css";`, add `@import "./components/heading.css";`.

- [ ] **Step 4: Run the core tests and confirm they pass**

Run: `pnpm --filter @bit-ds/core test`
Expected: PASS, `Tests  432 passed (432)`. That is 10 Heading tests, plus 6 from the per-file loops in `system.test.ts`.

- [ ] **Step 5: Write the failing React tests**

Create `packages/react/src/components/Heading/Heading.test.tsx`:

```tsx
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { Heading } from './Heading';
import { expectNoA11yViolations } from '../../test/a11y';

const LEVELS = [1, 2, 3, 4, 5, 6] as const;

describe('Heading', () => {
  afterEach(() => vi.restoreAllMocks());

  it.each(LEVELS)('level={%i} renders that heading tag, looking like that level', (level) => {
    render(<Heading level={level}>Title</Heading>);
    const heading = screen.getByRole('heading', { level, name: 'Title' });
    expect(heading.tagName).toBe(`H${level}`);
    expect(heading.className).toBe('bit-heading');
    expect(heading).toHaveAttribute('data-level', String(level));
  });

  it('size changes the look and keeps the tag: an h2 that looks like an h3', () => {
    render(
      <Heading level={2} size={3}>
        Section
      </Heading>,
    );
    const heading = screen.getByRole('heading', { level: 2, name: 'Section' });
    expect(heading).toHaveAttribute('data-level', '3');
  });

  it('drops an unknown level with a warning and falls back to an h2 with no data-level', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // @ts-expect-error 7 is not a heading level
    render(<Heading level={7}>Title</Heading>);
    const heading = screen.getByRole('heading', { level: 2, name: 'Title' });
    expect(heading).not.toHaveAttribute('data-level');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain('level="7"');
  });

  it('an unknown level with a valid size still takes the size as its look', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // @ts-expect-error 0 is not a heading level
    render(<Heading level={0} size={4}>Title</Heading>);
    expect(screen.getByRole('heading', { level: 2 })).toHaveAttribute('data-level', '4');
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('drops an unknown size with a warning and keeps the tag', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // @ts-expect-error "lg" is not a heading size
    render(<Heading level={3} size="lg">Title</Heading>);
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).not.toHaveAttribute('data-level');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain('size="lg"');
  });

  it('a missing level (an untyped caller) is an h2 and warns, like a typo would', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // @ts-expect-error level is required
    render(<Heading>Title</Heading>);
    expect(screen.getByRole('heading', { level: 2 })).not.toHaveAttribute('data-level');
    expect(warn.mock.calls[0]?.[0]).toContain('level="undefined"');
  });

  it('accepts a number-like string level from an untyped caller without warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Heading level={'4' as never}>Title</Heading>);
    expect(screen.getByRole('heading', { level: 4 })).toHaveAttribute('data-level', '4');
    expect(warn).not.toHaveBeenCalled();
  });

  it('puts the ref, className (last) and rest props on the heading', () => {
    const ref = createRef<HTMLHeadingElement>();
    render(
      <Heading ref={ref} level={1} className="extra" id="top" tabIndex={-1}>
        Title
      </Heading>,
    );
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.className).toBe('bit-heading extra');
    expect(ref.current).toBe(heading);
    expect(heading).toHaveAttribute('id', 'top');
    expect(heading).toHaveAttribute('tabindex', '-1');
  });

  it('rejects the legacy DOM color attribute and does not render it', () => {
    render(
      // @ts-expect-error color is not part of HeadingProps
      <Heading level={2} color="danger">
        Title
      </Heading>,
    );
    expect(screen.getByRole('heading')).not.toHaveAttribute('color');
  });

  it('has no accessibility violations at any level', async () => {
    const { container } = render(
      <>
        {LEVELS.map((level) => (
          <Heading key={level} level={level}>
            Level {level}
          </Heading>
        ))}
      </>,
    );
    expect(screen.getAllByRole('heading')).toHaveLength(6);
    await expectNoA11yViolations(container);
  });
});
```

In `packages/react/src/index.test.tsx`:
- In `SAMPLE_PROPS`, after `Input: { children: undefined },`, add `Heading: { level: 2 },`. The naming-rule test then renders a real h2 instead of tripping the missing-level warning.
- In the `'exports exactly the public components'` list, after the row `'Table', 'TableHead', 'TableBody', 'TableRow', 'TableCell',`, add a new row `'Heading',`.

- [ ] **Step 6: Run them and confirm they fail**

Run: `pnpm --filter @bit-ds/react test`
Expected: FAIL. `Failed to resolve import "./Heading"`, and the export list lacks Heading.

- [ ] **Step 7: Write Heading and export it**

Create `packages/react/src/components/Heading/Heading.tsx`:

```tsx
import { createElement, forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { dataValue, toClasses } from '../../system/toClasses';
import { dropLegacyColor } from '../../system/dropLegacyColor';

const LEVELS = [1, 2, 3, 4, 5, 6] as const;

export type HeadingLevel = (typeof LEVELS)[number];

export interface HeadingProps extends Omit<HTMLAttributes<HTMLHeadingElement>, 'color'> {
  /** Required. Renders `<h{level}>`, so the page outline stays correct. */
  level: HeadingLevel;
  /** The visual level, when it differs from `level`. Rendered as `data-level`; defaults to `level`. */
  size?: HeadingLevel;
}

/** A section title. `level` picks the tag; `size` picks the look, so an h2 can look like an h3. */
export const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(function Heading(
  { level, size, className, ...rest },
  ref,
) {
  // String(level), so a caller that leaves the required level off gets the same warning as a typo.
  const tag = dataValue('heading', { name: 'level', allowed: LEVELS, value: String(level) });
  const look = size === undefined ? tag : dataValue('heading', { name: 'size', allowed: LEVELS, value: size });
  return createElement(`h${tag ?? 2}`, {
    ref,
    className: toClasses('heading', [], className),
    'data-level': look,
    ...dropLegacyColor(rest),
  });
});
```

In `packages/react/src/index.ts`, after the Text exports, add:

```ts

export { Heading } from './components/Heading/Heading';
export type { HeadingProps, HeadingLevel } from './components/Heading/Heading';
```

In `packages/react/scripts/verify-dist.mjs`:
- In `EXPECTED`, after the row `'Table', 'TableHead', 'TableBody', 'TableRow', 'TableCell',`, add a new row `'Heading',`.
- Append `'HeadingProps', 'HeadingLevel'` to the type-name list (after `'TableCellProps'`).
- Append `'.bit-heading[data-level="6"]'` to the needle list (after `'.bit-table__cell'`). It is the file's last rule, so finding it proves the whole file was bundled.

In `scripts/smoke-consumer.mjs`, add the same `'Heading',` row to `EXPECTED`.

- [ ] **Step 8: Run the react tests with coverage and confirm they pass**

Run: `pnpm test:coverage`
Expected: `Tests  370 passed (370)`, with `100%` in all four columns.

- [ ] **Step 9: Write the failing gallery test**

In `apps/gallery/src/manifests/manifests.test.ts`, after `import { text } from './text';`, add:

```ts
import { heading } from './heading';
import { toJsx } from '../code/toJsx';
```

Before the test `'every preset sets only real controls, to values those controls accept (§H.3)'`, add:

```ts
  it('Heading always prints its required level; size is left off until chosen', () => {
    expect(toJsx(heading, defaultState(heading))).toBe(
      "import { Heading } from '@bit-ds/react';\n\n<Heading level={2}>Build with bit</Heading>",
    );
    const preset = heading.presets!.find((p) => p.label === 'h2 that looks like h3')!;
    expect(toJsx(heading, { ...defaultState(heading), ...preset.state } as ControlState)).toContain('<Heading level={2} size={3}>Build with bit</Heading>');
  });

```

- [ ] **Step 10: Run it and confirm it fails**

Run: `pnpm build && pnpm --filter @bit-ds/gallery test`
Expected: FAIL. `manifests.test.ts` can't load (`Failed to resolve import "./heading"`), and the other files pass: `Tests  133 passed (133)`.

- [ ] **Step 11: Add the manifest**

Create `apps/gallery/src/manifests/heading.ts`:

```ts
import { Heading } from '@bit-ds/react';
import type { Manifest } from './types';

const LEVELS = ['1', '2', '3', '4', '5', '6'];

export const heading: Manifest = {
  name: 'Heading',
  slug: 'heading',
  group: 'components',
  component: Heading,
  description: 'A section title. level picks the tag (h1–h6) for the page outline; size picks the look, so an h2 can look like an h3.',
  controls: [
    { kind: 'select', prop: 'level', values: LEVELS, default: '2', numeric: true, alwaysPrint: true },
    { kind: 'select', prop: 'size', values: ['none', ...LEVELS], default: 'none', numeric: true },
  ],
  children: 'Build with bit',
  presets: [{ label: 'h2 that looks like h3', state: { level: '2', size: '3' } }],
};
```

In `apps/gallery/src/manifests/registry.ts`, add `Heading,` after `Field,` in both the import list and `COMPONENTS`.

In `apps/gallery/src/manifests/index.ts`:
- After `import { text } from './text';`, add `import { heading } from './heading';`.
- In `MANIFESTS`, insert `heading` after `text`: `… card, stack, text, heading, spinner, …`.

- [ ] **Step 12: Run the gallery tests and confirm they pass**

Run: `pnpm build && pnpm --filter @bit-ds/gallery test`
Expected: PASS, `Tests  149 passed (149)`. The manifest test, and `/components/heading` in `routes.test.tsx` and `routes.dark.test.tsx` (axe in both modes), all come from iterating `MANIFESTS`.

- [ ] **Step 13: Run every gate**

Run: `pnpm build && pnpm verify && pnpm typecheck && pnpm lint && pnpm test && pnpm test:coverage && pnpm smoke && pnpm storybook:build`
Expected:
- `dist OK: 26 components`
- core `432`, react `370`, gallery `149` passed
- coverage `100%`
- `consumer OK: 26 components`
- `Storybook build completed successfully`

- [ ] **Step 14: Commit**

```bash
git add packages/core/src packages/react/src packages/react/scripts/verify-dist.mjs scripts/smoke-consumer.mjs apps/gallery/src
git commit -m "feat: Heading, with level for the tag and size for the look, and its gallery page

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Box

**Files:**
- Create: `packages/core/src/components/box.css`, `packages/core/src/__tests__/components/box.test.ts`
- Modify: `packages/core/src/index.css` (after `stack.css`)
- Create: `packages/react/src/components/Box/Box.tsx` and `Box.test.tsx`
- Modify: `packages/react/src/index.ts`, `packages/react/src/index.test.tsx`, `packages/react/scripts/verify-dist.mjs`, `scripts/smoke-consumer.mjs`
- Create: `apps/gallery/src/manifests/box.ts`
- Modify: `apps/gallery/src/manifests/registry.ts`, `apps/gallery/src/manifests/index.ts`, `apps/gallery/src/manifests/manifests.test.ts`, `apps/gallery/src/gallery.css`, `apps/gallery/src/gallery-css.test.ts`

**Interfaces:**
- Consumes `SPACE_STEPS` (`packages/react/src/system/axes.ts`), `dataValue`, `toClasses` and `dropLegacyColor`. In the gallery, it consumes `toJsx` and the `manifests.test.ts` imports from Task 1.
- Produces:
  - `Box` (`BoxProps extends Omit<HTMLAttributes<HTMLElement>, 'color'>`). Its props are `as?: BoxElement` and the fourteen spacing props `padding`, `paddingX`, `paddingY`, `paddingTop`, `paddingRight`, `paddingBottom`, `paddingLeft` and the same for `margin`, each `0 | SpaceStep`. Exported.
  - `BoxElement`, exported as a type
  - the CSS rules `.bit-box[data-{p|m|px|py|mx|my|pt|pr|pb|pl|mt|mr|mb|ml}="{0…64}"]`
  - the gallery manifest `box`: slug `box`, group `'components'`
  - the gallery rule `.gallery-preview__stage > .bit-box`

- [ ] **Step 1: Write the failing core test**

Create `packages/core/src/__tests__/components/box.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { SPACE_STEPS } from '../../tokens';
import { block, readCss } from '../css';

/** 0, then the space scale: the nine values every Box prop takes. */
const VALUES = [0, ...SPACE_STEPS] as const;

/** Spec §2: each attribute and the properties it sets, in the three precedence tiers. */
const TIERS: readonly (readonly (readonly [attribute: string, properties: readonly string[]])[])[] = [
  [
    ['p', ['padding']],
    ['m', ['margin']],
  ],
  [
    ['px', ['padding-left', 'padding-right']],
    ['py', ['padding-top', 'padding-bottom']],
    ['mx', ['margin-left', 'margin-right']],
    ['my', ['margin-top', 'margin-bottom']],
  ],
  [
    ['pt', ['padding-top']],
    ['pr', ['padding-right']],
    ['pb', ['padding-bottom']],
    ['pl', ['padding-left']],
    ['mt', ['margin-top']],
    ['mr', ['margin-right']],
    ['mb', ['margin-bottom']],
    ['ml', ['margin-left']],
  ],
];

const ATTRIBUTES = TIERS.flat();

/** Every `selector { body }` rule in the file, comments removed. */
function rules(css: string): { selector: string; body: string }[] {
  const bare = css.replace(/\/\*[\s\S]*?\*\//g, '');
  return [...bare.matchAll(/([^{}]+)\{([^}]*)\}/g)].map((m) => ({ selector: m[1]!.trim(), body: m[2]!.trim() }));
}

describe('components/box.css', () => {
  const css = readCss('components/box.css');

  it.each(ATTRIBUTES)('data-%s has a rule for 0 and each space step, setting %j', (attribute, properties) => {
    for (const n of VALUES) {
      const value = n === 0 ? '0' : `var(--bit-space-${n}px)`;
      const expected = properties.map((property) => `${property}: ${value};`).join(' ');
      expect(block(css, `.bit-box[data-${attribute}="${n}"]`)?.trim(), `${attribute}=${n}`).toBe(expected);
    }
  });

  it('has exactly one rule per attribute and value: 14 × 9 = 126', () => {
    expect(rules(css)).toHaveLength(ATTRIBUTES.length * VALUES.length);
    expect(ATTRIBUTES).toHaveLength(14);
  });

  it('orders the tiers all sides, then axes, then single sides, so the most specific prop wins', () => {
    const positions = TIERS.map((tier) =>
      tier.flatMap(([attribute]) => VALUES.map((n) => css.indexOf(`.bit-box[data-${attribute}="${n}"]`))),
    );
    for (let i = 1; i < positions.length; i += 1) {
      expect(Math.max(...positions[i - 1]!)).toBeLessThan(Math.min(...positions[i]!));
    }
  });

  it('sets nothing on .bit-box itself, and nothing but padding and margin anywhere', () => {
    expect(block(css, '.bit-box')).toBeNull();
    for (const { selector, body } of rules(css)) {
      expect(selector).toMatch(/^\.bit-box\[data-[pm][xytrbl]?="\d+"\]$/);
      const properties = [...body.matchAll(/([a-z-]+)\s*:/g)].map((m) => m[1]!);
      for (const property of properties) expect(property).toMatch(/^(padding|margin)(-(top|right|bottom|left))?$/);
    }
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `pnpm --filter @bit-ds/core test`
Expected: FAIL, `ENOENT … components/box.css`.

- [ ] **Step 3: Write the CSS**

Create `packages/core/src/components/box.css`:

```css
/* Box: padding and margin on the space scale, one data attribute per prop. .bit-box sets nothing itself;
   a plain Box is an unstyled element. 0 sets 0; every other value reads the token with the same number.
   Precedence: the most specific prop wins, whatever order the props are written in. Every rule has the
   same specificity, so the three tiers below are in source order and the later tier wins:
   all four sides, then the axes, then single sides. paddingTop beats paddingY, which beats padding.
   The axis and side rules use physical properties (left and right for X), matching the prop names. */

/* Tier 1: all four sides. */
.bit-box[data-p="0"] { padding: 0; }
.bit-box[data-p="4"] { padding: var(--bit-space-4px); }
.bit-box[data-p="8"] { padding: var(--bit-space-8px); }
.bit-box[data-p="12"] { padding: var(--bit-space-12px); }
.bit-box[data-p="16"] { padding: var(--bit-space-16px); }
.bit-box[data-p="24"] { padding: var(--bit-space-24px); }
.bit-box[data-p="32"] { padding: var(--bit-space-32px); }
.bit-box[data-p="48"] { padding: var(--bit-space-48px); }
.bit-box[data-p="64"] { padding: var(--bit-space-64px); }
.bit-box[data-m="0"] { margin: 0; }
.bit-box[data-m="4"] { margin: var(--bit-space-4px); }
.bit-box[data-m="8"] { margin: var(--bit-space-8px); }
.bit-box[data-m="12"] { margin: var(--bit-space-12px); }
.bit-box[data-m="16"] { margin: var(--bit-space-16px); }
.bit-box[data-m="24"] { margin: var(--bit-space-24px); }
.bit-box[data-m="32"] { margin: var(--bit-space-32px); }
.bit-box[data-m="48"] { margin: var(--bit-space-48px); }
.bit-box[data-m="64"] { margin: var(--bit-space-64px); }

/* Tier 2: the axes. */
.bit-box[data-px="0"] { padding-left: 0; padding-right: 0; }
.bit-box[data-px="4"] { padding-left: var(--bit-space-4px); padding-right: var(--bit-space-4px); }
.bit-box[data-px="8"] { padding-left: var(--bit-space-8px); padding-right: var(--bit-space-8px); }
.bit-box[data-px="12"] { padding-left: var(--bit-space-12px); padding-right: var(--bit-space-12px); }
.bit-box[data-px="16"] { padding-left: var(--bit-space-16px); padding-right: var(--bit-space-16px); }
.bit-box[data-px="24"] { padding-left: var(--bit-space-24px); padding-right: var(--bit-space-24px); }
.bit-box[data-px="32"] { padding-left: var(--bit-space-32px); padding-right: var(--bit-space-32px); }
.bit-box[data-px="48"] { padding-left: var(--bit-space-48px); padding-right: var(--bit-space-48px); }
.bit-box[data-px="64"] { padding-left: var(--bit-space-64px); padding-right: var(--bit-space-64px); }
.bit-box[data-py="0"] { padding-top: 0; padding-bottom: 0; }
.bit-box[data-py="4"] { padding-top: var(--bit-space-4px); padding-bottom: var(--bit-space-4px); }
.bit-box[data-py="8"] { padding-top: var(--bit-space-8px); padding-bottom: var(--bit-space-8px); }
.bit-box[data-py="12"] { padding-top: var(--bit-space-12px); padding-bottom: var(--bit-space-12px); }
.bit-box[data-py="16"] { padding-top: var(--bit-space-16px); padding-bottom: var(--bit-space-16px); }
.bit-box[data-py="24"] { padding-top: var(--bit-space-24px); padding-bottom: var(--bit-space-24px); }
.bit-box[data-py="32"] { padding-top: var(--bit-space-32px); padding-bottom: var(--bit-space-32px); }
.bit-box[data-py="48"] { padding-top: var(--bit-space-48px); padding-bottom: var(--bit-space-48px); }
.bit-box[data-py="64"] { padding-top: var(--bit-space-64px); padding-bottom: var(--bit-space-64px); }
.bit-box[data-mx="0"] { margin-left: 0; margin-right: 0; }
.bit-box[data-mx="4"] { margin-left: var(--bit-space-4px); margin-right: var(--bit-space-4px); }
.bit-box[data-mx="8"] { margin-left: var(--bit-space-8px); margin-right: var(--bit-space-8px); }
.bit-box[data-mx="12"] { margin-left: var(--bit-space-12px); margin-right: var(--bit-space-12px); }
.bit-box[data-mx="16"] { margin-left: var(--bit-space-16px); margin-right: var(--bit-space-16px); }
.bit-box[data-mx="24"] { margin-left: var(--bit-space-24px); margin-right: var(--bit-space-24px); }
.bit-box[data-mx="32"] { margin-left: var(--bit-space-32px); margin-right: var(--bit-space-32px); }
.bit-box[data-mx="48"] { margin-left: var(--bit-space-48px); margin-right: var(--bit-space-48px); }
.bit-box[data-mx="64"] { margin-left: var(--bit-space-64px); margin-right: var(--bit-space-64px); }
.bit-box[data-my="0"] { margin-top: 0; margin-bottom: 0; }
.bit-box[data-my="4"] { margin-top: var(--bit-space-4px); margin-bottom: var(--bit-space-4px); }
.bit-box[data-my="8"] { margin-top: var(--bit-space-8px); margin-bottom: var(--bit-space-8px); }
.bit-box[data-my="12"] { margin-top: var(--bit-space-12px); margin-bottom: var(--bit-space-12px); }
.bit-box[data-my="16"] { margin-top: var(--bit-space-16px); margin-bottom: var(--bit-space-16px); }
.bit-box[data-my="24"] { margin-top: var(--bit-space-24px); margin-bottom: var(--bit-space-24px); }
.bit-box[data-my="32"] { margin-top: var(--bit-space-32px); margin-bottom: var(--bit-space-32px); }
.bit-box[data-my="48"] { margin-top: var(--bit-space-48px); margin-bottom: var(--bit-space-48px); }
.bit-box[data-my="64"] { margin-top: var(--bit-space-64px); margin-bottom: var(--bit-space-64px); }

/* Tier 3: single sides. */
.bit-box[data-pt="0"] { padding-top: 0; }
.bit-box[data-pt="4"] { padding-top: var(--bit-space-4px); }
.bit-box[data-pt="8"] { padding-top: var(--bit-space-8px); }
.bit-box[data-pt="12"] { padding-top: var(--bit-space-12px); }
.bit-box[data-pt="16"] { padding-top: var(--bit-space-16px); }
.bit-box[data-pt="24"] { padding-top: var(--bit-space-24px); }
.bit-box[data-pt="32"] { padding-top: var(--bit-space-32px); }
.bit-box[data-pt="48"] { padding-top: var(--bit-space-48px); }
.bit-box[data-pt="64"] { padding-top: var(--bit-space-64px); }
.bit-box[data-pr="0"] { padding-right: 0; }
.bit-box[data-pr="4"] { padding-right: var(--bit-space-4px); }
.bit-box[data-pr="8"] { padding-right: var(--bit-space-8px); }
.bit-box[data-pr="12"] { padding-right: var(--bit-space-12px); }
.bit-box[data-pr="16"] { padding-right: var(--bit-space-16px); }
.bit-box[data-pr="24"] { padding-right: var(--bit-space-24px); }
.bit-box[data-pr="32"] { padding-right: var(--bit-space-32px); }
.bit-box[data-pr="48"] { padding-right: var(--bit-space-48px); }
.bit-box[data-pr="64"] { padding-right: var(--bit-space-64px); }
.bit-box[data-pb="0"] { padding-bottom: 0; }
.bit-box[data-pb="4"] { padding-bottom: var(--bit-space-4px); }
.bit-box[data-pb="8"] { padding-bottom: var(--bit-space-8px); }
.bit-box[data-pb="12"] { padding-bottom: var(--bit-space-12px); }
.bit-box[data-pb="16"] { padding-bottom: var(--bit-space-16px); }
.bit-box[data-pb="24"] { padding-bottom: var(--bit-space-24px); }
.bit-box[data-pb="32"] { padding-bottom: var(--bit-space-32px); }
.bit-box[data-pb="48"] { padding-bottom: var(--bit-space-48px); }
.bit-box[data-pb="64"] { padding-bottom: var(--bit-space-64px); }
.bit-box[data-pl="0"] { padding-left: 0; }
.bit-box[data-pl="4"] { padding-left: var(--bit-space-4px); }
.bit-box[data-pl="8"] { padding-left: var(--bit-space-8px); }
.bit-box[data-pl="12"] { padding-left: var(--bit-space-12px); }
.bit-box[data-pl="16"] { padding-left: var(--bit-space-16px); }
.bit-box[data-pl="24"] { padding-left: var(--bit-space-24px); }
.bit-box[data-pl="32"] { padding-left: var(--bit-space-32px); }
.bit-box[data-pl="48"] { padding-left: var(--bit-space-48px); }
.bit-box[data-pl="64"] { padding-left: var(--bit-space-64px); }
.bit-box[data-mt="0"] { margin-top: 0; }
.bit-box[data-mt="4"] { margin-top: var(--bit-space-4px); }
.bit-box[data-mt="8"] { margin-top: var(--bit-space-8px); }
.bit-box[data-mt="12"] { margin-top: var(--bit-space-12px); }
.bit-box[data-mt="16"] { margin-top: var(--bit-space-16px); }
.bit-box[data-mt="24"] { margin-top: var(--bit-space-24px); }
.bit-box[data-mt="32"] { margin-top: var(--bit-space-32px); }
.bit-box[data-mt="48"] { margin-top: var(--bit-space-48px); }
.bit-box[data-mt="64"] { margin-top: var(--bit-space-64px); }
.bit-box[data-mr="0"] { margin-right: 0; }
.bit-box[data-mr="4"] { margin-right: var(--bit-space-4px); }
.bit-box[data-mr="8"] { margin-right: var(--bit-space-8px); }
.bit-box[data-mr="12"] { margin-right: var(--bit-space-12px); }
.bit-box[data-mr="16"] { margin-right: var(--bit-space-16px); }
.bit-box[data-mr="24"] { margin-right: var(--bit-space-24px); }
.bit-box[data-mr="32"] { margin-right: var(--bit-space-32px); }
.bit-box[data-mr="48"] { margin-right: var(--bit-space-48px); }
.bit-box[data-mr="64"] { margin-right: var(--bit-space-64px); }
.bit-box[data-mb="0"] { margin-bottom: 0; }
.bit-box[data-mb="4"] { margin-bottom: var(--bit-space-4px); }
.bit-box[data-mb="8"] { margin-bottom: var(--bit-space-8px); }
.bit-box[data-mb="12"] { margin-bottom: var(--bit-space-12px); }
.bit-box[data-mb="16"] { margin-bottom: var(--bit-space-16px); }
.bit-box[data-mb="24"] { margin-bottom: var(--bit-space-24px); }
.bit-box[data-mb="32"] { margin-bottom: var(--bit-space-32px); }
.bit-box[data-mb="48"] { margin-bottom: var(--bit-space-48px); }
.bit-box[data-mb="64"] { margin-bottom: var(--bit-space-64px); }
.bit-box[data-ml="0"] { margin-left: 0; }
.bit-box[data-ml="4"] { margin-left: var(--bit-space-4px); }
.bit-box[data-ml="8"] { margin-left: var(--bit-space-8px); }
.bit-box[data-ml="12"] { margin-left: var(--bit-space-12px); }
.bit-box[data-ml="16"] { margin-left: var(--bit-space-16px); }
.bit-box[data-ml="24"] { margin-left: var(--bit-space-24px); }
.bit-box[data-ml="32"] { margin-left: var(--bit-space-32px); }
.bit-box[data-ml="48"] { margin-left: var(--bit-space-48px); }
.bit-box[data-ml="64"] { margin-left: var(--bit-space-64px); }
```

In `packages/core/src/index.css`, after `@import "./components/stack.css";`, add `@import "./components/box.css";`.

- [ ] **Step 4: Run the core tests and confirm they pass**

Run: `pnpm --filter @bit-ds/core test`
Expected: PASS, `Tests  455 passed (455)`. That is 17 Box tests, plus 6 from the per-file loops.

- [ ] **Step 5: Write the failing React tests**

Create `packages/react/src/components/Box/Box.test.tsx`:

```tsx
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { Box } from './Box';
import type { BoxProps } from './Box';
import { SPACE_STEPS } from '../../system/axes';
import { expectNoA11yViolations } from '../../test/a11y';

/** Spec §2: each spacing prop and the attribute it renders. */
const ATTRIBUTES = [
  ['padding', 'data-p'],
  ['paddingX', 'data-px'],
  ['paddingY', 'data-py'],
  ['paddingTop', 'data-pt'],
  ['paddingRight', 'data-pr'],
  ['paddingBottom', 'data-pb'],
  ['paddingLeft', 'data-pl'],
  ['margin', 'data-m'],
  ['marginX', 'data-mx'],
  ['marginY', 'data-my'],
  ['marginTop', 'data-mt'],
  ['marginRight', 'data-mr'],
  ['marginBottom', 'data-mb'],
  ['marginLeft', 'data-ml'],
] as const;

/** 0, then the space scale: the nine values every spacing prop takes. */
const SPACES = [0, ...SPACE_STEPS] as const;

describe('Box', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders a plain div.bit-box with no spacing attributes by default', () => {
    render(<Box data-testid="b">x</Box>);
    const box = screen.getByTestId('b');
    expect(box.tagName).toBe('DIV');
    expect(box.className).toBe('bit-box');
    expect([...box.attributes].map((a) => a.name).sort()).toEqual(['class', 'data-testid']);
  });

  it.each(ATTRIBUTES)('%s renders %s with the px number', (prop, attribute) => {
    render(<Box {...({ [prop]: 24 } as BoxProps)} data-testid="b" />);
    expect(screen.getByTestId('b')).toHaveAttribute(attribute, '24');
  });

  it.each(SPACES)('padding={%i} renders data-p with the same number', (n) => {
    render(<Box padding={n} data-testid="b" />);
    expect(screen.getByTestId('b')).toHaveAttribute('data-p', String(n));
  });

  it('every prop at once renders all fourteen attributes', () => {
    const all = Object.fromEntries(ATTRIBUTES.map(([prop], i) => [prop, SPACES[i % SPACES.length]])) as BoxProps;
    render(<Box {...all} data-testid="b" />);
    const box = screen.getByTestId('b');
    ATTRIBUTES.forEach(([, attribute], i) => expect(box).toHaveAttribute(attribute, String(SPACES[i % SPACES.length])));
  });

  it('drops an off-scale value from an untyped caller and warns in development', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // @ts-expect-error 10 is not on the space scale
    render(<Box paddingTop={10} marginX={8} data-testid="b" />);
    const box = screen.getByTestId('b');
    expect(box).not.toHaveAttribute('data-pt');
    expect(box).toHaveAttribute('data-mx', '8');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain('paddingTop="10"');
  });

  it('accepts a number-like string from an untyped caller without warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Box margin={'0' as never} data-testid="b" />);
    expect(screen.getByTestId('b')).toHaveAttribute('data-m', '0');
    expect(warn).not.toHaveBeenCalled();
  });

  it('as changes the element', () => {
    render(
      <Box as="section" aria-label="Stats" padding={16}>
        x
      </Box>,
    );
    const region = screen.getByRole('region', { name: 'Stats' });
    expect(region.tagName).toBe('SECTION');
    expect(region).toHaveAttribute('data-p', '16');
  });

  it('an unknown as from an untyped caller falls back to a div, with a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // @ts-expect-error button is not a Box element; use Button
    render(<Box as="button" data-testid="b" />);
    expect(screen.getByTestId('b').tagName).toBe('DIV');
    expect(warn.mock.calls[0]?.[0]).toContain('as="button"');
  });

  it('puts the ref, className (last) and rest props on the element, and never passes spacing props to the DOM', () => {
    const ref = createRef<HTMLElement>();
    render(<Box ref={ref} as="span" className="extra" id="pad" paddingX={8} data-testid="b" />);
    const box = screen.getByTestId('b');
    expect(box.tagName).toBe('SPAN');
    expect(box.className).toBe('bit-box extra');
    expect(ref.current).toBe(box);
    expect(box).toHaveAttribute('id', 'pad');
    expect(box).not.toHaveAttribute('paddingX');
    expect(box).not.toHaveAttribute('paddingx');
  });

  it('rejects the legacy DOM color attribute and does not render it', () => {
    // @ts-expect-error color is not part of BoxProps
    render(<Box color="danger" data-testid="b" />);
    expect(screen.getByTestId('b')).not.toHaveAttribute('color');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <Box as="article" padding={16} marginTop={24}>
        <p>A padded article.</p>
      </Box>,
    );
    await expectNoA11yViolations(container);
  });
});
```

In `packages/react/src/index.test.tsx`, change the row `'Heading',` in the export list to `'Heading', 'Box',`. Box needs no `SAMPLE_PROPS` entry.

- [ ] **Step 6: Run them and confirm they fail**

Run: `pnpm --filter @bit-ds/react test`
Expected: FAIL. `Failed to resolve import "./Box"`, and the export list lacks Box.

- [ ] **Step 7: Write Box and export it**

Create `packages/react/src/components/Box/Box.tsx`:

```tsx
import { createElement, forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { SPACE_STEPS } from '../../system/axes';
import { dataValue, toClasses } from '../../system/toClasses';
import { dropLegacyColor } from '../../system/dropLegacyColor';

const ELEMENTS = ['div', 'section', 'article', 'aside', 'header', 'footer', 'main', 'nav', 'span'] as const;

export type BoxElement = (typeof ELEMENTS)[number];

/** 0, then the space scale (4, 8, 12, 16, 24, 32, 48, 64). */
const SPACES = [0, ...SPACE_STEPS] as const;

type Space = (typeof SPACES)[number];

/** Each spacing prop and the short data attribute it renders. The prop names are the public API. */
const ATTRIBUTES = {
  padding: 'p',
  paddingX: 'px',
  paddingY: 'py',
  paddingTop: 'pt',
  paddingRight: 'pr',
  paddingBottom: 'pb',
  paddingLeft: 'pl',
  margin: 'm',
  marginX: 'mx',
  marginY: 'my',
  marginTop: 'mt',
  marginRight: 'mr',
  marginBottom: 'mb',
  marginLeft: 'ml',
} as const;

type SpacingProp = keyof typeof ATTRIBUTES;

const SPACING_PROPS = Object.keys(ATTRIBUTES) as SpacingProp[];

/**
 * Every spacing prop is 0 or a px value on the space scale, rendered as a short data attribute that reads
 * `--bit-space-{n}px`. When props overlap, the most specific wins: a side beats an axis beats all four.
 */
export interface BoxProps extends Omit<HTMLAttributes<HTMLElement>, 'color'> {
  /** Which element to render. Default `div`. */
  as?: BoxElement;
  /** All four sides. `data-p`. */
  padding?: Space;
  /** Left and right. `data-px`. */
  paddingX?: Space;
  /** Top and bottom. `data-py`. */
  paddingY?: Space;
  /** `data-pt`. */
  paddingTop?: Space;
  /** `data-pr`. */
  paddingRight?: Space;
  /** `data-pb`. */
  paddingBottom?: Space;
  /** `data-pl`. */
  paddingLeft?: Space;
  /** All four sides. `data-m`. */
  margin?: Space;
  /** Left and right. `data-mx`. */
  marginX?: Space;
  /** Top and bottom. `data-my`. */
  marginY?: Space;
  /** `data-mt`. */
  marginTop?: Space;
  /** `data-mr`. */
  marginRight?: Space;
  /** `data-mb`. */
  marginBottom?: Space;
  /** `data-ml`. */
  marginLeft?: Space;
}

/** Padding and margin on the space scale, for one element. Sets nothing else: no colors, borders or shadows. */
export const Box = forwardRef<HTMLElement, BoxProps>(function Box({ as = 'div', className, ...props }, ref) {
  const spacing = Object.fromEntries(
    SPACING_PROPS.map((prop) => [
      `data-${ATTRIBUTES[prop]}`,
      dataValue('box', { name: prop, allowed: SPACES, value: props[prop] }),
    ]),
  );
  const rest = Object.fromEntries(Object.entries(props).filter(([key]) => !SPACING_PROPS.includes(key as SpacingProp)));
  const tag = dataValue('box', { name: 'as', allowed: ELEMENTS, value: as }) ?? 'div';
  return createElement(tag, { ref, className: toClasses('box', [], className), ...spacing, ...dropLegacyColor(rest) });
});
```

In `packages/react/src/index.ts`, after the Stack exports, add:

```ts

export { Box } from './components/Box/Box';
export type { BoxProps, BoxElement } from './components/Box/Box';
```

In `packages/react/scripts/verify-dist.mjs`:
- Change `EXPECTED`'s `'Heading',` row to `'Heading', 'Box',`.
- Append `'BoxProps', 'BoxElement'` to the type-name list (after `'HeadingLevel'`).
- Append `'.bit-box[data-ml="64"]'` to the needle list (after `'.bit-heading[data-level="6"]'`). It is the file's last rule.

In `scripts/smoke-consumer.mjs`, change the same `EXPECTED` row to `'Heading', 'Box',`.

- [ ] **Step 8: Run the react tests with coverage and confirm they pass**

Run: `pnpm test:coverage`
Expected: `Tests  403 passed (403)`, with `100%` in all four columns.

- [ ] **Step 9: Write the failing gallery tests**

In `apps/gallery/src/manifests/manifests.test.ts`, after `import { heading } from './heading';`, add `import { box } from './box';`. After the Heading test from Task 1, add:

```ts
  it('Box prints its padding and leaves the other spacing props off until chosen; 0 prints as 0', () => {
    expect(toJsx(box, defaultState(box))).toBe(
      "import { Badge, Box } from '@bit-ds/react';\n\n<Box padding={16}>\n  <Badge color=\"primary\">Inside the box</Badge>\n</Box>",
    );
    expect(toJsx(box, { ...defaultState(box), paddingY: '0' })).toContain('<Box padding={16} paddingY={0}>');
    expect(box.controls.filter((c) => c.kind === 'select' && c.numeric).map((c) => c.prop)).toEqual([
      'padding',
      'paddingX',
      'paddingY',
      'margin',
      'marginTop',
    ]);
  });

```

In `apps/gallery/src/gallery-css.test.ts`, before `it('never hardcodes a font stack: …'`, add:

```ts
  it('outlines a previewed Box, dashed in the mode accent, and only the Box the stage shows', () => {
    expect(galleryCss).toMatch(/\.gallery-preview__stage > \.bit-box \{\s*outline: 2px dashed var\(--bit-color-accent\);\s*\}/);
  });

```

- [ ] **Step 10: Run them and confirm they fail**

Run: `pnpm build && pnpm --filter @bit-ds/gallery test`
Expected: FAIL.
- `manifests.test.ts` can't load: `Failed to resolve import "./box"`.
- In the other files, `Tests  1 failed | 135 passed (136)`. The failure is the outline test.

- [ ] **Step 11: Add the manifest and the outline**

Create `apps/gallery/src/manifests/box.ts`:

```ts
import { Box, SPACE_STEPS } from '@bit-ds/react';
import type { Manifest } from './types';

/** none leaves the prop off; 0 sets 0. */
const SPACES = ['none', '0', ...SPACE_STEPS.map(String)];

export const box: Manifest = {
  name: 'Box',
  slug: 'box',
  group: 'components',
  component: Box,
  description:
    'Padding and margin on the space scale, for one element. When props overlap, the most specific wins: a side beats an axis beats all four. The gallery draws the dashed outline, so you can see the space.',
  controls: [
    { kind: 'select', prop: 'padding', values: SPACES, default: '16', numeric: true, alwaysPrint: true },
    { kind: 'select', prop: 'paddingX', values: SPACES, default: 'none', numeric: true },
    { kind: 'select', prop: 'paddingY', values: SPACES, default: 'none', numeric: true },
    { kind: 'select', prop: 'margin', values: SPACES, default: 'none', numeric: true },
    { kind: 'select', prop: 'marginTop', values: SPACES, default: 'none', numeric: true },
    {
      kind: 'select',
      prop: 'as',
      values: ['div', 'section', 'article', 'aside', 'header', 'footer', 'main', 'nav', 'span'],
      default: 'div',
    },
  ],
  children: [{ component: 'Badge', props: { color: 'primary' }, children: 'Inside the box' }],
  presets: [
    { label: 'Banner: wide and short', state: { padding: 'none', paddingX: '24', paddingY: '8' } },
    { label: 'Y beats padding', state: { paddingY: '0' } },
    { label: 'Pushed down', state: { marginTop: '32' } },
  ],
};
```

In `apps/gallery/src/manifests/registry.ts`, add `Box,` after `BitLogo,` in both the import list and `COMPONENTS`.

In `apps/gallery/src/manifests/index.ts`:
- After `import { stack } from './stack';`, add `import { box } from './box';`.
- In `MANIFESTS`, insert `box` after `stack`: `… card, stack, box, text, heading, spinner, …`.

In `apps/gallery/src/gallery.css`, after the `.gallery-preview[data-checkerboard] .gallery-preview__stage { … }` block and before `/* ---------- presets and matrix ---------- */`, add:

```css

/* A previewed Box gets a dashed outline in the mode accent, so its padding shows. Gallery only: Box itself
   draws nothing. An outline takes no space, so the space on screen is exactly what the props set. */
.gallery-preview__stage > .bit-box {
  outline: 2px dashed var(--bit-color-accent);
}
```

- [ ] **Step 12: Run the gallery tests and confirm they pass**

Run: `pnpm build && pnpm --filter @bit-ds/gallery test`
Expected: PASS, `Tests  153 passed (153)`. That is the manifest test, the outline test, and `/components/box` in both route files.

- [ ] **Step 13: Run every gate**

Run: `pnpm build && pnpm verify && pnpm typecheck && pnpm lint && pnpm test && pnpm test:coverage && pnpm smoke && pnpm storybook:build`
Expected:
- `dist OK: 27 components`
- core `455`, react `403`, gallery `153` passed
- coverage `100%`
- `consumer OK: 27 components`
- `Storybook build completed successfully`

- [ ] **Step 14: Commit**

```bash
git add packages/core/src packages/react/src packages/react/scripts/verify-dist.mjs scripts/smoke-consumer.mjs apps/gallery/src
git commit -m "feat: Box, padding and margin on the space scale where the most specific prop wins, with a dashed gallery outline

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: The Typography page

**Files:**
- Create: `apps/gallery/src/pages/TypographyPage.tsx`, `apps/gallery/src/pages/TypographyPage.test.tsx`
- Modify: `apps/gallery/src/router.tsx`, `apps/gallery/src/shell/Sidebar.tsx`, `apps/gallery/src/shell/Sidebar.test.tsx`
- Modify: `apps/gallery/src/routes.test.tsx`, `apps/gallery/src/routes.dark.test.tsx`
- Modify: `apps/gallery/src/gallery.css`, `apps/gallery/src/gallery-css.test.ts`

**Interfaces:**
- Consumes `Heading`, `HeadingLevel` (Task 1) and `Box` (Task 2), plus the existing `Alert`, `Card`, `CardBody`, `Code`, `Stack`, `Table` and its parts, `Text`, `TextProps`, `renderAt`, and `expectNoA11yViolations`.
- Produces:
  - `TypographyPage` (a named export), routed at `/typography`, lazy
  - the `NAV` entry `{ group: 'Foundations', label: 'Typography', to: '/typography' }`
  - `FOUNDATION_PAGES` (a module constant in `routes.test.tsx` and in `routes.dark.test.tsx`), an array of `[path, h1]`
  - the gallery classes `.gallery-grid` and `.gallery-face[data-face="display|body|pixel|mono"]`. Task 4 reuses `.gallery-grid`.

- [ ] **Step 1: Write the failing tests**

Create `apps/gallery/src/pages/TypographyPage.test.tsx`:

```tsx
import { screen, within } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderAt } from '../test/renderRoute';

async function renderTypography() {
  const utils = renderAt('/typography');
  await screen.findByRole('heading', { level: 1, name: 'Typography' });
  return { ...utils, main: screen.getByRole('main') };
}

describe('Typography page', () => {
  beforeEach(() => {
    document.documentElement.dataset.theme = 'power-up';
  });

  it("the outline is the page's own headings; the heading samples are not headings", async () => {
    const { main } = await renderTypography();
    const outline = within(main)
      .getAllByRole('heading')
      .map((h) => `${h.tagName} ${h.textContent}`);
    expect(outline).toEqual(['H1 Typography', 'H2 Faces', 'H2 Headings', 'H2 Text sizes']);
  });

  it('shows the four faces, each with its font token', async () => {
    const { container } = await renderTypography();
    const faces = [...container.querySelectorAll('.gallery-face')].map((el) => el.getAttribute('data-face'));
    expect(faces).toEqual(['display', 'body', 'pixel', 'mono']);
    for (const face of faces) expect(screen.getByText(`--bit-font-${face}`)).toHaveClass('bit-code');
  });

  it('the Headings table renders every level as a real Heading, with its tag, size, face and code', async () => {
    await renderTypography();
    const table = screen.getByRole('table', { name: 'Heading levels' });
    const samples = [...table.querySelectorAll('.bit-heading')];
    expect(samples.map((el) => `${el.tagName} ${el.getAttribute('data-level')}`)).toEqual([
      'H1 1',
      'H2 2',
      'H3 3',
      'H4 4',
      'H5 5',
      'H6 6',
    ]);
    for (const el of samples) expect(el).toHaveAttribute('role', 'presentation');
    expect(within(table).getByText('h4 · 15 · body bold')).toBeInTheDocument();
    expect(within(table).getByText('<Heading level={6}>')).toHaveClass('bit-code');
  });

  it('the Text sizes table shows 18, 15 and 13 muted, with their code', async () => {
    await renderTypography();
    const table = screen.getByRole('table', { name: 'Text sizes' });
    const samples = [...table.querySelectorAll('.bit-table__body .bit-table__cell:first-child .bit-text')];
    expect(samples.map((el) => el.getAttribute('data-size'))).toEqual(['18', '15', '13']);
    expect(samples[2]).toHaveClass('bit-neutral');
    expect(within(table).getByText('<Text size={13} color="neutral">')).toHaveClass('bit-code');
  });

  it("Do and Don't are success and danger Alerts, read as notes rather than live status", async () => {
    const { main } = await renderTypography();
    const notes = within(main).getAllByRole('note');
    expect(notes.map((n) => n.className)).toEqual([
      'bit-alert bit-success bit-outline',
      'bit-alert bit-danger bit-outline',
    ]);
    expect(within(notes[0]!).getByText('Do')).toBeInTheDocument();
    expect(within(notes[1]!).getByText("Don't")).toBeInTheDocument();
  });

  it('uses no raw table, code, pre or heading tags: every one comes from a bit component', async () => {
    const { main } = await renderTypography();
    for (const el of main.querySelectorAll('table, code, pre, h1, h2, h3, h4, h5, h6')) {
      expect(el.matches('.bit-table__table, .bit-code, .bit-code__pre, .bit-code__pre code, .bit-heading'), el.outerHTML).toBe(true);
    }
  });
});
```

In `apps/gallery/src/shell/Sidebar.test.tsx`, before `it('hides a group with no items', …)`, add:

```tsx
  it('Foundations lists the guide pages: Tokens, then Typography', () => {
    renderSidebar(NAV);
    expect(linksUnder('Foundations')).toEqual(['Tokens', 'Typography']);
    expect(screen.getByRole('link', { name: 'Typography' })).toHaveAttribute('href', '/typography');
  });

```

In `apps/gallery/src/routes.test.tsx`, after the `reactPanel` function, add:

```tsx
/** The Foundations guide pages and their h1s. */
const FOUNDATION_PAGES = [['/typography', 'Typography']] as const;

```

After the `it.each(MANIFESTS…)` route smoke test, add:

```tsx
  it.each(FOUNDATION_PAGES)('%s: its heading, with no axe violations', async (path, title) => {
    const { container } = renderAt(path);
    expect(await screen.findByRole('heading', { level: 1, name: title })).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

```

In `apps/gallery/src/routes.dark.test.tsx`, add the same `FOUNDATION_PAGES` constant above the `/** Every page with data-mode="dark" …` comment. After the `it.each(MANIFESTS…)` test, add:

```tsx
  it.each(FOUNDATION_PAGES)('%s renders with no axe violations', async (path, title) => {
    const { container } = renderAt(path);
    expect(await screen.findByRole('heading', { level: 1, name: title })).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

```

In `apps/gallery/src/gallery-css.test.ts`, before `it('never hardcodes a font stack: …'`, add:

```ts
  it.each(['display', 'body', 'pixel', 'mono'])('a %s face sample reads its own font token', (face) => {
    const rule = new RegExp(`\\.gallery-face\\[data-face="${face}"\\]\\s*\\{[^}]*font-family: var\\(--bit-font-${face}\\);`);
    expect(galleryCss).toMatch(rule);
  });

```

- [ ] **Step 2: Run them and confirm they fail**

Run: `pnpm build && pnpm --filter @bit-ds/gallery test`
Expected: FAIL, `Tests  13 failed | 153 passed (166)`. The failures are:
- the six page tests and the two `/typography` route smokes (the route is the 404)
- the sidebar test
- the four face rules

- [ ] **Step 3: Write the page, route, sidebar entry and CSS**

Create `apps/gallery/src/pages/TypographyPage.tsx`:

```tsx
import {
  Alert,
  Box,
  Card,
  CardBody,
  Code,
  Heading,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Text,
} from '@bit-ds/react';
import type { HeadingLevel, TextProps } from '@bit-ds/react';

/** power-up's four faces. The sample is set in the face through `.gallery-face[data-face]` in gallery.css. */
const FACES = [
  { face: 'display', name: 'Lilita One', use: 'h1 to h3, and Text at 24 and 32.' },
  { face: 'body', name: 'Nunito', use: 'Body copy, labels, h4 and h5.' },
  { face: 'pixel', name: 'Press Start', use: 'Eyebrows, h6, small labels.' },
  { face: 'mono', name: 'JetBrains Mono', use: 'Code and CodeBlock.' },
] as const;

const HEADINGS: readonly { level: HeadingLevel; example: string; look: string }[] = [
  { level: 1, example: 'Page title', look: 'h1 · 32 · display' },
  { level: 2, example: 'Section', look: 'h2 · 24 · display' },
  { level: 3, example: 'Subsection', look: 'h3 · 18 · display' },
  { level: 4, example: 'Group title', look: 'h4 · 15 · body bold' },
  { level: 5, example: 'Small title', look: 'h5 · 13 · body bold' },
  { level: 6, example: 'Eyebrow', look: 'h6 · 11 · pixel' },
];

const TEXT_SIZES: readonly { props: TextProps; example: string; look: string; code: string }[] = [
  { props: { size: 18 }, example: 'Lead paragraph', look: '18 · --bit-text-18px', code: '<Text size={18}>' },
  { props: {}, example: 'Body copy, the default', look: '15 · --bit-text-15px', code: '<Text>' },
  {
    props: { size: 13, color: 'neutral' },
    example: 'Hints and captions',
    look: '13 · --bit-text-13px, muted',
    code: '<Text size={13} color="neutral">',
  },
];

/** The head row both tables share: what it looks like, what it is, and how to write it. */
function HeadRow({ middle }: { middle: string }) {
  return (
    <TableHead>
      <TableRow>
        <TableCell>Example</TableCell>
        <TableCell>{middle}</TableCell>
        <TableCell>Code</TableCell>
      </TableRow>
    </TableHead>
  );
}

function Faces() {
  return (
    <Box className="gallery-grid">
      {FACES.map(({ face, name, use }) => (
        <Card key={face}>
          <CardBody>
            <Stack gap={8} align="start">
              <Text as="span" size={24} className="gallery-face" data-face={face}>
                {name}
              </Text>
              <Code>{`--bit-font-${face}`}</Code>
              <Text size={13} color="neutral">
                {use}
              </Text>
            </Stack>
          </CardBody>
        </Card>
      ))}
    </Box>
  );
}

/** Each sample is a real Heading, so it shows the real look. role="presentation" keeps it out of the page outline. */
function HeadingLevels() {
  return (
    <Table aria-label="Heading levels">
      <HeadRow middle="Tag · size · face" />
      <TableBody>
        {HEADINGS.map(({ level, example, look }) => (
          <TableRow key={level}>
            <TableCell>
              <Heading level={level} role="presentation">
                {example}
              </Heading>
            </TableCell>
            <TableCell>
              <Text size={13} color="neutral">
                {look}
              </Text>
            </TableCell>
            <TableCell>
              <Code>{`<Heading level={${level}}>`}</Code>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function TextSizes() {
  return (
    <Table aria-label="Text sizes">
      <HeadRow middle="Size · token" />
      <TableBody>
        {TEXT_SIZES.map(({ props, example, look, code }) => (
          <TableRow key={code}>
            <TableCell>
              <Text {...props}>{example}</Text>
            </TableCell>
            <TableCell>
              <Text size={13} color="neutral">
                {look}
              </Text>
            </TableCell>
            <TableCell>
              <Code>{code}</Code>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** Do and Don't are guidance, not news: role="note" instead of Alert's default live status. */
function DoAndDont() {
  return (
    <Box className="gallery-grid">
      <Alert color="success" title="Do" role="note">
        Pick the level for the outline (one h1 per page, no skipped levels), then use <Code>size</Code> if it should
        look smaller.
      </Alert>
      <Alert color="danger" title="Don't" role="note">
        Use a bold Text where a heading belongs. Screen readers move through a page by its headings.
      </Alert>
    </Box>
  );
}

/** Foundations: the faces, the heading levels and the Text sizes. Built only from bit components. */
export function TypographyPage() {
  return (
    <Stack gap={32}>
      <Stack gap={8}>
        <Heading level={1}>Typography</Heading>
        <Text size={18}>
          Four faces and one scale. Use <Code>Heading</Code> for titles: the level picks the tag. Use <Code>Text</Code>{' '}
          for everything else: the size picks the step.
        </Text>
      </Stack>
      <Stack gap={12}>
        <Heading level={2}>Faces</Heading>
        <Faces />
      </Stack>
      <Stack gap={12}>
        <Heading level={2}>Headings</Heading>
        <HeadingLevels />
      </Stack>
      <Stack gap={12}>
        <Heading level={2}>Text sizes</Heading>
        <TextSizes />
      </Stack>
      <DoAndDont />
    </Stack>
  );
}
```

In `apps/gallery/src/router.tsx`:
- After the `TokensPage` lazy line, add:

  ```tsx
  const TypographyPage = lazy(() => import('./pages/TypographyPage').then((m) => ({ default: m.TypographyPage })));
  ```

- After `{ path: 'tokens', element: lazyPage(<TokensPage />) },`, add:

  ```tsx
          { path: 'typography', element: lazyPage(<TypographyPage />) },
  ```

In `apps/gallery/src/shell/Sidebar.tsx`:
- Change the `NAV` doc comment to `/** Foundations (the guide pages), then one entry per components or forms manifest, then Brand. */`.
- After `{ group: 'Foundations', label: 'Tokens', to: '/tokens' },`, add:

  ```tsx
    { group: 'Foundations', label: 'Typography', to: '/typography' },
  ```

At the end of `apps/gallery/src/gallery.css`, append:

```css

/* ---------- foundations pages ---------- */
/* Cards side by side, as many as fit at 12rem or wider: the faces, Do and Don't, Stack or Box. */
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: var(--bit-space-12px);
}

/* A face sample on the Typography page, set in the font token data-face names. Text size 24 gives the
   base size; the pixel and mono samples step down so their wide letters fit a card. */
.gallery-face[data-face="display"] {
  font-family: var(--bit-font-display);
  font-weight: 400;
}

.gallery-face[data-face="body"] {
  font-family: var(--bit-font-body);
  font-weight: var(--bit-weight-bold);
}

.gallery-face[data-face="pixel"] {
  font-family: var(--bit-font-pixel);
  font-weight: 400;
  font-size: var(--bit-text-13px);
  text-transform: uppercase;
}

.gallery-face[data-face="mono"] {
  font-family: var(--bit-font-mono);
  font-weight: 400;
  font-size: var(--bit-text-18px);
}
```

`gallery.css` loads after `styles.css` (see `main.tsx`), so `.gallery-face[data-face]` beats `.bit-text[data-size="24"]`, which has the same specificity.

- [ ] **Step 4: Run the gallery tests and confirm they pass**

Run: `pnpm --filter @bit-ds/gallery test`
Expected: PASS, `Tests  166 passed (166)`.

- [ ] **Step 5: Run every gate**

Run: `pnpm build && pnpm verify && pnpm typecheck && pnpm lint && pnpm test && pnpm test:coverage && pnpm smoke && pnpm storybook:build`
Expected:
- `dist OK: 27 components`
- core `455`, react `403`, gallery `166` passed
- coverage `100%`
- `consumer OK: 27 components`
- `Storybook build completed successfully`

- [ ] **Step 6: Commit**

```bash
git add apps/gallery/src
git commit -m "feat(gallery): Typography guide page under Foundations, built only from bit components

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: The Spacing page

**Files:**
- Create: `apps/gallery/src/pages/SpacingPage.tsx`, `apps/gallery/src/pages/SpacingPage.test.tsx`
- Modify: `apps/gallery/src/router.tsx`, `apps/gallery/src/shell/Sidebar.tsx`, `apps/gallery/src/shell/Sidebar.test.tsx`
- Modify: `apps/gallery/src/routes.test.tsx`, `apps/gallery/src/routes.dark.test.tsx`
- Modify: `apps/gallery/src/gallery.css`, `apps/gallery/src/gallery-css.test.ts`

**Interfaces:**
- Consumes `Box` (Task 2), `Heading` (Task 1), `.gallery-grid` and `FOUNDATION_PAGES` (Task 3), and the existing `Badge`, `Card`, `CardBody`, `Code`, `CodeBlock`, `SPACE_STEPS`, `Stack`, `Table` and its parts, and `Text`.
- Produces:
  - `SpacingPage` (a named export), routed at `/spacing`, lazy
  - the `NAV` entry `{ group: 'Foundations', label: 'Spacing', to: '/spacing' }`
  - the gallery classes `.gallery-ruler`, `.gallery-ruler__bar` and `.bit-box.gallery-outline`
  - the CodeBlock labels `Stack example code` and `Box example code`

- [ ] **Step 1: Write the failing tests**

Create `apps/gallery/src/pages/SpacingPage.test.tsx`:

```tsx
import { screen, within } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { SPACE_STEPS } from '@bit-ds/react';
import { renderAt } from '../test/renderRoute';

async function renderSpacing() {
  const utils = renderAt('/spacing');
  await screen.findByRole('heading', { level: 1, name: 'Spacing' });
  return { ...utils, main: screen.getByRole('main') };
}

describe('Spacing page', () => {
  beforeEach(() => {
    document.documentElement.dataset.theme = 'power-up';
  });

  it('has the outline the board drew', async () => {
    const { main } = await renderSpacing();
    const outline = within(main)
      .getAllByRole('heading')
      .map((h) => `${h.tagName} ${h.textContent}`);
    expect(outline).toEqual([
      'H1 Spacing',
      'H2 The scale',
      'H2 Stack or Box?',
      'H3 Stack: space between things',
      'H3 Box: space around one thing',
      'H2 Box props',
    ]);
  });

  it('the ruler draws each step with a Box whose paddingLeft is that step, beside its token', async () => {
    const { container } = await renderSpacing();
    const bars = [...container.querySelectorAll('.gallery-ruler__bar')];
    expect(bars.map((bar) => bar.getAttribute('data-pl'))).toEqual(SPACE_STEPS.map(String));
    for (const bar of bars) {
      expect(bar).toHaveClass('bit-box');
      expect(bar).toHaveAttribute('aria-hidden', 'true');
    }
    for (const step of SPACE_STEPS) expect(screen.getByText(`--bit-space-${step}px`)).toHaveClass('bit-code');
  });

  it('Stack or Box: each live example matches the code under it', async () => {
    const { container } = await renderSpacing();
    const stack = container.querySelector('.gallery-grid .bit-stack[data-direction="row"][data-gap="16"]')!;
    expect(within(stack as HTMLElement).getAllByText(/One|Two|Three/)).toHaveLength(3);
    const box = container.querySelector('.bit-box.gallery-outline')!;
    expect(box).toHaveAttribute('data-px', '24');
    expect(box).toHaveAttribute('data-py', '8');
    expect(box).toHaveTextContent('Banner');
    expect(screen.getByRole('region', { name: 'Stack example code' })).toHaveTextContent('<Stack direction="row" gap={16}>');
    expect(screen.getByRole('region', { name: 'Box example code' })).toHaveTextContent('<Box paddingX={24} paddingY={8}>');
  });

  it('the Box props table has a row for all sides, each axis and single sides, then the precedence note', async () => {
    await renderSpacing();
    const table = screen.getByRole('table', { name: 'Box props' });
    expect(within(table).getAllByRole('row')).toHaveLength(5);
    for (const example of ['padding={16}', 'paddingX={24}', 'marginY={32}', 'marginTop={48}']) {
      expect(within(table).getByText(example)).toHaveClass('bit-code');
    }
    expect(screen.getByText(/the most specific wins/)).toHaveTextContent(
      'When props overlap, the most specific wins: paddingTop beats paddingY, which beats padding.',
    );
  });

  it('uses no raw table, code, pre or heading tags: every one comes from a bit component', async () => {
    const { main } = await renderSpacing();
    for (const el of main.querySelectorAll('table, code, pre, h1, h2, h3, h4, h5, h6')) {
      expect(el.matches('.bit-table__table, .bit-code, .bit-code__pre, .bit-code__pre code, .bit-heading'), el.outerHTML).toBe(true);
    }
  });
});
```

In `apps/gallery/src/shell/Sidebar.test.tsx`, replace Task 3's `'Foundations lists the guide pages: Tokens, then Typography'` test with:

```tsx
  it('Foundations lists the guide pages: Tokens, Typography, then Spacing', () => {
    renderSidebar(NAV);
    expect(linksUnder('Foundations')).toEqual(['Tokens', 'Typography', 'Spacing']);
    expect(screen.getByRole('link', { name: 'Typography' })).toHaveAttribute('href', '/typography');
    expect(screen.getByRole('link', { name: 'Spacing' })).toHaveAttribute('href', '/spacing');
  });
```

In both `apps/gallery/src/routes.test.tsx` and `apps/gallery/src/routes.dark.test.tsx`, replace the `FOUNDATION_PAGES` line with:

```tsx
const FOUNDATION_PAGES = [
  ['/typography', 'Typography'],
  ['/spacing', 'Spacing'],
] as const;
```

In `apps/gallery/src/gallery-css.test.ts`, before Task 3's face test, add:

```ts
  it('the ruler bar is drawn in the accent, and its width comes only from Box padding', () => {
    const bar = /\.gallery-ruler__bar \{([^}]*)\}/.exec(galleryCss)![1]!;
    expect(bar).toContain('background: var(--bit-color-accent);');
    expect(bar).not.toMatch(/(^|\s)(width|padding)/);
    expect(galleryCss).toMatch(/\.bit-box\.gallery-outline \{\s*outline: 2px dashed var\(--bit-color-accent\);\s*\}/);
  });

```

- [ ] **Step 2: Run them and confirm they fail**

Run: `pnpm build && pnpm --filter @bit-ds/gallery test`
Expected: FAIL, `Tests  9 failed | 165 passed (174)`. The failures are:
- the five page tests and the two `/spacing` route smokes
- the sidebar test
- the ruler rule

- [ ] **Step 3: Write the page, route, sidebar entry and CSS**

Create `apps/gallery/src/pages/SpacingPage.tsx`:

```tsx
import {
  Badge,
  Box,
  Card,
  CardBody,
  Code,
  CodeBlock,
  Heading,
  SPACE_STEPS,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Text,
} from '@bit-ds/react';

const STACK_EXAMPLE = `<Stack direction="row" gap={16}>
  <Badge>One</Badge>
  <Badge>Two</Badge>
  <Badge>Three</Badge>
</Stack>`;

const BOX_EXAMPLE = `<Box paddingX={24} paddingY={8}>
  <Badge>Banner</Badge>
</Box>`;

const BOX_PROPS = [
  { props: 'padding · margin', sides: 'All four sides', example: 'padding={16}' },
  { props: 'paddingX · marginX', sides: 'Left and right', example: 'paddingX={24}' },
  { props: 'paddingY · marginY', sides: 'Top and bottom', example: 'marginY={32}' },
  { props: '…Top · …Right · …Bottom · …Left', sides: 'One side', example: 'marginTop={48}' },
] as const;

/** Each bar is a Box with paddingLeft set to the step and no content, so the scale draws itself. */
function Ruler() {
  return (
    <Card>
      <CardBody>
        <Stack gap={8}>
          {SPACE_STEPS.map((step) => (
            <Box key={step} className="gallery-ruler">
              <Text as="span" size={13} color="neutral">
                {step}
              </Text>
              <Box paddingLeft={step} className="gallery-ruler__bar" aria-hidden="true" />
              <Code>{`--bit-space-${step}px`}</Code>
            </Box>
          ))}
        </Stack>
      </CardBody>
    </Card>
  );
}

function StackOrBox() {
  return (
    <Box className="gallery-grid">
      <Card>
        <CardBody>
          <Stack gap={12}>
            <Heading level={3} size={4}>
              Stack: space between things
            </Heading>
            <Stack direction="row" gap={16}>
              <Badge>One</Badge>
              <Badge>Two</Badge>
              <Badge>Three</Badge>
            </Stack>
            <CodeBlock code={STACK_EXAMPLE} language="jsx" label="Stack example code" />
          </Stack>
        </CardBody>
      </Card>
      <Card>
        <CardBody>
          <Stack gap={12}>
            <Heading level={3} size={4}>
              Box: space around one thing
            </Heading>
            {/* A row, so the Box hugs its Badge instead of stretching across the card. */}
            <Stack direction="row">
              <Box paddingX={24} paddingY={8} className="gallery-outline">
                <Badge>Banner</Badge>
              </Box>
            </Stack>
            <CodeBlock code={BOX_EXAMPLE} language="jsx" label="Box example code" />
          </Stack>
        </CardBody>
      </Card>
    </Box>
  );
}

function BoxProps() {
  return (
    <Table aria-label="Box props">
      <TableHead>
        <TableRow>
          <TableCell>Props</TableCell>
          <TableCell>Sides</TableCell>
          <TableCell>Example</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {BOX_PROPS.map(({ props, sides, example }) => (
          <TableRow key={props}>
            <TableCell>
              <Text weight="bold">{props}</Text>
            </TableCell>
            <TableCell>
              <Text size={13} color="neutral">
                {sides}
              </Text>
            </TableCell>
            <TableCell>
              <Code>{example}</Code>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** Foundations: the space scale, when to reach for Stack or Box, and Box's props. Built only from bit components. */
export function SpacingPage() {
  return (
    <Stack gap={32}>
      <Stack gap={8}>
        <Heading level={1}>Spacing</Heading>
        <Text size={18}>
          One scale for every gap, pad and margin: 4, 8, 12, 16, 24, 32, 48 and 64. <Code>Stack</Code> spaces things
          apart, and <Code>Box</Code> pads and offsets a single thing.
        </Text>
      </Stack>
      <Stack gap={12}>
        <Heading level={2}>The scale</Heading>
        <Ruler />
      </Stack>
      <Stack gap={12}>
        <Heading level={2}>Stack or Box?</Heading>
        <StackOrBox />
      </Stack>
      <Stack gap={12}>
        <Heading level={2}>Box props</Heading>
        <BoxProps />
        <Text size={13} color="neutral">
          When props overlap, the most specific wins: <Code>paddingTop</Code> beats <Code>paddingY</Code>, which beats{' '}
          <Code>padding</Code>.
        </Text>
      </Stack>
    </Stack>
  );
}
```

In `apps/gallery/src/router.tsx`:
- After the `TypographyPage` lazy line, add:

  ```tsx
  const SpacingPage = lazy(() => import('./pages/SpacingPage').then((m) => ({ default: m.SpacingPage })));
  ```

- After the `typography` route, add:

  ```tsx
          { path: 'spacing', element: lazyPage(<SpacingPage />) },
  ```

In `apps/gallery/src/shell/Sidebar.tsx`, after the Typography entry, add:

```tsx
  { group: 'Foundations', label: 'Spacing', to: '/spacing' },
```

At the end of `apps/gallery/src/gallery.css`, append:

```css

/* One row of the Spacing page's ruler: the step, its bar (the 64px bar fits in 5rem), its token. */
.gallery-ruler {
  display: grid;
  grid-template-columns: 3rem 5rem minmax(0, 1fr);
  justify-items: start;
  align-items: center;
  gap: var(--bit-space-12px);
}

/* The bar is a Box with paddingLeft set to the step and no content, so its width is the step's token. */
.gallery-ruler__bar {
  height: var(--bit-space-12px);
  background: var(--bit-color-accent);
}

/* The Spacing page's live Box gets the preview stage's outline, so its padding shows. */
.bit-box.gallery-outline {
  outline: 2px dashed var(--bit-color-accent);
}
```

`justify-items: start` keeps each bar at its padding width and stops each token chip stretching across its column.

- [ ] **Step 4: Run the gallery tests and confirm they pass**

Run: `pnpm --filter @bit-ds/gallery test`
Expected: PASS, `Tests  174 passed (174)`.

- [ ] **Step 5: Run every gate**

Run: `pnpm build && pnpm verify && pnpm typecheck && pnpm lint && pnpm test && pnpm test:coverage && pnpm smoke && pnpm storybook:build`
Expected:
- `dist OK: 27 components`
- core `455`, react `403`, gallery `174` passed
- coverage `100%`
- `consumer OK: 27 components`
- `Storybook build completed successfully`

- [ ] **Step 6: Commit**

```bash
git add apps/gallery/src
git commit -m "feat(gallery): Spacing guide page with a ruler drawn by Box, Stack or Box, and Box's props

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: README and CONTRIBUTING, and the full gate run

The exports and the 27-name lists already landed in Tasks 1 and 2 (decision 1). This task brings the docs up to date and proves the whole branch once more from a clean build.

**Files:**
- Modify: `README.md:63` (the Layout and type line) and `README.md:71` (the notes list under Components)
- Modify: `CONTRIBUTING.md:13` (before the class-contract paragraph) and `CONTRIBUTING.md:35` (Conventions)

**Interfaces:**
- Consumes the 27 public components from Tasks 1 and 2, and the routes and `FOUNDATION_PAGES` from Tasks 3 and 4.

- [ ] **Step 1: Update the README**

In `README.md`, replace `- **Layout and type:** Card (+ CardHeader, CardBody, CardFooter), Stack, Text` with:

```markdown
- **Layout and type:** Card (+ CardHeader, CardBody, CardFooter), Stack, Box, Text, Heading
```

Before ``- `Switch` carries its own label; don't wrap it in `Field`.``, add:

```markdown
- `Heading` takes a required `level` (the tag, h1 to h6) and an optional `size` (the look), so an h2 can look like an h3.
- `Box` pads and offsets one element on the space scale (`padding`, `paddingX`, `paddingTop`, … and the same for `margin`). When props overlap, the most specific wins: `paddingTop` beats `paddingY`, which beats `padding`. Use `Stack` for space between things.
```

- [ ] **Step 2: Update CONTRIBUTING**

In `CONTRIBUTING.md`, before `The class-contract test checks that …`, add:

```markdown
A guide page under Foundations (Typography, Spacing) is a route in `apps/gallery/src/router.tsx`, an entry in `NAV` in `apps/gallery/src/shell/Sidebar.tsx`, and a row in `FOUNDATION_PAGES` in `routes.test.tsx` and `routes.dark.test.tsx`. Build it only from bit components; anything the gallery alone needs goes in `gallery.css` and reads only `--bit-*` tokens.

```

In the Conventions list, replace `- Booleans are attributes, never classes.` with:

```markdown
- Booleans are attributes, never classes. So are layout values that aren't design axes: Stack's `gap`, Text's `size`, Heading's `data-level`, Box's `data-p` and friends. bit has no utility classes.
```

- [ ] **Step 3: Run every gate from a clean build**

`pnpm build` starts clean on its own: tsup has `clean: true`, and `vite build` empties `apps/gallery/dist`. No `rm` is needed.

Run: `pnpm build && pnpm verify && pnpm typecheck && pnpm lint && pnpm test && pnpm test:coverage && pnpm smoke && pnpm storybook:build && pnpm gallery:build`
Expected:
- `dist OK: 27 components`
- core `455`, react `403`, gallery `174` passed
- coverage Statements, Branches, Functions and Lines all `100%`
- `consumer OK: 27 components via ESM and CJS, CSS present, types check`
- `Storybook build completed successfully`
- the gallery builds (`✓ built in …`)

- [ ] **Step 4: Commit**

```bash
git add README.md CONTRIBUTING.md
git commit -m "docs: README lists Heading and Box (27 components); CONTRIBUTING covers guide pages and layout data attributes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Screenshot board for the owner's sign-off (no repo changes)

**Files:**
- Create (outside the repo):
  - The PNGs, under `/private/tmp/bit-foundations-board/`. The browse CLI writes only under `/private/tmp`.
  - `~/.gstack/projects/doosemavis-bit-design-system/designs/foundations-20261003/final/board.html`, with the PNGs copied beside it.

**Interfaces:**
- Consumes the built gallery from Task 5 (`pnpm gallery:build`, output in `apps/gallery/dist`).

Use the gstack browse CLI at `~/.claude/skills/gstack/browse/dist/browse`. Never use `mcp__claude-in-chrome__*`.

- [ ] **Step 1: Serve the built gallery**

Run, in the background, from `apps/gallery`: `npx vite preview --base /bit-design-system/`
Expected: `Local: http://localhost:4173/bit-design-system/`. Every URL below starts with `http://localhost:4173/bit-design-system/#`.

- [ ] **Step 2: Set the mode, then reload**

A hash `goto` doesn't reload the page, so the stored mode would not apply. Set it, then reload, then check it:

```bash
B=~/.claude/skills/gstack/browse/dist/browse
mkdir -p /private/tmp/bit-foundations-board
$B viewport 1280x1400
$B goto "http://localhost:4173/bit-design-system/#/"
$B js "localStorage.setItem('bit-color-mode','light')"   # 'dark' for the second pass
$B js "location.reload()"
$B js "document.documentElement.dataset.mode"            # prints light (then dark)
```

- [ ] **Step 3: Capture both pages and both component pages**

Pages are lazy, and `--networkidle` can fire while "Loading…" still shows. So after each `goto`, run `$B wait ".gallery-main > .bit-stack"`. Don't wait on `main h1`: it matches two elements on `/typography`.

For each mode (light, then dark), and each route below, run:
1. `$B goto "<url>"`
2. the wait above
3. `$B screenshot --clip 240,60,1040,<h> /private/tmp/bit-foundations-board/<mode>-<name>.png`

The routes:
- `/typography` and `/spacing`, at `<h>` = 1340
- at `<h>` = 700:
  - `/components/heading`
  - `/components/heading?size=3` (the preset: an h2 that looks like an h3)
  - `/components/heading?level=6`
  - `/components/box`
  - `/components/box?padding=none&paddingX=24&paddingY=8`
  - `/components/box?paddingY=0` (Y beats padding)
  - `/components/box?marginTop=32`

Then, in light only, run `$B viewport 390x1400` and take full-page screenshots of `/typography` and `/spacing` (no `--clip`).

- [ ] **Step 4: Read the precedence back from a real browser**

On any page, run:

```bash
$B js "(() => { const d=document.createElement('div'); d.className='bit-box'; d.setAttribute('data-p','16'); d.setAttribute('data-py','0'); d.setAttribute('data-pt','48'); d.setAttribute('data-mx','8'); d.setAttribute('data-ml','64'); document.body.prepend(d); const s=getComputedStyle(d); const r=[s.paddingTop,s.paddingBottom,s.paddingLeft,s.marginLeft,s.marginRight].join(' '); const h=document.createElement('h3'); h.className='bit-heading'; h.setAttribute('data-level','4'); document.body.prepend(h); const t=getComputedStyle(h); return r+' | '+[t.fontSize,t.fontWeight,t.letterSpacing,t.lineHeight].join(' '); })()"
```

Expected: `48px 0px 16px 64px 8px | 15px 800 normal 19.5px`.
- The side beats the axis beats all four, for padding and for margin.
- An h3 that looks like an h4 has no display tracking (Review Focus 1).

- [ ] **Step 5: Assemble `final/board.html`**

```bash
mkdir -p ~/.gstack/projects/doosemavis-bit-design-system/designs/foundations-20261003/final
cp /private/tmp/bit-foundations-board/*.png ~/.gstack/projects/doosemavis-bit-design-system/designs/foundations-20261003/final/
```

Write `board.html` beside them:
- **Layout:** a two-column grid, light on the left and dark on the right, one row per page or state, each with a caption. The two narrow shots go last.
- **The top of the page:**
  - the Step 4 output
  - decisions 6 to 14 from this plan, the ones the owner sees
  - the four owner notes
  - anything that looks wrong:
    - a face sample in the wrong font
    - a heading sample that isn't its level's look
    - a ruler bar wider or narrower than its number
    - a token chip stretched across its column
    - an outline that isn't violet in light and yellow in dark
    - a CodeBlock border that isn't the accent
    - Do and Don't that aren't green and red soft fills

- [ ] **Step 6: Stop the server and report**

Run `$B stop` and stop the preview server. Report the board path and every problem you saw. No commit.

---

## Self-review (run 2026-10-03)

**1. Spec coverage**

| Spec requirement | Where |
|---|---|
| Decision 1: today's type scale, no new tokens | Task 1 CSS reads only existing tokens; the per-file token test |
| Decision 2: Box covers four sides plus X and Y, padding and margin | Task 2: 14 attributes in CSS, React and tests |
| Decision 3: Typography and Spacing under Foundations; Heading and Box component pages | Tasks 1–4; the sidebar test in Task 4 |
| §1 Heading props, markup, ref, `className`, rest, `dropLegacyColor` | Task 1 React tests |
| §1 an unknown `level` or `size` drops with a warning; `level` falls back to h2 | Task 1: the unknown level, level-plus-size, unknown size and missing level tests |
| §1 `heading.css`: margin 0, text color, the level table, display weight 400, the base is the h2 look | Task 1 core tests |
| §2 Box props, `as`, markup, attribute names | Task 2 React tests (each of the 14, `as`, the defaults) |
| §2 values through `dataValue`, `0` emits `"0"`, an invalid value drops with a warning | Task 2 React tests |
| §2 `box.css`: no base rule, 14 × 9 rules, `0` sets 0, three tiers in order, physical properties, only padding and margin | Task 2 core tests |
| §3 Heading manifest: `level` (numeric, `alwaysPrint`), `size` (none or 1–6), `children`, the preset | Task 1 manifest, and its toJsx test |
| §3 Box manifest: five numeric selects plus `as`, a Badge child, the dashed accent outline in `gallery.css` | Task 2 manifest, the toJsx test and the CSS test |
| §3 `/typography` and `/spacing`, sidebar order Tokens, Typography, Spacing | Tasks 3 and 4 (router, `NAV`, the sidebar test) |
| §3 the Typography content: faces, heading levels Table, Text sizes, Do and Don't | Task 3 page tests |
| §3 the Spacing content: ruler, Stack or Box with CodeBlocks, Box props Table, precedence note | Task 4 page tests |
| §3 built only from bit components; layouts follow `board-2.html` | the "no raw tags" test in Tasks 3 and 4; Task 6 board |
| §3 Tokens page unchanged | not touched |
| §4 React 100% coverage, axe on all six levels and on Box | Tasks 1 and 2, Step 8 |
| §4 core: tokens read, no outline (per-file loops), level table, 14 × 9, tier order, padding and margin only | Tasks 1 and 2 core tests; `system.test.ts` loops |
| §4 gallery: manifest contract, axe on `/typography`, `/spacing`, `/components/heading` and `/components/box` | `manifests.test.ts`; `routes.test.tsx` (`MANIFESTS` and `FOUNDATION_PAGES`), also in dark |
| §4 by eye: a board in light and dark | Task 6 |
| Done: 27 components, every gate | Tasks 2 and 5 |

No gaps.

**2. Placeholder scan:** no "TBD", "TODO", "similar to Task N" or code-less code steps. Every new file is given in full. Every edit names its anchor line and gives the exact text.

**3. Type consistency:**
- `HeadingLevel` is exported in Task 1 and used by `TypographyPage` in Task 3.
- `BoxProps` and `BoxElement` are exported in Task 2. The manifest's `as` values match `ELEMENTS` in `Box.tsx`.
- The manifest names `heading` and `box` are the same in `index.ts` and `manifests.test.ts`.
- `FOUNDATION_PAGES` has the same shape (`readonly [path, h1][]`) in both route files, Tasks 3 and 4.
- The gallery classes are the same in CSS, pages and tests: `.gallery-grid`, `.gallery-face[data-face]`, `.gallery-ruler`, `.gallery-ruler__bar` and `.bit-box.gallery-outline`.
- The CodeBlock labels `Stack example code` and `Box example code` are the same on the page and in its test.

**4. Review Focus:** five items, each pinned to a named test in its owning task (Tasks 1, 1, 2, 2 and 3).
- Also checked and covered by tests, but not in the five:
  - number-like string values (`level={'4'}`, `margin={'0'}`) in Tasks 1 and 2
  - `0` printing as `0` in the gallery code, Task 2
  - unique region names for the two jsx CodeBlocks, Task 4 (axe and the label test)
- The 390px header overflow predates this work. It is an owner note, not a task.
