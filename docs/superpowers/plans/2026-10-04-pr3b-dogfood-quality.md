# PR3b: Dogfood and Quality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The gallery is built only from bit and guarded so it stays that way, every page passes axe in light and dark, and the PR2 component follow-ups are closed.

**Architecture:**
- Core CSS and React component fixes land first, each test-first.
- Playwright and axe then record a baseline against the production build.
- Next, the gallery's hand-built controls and cards are rebuilt on bit components.
- Last, an ESLint raw-tag ban and a postcss-based `gallery.css` exceptions test lock the result in.

**Tech Stack:**
- pnpm 9 workspace, TypeScript 5.9, React 19
- Vite 7, Vitest, Testing Library
- ESLint 9 flat config, postcss, Playwright 1.56, `@axe-core/playwright`

**Spec:** `docs/superpowers/specs/2026-10-04-pr3b-dogfood-quality-design.md`. Read it, including the **Amendments** section at the end.

## Global Constraints

- Branch `feat/pr3b-dogfood-quality`.
- Commit messages: `<type>(<scope>): <description>`, ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Components read only tier-2 tokens (`--bit-color-*` and so on), never `--bit-palette-*`. A new dark hex value is added as a palette token first.
- The react package keeps **100%** coverage (`pnpm test:coverage`).
- Test counts only go up: core ≥ 459, react ≥ 410, gallery ≥ 494.
- States are attributes, never classes (`[aria-invalid="true"]`, `[data-striped]`).
- Never edit a row of `packages/core/src/__tests__/light-frozen.test.ts` to make a test pass. Adding a **new** token to light is allowed, and the frozen rows must stay green.
- Copy and comments in plain English: short sentences, no idioms.
- Visual source of truth: `~/.gstack/projects/doosemavis-bit-design-system/designs/pr3b-20261004/board.html` (the options marked "recommended" are the approved ones).
- Run commands from the repo root unless a step says otherwise. Build the library before gallery tests: `pnpm build`.

## Review Focus

1. **Warning Alert (ink text) with a neutral Link inside.** The Link must take the ink text colour too, not stay body text by accident. Task 1 tests the selector without a colour class.
2. **A Table that starts narrow and overflows after a resize** (or the reverse). The wrapper must gain or lose its Tab stop when the `ResizeObserver` fires. Task 4 tests both directions.
3. **`announce()` called twice with the same message,** and called where there is no `document`. It must re-announce, and it must not throw. Task 3 tests both.
4. **Comparisons with and without spaces.** `a < b` and `i<n` in JS must not start a JSX tag, and JSX after `return (`, `=>`, `&&` and `?` must still be a tag. Task 5 tests both.
5. **A key with a comma selector or an at-rule in the CSS guard.** `a, b { color }` and `@media (forced-colors: active) { .x { background } }` must each match their exception exactly. Unrelated rules with the same property must not match. Task 9 tests both.

---

### Task 1: Link colour in solid Alerts, and the dark hover underline (core CSS)

**Files:**
- Modify: `packages/core/src/components/link.css`
- Test: `packages/core/src/__tests__/components/link.test.ts`

**Interfaces:**
- Consumes: the existing `.bit-link`, `.bit-alert.bit-solid` and `[data-mode="dark"]` conventions
- Produces: CSS only

- [ ] **Step 1: Write the failing tests.** Append inside the `describe` in `link.test.ts`:

```ts
  it('inside a solid Alert, every Link takes the Alert text colour, visited or not (Q1-A)', () => {
    const body = block(css, '.bit-alert.bit-solid .bit-link,\n.bit-alert.bit-solid .bit-link:visited');
    expect(body).toContain('color: inherit;');
  });

  it('inside a solid Alert, hover is a 4px underline with no highlight', () => {
    const body = block(css, '.bit-alert.bit-solid .bit-link:hover')!;
    expect(body).toContain('background: none;');
    expect(body).toContain('text-decoration-thickness: 4px;');
  });

  it('the solid-Alert rules come after the colour rules, so they win at equal or higher specificity', () => {
    expect(css.indexOf('.bit-alert.bit-solid .bit-link')).toBeGreaterThan(css.indexOf('.bit-link.bit-neutral:hover'));
  });

  it('in dark mode the hover underline turns the accent (Q3b-A)', () => {
    expect(block(css, '[data-mode="dark"] .bit-link:hover')).toContain('text-decoration-color: var(--bit-color-accent);');
  });
```

- [ ] **Step 2: Run them and check they fail.** Run `pnpm --filter @bit-ds/core test -- link`. Expected: the 4 new tests fail (`block` returns null).

- [ ] **Step 3: Implement.** Append to `link.css`:

```css

/* Inside a solid Alert the Link takes the Alert's text colour (white, or ink on yellow), so its
   contrast is whatever the Alert already passes. Hover thickens the underline; no highlight. */
.bit-alert.bit-solid .bit-link,
.bit-alert.bit-solid .bit-link:visited {
  color: inherit;
}

.bit-alert.bit-solid .bit-link:hover {
  background: none;
  text-decoration-thickness: 4px;
}

/* Dark: the hover highlight is faint on the night surfaces, so the underline turns the accent. */
[data-mode="dark"] .bit-link:hover {
  text-decoration-color: var(--bit-color-accent);
}
```

Specificity check: `.bit-alert.bit-solid .bit-link:hover` (0,4,0) beats `.bit-link.bit-primary:hover` (0,3,0). `.bit-alert.bit-solid .bit-link` (0,3,0) ties with `.bit-link.bit-primary:visited`, and wins because it comes later.

- [ ] **Step 4: Run the tests and check they pass.** Run `pnpm --filter @bit-ds/core test`. Expected: all pass (≥ 463).

- [ ] **Step 5: Commit.**

```bash
git add packages/core/src/components/link.css packages/core/src/__tests__/components/link.test.ts
git commit -m "fix(core): Link takes the solid Alert's text colour; dark hover underline in accent

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: The stripe token and the forced-colours invalid edge (core CSS and tokens)

**Files:**
- Modify: `packages/core/src/themes/power-up.css` (a palette token, a light semantic token and a dark override)
- Modify: `packages/core/src/tokens.ts` (`pr2ColorTokens` or `colorTokens`, and `MODE_TOKENS`)
- Modify: `packages/core/src/components/table.css`, `input.css`, `select.css`
- Test: `packages/core/src/__tests__/components/table.test.ts`, `input.test.ts`, `select.test.ts`, `contrast.test.ts`

**Interfaces:**
- Produces: the token `--bit-color-stripe`, present in `SEMANTIC_TOKENS` and `MODE_TOKENS`. The gallery Tokens page picks it up automatically.

- [ ] **Step 1: Write the failing tests.**

In `table.test.ts`:

```ts
  it('stripes read the stripe token, not neutral-soft (Q3a-A)', () => {
    const body = block(css, '.bit-table[data-striped] .bit-table__body .bit-table__row:nth-child(even)')!;
    expect(body).toContain('background: var(--bit-color-stripe);');
  });
