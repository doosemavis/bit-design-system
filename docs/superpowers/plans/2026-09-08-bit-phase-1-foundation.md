# bit Phase 1: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the bit monorepo with the token system, the power-up theme, the class-emission helpers, seven foundation components, the animated BitLogo, Storybook, CI, and a consumer-ready build.

**Architecture:** Two workspace packages plus a docs app. `@bit/core` is framework-agnostic CSS: one file per theme (all tokens), a system layer (reset, tone/size decorator remaps, motion), and one CSS file per component. `@bit/react` emits classes only; it never imports CSS. Components read only semantic `--bit-*` tokens, and tone/size decorators work by remapping private `--_bit-*` variables once, globally.

**Tech Stack:** pnpm 9 workspaces, TypeScript 5.9 (strict), React 19.2, Vitest 4 + jsdom + React Testing Library + axe-core, tsup 8 + esbuild, Storybook 10 (react-vite) with addon-docs and addon-a11y, Radix `Slot`, ESLint 9 flat config.

**Spec:** `docs/superpowers/specs/2026-09-06-bit-design-system-design.md`

## Global Constraints

- Prefix: every public class is `bit-…`, every public custom property is `--bit-…`, every private custom property is `--_bit-…`.
- Class grammar: block `bit-{kebab}`, element `bit-{block}__{element}`, decorator `bit-{value}`. No BEM `--modifier` classes anywhere.
- Axes and values, verbatim: `tone` ∈ `primary | neutral | success | warning | danger`; `variant` ∈ `solid | outline | ghost`; `size` ∈ `sm | md | lg`; Text `size` ∈ `xs | sm | md | lg | xl | 2xl`.
- Components emit one decorator per supported axis **always, including defaults**. Caller `className` is appended **last**.
- Booleans become attributes, never classes: native (`disabled`, `aria-invalid`) where they exist, `data-*` otherwise.
- Components read semantic tokens only. Tier 3 (component tokens) stays empty.
- Theme names are descriptive, never trademarks: the first theme is `power-up`.
- Both packages carry `"private": true`.
- Every component ships `X.tsx`, `X.test.tsx`, `X.stories.tsx` side by side. Tests first. Coverage threshold 80% (lines, functions, branches, statements) in `@bit/react`.
- Every commit message follows `<type>: <description>` with type ∈ feat, fix, refactor, docs, test, chore, ci.
- Node ≥ 20 (machine has v26). pnpm 9.15.x.
- Fonts: Lilita One, Nunito, Press Start 2P, Bungee (all SIL OFL), loaded by the theme file via Google Fonts `@import`.

## File Structure

```
bit-design-system/
├── package.json                      workspace root: scripts, shared tooling
├── pnpm-workspace.yaml
├── tsconfig.base.json                strict TS shared by all packages
├── eslint.config.js
├── LICENSE                           MIT
├── README.md                         Task 17
├── CONTRIBUTING.md                   Task 17
├── .github/workflows/ci.yml          Task 17
├── assets/bit-logo.svg               Task 16 (generated)
├── packages/core/
│   ├── package.json                  @bit/core, exports point at src (workspace-only)
│   ├── tsconfig.json
│   ├── vitest.config.ts              node environment
│   └── src/
│       ├── tokens.ts                 TONES, SIZES, TEXT_SIZES, SEMANTIC_TOKENS
│       ├── themes/power-up.css       tier 1 + complete tier 2
│       ├── system/reset.css          box-sizing, body defaults, focus ring
│       ├── system/tones.css          .bit-{tone} → --_bit-tone-*
│       ├── system/sizes.css          .bit-{size} → --_bit-size-*
│       ├── system/motion.css         @keyframes bit-power-up, bit-spin
│       ├── components/{button,badge,alert,card,stack,text,spinner,logo}.css
│       ├── index.css                 imports system/* then components/*
│       └── __tests__/                theme-completeness, contrast, system, css helpers
├── packages/react/
│   ├── package.json                  @bit/react, exports point at dist
│   ├── tsconfig.json
│   ├── tsup.config.ts
│   ├── scripts/build-css.mjs         bundles core CSS + copies themes into dist
│   ├── vitest.config.ts              jsdom, coverage thresholds
│   ├── vitest.setup.ts
│   └── src/
│       ├── system/axes.ts            re-exports axes from core + VARIANTS + types
│       ├── system/toClasses.ts       toClasses(), element(), dev warning
│       ├── test/a11y.ts              expectNoA11yViolations(container)
│       ├── components/<Name>/<Name>.tsx|.test.tsx|.stories.tsx
│       ├── logo/BitLogo.tsx|.test.tsx|.stories.tsx
│       ├── index.ts                  public exports
│       └── index.test.tsx            class-contract test (Task 14)
└── apps/docs/
    ├── package.json                  @bit/docs
    ├── .storybook/main.ts
    ├── .storybook/preview.ts         imports core CSS, theme toolbar
    └── stories/Tokens.stories.tsx    swatch page
```

---

### Task 1: Monorepo scaffold and tooling

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `eslint.config.js`, `LICENSE`
- Create: `packages/core/package.json`, `packages/core/tsconfig.json`, `packages/core/vitest.config.ts`, `packages/core/src/tokens.ts`, `packages/core/src/index.css`, `packages/core/src/__tests__/smoke.test.ts`
- Create: `packages/react/package.json`, `packages/react/tsconfig.json`, `packages/react/vitest.config.ts`, `packages/react/vitest.setup.ts`, `packages/react/tsup.config.ts`, `packages/react/scripts/build-css.mjs`, `packages/react/src/index.ts`, `packages/react/src/index.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: workspace scripts `pnpm typecheck`, `pnpm test`, `pnpm lint`, `pnpm build`; `@bit/core` exports `./tokens` → `src/tokens.ts`, `./styles.css` → `src/index.css`, `./themes/*` → `src/themes/*`; `@bit/react` exports `.`, `./styles.css`, `./themes/*` from `dist/`. `PREFIX = 'bit'` exported from `@bit/core/tokens`.

- [ ] **Step 1: Root workspace files**

`package.json`:

```json
{
  "name": "bit-design-system",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@9.15.9",
  "engines": { "node": ">=20" },
  "scripts": {
    "build": "pnpm --filter @bit/react build",
    "test": "pnpm -r --workspace-concurrency=1 test",
    "test:coverage": "pnpm --filter @bit/react test:coverage",
    "typecheck": "pnpm -r typecheck",
    "lint": "eslint .",
    "storybook": "pnpm --filter @bit/docs storybook",
    "storybook:build": "pnpm --filter @bit/docs build"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.0",
    "eslint": "^9.39.0",
    "eslint-plugin-react-hooks": "^7.1.1",
    "typescript": "^5.9.3",
    "typescript-eslint": "^8.70.0"
  }
}
```

`pnpm-workspace.yaml`:

```yaml
packages:
  - "packages/*"
  - "apps/*"
```

`tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noFallthroughCasesInSwitch": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "noEmit": true
  }
}
```

`eslint.config.js`:

```js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/storybook-static/**', '**/coverage/**', '.superpowers/**', '**/*.mjs'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
);
```

`LICENSE` (MIT, year 2026, copyright holder "Moose Davis"):

```
MIT License

Copyright (c) 2026 Moose Davis

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 2: `@bit/core` package files**

`packages/core/package.json`:

```json
{
  "name": "@bit/core",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "description": "bit design system: tokens, themes, and component CSS. Framework-agnostic.",
  "exports": {
    "./tokens": "./src/tokens.ts",
    "./styles.css": "./src/index.css",
    "./themes/*": "./src/themes/*"
  },
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc -p tsconfig.json"
  },
  "devDependencies": {
    "@types/node": "^22.18.0",
    "vitest": "^4.0.0"
  }
}
```

`packages/core/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "lib": ["ES2022"], "types": ["node"] },
  "include": ["src"]
}
```

`packages/core/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

`packages/core/src/tokens.ts` (minimal for now; Task 2 fills it in):

```ts
/** Every public class and custom property starts with this. */
export const PREFIX = 'bit';
```

`packages/core/src/index.css`:

```css
/* bit core styles. System layer first, then one file per component. Filled in by later tasks. */
```

- [ ] **Step 3: Write the failing core smoke test**

`packages/core/src/__tests__/smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { PREFIX } from '../tokens';

describe('@bit/core', () => {
  it('exports the bit prefix', () => {
    expect(PREFIX).toBe('bit');
  });
});
```

- [ ] **Step 4: `@bit/react` package files**

`packages/react/package.json`:

```json
{
  "name": "@bit/react",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "description": "bit design system: React components.",
  "sideEffects": ["*.css"],
  "files": ["dist"],
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./styles.css": "./dist/styles.css",
    "./themes/*": "./dist/themes/*"
  },
  "scripts": {
    "build": "tsup && node scripts/build-css.mjs",
    "test": "vitest run",
    "test:coverage": "vitest run --coverage",
    "typecheck": "tsc -p tsconfig.json"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "dependencies": {
    "@bit/core": "workspace:*",
    "@radix-ui/react-slot": "^1.3.3"
  },
  "devDependencies": {
    "@storybook/react-vite": "^10.6.0",
    "@testing-library/jest-dom": "^6.9.0",
    "@testing-library/react": "^16.3.3",
    "@testing-library/user-event": "^14.6.7",
    "@types/react": "^19.2.0",
    "@types/react-dom": "^19.2.0",
    "@vitest/coverage-v8": "^4.0.0",
    "axe-core": "^4.10.0",
    "esbuild": "^0.25.0",
    "jsdom": "^26.1.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "storybook": "^10.6.0",
    "tsup": "^8.5.0",
    "vitest": "^4.0.0"
  }
}
```

`packages/react/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "types": ["node"] },
  "include": ["src", "vitest.setup.ts", "vitest.config.ts", "tsup.config.ts"]
}
```

`packages/react/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.stories.tsx', 'src/**/*.test.{ts,tsx}', 'src/index.ts', 'src/test/**'],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
```

`packages/react/vitest.setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
```

`packages/react/tsup.config.ts`:

```ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2022',
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  // Inline the workspace core package (only tokens.ts is ever imported from it).
  noExternal: ['@bit/core'],
});
```

`packages/react/scripts/build-css.mjs`:

```js
// Bundles @bit/core's CSS into dist/styles.css and copies theme files into dist/themes/.
// Consumers then import '@bit/react/styles.css' and '@bit/react/themes/power-up.css'.
import { build } from 'esbuild';
import { cpSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const coreSrc = resolve(here, '../../core/src');
const dist = resolve(here, '../dist');

await build({
  entryPoints: [resolve(coreSrc, 'index.css')],
  bundle: true,
  outfile: resolve(dist, 'styles.css'),
  logLevel: 'info',
});

mkdirSync(resolve(dist, 'themes'), { recursive: true });
cpSync(resolve(coreSrc, 'themes'), resolve(dist, 'themes'), { recursive: true });
console.log('copied themes to dist/themes');
```

`packages/react/src/index.ts`:

```ts
export { PREFIX } from '@bit/core/tokens';
```

- [ ] **Step 5: Write the failing react smoke test**

`packages/react/src/index.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { PREFIX } from './index';

describe('@bit/react', () => {
  it('re-exports the prefix from core', () => {
    expect(PREFIX).toBe('bit');
  });
});
```

- [ ] **Step 6: Install and run everything**

Run from the repo root:

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm lint
```

Expected: install succeeds; `typecheck` prints nothing; `test` shows 1 passing test in each package; `lint` prints nothing. If `pnpm install` warns about peer `react` for `@storybook/react-vite`, that is fine (react is in devDependencies).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold pnpm monorepo with core and react packages"
```

---

### Task 2: Semantic token list, power-up theme, completeness and contrast tests

**Files:**
- Modify: `packages/core/src/tokens.ts`
- Create: `packages/core/src/themes/power-up.css`
- Create: `packages/core/src/__tests__/css.ts` (test helpers)
- Test: `packages/core/src/__tests__/tokens.test.ts`, `packages/core/src/__tests__/theme-completeness.test.ts`, `packages/core/src/__tests__/contrast.test.ts`

**Interfaces:**
- Consumes: `PREFIX` from Task 1.
- Produces: from `@bit/core/tokens`: `TONES`, `SIZES`, `TEXT_SIZES`, `SPACE_STEPS` (readonly tuples), types `Tone`, `Size`, `TextSize`, and `SEMANTIC_TOKENS: readonly string[]` (67 names). Test helpers `readCss(relativeToSrc)`, `parseCustomProps(css)`, `resolveVar(map, name)`, `contrastRatio(hexA, hexB)` from `__tests__/css.ts`.

- [ ] **Step 1: Write the failing tokens test**

`packages/core/src/__tests__/tokens.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { SEMANTIC_TOKENS, TONES, SIZES, TEXT_SIZES } from '../tokens';

describe('semantic token list', () => {
  it('has the five tones, three sizes, six text sizes', () => {
    expect(TONES).toEqual(['primary', 'neutral', 'success', 'warning', 'danger']);
    expect(SIZES).toEqual(['sm', 'md', 'lg']);
    expect(TEXT_SIZES).toEqual(['xs', 'sm', 'md', 'lg', 'xl', '2xl']);
  });

  it('contains exactly 67 unique names, all prefixed --bit-', () => {
    expect(SEMANTIC_TOKENS).toHaveLength(67);
    expect(new Set(SEMANTIC_TOKENS).size).toBe(67);
    for (const name of SEMANTIC_TOKENS) expect(name).toMatch(/^--bit-[a-z0-9-]+$/);
  });

  it('includes the four color tokens for every tone', () => {
    for (const tone of TONES) {
      for (const suffix of ['', '-contrast', '-hover', '-soft']) {
        expect(SEMANTIC_TOKENS).toContain(`--bit-color-${tone}${suffix}`);
      }
    }
  });

  it('includes the shape, type, space, control, and motion tokens named in the spec', () => {
    const expected = [
      '--bit-color-bg', '--bit-color-surface', '--bit-color-ink', '--bit-color-text', '--bit-color-text-muted', '--bit-color-focus',
      '--bit-border-width', '--bit-radius-sm', '--bit-radius-md', '--bit-radius-lg', '--bit-radius-full',
      '--bit-shadow-sm', '--bit-shadow-md', '--bit-shadow-lg', '--bit-shadow-inset', '--bit-gloss',
      '--bit-font-display', '--bit-font-body', '--bit-font-pixel',
      '--bit-text-xs', '--bit-text-2xl', '--bit-leading-tight', '--bit-leading-normal', '--bit-weight-normal', '--bit-weight-bold',
      '--bit-space-1', '--bit-space-8',
      '--bit-control-height-sm', '--bit-control-height-lg', '--bit-control-padding-sm', '--bit-control-padding-lg',
      '--bit-press-offset', '--bit-duration-fast', '--bit-duration-normal', '--bit-motion-power-up',
    ];
    for (const name of expected) expect(SEMANTIC_TOKENS).toContain(name);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @bit/core test`
Expected: FAIL, `SEMANTIC_TOKENS` is not exported.

- [ ] **Step 3: Implement `tokens.ts`**

Replace `packages/core/src/tokens.ts` with:

```ts
/** Every public class and custom property starts with this. */
export const PREFIX = 'bit';

/** The five color roles. Same words as the `tone` prop and the `bit-{tone}` class. */
export const TONES = ['primary', 'neutral', 'success', 'warning', 'danger'] as const;
/** Control sizes. Same words as the `size` prop and the `bit-{size}` class. */
export const SIZES = ['sm', 'md', 'lg'] as const;
/** Text sizes: the control sizes plus the ends of the type scale. */
export const TEXT_SIZES = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const;
/** Spacing steps on a 4px scale: 4, 8, 12, 16, 24, 32, 48, 64. */
export const SPACE_STEPS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export type Tone = (typeof TONES)[number];
export type Size = (typeof SIZES)[number];
export type TextSize = (typeof TEXT_SIZES)[number];
export type SpaceStep = (typeof SPACE_STEPS)[number];

