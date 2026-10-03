# Logo Wordmark Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace BitLogo's cycling era number with a stacked "bit / DESIGN SYSTEM" wordmark whose era style advances once per page load.

**Architecture:**
- **Core:** `@bit-ds/core` owns the look. `components/logo.css` styles a word and a caption per `data-era`. The theme drops the power-up motion token and swaps the Bungee font for Audiowide.
- **React:** `@bit-ds/react` owns the behavior. A tiny module-level store (`logo/logoEra.ts`) picks the era once per page load from `localStorage`, read through `useSyncExternalStore`. `BitLogo` renders the word and the caption.
- **Gallery and README:** the gallery manifest, its tests, Storybook and the README SVG follow the new API.

**Tech Stack:** pnpm 9 monorepo, React 19, TypeScript, tsup, Vitest + Testing Library + jsdom, Vite gallery, Node scripts.

**Spec:** `docs/superpowers/specs/2026-10-03-logo-wordmark-design.md`

## Global Constraints

- **API:** `BitLogoProps = Omit<HTMLAttributes<HTMLSpanElement>, 'color'> & { size?: Size; era?: Era }`.
  - `interval`, `animated` and `freeze` no longer exist.
- **Exports:** `ERAS = [8, 16, 32, 64] as const`, `type Era`, `LOGO_ERA_STORAGE_KEY = 'bit-logo-era'`.
  - All three are exported from `@bit-ds/react`.
  - `resetLogoEra` and `currentPageEra` are **not** exported from the package index.
- **Accessible name:** `aria-label="bit Design System"`. The word `bit` and the caption `Design System` are both `aria-hidden="true"`.
- **Rotation:** 8 → 16 → 32 → 64 → 8, advanced once per page load.
  - A missing or invalid stored value gives `8`.
  - Blocked storage, no `window`, or a server render gives `64`.
  - A pinned `era` neither reads nor writes storage.