```

In `input.test.ts`, and in `select.test.ts` with `.bit-select__control`:

```ts
  it('in forced colours an invalid field gets a 10px start edge, since the red border is gone (Q2-A)', () => {
    expect(css).toMatch(
      /@media \(forced-colors: active\) \{[^@]*\.bit-input\[aria-invalid="true"\] \{\s*border-inline-start-width: 10px;\s*\}/,
    );
  });
```

In `contrast.test.ts`, following the file's existing style for reading the dark map (look at how it gets `dark` from `themeModes`):

```ts
  it('dark stripes step off the surface like light does, and keep text readable', () => {
    const stripe = resolveVar(dark, '--bit-color-stripe');
    const surface = resolveVar(dark, '--bit-color-surface');
    expect(stripe).toBe('#353545');
    // Light's stone on white is 1.36:1; dark #353545 on #20202A is 1.34:1.
    expect(contrastRatio(stripe, surface)).toBeGreaterThanOrEqual(1.3);
    expect(contrastRatio(resolveVar(dark, '--bit-color-text'), stripe)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(resolveVar(dark, '--bit-color-text-muted'), stripe)).toBeGreaterThanOrEqual(4.5);
  });

  it('light stripes are stone', () => {
    expect(resolveVar(light, '--bit-color-stripe')).toBe('#DCDED6');
  });
```

- [ ] **Step 2: Run them and check they fail.** Run `pnpm --filter @bit-ds/core test`. Expected: the new tests fail.

- [ ] **Step 3: Implement.**

`power-up.css`, palette block, next to the other `night` entries:

```css
  --bit-palette-night-stripe: #353545;
```

The light semantic block, beside `--bit-color-neutral-soft`:

```css
  --bit-color-stripe: var(--bit-palette-stone);
```

The `[data-mode="dark"]` block, beside `--bit-color-neutral-soft`:

```css
  --bit-color-stripe: var(--bit-palette-night-stripe);
```

`tokens.ts`:
- add `token('color', 'stripe')` to the colour token group that holds `neutral-soft`'s siblings (`pr2ColorTokens` or `colorTokens`, whichever lists PR2 colours)
- add `token('color', 'stripe')` to `MODE_TOKENS` after `token('color', 'neutral', 'soft')`

`table.css`:

```css
.bit-table[data-striped] .bit-table__body .bit-table__row:nth-child(even) {
  background: var(--bit-color-stripe);
}
```

Append to `input.css`:

```css

/* Forced colours replace the danger border with the system text colour, so invalid needs a shape. */
@media (forced-colors: active) {
  .bit-input[aria-invalid="true"] {
    border-inline-start-width: 10px;
  }
}
```

Append the same to `select.css`, with `.bit-select__control[aria-invalid="true"]`.

- [ ] **Step 4: Run the tests and check they pass.** Run `pnpm --filter @bit-ds/core test`. Expected: all pass, including `theme-completeness`, `light-frozen` and `tokens`. If a test lists the exact count of semantic or mode tokens, update the count and say so in the report.

- [ ] **Step 5: Run the react tests.** Run `pnpm --filter @bit-ds/react test`. Expected: pass. If a token snapshot or count test fails because of the new token, update it.

- [ ] **Step 6: Commit.**

```bash
git add packages/core packages/react
git commit -m "feat(core): --bit-color-stripe token for Table stripes; forced-colours invalid edge on Input and Select

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: `announce()`, and Copy buttons named from their label (react and gallery)

**Files:**
- Create: `packages/react/src/system/announce.ts`, `packages/react/src/system/announce.test.ts`
- Modify: `packages/react/src/components/CodeBlock/CopyButton.tsx`, `CodeBlock.tsx`, `CodeBlock.test.tsx`
- Modify: `packages/react/src/index.ts` (export `announce`)
- Modify: `packages/core/src/system/reset.css` and `packages/core/src/__tests__/system.test.ts` (the `.bit-visually-hidden` utility)
- Modify: `packages/core/src/components/code-block.css`, and the core test, only if `.bit-code__status` styles exist and become unused
- Modify: `apps/gallery/src/ui/CopyButton.tsx`, `apps/gallery/src/ui/CopyButton.test.tsx`

**Interfaces:**
- Produces: `export function announce(message: string): void` from `@bit-ds/react`, and the constant `ANNOUNCER_ID = 'bit-announcer'` (exported from `system/announce.ts`, not from the package index)
- Produces: CodeBlock's `CopyButton` takes `{ code: string; name: string }`, where `name` is the thing copied, for example "shell code" or "Install command"

- [ ] **Step 1: Write the failing `announce` tests** in `packages/react/src/system/announce.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ANNOUNCER_ID, announce } from './announce';

afterEach(() => {
  document.getElementById(ANNOUNCER_ID)?.remove();
  vi.useRealTimers();
});

describe('announce', () => {
  it('creates one polite, visually hidden live region at the end of body', () => {
    vi.useFakeTimers();
    announce('Copied');
    vi.runAllTimers();
    const region = document.getElementById(ANNOUNCER_ID)!;
    expect(region.getAttribute('aria-live')).toBe('polite');
    expect(region.getAttribute('role')).toBe('status');
    expect(region.className).toBe('bit-visually-hidden');
    expect(document.body.lastElementChild).toBe(region);
    expect(region.textContent).toBe('Copied');
  });

  it('reuses the same region for every message', () => {
    vi.useFakeTimers();
    announce('Copied');
    announce('Copy failed');
    vi.runAllTimers();
    expect(document.querySelectorAll(`#${ANNOUNCER_ID}`)).toHaveLength(1);
    expect(document.getElementById(ANNOUNCER_ID)!.textContent).toBe('Copy failed');
  });

  it('clears first, so the same message twice is announced twice', () => {
    vi.useFakeTimers();
    announce('Copied');
    vi.runAllTimers();
    announce('Copied');
    expect(document.getElementById(ANNOUNCER_ID)!.textContent).toBe('');
    vi.runAllTimers();
    expect(document.getElementById(ANNOUNCER_ID)!.textContent).toBe('Copied');
  });

  it('does nothing without a document (server rendering)', () => {
    const original = globalThis.document;
    // @ts-expect-error: simulating a server
    delete globalThis.document;
    try {
      expect(() => announce('Copied')).not.toThrow();
    } finally {
      globalThis.document = original;
    }
  });
});
```

- [ ] **Step 2: Run it and check it fails.** Run `pnpm --filter @bit-ds/react test -- announce`. Expected: FAIL (module not found).

- [ ] **Step 3: Implement `announce.ts`.**

```ts
/** The id of the one live region every bit announcement uses. */
export const ANNOUNCER_ID = 'bit-announcer';

/** How long the region stays empty before the new text goes in, so a repeated message is re-read. */
const CLEAR_MS = 50;

let pending: ReturnType<typeof setTimeout> | undefined;

function region(): HTMLElement {
  const existing = document.getElementById(ANNOUNCER_ID);
  if (existing) return existing;
  const created = document.createElement('div');
  created.id = ANNOUNCER_ID;
  created.className = 'bit-visually-hidden';
  created.setAttribute('role', 'status');
  created.setAttribute('aria-live', 'polite');
  document.body.append(created);
  return created;
}

/**
 * Says `message` to screen readers through one shared, visually hidden live region. Many Copy buttons
 * on a page share it, so there is never a pile of live regions. Safe to call during server rendering.
 */
export function announce(message: string): void {
  if (typeof document === 'undefined') return;
  const target = region();
  target.textContent = '';
  clearTimeout(pending);
  pending = setTimeout(() => {
    target.textContent = message;
  }, CLEAR_MS);
}
```

Then add the `.bit-visually-hidden` utility rule to `packages/core/src/system/reset.css`, if no equivalent exists (check first with `grep -rn visually-hidden packages/core/src`):

```css
/* Hidden from sight, still read by screen readers. Used by announce(). */
.bit-visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
```

Add a core test for it in `packages/core/src/__tests__/system.test.ts`:

```ts
  it('ships a visually-hidden utility for announce()', () => {
    const body = block(readCss('system/reset.css'), '.bit-visually-hidden')!;
    expect(body).toContain('clip-path: inset(50%);');
    expect(body).toContain('position: absolute;');
  });
```

Import `block` there if needed.

Export it from `packages/react/src/index.ts`, near the mode exports:

```ts
export { announce } from './system/announce';
```

If an exports-list test (such as a public-API snapshot) fails, add `announce` to it.

- [ ] **Step 4: Write the failing CodeBlock tests** in `CodeBlock.test.tsx`. Adapt them to the file's render helpers and its clipboard mock:

```tsx
  it('names Copy after the label, so several code blocks are told apart', () => {
    render(<CodeBlock code="pnpm add @bit-ds/react" language="shell" label="Install command" />);
    expect(screen.getByRole('button', { name: 'Copy Install command' })).toHaveTextContent('Copy');
  });

  it('without a label, names Copy after the language', () => {
    render(<CodeBlock code="ls" language="shell" />);
    expect(screen.getByRole('button', { name: 'Copy shell code' })).toBeInTheDocument();
  });

  it('after copying, the name is the visible state, and announce() says it', async () => {
    // Use the file's existing clipboard mock that resolves writeText.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<CodeBlock code="ls" language="shell" />);
    await userEvent.click(screen.getByRole('button', { name: 'Copy shell code' }));
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();
    vi.advanceTimersByTime(100);
    expect(document.getElementById('bit-announcer')).toHaveTextContent('Copied');
    vi.useRealTimers();
  });

  it('has no live region of its own', () => {
    const { container } = render(<CodeBlock code="ls" language="shell" />);
    expect(container.querySelector('[aria-live]')).toBeNull();
  });