const token = (category: string, ...parts: (string | number)[]) =>
  `--${PREFIX}-${[category, ...parts].join('-')}`;

const colorRoleTokens = ['bg', 'surface', 'ink', 'text', 'text-muted', 'focus'].map((role) => token('color', role));

const toneTokens = TONES.flatMap((tone) => [
  token('color', tone),
  token('color', tone, 'contrast'),
  token('color', tone, 'hover'),
  token('color', tone, 'soft'),
]);

const shapeTokens = [
  token('border', 'width'),
  ...['sm', 'md', 'lg', 'full'].map((s) => token('radius', s)),
  ...['sm', 'md', 'lg', 'inset'].map((s) => token('shadow', s)),
  token('gloss'),
];

const typeTokens = [
  ...['display', 'body', 'pixel'].map((f) => token('font', f)),
  ...TEXT_SIZES.map((s) => token('text', s)),
  token('leading', 'tight'),
  token('leading', 'normal'),
  token('weight', 'normal'),
  token('weight', 'bold'),
];

const spaceTokens = SPACE_STEPS.map((n) => token('space', n));

const controlTokens = [
  ...SIZES.map((s) => token('control', 'height', s)),
  ...SIZES.map((s) => token('control', 'padding', s)),
];

const motionTokens = [
  token('press', 'offset'),
  token('duration', 'fast'),
  token('duration', 'normal'),
  token('motion', 'power-up'),
];

/**
 * The complete tier-2 token set. Every theme must declare every one of these.
 * Components read only these names (never tier-1 `--bit-palette-*` values).
 */
export const SEMANTIC_TOKENS: readonly string[] = [
  ...colorRoleTokens,
  ...toneTokens,
  ...shapeTokens,
  ...typeTokens,
  ...spaceTokens,
  ...controlTokens,
  ...motionTokens,
];
```

- [ ] **Step 4: Run the tokens test to verify it passes**

Run: `pnpm --filter @bit/core test`
Expected: PASS (4 tests in tokens.test.ts plus the smoke test).

- [ ] **Step 5: Write the CSS test helpers**

`packages/core/src/__tests__/css.ts`:

```ts
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const srcDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Read a file under packages/core/src by relative path. */
export function readCss(relativeToSrc: string): string {
  return readFileSync(resolve(srcDir, relativeToSrc), 'utf8');
}

/** List file names in a directory under packages/core/src (empty array if it does not exist). */
export function listCss(relativeDir: string): string[] {
  try {
    return readdirSync(resolve(srcDir, relativeDir)).filter((f) => f.endsWith('.css')).sort();
  } catch {
    return [];
  }
}

/** Collect every `--name: value;` declaration in a CSS string. Later declarations win. */
export function parseCustomProps(css: string): Map<string, string> {
  const map = new Map<string, string>();
  const re = /(--[a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(css)) !== null) {
    map.set(match[1]!, match[2]!.trim());
  }
  return map;
}

/** Follow `var(--x)` references until a literal value is reached. */
export function resolveVar(map: Map<string, string>, name: string, depth = 0): string {
  if (depth > 10) throw new Error(`Circular var() chain at ${name}`);
  const value = map.get(name);
  if (value === undefined) throw new Error(`Token ${name} is not declared`);
  const ref = /^var\((--[a-zA-Z0-9_-]+)\)$/.exec(value);
  return ref ? resolveVar(map, ref[1]!, depth + 1) : value;
}

function channel(hex: string): number {
  const c = parseInt(hex, 16) / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Relative luminance of a `#rrggbb` color per WCAG 2.x. */
export function luminance(hex: string): number {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
  if (!m) throw new Error(`Expected #rrggbb, got "${hex}"`);
  return 0.2126 * channel(m[1]!) + 0.7152 * channel(m[2]!) + 0.0722 * channel(m[3]!);
}

/** WCAG contrast ratio between two `#rrggbb` colors (1 to 21). */
export function contrastRatio(hexA: string, hexB: string): number {
  const [hi, lo] = [luminance(hexA), luminance(hexB)].sort((a, b) => b - a) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}
```

- [ ] **Step 6: Write the failing theme-completeness test**

`packages/core/src/__tests__/theme-completeness.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { SEMANTIC_TOKENS } from '../tokens';
import { listCss, parseCustomProps, readCss } from './css';

const themes = listCss('themes');

describe('themes', () => {
  it('has at least one theme file', () => {
    expect(themes.length).toBeGreaterThan(0);
  });

  describe.each(themes)('%s', (file) => {
    const declared = parseCustomProps(readCss(`themes/${file}`));

    it('declares every semantic token', () => {
      const missing = SEMANTIC_TOKENS.filter((name) => !declared.has(name));
      expect(missing).toEqual([]);
    });

    it('declares no unknown --bit- tokens (typos) outside the palette tier', () => {
      const unknown = [...declared.keys()].filter(
        (name) => name.startsWith('--bit-') && !name.startsWith('--bit-palette-') && !SEMANTIC_TOKENS.includes(name),
      );
      expect(unknown).toEqual([]);
    });

    it('applies itself to :root and to its data-theme selector', () => {
      const css = readCss(`themes/${file}`);
      const themeName = file.replace(/\.css$/, '');
      expect(css).toMatch(/:root/);
      expect(css).toContain(`[data-theme="${themeName}"]`);
    });
  });
});
```

- [ ] **Step 7: Write the failing contrast test**

`packages/core/src/__tests__/contrast.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { TONES } from '../tokens';
import { contrastRatio, listCss, parseCustomProps, readCss, resolveVar } from './css';

const AA_TEXT = 4.5;
const AA_NON_TEXT = 3;

describe.each(listCss('themes'))('%s color contrast', (file) => {
  const map = parseCustomProps(readCss(`themes/${file}`));
  const color = (name: string) => resolveVar(map, name);

  it.each(TONES)('tone %s: contrast text readable on fill and on hover fill', (tone) => {
    const text = color(`--bit-color-${tone}-contrast`);
    expect(contrastRatio(text, color(`--bit-color-${tone}`))).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrastRatio(text, color(`--bit-color-${tone}-hover`))).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it('body text and muted text are readable on the page and on surfaces', () => {
    for (const bg of ['--bit-color-bg', '--bit-color-surface']) {
      expect(contrastRatio(color('--bit-color-text'), color(bg))).toBeGreaterThanOrEqual(AA_TEXT);
      expect(contrastRatio(color('--bit-color-text-muted'), color(bg))).toBeGreaterThanOrEqual(AA_TEXT);
    }
  });

  it('focus ring is visible against the page', () => {
    expect(contrastRatio(color('--bit-color-focus'), color('--bit-color-bg'))).toBeGreaterThanOrEqual(AA_NON_TEXT);
  });
});
```

- [ ] **Step 8: Run to verify both fail**

Run: `pnpm --filter @bit/core test`
Expected: FAIL, "has at least one theme file" fails (no `themes/` directory yet) and the `describe.each` suites are empty.

- [ ] **Step 9: Write the power-up theme**

`packages/core/src/themes/power-up.css`:

```css
/* bit theme: power-up
   Late-90s platformer chunkiness on a warm cream page.
   Tier 1 (palette) is private to this file. Tier 2 (semantic) is the public API
   and must list every name in tokens.ts — the theme-completeness test enforces it. */

@import url("https://fonts.googleapis.com/css2?family=Lilita+One&family=Nunito:wght@600;700;800&family=Press+Start+2P&family=Bungee&display=swap");

:root,
[data-theme="power-up"] {
  /* ---------- tier 1: palette ---------- */
  --bit-palette-yellow: #FFCC00;
  --bit-palette-yellow-dark: #E0B000;
  --bit-palette-yellow-soft: #FFF3BF;
  --bit-palette-red: #D42B26;
  --bit-palette-red-dark: #B5221E;
  --bit-palette-red-soft: #FBDCDB;
  --bit-palette-green: #43B047;
  --bit-palette-green-dark: #3BA03F;
  --bit-palette-green-soft: #DCF2DD;
  --bit-palette-orange: #F5A623;
  --bit-palette-orange-dark: #D98E12;
  --bit-palette-orange-soft: #FDEBCB;
  --bit-palette-blue: #2D7DFF;
  --bit-palette-ink: #1B1B2F;
  --bit-palette-ink-soft: #E8E6EF;
  --bit-palette-slate: #4A4A5E;
  --bit-palette-cream: #F5EEDC;
  --bit-palette-white: #FFFFFF;

  /* ---------- tier 2: color ---------- */
  --bit-color-bg: var(--bit-palette-cream);
  --bit-color-surface: var(--bit-palette-white);
  --bit-color-ink: var(--bit-palette-ink);
  --bit-color-text: var(--bit-palette-ink);
  --bit-color-text-muted: var(--bit-palette-slate);
  --bit-color-focus: var(--bit-palette-blue);

  --bit-color-primary: var(--bit-palette-yellow);
  --bit-color-primary-contrast: var(--bit-palette-ink);
  --bit-color-primary-hover: var(--bit-palette-yellow-dark);
  --bit-color-primary-soft: var(--bit-palette-yellow-soft);

  --bit-color-neutral: var(--bit-palette-white);
  --bit-color-neutral-contrast: var(--bit-palette-ink);
  --bit-color-neutral-hover: var(--bit-palette-ink-soft);
  --bit-color-neutral-soft: var(--bit-palette-ink-soft);

  --bit-color-success: var(--bit-palette-green);
  --bit-color-success-contrast: var(--bit-palette-ink);
  --bit-color-success-hover: var(--bit-palette-green-dark);
  --bit-color-success-soft: var(--bit-palette-green-soft);

  --bit-color-warning: var(--bit-palette-orange);
  --bit-color-warning-contrast: var(--bit-palette-ink);
  --bit-color-warning-hover: var(--bit-palette-orange-dark);
  --bit-color-warning-soft: var(--bit-palette-orange-soft);

  --bit-color-danger: var(--bit-palette-red);
  --bit-color-danger-contrast: var(--bit-palette-white);
  --bit-color-danger-hover: var(--bit-palette-red-dark);
  --bit-color-danger-soft: var(--bit-palette-red-soft);

  /* ---------- tier 2: shape (where the retro look lives) ---------- */
  --bit-border-width: 3px;
  --bit-radius-sm: 6px;
  --bit-radius-md: 10px;
  --bit-radius-lg: 14px;
  --bit-radius-full: 999px;
  --bit-shadow-sm: 2px 2px 0 var(--bit-color-ink);
  --bit-shadow-md: 4px 4px 0 var(--bit-color-ink);
  --bit-shadow-lg: 6px 6px 0 var(--bit-color-ink);
  --bit-shadow-inset: inset 3px 3px 0 rgba(27, 27, 47, 0.12);
  --bit-gloss: inset 0 3px 0 rgba(255, 255, 255, 0.4);

  /* ---------- tier 2: typography ---------- */
  --bit-font-display: "Lilita One", "Arial Black", sans-serif;
  --bit-font-body: "Nunito", "Segoe UI", sans-serif;
  --bit-font-pixel: "Press Start 2P", monospace;
  --bit-text-xs: 11px;
  --bit-text-sm: 13px;
  --bit-text-md: 15px;
  --bit-text-lg: 18px;
  --bit-text-xl: 24px;
  --bit-text-2xl: 32px;
  --bit-leading-tight: 1.1;
  --bit-leading-normal: 1.5;
  --bit-weight-normal: 600;
  --bit-weight-bold: 800;

  /* ---------- tier 2: space ---------- */
  --bit-space-1: 4px;
  --bit-space-2: 8px;
  --bit-space-3: 12px;
  --bit-space-4: 16px;
  --bit-space-5: 24px;
  --bit-space-6: 32px;
  --bit-space-7: 48px;
  --bit-space-8: 64px;

  /* ---------- tier 2: controls ---------- */
  --bit-control-height-sm: 32px;
  --bit-control-height-md: 40px;
  --bit-control-height-lg: 48px;
  --bit-control-padding-sm: 10px;
  --bit-control-padding-md: 14px;
  --bit-control-padding-lg: 18px;

  /* ---------- tier 2: motion ---------- */
  --bit-press-offset: 2px;
  --bit-duration-fast: 80ms;
  --bit-duration-normal: 160ms;
  --bit-motion-power-up: bit-power-up;
}
```

- [ ] **Step 10: Run all core tests to verify they pass**

Run: `pnpm --filter @bit/core test`
Expected: PASS. Contrast values you should see if you log them: primary 11.2, neutral 21, success 6.1, warning 8.3, danger 5.0, muted-on-cream 7.5, focus 3.3.

- [ ] **Step 11: Commit**

```bash
git add packages/core
git commit -m "feat(core): semantic token list, power-up theme, completeness and contrast tests"
```

---

### Task 3: Core system CSS (reset, tone and size decorators, motion, index)

**Files:**
- Create: `packages/core/src/system/reset.css`, `packages/core/src/system/tones.css`, `packages/core/src/system/sizes.css`, `packages/core/src/system/motion.css`
- Modify: `packages/core/src/index.css`
- Test: `packages/core/src/__tests__/system.test.ts`

**Interfaces:**
- Consumes: tier-2 tokens from Task 2.
- Produces: private variables every component CSS may read: `--_bit-tone`, `--_bit-tone-contrast`, `--_bit-tone-hover`, `--_bit-tone-soft` (set by `.bit-{tone}`), `--_bit-size-height`, `--_bit-size-padding`, `--_bit-size-text` (set by `.bit-{size}`; `.bit-xs/.bit-xl/.bit-2xl` set only `--_bit-size-text`). Keyframes `bit-power-up` (1s stepped grow) and `bit-spin`. Rule: `index.css` must `@import` every file in `system/` and `components/`.

- [ ] **Step 1: Write the failing system test**

`packages/core/src/__tests__/system.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { SIZES, TEXT_SIZES, TONES } from '../tokens';
import { listCss, readCss } from './css';

/** Return the body of the first `selector { ... }` block, or null. */
function block(css: string, selector: string): string | null {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`).exec(css);
  return m ? m[1]! : null;
}

describe('system/tones.css', () => {
  const css = readCss('system/tones.css');
  it.each(TONES)('.bit-%s remaps the four private tone variables', (tone) => {
    const body = block(css, `.bit-${tone}`);
    expect(body).not.toBeNull();
    for (const suffix of ['', '-contrast', '-hover', '-soft']) {
      expect(body).toContain(`--_bit-tone${suffix}: var(--bit-color-${tone}${suffix});`);
    }
  });
});

describe('system/sizes.css', () => {
  const css = readCss('system/sizes.css');
  it.each(SIZES)('.bit-%s remaps height, padding, and text', (size) => {
    const body = block(css, `.bit-${size}`);
    expect(body).toContain(`--_bit-size-height: var(--bit-control-height-${size});`);
    expect(body).toContain(`--_bit-size-padding: var(--bit-control-padding-${size});`);
    expect(body).toContain(`--_bit-size-text: var(--bit-text-${size});`);
  });
  it.each(TEXT_SIZES.filter((s) => !(SIZES as readonly string[]).includes(s)))('.bit-%s remaps text only', (size) => {
    const body = block(css, `.bit-${size}`);
    expect(body).toContain(`--_bit-size-text: var(--bit-text-${size});`);
    expect(body).not.toContain('--_bit-size-height');
  });
});

describe('system/motion.css', () => {
  const css = readCss('system/motion.css');
  it('defines the power-up grow and the spin keyframes', () => {
    expect(css).toMatch(/@keyframes bit-power-up\s*\{/);
    expect(css).toMatch(/@keyframes bit-spin\s*\{/);
  });
});

describe('index.css', () => {
  const css = readCss('index.css');
  it('imports every system file, in order, before any component file', () => {
    for (const name of ['reset', 'tones', 'sizes', 'motion']) {
      expect(css).toContain(`@import "./system/${name}.css";`);
    }
    const systemEnd = css.lastIndexOf('./system/');
    const firstComponent = css.indexOf('./components/');
    if (firstComponent !== -1) expect(firstComponent).toBeGreaterThan(systemEnd);
  });
  it('imports every file in components/', () => {
    for (const file of listCss('components')) {
      expect(css).toContain(`@import "./components/${file}";`);
    }
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @bit/core test`
Expected: FAIL, `ENOENT` reading `system/tones.css`.

- [ ] **Step 3: Write the four system files**

`packages/core/src/system/reset.css`:

```css
/* Minimal base. Everything reads tokens so a theme swap restyles the page itself. */
*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: var(--bit-font-body);
  font-size: var(--bit-text-md);
  font-weight: var(--bit-weight-normal);
  line-height: var(--bit-leading-normal);
  color: var(--bit-color-text);
  background: var(--bit-color-bg);
}

:focus-visible {
  outline: 3px solid var(--bit-color-focus);
  outline-offset: 2px;
}
```

`packages/core/src/system/tones.css`:

```css
/* Tone decorators. Written once; every component reads the private variables.
   Adding a tone = four tokens in each theme + one rule here. */
.bit-primary {
  --_bit-tone: var(--bit-color-primary);
  --_bit-tone-contrast: var(--bit-color-primary-contrast);
  --_bit-tone-hover: var(--bit-color-primary-hover);
  --_bit-tone-soft: var(--bit-color-primary-soft);
}

.bit-neutral {
  --_bit-tone: var(--bit-color-neutral);
  --_bit-tone-contrast: var(--bit-color-neutral-contrast);
  --_bit-tone-hover: var(--bit-color-neutral-hover);
  --_bit-tone-soft: var(--bit-color-neutral-soft);
}

.bit-success {
  --_bit-tone: var(--bit-color-success);
  --_bit-tone-contrast: var(--bit-color-success-contrast);
  --_bit-tone-hover: var(--bit-color-success-hover);
  --_bit-tone-soft: var(--bit-color-success-soft);
}

.bit-warning {
  --_bit-tone: var(--bit-color-warning);
  --_bit-tone-contrast: var(--bit-color-warning-contrast);
  --_bit-tone-hover: var(--bit-color-warning-hover);
  --_bit-tone-soft: var(--bit-color-warning-soft);
}

.bit-danger {
  --_bit-tone: var(--bit-color-danger);
  --_bit-tone-contrast: var(--bit-color-danger-contrast);
  --_bit-tone-hover: var(--bit-color-danger-hover);
  --_bit-tone-soft: var(--bit-color-danger-soft);
}
```

`packages/core/src/system/sizes.css`:

```css
/* Size decorators. sm/md/lg set control height, padding, and text.
   xs/xl/2xl exist for Text only and set text size alone. */
.bit-sm {
  --_bit-size-height: var(--bit-control-height-sm);
  --_bit-size-padding: var(--bit-control-padding-sm);
  --_bit-size-text: var(--bit-text-sm);
}

.bit-md {
  --_bit-size-height: var(--bit-control-height-md);
  --_bit-size-padding: var(--bit-control-padding-md);
  --_bit-size-text: var(--bit-text-md);
}

.bit-lg {
  --_bit-size-height: var(--bit-control-height-lg);
  --_bit-size-padding: var(--bit-control-padding-lg);
  --_bit-size-text: var(--bit-text-lg);
}

.bit-xs {
  --_bit-size-text: var(--bit-text-xs);
}

.bit-xl {
  --_bit-size-text: var(--bit-text-xl);
}

.bit-2xl {
  --_bit-size-text: var(--bit-text-2xl);
}
```

`packages/core/src/system/motion.css`:

```css
/* bit-power-up: the NES grow. Small → medium → big, three times, settle big.
   Use with `animation: bit-power-up 1s step-end`. The BitLogo embeds the same
   steps inside its own cycle keyframes (see components/logo.css). */
@keyframes bit-power-up {
  0%     { transform: scale(0.5); }
  11.1%  { transform: scale(0.75); }
  22.2%  { transform: scale(1); }
  33.3%  { transform: scale(0.5); }
  44.4%  { transform: scale(0.75); }
  55.5%  { transform: scale(1); }
  66.6%  { transform: scale(0.5); }
  77.7%  { transform: scale(0.75); }
  88.8%, 100% { transform: scale(1); }
}

@keyframes bit-spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

`packages/core/src/index.css`:

```css
/* bit core styles. System layer first, then one file per component.
   The system test fails if a component file exists but is not imported here. */
@import "./system/reset.css";
@import "./system/tones.css";
@import "./system/sizes.css";
@import "./system/motion.css";
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm --filter @bit/core test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core
git commit -m "feat(core): system layer with tone and size decorators, motion, reset"
```

---

### Task 4: React system layer: axes, `toClasses`, `element`, a11y test helper

**Files:**
- Create: `packages/react/src/system/axes.ts`, `packages/react/src/system/toClasses.ts`, `packages/react/src/test/a11y.ts`
- Modify: `packages/react/src/index.ts`
- Test: `packages/react/src/system/toClasses.test.ts`

**Interfaces:**
- Consumes: `PREFIX`, `TONES`, `SIZES`, `TEXT_SIZES`, `SPACE_STEPS`, types from `@bit/core/tokens`.
- Produces:
  - `axes.ts`: `VARIANTS = ['solid','outline','ghost'] as const`, type `Variant`; re-exports `TONES`, `SIZES`, `TEXT_SIZES`, `SPACE_STEPS` and types `Tone`, `Size`, `TextSize`, `SpaceStep`.
  - `toClasses.ts`: `interface Axis { name: string; allowed: readonly string[]; value: string | undefined }`; `toClasses(blockName: string, axes: readonly Axis[], className?: string): string`; `element(blockName: string, elementName: string): string`.
  - `test/a11y.ts`: `expectNoA11yViolations(container: Element): Promise<void>`.

- [ ] **Step 1: Write the failing test**

`packages/react/src/system/toClasses.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { toClasses, element } from './toClasses';
import { TONES, SIZES, VARIANTS } from './axes';

const axes = (tone?: string, variant?: string, size?: string) => [
  { name: 'tone', allowed: TONES, value: tone },
  { name: 'variant', allowed: VARIANTS, value: variant },
  { name: 'size', allowed: SIZES, value: size },
];

describe('toClasses', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('emits the block class then one decorator per axis, in axis order', () => {
    expect(toClasses('button', axes('primary', 'solid', 'md'))).toBe('bit-button bit-primary bit-solid bit-md');
  });

  it('appends the caller className last', () => {
    expect(toClasses('button', axes('primary', 'solid', 'md'), 'bit-danger extra')).toBe(
      'bit-button bit-primary bit-solid bit-md bit-danger extra',
    );
  });

  it('skips axes whose value is undefined', () => {
    expect(toClasses('text', axes(undefined, undefined, 'lg'))).toBe('bit-text bit-lg');
  });

  it('drops an unknown value and warns in development', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(toClasses('button', axes('purple', 'solid', 'md'))).toBe('bit-button bit-solid bit-md');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain('tone="purple"');
    expect(warn.mock.calls[0]?.[0]).toContain('primary | neutral | success | warning | danger');
  });

  it('does not warn in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    toClasses('button', axes('purple', 'solid', 'md'));
    expect(warn).not.toHaveBeenCalled();
  });
});