- **Sizes:** the root `font-size` is `var(--bit-text-32px)` for `sm`, `calc(var(--bit-text-32px) * 1.5)` for `md`, and `calc(var(--bit-text-32px) * 2.25)` for `lg`.
- **Era word sizes:** `0.82em` for 8 and 16, `1em` for 32, `1.04em` for 64.
- **Caption:** `0.25em`, pixel font, uppercase, `letter-spacing: 0.18em`, `var(--bit-color-text-muted)`.
- **32-bit font:** `"Audiowide", var(--bit-font-display)`. Bungee is gone from `packages/`, `scripts/` and `package.json`.
- **No motion:** no `animation`, `@keyframes` or `transform` in `logo.css`. `@keyframes bit-power-up` and `--bit-motion-power-up` are deleted, so `SEMANTIC_TOKENS` has 86 names.
- **Commits:** conventional (`feat:`, `fix:`, `test:`, `chore:`, `docs:`), each ending with the single trailer line `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Gates (all must stay green):**
  - `pnpm build`, `pnpm verify`, `pnpm typecheck`, `pnpm lint`
  - `pnpm test` (core, react, gallery)
  - `pnpm test:coverage` (react, 100%)
  - `pnpm smoke`, `pnpm storybook:build`

## Review Focus

1. **React StrictMode double render:** the era must not advance twice in one page load. It's covered by a Task 2 test that renders inside `<StrictMode>`.
2. **Two logos on one page** (the gallery header plus Home) must match. Covered by a Task 2 test.
3. **Reading works but writing throws** (quota or Safari private mode): it must give 64 and not throw. Covered by a Task 2 test where `setItem` throws.
4. **A pinned `era` on the gallery Logo page** must not consume a rotation step, so the header still advances normally on the next load. Covered by a Task 2 test.
5. **`text-transform` in the caption** must not trip the no-`transform` guard. Covered by the Task 1 regex, which needs a declaration start before `transform`.

---

### Task 1: Core: wordmark CSS, no power-up motion, Audiowide

**Files:**
- Modify: `packages/core/src/components/logo.css` (full rewrite)
- Modify: `packages/core/src/system/motion.css:1-15` (delete `bit-power-up`)
- Modify: `packages/core/src/themes/power-up.css:6` (font import), `:139` (delete token line)
- Modify: `packages/core/src/tokens.ts:68` (delete `token('motion', 'power-up')`)
- Modify: `packages/react/scripts/verify-dist.mjs:52` (needle)
- Test: `packages/core/src/__tests__/system.test.ts`, `packages/core/src/__tests__/tokens.test.ts`

**Interfaces:**
- Produces, for Task 2, the classes and attributes:
  - root `.bit-logo` + size class `.bit-sm|.bit-md|.bit-lg`
  - attribute `data-era="8|16|32|64"` on the root
  - children `.bit-logo__word` and `.bit-logo__caption`

- [ ] **Step 1: Write the failing tests**

In `packages/core/src/__tests__/tokens.test.ts`:
- Change the count test to 86.
- Remove `'--bit-motion-power-up'` from the expected motion list.
- Add an assertion:

```ts
  it('contains exactly 86 unique names, all prefixed --bit-', () => {
    expect(SEMANTIC_TOKENS).toHaveLength(86);
    expect(new Set(SEMANTIC_TOKENS).size).toBe(86);
```
(Keep the rest of that test unchanged. Only the two numbers and the title change.)

```ts
      '--bit-press-offset', '--bit-duration-fast', '--bit-duration-normal',
    ];
    for (const name of expected) expect(SEMANTIC_TOKENS).toContain(name);
    expect(SEMANTIC_TOKENS).not.toContain('--bit-motion-power-up');
```

In `packages/core/src/__tests__/system.test.ts`, replace the `system/motion.css` describe with:

```ts
describe('system/motion.css', () => {
  const css = readCss('system/motion.css');
  it('defines the spin keyframes and no power-up grow (the logo no longer levels up)', () => {
    expect(css).toMatch(/@keyframes bit-spin\s*\{/);
    expect(css).not.toContain('bit-power-up');
  });
});
```

Replace the `components/logo.css` describe with:

```ts
describe('components/logo.css', () => {
  const css = readCss('components/logo.css');
  const word = (era: number) => block(css, `.bit-logo[data-era="${era}"] .bit-logo__word`);

  it('the eras read the logo coin tokens, never primary or warning, so the palette swap leaves the logo gold', () => {
    expect(css).not.toMatch(/--bit-color-(primary|warning)/);
    for (const name of ['--bit-logo-coin', '--bit-logo-coin-light', '--bit-logo-coin-shade', '--bit-logo-coin-deep']) {
      expect(css).toContain(`var(${name})`);
    }
  });

  it('the wordmark reads the text color, so it stays visible on a dark page', () => {
    expect(block(css, '.bit-logo')).toContain('color: var(--bit-color-text);');
  });

  it('era outlines read line and era shadows read shadow, never ink', () => {
    expect(css).not.toContain('var(--bit-color-ink)');
  });

  it('nothing moves: no animation, keyframes, or transform declarations', () => {
    expect(css).not.toMatch(/(?<![-\w])animation(-[a-z]+)?\s*:/);
    expect(css).not.toContain('@keyframes');
    expect(css).not.toMatch(/(?<![-\w])transform\s*:/);
    expect(css).not.toContain('data-animated');
  });

  it('stacks the word over the caption, left-aligned', () => {
    const root = block(css, '.bit-logo')!;
    expect(root).toContain('display: inline-flex;');
    expect(root).toContain('flex-direction: column;');
    expect(root).toContain('align-items: flex-start;');
  });

  it('sizes the mark from the 32px type step', () => {
    expect(block(css, '.bit-logo.bit-sm')).toContain('font-size: var(--bit-text-32px);');
    expect(block(css, '.bit-logo.bit-md')).toContain('font-size: calc(var(--bit-text-32px) * 1.5);');
    expect(block(css, '.bit-logo.bit-lg')).toContain('font-size: calc(var(--bit-text-32px) * 2.25);');
  });

  it('draws each era on the word, with the agreed sizes', () => {
    expect(word(8)).toContain('font-size: 0.82em;');
    expect(word(16)).toContain('font-size: 0.82em;');
    expect(word(32)).toContain('font-size: 1em;');
    expect(word(64)).toContain('font-size: 1.04em;');
  });

  it('32-bit uses Audiowide (lowercase), never the caps-only Bungee', () => {
    expect(word(32)).toContain('font-family: "Audiowide", var(--bit-font-display);');
    expect(css).not.toContain('Bungee');
  });

  it('the caption is small muted pixel type in capitals', () => {
    const caption = block(css, '.bit-logo__caption')!;
    for (const line of [
      'font-family: var(--bit-font-pixel);',
      'font-size: 0.25em;',
      'letter-spacing: 0.18em;',
      'text-transform: uppercase;',
      'color: var(--bit-color-text-muted);',
      'white-space: nowrap;',
    ]) {
      expect(caption).toContain(line);
    }
  });
});

describe('themes/power-up.css (logo)', () => {
  const css = readCss('themes/power-up.css');
  it('loads Audiowide instead of Bungee and drops the power-up motion token', () => {
    expect(css).toContain('family=Audiowide');
    expect(css).not.toContain('Bungee');
    expect(css).not.toContain('--bit-motion-power-up');
  });
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `pnpm --filter @bit-ds/core test`
Expected: FAIL, because of the token count (87), the motion test, every new logo test, and the theme test.

- [ ] **Step 3: Implement**

Replace `packages/core/src/components/logo.css` with:

```css
/* Exempt from --_bit-size-* and --bit-border-width: the logo is not a control, so it scales from
   the type scale directly rather than the control size scale, and has no border. */
/* BitLogo: "bit" over a small "DESIGN SYSTEM" caption. The word is drawn in one era's style, chosen
   by data-era on the root (8, 16, 32 or 64). Nothing moves; the era changes between page loads. */
.bit-logo {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.18em;
  line-height: 1;
  white-space: nowrap;
  color: var(--bit-color-text);
}

.bit-logo.bit-sm { font-size: var(--bit-text-32px); }
.bit-logo.bit-md { font-size: calc(var(--bit-text-32px) * 1.5); }
.bit-logo.bit-lg { font-size: calc(var(--bit-text-32px) * 2.25); }

.bit-logo__word {
  line-height: 1;
}

/* The caption stays the same in every era. 0.25em of the root: 8px at sm, 12px at md, 18px at lg. */
.bit-logo__caption {
  font-family: var(--bit-font-pixel);
  font-size: 0.25em;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--bit-color-text-muted);
  line-height: 1;
  white-space: nowrap;
}

/* ---------- era treatments (a theme may override any of these by selector) ---------- */

/* 8-bit: flat pixel type, one color */
.bit-logo[data-era="8"] .bit-logo__word {
  font-family: var(--bit-font-pixel);
  font-size: 0.82em;
  color: var(--bit-color-danger);
}

/* 16-bit: pixel type with three-band shading and a hard drop */
.bit-logo[data-era="16"] .bit-logo__word {
  font-family: var(--bit-font-pixel);
  font-size: 0.82em;
  background: linear-gradient(
    180deg,
    var(--bit-logo-coin-light) 0 34%,
    var(--bit-logo-coin) 34% 67%,
    var(--bit-logo-coin-deep) 67% 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(2px 2px 0 var(--bit-color-shadow));
}

/* 32-bit: chrome gradient with a bevel. Audiowide has a real lowercase (Bungee was capitals only).
   The chrome is era-specific, so it is fixed rather than tokenized. */
.bit-logo[data-era="32"] .bit-logo__word {
  font-family: "Audiowide", var(--bit-font-display);
  font-size: 1em;
  letter-spacing: 0.02em;
  background: linear-gradient(180deg, #ffffff 0%, #c9d8f0 38%, #3b5b8c 50%, #9db4d6 58%, #4e6fa3 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(1px 1px 0 #ffffff) drop-shadow(3px 3px 0 var(--bit-color-shadow));
}

/* 64-bit: rounded display type, extruded */
.bit-logo[data-era="64"] .bit-logo__word {
  font-family: var(--bit-font-display);
  font-size: 1.04em;
  color: var(--bit-logo-coin);
  -webkit-text-stroke: 1.5px var(--bit-color-line);
  paint-order: stroke fill;
  text-shadow:
    1px 1px 0 var(--bit-logo-coin-shade),
    2px 2px 0 var(--bit-logo-coin-shade),
    3px 3px 0 var(--bit-logo-coin-shade),
    4px 4px 0 var(--bit-logo-coin-shade),
    5px 5px 0 var(--bit-color-shadow),
    6px 6px 0 var(--bit-color-shadow);
}
```

In `packages/core/src/system/motion.css`, delete the `bit-power-up` comment (the first three lines) and the whole `@keyframes bit-power-up { … }` block. `@keyframes bit-spin` and the `prefers-reduced-motion` block stay exactly as they are.

In `packages/core/src/themes/power-up.css`:
- Line 6: change `&family=Bungee&` to `&family=Audiowide&`. Nothing else in the URL changes.
- Delete the line `  --bit-motion-power-up: bit-power-up;`.

In `packages/core/src/tokens.ts`, delete the line `  token('motion', 'power-up'),` from `motionTokens`.

In `packages/react/scripts/verify-dist.mjs` line 52, replace the needle `'@keyframes bit-power-up'` with `'.bit-logo__caption'`.

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `pnpm --filter @bit-ds/core test && pnpm build && pnpm verify`
Expected: all core tests pass, and verify prints `dist OK`.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src packages/react/scripts/verify-dist.mjs
git commit -m "feat(core): stacked wordmark styles, Audiowide 32-bit, drop the power-up grow

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: React: page-load era store and the new BitLogo

**Files:**
- Create: `packages/react/src/logo/logoEra.ts`
- Create: `packages/react/src/logo/logoEra.node.test.ts`
- Modify: `packages/react/src/logo/BitLogo.tsx` (full rewrite)
- Modify: `packages/react/src/logo/BitLogo.test.tsx` (full rewrite)
- Modify: `packages/react/src/logo/BitLogo.stories.tsx` (full rewrite)
- Modify: `packages/react/src/index.ts:29-30`

**Interfaces:**
- Consumes: the Task 1 classes and attributes (`.bit-logo__word`, `.bit-logo__caption`, `data-era` on the root).
- Produces, for Task 3:
  - `BitLogo` with props `size?: Size` and `era?: Era`
  - `ERAS`, `Era` and `LOGO_ERA_STORAGE_KEY`, exported from `@bit-ds/react`

- [ ] **Step 1: Write the failing tests**

Replace `packages/react/src/logo/BitLogo.test.tsx` with:

```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StrictMode, createRef } from 'react';
import { renderToString } from 'react-dom/server';
import { BitLogo } from './BitLogo';
import { LOGO_ERA_STORAGE_KEY, resetLogoEra } from './logoEra';
import { expectNoA11yViolations } from '../test/a11y';

const logo = () => screen.getByRole('img', { name: 'bit Design System' });
const stored = () => localStorage.getItem(LOGO_ERA_STORAGE_KEY);

beforeEach(() => {
  localStorage.clear();
  resetLogoEra();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('BitLogo', () => {
  it('renders "bit" over "Design System" as one image named "bit Design System"', () => {
    render(<BitLogo />);
    const root = logo();
    expect(root.className).toBe('bit-logo bit-md');
    const word = root.querySelector('.bit-logo__word');
    const caption = root.querySelector('.bit-logo__caption');
    expect(word).toHaveTextContent(/^bit$/);
    expect(caption).toHaveTextContent(/^Design System$/);
    expect(word).toHaveAttribute('aria-hidden', 'true');
    expect(caption).toHaveAttribute('aria-hidden', 'true');
    expect(root.children).toHaveLength(2);
  });

  it.each([
    [null, '8'],
    ['8', '16'],
    ['16', '32'],
    ['32', '64'],
    ['64', '8'],
    ['banana', '8'],
    ['0', '8'],
  ])('after a page load that stored %s, shows and stores era %s', (previous, expected) => {
    if (previous !== null) localStorage.setItem(LOGO_ERA_STORAGE_KEY, previous);
    render(<BitLogo />);
    expect(logo()).toHaveAttribute('data-era', expected);
    expect(stored()).toBe(expected);
  });

  it('every logo on the page shares one era, and later renders do not advance it', () => {
    localStorage.setItem(LOGO_ERA_STORAGE_KEY, '16');
    render(
      <>
        <BitLogo size="sm" />
        <BitLogo size="lg" />
      </>,
    );
    render(<BitLogo />);
    const eras = screen.getAllByRole('img').map((el) => el.getAttribute('data-era'));
    expect(eras).toEqual(['32', '32', '32']);
    expect(stored()).toBe('32');
  });

  it('StrictMode double rendering advances the era only once', () => {
    render(
      <StrictMode>
        <BitLogo />
      </StrictMode>,
    );
    expect(logo()).toHaveAttribute('data-era', '8');
    expect(stored()).toBe('8');
  });

  it('a pinned era shows that era and leaves the rotation alone', () => {
    localStorage.setItem(LOGO_ERA_STORAGE_KEY, '8');
    const { unmount } = render(<BitLogo era={32} />);
    expect(logo()).toHaveAttribute('data-era', '32');
    expect(stored()).toBe('8');
    unmount();
    render(<BitLogo />);
    expect(logo()).toHaveAttribute('data-era', '16');
  });

  it('shows 64-bit and does not throw when storage is blocked', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    });
    expect(() => render(<BitLogo />)).not.toThrow();
    expect(logo()).toHaveAttribute('data-era', '64');
  });

  it('shows 64-bit when reading works but writing throws (quota, private mode)', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => '8',
      setItem: () => {
        throw new Error('quota');
      },
    });
    render(<BitLogo />);
    expect(logo()).toHaveAttribute('data-era', '64');
  });

  it('renders 64-bit on the server, or the pinned era', () => {
    expect(renderToString(<BitLogo />)).toContain('data-era="64"');
    expect(renderToString(<BitLogo era={16} />)).toContain('data-era="16"');
    expect(stored()).toBeNull();
  });

  it('maps size, appends className last, and passes style and ref through', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<BitLogo ref={ref} size="lg" className="extra" style={{ marginTop: 4 }} />);
    const root = logo();
    expect(root.className).toBe('bit-logo bit-lg extra');
    expect(root.style.marginTop).toBe('4px');
    expect(ref.current).toBe(root);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<BitLogo />);
    await expectNoA11yViolations(container);
  });

  it('rejects the legacy DOM color attribute and does not render it', () => {
    render(
      // @ts-expect-error color is not part of BitLogoProps
      <BitLogo color="danger" />,
    );
    expect(logo()).not.toHaveAttribute('color');
  });

  it('no longer accepts the old cycle props', () => {
    render(
      <>
        {/* @ts-expect-error interval was removed: nothing animates */}
        <BitLogo interval={5} />
        {/* @ts-expect-error freeze was renamed to era */}
        <BitLogo freeze={32} />
      </>,
    );
    expect(screen.getAllByRole('img')).toHaveLength(2);
  });
});
```

Create `packages/react/src/logo/logoEra.node.test.ts`:

```ts
// @vitest-environment node

import { describe, expect, it } from 'vitest';
import { currentPageEra } from './logoEra';

describe('logo era without a window (SSR, node)', () => {
  it('is the still era, 64', () => {
    expect(currentPageEra()).toBe(64);
  });
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `pnpm --filter @bit-ds/react test -- src/logo`
Expected: FAIL. `./logoEra` does not exist yet, and BitLogo still renders the old markup.

- [ ] **Step 3: Implement**

Create `packages/react/src/logo/logoEra.ts`:

```ts
import { useSyncExternalStore } from 'react';

/** The console eras the wordmark is drawn in, in the order page loads step through them. */
export const ERAS = [8, 16, 32, 64] as const;
export type Era = (typeof ERAS)[number];

/** Where the last page load's era is remembered, so the next load can show the one after it. */
export const LOGO_ERA_STORAGE_KEY = 'bit-logo-era';

/** Shown wherever the rotation can't run: server render, no window, blocked storage. */
const STILL_ERA: Era = 64;

/** The era after `previous`, wrapping 64 → 8. A missing or unknown value starts the sequence at 8. */
function nextEra(previous: string | null): Era {
  const index = ERAS.findIndex((era) => String(era) === previous);
  return index === -1 ? ERAS[0] : ERAS[(index + 1) % ERAS.length]!;
}

function advance(): Era {
  if (typeof window === 'undefined') return STILL_ERA;
  try {
    const era = nextEra(window.localStorage.getItem(LOGO_ERA_STORAGE_KEY));
    window.localStorage.setItem(LOGO_ERA_STORAGE_KEY, String(era));
    return era;
  } catch {
    // Storage is blocked (private browsing, disabled cookies, quota): no rotation, show the still era.
    return STILL_ERA;
  }
}

// One era per page load, shared by every logo on the page. This cached value is the one intentional
// piece of mutable state here; it is computed on first read and never changes until the next load.
let pageEra: Era | null = null;

/** The era for this page load. The first call advances the stored rotation; later calls reuse it. */
export function currentPageEra(): Era {
  if (pageEra === null) pageEra = advance();
  return pageEra;
}

/** Tests only: forget this page load's era, as if the page reloaded. Not exported from the package. */
export function resetLogoEra(): void {
  pageEra = null;
}

// The era never changes during a page load, so there is nothing to subscribe to.
const subscribe = () => () => {};

/** The pinned era, or this page load's era. A pinned era never touches storage. */
export function useLogoEra(pinned?: Era): Era {
  return useSyncExternalStore(
    subscribe,
    pinned === undefined ? currentPageEra : () => pinned,
    () => pinned ?? STILL_ERA,
  );
}
```

Replace `packages/react/src/logo/BitLogo.tsx` with:

```tsx
import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { SIZES } from '../system/axes';
import type { Size } from '../system/axes';
import { element, toClasses } from '../system/toClasses';
import { dropLegacyColor } from '../system/dropLegacyColor';
import { useLogoEra } from './logoEra';
import type { Era } from './logoEra';

const sizes = SIZES;

export interface BitLogoProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'color'> {
  size?: Size;
  /** Pin one era. Omit it and each page load shows the next era: 8 → 16 → 32 → 64. */
  era?: Era;
}

/** The bit wordmark: "bit" drawn in one console era's style, over a small "Design System" caption. */
export const BitLogo = forwardRef<HTMLSpanElement, BitLogoProps>(function BitLogo(
  { size = 'md', era, className, ...rest },
  ref,
) {
  const shown = useLogoEra(era);

  return (
    <span
      ref={ref}
      role="img"
      aria-label="bit Design System"
      className={toClasses('logo', [{ name: 'size', allowed: sizes, value: size }], className)}
      data-era={shown}
      {...dropLegacyColor(rest)}
    >
      <span className={element('logo', 'word')} aria-hidden="true">
        bit
      </span>
      <span className={element('logo', 'caption')} aria-hidden="true">
        Design System
      </span>
    </span>
  );
});
```

In `packages/react/src/index.ts`, replace lines 29–30 (the two BitLogo export lines) with:

```ts
export { BitLogo } from './logo/BitLogo';
export type { BitLogoProps } from './logo/BitLogo';
export { ERAS, LOGO_ERA_STORAGE_KEY } from './logo/logoEra';
export type { Era } from './logo/logoEra';
```

Replace `packages/react/src/logo/BitLogo.stories.tsx` with:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { BitLogo } from './BitLogo';
import { ERAS } from './logoEra';
import { SIZES } from '../system/axes';

const meta = {
  title: 'Brand/BitLogo',
  component: BitLogo,
  args: { size: 'md' },
  argTypes: {
    size: { control: 'select', options: SIZES },
    era: { control: 'select', options: [undefined, ...ERAS] },
  },
} satisfies Meta<typeof BitLogo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Eras: Story = {
  name: 'The four eras (pinned)',
  render: (args) => (
    <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      {ERAS.map((era) => (
        <BitLogo key={era} {...args} era={era} />
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 32 }}>
      {SIZES.map((size) => (
        <BitLogo key={size} {...args} size={size} era={64} />
      ))}
    </div>
  ),
};
```

- [ ] **Step 4: Run the tests, coverage and typecheck, and confirm they pass**

Run: `pnpm --filter @bit-ds/react test && pnpm test:coverage && pnpm --filter @bit-ds/react typecheck && pnpm build && pnpm verify && pnpm smoke`
Expected:
- All react tests pass, including `index.test.tsx`, whose component list is unchanged.
- Coverage is 100% for statements, branches, functions and lines.
- Typecheck is clean, `dist OK`, and `consumer OK`.

- [ ] **Step 5: Commit**

```bash
git add packages/react/src
git commit -m "feat(react): BitLogo wordmark whose era advances once per page load

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Gallery: logo manifest and the tests that used the old props

**Files:**
- Modify: `apps/gallery/src/manifests/bitLogo.ts` (full rewrite)
- Modify:
  - `apps/gallery/src/code/toJsx.test.ts:23-34`
  - `apps/gallery/src/engine/ControlsPanel.test.tsx:67-79`
  - `apps/gallery/src/engine/buildProps.test.ts:16-25`
  - `apps/gallery/src/engine/state.test.ts:19-21, 37-47, 62-66`
  - `apps/gallery/src/manifests/sentinels.test.ts:10, 39-43`
  - `apps/gallery/src/shell/Shell.test.tsx:14`
  - `apps/gallery/src/code/highlight.test.ts:27`
  - `apps/gallery/src/manifests/types.ts:18` (comment)

**Interfaces:**
- Consumes: `BitLogo`, `ERAS` and `SIZES` from `@bit-ds/react`, with the `era?: Era` prop.
- Consumes the gallery `Manifest` and `Control` types from `apps/gallery/src/manifests/types.ts`. These are unchanged; the `number` and `boolean` control kinds stay.

- [ ] **Step 1: Update the tests to the new API (these fail until the manifest changes)**

`apps/gallery/src/code/toJsx.test.ts`:
- Remove the two `bitLogo` cases: `'a boolean turned off from a true default'` and `'numbers use braces'`.
- Add this case in their place:

```ts
    [
      'a numeric select uses braces',
      bitLogo,
      { era: '32' },
      `import { BitLogo } from '@bit-ds/react';\n\n<BitLogo era={32} />`,
    ],
```
- The "boolean turned off from a true default" path moves to `state.test.ts`'s fixture below. No shipped manifest has a true-default boolean any more.

`apps/gallery/src/engine/ControlsPanel.test.tsx`: replace the `'renders number and text controls and labels aria-label by its prop name'` test with this version, which uses a synthetic manifest so the number control stays covered:

```tsx
  it('renders number and text controls and labels aria-label by its prop name', async () => {
    const onChange = vi.fn();
    const numbered: Manifest = {
      ...spinner,
      controls: [{ kind: 'number', prop: 'interval', default: 5, min: 1, max: 30, step: 1 }],
    };
    render(<Harness manifest={numbered} onChange={onChange} />);
    const interval = screen.getByLabelText('interval') as HTMLInputElement;
    expect(interval.type).toBe('number');
    expect(interval).toHaveValue(5);
    await userEvent.clear(interval);
    await userEvent.type(interval, '7');
    expect(onChange).toHaveBeenLastCalledWith('interval', '7');

    render(<ControlsPanel manifest={spinner} state={defaultState(spinner)} onChange={onChange} onReset={() => {}} />);
    expect(screen.getByLabelText('aria-label')).toHaveValue('Loading coins');
  });
```
Add `import type { Manifest } from '../manifests/types';`. Remove the `bitLogo` import if nothing else in the file uses it.

`apps/gallery/src/engine/buildProps.test.ts`: replace the two `bitLogo` lines with these two:

```ts
    expect(buildProps(bitLogo, { ...defaultState(bitLogo), era: '32' })).toMatchObject({ era: 32 });
```
```ts
    expect('era' in buildProps(bitLogo, defaultState(bitLogo))).toBe(false);
```

`apps/gallery/src/engine/state.test.ts`. Add `import type { Manifest } from '../manifests/types';`, and define this fixture once after the imports:

```ts
/** The engine still supports number controls and true-default booleans; no shipped manifest uses them now. */
const fixture: Manifest = {
  ...bitLogo,
  controls: [
    { kind: 'number', prop: 'interval', default: 5, min: 1, max: 30, step: 1 },
    { kind: 'boolean', prop: 'animated', default: true },
  ],
};
```
Then, in the existing assertions:
- Replace `bitLogo` with `fixture` in every assertion that uses `interval` or `animated`: the `'stores numbers as strings'` line, the `animated=0` parse line, the three `interval=` lines, and the two `serializeState` lines.
- Change the `'stores numbers as strings'` expectation to `{ interval: '5', animated: true }`, dropping `freeze`.
- Add this to that test:

```ts
    expect(defaultState(bitLogo)).toMatchObject({ size: 'md', era: 'none' });
```

`apps/gallery/src/manifests/sentinels.test.ts`:
- Line 10: change `prop: 'freeze'` to `prop: 'era'`.
- In the `'a select sentinel is left off both'` test, change both `'freeze'` strings to `'era'`.

`apps/gallery/src/shell/Shell.test.tsx` line 14: change `{ name: 'bit' }` to `{ name: 'bit Design System' }`.

`apps/gallery/src/code/highlight.test.ts` line 27: change `<BitLogo interval={8} />` to `<BitLogo era={32} />`. If that test asserts specific token texts taken from that line, update `interval` to `era` and `8` to `32` in those expectations.

- [ ] **Step 2: Run the gallery tests and confirm they fail**

Run: `pnpm build && pnpm --filter @bit-ds/gallery test`
Expected: FAIL, because the manifest has no `era` control yet.

- [ ] **Step 3: Implement the manifest**

Replace `apps/gallery/src/manifests/bitLogo.ts` with:

```ts
import { BitLogo, ERAS, SIZES } from '@bit-ds/react';
import type { Manifest } from './types';

export const bitLogo: Manifest = {
  name: 'BitLogo',
  slug: 'logo',
  group: 'brand',
  component: BitLogo,
  description: 'bit, with "Design System" beneath. Each page load shows the next era: 8 → 16 → 32 → 64. era pins one.',
  controls: [
    { kind: 'axis', prop: 'size', values: SIZES, default: 'md' },
    { kind: 'select', prop: 'era', values: ['none', ...ERAS.map(String)], default: 'none', numeric: true },
  ],
  presets: [{ label: 'Pinned at 32-bit', state: { era: '32' } }],
};
```

In the comment at `apps/gallery/src/manifests/types.ts:18`, change `(Stack gap, BitLogo freeze)` to `(Stack gap, BitLogo era)`.

- [ ] **Step 4: Run the gallery tests, typecheck and lint, and confirm they pass**

Run: `pnpm build && pnpm --filter @bit-ds/gallery test && pnpm typecheck && pnpm lint`
Expected: all gallery tests pass, including the manifest contract test and the route smoke test with axe in both modes. Typecheck and lint are clean.

- [ ] **Step 5: Commit**

```bash
git add apps/gallery/src
git commit -m "feat(gallery): logo page pins an era; tests move off the removed cycle props

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: README logo: a static 64-bit wordmark SVG, Bungee removed

**Files:**
- Modify: `scripts/build-logo-svg.mjs` (full rewrite)
- Regenerate: `assets/bit-logo.svg`
- Modify: `package.json` (remove `@fontsource/bungee`), `pnpm-lock.yaml` (via `pnpm install`)

**Interfaces:**
- Consumes: nothing from earlier tasks. The colors are fixed brand values copied from `power-up.css` light mode.
- Produces: `assets/bit-logo.svg`, which `README.md:1` already references at width 320.

- [ ] **Step 1: Rewrite the generator**

Replace `scripts/build-logo-svg.mjs` with:

```js
// Generates assets/bit-logo.svg: the bit wordmark ("bit" in its 64-bit style over "DESIGN SYSTEM"),
// static and fully self-contained. An image can't advance per page load, so the README shows the still
// era (64). Fonts are read from the @fontsource packages and embedded as base64 so GitHub can render it.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

// power-up light values (kept in sync by hand; this is a static brand asset)
const INK = '#151515';
const PAPER = '#EEEFE9';
const SLATE = '#4A4A5E';
const COIN = '#FFCC00';
const COIN_SHADE = '#E0B000';

const WIDTH = 320;
const HEIGHT = 130;
const X = 32;
const WORD_Y = 80;
const CAPTION_Y = 108;

function fontFace(family, pkg, file) {
  const path = require.resolve(`${pkg}/files/${file}`);
  const b64 = readFileSync(path).toString('base64');
  return `@font-face{font-family:"${family}";src:url(data:font/woff2;base64,${b64}) format("woff2");font-weight:400;font-style:normal}`;
}

const fonts = [
  fontFace('Press Start 2P', '@fontsource/press-start-2p', 'press-start-2p-latin-400-normal.woff2'),
  fontFace('Lilita One', '@fontsource/lilita-one', 'lilita-one-latin-400-normal.woff2'),
].join('\n');

const word = (dx, fill, extra = '') =>
  `<text x="${X + dx}" y="${WORD_Y + dx}" font-family="Lilita One" font-size="78" fill="${fill}"${extra}>bit</text>`;

// 64-bit: two ink layers for the hard drop, four coin-shade layers for the extrusion, then the face.
const word64 = [
  ...[6, 5].map((o) => word(o, INK)),
  ...[4, 3, 2, 1].map((o) => word(o, COIN_SHADE)),
  word(0, COIN, ` stroke="${INK}" stroke-width="3" paint-order="stroke fill"`),
].join('\n  ');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}" role="img" aria-label="bit Design System">
<style>
${fonts}
</style>
<rect x="1.5" y="1.5" width="${WIDTH - 3}" height="${HEIGHT - 3}" rx="14" fill="${PAPER}" stroke="${INK}" stroke-width="3"/>
<g>
  ${word64}
</g>
<text x="${X}" y="${CAPTION_Y}" font-family="Press Start 2P" font-size="13" letter-spacing="2.3" fill="${SLATE}">DESIGN SYSTEM</text>
</svg>
`;

mkdirSync(resolve(root, 'assets'), { recursive: true });
writeFileSync(resolve(root, 'assets/bit-logo.svg'), svg);
console.log(`wrote assets/bit-logo.svg (${(svg.length / 1024).toFixed(0)} KB)`);
```

- [ ] **Step 2: Remove the Bungee dependency and regenerate**

In root `package.json` `devDependencies`, delete the line `"@fontsource/bungee": "^5.3.0",`. Then run:

```bash
pnpm install
pnpm logo:svg
```
Expected: the install succeeds and the lockfile drops `@fontsource/bungee`. It prints `wrote assets/bit-logo.svg (… KB)`.

- [ ] **Step 3: Verify Bungee is gone and the SVG looks right**

Run: `git grep -n -i bungee -- packages scripts package.json assets/bit-logo.svg apps`
Expected: no output.

Run: `grep -c "animation\|@keyframes" assets/bit-logo.svg`
Expected: `0`.

Render `assets/bit-logo.svg` to PNG with the gstack `/browse` skill (never `mcp__claude-in-chrome__*`) and look at it. Check three things: "bit" is gold and extruded, "DESIGN SYSTEM" sits beneath it left-aligned, and nothing is clipped at the card edges. If the caption overruns the right edge, lower `letter-spacing` until it fits with at least 16px of margin. If "bit" clips at the top, lower `font-size` from 78. Record the final values and the PNG path in the report.

- [ ] **Step 4: Run the gates**

Run: `pnpm build && pnpm verify && pnpm test && pnpm typecheck && pnpm lint && pnpm smoke && pnpm storybook:build`
Expected: every gate is green.

- [ ] **Step 5: Commit**

```bash
git add scripts/build-logo-svg.mjs assets/bit-logo.svg package.json pnpm-lock.yaml
git commit -m "chore: README logo is the static 64-bit wordmark; drop the Bungee font

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Screenshot board for the owner's sign-off (no repo changes)

**Files:**
- Create (outside the repo): `~/.gstack/projects/doosemavis-bit-design-system/designs/logo-20261003/final/board.html` and the PNGs beside it.

**Interfaces:**
- Consumes: the built gallery (`pnpm dev`, or `pnpm gallery:build` and serve `apps/gallery/dist`).

- [ ] **Step 1: Capture the screenshots** with the gstack `/browse` skill. Never use `mcp__claude-in-chrome__*`. For each mode, set `localStorage['bit-color-mode']` to `light` or `dark` before loading.
  - The Logo page (`#/brand/logo`) with the `era` control set to 8, 16, 32 and 64, at sizes `sm`, `md` and `lg`, in both modes.
  - The header in each mode, at 1280px wide.
  - Home (`#/`) in each mode, showing the `lg` logo.
  - The rotation: remove `bit-logo-era`, then load Home four times, and capture the header logo each time. The eras should read 8, 16, 32, 64. Light mode is enough.
  - The README SVG, `assets/bit-logo.svg`.

- [ ] **Step 2: Assemble `final/board.html`**
  - A grid of the shots with captions: era × size × mode, then header, Home, the four-load rotation, and the README SVG.
  - Any problem you see goes at the top: clipped shadows, a caption that doesn't line up with the word's left edge, a header taller than its 56px row, or 32-bit not lowercase.

- [ ] **Step 3: Report the board path and any problems.** No commit.