```

Delete or update the existing tests that asserted the old `.bit-code__status` span.

- [ ] **Step 5: Implement CopyButton.** In `CopyButton.tsx`:
- take `{ code, name }: { code: string; name: string }`
- remove the status `<span>` and the fragment
- after `setState(ok ? 'copied' : 'failed')`, call `announce(LABELS[ok ? 'copied' : 'failed'])`
- on the `<button>`, add `aria-label={state === 'idle' ? `Copy ${name}` : undefined}`

In `CodeBlock.tsx`, compute `const name = label || `${language} code`;`, pass `name={name}` to `CopyButton`, and use `name` for the `pre`'s `aria-label` too, so the two stay one expression.

If `.bit-code__status` has CSS in `code-block.css`, delete that rule and its core test assertion.

- [ ] **Step 6: Update the gallery CopyButton.** In `apps/gallery/src/ui/CopyButton.tsx`:
- import `announce` from `@bit-ds/react`
- call `announce(LABELS[ok ? 'copied' : 'failed'])` in `copy()`
- delete the `<span className="gallery-visually-hidden" role="status">` and the fragment

Update `CopyButton.test.tsx`: replace the assertions that read the gallery status span with `document.getElementById('bit-announcer')` after advancing timers by 100ms. Other gallery tests that query `role="status"` for Copy (for example `AllTokens`) move to the announcer too.

- [ ] **Step 7: Run all three suites.**

```bash
pnpm --filter @bit-ds/core test && pnpm --filter @bit-ds/react test:coverage && pnpm build && pnpm --filter @bit-ds/gallery test
```

Expected: all pass, and react is at 100% coverage.

- [ ] **Step 8: Commit.**

```bash
git add packages apps/gallery/src
git commit -m "feat(react): announce() shared live region; CodeBlock Copy named from its label

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Table wrapper is a Tab stop only when it scrolls (react)

**Files:**
- Modify: `packages/react/src/components/Table/Table.tsx`
- Test: `packages/react/src/components/Table/Table.test.tsx`

**Interfaces:**
- Produces: the same public `Table` props. Behaviour: `tabIndex={0}` and `role="region"` only while `scrollWidth > clientWidth`. A given `aria-label` or `aria-labelledby` is still forwarded, and still makes the wrapper a `region`.

- [ ] **Step 1: Write the failing tests.** Add to `Table.test.tsx`, with this harness at the top of the new `describe`:

```tsx
type Callback = ConstructorParameters<typeof ResizeObserver>[0];
let observed: Callback | undefined;

class FakeResizeObserver {
  constructor(cb: Callback) {
    observed = cb;
  }
  observe() {}
  disconnect() {}
  unobserve() {}
}

function setWidths(el: HTMLElement, scrollWidth: number, clientWidth: number) {
  Object.defineProperty(el, 'scrollWidth', { configurable: true, value: scrollWidth });
  Object.defineProperty(el, 'clientWidth', { configurable: true, value: clientWidth });
}

describe('Table: Tab stop only when it scrolls', () => {
  beforeEach(() => vi.stubGlobal('ResizeObserver', FakeResizeObserver));
  afterEach(() => {
    vi.unstubAllGlobals();
    observed = undefined;
  });

  function wrapperOf(container: HTMLElement) {
    return container.querySelector('.bit-table') as HTMLElement;
  }

  it('a table that fits is not a Tab stop', () => {
    const { container } = render(<Table><TableBody><TableRow><TableCell>a</TableCell></TableRow></TableBody></Table>);
    const wrapper = wrapperOf(container);
    setWidths(wrapper, 300, 300);
    act(() => observed!([], {} as ResizeObserver));
    expect(wrapper).not.toHaveAttribute('tabindex');
    expect(wrapper).not.toHaveAttribute('role');
  });

  it('a table that overflows becomes a focusable region, and stops being one when it fits again', () => {
    const { container } = render(<Table><TableBody><TableRow><TableCell>a</TableCell></TableRow></TableBody></Table>);
    const wrapper = wrapperOf(container);
    setWidths(wrapper, 900, 300);
    act(() => observed!([], {} as ResizeObserver));
    expect(wrapper).toHaveAttribute('tabindex', '0');
    expect(wrapper).toHaveAttribute('role', 'region');
    setWidths(wrapper, 300, 300);
    act(() => observed!([], {} as ResizeObserver));
    expect(wrapper).not.toHaveAttribute('tabindex');
  });

  it('a labelled table is always a named region, focusable only when it scrolls', () => {
    const { container } = render(<Table aria-label="Tokens"><TableBody><TableRow><TableCell>a</TableCell></TableRow></TableBody></Table>);
    const wrapper = wrapperOf(container);
    setWidths(wrapper, 300, 300);
    act(() => observed!([], {} as ResizeObserver));
    expect(wrapper).toHaveAttribute('role', 'region');
    expect(wrapper).toHaveAccessibleName('Tokens');
    expect(wrapper).not.toHaveAttribute('tabindex');
  });

  it('without ResizeObserver it measures once on mount', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    const { container } = render(<Table><TableBody><TableRow><TableCell>a</TableCell></TableRow></TableBody></Table>);
    // jsdom widths are 0 and 0, so it fits: not a Tab stop.
    expect(wrapperOf(container)).not.toHaveAttribute('tabindex');
  });
});
```

Update the existing tests that assert `tabIndex={0}` always, or a dev warning. The always-focusable behaviour goes away, so delete or rewrite those tests.

- [ ] **Step 2: Run them and check they fail.** Run `pnpm --filter @bit-ds/react test -- Table`.

- [ ] **Step 3: Implement.** Add a small hook in `Table.tsx` (import `useEffect` and `useState` from React):

```tsx
/** True while the element is wider inside than out, re-measured on every resize. */
function useOverflows(): [(node: HTMLDivElement | null) => void, boolean] {
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const [overflows, setOverflows] = useState(false);
  useEffect(() => {
    if (!node) return;
    const measure = () => setOverflows(node.scrollWidth > node.clientWidth);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);
  return [setNode, overflows];
}
```

In `Table`:

```tsx
  const [measureRef, overflows] = useOverflows();
  ...
    <div
      ref={measureRef}
      className={toClasses('table', [], className)}
      data-striped={striped ? '' : undefined}
      tabIndex={overflows ? 0 : undefined}
      role={named || overflows ? 'region' : undefined}
      aria-label={label}
      aria-labelledby={labelledBy}
    >
```

Update the JSDoc: "The wrapper is focusable only while the table is too wide and scrolls, so the scroll works from the keyboard without an extra Tab stop the rest of the time."

If the e2e in Task 6 flags an unnamed overflowing `region`, give that wrapper `aria-label="Scrollable table"`, and record that in the report.

- [ ] **Step 4: Run the tests and check they pass.** Run `pnpm --filter @bit-ds/react test:coverage`. Expected: pass at 100%.

- [ ] **Step 5: Check the gallery.** Run `pnpm build && pnpm --filter @bit-ds/gallery test`. Expected: pass. Fix gallery tests that expected the Table wrapper to always have `tabindex`.

- [ ] **Step 6: Commit.**