describe('element', () => {
  it('builds a BEM element class', () => {
    expect(element('card', 'header')).toBe('bit-card__header');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @bit/react test`
Expected: FAIL, cannot resolve `./toClasses` and `./axes`.

- [ ] **Step 3: Implement axes and toClasses**

`packages/react/src/system/axes.ts`:

```ts
import { TONES, SIZES, TEXT_SIZES, SPACE_STEPS } from '@bit/core/tokens';
import type { Tone, Size, TextSize, SpaceStep } from '@bit/core/tokens';

/** Emphasis. Rendered per component, unlike tone and size which are global remaps. */
export const VARIANTS = ['solid', 'outline', 'ghost'] as const;
export type Variant = (typeof VARIANTS)[number];

export { TONES, SIZES, TEXT_SIZES, SPACE_STEPS };
export type { Tone, Size, TextSize, SpaceStep };
```

`packages/react/src/system/toClasses.ts`:

```ts
import { PREFIX } from '@bit/core/tokens';

/** One axis of a component: its prop name, the allowed values, and the value the caller passed. */
export interface Axis {
  name: string;
  allowed: readonly string[];
  value: string | undefined;
}

/** `bit-{block}` */
export function block(blockName: string): string {
  return `${PREFIX}-${blockName}`;
}

/** `bit-{block}__{element}` */
export function element(blockName: string, elementName: string): string {
  return `${PREFIX}-${blockName}__${elementName}`;
}

/**
 * Build a component's class string: block class, one `bit-{value}` decorator per
 * axis (in the order given), then the caller's className last so it wins.
 * Unknown values are dropped with a dev-only warning; nothing throws.
 */
export function toClasses(blockName: string, axes: readonly Axis[], className?: string): string {
  const classes = [block(blockName)];
  for (const axis of axes) {
    if (axis.value === undefined) continue;
    if (!axis.allowed.includes(axis.value)) {
      warnUnknown(blockName, axis);
      continue;
    }
    classes.push(`${PREFIX}-${axis.value}`);
  }
  if (className) classes.push(className);
  return classes.join(' ');
}

function warnUnknown(blockName: string, axis: Axis): void {
  if (process.env.NODE_ENV === 'production') return;
  console.warn(
    `[bit] ${block(blockName)} received ${axis.name}="${axis.value}" but only ` +
      `${axis.allowed.join(' | ')} are allowed. The value was dropped.`,
  );
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm --filter @bit/react test`
Expected: PASS (6 tests).

- [ ] **Step 5: Add the a11y helper and export the system from the index**

`packages/react/src/test/a11y.ts`:

```ts
import axe from 'axe-core';
import { expect } from 'vitest';

/**
 * Fail the test if axe finds any violation inside `container`.
 * `color-contrast` is disabled because jsdom has no layout engine; contrast is
 * verified numerically in packages/core/src/__tests__/contrast.test.ts.
 * `region` is disabled because components render outside any landmark in tests.
 */
export async function expectNoA11yViolations(container: Element): Promise<void> {
  const results = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
  });
  const summary = results.violations.map(
    (v) => `${v.id}: ${v.help} → ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
  );
  expect(summary).toEqual([]);
}
```

Replace `packages/react/src/index.ts` with:

```ts
export { PREFIX } from '@bit/core/tokens';
export { TONES, SIZES, TEXT_SIZES, SPACE_STEPS, VARIANTS } from './system/axes';
export type { Tone, Size, TextSize, SpaceStep, Variant } from './system/axes';
```

Run: `pnpm typecheck && pnpm --filter @bit/react test`
Expected: both clean.

- [ ] **Step 6: Commit**

```bash
git add packages/react
git commit -m "feat(react): axes, toClasses class helper, a11y test helper"
```

---

### Task 5: Storybook app with theme toolbar and token swatches

**Files:**
- Create: `apps/docs/package.json`, `apps/docs/tsconfig.json`, `apps/docs/.storybook/main.ts`, `apps/docs/.storybook/preview.ts`, `apps/docs/stories/Tokens.stories.tsx`

**Interfaces:**
- Consumes: `@bit/core/styles.css`, `@bit/core/themes/power-up.css`, `TONES`, `SEMANTIC_TOKENS` from `@bit/core/tokens`.
- Produces: `pnpm storybook` (dev on :6006) and `pnpm storybook:build`; every `*.stories.tsx` under `packages/react/src` is picked up automatically; a `Theme` toolbar that sets `document.documentElement.dataset.theme`; `tags: ['autodocs']` globally so prop tables appear for every component. Story file convention for later tasks: `import type { Meta, StoryObj } from '@storybook/react-vite'`.

- [ ] **Step 1: Create the docs app**

`apps/docs/package.json`:

```json
{
  "name": "@bit/docs",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build": "storybook build",
    "typecheck": "tsc -p tsconfig.json"
  },
  "dependencies": {
    "@bit/core": "workspace:*",
    "@bit/react": "workspace:*",
    "react": "^19.2.0",
    "react-dom": "^19.2.0"
  },
  "devDependencies": {
    "@storybook/addon-a11y": "^10.6.0",
    "@storybook/addon-docs": "^10.6.0",
    "@storybook/react-vite": "^10.6.0",
    "@types/react": "^19.2.0",
    "@types/react-dom": "^19.2.0",
    "storybook": "^10.6.0",
    "vite": "^7.1.0"
  }
}
```

`apps/docs/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "types": ["node"] },
  "include": [".storybook", "stories"]
}
```

`apps/docs/.storybook/main.ts`:

```ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: [
    '../stories/**/*.stories.@(ts|tsx)',
    '../../../packages/react/src/**/*.stories.@(ts|tsx)',
  ],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: { name: '@storybook/react-vite', options: {} },
};

export default config;
```

`apps/docs/.storybook/preview.ts`:

```ts
import type { Decorator, Preview } from '@storybook/react-vite';
import '@bit/core/styles.css';
import '@bit/core/themes/power-up.css';

/** Add a theme here after adding its CSS import above. */
export const THEMES = ['power-up'] as const;

const withTheme: Decorator = (Story, context) => {
  const theme = (context.globals.theme as string | undefined) ?? THEMES[0];
  document.documentElement.dataset.theme = theme;
  return Story();
};

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'bit theme',
      toolbar: { title: 'Theme', icon: 'paintbrush', items: [...THEMES], dynamicTitle: true },
    },
  },
  initialGlobals: { theme: THEMES[0] },
  decorators: [withTheme],
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};

export default preview;
```

- [ ] **Step 2: Write the tokens story**

`apps/docs/stories/Tokens.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SEMANTIC_TOKENS, TONES } from '@bit/core/tokens';

function Swatches() {
  const style = getComputedStyle(document.documentElement);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
      {TONES.map((tone) => (
        <div
          key={tone}
          style={{
            border: 'var(--bit-border-width) solid var(--bit-color-ink)',
            borderRadius: 'var(--bit-radius-md)',
            boxShadow: 'var(--bit-shadow-md)',
            overflow: 'hidden',
            background: 'var(--bit-color-surface)',
          }}
        >
          <div style={{ background: `var(--bit-color-${tone})`, color: `var(--bit-color-${tone}-contrast)`, padding: 16, fontWeight: 800 }}>
            {tone}
            <div style={{ fontSize: 12, fontWeight: 600 }}>{style.getPropertyValue(`--bit-color-${tone}`).trim()}</div>
          </div>
          <div style={{ background: `var(--bit-color-${tone}-hover)`, color: `var(--bit-color-${tone}-contrast)`, padding: '6px 16px', fontSize: 12 }}>hover</div>
          <div style={{ background: `var(--bit-color-${tone}-soft)`, padding: '6px 16px', fontSize: 12 }}>soft</div>
        </div>
      ))}
    </div>
  );
}

function TokenTable() {
  const style = getComputedStyle(document.documentElement);
  return (
    <table style={{ borderCollapse: 'collapse', fontSize: 13 }}>
      <thead>
        <tr>
          <th style={{ textAlign: 'left', padding: '4px 12px 4px 0' }}>Token</th>
          <th style={{ textAlign: 'left', padding: '4px 0' }}>Value in current theme</th>
        </tr>
      </thead>
      <tbody>
        {SEMANTIC_TOKENS.map((name) => (
          <tr key={name} style={{ borderTop: '1px solid var(--bit-color-neutral-soft)' }}>
            <td style={{ padding: '4px 12px 4px 0' }}><code>{name}</code></td>
            <td style={{ padding: '4px 0', color: 'var(--bit-color-text-muted)' }}>{style.getPropertyValue(name).trim()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const meta: Meta = { title: 'Foundations/Tokens' };
export default meta;

export const Colors: StoryObj = { render: () => <Swatches /> };
export const AllTokens: StoryObj = { render: () => <TokenTable /> };
```

- [ ] **Step 3: Install and build Storybook**

Run from the repo root:

```bash
pnpm install
pnpm typecheck
pnpm storybook:build
```

Expected: `apps/docs/storybook-static/index.html` exists and the build log lists `Foundations/Tokens`. Then run `pnpm storybook`, open http://localhost:6006, confirm the Theme toolbar shows `power-up`, the Colors story shows five swatches on a cream page, and the a11y panel reports no violations. Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add apps/docs pnpm-lock.yaml
git commit -m "feat(docs): storybook with theme toolbar and token swatches"
```

---

### Task 6: Button

**Files:**
- Create: `packages/core/src/components/button.css`
- Modify: `packages/core/src/index.css` (add import)
- Create: `packages/react/src/components/Button/Button.tsx`, `Button.stories.tsx`
- Modify: `packages/react/src/index.ts`
- Test: `packages/react/src/components/Button/Button.test.tsx`

**Interfaces:**
- Consumes: `toClasses`, `TONES`, `VARIANTS`, `SIZES`, types from Task 4; `expectNoA11yViolations` from Task 4; private tone/size variables from Task 3.
- Produces: `Button` (forwardRef to `HTMLButtonElement`), `ButtonProps` = `ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone; variant?: Variant; size?: Size; loading?: boolean; asChild?: boolean }`. Defaults: `tone="primary" variant="solid" size="md" type="button"`. Root class `bit-button`.

- [ ] **Step 1: Write the failing test**

`packages/react/src/components/Button/Button.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';
import { TONES, VARIANTS } from '../../system/axes';
import { expectNoA11yViolations } from '../../test/a11y';

describe('Button', () => {
  it('renders a <button type="button"> with the default decorators', () => {
    render(<Button>Save</Button>);
    const btn = screen.getByRole('button', { name: 'Save' });
    expect(btn).toHaveAttribute('type', 'button');
    expect(btn.className).toBe('bit-button bit-primary bit-solid bit-md');
  });

  it('maps tone, variant, and size to decorator classes', () => {
    render(<Button tone="danger" variant="outline" size="lg">Delete</Button>);
    expect(screen.getByRole('button').className).toBe('bit-button bit-danger bit-outline bit-lg');
  });

  it('appends className last so it can override a decorator', () => {
    render(<Button className="bit-danger">X</Button>);
    expect(screen.getByRole('button').className).toBe('bit-button bit-primary bit-solid bit-md bit-danger');
  });

  it('forwards the ref and spreads unknown props onto the button', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref} data-testid="save">Save</Button>);
    expect(ref.current).toBe(screen.getByTestId('save'));
  });

  it('loading sets data-loading and aria-busy and disables the button', () => {
    render(<Button loading>Saving</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('data-loading');
    expect(btn).toHaveAttribute('aria-busy', 'true');
    expect(btn).toBeDisabled();
  });

  it('does not fire onClick when disabled', async () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Nope</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('asChild renders the child element with Button classes and no type attribute', () => {
    render(
      <Button asChild tone="neutral">
        <a href="/docs">Docs</a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Docs' });
    expect(link.className).toBe('bit-button bit-neutral bit-solid bit-md');
    expect(link).not.toHaveAttribute('type');
  });

  const combos = TONES.flatMap((tone) => VARIANTS.map((variant) => [tone, variant] as const));
  it.each(combos)('tone=%s variant=%s has no accessibility violations', async (tone, variant) => {
    const { container } = render(<Button tone={tone} variant={variant}>Go</Button>);
    await expectNoA11yViolations(container);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @bit/react test -- Button`
Expected: FAIL, cannot resolve `./Button`.

- [ ] **Step 3: Write the component**

`packages/react/src/components/Button/Button.tsx`:

```tsx
import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ElementType } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { SIZES, TONES, VARIANTS } from '../../system/axes';
import type { Size, Tone, Variant } from '../../system/axes';
import { toClasses } from '../../system/toClasses';

/**
 * The values Button supports. To add one (say variant "link"): add it here,
 * then add a `.bit-button.bit-link { }` rule in packages/core/src/components/button.css.
 */
const tones = TONES;
const variants = VARIANTS;
const sizes = SIZES;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Color role. Class: `bit-{tone}`. */
  tone?: Tone;
  /** Emphasis. Class: `bit-{variant}`. */
  variant?: Variant;
  /** Control height. Class: `bit-{size}`. */
  size?: Size;
  /** Shows a spinner and blocks clicks. Rendered as `data-loading` and `aria-busy`. */
  loading?: boolean;
  /** Render the single child element (for example an `<a>`) with Button's classes instead of a `<button>`. */
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    tone = 'primary',
    variant = 'solid',
    size = 'md',
    loading = false,
    asChild = false,
    className,
    type = 'button',
    disabled,
    children,
    ...rest
  },
  ref,
) {
  const Comp: ElementType = asChild ? Slot : 'button';
  const inert = disabled || loading;
  const classes = toClasses(
    'button',
    [
      { name: 'tone', allowed: tones, value: tone },
      { name: 'variant', allowed: variants, value: variant },
      { name: 'size', allowed: sizes, value: size },
    ],
    className,
  );

  return (
    <Comp
      ref={ref}
      className={classes}
      data-loading={loading ? '' : undefined}
      aria-busy={loading || undefined}
      {...(asChild ? { 'aria-disabled': inert || undefined } : { type, disabled: inert })}
      {...rest}
    >
      {children}
    </Comp>
  );
});
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm --filter @bit/react test -- Button`
Expected: PASS (7 named tests + 15 a11y combos).

- [ ] **Step 5: Write the CSS and register it**

`packages/core/src/components/button.css`:

```css
/* Button. Reads tone via --_bit-tone-* (set by .bit-{tone}) and size via --_bit-size-* (set by .bit-{size}). */
.bit-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--bit-space-2);
  height: var(--_bit-size-height);
  padding: 0 var(--_bit-size-padding);
  font-family: var(--bit-font-body);
  font-size: var(--_bit-size-text);
  font-weight: var(--bit-weight-bold);
  line-height: 1;
  color: var(--bit-color-text);
  background: var(--bit-color-surface);
  border: var(--bit-border-width) solid var(--bit-color-ink);
  border-radius: var(--bit-radius-md);
  box-shadow: var(--bit-shadow-md);
  cursor: pointer;
  text-decoration: none;
  white-space: nowrap;
  user-select: none;
  transition:
    transform var(--bit-duration-fast),
    box-shadow var(--bit-duration-fast),
    background-color var(--bit-duration-fast);
}

/* variants */
.bit-button.bit-solid {
  background: var(--_bit-tone);
  color: var(--_bit-tone-contrast);
  box-shadow: var(--bit-gloss), var(--bit-shadow-md);
}

.bit-button.bit-outline {
  background: var(--bit-color-surface);
  color: var(--bit-color-text);
}

.bit-button.bit-ghost {
  background: transparent;
  border-color: transparent;
  box-shadow: none;
}

/* hover: sink one press-offset; the shadow shrinks by the same amount */
.bit-button:hover:not(:disabled):not([aria-disabled="true"]) {
  transform: translate(var(--bit-press-offset), var(--bit-press-offset));
}

.bit-button.bit-solid:hover:not(:disabled):not([aria-disabled="true"]) {
  background: var(--_bit-tone-hover);
  box-shadow: var(--bit-gloss), var(--bit-shadow-sm);
}

.bit-button.bit-outline:hover:not(:disabled):not([aria-disabled="true"]) {
  background: var(--_bit-tone-soft);
  box-shadow: var(--bit-shadow-sm);
}

.bit-button.bit-ghost:hover:not(:disabled):not([aria-disabled="true"]) {
  background: var(--_bit-tone-soft);
}

/* active: fully pressed, no shadow */
.bit-button:active:not(:disabled):not([aria-disabled="true"]) {
  transform: translate(calc(var(--bit-press-offset) * 2), calc(var(--bit-press-offset) * 2));
  box-shadow: none;
}

/* states are attributes, never classes */
.bit-button:disabled,
.bit-button[aria-disabled="true"] {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.bit-button[data-loading] {
  cursor: progress;
}

.bit-button[data-loading]::before {
  content: "";
  width: 1em;
  height: 1em;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: var(--bit-radius-full);
  animation: bit-spin 0.7s linear infinite;
}
```

Append to `packages/core/src/index.css`:

```css
@import "./components/button.css";
```

Run: `pnpm --filter @bit/core test`
Expected: PASS (the index test now sees `button.css` imported).

- [ ] **Step 6: Write the story and export**

`packages/react/src/components/Button/Button.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';
import { SIZES, TONES, VARIANTS } from '../../system/axes';

const row = { display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' } as const;

const meta = {
  title: 'Components/Button',
  component: Button,
  args: { children: 'Continue ▶', tone: 'primary', variant: 'solid', size: 'md' },
  argTypes: {
    tone: { control: 'select', options: TONES },
    variant: { control: 'select', options: VARIANTS },
    size: { control: 'select', options: SIZES },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Tones: Story = {
  render: (args) => (
    <div style={row}>
      {TONES.map((tone) => (
        <Button key={tone} {...args} tone={tone}>{tone}</Button>
      ))}
    </div>
  ),
};

export const Variants: Story = {
  render: (args) => (
    <div style={row}>
      {VARIANTS.map((variant) => (
        <Button key={variant} {...args} variant={variant}>{variant}</Button>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div style={row}>
      {SIZES.map((size) => (
        <Button key={size} {...args} size={size}>{size}</Button>
      ))}
    </div>
  ),
};

export const Loading: Story = { args: { loading: true, children: 'Saving' } };
export const Disabled: Story = { args: { disabled: true } };

export const AsLink: Story = {
  render: (args) => (
    <Button {...args} asChild>
      <a href="#docs">Read the docs</a>
    </Button>
  ),
};

export const PlainHtml: Story = {
  name: 'Plain HTML (class decorators)',
  render: () => (
    <div style={row}>
      <button className="bit-button bit-primary bit-solid bit-md">bit-primary</button>
      <button className="bit-button bit-danger bit-outline bit-md">bit-danger bit-outline</button>
      <button className="bit-button bit-neutral bit-ghost bit-sm">bit-ghost bit-sm</button>
    </div>
  ),
};
```

Add to `packages/react/src/index.ts`:

```ts
export { Button } from './components/Button/Button';
export type { ButtonProps } from './components/Button/Button';
```

Run: `pnpm typecheck && pnpm storybook:build`
Expected: clean; the build log lists `Components/Button`.

- [ ] **Step 7: Commit**

```bash
git add packages/core packages/react
git commit -m "feat: Button with tone, variant, size, loading, and asChild"
```

---

### Task 7: Badge

**Files:**
- Create: `packages/core/src/components/badge.css`
- Modify: `packages/core/src/index.css`
- Create: `packages/react/src/components/Badge/Badge.tsx`, `Badge.stories.tsx`
- Modify: `packages/react/src/index.ts`
- Test: `packages/react/src/components/Badge/Badge.test.tsx`

**Interfaces:**
- Consumes: Task 4 helpers.
- Produces: `Badge` (forwardRef to `HTMLSpanElement`), `BadgeProps` = `HTMLAttributes<HTMLSpanElement> & { tone?: Tone; variant?: 'solid' | 'outline'; size?: 'sm' | 'md' }`. Defaults `neutral solid md`. Root class `bit-badge`.

- [ ] **Step 1: Write the failing test**

`packages/react/src/components/Badge/Badge.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';
import { TONES } from '../../system/axes';
import { expectNoA11yViolations } from '../../test/a11y';

describe('Badge', () => {
  it('renders a span with the default decorators', () => {
    render(<Badge>New</Badge>);
    const badge = screen.getByText('New');
    expect(badge.tagName).toBe('SPAN');
    expect(badge.className).toBe('bit-badge bit-neutral bit-solid bit-md');
  });

  it('maps tone, variant, and size', () => {
    render(<Badge tone="success" variant="outline" size="sm">1-Up</Badge>);
    expect(screen.getByText('1-Up').className).toBe('bit-badge bit-success bit-outline bit-sm');
  });

  it('appends className last, forwards ref, spreads props', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Badge ref={ref} className="extra" data-testid="b">X</Badge>);
    expect(screen.getByTestId('b').className).toBe('bit-badge bit-neutral bit-solid bit-md extra');
    expect(ref.current).toBe(screen.getByTestId('b'));
  });

  it.each(TONES)('tone=%s has no accessibility violations', async (tone) => {
    const { container } = render(<Badge tone={tone}>Tag</Badge>);
    await expectNoA11yViolations(container);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @bit/react test -- Badge`
Expected: FAIL, cannot resolve `./Badge`.

- [ ] **Step 3: Write the component**

`packages/react/src/components/Badge/Badge.tsx`:

```tsx
import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { TONES } from '../../system/axes';
import type { Tone } from '../../system/axes';
import { toClasses } from '../../system/toClasses';

/** Badge supports a subset of the global axes. Add a value here and a rule in core/components/badge.css. */
const tones = TONES;
const variants = ['solid', 'outline'] as const;
const sizes = ['sm', 'md'] as const;

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  variant?: (typeof variants)[number];
  size?: (typeof sizes)[number];
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { tone = 'neutral', variant = 'solid', size = 'md', className, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={toClasses(
        'badge',
        [
          { name: 'tone', allowed: tones, value: tone },
          { name: 'variant', allowed: variants, value: variant },
          { name: 'size', allowed: sizes, value: size },
        ],
        className,
      )}
      {...rest}
    />
  );
});
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm --filter @bit/react test -- Badge`
Expected: PASS.

- [ ] **Step 5: CSS, story, export**

`packages/core/src/components/badge.css`:

```css
/* Badge: micro-label in the pixel font. */
.bit-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--bit-space-1);
  font-family: var(--bit-font-pixel);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  line-height: 1;
  border: 2px solid var(--bit-color-ink);
  border-radius: var(--bit-radius-full);
  box-shadow: var(--bit-shadow-sm);
  white-space: nowrap;
}

.bit-badge.bit-sm {
  font-size: 7px;
  padding: 5px 8px;
}

.bit-badge.bit-md {
  font-size: 8px;
  padding: 6px 10px;
}

.bit-badge.bit-solid {
  background: var(--_bit-tone);
  color: var(--_bit-tone-contrast);
}

.bit-badge.bit-outline {
  background: var(--bit-color-surface);
  color: var(--bit-color-text);
}
```

Append to `packages/core/src/index.css`: `@import "./components/badge.css";`

`packages/react/src/components/Badge/Badge.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './Badge';
import { TONES } from '../../system/axes';

const row = { display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' } as const;

const meta = {
  title: 'Components/Badge',
  component: Badge,
  args: { children: 'New', tone: 'neutral', variant: 'solid', size: 'md' },
  argTypes: {
    tone: { control: 'select', options: TONES },
    variant: { control: 'select', options: ['solid', 'outline'] },
    size: { control: 'select', options: ['sm', 'md'] },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Tones: Story = {
  render: (args) => (
    <div style={row}>
      {TONES.map((tone) => (
        <Badge key={tone} {...args} tone={tone}>{tone}</Badge>
      ))}
    </div>
  ),
};

export const Outline: Story = { args: { variant: 'outline', tone: 'success', children: '1-Up' } };
export const Small: Story = { args: { size: 'sm' } };
```

Add to `packages/react/src/index.ts`:

```ts
export { Badge } from './components/Badge/Badge';
export type { BadgeProps } from './components/Badge/Badge';
```

Run: `pnpm --filter @bit/core test && pnpm typecheck`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add packages/core packages/react
git commit -m "feat: Badge"
```

---

### Task 8: Alert

**Files:**
- Create: `packages/core/src/components/alert.css`
- Modify: `packages/core/src/index.css`
- Create: `packages/react/src/components/Alert/Alert.tsx`, `Alert.stories.tsx`
- Modify: `packages/react/src/index.ts`
- Test: `packages/react/src/components/Alert/Alert.test.tsx`

**Interfaces:**
- Consumes: Task 4 helpers (`toClasses`, `element`).
- Produces: `Alert` (forwardRef to `HTMLDivElement`), `AlertProps` = `HTMLAttributes<HTMLDivElement> & { tone?: Tone; variant?: 'solid' | 'outline'; title?: string }`. Defaults `neutral outline`, `role="status"`. Root `bit-alert`; elements `bit-alert__title`, `bit-alert__body`.

- [ ] **Step 1: Write the failing test**

`packages/react/src/components/Alert/Alert.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Alert } from './Alert';
import { TONES } from '../../system/axes';
import { expectNoA11yViolations } from '../../test/a11y';

describe('Alert', () => {
  it('renders role="status" with default decorators and a body element', () => {
    render(<Alert>Saved.</Alert>);
    const alert = screen.getByRole('status');
    expect(alert.className).toBe('bit-alert bit-neutral bit-outline');
    expect(screen.getByText('Saved.').className).toBe('bit-alert__body');
    expect(alert.querySelector('.bit-alert__title')).toBeNull();
  });

  it('renders the title in a title element', () => {
    render(<Alert title="Coins collected">You picked up 42 coins.</Alert>);
    expect(screen.getByText('Coins collected').className).toBe('bit-alert__title');
  });

  it('maps tone and variant, and lets role be overridden', () => {
    render(<Alert tone="danger" variant="solid" role="alert">Game over</Alert>);
    expect(screen.getByRole('alert').className).toBe('bit-alert bit-danger bit-solid');
  });

  it.each(TONES)('tone=%s has no accessibility violations', async (tone) => {
    const { container } = render(<Alert tone={tone} title="Heads up">Body</Alert>);
    await expectNoA11yViolations(container);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @bit/react test -- Alert`
Expected: FAIL, cannot resolve `./Alert`.

- [ ] **Step 3: Write the component**

`packages/react/src/components/Alert/Alert.tsx`:

```tsx
import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { TONES } from '../../system/axes';
import type { Tone } from '../../system/axes';
import { element, toClasses } from '../../system/toClasses';

const tones = TONES;
const variants = ['solid', 'outline'] as const;

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  tone?: Tone;
  /** `outline` uses the tone's soft background; `solid` fills with the tone. */
  variant?: (typeof variants)[number];
  /** Optional heading rendered in the display font. */
  title?: string;
}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
  { tone = 'neutral', variant = 'outline', title, role = 'status', className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      role={role}
      className={toClasses(
        'alert',
        [
          { name: 'tone', allowed: tones, value: tone },
          { name: 'variant', allowed: variants, value: variant },
        ],
        className,
      )}
      {...rest}
    >
      {title ? <div className={element('alert', 'title')}>{title}</div> : null}
      <div className={element('alert', 'body')}>{children}</div>
    </div>
  );
});
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm --filter @bit/react test -- Alert`
Expected: PASS.

- [ ] **Step 5: CSS, story, export**

`packages/core/src/components/alert.css`:

```css
/* Alert: a bordered panel that carries a tone. */
.bit-alert {
  display: flex;
  flex-direction: column;
  gap: var(--bit-space-1);
  padding: var(--bit-space-4);
  border: var(--bit-border-width) solid var(--bit-color-ink);
  border-radius: var(--bit-radius-md);
}

.bit-alert.bit-solid {
  background: var(--_bit-tone);
  color: var(--_bit-tone-contrast);
  box-shadow: var(--bit-shadow-md);
}

.bit-alert.bit-outline {
  background: var(--_bit-tone-soft);
  color: var(--bit-color-text);
  box-shadow: var(--bit-shadow-sm);
}

.bit-alert__title {
  font-family: var(--bit-font-display);
  font-size: var(--bit-text-lg);
  line-height: var(--bit-leading-tight);
  letter-spacing: 0.01em;
}

.bit-alert__body {
  font-size: var(--bit-text-md);
}
```

Append to `packages/core/src/index.css`: `@import "./components/alert.css";`

`packages/react/src/components/Alert/Alert.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Alert } from './Alert';
import { TONES } from '../../system/axes';

const meta = {
  title: 'Components/Alert',
  component: Alert,
  args: { title: 'Coins collected', children: 'You picked up 42 coins in World 1-2.', tone: 'neutral', variant: 'outline' },
  argTypes: {
    tone: { control: 'select', options: TONES },
    variant: { control: 'select', options: ['solid', 'outline'] },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Tones: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 16 }}>
      {TONES.map((tone) => (
        <Alert key={tone} {...args} tone={tone} title={tone} />
      ))}
    </div>
  ),
};

export const Solid: Story = { args: { variant: 'solid', tone: 'danger', title: 'Game over', role: 'alert' } };
export const NoTitle: Story = { args: { title: undefined } };
```

Add to `packages/react/src/index.ts`:

```ts
export { Alert } from './components/Alert/Alert';
export type { AlertProps } from './components/Alert/Alert';
```

Run: `pnpm --filter @bit/core test && pnpm typecheck`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add packages/core packages/react
git commit -m "feat: Alert with title, tone, and variant"
```

---

### Task 9: Card, CardHeader, CardBody, CardFooter

**Files:**
- Create: `packages/core/src/components/card.css`
- Modify: `packages/core/src/index.css`
- Modify: `packages/react/src/system/toClasses.ts` (add `withClassName`), `packages/react/src/system/toClasses.test.ts`
- Create: `packages/react/src/components/Card/Card.tsx`, `Card.stories.tsx`
- Modify: `packages/react/src/index.ts`
- Test: `packages/react/src/components/Card/Card.test.tsx`

**Interfaces:**
- Consumes: Task 4 helpers.
- Produces: `withClassName(base: string, className?: string): string` in `toClasses.ts`. `Card` (forwardRef `HTMLDivElement`), `CardProps` = `HTMLAttributes<HTMLDivElement> & { variant?: 'solid' | 'outline' }`, default `solid`, root `bit-card`. `CardHeader`, `CardBody`, `CardFooter` (forwardRef `HTMLDivElement`, plain `HTMLAttributes<HTMLDivElement>`) with classes `bit-card__header`, `bit-card__body`, `bit-card__footer`.

- [ ] **Step 1: Write the failing tests**

Add to `packages/react/src/system/toClasses.test.ts` (import `withClassName` alongside `toClasses, element`):

```ts
describe('withClassName', () => {
  it('appends the caller className to a base class', () => {
    expect(withClassName('bit-card__header', 'extra')).toBe('bit-card__header extra');
    expect(withClassName('bit-card__header')).toBe('bit-card__header');
  });
});
```

`packages/react/src/components/Card/Card.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { Card, CardBody, CardFooter, CardHeader } from './Card';
import { expectNoA11yViolations } from '../../test/a11y';

describe('Card', () => {
  it('renders a solid card by default', () => {
    render(<Card data-testid="card">x</Card>);
    expect(screen.getByTestId('card').className).toBe('bit-card bit-solid');
  });

  it('maps variant and appends className last', () => {
    render(<Card variant="outline" className="extra" data-testid="card">x</Card>);
    expect(screen.getByTestId('card').className).toBe('bit-card bit-outline extra');
  });

  it('renders header, body, and footer as BEM elements that accept className and ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Card>
        <CardHeader ref={ref} className="h">Stats</CardHeader>
        <CardBody>42 coins</CardBody>
        <CardFooter>Done</CardFooter>
      </Card>,
    );
    expect(screen.getByText('Stats').className).toBe('bit-card__header h');
    expect(screen.getByText('42 coins').className).toBe('bit-card__body');
    expect(screen.getByText('Done').className).toBe('bit-card__footer');
    expect(ref.current).toBe(screen.getByText('Stats'));
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <Card>
        <CardHeader>Stats</CardHeader>
        <CardBody>Body</CardBody>
      </Card>,
    );
    await expectNoA11yViolations(container);
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `pnpm --filter @bit/react test`
Expected: FAIL, `withClassName` is not exported; cannot resolve `./Card`.

- [ ] **Step 3: Implement**

Add to `packages/react/src/system/toClasses.ts`:

```ts
/** Join a fixed class (usually an element class) with the caller's className, which goes last. */
export function withClassName(base: string, className?: string): string {
  return className ? `${base} ${className}` : base;
}
```

`packages/react/src/components/Card/Card.tsx`:

```tsx
import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { element, toClasses, withClassName } from '../../system/toClasses';

const variants = ['solid', 'outline'] as const;

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** `solid` is a filled surface with a hard shadow; `outline` is a border only. */
  variant?: (typeof variants)[number];
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card({ variant = 'solid', className, ...rest }, ref) {
  return (
    <div
      ref={ref}
      className={toClasses('card', [{ name: 'variant', allowed: variants, value: variant }], className)}
      {...rest}
    />
  );
});

export type CardPartProps = HTMLAttributes<HTMLDivElement>;

export const CardHeader = forwardRef<HTMLDivElement, CardPartProps>(function CardHeader({ className, ...rest }, ref) {
  return <div ref={ref} className={withClassName(element('card', 'header'), className)} {...rest} />;
});

export const CardBody = forwardRef<HTMLDivElement, CardPartProps>(function CardBody({ className, ...rest }, ref) {
  return <div ref={ref} className={withClassName(element('card', 'body'), className)} {...rest} />;
});

export const CardFooter = forwardRef<HTMLDivElement, CardPartProps>(function CardFooter({ className, ...rest }, ref) {
  return <div ref={ref} className={withClassName(element('card', 'footer'), className)} {...rest} />;
});
```

- [ ] **Step 4: Run to verify they pass**

Run: `pnpm --filter @bit/react test`
Expected: PASS.

- [ ] **Step 5: CSS, story, export**

`packages/core/src/components/card.css`:

```css
/* Card: a bordered surface with optional header, body, footer parts. */
.bit-card {
  display: flex;
  flex-direction: column;
  border: var(--bit-border-width) solid var(--bit-color-ink);
  border-radius: var(--bit-radius-lg);
  overflow: hidden;
  color: var(--bit-color-text);
}

.bit-card.bit-solid {
  background: var(--bit-color-surface);
  box-shadow: var(--bit-shadow-lg);
}

.bit-card.bit-outline {
  background: transparent;
  box-shadow: none;
}

.bit-card__header {
  padding: var(--bit-space-3) var(--bit-space-4);
  font-family: var(--bit-font-display);
  font-size: var(--bit-text-lg);
  line-height: var(--bit-leading-tight);
  letter-spacing: 0.01em;
  border-bottom: var(--bit-border-width) solid var(--bit-color-ink);
}

.bit-card__body {
  padding: var(--bit-space-4);
}

.bit-card__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--bit-space-2);
  padding: var(--bit-space-3) var(--bit-space-4);
  border-top: var(--bit-border-width) solid var(--bit-color-ink);
  background: var(--bit-color-neutral-soft);
}
```

Append to `packages/core/src/index.css`: `@import "./components/card.css";`

`packages/react/src/components/Card/Card.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card, CardBody, CardFooter, CardHeader } from './Card';
import { Button } from '../Button/Button';

const meta = {
  title: 'Components/Card',
  component: Card,
  args: { variant: 'solid' },
  argTypes: { variant: { control: 'select', options: ['solid', 'outline'] } },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <Card {...args} style={{ maxWidth: 360 }}>
      <CardHeader>Coins collected</CardHeader>
      <CardBody>You picked up 42 coins in World 1-2.</CardBody>
      <CardFooter>
        <Button variant="ghost" tone="neutral">Later</Button>
        <Button>Collect</Button>
      </CardFooter>
    </Card>
  ),
};

export const Outline: Story = { ...Playground, args: { variant: 'outline' } };

export const PlainHtml: Story = {
  name: 'Plain HTML (class decorators)',
  render: () => (
    <div className="bit-card bit-solid" style={{ maxWidth: 360 }}>
      <div className="bit-card__header">bit-card__header</div>
      <div className="bit-card__body">bit-card__body</div>
    </div>
  ),
};
```

Add to `packages/react/src/index.ts`:

```ts
export { Card, CardHeader, CardBody, CardFooter } from './components/Card/Card';
export type { CardProps, CardPartProps } from './components/Card/Card';
```

Run: `pnpm --filter @bit/core test && pnpm typecheck`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add packages/core packages/react
git commit -m "feat: Card with header, body, and footer parts"
```

---

### Task 10: Stack

**Files:**
- Create: `packages/core/src/components/stack.css`
- Modify: `packages/core/src/index.css`
- Create: `packages/react/src/components/Stack/Stack.tsx`, `Stack.stories.tsx`
- Modify: `packages/react/src/index.ts`
- Test: `packages/react/src/components/Stack/Stack.test.tsx`

**Interfaces:**
- Consumes: `toClasses`, `SpaceStep` from Task 4.
- Produces: `Stack` (forwardRef `HTMLDivElement`), `StackProps` = `HTMLAttributes<HTMLDivElement> & { direction?: 'row' | 'column'; gap?: SpaceStep; align?: 'start' | 'center' | 'end' | 'stretch'; justify?: 'start' | 'center' | 'end' | 'between'; wrap?: boolean }`. Defaults `direction="column" gap={3}`. Layout props are `data-*` attributes, not classes. Root `bit-stack`.

- [ ] **Step 1: Write the failing test**

`packages/react/src/components/Stack/Stack.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Stack } from './Stack';

describe('Stack', () => {
  it('renders a column with gap 3 by default and no decorator classes', () => {
    render(<Stack data-testid="s">x</Stack>);
    const el = screen.getByTestId('s');
    expect(el.className).toBe('bit-stack');
    expect(el).toHaveAttribute('data-direction', 'column');
    expect(el).toHaveAttribute('data-gap', '3');
    expect(el).not.toHaveAttribute('data-align');
    expect(el).not.toHaveAttribute('data-justify');
    expect(el).not.toHaveAttribute('data-wrap');
  });

  it('exposes layout props as data attributes', () => {
    render(<Stack direction="row" gap={6} align="center" justify="between" wrap data-testid="s">x</Stack>);
    const el = screen.getByTestId('s');
    expect(el).toHaveAttribute('data-direction', 'row');
    expect(el).toHaveAttribute('data-gap', '6');
    expect(el).toHaveAttribute('data-align', 'center');
    expect(el).toHaveAttribute('data-justify', 'between');
    expect(el).toHaveAttribute('data-wrap', '');
  });

  it('appends className last', () => {
    render(<Stack className="extra" data-testid="s">x</Stack>);
    expect(screen.getByTestId('s').className).toBe('bit-stack extra');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @bit/react test -- Stack`
Expected: FAIL, cannot resolve `./Stack`.

- [ ] **Step 3: Write the component**

`packages/react/src/components/Stack/Stack.tsx`:

```tsx
import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import type { SpaceStep } from '../../system/axes';
import { toClasses } from '../../system/toClasses';

export interface StackProps extends HTMLAttributes<HTMLDivElement> {
  /** Flex direction. Rendered as `data-direction`. */
  direction?: 'row' | 'column';
  /** Gap on the 4px space scale (1 = 4px … 8 = 64px). Rendered as `data-gap`. */
  gap?: SpaceStep;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between';
  wrap?: boolean;
}

export const Stack = forwardRef<HTMLDivElement, StackProps>(function Stack(
  { direction = 'column', gap = 3, align, justify, wrap = false, className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={toClasses('stack', [], className)}
      data-direction={direction}
      data-gap={gap}
      data-align={align}
      data-justify={justify}
      data-wrap={wrap ? '' : undefined}
      {...rest}
    />
  );
});
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm --filter @bit/react test -- Stack`
Expected: PASS.

- [ ] **Step 5: CSS, story, export**

`packages/core/src/components/stack.css`:

```css
/* Stack: flex layout driven by data attributes (layout is not a design axis, so no decorator classes). */
.bit-stack {
  display: flex;
}

.bit-stack[data-direction="column"] { flex-direction: column; }
.bit-stack[data-direction="row"] { flex-direction: row; }
.bit-stack[data-wrap] { flex-wrap: wrap; }

.bit-stack[data-gap="1"] { gap: var(--bit-space-1); }
.bit-stack[data-gap="2"] { gap: var(--bit-space-2); }
.bit-stack[data-gap="3"] { gap: var(--bit-space-3); }
.bit-stack[data-gap="4"] { gap: var(--bit-space-4); }
.bit-stack[data-gap="5"] { gap: var(--bit-space-5); }
.bit-stack[data-gap="6"] { gap: var(--bit-space-6); }
.bit-stack[data-gap="7"] { gap: var(--bit-space-7); }
.bit-stack[data-gap="8"] { gap: var(--bit-space-8); }

.bit-stack[data-align="start"] { align-items: flex-start; }
.bit-stack[data-align="center"] { align-items: center; }
.bit-stack[data-align="end"] { align-items: flex-end; }
.bit-stack[data-align="stretch"] { align-items: stretch; }

.bit-stack[data-justify="start"] { justify-content: flex-start; }
.bit-stack[data-justify="center"] { justify-content: center; }
.bit-stack[data-justify="end"] { justify-content: flex-end; }
.bit-stack[data-justify="between"] { justify-content: space-between; }
```

Append to `packages/core/src/index.css`: `@import "./components/stack.css";`

`packages/react/src/components/Stack/Stack.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stack } from './Stack';
import { Button } from '../Button/Button';
import { SPACE_STEPS } from '../../system/axes';

const meta = {
  title: 'Components/Stack',
  component: Stack,
  args: { direction: 'column', gap: 3, wrap: false },
  argTypes: {
    direction: { control: 'radio', options: ['row', 'column'] },
    gap: { control: 'select', options: SPACE_STEPS },
    align: { control: 'select', options: ['start', 'center', 'end', 'stretch'] },
    justify: { control: 'select', options: ['start', 'center', 'end', 'between'] },
  },
} satisfies Meta<typeof Stack>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <Stack {...args}>
      <Button>One</Button>
      <Button tone="neutral">Two</Button>
      <Button tone="success">Three</Button>
    </Stack>
  ),
};

export const Row: Story = { ...Playground, args: { direction: 'row', gap: 2, align: 'center' } };
```

Add to `packages/react/src/index.ts`:

```ts
export { Stack } from './components/Stack/Stack';
export type { StackProps } from './components/Stack/Stack';
```

Run: `pnpm --filter @bit/core test && pnpm typecheck`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add packages/core packages/react
git commit -m "feat: Stack layout primitive"
```

---

### Task 11: Text

**Files:**
- Create: `packages/core/src/components/text.css`
- Modify: `packages/core/src/index.css`
- Create: `packages/react/src/components/Text/Text.tsx`, `Text.stories.tsx`
- Modify: `packages/react/src/index.ts`
- Test: `packages/react/src/components/Text/Text.test.tsx`

**Interfaces:**
- Consumes: `toClasses`, `TEXT_SIZES`, `TextSize` from Task 4.
- Produces: `Text` (forwardRef `HTMLElement`), `TextProps` = `HTMLAttributes<HTMLElement> & { as?: 'p' | 'span' | 'div' | 'label' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'; size?: TextSize; tone?: 'neutral'; weight?: 'normal' | 'bold' }`. Defaults `as="p" size="md" weight="normal"`; `tone` has no default and is emitted only when given (`neutral` = muted). Root `bit-text`; `weight` → `data-weight`.
- Note: Text's `tone` is limited to `neutral` in v1. Colored body text in the other tones would fail contrast on the cream page, so it is left out until a theme needs it.

- [ ] **Step 1: Write the failing test**

`packages/react/src/components/Text/Text.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { Text } from './Text';
import { expectNoA11yViolations } from '../../test/a11y';

describe('Text', () => {
  it('renders a <p> with size md and normal weight by default', () => {
    render(<Text>Hello</Text>);
    const el = screen.getByText('Hello');
    expect(el.tagName).toBe('P');
    expect(el.className).toBe('bit-text bit-md');
    expect(el).toHaveAttribute('data-weight', 'normal');
  });

  it('renders the element given by `as` and maps size, tone, and weight', () => {
    render(<Text as="h2" size="2xl" tone="neutral" weight="bold">Title</Text>);
    const el = screen.getByRole('heading', { level: 2 });
    expect(el.className).toBe('bit-text bit-neutral bit-2xl');
    expect(el).toHaveAttribute('data-weight', 'bold');
  });

  it('appends className last and forwards the ref', () => {
    const ref = createRef<HTMLElement>();
    render(<Text ref={ref} as="span" className="extra">x</Text>);
    expect(screen.getByText('x').className).toBe('bit-text bit-md extra');
    expect(ref.current).toBe(screen.getByText('x'));
  });

  it('has no accessibility violations as a heading', async () => {
    const { container } = render(<Text as="h1" size="xl">Press Start</Text>);
    await expectNoA11yViolations(container);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @bit/react test -- Text`
Expected: FAIL, cannot resolve `./Text`.

- [ ] **Step 3: Write the component**

`packages/react/src/components/Text/Text.tsx`:

```tsx
import { createElement, forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { TEXT_SIZES } from '../../system/axes';
import type { TextSize } from '../../system/axes';
import { toClasses } from '../../system/toClasses';

const sizes = TEXT_SIZES;
/** Only `neutral` (muted) is supported on Text in v1; see the plan note. */
const tones = ['neutral'] as const;

export type TextElement = 'p' | 'span' | 'div' | 'label' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export interface TextProps extends HTMLAttributes<HTMLElement> {
  /** Which element to render. Styling comes from `size`, not from the tag. */
  as?: TextElement;
  size?: TextSize;
  /** `neutral` renders muted text. */
  tone?: (typeof tones)[number];
  /** Rendered as `data-weight`. */
  weight?: 'normal' | 'bold';
}

export const Text = forwardRef<HTMLElement, TextProps>(function Text(
  { as = 'p', size = 'md', tone, weight = 'normal', className, ...rest },
  ref,
) {
  return createElement(as, {
    ref,
    className: toClasses(
      'text',
      [
        { name: 'tone', allowed: tones, value: tone },
        { name: 'size', allowed: sizes, value: size },
      ],
      className,
    ),
    'data-weight': weight,
    ...rest,
  });
});
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm --filter @bit/react test -- Text`
Expected: PASS.

- [ ] **Step 5: CSS, story, export**

`packages/core/src/components/text.css`:

```css
/* Text: type scale. xl and 2xl switch to the display face. */
.bit-text {
  margin: 0;
  font-family: var(--bit-font-body);
  font-size: var(--_bit-size-text);
  line-height: var(--bit-leading-normal);
  color: var(--bit-color-text);
}

.bit-text[data-weight="normal"] { font-weight: var(--bit-weight-normal); }
.bit-text[data-weight="bold"] { font-weight: var(--bit-weight-bold); }

.bit-text.bit-xl,
.bit-text.bit-2xl {
  font-family: var(--bit-font-display);
  font-weight: 400;
  line-height: var(--bit-leading-tight);
  letter-spacing: 0.01em;
}

.bit-text.bit-neutral {
  color: var(--bit-color-text-muted);
}
```

Append to `packages/core/src/index.css`: `@import "./components/text.css";`

`packages/react/src/components/Text/Text.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Text } from './Text';
import { TEXT_SIZES } from '../../system/axes';

const meta = {
  title: 'Components/Text',
  component: Text,
  args: { children: 'You picked up 42 coins in World 1-2.', as: 'p', size: 'md', weight: 'normal' },
  argTypes: {
    as: { control: 'select', options: ['p', 'span', 'div', 'label', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'] },
    size: { control: 'select', options: TEXT_SIZES },
    tone: { control: 'select', options: [undefined, 'neutral'] },
    weight: { control: 'radio', options: ['normal', 'bold'] },
  },
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Scale: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 12 }}>
      {TEXT_SIZES.map((size) => (
        <Text key={size} size={size}>{size}: Press Start</Text>
      ))}
    </div>
  ),
};

export const Muted: Story = { args: { tone: 'neutral' } };
export const Heading: Story = { args: { as: 'h1', size: '2xl', children: 'Press Start' } };
```

Add to `packages/react/src/index.ts`:

```ts
export { Text } from './components/Text/Text';
export type { TextProps, TextElement } from './components/Text/Text';
```

Run: `pnpm --filter @bit/core test && pnpm typecheck`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add packages/core packages/react
git commit -m "feat: Text with as, size, weight, and muted tone"
```

---

### Task 12: Spinner

**Files:**
- Create: `packages/core/src/components/spinner.css`
- Modify: `packages/core/src/index.css`
- Create: `packages/react/src/components/Spinner/Spinner.tsx`, `Spinner.stories.tsx`
- Modify: `packages/react/src/index.ts`
- Test: `packages/react/src/components/Spinner/Spinner.test.tsx`

**Interfaces:**
- Consumes: Task 4 helpers.
- Produces: `Spinner` (forwardRef `HTMLSpanElement`), `SpinnerProps` = `Omit<HTMLAttributes<HTMLSpanElement>, 'aria-label'> & { tone?: Tone; size?: Size; 'aria-label': string }`. Defaults `primary md`, `role="status"`. Root `bit-spinner`.

- [ ] **Step 1: Write the failing test**

`packages/react/src/components/Spinner/Spinner.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Spinner } from './Spinner';
import { expectNoA11yViolations } from '../../test/a11y';

describe('Spinner', () => {
  it('renders role="status" with the required label and default decorators', () => {
    render(<Spinner aria-label="Loading coins" />);
    const el = screen.getByRole('status', { name: 'Loading coins' });
    expect(el.className).toBe('bit-spinner bit-primary bit-md');
  });

  it('maps tone and size and appends className last', () => {
    render(<Spinner aria-label="Loading" tone="danger" size="lg" className="extra" />);
    expect(screen.getByRole('status').className).toBe('bit-spinner bit-danger bit-lg extra');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Spinner aria-label="Loading" />);
    await expectNoA11yViolations(container);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @bit/react test -- Spinner`
Expected: FAIL, cannot resolve `./Spinner`.

- [ ] **Step 3: Write the component**

`packages/react/src/components/Spinner/Spinner.tsx`:

```tsx
import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { SIZES, TONES } from '../../system/axes';
import type { Size, Tone } from '../../system/axes';
import { toClasses } from '../../system/toClasses';

const tones = TONES;
const sizes = SIZES;

export interface SpinnerProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'aria-label'> {
  tone?: Tone;
  size?: Size;
  /** Required: screen readers announce this. Example: "Loading coins". */
  'aria-label': string;
}

export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(
  { tone = 'primary', size = 'md', className, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      role="status"
      className={toClasses(
        'spinner',
        [
          { name: 'tone', allowed: tones, value: tone },
          { name: 'size', allowed: sizes, value: size },
        ],
        className,
      )}
      {...rest}
    />
  );
});
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm --filter @bit/react test -- Spinner`
Expected: PASS.

- [ ] **Step 5: CSS, story, export**

`packages/core/src/components/spinner.css`:

```css
/* Spinner: an ink ring with a tone-colored arc. Diameter is half the control height of its size. */
.bit-spinner {
  display: inline-block;
  width: calc(var(--_bit-size-height) / 2);
  height: calc(var(--_bit-size-height) / 2);
  border: 3px solid var(--bit-color-ink);
  border-top-color: var(--_bit-tone);
  border-radius: var(--bit-radius-full);
  animation: bit-spin 0.8s linear infinite;
}
```

Append to `packages/core/src/index.css`: `@import "./components/spinner.css";`

`packages/react/src/components/Spinner/Spinner.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Spinner } from './Spinner';
import { SIZES, TONES } from '../../system/axes';

const row = { display: 'flex', gap: 16, alignItems: 'center' } as const;

const meta = {
  title: 'Components/Spinner',
  component: Spinner,
  args: { 'aria-label': 'Loading', tone: 'primary', size: 'md' },
  argTypes: {
    tone: { control: 'select', options: TONES },
    size: { control: 'select', options: SIZES },
  },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div style={row}>
      {SIZES.map((size) => (
        <Spinner key={size} {...args} size={size} />
      ))}
    </div>
  ),
};

export const Tones: Story = {
  render: (args) => (
    <div style={row}>
      {TONES.map((tone) => (
        <Spinner key={tone} {...args} tone={tone} />
      ))}
    </div>
  ),
};
```

Add to `packages/react/src/index.ts`:

```ts
export { Spinner } from './components/Spinner/Spinner';
export type { SpinnerProps } from './components/Spinner/Spinner';
```

Run: `pnpm --filter @bit/core test && pnpm typecheck`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add packages/core packages/react
git commit -m "feat: Spinner"
```

---

### Task 13: BitLogo

**Files:**
- Create: `packages/core/src/components/logo.css`
- Modify: `packages/core/src/index.css`
- Create: `packages/react/src/logo/BitLogo.tsx`, `BitLogo.stories.tsx`
- Modify: `packages/react/src/index.ts`
- Test: `packages/react/src/logo/BitLogo.test.tsx`

**Interfaces:**
- Consumes: `toClasses`, `element`, `SIZES` from Task 4; keyframe conventions from Task 3.
- Produces: `ERAS = [8, 16, 32, 64] as const`, type `Era`; `BitLogo` (forwardRef `HTMLSpanElement`), `BitLogoProps` = `HTMLAttributes<HTMLSpanElement> & { size?: Size; interval?: number; animated?: boolean; freeze?: Era }`. Defaults `size="md" interval={5} animated`. Root `bit-logo` with `role="img" aria-label="bit"`; elements `bit-logo__slot`, `bit-logo__era[data-era]`, `bit-logo__suffix`. `data-animated` present only when cycling. CSS variable `--bit-logo-interval` (seconds per era) set inline from `interval`.
- Behavior: `freeze` renders only that era and stops the cycle. `animated={false}` renders only era 8. Reduced motion shows era 8 only.

- [ ] **Step 1: Write the failing test**

`packages/react/src/logo/BitLogo.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BitLogo, ERAS } from './BitLogo';
import { expectNoA11yViolations } from '../test/a11y';

const eras = (root: HTMLElement) => [...root.querySelectorAll('.bit-logo__era')].map((el) => el.getAttribute('data-era'));

describe('BitLogo', () => {
  it('renders all four eras, the fixed suffix, and cycles by default', () => {
    render(<BitLogo />);
    const root = screen.getByRole('img', { name: 'bit' });
    expect(root.className).toBe('bit-logo bit-md');
    expect(root).toHaveAttribute('data-animated');
    expect(eras(root)).toEqual(['8', '16', '32', '64']);
    expect(root.querySelector('.bit-logo__suffix')).toHaveTextContent('-bit');
    expect(root.style.getPropertyValue('--bit-logo-interval')).toBe('5s');
  });

  it('freeze renders only the chosen era and stops the cycle', () => {
    render(<BitLogo freeze={32} />);
    const root = screen.getByRole('img');
    expect(eras(root)).toEqual(['32']);
    expect(root).not.toHaveAttribute('data-animated');
  });

  it('animated={false} renders only the first era', () => {
    render(<BitLogo animated={false} />);
    const root = screen.getByRole('img');
    expect(eras(root)).toEqual([String(ERAS[0])]);
    expect(root).not.toHaveAttribute('data-animated');
  });

  it('maps size, sets the interval variable, appends className last', () => {
    render(<BitLogo size="lg" interval={2} className="extra" />);
    const root = screen.getByRole('img');
    expect(root.className).toBe('bit-logo bit-lg extra');
    expect(root.style.getPropertyValue('--bit-logo-interval')).toBe('2s');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<BitLogo />);
    await expectNoA11yViolations(container);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @bit/react test -- BitLogo`
Expected: FAIL, cannot resolve `./BitLogo`.

- [ ] **Step 3: Write the component**

`packages/react/src/logo/BitLogo.tsx`:

```tsx
import { forwardRef } from 'react';
import type { CSSProperties, HTMLAttributes } from 'react';
import { SIZES } from '../system/axes';
import type { Size } from '../system/axes';
import { element, toClasses } from '../system/toClasses';

/** Console generations, in the order the logo cycles through them. */
export const ERAS = [8, 16, 32, 64] as const;
export type Era = (typeof ERAS)[number];

const sizes = SIZES;

export interface BitLogoProps extends HTMLAttributes<HTMLSpanElement> {
  size?: Size;
  /** Seconds each era stays on screen. Demo default is 5. */
  interval?: number;
  /** Set false to show a single static era (the first one). */
  animated?: boolean;
  /** Pin one era and stop cycling. A theme or version picker sets this. */
  freeze?: Era;
}

export const BitLogo = forwardRef<HTMLSpanElement, BitLogoProps>(function BitLogo(
  { size = 'md', interval = 5, animated = true, freeze, className, style, ...rest },
  ref,
) {
  const shown: readonly Era[] = freeze !== undefined ? [freeze] : animated ? ERAS : [ERAS[0]];
  const cycling = shown.length > 1;
  const cssVars = { ...style, '--bit-logo-interval': `${interval}s` } as CSSProperties;

  return (
    <span
      ref={ref}
      role="img"
      aria-label="bit"
      className={toClasses('logo', [{ name: 'size', allowed: sizes, value: size }], className)}
      data-animated={cycling ? '' : undefined}
      style={cssVars}
      {...rest}
    >
      <span className={element('logo', 'slot')} aria-hidden="true">
        {shown.map((era) => (
          <span key={era} className={element('logo', 'era')} data-era={era}>
            {era}
          </span>
        ))}
      </span>
      <span className={element('logo', 'suffix')} aria-hidden="true">
        -bit
      </span>
    </span>
  );
});
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm --filter @bit/react test -- BitLogo`
Expected: PASS. If the two `--bit-logo-interval` assertions fail because jsdom's `CSSStyleDeclaration` does not store custom properties, replace them with `expect(root.getAttribute('style')).toContain('--bit-logo-interval: 2s')` (and `5s`) and keep going.

- [ ] **Step 5: CSS, story, export**

`packages/core/src/components/logo.css`:

```css
/* BitLogo: "-bit" is fixed; the number cycles 8 → 16 → 32 → 64, each drawn in its era's type style.
   Transition: no fades. The outgoing number cuts out; the incoming one does the NES three-size grow. */
.bit-logo {
  --bit-logo-interval: 5s;
  display: inline-flex;
  align-items: baseline;
  gap: 0.12em;
  line-height: 1;
  white-space: nowrap;
  color: var(--bit-color-ink);
}

.bit-logo.bit-sm { font-size: var(--bit-text-2xl); }
.bit-logo.bit-md { font-size: calc(var(--bit-text-2xl) * 1.5); }
.bit-logo.bit-lg { font-size: calc(var(--bit-text-2xl) * 2.25); }

.bit-logo__slot {
  display: inline-grid;
  justify-items: end;
  align-items: baseline;
}

.bit-logo__era {
  grid-area: 1 / 1;
  display: inline-block;
  transform-origin: 50% 100%;
}

.bit-logo__suffix {
  font-family: var(--bit-font-display);
  letter-spacing: 0.01em;
}

/* ---------- era treatments (a theme may override any of these by selector) ---------- */

/* 8-bit: flat pixel type, one color */
.bit-logo__era[data-era="8"] {
  font-family: var(--bit-font-pixel);
  font-size: 0.72em;
  color: var(--bit-color-danger);
}

/* 16-bit: pixel type with three-band shading and a hard drop */
.bit-logo__era[data-era="16"] {
  font-family: var(--bit-font-pixel);
  font-size: 0.72em;
  background: linear-gradient(
    180deg,
    var(--bit-color-primary-soft) 0 34%,
    var(--bit-color-primary) 34% 67%,
    var(--bit-color-warning) 67% 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(2px 2px 0 var(--bit-color-ink));
}

/* 32-bit: chrome gradient with a bevel. The chrome is era-specific, so it is fixed rather than tokenized. */
.bit-logo__era[data-era="32"] {
  font-family: "Bungee", var(--bit-font-display);
  font-size: 0.98em;
  letter-spacing: 0.02em;
  background: linear-gradient(180deg, #ffffff 0%, #c9d8f0 38%, #3b5b8c 50%, #9db4d6 58%, #4e6fa3 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(1px 1px 0 #ffffff) drop-shadow(3px 3px 0 var(--bit-color-ink));
}

/* 64-bit: rounded display type, extruded */
.bit-logo__era[data-era="64"] {
  font-family: var(--bit-font-display);
  font-size: 1.04em;
  color: var(--bit-color-primary);
  -webkit-text-stroke: 1.5px var(--bit-color-ink);
  paint-order: stroke fill;
  text-shadow:
    1px 1px 0 var(--bit-color-primary-hover),
    2px 2px 0 var(--bit-color-primary-hover),
    3px 3px 0 var(--bit-color-primary-hover),
    4px 4px 0 var(--bit-color-primary-hover),
    5px 5px 0 var(--bit-color-ink),
    6px 6px 0 var(--bit-color-ink);
}

/* ---------- the cycle ---------- */
/* Four eras share one grid cell. Each owns a 25% window of a cycle four intervals long.
   Negative delays stagger them. step-end timing means no easing anywhere. */
.bit-logo[data-animated] .bit-logo__era {
  opacity: 0;
  animation: bit-logo-cycle calc(var(--bit-logo-interval) * 4) step-end infinite;
}

.bit-logo[data-animated] .bit-logo__era:nth-child(1) { animation-delay: calc(var(--bit-logo-interval) * -4); }
.bit-logo[data-animated] .bit-logo__era:nth-child(2) { animation-delay: calc(var(--bit-logo-interval) * -3); }
.bit-logo[data-animated] .bit-logo__era:nth-child(3) { animation-delay: calc(var(--bit-logo-interval) * -2); }
.bit-logo[data-animated] .bit-logo__era:nth-child(4) { animation-delay: calc(var(--bit-logo-interval) * -1); }

/* The grow occupies the first 4.8% of the cycle (≈1s at the 5s default) and mirrors @keyframes bit-power-up. */
@keyframes bit-logo-cycle {
  0%    { opacity: 1; transform: scale(0.5); }
  0.6%  { transform: scale(0.75); }
  1.2%  { transform: scale(1); }
  1.8%  { transform: scale(0.5); }
  2.4%  { transform: scale(0.75); }
  3.0%  { transform: scale(1); }
  3.6%  { transform: scale(0.5); }
  4.2%  { transform: scale(0.75); }
  4.8%  { opacity: 1; transform: scale(1); }
  25%   { opacity: 0; transform: scale(1); }
  100%  { opacity: 0; transform: scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .bit-logo[data-animated] .bit-logo__era { animation: none; }
  .bit-logo[data-animated] .bit-logo__era:first-child { opacity: 1; }
}
```

Append to `packages/core/src/index.css`: `@import "./components/logo.css";`

`packages/react/src/logo/BitLogo.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { BitLogo, ERAS } from './BitLogo';
import { SIZES } from '../system/axes';

const meta = {
  title: 'Brand/BitLogo',
  component: BitLogo,
  args: { size: 'md', interval: 5, animated: true },
  argTypes: {
    size: { control: 'select', options: SIZES },
    freeze: { control: 'select', options: [undefined, ...ERAS] },
    interval: { control: { type: 'number', min: 0.5, step: 0.5 } },
  },
} satisfies Meta<typeof BitLogo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Eras: Story = {
  name: 'The four eras (frozen)',
  render: (args) => (
    <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap', alignItems: 'baseline' }}>
      {ERAS.map((era) => (
        <BitLogo key={era} {...args} freeze={era} />
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 32 }}>
      {SIZES.map((size) => (
        <BitLogo key={size} {...args} size={size} freeze={64} />
      ))}
    </div>
  ),
};
```

Add to `packages/react/src/index.ts`:

```ts
export { BitLogo, ERAS } from './logo/BitLogo';
export type { BitLogoProps, Era } from './logo/BitLogo';
```

Run: `pnpm --filter @bit/core test && pnpm typecheck && pnpm storybook`
Expected: tests clean. In the browser at `Brand/BitLogo/Playground`: "-bit" stays put; the number pops in with the stepped grow (no fade), holds five seconds, cuts to the next. `Eras` shows red pixel 8, banded yellow 16, chrome 32, extruded yellow 64. Stop the dev server.

- [ ] **Step 6: Commit**

```bash
git add packages/core packages/react
git commit -m "feat: BitLogo with era treatments and power-up cycle"
```

---

### Task 14: Class-contract test over the public index

**Files:**
- Delete: `packages/react/src/index.test.ts`
- Create: `packages/react/src/index.test.tsx`

**Interfaces:**
- Consumes: every export of `packages/react/src/index.ts`.
- Produces: a guard that fails whenever a component's root class does not follow the naming rule (block = `bit-` + kebab-case export name; compound part = `bit-{parent}__{part}`; the `Bit` prefix of `BitLogo` is dropped). Also pins the exact export list.

- [ ] **Step 1: Replace the smoke test with the contract test**

Delete `packages/react/src/index.test.ts`. Create `packages/react/src/index.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import type { ComponentType } from 'react';
import * as lib from './index';

const kebab = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

function isComponent(value: unknown): value is ComponentType<Record<string, unknown>> {
  return typeof value === 'function' || (typeof value === 'object' && value !== null && '$$typeof' in value);
}

const componentNames = Object.keys(lib).filter((name) => /^[A-Z]/.test(name) && isComponent((lib as Record<string, unknown>)[name]));

/** The naming rule from the spec, as code. */
function expectedRootClass(name: string): string {
  const parent = componentNames
    .filter((candidate) => candidate !== name && name.startsWith(candidate))
    .sort((a, b) => b.length - a.length)[0];
  if (parent) return `bit-${kebab(parent)}__${kebab(name.slice(parent.length))}`;
  return `bit-${kebab(name.replace(/^Bit/, ''))}`;
}

describe('public index', () => {
  it('exports exactly the Phase 1 components', () => {
    expect(componentNames.sort()).toEqual(
      ['Alert', 'Badge', 'BitLogo', 'Button', 'Card', 'CardBody', 'CardFooter', 'CardHeader', 'Spinner', 'Stack', 'Text'].sort(),
    );
  });

  it('exports the prefix and axes', () => {
    expect(lib.PREFIX).toBe('bit');
    expect(lib.TONES).toHaveLength(5);
    expect(lib.VARIANTS).toEqual(['solid', 'outline', 'ghost']);
    expect(lib.SIZES).toEqual(['sm', 'md', 'lg']);
  });

  it.each(componentNames)('%s renders the root class the naming rule predicts', (name) => {
    const Component = (lib as Record<string, unknown>)[name] as ComponentType<Record<string, unknown>>;
    const { container } = render(<Component aria-label="x">x</Component>);
    const root = container.firstElementChild;
    expect(root).not.toBeNull();
    expect(root!.classList.contains(expectedRootClass(name))).toBe(true);
  });
});
```

- [ ] **Step 2: Run the whole suite with coverage**

Run: `pnpm --filter @bit/react test:coverage`
Expected: PASS, and the coverage summary shows every threshold at or above 80%. If a file is under, add a test for the uncovered branch rather than lowering the threshold.

- [ ] **Step 3: Commit**

```bash
git add packages/react
git commit -m "test: class-contract test pins the naming rule and the export list"
```

---

### Task 15: Build and verify the consumer package

**Files:**
- Create: `packages/react/scripts/verify-dist.mjs`
- Modify: `packages/react/package.json` (add `verify` script), root `package.json` (add `verify` script)

**Interfaces:**
- Consumes: `tsup.config.ts` and `scripts/build-css.mjs` from Task 1; every export from Task 14.
- Produces: `pnpm build && pnpm verify` proves `dist/` has ESM, CJS, types, `styles.css`, and `themes/power-up.css`, and that the CJS entry exposes every component. This is the "three import lines work" contract from the spec.

- [ ] **Step 1: Write the verification script**

`packages/react/scripts/verify-dist.mjs`:

```js
// Proves the built package is consumable: ESM + CJS entries, types, bundled CSS, theme files.
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const dist = resolve(dirname(fileURLToPath(import.meta.url)), '../dist');
const require = createRequire(import.meta.url);

const EXPECTED = ['Alert', 'Badge', 'BitLogo', 'Button', 'Card', 'CardBody', 'CardFooter', 'CardHeader', 'Spinner', 'Stack', 'Text'];

// 1. CJS entry
const cjs = require(resolve(dist, 'index.cjs'));
for (const name of EXPECTED) assert.ok(cjs[name], `CJS export missing: ${name}`);
assert.equal(cjs.PREFIX, 'bit');

// 2. ESM entry
const esm = await import(resolve(dist, 'index.js'));
for (const name of EXPECTED) assert.ok(esm[name], `ESM export missing: ${name}`);

// 3. Types
const dts = readFileSync(resolve(dist, 'index.d.ts'), 'utf8');
for (const name of ['ButtonProps', 'BitLogoProps', 'Tone', 'Variant', 'Size']) {
  assert.ok(dts.includes(name), `index.d.ts missing type: ${name}`);
}

// 4. CSS bundle: system layer + every component, no unresolved local imports
const css = readFileSync(resolve(dist, 'styles.css'), 'utf8');
for (const needle of ['.bit-primary', '--_bit-tone', '.bit-sm', '@keyframes bit-power-up', '.bit-button', '.bit-badge', '.bit-alert', '.bit-card__header', '.bit-stack', '.bit-text', '.bit-spinner', '.bit-logo']) {
  assert.ok(css.includes(needle), `styles.css missing: ${needle}`);
}
assert.ok(!/@import\s+"\.\//.test(css), 'styles.css still contains a relative @import (bundling failed)');

// 5. Themes copied, not bundled (they keep their Google Fonts @import)
const theme = resolve(dist, 'themes/power-up.css');
assert.ok(existsSync(theme), 'themes/power-up.css missing');
assert.ok(readFileSync(theme, 'utf8').includes('--bit-color-primary'), 'theme lost its tokens');

console.log(`dist OK: ${EXPECTED.length} components, styles.css ${css.length} bytes, themes present`);
```

Add to `packages/react/package.json` scripts: `"verify": "node scripts/verify-dist.mjs"`.
Add to root `package.json` scripts: `"verify": "pnpm --filter @bit/react verify"`.

- [ ] **Step 2: Build and verify**

Run: `pnpm build && pnpm verify`
Expected: tsup reports `index.js`, `index.cjs`, `index.d.ts`; esbuild writes `dist/styles.css`; the script prints `dist OK: 11 components …`.

If tsup's dts step fails to resolve `@bit/core/tokens`, add `"paths": { "@bit/core/tokens": ["../core/src/tokens.ts"] }` to `packages/react/tsconfig.json` `compilerOptions` and re-run.

- [ ] **Step 3: Commit**

```bash
git add packages/react package.json
git commit -m "chore(react): dist verification script"
```

---

### Task 16: Animated SVG logo for the README

**Files:**
- Create: `scripts/build-logo-svg.mjs`
- Create (generated): `assets/bit-logo.svg`
- Modify: root `package.json` (devDependencies for the three fontsource packages, `logo:svg` script)

**Interfaces:**
- Consumes: the era treatments and cycle timing from Task 13 (re-expressed in SVG), power-up hex values from Task 2.
- Produces: `pnpm logo:svg` writes `assets/bit-logo.svg`, a self-contained SVG (fonts embedded as base64 `@font-face`, CSS animation inline) that GitHub renders animated inside an `<img>`.

- [ ] **Step 1: Add fonts and the script entry**

Root `package.json` additions:

```json
"scripts": { "logo:svg": "node scripts/build-logo-svg.mjs" },
"devDependencies": {
  "@fontsource/bungee": "^5.3.0",
  "@fontsource/lilita-one": "^5.3.0",
  "@fontsource/press-start-2p": "^5.3.0"
}
```

Run `pnpm install`.

- [ ] **Step 2: Write the generator**

`scripts/build-logo-svg.mjs`:

```js
// Generates assets/bit-logo.svg: the #-bit wordmark with the power-up cycle, fully self-contained.
// Fonts are read from the @fontsource packages and embedded as base64 so GitHub can render it in an <img>.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

// power-up theme values (kept in sync by hand; this is a static brand asset)
const INK = '#1B1B2F';
const PRIMARY = '#FFCC00';
const PRIMARY_SOFT = '#FFF3BF';
const PRIMARY_HOVER = '#E0B000';
const WARNING = '#F5A623';
const DANGER = '#D42B26';
const CREAM = '#F5EEDC';

const INTERVAL_S = 5;
const CYCLE_S = INTERVAL_S * 4;

function fontFace(family, pkg, file) {
  const path = require.resolve(`${pkg}/files/${file}`);
  const b64 = readFileSync(path).toString('base64');
  return `@font-face{font-family:"${family}";src:url(data:font/woff2;base64,${b64}) format("woff2");font-weight:400;font-style:normal}`;
}

const fonts = [
  fontFace('Press Start 2P', '@fontsource/press-start-2p', 'press-start-2p-latin-400-normal.woff2'),
  fontFace('Lilita One', '@fontsource/lilita-one', 'lilita-one-latin-400-normal.woff2'),
  fontFace('Bungee', '@fontsource/bungee', 'bungee-latin-400-normal.woff2'),
].join('\n');

// Layout: numbers right-aligned at x=150, suffix starts at x=160, baseline y=86.
const X = 150;
const Y = 86;

const eras = [
  // 8-bit: flat pixel red
  `<g class="era"><text x="${X}" y="${Y - 3}" text-anchor="end" font-family="Press Start 2P" font-size="46" fill="${DANGER}">8</text></g>`,
  // 16-bit: banded fill + hard ink drop
  `<g class="era">
    <text x="${X + 2}" y="${Y - 1}" text-anchor="end" font-family="Press Start 2P" font-size="46" fill="${INK}">16</text>
    <text x="${X}" y="${Y - 3}" text-anchor="end" font-family="Press Start 2P" font-size="46" fill="url(#g16)">16</text>
  </g>`,
  // 32-bit: chrome gradient + white lip + ink drop
  `<g class="era">
    <text x="${X + 3}" y="${Y + 3}" text-anchor="end" font-family="Bungee" font-size="62" fill="${INK}">32</text>
    <text x="${X + 1}" y="${Y + 1}" text-anchor="end" font-family="Bungee" font-size="62" fill="#ffffff">32</text>
    <text x="${X}" y="${Y}" text-anchor="end" font-family="Bungee" font-size="62" fill="url(#g32)">32</text>
  </g>`,
  // 64-bit: extruded rounded type with ink stroke
  `<g class="era">
    ${[6, 5].map((o) => `<text x="${X + o}" y="${Y + o}" text-anchor="end" font-family="Lilita One" font-size="66" fill="${INK}">64</text>`).join('')}
    ${[4, 3, 2, 1].map((o) => `<text x="${X + o}" y="${Y + o}" text-anchor="end" font-family="Lilita One" font-size="66" fill="${PRIMARY_HOVER}">64</text>`).join('')}
    <text x="${X}" y="${Y}" text-anchor="end" font-family="Lilita One" font-size="66" fill="${PRIMARY}" stroke="${INK}" stroke-width="3" paint-order="stroke fill">64</text>
  </g>`,
];

const delays = eras.map((_, i) => `.era:nth-of-type(${i + 1}){animation-delay:${-(4 - i) * INTERVAL_S}s}`).join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 110" width="320" height="110" role="img" aria-label="bit">
<style>
${fonts}
.era{opacity:0;transform-box:fill-box;transform-origin:50% 100%;animation:cycle ${CYCLE_S}s step-end infinite}
${delays}
@keyframes cycle{
0%{opacity:1;transform:scale(.5)}0.6%{transform:scale(.75)}1.2%{transform:scale(1)}
1.8%{transform:scale(.5)}2.4%{transform:scale(.75)}3%{transform:scale(1)}
3.6%{transform:scale(.5)}4.2%{transform:scale(.75)}4.8%{opacity:1;transform:scale(1)}
25%{opacity:0;transform:scale(1)}100%{opacity:0;transform:scale(1)}}
@media (prefers-reduced-motion:reduce){.era{animation:none}.era:first-of-type{opacity:1}}
</style>
<defs>
  <linearGradient id="g16" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${PRIMARY_SOFT}"/><stop offset=".34" stop-color="${PRIMARY_SOFT}"/>
    <stop offset=".34" stop-color="${PRIMARY}"/><stop offset=".67" stop-color="${PRIMARY}"/>
    <stop offset=".67" stop-color="${WARNING}"/><stop offset="1" stop-color="${WARNING}"/>
  </linearGradient>
  <linearGradient id="g32" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#ffffff"/><stop offset=".38" stop-color="#c9d8f0"/>
    <stop offset=".5" stop-color="#3b5b8c"/><stop offset=".58" stop-color="#9db4d6"/><stop offset="1" stop-color="#4e6fa3"/>
  </linearGradient>
</defs>
<rect width="320" height="110" rx="14" fill="${CREAM}" stroke="${INK}" stroke-width="3"/>
${eras.join('\n')}
<text x="160" y="${Y}" font-family="Lilita One" font-size="64" fill="${INK}">-bit</text>
</svg>
`;

mkdirSync(resolve(root, 'assets'), { recursive: true });
writeFileSync(resolve(root, 'assets/bit-logo.svg'), svg);
console.log(`wrote assets/bit-logo.svg (${(svg.length / 1024).toFixed(0)} KB)`);
```

- [ ] **Step 3: Generate and check**

Run:

```bash
pnpm logo:svg
grep -c '<g class="era">' assets/bit-logo.svg
grep -c '@font-face' assets/bit-logo.svg
open assets/bit-logo.svg
```

Expected: `4`, `3`, and the browser shows the cream badge with the number cycling every five seconds using the stepped grow and no fades, "-bit" fixed. If a number overlaps the suffix, adjust `X` or the per-era `font-size` in the script and re-run.

- [ ] **Step 4: Commit**

```bash
git add scripts assets package.json pnpm-lock.yaml
git commit -m "feat: animated SVG logo export for the README"
```

---

### Task 17: README, CONTRIBUTING, CI, and the public repo

**Files:**
- Create: `README.md`, `CONTRIBUTING.md`, `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: everything above.
- Produces: the repo a stranger can read, and CI that runs typecheck, lint, both test suites (coverage gate), build + verify, and the Storybook build on every push and pull request.

- [ ] **Step 1: Write the README**

`README.md`:

````markdown
<p align="center"><img src="assets/bit-logo.svg" width="320" alt="bit"></p>

# bit

A React design system for people who are new to design systems. One vocabulary everywhere: the prop you type is the class it emits is the token it reads.

```tsx
<Button tone="primary" size="lg">Save</Button>
// renders: <button class="bit-button bit-primary bit-solid bit-lg">
// reads:   --bit-color-primary, --bit-control-height-lg
```

Themes are swappable and named after retro-game eras. The first theme is **power-up**.

## Install

The packages are workspace-private for now. Clone the repo and run Storybook:

```bash
pnpm install
pnpm storybook
```

When published, using it will be three lines:

```tsx
import '@bit/react/styles.css';
import '@bit/react/themes/power-up.css';
import { Button } from '@bit/react';
```

## The naming rule

| You write | Class | Token |
| --- | --- | --- |
| `tone="primary"` | `bit-primary` | `--bit-color-primary` |
| `variant="outline"` | `bit-outline` | (per component CSS) |
| `size="lg"` | `bit-lg` | `--bit-control-height-lg` |
| `<CardHeader>` | `bit-card__header` | |

Three axes, same names on every component that has them:

- `tone`: `primary` `neutral` `success` `warning` `danger`
- `variant`: `solid` `outline` `ghost`
- `size`: `sm` `md` `lg`

Booleans are attributes, never classes: `disabled`, `aria-invalid`, `data-loading`.

## Two ways to use every static component

```tsx
<Card><CardHeader>Stats</CardHeader></Card>
<div className="bit-card bit-solid"><div className="bit-card__header">Stats</div></div>
```

Both render identically. For interactive components (coming in Phase 3) the classes give the look; the React component gives the keyboard and screen-reader behavior.

## Components (Phase 1)

Button, Badge, Alert, Card (+ CardHeader, CardBody, CardFooter), Stack, Text, Spinner, BitLogo.

## Themes

A theme is one CSS file that fills in every semantic token. Switch with an attribute:

```html
<html data-theme="power-up">
```

Adding a theme: copy `packages/core/src/themes/power-up.css`, change the values, run `pnpm --filter @bit/core test`. The test fails if any token is missing or any tone fails WCAG AA contrast.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm storybook` | component docs on http://localhost:6006 |
| `pnpm test` | all unit, a11y, and system tests |
| `pnpm test:coverage` | react tests with the 80% gate |
| `pnpm build && pnpm verify` | build `@bit/react` and prove the dist is consumable |
| `pnpm logo:svg` | regenerate `assets/bit-logo.svg` |

## Docs

- Design spec: `docs/superpowers/specs/2026-09-06-bit-design-system-design.md`
- Contributing recipes: `CONTRIBUTING.md`

MIT.
````

- [ ] **Step 2: Write CONTRIBUTING**

`CONTRIBUTING.md`:

````markdown
# Contributing to bit

Every change follows the same shape: write the failing test, make it pass, add the story, commit with `<type>: <description>`.

## Add a component

1. `packages/core/src/components/<name>.css`: styles that read only `--bit-*` tokens and the private `--_bit-tone-*` / `--_bit-size-*` variables. Add `@import "./components/<name>.css";` to `packages/core/src/index.css` (the system test fails if you forget).
2. `packages/react/src/components/<Name>/<Name>.test.tsx`: copy `Button.test.tsx`, keep the same checks (root class, decorators, className last, ref, a11y).
3. `packages/react/src/components/<Name>/<Name>.tsx`: `forwardRef`, a `const` per supported axis at the top, `toClasses('<kebab-name>', axes, className)`, spread `...rest` on the root.
4. `packages/react/src/components/<Name>/<Name>.stories.tsx`: `Playground` plus one story per axis.
5. Export from `packages/react/src/index.ts` and add the name to the list in `index.test.tsx`.

The class-contract test checks that `<Name>` renders `bit-<kebab-name>`, and `<Parent><Part>` renders `bit-<parent>__<part>`.

## Add a value to an axis on one component

Add it to that component's `const` (for example `variants`) and add a `.bit-<component>.bit-<value> { }` rule in its CSS file. That is the whole change.

## Add a tone to the whole system

1. Four tokens in every theme: `--bit-color-<tone>`, `-contrast`, `-hover`, `-soft`.
2. One rule in `packages/core/src/system/tones.css`.
3. Add the word to `TONES` in `packages/core/src/tokens.ts`.

The contrast test verifies the new tone's text is readable on its fill.

## Add a theme

Copy `packages/core/src/themes/power-up.css` to `<theme>.css`, change the tier-1 palette and any tier-2 values, keep every token name. Add it to `THEMES` in `apps/docs/.storybook/preview.ts` with a CSS import. Run `pnpm --filter @bit/core test`.

## Conventions

- Classes: `bit-block`, `bit-block__element`, `bit-value`. No `--modifier` classes, no camelCase.
- Booleans are attributes, never classes.
- Components never import CSS; the app does, once.
- Theme names describe a look, not a trademark.
````

- [ ] **Step 3: Write the CI workflow**

`.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9.15.9
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm --filter @bit/core test
      - run: pnpm test:coverage
      - run: pnpm build && pnpm verify
      - run: pnpm storybook:build
```

- [ ] **Step 4: Run the full local equivalent of CI**

```bash
pnpm typecheck && pnpm lint && pnpm --filter @bit/core test && pnpm test:coverage && pnpm build && pnpm verify && pnpm storybook:build
```

Expected: every step clean.

- [ ] **Step 5: Commit**

```bash
git add README.md CONTRIBUTING.md .github
git commit -m "docs: README, contributing recipes, and CI workflow"
```

- [ ] **Step 6: Publish the repo (ask the user first; this is outward-facing)**

```bash
gh repo create doosemavis/bit-design-system --public --source=. --description "A React design system for people new to design systems. Retro-game themes. One vocabulary everywhere." --push
```

Expected: the repo exists, `main` is pushed, and the CI workflow starts. Confirm the README shows the animated logo.

---

## Self-review

**Spec coverage** (spec section → task):

| Spec | Task |
| --- | --- |
| §2 naming rule, prefix, class grammar | 4 (toClasses/element), 14 (contract test), README |
| §2.3 two ways to use a component | Button/Card `PlainHtml` stories, README |
| §3.1–3.2 tiers, complete token list | 2 (`tokens.ts` = 67 names, theme, completeness test) |
| §3.3 tier 3 empty | no component tokens anywhere; verified by the "no unknown --bit- tokens" test |
| §3.4 global tone/size remaps, per-component variants | 3 (tones.css, sizes.css), 6–12 |
| §4.1 axes and per-component constants | 4, 6–13 |
| §4.2 always-emit defaults, className last, ref, rest, booleans as attributes, compound exports, native `size` shadowing, data-attrs for layout, dev warning | 4 (warning), 6–13 (each test asserts these), 10 (Stack data attrs) |
| §4.3 Phase 1 components: Button, Badge, Alert, Card, Stack, Text, Spinner, BitLogo | 6, 7, 8, 9, 10, 11, 12, 13 |
| §5 theming: one file, `:root` + `[data-theme]`, fonts in theme, effects as tokens, completeness test, dark mode reserved | 2, 5 (toolbar), README/CONTRIBUTING |
| §6 package layout, tsup, exports map, sideEffects, peer deps, private flag | 1, 15 |
| §7 BitLogo eras, A2 transition, 5s, `freeze`, reduced motion, SVG export | 13, 16 |
| §8 tests: per-component checklist, axe, completeness, contrast, class contract, 80% coverage | 2, 4, 6–14 |
| §10 MIT, README with logo and install, CONTRIBUTING recipes, CI, `.superpowers/` ignored | 1, 17 (gitignore already committed) |

**Deviations and clarifications, all deliberate:**

- Text supports `tone="neutral"` only in v1 (spec table said "muted via tone neutral"); other tones would fail contrast on the cream page.
- Alert defaults to `variant="outline"`, Spinner to `tone="primary"`; the spec left both defaults open.
- axe's `color-contrast` rule is disabled in jsdom (no layout engine). The spec's "contrast failures fail the build" is satisfied numerically by `contrast.test.ts` in core.
- `--bit-motion-power-up` names the standalone 1s grow keyframe; the logo embeds the same steps in its own cycle keyframe because CSS cannot compose keyframes.
- The 32-bit chrome gradient is hardcoded (era-specific, not a theme value); a theme may override it by selector.
- `@bit/core` exports point at `src/` because it is workspace-only in v1; `@bit/react`'s build inlines it, so consumers never install core.

**Placeholder scan:** none. **Type consistency:** `toClasses(block, axes, className)`, `element(block, part)`, `withClassName(base, className)`, `expectNoA11yViolations(container)`, `ERAS`, `Era`, `SpaceStep`, `TextSize` are used with the same names and signatures in every task that references them.