```bash
git add packages/react apps/gallery
git commit -m "fix(react): Table wrapper is a Tab stop only while it scrolls

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: The tokenizer reads TS generics as type arguments, not JSX (react)

**Files:**
- Modify: `packages/react/src/components/CodeBlock/tokenize.ts`
- Test: `packages/react/src/components/CodeBlock/tokenize.test.ts`

- [ ] **Step 1: Write the failing tests.** Add a `describe('tokenize: jsx generics')` block, using the file's `pairs`, `kindOf` and `tokenize` helpers:

```ts
describe('tokenize: jsx generics', () => {
  it('useState<string>(…) keeps the code after the generic as JS, with no tag tokens', () => {
    const tokens = tokenize('const [a, b] = useState<string>("");', 'jsx');
    expect(tokens.some((t) => t.kind === 'tag' || t.kind === 'component')).toBe(false);
    expect(kindOf('const [a, b] = useState<string>("");', 'jsx', '""')).toBe('string');
    expect(tokens.map((t) => t.text).join('')).toBe('const [a, b] = useState<string>("");');
  });

  it('forwardRef<HTMLDivElement, Props>( colours the type names as components, not tags', () => {
    expect(kindOf('forwardRef<HTMLDivElement, Props>(', 'jsx', 'HTMLDivElement')).toBe('component');
    expect(kindOf('forwardRef<HTMLDivElement, Props>(', 'jsx', 'Props')).toBe('component');
    expect(tokenize('forwardRef<HTMLDivElement, Props>(', 'jsx').some((t) => t.kind === 'tag')).toBe(false);
  });

  it('Array<Item> followed by more code does not swallow it as JSX children', () => {
    expect(kindOf('let xs: Array<Item> = [];', 'jsx', '=')).toBe('punct');
  });

  it('i<n with no spaces is a comparison, not a tag', () => {
    expect(tokenize('for (let i=0; i<n; i++) {}', 'jsx').some((t) => t.kind === 'tag')).toBe(false);
  });

  it.each([
    ['return (', 'return (<div>hi</div>);'],
    ['an arrow', 'const A = () => <div>hi</div>;'],
    ['&&', 'ok && <div>hi</div>'],
    ['?', 'ok ? <div>hi</div> : null'],
    ['a line start', '<div>hi</div>'],
  ])('JSX after %s is still a tag', (_, code) => {
    expect(kindOf(code, 'jsx', 'div')).toBe('tag');
  });
});
```

- [ ] **Step 2: Run them and check they fail.** Run `pnpm --filter @bit-ds/react test -- tokenize`. Expected: the generic tests fail, and the `.each` JSX tests already pass.

- [ ] **Step 3: Implement.** In `jsxStep`, before the `const open = …` line, add:

```ts
  // A `<` straight after an identifier (no space) is a type argument (`useState<string>`) or a
  // comparison (`i<n`), never a JSX tag. JSX always follows a space, `(`, `=>`, `&&`, `?`, `{` or a line start.
  if (mode === 'js' && rest[0] === '<' && /[\w$]/.test(code[at - 1] ?? '')) return [token('punct', '<'), modes];
```

Inside the type list, names go through `JS_RULES`: capitals become `component` and lowercase become `text`. The closing `>` is already `punct` in `JS_RULES`.

- [ ] **Step 4: Run the tests and check they pass.** Run `pnpm --filter @bit-ds/react test:coverage`. Expected: all pass at 100%.

- [ ] **Step 5: Commit.**

```bash
git add packages/react/src/components/CodeBlock
git commit -m "fix(react): tokenizer reads TS generics as type arguments, not JSX

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Playwright and axe against the production preview, with a baseline and "before" screenshots

**Files:**
- Modify: `apps/gallery/vite.config.ts` (base for preview)
- Create: `apps/gallery/src/vite-config.test.ts`
- Modify: `apps/gallery/package.json` (add `@axe-core/playwright` as a devDependency)
- Create: `apps/gallery/playwright.config.ts`
- Create: `apps/gallery/e2e/routes.ts`, `apps/gallery/e2e/a11y.spec.ts`, `apps/gallery/e2e/forced-colors.spec.ts`, `apps/gallery/e2e/screens.spec.ts`
- Modify: `apps/gallery/vitest.config.ts` and `apps/gallery/tsconfig.json`, as needed (keep Vitest out of `e2e/`, and let tsc and ESLint see it)
- Modify: `.gitignore` (`apps/gallery/test-results/`, `apps/gallery/playwright-report/`)
- Modify: `CONTRIBUTING.md` (how to run e2e)

**Interfaces:**
- Consumes: `NAV` from `apps/gallery/src/shell/Sidebar.tsx` (`{ group, label, to }[]`), and the color-mode storage key `'bit-color-mode'` (`COLOR_MODE_STORAGE_KEY` in `@bit-ds/react`)
- Produces: `pnpm e2e` (all specs except screens), and `SCREENS_DIR=<dir> pnpm --filter @bit-ds/gallery exec playwright test e2e/screens.spec.ts`, which writes PNGs

- [ ] **Step 1: Write the failing config test** in `apps/gallery/src/vite-config.test.ts`:

```ts
// @vitest-environment node
import { describe, expect, it } from 'vitest';
import config, { PAGES_BASE } from '../vite.config';

type ConfigFn = (env: { command: 'build' | 'serve'; mode: string; isPreview?: boolean }) => { base?: string };

describe('vite.config base', () => {
  const resolve = config as unknown as ConfigFn;
  it('dev serves from /', () => {
    expect(resolve({ command: 'serve', mode: 'development' }).base).toBe('/');
  });
  it('build and preview use the Pages base, so preview serves the built asset paths', () => {
    expect(resolve({ command: 'build', mode: 'production' }).base).toBe(PAGES_BASE);
    expect(resolve({ command: 'serve', mode: 'production', isPreview: true }).base).toBe(PAGES_BASE);
  });
});
```

- [ ] **Step 2: Run it and check it fails.** Run `pnpm build && pnpm --filter @bit-ds/gallery test -- vite-config`. Expected: the preview case fails, getting `/`.

- [ ] **Step 3: Fix the base.** In `vite.config.ts`:

```ts
export default defineConfig(({ command, isPreview }) => ({
  // Preview serves the build, whose asset URLs start with the Pages base.
  base: command === 'build' || isPreview ? PAGES_BASE : '/',
```

Run the test again. Expected: PASS.

- [ ] **Step 4: Add the dependency, and install Chromium.**

```bash
pnpm --filter @bit-ds/gallery add -D @axe-core/playwright
pnpm --filter @bit-ds/gallery exec playwright install chromium
```

- [ ] **Step 5: Write `apps/gallery/playwright.config.ts`.**

```ts
import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

export default defineConfig({
  testDir: './e2e',
  testIgnore: process.env.SCREENS_DIR ? [] : ['**/screens.spec.ts'],
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}/bit-design-system/`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // Library first (the gallery imports its built dist), then the gallery build, then preview.
    command: 'pnpm --dir ../.. build && pnpm build && pnpm preview',
    url: `http://localhost:${PORT}/bit-design-system/`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
```

- [ ] **Step 6: Write `e2e/routes.ts`.**

```ts
import { NAV } from '../src/shell/Sidebar';

/** Every page the gallery serves, as hash routes, plus the not-found state. */
export const ROUTES: readonly { name: string; hash: string }[] = [
  { name: 'Home', hash: '#/' },
  ...NAV.map((item) => ({ name: item.label, hash: `#${item.to}` })),
  { name: 'Not found', hash: '#/no-such-page' },
];

export const MODES = ['light', 'dark'] as const;
```

If importing `Sidebar.tsx` into Playwright's loader fails (because of the React and CSS imports it pulls in), move `NAV`, `NavItem` and `NavGroup` into `src/shell/nav.ts`, re-export them from `Sidebar.tsx`, and import from `nav.ts` here. If `nav.ts` still pulls in manifests that import CSS, build `ROUTES` in the browser instead: open `#/`, read every `nav a[href]` from the sidebar with `page.$$eval`, and loop over those. Record the choice in the report.

- [ ] **Step 7: Write `e2e/a11y.spec.ts`.**

```ts
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { MODES, ROUTES } from './routes';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

for (const mode of MODES) {
  test.describe(`${mode} mode`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((value) => {
        window.localStorage.setItem('bit-color-mode', value);
      }, mode);
    });

    for (const route of ROUTES) {
      test(`${route.name} has no axe violations`, async ({ page }) => {
        await page.goto(route.hash);
        await expect(page.locator('main h1').first()).toBeVisible();
        await expect(page.locator('html')).toHaveAttribute('data-mode', mode);
        const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
        const summary = violations.map((v) => `${v.id}: ${v.help} → ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`);
        expect(summary).toEqual([]);
      });
    }
  });
}
```

Check how `useColorMode` applies the mode, through `COLOR_MODE_SCRIPT` in `index.html` and `data-mode` on `<html>`. If the stored values differ from `'light'` and `'dark'`, or light mode doesn't set `data-mode="light"`, adjust the assertion to the real behaviour.

- [ ] **Step 8: Write `e2e/forced-colors.spec.ts`.**

```ts
import { expect, test } from '@playwright/test';

test.use({ forcedColors: 'active' });

for (const [slug, selector] of [
  ['input', '.bit-input'],
  ['select', '.bit-select__control'],
] as const) {
  test(`an invalid ${slug} shows a 10px start edge in forced colours`, async ({ page }) => {
    await page.goto(`#/components/${slug}`);
    await page.getByRole('switch', { name: 'invalid' }).click();
    const control = page.locator(`.gallery-preview__stage ${selector}`).first();
    await expect(control).toHaveAttribute('aria-invalid', 'true');
    await expect(control).toHaveCSS('border-inline-start-width', '10px');
  });
}
```

The `invalid` switch is a boolean control in both manifests. If the accessible name differs, use the real one.

- [ ] **Step 9: Write `e2e/screens.spec.ts`.** It's skipped unless `SCREENS_DIR` is set.

```ts
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { test } from '@playwright/test';

const DIR = process.env.SCREENS_DIR;
const PAGES = [
  ['home', '#/'],
  ['playground-button', '#/components/button'],
  ['playground-input', '#/components/input'],
  ['tokens', '#/tokens'],
] as const;
const WIDTHS = [1300, 390] as const;
const MODES = ['light', 'dark'] as const;

test.skip(!DIR, 'set SCREENS_DIR to capture screenshots');

for (const [name, hash] of PAGES) {
  for (const width of WIDTHS) {
    for (const mode of MODES) {
      test(`${name} ${width} ${mode}`, async ({ page }) => {
        mkdirSync(DIR!, { recursive: true });
        await page.addInitScript((value) => window.localStorage.setItem('bit-color-mode', value), mode);
        await page.setViewportSize({ width, height: 900 });
        await page.goto(hash);
        await page.locator('main h1').first().waitFor();
        await page.screenshot({ path: join(DIR!, `${name}-${width}-${mode}.png`), fullPage: true });
      });
    }
  }
}
```

- [ ] **Step 10: Keep Vitest out of `e2e/`.** Read `apps/gallery/vitest.config.ts`. If its `include` would match `e2e/**/*.spec.ts`, set `include: ['src/**/*.test.{ts,tsx}']`, or add `exclude: [...configDefaults.exclude, 'e2e/**']`. Run `pnpm --filter @bit-ds/gallery test`. Expected: the earlier count plus 2.

- [ ] **Step 11: Run the baseline.** Run `pnpm e2e`.
- Record every failing route and rule id in the task report: this is the baseline.
- Fix in this task any violation with an obvious small fix. Typical ones are a missing accessible name, a contrast miss on a gallery-only colour, or `scrollable-region-focusable`.
- Leave violations caused by the hand-built controls for Tasks 7 and 8, and list them.
- The forced-colours specs must pass now, because Task 2 shipped the CSS.
- If more than about 10 distinct rule-and-component problems need real design work, stop and report instead of fixing them.

- [ ] **Step 12: Capture the "before" screenshots.**

```bash
SCREENS_DIR="$HOME/.gstack/projects/doosemavis-bit-design-system/designs/pr3b-20261004/before" pnpm --filter @bit-ds/gallery exec playwright test e2e/screens.spec.ts
```

Expected: 16 PNGs.

- [ ] **Step 13: Document it.** Add to `CONTRIBUTING.md`, in its testing section:

````markdown
### End-to-end and accessibility

```bash
pnpm --filter @bit-ds/gallery exec playwright install chromium   # once
pnpm e2e
```

`pnpm e2e` builds the library and the gallery, serves the build with `vite preview` at `/bit-design-system/`, and runs axe (WCAG 2.2 AA, contrast included) on every page in light and dark, plus a forced-colours check.
````

Add the `test-results/` and `playwright-report/` ignores to `.gitignore`.

- [ ] **Step 14: Run the gates and commit.** Run `pnpm lint && pnpm typecheck && pnpm --filter @bit-ds/gallery test`. Expected: pass. If typed linting or `tsc` doesn't see `e2e/` and `playwright.config.ts`, add them to the gallery tsconfig `include`.

```bash
git add apps/gallery .gitignore CONTRIBUTING.md pnpm-lock.yaml
git commit -m "test(gallery): Playwright + axe on every route in light and dark, against the production preview

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Gallery form controls on bit (ControlsPanel and ThemeSelect)

**Files:**
- Modify: `apps/gallery/src/engine/ControlsPanel.tsx`, `apps/gallery/src/engine/ControlsPanel.test.tsx`
- Modify: `apps/gallery/src/shell/ThemeSelect.tsx`, `apps/gallery/src/shell/ThemeSelect.test.tsx`
- Modify: `apps/gallery/src/gallery.css` (delete `gallery-control__label`, `__select`, `__input`, `__error`, `gallery-switch*`, and `gallery-theme__*` paint, keeping layout)
- Modify: `apps/gallery/src/gallery-css.test.ts` (delete or retarget assertions about the deleted rules, such as `gallery-control__label` reading `--bit-font-mono`)

**Interfaces:**
- Consumes: `Field` (`label`, `error`, `hint`, `children: ReactElement`), `Select` (`size`, native select props), `Input` (`size`, native input props), `Switch` (`size`, `checked`, `onChange`, `children` = the visible label) from `@bit-ds/react`
- Produces: the same `ControlsPanel` props, and the same accessible names (each control is named by its prop name)

- [ ] **Step 1: Write the failing tests.** In `ControlsPanel.test.tsx`, add:

```tsx
  it('is built from bit controls: Select, Input and Switch inside Field', () => {
    const { container } = renderPanel(); // the file's existing helper, with a manifest that has every control kind
    expect(container.querySelector('select.bit-select__control')).not.toBeNull();
    expect(container.querySelector('input.bit-input')).not.toBeNull();
    expect(container.querySelector('input.bit-switch__input[role="switch"]')).not.toBeNull();
    expect(container.querySelectorAll('.bit-field').length).toBeGreaterThan(0);
    expect(container.querySelector('[class*="gallery-control__"], .gallery-switch')).toBeNull();
  });

  it('an emptied children field shows the error through Field, and is invalid', () => {
    // Render Button's manifest with state.children === '' (docs.emptyChildrenError is set for Button).
    const input = screen.getByRole('textbox', { name: 'children' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(expect.stringContaining(buttonManifest.docs.emptyChildrenError!));
  });
```

Fill in `renderPanel` and the manifest from the helpers the file already uses.

Existing tests that query by role and name (`getByRole('combobox', { name: 'color' })`, `getByRole('switch', { name: 'disabled' })` and so on) must keep passing **unchanged**. That's the proof that the names survived. Change a test only if it queried a removed class or the removed `⚠` glyph.

In `ThemeSelect.test.tsx`, add:

```tsx
  it('is a bit Select named Theme', () => {
    const { container } = render(<ThemeSelect />);
    expect(screen.getByRole('combobox', { name: 'Theme' })).toHaveClass('bit-select__control');
    expect(container.querySelector('.gallery-theme__select')).toBeNull();
  });
```

- [ ] **Step 2: Run them and check they fail.** Run `pnpm --filter @bit-ds/gallery test -- ControlsPanel ThemeSelect`.

- [ ] **Step 3: Rewrite `ControlsPanel.tsx`.** Rename the local `Field` to `ControlField`, and its props interface to `ControlFieldProps`, to avoid the name clash. Import bit's components:

```tsx
import { Button, Field, Heading, Input, Select, Switch } from '@bit-ds/react';
...
/** One form control per manifest entry. Labels are the prop names so the panel doubles as API docs. */
function ControlField({ control, value, onChange, error }: ControlFieldProps) {
  const label = ('label' in control && control.label) || control.prop;
  switch (control.kind) {
    case 'axis':
    case 'select':
      return (
        <Field label={label}>
          <Select size="sm" value={String(value ?? control.default)} onChange={(event) => onChange(control.prop, event.target.value)}>
            {control.values.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </Select>
        </Field>
      );
    case 'boolean':
      return (
        <Switch size="sm" checked={value === true} onChange={(event) => onChange(control.prop, event.target.checked)}>
          {label}
        </Switch>
      );
    case 'number':
      return (
        <Field label={label}>
          <Input
            size="sm"
            type="number"
            min={control.min}
            max={control.max}
            step={control.step}
            value={String(value ?? control.default)}
            onChange={(event) => onChange(control.prop, event.target.value)}
          />
        </Field>
      );
    case 'text':
      return (
        <Field label={label} error={error}>
          <Input size="sm" type="text" value={String(value ?? control.default)} onChange={(event) => onChange(control.prop, event.target.value)} />
        </Field>
      );
  }
}
```

Notes:
- `Field` generates the ids and wires `aria-invalid` and `aria-describedby` from `error`. Confirm this in `packages/react/src/components/Field`.
- If the grid needs one cell per control, keep a `<div className="gallery-control">` wrapper (layout only).
- If the labels lose the mono face, the bit Field label wins. Delete that `gallery-css.test.ts` assertion.

- [ ] **Step 4: Rewrite `ThemeSelect.tsx`.**

```tsx
import { Field, Select } from '@bit-ds/react';
...
  return (
    <Field label="Theme" className="gallery-theme">
      <Select
        size="sm"
        value={theme}
        onChange={(event) => {
          const next = event.target.value;
          if (isTheme(next)) setTheme(next);
        }}
      >
        {THEMES.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </Select>
    </Field>
  );
```

If the header needs the label beside the select, set `.gallery-theme { flex-direction: row; align-items: center; }` in `gallery.css`. Both properties are layout.

- [ ] **Step 5: Delete the dead CSS.** In `gallery.css`, delete every rule for `.gallery-control__label`, `.gallery-control__select`, `.gallery-control__input`, `.gallery-control__error`, `.gallery-switch`, `.gallery-switch__knob`, `.gallery-switch[data-on]…`, `.gallery-theme__label` and `.gallery-theme__select`, including inside media queries. Confirm none are referenced:

```bash
grep -rnE 'gallery-(control__|switch|theme__)' apps/gallery/src | grep -v '\.test\.'
```

Expected: no output.

- [ ] **Step 6: Run the tests.** Run `pnpm --filter @bit-ds/gallery test && pnpm typecheck && pnpm lint`. Expected: pass.

- [ ] **Step 7: Run e2e.** Run `pnpm e2e`. Expected: no new violations compared with the Task 6 baseline, and the control-related ones are gone. The forced-colours spec still passes, because the `invalid` control is now a real `Switch` with the same name.

- [ ] **Step 8: Commit.**

```bash
git add apps/gallery
git commit -m "refactor(gallery): ControlsPanel and ThemeSelect on bit Field, Select, Input and Switch

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Gallery links and cards on bit (Header, Sidebar, Preview, Home tiles and chips)

**Files:**
- Modify: `apps/gallery/src/shell/Header.tsx`, `apps/gallery/src/shell/Sidebar.tsx`
- Modify: `apps/gallery/src/engine/Preview.tsx`
- Modify: `apps/gallery/src/pages/home/ComponentTiles.tsx`
- Modify: `apps/gallery/src/gallery.css`, `apps/gallery/src/pages/home/homeCss.test.ts`, `apps/gallery/src/gallery-css.test.ts`, and the touched components' tests

**Interfaces:**
- Consumes: `Link` (`asChild`, `color`), `Card` (`variant`, a div with forwarded props), `Button` (`asChild`, `variant`, `size`, `color`) and `Badge` (`variant`, `size`) from `@bit-ds/react`

- [ ] **Step 1: Write the failing tests.**

In `Header.test.tsx`:

```tsx
  it('the brand link is a bit Link', () => {
    renderHeader(); // the file's existing helper
    expect(screen.getByRole('link', { name: 'bit Design System, gallery home' })).toHaveClass('bit-link');
  });
```

In `Sidebar.test.tsx`:

```tsx
  it('every nav link is a bit Link, and the current page is marked', () => {
    renderSidebarAt('/tokens'); // the file's helper, or render inside a router at /tokens
    for (const link of screen.getAllByRole('link')) expect(link).toHaveClass('bit-link');
    expect(screen.getByRole('link', { name: 'Tokens' })).toHaveAttribute('aria-current', 'page');
  });
```

In `Preview.test.tsx`:

```tsx
  it('the stage frame is a bit Card, still a named region', () => {
    render(<Preview label="Button preview">x</Preview>);
    const region = screen.getByRole('region', { name: 'Button preview' });
    expect(region.querySelector('.bit-card')).not.toBeNull();
  });
```

In `HomePage.test.tsx`:

```tsx
  it('large tiles are Cards; compact tiles are outline Buttons with a Badge glyph', () => {
    renderHome(); // the file's existing helper
    expect(document.querySelectorAll('.bit-card.gallery-tile').length).toBeGreaterThan(0);
    const compact = MANIFESTS.find((m) => m.group !== 'brand' && !isLargeTile(m))!;
    const chip = screen.getByRole('link', { name: new RegExp(compact.name) });
    expect(chip).toHaveClass('bit-button');
    expect(chip.querySelector('.bit-badge')).not.toBeNull();
  });
```

- [ ] **Step 2: Run them and check they fail.**

- [ ] **Step 3: Implement.**

Header brand: import bit's `Link`, and alias the router link.

```tsx
import { BitLogo, Button, Link, ModeToggle } from '@bit-ds/react';
import { Link as RouterLink } from 'react-router-dom';
...
      <Link asChild color="neutral" className="gallery-header__brand">
        <RouterLink to="/" aria-label="bit Design System, gallery home">
          <BitLogo size="sm" />
        </RouterLink>
      </Link>
```

`.gallery-header__brand { text-decoration: none; }` stays as a **group C exception** ("logo link: the wordmark is the affordance").

In `Sidebar.tsx`, `<NavLink>` becomes:

```tsx
                  <Link asChild color="neutral" className="gallery-sidebar__link">
                    <NavLink to={item.to} onClick={onNavigate}>
                      {item.label}
                    </NavLink>
                  </Link>
```

`NavLink` sets `aria-current="page"` and the `active` class itself. The sidebar link's active and hover paint stays in `gallery.css` as group C exceptions. If bold underlined links look wrong in the list, keep `text-decoration: none` on `.gallery-sidebar__link` as a documented group C exception ("nav list: position and the active fill mark the links"). Note it in the report.

`Preview.tsx`:

```tsx
import { Card, Switch } from '@bit-ds/react';
...
    <section aria-label={label} className="gallery-preview" data-checkerboard={checkerboard ? '' : undefined}>
      <Card className="gallery-preview__card">
        <div className="gallery-preview__bar">{/* unchanged */}</div>
        <div className="gallery-preview__stage">{children}</div>
      </Card>
    </section>
```

Move the `background`, `border`, `border-radius` and `box-shadow` off `.gallery-preview`, because Card draws them. If Card adds padding the stage didn't have, zero it on `.gallery-preview__card` (padding is layout). The bar's `border-bottom` and background stay as group C exceptions ("divides the toolbar from the stage"). Check that `.gallery-preview[data-checkerboard] .gallery-preview__stage` still matches.

`ComponentTiles.tsx`:

```tsx
function LargeTile({ manifest }: { manifest: Manifest }) {
  return (
    <Card className="gallery-tile">
      {/* the same two children as before */}
    </Card>
  );
}

function CompactTile({ manifest }: { manifest: Manifest }) {
  return (
    <Button asChild variant="outline" color="neutral" size="sm" className="gallery-chip">
      <RouterLink to={routeFor(manifest)}>
        <span aria-hidden="true">
          <Badge variant="outline" size="sm">
            {glyphFor(manifest)}
          </Badge>
        </span>
        {manifest.name}
        <span aria-hidden="true">→</span>
      </RouterLink>
    </Button>
  );
}
```

Delete the paint for `.gallery-tile`, `.gallery-chip` and `.gallery-chip__glyph` (background, border, radius, shadow, font) from `gallery.css`, and update `homeCss.test.ts` to match. The tile focus ring (`.gallery-tile:has(.gallery-tile__link:focus-visible)`) stays as a group C exception.

- [ ] **Step 4: Run the tests.** Run `pnpm build && pnpm --filter @bit-ds/gallery test && pnpm typecheck && pnpm lint`. Expected: pass.

- [ ] **Step 5: Run e2e.** Run `pnpm e2e`. Expected: zero violations on every route in both modes, plus the forced-colours checks. Fix anything left here, or report it if it needs the owner.

- [ ] **Step 6: Capture the "after" screenshots.**

```bash
SCREENS_DIR="$HOME/.gstack/projects/doosemavis-bit-design-system/designs/pr3b-20261004/after" pnpm --filter @bit-ds/gallery exec playwright test e2e/screens.spec.ts
```

- [ ] **Step 7: Commit.**

```bash
git add apps/gallery
git commit -m "refactor(gallery): header, sidebar, preview and Home tiles on bit Link, Card, Button and Badge

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Guards: raw-tag lint ban and the `gallery.css` exceptions test

**Files:**
- Modify: `eslint.config.js`
- Create: `apps/gallery/src/lint-ban.test.ts`
- Create: `apps/gallery/src/cssGuard.ts`, `apps/gallery/src/cssGuard.test.ts`
- Create: `apps/gallery/src/gallery-css.exceptions.ts`
- Modify: `apps/gallery/src/gallery-css.test.ts`
- Modify: `apps/gallery/package.json` (add `postcss` as a devDependency, at the version already in the lockfile through Vite)

**Interfaces:**
- Produces:

```ts
// cssGuard.ts
export interface CssException { readonly selector: string; readonly property: string; readonly reason: string }
export interface GuardResult { readonly unlisted: readonly string[]; readonly stale: readonly string[]; readonly unexplained: readonly string[] }
export function isLayoutProperty(property: string): boolean;
export function declarationKeys(css: string): readonly { key: string; property: string }[];
export function checkCss(css: string, exceptions: readonly CssException[]): GuardResult;
```

- [ ] **Step 1: Write the failing lint test** in `apps/gallery/src/lint-ban.test.ts`:

```ts
// @vitest-environment node
import { ESLint } from 'eslint';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('../../..', import.meta.url));
const eslint = new ESLint({ cwd: root });
const fixture = (name: string) => `${root}apps/gallery/src/${name}`;

async function banned(code: string, name = '__lint_fixture__.tsx') {
  const [result] = await eslint.lintText(code, { filePath: fixture(name) });
  return result!.messages.filter((m) => m.ruleId === 'no-restricted-syntax').map((m) => m.message);
}

describe('gallery raw-tag ban', () => {
  it.each([
    ['button', '<Button>'],
    ['a', '<Link>'],
    ['input', '<Input>'],
    ['textarea', '<Input>'],
    ['select', '<Select>'],
    ['table', '<Table>'],
    ['code', '<Code>'],
    ['pre', '<CodeBlock>'],
    ['h1', '<Heading>'],
    ['h6', '<Heading>'],
  ])('<%s> is banned and the message names %s', async (tag, component) => {
    const found = await banned(`export const X = () => <${tag} />;`);
    expect(found).toHaveLength(1);
    expect(found[0]).toContain(component);
  });

  it('bit components and plain layout tags pass', async () => {
    expect(await banned('export const X = () => <div><span><Button /><Link /></span></div>;')).toEqual([]);
  });

  it('tests may use raw tags', async () => {
    expect(await banned('export const X = () => <button />;', '__lint_fixture__.test.tsx')).toEqual([]);
  });
});
```

`root` ends with `/` because `fileURLToPath` of a directory URL keeps the trailing slash. If the vitest timeout is too short for ESLint's first run, give the `describe` `{ timeout: 30_000 }`.

- [ ] **Step 2: Run it and check it fails.** Run `pnpm --filter @bit-ds/gallery test -- lint-ban`. Expected: the ban tests fail with 0 messages.

- [ ] **Step 3: Add the ban** to `eslint.config.js`. Define the list above `export default`:

```js
/** The gallery is bit's first consumer, so it must use bit's components, never the raw tags they wrap. */
const RAW_TAGS = [
  ['button', 'Use <Button> (or <Switch> / <SegmentedControl>) from @bit-ds/react.'],
  ['a', 'Use <Link> from @bit-ds/react (asChild around a router link).'],
  ['input', 'Use <Input> inside <Field> from @bit-ds/react.'],
  ['textarea', 'Use <Input> inside <Field> from @bit-ds/react.'],
  ['select', 'Use <Select> from @bit-ds/react.'],
  ['table', 'Use <Table> from @bit-ds/react.'],
  ['code', 'Use <Code> from @bit-ds/react.'],
  ['pre', 'Use <CodeBlock> from @bit-ds/react.'],
  ...['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((h) => [h, 'Use <Heading> from @bit-ds/react.']),
];
```

Add this config object as the last entry inside `tseslint.config(...)`:

```js
  {
    files: ['apps/gallery/src/**/*.tsx'],
    ignores: ['apps/gallery/src/**/*.test.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...RAW_TAGS.map(([tag, message]) => ({ selector: `JSXOpeningElement[name.name="${tag}"]`, message })),
      ],
    },
  },
```

- [ ] **Step 4: Run lint and the test.** Run `pnpm lint && pnpm --filter @bit-ds/gallery test -- lint-ban`. Expected: both pass.
- If `pnpm lint` reports raw tags left anywhere in the gallery, replace them with the bit component.
- Header's `GitHubLink` renders `<a>` inside `<Button asChild>`, which is the documented pattern for a link styled as a button. Allow exactly that with `{/* eslint-disable-next-line no-restricted-syntax -- Button asChild renders this anchor as a bit Button */}`.
- Use this pattern only where a bit component's `asChild` renders the raw tag. List each one in the report.

- [ ] **Step 5: Write the failing guard tests** in `apps/gallery/src/cssGuard.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { checkCss, declarationKeys, isLayoutProperty } from './cssGuard';

describe('isLayoutProperty', () => {
  it.each(['display', 'grid-template-columns', 'gap', 'margin-inline', 'padding', 'inset-block-start', 'overflow-x', '--x', 'scroll-margin-top'])(
    '%s is layout',
    (p) => expect(isLayoutProperty(p)).toBe(true),
  );
  it.each(['color', 'background', 'border', 'font-family', 'outline', 'box-shadow', 'transition', 'text-decoration'])(
    '%s is not layout',
    (p) => expect(isLayoutProperty(p)).toBe(false),
  );
});

describe('declarationKeys', () => {
  it('keys a comma selector list as written, and prefixes at-rules', () => {
    const css = `.a,\n.b { color: red; }\n@media (forced-colors: active) { .c { background: Canvas; } }`;
    expect(declarationKeys(css)).toEqual([
      { key: '.a, .b', property: 'color' },
      { key: '@media (forced-colors: active) .c', property: 'background' },
    ]);
  });
});

describe('checkCss', () => {
  const css = `.x { display: grid; color: red; }\n@media (forced-colors: active) { .x { color: CanvasText; } }`;

  it('layout passes, and an unlisted paint property is reported with its key', () => {
    expect(checkCss(css, []).unlisted).toEqual(['.x { color }', '@media (forced-colors: active) .x { color }']);
  });

  it('an exception covers exactly its key: the media rule is not covered by the plain one', () => {
    const result = checkCss(css, [{ selector: '.x', property: 'color', reason: 'demo' }]);
    expect(result.unlisted).toEqual(['@media (forced-colors: active) .x { color }']);
  });

  it('reports stale exceptions and empty reasons', () => {
    const result = checkCss('.x { display: block; }', [
      { selector: '.gone', property: 'color', reason: 'old' },
      { selector: '.x', property: 'display', reason: '' },
    ]);
    // `.x { display }` is stale too: display is layout, so it never needs an exception.
    expect(result.stale).toEqual(['.gone { color }', '.x { display }']);
    expect(result.unexplained).toEqual(['.x { display }']);
  });
});
```

- [ ] **Step 6: Run them and check they fail.** Expected: FAIL (module not found).

- [ ] **Step 7: Implement `cssGuard.ts`.**

```ts
import postcss from 'postcss';
import type { AtRule, Rule } from 'postcss';

export interface CssException {
  readonly selector: string;
  readonly property: string;
  readonly reason: string;
}

export interface GuardResult {
  /** Paint declarations with no exception: "<key> { <property> }". */
  readonly unlisted: readonly string[];
  /** Exceptions that match no paint declaration. */
  readonly stale: readonly string[];
  /** Exceptions with an empty reason. */
  readonly unexplained: readonly string[];
}

const LAYOUT_EXACT = new Set([
  'display', 'gap', 'row-gap', 'column-gap', 'order', 'position', 'top', 'right', 'bottom', 'left', 'z-index',
  'width', 'min-width', 'max-width', 'height', 'min-height', 'max-height', 'box-sizing', 'aspect-ratio', 'contain',
  'isolation', 'visibility', 'clip', 'clip-path', 'white-space', 'text-overflow', 'word-break', 'overflow-wrap',
]);
const LAYOUT_PREFIXES = ['grid', 'flex', 'align-', 'justify-', 'place-', 'inset', 'margin', 'padding', 'overflow', 'scroll-margin', 'scroll-padding', '--'];

/** Positioning, sizing and spacing: what a layout-only stylesheet may set. */
export function isLayoutProperty(property: string): boolean {
  return LAYOUT_EXACT.has(property) || LAYOUT_PREFIXES.some((prefix) => property.startsWith(prefix));
}

/** "a,\n b" → "a, b", so a key doesn't depend on how the list was wrapped. */
const normalize = (selector: string) => selector.split(',').map((s) => s.trim()).join(', ');

function atPrefix(rule: Rule): string {
  const parts: string[] = [];
  for (let parent = rule.parent; parent && parent.type !== 'root'; parent = parent.parent) {
    if (parent.type === 'atrule') parts.unshift(`@${(parent as AtRule).name} ${(parent as AtRule).params}`);
  }
  return parts.join(' ');
}

/** Every declaration in a rule, keyed "<at-rule chain> <selector>" with the selector list normalised. */
export function declarationKeys(css: string): readonly { key: string; property: string }[] {
  const out: { key: string; property: string }[] = [];
  postcss.parse(css).walkRules((rule) => {
    const prefix = atPrefix(rule);
    const key = prefix ? `${prefix} ${normalize(rule.selector)}` : normalize(rule.selector);
    rule.each((child) => {
      if (child.type === 'decl') out.push({ key, property: child.prop });
    });
  });
  return out;
}

const label = (key: string, property: string) => `${key} { ${property} }`;

/** Checks that every non-layout declaration is listed, and that the list holds nothing extra. */
export function checkCss(css: string, exceptions: readonly CssException[]): GuardResult {
  const paint = declarationKeys(css).filter((d) => !isLayoutProperty(d.property));
  const listed = exceptions.map((e) => label(normalize(e.selector), e.property));
  const covered = new Set(listed);
  const used = new Set(paint.map((d) => label(d.key, d.property)));
  return {
    unlisted: [...new Set(paint.map((d) => label(d.key, d.property)))].filter((l) => !covered.has(l)),
    stale: listed.filter((l) => !used.has(l)),
    unexplained: exceptions.filter((e) => e.reason.trim() === '').map((e) => label(normalize(e.selector), e.property)),
  };
}
```

- [ ] **Step 8: Run the guard tests and check they pass.** Run `pnpm --filter @bit-ds/gallery test -- cssGuard`.

- [ ] **Step 9: Use the guard in `gallery-css.test.ts`, and write the exceptions.** Add:

```ts
import { checkCss } from './cssGuard';
import { GALLERY_CSS_EXCEPTIONS } from './gallery-css.exceptions';

describe('gallery.css is layout only, apart from the documented exceptions', () => {
  const result = checkCss(galleryCss, GALLERY_CSS_EXCEPTIONS);
  it('every paint declaration has an exception', () => expect(result.unlisted).toEqual([]));
  it('no exception is stale', () => expect(result.stale).toEqual([]));
  it('every exception says why', () => expect(result.unexplained).toEqual([]));
});
```

Create `apps/gallery/src/gallery-css.exceptions.ts`, starting empty:

```ts
import type { CssException } from './cssGuard';

/**
 * gallery.css is layout only, apart from these. Group B: token specimens that must paint to show a
 * token. Group C: the gallery frame and accessibility. One entry per selector and property; the test
 * fails on anything new that is not listed here, and on entries that no longer match.
 */
export const GALLERY_CSS_EXCEPTIONS: readonly CssException[] = [
  // ---------------------------------------------------------------- B: token specimens
  // ---------------------------------------------------------------- C: frame and accessibility
];
```

Run `pnpm --filter @bit-ds/gallery test -- gallery-css`. The `unlisted` failure prints every remaining key. For each one, decide:
- **Group A paint** (a card, button, input, link or chip look that a bit component should draw): delete it from `gallery.css`, or swap in the bit component. **Don't list it.**
- **Group B or C:** add an entry with a specific reason, using these phrasings:

| Kind | Reason |
|---|---|
| specimens | "specimen: shows <token>" |
| eyebrows and titles | "label face: Text has no face prop (spec amendment 2)" |
| focus rings | "focus: visible ring for <what>" |
| forced-colours rules | "forced colours: keeps <what> visible" |
| visually-hidden | "a11y: hidden but read" |
| sidebar and header | "frame: <what>" |
| list-style or scroll-behavior | "frame: <what>" |

Repeat until all three tests pass.

- [ ] **Step 10: Run everything.** Run `pnpm lint && pnpm typecheck && pnpm build && pnpm test`. Expected: pass.

- [ ] **Step 11: Commit.**

```bash
git add eslint.config.js apps/gallery pnpm-lock.yaml
git commit -m "test(gallery): ban raw tags in the gallery; gallery.css is layout only with documented exceptions

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Docs for the changed behaviour, and final verification

**Files:**
- Modify: `apps/gallery/src/manifests/table.ts`, `link.ts`, `input.ts`, `select.ts`, `codeBlock.ts` (the `docs` text)
- Modify: `TODOS.md`, only if the e2e baseline deferred something

- [ ] **Step 1: Update the manifest docs.** Update the `docs.accessibility` and `docs.usage` entries, in the existing style of each:
- `table.ts`: the wrapper is focusable only when it scrolls
- `link.ts`: inside a solid Alert, a Link takes the Alert's text colour
- `input.ts`, `select.ts`: in forced colours, invalid shows a thick start edge
- `codeBlock.ts`: Copy is named "Copy <label>", and results are announced through one shared region

Run `pnpm --filter @bit-ds/gallery test -- manifests`. Expected: pass.

- [ ] **Step 2: Check `FOUNDATION_PAGES`.** Run `grep -rn FOUNDATION_PAGES apps/gallery/src`. Expected: no output (spec amendment 5).

- [ ] **Step 3: Run the full gates.**

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm test:coverage && pnpm gallery:build && pnpm smoke && pnpm e2e
```

Expected:
- all green
- core ≥ 459 tests, react ≥ 410 at 100% coverage, gallery ≥ 494
- e2e: zero violations

Put the counts in the report.

- [ ] **Step 4: Commit.**

```bash
git add -A apps/gallery TODOS.md
git commit -m "docs(gallery): manifests describe the PR3b behaviour changes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
