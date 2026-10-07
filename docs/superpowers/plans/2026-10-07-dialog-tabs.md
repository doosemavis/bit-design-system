# Dialog and Tabs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `Dialog` (D2 "Retro window" on the native modal `<dialog>`, O2 fold-out and fold-in) and `Tabs` (W3 "Plugged in" cartridges, C6 seat-pour-spread) to @bit-ds/react, with their gallery pages, e2e and release notes, in 0.1.5.

**Architecture:**
- **Dialog** wraps the native `<dialog>`: `showModal()` gives the top layer, an inert page and Esc. React keeps a small phase state (`opening`, `open`, `closing`) that drives CSS keyframes and delays `close()` until the fold-in ends.
- **Tabs** is a compound component (Tabs, TabList, Tab, TabPanel) sharing a private context, with a roving Tab stop and APG keys. A `data-boot` attribute plays the plug-in animation on every change after the first render.
- **CSS:** the motion is CSS only, and the attributes carry the state.
- **Gallery engine additions:**
  - a `demo` wrapper, so the Dialog page can show an "Open dialog" Button and print `useState` code;
  - `virtual` on text and boolean controls.

**Tech Stack:** pnpm monorepo, React 19 + TypeScript, tsup, vitest + jsdom + Testing Library (a 100% coverage gate on `@bit-ds/react`), Playwright + axe, and plain CSS in `packages/core`.

**Spec:** `docs/superpowers/specs/2026-10-07-dialog-tabs-design.md`

### Spec refinements made while planning (each is a ruling; the owner may veto)
1. **Initial focus uses `data-autofocus`, not `autoFocus`.**
   - React never writes the `autofocus` attribute; it calls `focus()` at mount, while the dialog is still closed. So `showModal()` would never see it.
   - After `showModal()`, Dialog focuses the first `[data-autofocus]` element inside. Otherwise the browser's default applies (the first focusable element, the ×).
   - Mantine uses the same attribute.
2. **`DialogClose` part:** a bit Button (outline neutral by default) that closes the dialog. The header's × is a `DialogClose`, and the gallery prints `<DialogClose data-autofocus={true}>Cancel</DialogClose>`, so the printed example's Cancel works.
3. **Manual activation:** the Tab stop stays on the chosen tab. This is the APG rule: focus entering the tab list goes to the active tab.
4. **RTL:** read from the nearest `[dir]` ancestor (`closest('[dir]')`), because jsdom and many apps set `dir` rather than computed CSS.
5. **`Manifest.demo.code` shape:** `{ reactImports, bitImports, setup, props, wrap }`. `props` is printed first on the element (`open={open} onOpenChange={setOpen}`).
6. **Tab and panel ids** use the value with whitespace replaced by `_`.

## Global Constraints

- **Library CSS:**
  - Tokens only. A raw value is allowed only with an explanatory comment on the same or the previous line, as `select.css` does.
  - States are attributes, never classes.
  - Forced colours use system colours.
- **Gallery CSS:** `apps/gallery/src/**/gallery.css` stays layout-only. This plan adds no gallery CSS.
- **Coverage:** `@bit-ds/react` stays at 100% statements, branches, functions and lines (`pnpm --filter @bit-ds/react test:coverage`), with no istanbul-ignore comments.
- **Immutability:** never mutate arrays or objects.
- **Gallery builds against dist:** the gallery imports `@bit-ds/react` from its built `dist/`. Run `pnpm build` after package changes and before gallery tests or e2e.
- **Commits:** conventional, and every message ends with:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  ```
  Stage named paths only; never `git add -A`.
- **Protected file:** don't edit `eslint.config.js` (hook-protected). An inline `// eslint-disable-next-line <rule> -- <reason>` is allowed when a rule misfires.
- **Processes:** never kill processes you didn't start (no `pkill`).
- **Motion:**
  - Every animation is visual only. Content and focus are ready at once.
  - Nothing in Tabs moves upward: no negative `translateY`.
  - Under `prefers-reduced-motion: reduce` there is no animation. `system/motion.css` already shortens every animation to 0.01ms, and the components add `animation: none`.
- **Exact values from the spec:**
  - Dialog widths: sm 320px, md 420px, lg 560px.
  - Dialog: fold 440ms, close fallback 600ms, backdrop `color-mix(in srgb, var(--bit-color-ink) 55%, transparent)`.
  - Tabs timings: seat 0–120ms (3px), pour 120–300ms in 4 steps, spread 300–540ms in 6 steps.
  - Tabs notch: `polygon(0 0, 36% 0, 40% 6px, 60% 6px, 64% 0, 100% 0, 100% 100%, 0 100%)`.

## Review Focus

1. **The browser closes the dialog itself:**
   - Chrome refuses to cancel a repeated Esc without a user activation in between, and fires `close` with no `cancel`.
   - Expected: Dialog's state and `onOpenChange(false)` follow, and focus returns.
   - Tested in Task 1 by dispatching `close` while open.
2. **Reopening during the fold-in:**
   - Expected: the dialog stays open and plays the opening fold. The 600ms fallback must not close it later.
   - Tested in Task 1.
3. **A drag that starts inside the dialog** (selecting text) **and is released over the backdrop:**
   - Expected: it doesn't close.
   - Tested in Task 1 (pointerdown on a child, click on the backdrop).
4. **Rapid tab switches:**
   - Expected: each switch restarts the plug-in animation (`data-boot` alternates `a` and `b`), and `data-boot` always clears, even under reduced motion, where no `animationend` fires.
   - Tested in Task 3 (fake timers).
5. **Uncontrolled Tabs with no `defaultValue` and a disabled first tab:**
   - Expected: the first enabled tab is chosen, and `onValueChange` is not called.
   - Tested in Task 3.

---

## File Structure

| File | Responsibility | Task |
|---|---|---|
| `packages/react/src/components/Dialog/DialogContext.ts` | Private context, `useDialog`, `useRegisterPart` | 1 |
| `packages/react/src/components/Dialog/Dialog.tsx` | The root: native dialog lifecycle, phases, Esc, backdrop, focus return | 1 |
| `packages/react/src/components/Dialog/DialogParts.tsx` | DialogHeader (title and ×), DialogBody, DialogFooter, DialogClose | 1 |
| `packages/react/src/components/Dialog/Dialog.test.tsx` | Unit tests | 1 |
| `packages/react/vitest.setup.ts` | jsdom `showModal`/`close` stand-in | 1 |
| `packages/core/src/components/dialog.css`, `__tests__/components/dialog.test.ts` | Look, motion, scroll lock, forced colours | 2 |
| `packages/react/src/components/Tabs/TabsContext.ts` | Private context, id helpers | 3 |
| `packages/react/src/components/Tabs/Tabs.tsx` | The root: value, boot animation state | 3 |
| `packages/react/src/components/Tabs/TabParts.tsx` | TabList (keys, slot, Tab stop), Tab, TabPanel | 3 |
| `packages/react/src/components/Tabs/Tabs.test.tsx` | Unit tests | 3 |
| `packages/core/src/components/tabs.css`, `__tests__/components/tabs.test.ts` | Cartridges, slot, panel, motion, forced colours | 4 |
| `packages/core/src/index.css` | Import dialog.css and tabs.css | 2, 4 |
| `packages/react/src/index.ts` | Exports | 1, 3 |
| `apps/gallery/src/manifests/types.ts`, `manifests/virtual.ts`, `engine/renderManifest.tsx`, `code/toJsx.ts`, `code/fullFile.ts`, `content/snippets.mjs` (+ `.d.mts`) | `demo` wrapper; virtual text and boolean | 5 |
| `apps/gallery/src/demos/DialogDemo.tsx`, `manifests/dialog.ts`, `manifests/tabs.ts`, `manifests/registry.ts`, `manifests/index.ts` | Pages | 6 |
| `apps/gallery/e2e/dialog.spec.ts`, `e2e/tabs.spec.ts` | Browser checks | 7 |
| `packages/react/scripts/expected-exports.mjs`, `scripts/verify-dist.mjs`, `scripts/smoke-consumer.mjs`, `CHANGELOG.md`, `README.md` | Release | 8 |

---

### Task 1: Dialog (React)

**Files:**
- Create: `packages/react/src/components/Dialog/DialogContext.ts`, `Dialog.tsx`, `DialogParts.tsx`, `Dialog.test.tsx`
- Modify: `packages/react/vitest.setup.ts`, `packages/react/src/index.ts`

**Interfaces:**
- **Produces (for Tasks 2, 6, 7 and 8):**
  - Exports: `Dialog`, `DialogHeader`, `DialogBody`, `DialogFooter`, `DialogClose`, and the types `DialogProps`, `DialogHeaderProps`, `DialogPartProps`, `DialogCloseProps`.
  - DOM:
    - `dialog.bit-dialog.bit-{size}` with `data-state` (`opening` | `open` | `closing`, absent when closed) and `role="alertdialog"` when `alert`;
    - `div.bit-dialog__header > h2.bit-dialog__title + button.bit-dialog__close`;
    - `div.bit-dialog__body` and `div.bit-dialog__footer`.
  - Animation names the CSS must use: `bit-dialog-open` and `bit-dialog-close`.
  - Custom property set on the dialog: `--_bit-dialog-bar` (the header's height in px).

- [ ] **Step 1: Add the jsdom stand-in for `showModal`/`close`**

Append to `packages/react/vitest.setup.ts`:

```ts
// jsdom has no HTMLDialogElement.showModal()/close(). A minimal stand-in for unit tests: showModal sets
// `open`; close clears it and fires `close`, as the browser does. Top layer, inert and focus return are
// browser behaviour, checked by the gallery's Playwright e2e.
if (typeof HTMLDialogElement !== 'undefined' && typeof HTMLDialogElement.prototype.showModal !== 'function') {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    if (!this.hasAttribute('open')) return;
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
}
```

If jsdom's `HTMLDialogElement` lacks an `open` getter that reflects the attribute, also define `Object.defineProperty(HTMLDialogElement.prototype, 'open', { get() { return this.hasAttribute('open'); }, configurable: true })` inside the same `if`. Check with a one-line test before relying on it.

- [ ] **Step 2: Write the failing tests**

Create `packages/react/src/components/Dialog/Dialog.test.tsx`:

```tsx
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { Dialog } from './Dialog';
import { DialogBody, DialogClose, DialogFooter, DialogHeader } from './DialogParts';
import { Button } from '../Button/Button';
import { expectNoA11yViolations } from '../../test/a11y';

/** jsdom has no matchMedia: Dialog then skips animation. Stub it to test the animated path. */
function allowMotion() {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} }));
}
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const dialog = () => document.querySelector('dialog')!;
/** jsdom may lack AnimationEvent: build an animationend React reads `animationName` from. */
function endAnimation(target: Element, animationName: string) {
  act(() => {
    target.dispatchEvent(Object.assign(new Event('animationend', { bubbles: true }), { animationName }));
  });
}

function Harness({ alert = false, withBody = true, onOpenChange = vi.fn() }: { alert?: boolean; withBody?: boolean; onOpenChange?: (open: boolean) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open</Button>
      <Dialog
        open={open}
        alert={alert}
        onOpenChange={(next) => {
          onOpenChange(next);
          setOpen(next);
        }}
      >
        <DialogHeader>Delete report?</DialogHeader>
        {withBody ? <DialogBody>It can't be undone.</DialogBody> : null}
        <DialogFooter>
          <DialogClose data-autofocus>Cancel</DialogClose>
          <Button color="danger">Delete</Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}

async function openIt(props: { alert?: boolean; withBody?: boolean } = {}) {
  const user = userEvent.setup();
  const onOpenChange = vi.fn();
  render(<Harness onOpenChange={onOpenChange} {...props} />);
  await user.click(screen.getByRole('button', { name: 'Open' }));
  return { user, onOpenChange };
}

describe('Dialog: structure and naming', () => {
  it('renders a closed native <dialog> with the size class and no data-state', () => {
    render(<Harness />);
    expect(dialog().tagName).toBe('DIALOG');
    expect(dialog().className).toBe('bit-dialog bit-md');
    expect(dialog().open).toBe(false);
    expect(dialog()).not.toHaveAttribute('data-state');
  });

  it('opening calls showModal; the header names it and the body describes it', async () => {
    const showModal = vi.spyOn(HTMLDialogElement.prototype, 'showModal');
    await openIt();
    expect(showModal).toHaveBeenCalledTimes(1);
    expect(dialog().open).toBe(true);
    const title = document.getElementById(dialog().getAttribute('aria-labelledby')!)!;
    expect(title.tagName).toBe('H2');
    expect(title).toHaveTextContent('Delete report?');
    expect(document.getElementById(dialog().getAttribute('aria-describedby')!)).toHaveTextContent("It can't be undone.");
    showModal.mockRestore();
  });

  it('without a DialogBody there is no aria-describedby; alert makes it an alertdialog', async () => {
    await openIt({ withBody: false, alert: true });
    expect(dialog()).not.toHaveAttribute('aria-describedby');
    expect(dialog()).toHaveAttribute('role', 'alertdialog');
  });

  it('focuses the [data-autofocus] element after opening', async () => {
    await openIt();
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
  });

  it('size and className go on the <dialog>; the ref reaches it', () => {
    const ref = createRef<HTMLDialogElement>();
    render(
      <Dialog ref={ref} open={false} onOpenChange={() => {}} size="lg" className="mine">
        <DialogHeader>T</DialogHeader>
      </Dialog>,
    );
    expect(ref.current).toBe(dialog());
    expect(dialog().className).toBe('bit-dialog bit-lg mine');
  });

  it('parts outside a Dialog throw a clear error', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<DialogHeader>T</DialogHeader>)).toThrow('bit: <DialogHeader> must be inside a <Dialog>.');
    error.mockRestore();
  });

  it('has no axe violations while open', async () => {
    await openIt();
    await expectNoA11yViolations(document.body);
  });
});

describe('Dialog: closing', () => {
  it('Esc: the cancel event is prevented and onOpenChange(false) is asked; with reduced motion it closes at once', async () => {
    const { onOpenChange } = await openIt();
    const cancel = new Event('cancel', { cancelable: true });
    act(() => {
      dialog().dispatchEvent(cancel);
    });
    expect(cancel.defaultPrevented).toBe(true);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(dialog().open).toBe(false);
  });

  it('the × (named Close) and DialogClose close it', async () => {
    const { user } = await openIt();
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(dialog().open).toBe(false);
    await user.click(screen.getByRole('button', { name: 'Open' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(dialog().open).toBe(false);
  });

  it('closeLabel renames the ×; a DialogClose whose onClick prevents default does not close', async () => {
    const user = userEvent.setup();
    render(
      <Dialog open onOpenChange={vi.fn()}>
        <DialogHeader closeLabel="Dismiss">T</DialogHeader>
        <DialogFooter>
          <DialogClose onClick={(event) => event.preventDefault()}>Keep</DialogClose>
        </DialogFooter>
      </Dialog>,
    );
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Keep' }));
    expect(dialog().open).toBe(true);
  });

  it('a press and release on the backdrop closes it', async () => {
    const { onOpenChange } = await openIt();
    fireEvent.pointerDown(dialog(), { clientX: -5, clientY: -5 });
    fireEvent.click(dialog(), { clientX: -5, clientY: -5 });
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('alert: a backdrop click does not close', async () => {
    const { onOpenChange } = await openIt({ alert: true });
    onOpenChange.mockClear();
    fireEvent.pointerDown(dialog(), { clientX: -5, clientY: -5 });
    fireEvent.click(dialog(), { clientX: -5, clientY: -5 });
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('a drag that starts inside and ends on the backdrop does not close; a click on content does not close', async () => {
    const { onOpenChange } = await openIt();
    onOpenChange.mockClear();
    fireEvent.pointerDown(screen.getByText("It can't be undone."), { clientX: 5, clientY: 5 });
    fireEvent.click(dialog(), { clientX: -5, clientY: -5 });
    fireEvent.pointerDown(dialog(), { clientX: 5, clientY: 5 });
    fireEvent.click(screen.getByText("It can't be undone."));
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('when the browser closes it itself (no cancel), state and onOpenChange follow, and focus returns', async () => {
    const { onOpenChange } = await openIt();
    act(() => {
      dialog().removeAttribute('open');
      dialog().dispatchEvent(new Event('close'));
    });
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(dialog()).not.toHaveAttribute('data-state');
    expect(screen.getByRole('button', { name: 'Open' })).toHaveFocus();
  });

  it('focus goes back to the opener after closing, when it was left inside the dialog', async () => {
    const { user } = await openIt();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('button', { name: 'Open' })).toHaveFocus();
  });

  it('focus is not stolen back when it already moved elsewhere', async () => {
    const user = userEvent.setup();
    function Two() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Open</Button>
          <Button>Elsewhere</Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogHeader>T</DialogHeader>
          </Dialog>
        </>
      );
    }
    render(<Two />);
    await user.click(screen.getByRole('button', { name: 'Open' }));
    act(() => screen.getByRole('button', { name: 'Elsewhere', hidden: true }).focus());
    act(() => {
      dialog().dispatchEvent(new Event('cancel', { cancelable: true }));
    });
    expect(screen.getByRole('button', { name: 'Elsewhere', hidden: true })).toHaveFocus();
  });

  it('unmounting while open closes the native dialog', () => {
    const close = vi.spyOn(HTMLDialogElement.prototype, 'close');
    const { unmount } = render(
      <Dialog open onOpenChange={() => {}}>
        <DialogHeader>T</DialogHeader>
      </Dialog>,
    );
    unmount();
    expect(close).toHaveBeenCalled();
    close.mockRestore();
  });
});

describe('Dialog: motion', () => {
  it('opening plays (data-state opening) until bit-dialog-open ends on the dialog itself', async () => {
    allowMotion();
    await openIt();
    expect(dialog()).toHaveAttribute('data-state', 'opening');
    endAnimation(screen.getByText("It can't be undone."), 'bit-dialog-open');
    expect(dialog()).toHaveAttribute('data-state', 'opening');
    endAnimation(dialog(), 'something-else');
    expect(dialog()).toHaveAttribute('data-state', 'opening');
    endAnimation(dialog(), 'bit-dialog-open');
    expect(dialog()).toHaveAttribute('data-state', 'open');
  });

  it('closing folds in (data-state closing, still open) and closes when bit-dialog-close ends', async () => {
    allowMotion();
    const { user } = await openIt();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(dialog()).toHaveAttribute('data-state', 'closing');
    expect(dialog().open).toBe(true);
    endAnimation(dialog(), 'bit-dialog-close');
    expect(dialog().open).toBe(false);
    expect(dialog()).not.toHaveAttribute('data-state');
  });

  it('closing falls back to closing after 600ms when no animationend arrives', async () => {
    allowMotion();
    await openIt();
    vi.useFakeTimers();
    act(() => screen.getByRole('button', { name: 'Cancel' }).click());
    expect(dialog().open).toBe(true);
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(dialog().open).toBe(false);
  });

  it('reopening during the fold-in stays open, and the fallback does not close it later', () => {
    allowMotion();
    vi.useFakeTimers();
    function Toggle() {
      const [open, setOpen] = useState(true);
      return (
        <>
          <Button onClick={() => setOpen((o) => !o)}>Toggle</Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogHeader>T</DialogHeader>
          </Dialog>
        </>
      );
    }
    render(<Toggle />);
    act(() => screen.getByRole('button', { name: 'Toggle', hidden: true }).click());
    expect(dialog()).toHaveAttribute('data-state', 'closing');
    act(() => screen.getByRole('button', { name: 'Toggle', hidden: true }).click());
    expect(dialog()).toHaveAttribute('data-state', 'opening');
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(dialog().open).toBe(true);
  });
});
```

Adapt only the mechanics if they differ in this repo (the `hidden: true` queries, fake timers alongside `userEvent`), and keep every assertion.

- [ ] **Step 3: Run them to verify they fail**

Run: `pnpm --filter @bit-ds/react exec vitest run src/components/Dialog`
Expected: FAIL. The run can't resolve `./Dialog` or `./DialogParts`.

- [ ] **Step 4: Write `DialogContext.ts`**

```ts
import { createContext, useContext, useEffect } from 'react';

export type DialogPart = 'header' | 'body';

/** What a Dialog tells its parts. Private: not exported from the package. */
export interface DialogContextValue {
  titleId: string;
  bodyId: string;
  /** Ask the Dialog to close: it calls onOpenChange(false). */
  close: () => void;
  /** A part says it is rendered, so the Dialog points aria-labelledby or aria-describedby at it. Returns the undo. */
  register: (part: DialogPart) => () => void;
}

export const DialogContext = createContext<DialogContextValue | null>(null);

/** The surrounding Dialog, or a clear error naming the part that is outside one. */
export function useDialog(partName: string): DialogContextValue {
  const dialog = useContext(DialogContext);
  if (!dialog) throw new Error(`bit: <${partName}> must be inside a <Dialog>.`);
  return dialog;
}

/** Register a part with its Dialog for as long as it is mounted. */
export function useRegisterPart(dialog: DialogContextValue, part: DialogPart): void {
  const { register } = dialog;
  useEffect(() => register(part), [register, part]);
}
```

- [ ] **Step 5: Write `Dialog.tsx`**

```tsx
import { forwardRef, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { AnimationEvent, DialogHTMLAttributes, MouseEvent, PointerEvent, ReactNode, SyntheticEvent } from 'react';
import { SIZES } from '../../system/axes';
import type { Size } from '../../system/axes';
import { element, toClasses } from '../../system/toClasses';
import { composeRefs } from '../../system/Slot';
import { DialogContext } from './DialogContext';
import type { DialogContextValue, DialogPart } from './DialogContext';

export interface DialogProps extends Omit<DialogHTMLAttributes<HTMLDialogElement>, 'open' | 'onClose' | 'onCancel' | 'color'> {
  /** Whether the dialog is open. Dialog is controlled: keep this in state. */
  open: boolean;
  /** Called with false when the person asks to close: Esc, the ×, a DialogClose, or a click on the dimmed page. */
  onOpenChange: (open: boolean) => void;
  /** An alertdialog (a confirmation): a click on the dimmed page does not close it. Esc and × still do. */
  alert?: boolean;
  /** Width: sm 320px, md 420px, lg 560px. Class: `bit-{size}`. */
  size?: Size;
  /** DialogHeader, DialogBody and DialogFooter. */
  children: ReactNode;
}

type Phase = 'closed' | 'opening' | 'open' | 'closing';

/** The CSS animation names (dialog.css) this component waits for. */
const OPEN_ANIMATION = 'bit-dialog-open';
const CLOSE_ANIMATION = 'bit-dialog-close';
/** How long a close waits for its fold-in before closing anyway (an animation that never ends, a background tab). */
const CLOSE_FALLBACK_MS = 600;

/** True when motion is reduced, or when the browser can't say, so nothing animates. */
function reducedMotion(): boolean {
  return typeof window.matchMedia !== 'function' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** True when a pointer position lies outside a box: on a modal dialog, that is the dimmed backdrop. */
function outside(point: { clientX: number; clientY: number }, box: DOMRect): boolean {
  return point.clientX < box.left || point.clientX > box.right || point.clientY < box.top || point.clientY > box.bottom;
}

/**
 * A modal dialog on the native <dialog> and showModal(): the browser puts it in the top layer, makes the
 * page behind inert and handles Esc. Dialog adds the Retro window look, the fold-out and fold-in, focus on
 * a [data-autofocus] element, focus back to the opener, and closing on a backdrop click (not for `alert`).
 */
export const Dialog = forwardRef<HTMLDialogElement, DialogProps>(function Dialog(
  { open, onOpenChange, alert = false, size = 'md', className, children, onClick, onPointerDown, onAnimationEnd, ...rest },
  ref,
) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const setRef = useMemo(() => composeRefs(ref, dialogRef), [ref]);
  const titleId = useId();
  const bodyId = useId();
  const [parts, setParts] = useState<Readonly<Record<DialogPart, boolean>>>({ header: false, body: false });
  const [phase, setPhase] = useState<Phase>('closed');
  const returnTo = useRef<HTMLElement | null>(null);
  const downOnBackdrop = useRef(false);
  const expectedClose = useRef(false);
  const fallback = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const requestClose = useCallback(() => onOpenChange(false), [onOpenChange]);

  /** Focus the opener again, unless focus has already gone somewhere else on the page. */
  const restoreFocus = useCallback(() => {
    const target = returnTo.current;
    returnTo.current = null;
    const active = document.activeElement;
    const lost = active === null || active === document.body || dialogRef.current?.contains(active) === true;
    if (target?.isConnected && lost) target.focus();
  }, []);

  const finishClose = useCallback(() => {
    clearTimeout(fallback.current);
    const dialog = dialogRef.current;
    if (dialog?.open) {
      expectedClose.current = true;
      dialog.close();
    }
    setPhase('closed');
    restoreFocus();
  }, [restoreFocus]);

  useEffect(() => {
    const dialog = dialogRef.current!;
    if (open) {
      clearTimeout(fallback.current);
      if (!dialog.open) {
        returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        dialog.showModal();
        const header = dialog.querySelector<HTMLElement>(`.${element('dialog', 'header')}`);
        if (header) dialog.style.setProperty('--_bit-dialog-bar', `${header.offsetHeight}px`);
        dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus();
      }
      setPhase(reducedMotion() ? 'open' : 'opening');
      return;
    }
    if (!dialog.open) return;
    if (reducedMotion()) {
      finishClose();
      return;
    }
    setPhase('closing');
    fallback.current = setTimeout(finishClose, CLOSE_FALLBACK_MS);
  }, [open, finishClose]);

  // Unmounting while open must not leave the page inert.
  useEffect(() => {
    const dialog = dialogRef.current;
    const timers = fallback;
    return () => {
      clearTimeout(timers.current);
      if (dialog?.open) dialog.close();
    };
  }, []);

  const register = useCallback((part: DialogPart) => {
    setParts((current) => ({ ...current, [part]: true }));
    return () => setParts((current) => ({ ...current, [part]: false }));
  }, []);

  const context = useMemo<DialogContextValue>(() => ({ titleId, bodyId, close: requestClose, register }), [titleId, bodyId, requestClose, register]);

  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
    // Esc: the browser would close at once, skipping the fold-in and our state. Ask instead.
    event.preventDefault();
    requestClose();
  }

  function handleClose() {
    if (expectedClose.current) {
      expectedClose.current = false;
      return;
    }
    // The browser closed it itself (it may refuse to cancel a repeated Esc): catch up.
    clearTimeout(fallback.current);
    setPhase('closed');
    restoreFocus();
    if (open) onOpenChange(false);
  }

  function handlePointerDown(event: PointerEvent<HTMLDialogElement>) {
    onPointerDown?.(event);
    downOnBackdrop.current = event.target === event.currentTarget && outside(event, event.currentTarget.getBoundingClientRect());
  }

  function handleClick(event: MouseEvent<HTMLDialogElement>) {
    onClick?.(event);
    const startedOnBackdrop = downOnBackdrop.current;
    downOnBackdrop.current = false;
    if (alert || !startedOnBackdrop || event.target !== event.currentTarget) return;
    if (outside(event, event.currentTarget.getBoundingClientRect())) requestClose();
  }

  function handleAnimationEnd(event: AnimationEvent<HTMLDialogElement>) {
    onAnimationEnd?.(event);
    if (event.target !== event.currentTarget) return;
    if (phase === 'closing' && event.animationName === CLOSE_ANIMATION) finishClose();
    else if (phase === 'opening' && event.animationName === OPEN_ANIMATION) setPhase('open');
  }

  return (
    <DialogContext.Provider value={context}>
      <dialog
        ref={setRef}
        className={toClasses('dialog', [{ name: 'size', allowed: SIZES, value: size }], className)}
        role={alert ? 'alertdialog' : undefined}
        aria-labelledby={parts.header ? titleId : undefined}
        aria-describedby={parts.body ? bodyId : undefined}
        data-state={phase === 'closed' ? undefined : phase}
        {...rest}
        onCancel={handleCancel}
        onClose={handleClose}
        onPointerDown={handlePointerDown}
        onClick={handleClick}
        onAnimationEnd={handleAnimationEnd}
      >
        {children}
      </dialog>
    </DialogContext.Provider>
  );
});
```

- [ ] **Step 6: Write `DialogParts.tsx`**

```tsx
import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { element, withClassName } from '../../system/toClasses';
import { Button } from '../Button/Button';
import type { ButtonProps } from '../Button/Button';
import { useDialog, useRegisterPart } from './DialogContext';

export interface DialogHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'color'> {
  /** The title. It names the dialog for screen readers. */
  children: ReactNode;
  /** The × button's accessible name. Default: 'Close'. */
  closeLabel?: string;
}

export type DialogPartProps = Omit<HTMLAttributes<HTMLDivElement>, 'color'>;

/** A Button that closes its Dialog. Outline neutral by default; any Button prop works. */
export type DialogCloseProps = ButtonProps;

export const DialogClose = forwardRef<HTMLButtonElement, DialogCloseProps>(function DialogClose(
  { variant = 'outline', color = 'neutral', onClick, ...rest },
  ref,
) {
  const dialog = useDialog('DialogClose');
  return (
    <Button
      ref={ref}
      variant={variant}
      color={color}
      {...rest}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) dialog.close();
      }}
    />
  );
});

/** The purple title bar: the title (an h2 that names the dialog) and the × button. */
export const DialogHeader = forwardRef<HTMLDivElement, DialogHeaderProps>(function DialogHeader(
  { children, closeLabel = 'Close', className, ...rest },
  ref,
) {
  const dialog = useDialog('DialogHeader');
  useRegisterPart(dialog, 'header');
  return (
    <div ref={ref} className={withClassName(element('dialog', 'header'), className)} {...rest}>
      <h2 id={dialog.titleId} className={element('dialog', 'title')}>
        {children}
      </h2>
      <DialogClose size="sm" className={element('dialog', 'close')} aria-label={closeLabel}>
        <span aria-hidden="true">×</span>
      </DialogClose>
    </div>
  );
});

/** The content. It describes the dialog for screen readers. */
export const DialogBody = forwardRef<HTMLDivElement, DialogPartProps>(function DialogBody({ className, ...rest }, ref) {
  const dialog = useDialog('DialogBody');
  useRegisterPart(dialog, 'body');
  return <div ref={ref} id={dialog.bodyId} className={withClassName(element('dialog', 'body'), className)} {...rest} />;
});

/** The actions, end-aligned. */
export const DialogFooter = forwardRef<HTMLDivElement, DialogPartProps>(function DialogFooter({ className, ...rest }, ref) {
  useDialog('DialogFooter');
  return <div ref={ref} className={withClassName(element('dialog', 'footer'), className)} {...rest} />;
});
```

If `ButtonProps` names its axes differently, read `Button.tsx` and use its names. The intent is an outline neutral Button by default.

- [ ] **Step 7: Export it**

In `packages/react/src/index.ts`, after the Card exports, add:

```ts
export { Dialog } from './components/Dialog/Dialog';
export type { DialogProps } from './components/Dialog/Dialog';
export { DialogHeader, DialogBody, DialogFooter, DialogClose } from './components/Dialog/DialogParts';
export type { DialogHeaderProps, DialogPartProps, DialogCloseProps } from './components/Dialog/DialogParts';
```

- [ ] **Step 8: Run the tests, coverage, typecheck and lint**

Run: `pnpm --filter @bit-ds/react test:coverage && pnpm --filter @bit-ds/react typecheck && pnpm lint`
Expected: every test passes, and coverage is 100%. A branch left uncovered gets a real test in `Dialog.test.tsx`.

- [ ] **Step 9: Commit**

```bash
git add packages/react/vitest.setup.ts packages/react/src/components/Dialog packages/react/src/index.ts
git commit -m "feat(react): Dialog on the native modal <dialog>: fold-out and fold-in, Esc, backdrop, focus back, DialogClose

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Dialog CSS (core)

**Files:**
- Create: `packages/core/src/components/dialog.css`
- Create: `packages/core/src/__tests__/components/dialog.test.ts`
- Modify: `packages/core/src/index.css` (add `@import "./components/dialog.css";` after `card.css`)

**Interfaces:**
- **Consumes, from Task 1:**
  - the classes `bit-dialog`, `bit-dialog__header`, `__title`, `__close`, `__body` and `__footer`;
  - `data-state` and `--_bit-dialog-bar`;
  - the animation names `bit-dialog-open` and `bit-dialog-close`.

- [ ] **Step 1: Write the failing CSS tests**

Create `packages/core/src/__tests__/components/dialog.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { block, readCss, styleRules } from '../css';

describe('components/dialog.css', () => {
  const css = readCss('components/dialog.css');
  const inMedia = (media: string, selector: string) =>
    styleRules(css).find((rule) => rule.media === media && rule.selector.split(', ').includes(selector))?.body ?? null;

  it('the box: surface, line border, 10px radius, large shadow, no padding, kept inside the viewport', () => {
    const box = block(css, '.bit-dialog')!;
    for (const line of [
      'padding: 0;',
      'color: var(--bit-color-text);',
      'background: var(--bit-color-surface);',
      'border: var(--bit-border-width) solid var(--bit-color-line);',
      'border-radius: var(--bit-radius-10px);',
      'box-shadow: var(--bit-shadow-lg);',
      'max-width: calc(100vw - var(--bit-space-32px));',
    ]) {
      expect(box).toContain(line);
    }
  });

  it('sizes are 320, 420 and 560px wide', () => {
    expect(block(css, '.bit-dialog.bit-sm')).toContain('width: 320px;');
    expect(block(css, '.bit-dialog.bit-md')).toContain('width: 420px;');
    expect(block(css, '.bit-dialog.bit-lg')).toContain('width: 560px;');
  });

  it('the backdrop dims the page with ink at 55%, and the page does not scroll behind a modal', () => {
    expect(block(css, '.bit-dialog::backdrop')).toContain('background: color-mix(in srgb, var(--bit-color-ink) 55%, transparent);');
    expect(block(css, 'html:has(.bit-dialog:modal)')).toContain('overflow: hidden;');
  });

  it('the header is the purple title bar; the title is the pixel font, uppercase', () => {
    const header = block(css, '.bit-dialog__header')!;
    expect(header).toContain('background: var(--bit-color-primary);');
    expect(header).toContain('color: var(--bit-color-primary-contrast);');
    expect(header).toContain('border-bottom: var(--bit-border-width) solid var(--bit-color-line);');
    const title = block(css, '.bit-dialog__title')!;
    expect(title).toContain('font-family: var(--bit-font-pixel);');
    expect(title).toContain('text-transform: uppercase;');
  });

  it('opening and closing play the two fold animations, 440ms in hard steps', () => {
    expect(block(css, '.bit-dialog[data-state="opening"]')).toContain('animation: bit-dialog-open 440ms steps(1, end) both;');
    expect(block(css, '.bit-dialog[data-state="closing"]')).toContain('animation: bit-dialog-close 440ms steps(1, end) both;');
    expect(css).toContain('@keyframes bit-dialog-open');
    expect(css).toContain('@keyframes bit-dialog-close');
    expect(css).toContain('var(--_bit-dialog-bar, 46px)');
  });

  it('reduced motion: no animation', () => {
    expect(inMedia('(prefers-reduced-motion: reduce)', '.bit-dialog[data-state]')).toContain('animation: none;');
  });

  it('forced colours: system colours for the border and title bar', () => {
    expect(inMedia('(forced-colors: active)', '.bit-dialog')).toContain('border-color: CanvasText;');
    const header = inMedia('(forced-colors: active)', '.bit-dialog__header')!;
    expect(header).toContain('background: Canvas;');
    expect(header).toContain('color: CanvasText;');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @bit-ds/core exec vitest run src/__tests__/components/dialog.test.ts`
Expected: FAIL. `components/dialog.css` doesn't exist.

- [ ] **Step 3: Write `dialog.css`**

```css
/* Dialog (D2 "Retro window") on a native modal <dialog>. data-state is "opening", "open" or "closing"
   (absent when closed). Opening and closing play the same frames in opposite directions, under two names,
   because a browser won't restart an animation whose name didn't change. */
.bit-dialog {
  box-sizing: border-box;
  max-width: calc(100vw - var(--bit-space-32px));
  max-height: calc(100dvh - var(--bit-space-32px));
  padding: 0;
  overflow: hidden;
  font-family: var(--bit-font-body);
  color: var(--bit-color-text);
  background: var(--bit-color-surface);
  border: var(--bit-border-width) solid var(--bit-color-line);
  border-radius: var(--bit-radius-10px);
  box-shadow: var(--bit-shadow-lg);
}

/* raw: dialog widths have no token */
.bit-dialog.bit-sm { width: 320px; }
.bit-dialog.bit-md { width: 420px; }
.bit-dialog.bit-lg { width: 560px; }

/* Only while open, so a closed dialog stays display: none. */
.bit-dialog[open] {
  display: flex;
  flex-direction: column;
}

.bit-dialog::backdrop {
  background: color-mix(in srgb, var(--bit-color-ink) 55%, transparent);
}

/* The page behind a modal dialog does not scroll. */
html:has(.bit-dialog:modal) {
  overflow: hidden;
}

.bit-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--bit-space-12px);
  padding: var(--bit-space-8px) var(--bit-space-8px) var(--bit-space-8px) var(--bit-space-16px);
  color: var(--bit-color-primary-contrast);
  background: var(--bit-color-primary);
  border-bottom: var(--bit-border-width) solid var(--bit-color-line);
}

.bit-dialog__title {
  margin: 0;
  font-family: var(--bit-font-pixel);
  font-size: 11px; /* raw: the pixel font's sub-scale size, as Badge */
  font-weight: var(--bit-weight-normal);
  line-height: var(--bit-leading-normal);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

/* The × is a bit Button (sm, outline): square, so it reads as an icon. */
.bit-dialog__close {
  flex: none;
  width: var(--_bit-size-height);
  padding: 0;
}

.bit-dialog__body {
  padding: var(--bit-space-16px);
  overflow: auto;
  line-height: var(--bit-leading-normal);
}

.bit-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--bit-space-8px);
  padding: 0 var(--bit-space-16px) var(--bit-space-16px);
}

/* O2 "Bar, then pour": the title bar opens out from the centre in pixel blocks, then the window pours down.
   Closing is the same frames backwards. raw: 440ms (no motion token is this long). */
.bit-dialog[data-state="opening"] {
  animation: bit-dialog-open 440ms steps(1, end) both;
}

.bit-dialog[data-state="closing"] {
  animation: bit-dialog-close 440ms steps(1, end) both;
}

.bit-dialog[data-state="opening"]::backdrop {
  animation: bit-dialog-dim var(--bit-duration-normal) steps(2) both;
}

/* The page undims at the end of the fold-in. raw: 280ms = 440ms - the dim's own duration. */
.bit-dialog[data-state="closing"]::backdrop {
  animation: bit-dialog-dim var(--bit-duration-normal) steps(2) 280ms reverse both;
}

@keyframes bit-dialog-open {
  0% { clip-path: inset(0 50% calc(100% - var(--_bit-dialog-bar, 46px)) 50%); }
  10% { clip-path: inset(0 38% calc(100% - var(--_bit-dialog-bar, 46px)) 38%); }
  20% { clip-path: inset(0 25% calc(100% - var(--_bit-dialog-bar, 46px)) 25%); }
  30% { clip-path: inset(0 12% calc(100% - var(--_bit-dialog-bar, 46px)) 12%); }
  40% { clip-path: inset(0 0 calc(100% - var(--_bit-dialog-bar, 46px)) 0); }
  55% { clip-path: inset(0 0 60% 0); }
  70% { clip-path: inset(0 0 35% 0); }
  85% { clip-path: inset(0 0 12% 0); }
  100% { clip-path: inset(0); }
}

@keyframes bit-dialog-close {
  0% { clip-path: inset(0); }
  15% { clip-path: inset(0 0 12% 0); }
  30% { clip-path: inset(0 0 35% 0); }
  45% { clip-path: inset(0 0 60% 0); }
  60% { clip-path: inset(0 0 calc(100% - var(--_bit-dialog-bar, 46px)) 0); }
  70% { clip-path: inset(0 12% calc(100% - var(--_bit-dialog-bar, 46px)) 12%); }
  80% { clip-path: inset(0 25% calc(100% - var(--_bit-dialog-bar, 46px)) 25%); }
  90% { clip-path: inset(0 38% calc(100% - var(--_bit-dialog-bar, 46px)) 38%); }
  100% { clip-path: inset(0 50% calc(100% - var(--_bit-dialog-bar, 46px)) 50%); }
}

@keyframes bit-dialog-dim {
  from { background: transparent; }
}

@media (prefers-reduced-motion: reduce) {
  .bit-dialog[data-state],
  .bit-dialog[data-state]::backdrop {
    animation: none;
  }
}

@media (forced-colors: active) {
  .bit-dialog {
    border-color: CanvasText;
  }

  .bit-dialog__header {
    background: Canvas;
    color: CanvasText;
    border-bottom-color: CanvasText;
  }
}
```

Add `@import "./components/dialog.css";` to `packages/core/src/index.css`, after the `card.css` line. The system test fails if a component file isn't imported.

If a core test or helper can't parse `html:has(...)` or the `@keyframes` blocks, report it before changing the helper.

- [ ] **Step 4: Run the core suite and build**

Run: `pnpm --filter @bit-ds/core test && pnpm build && pnpm verify`
Expected: PASS and `dist OK`.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/components/dialog.css packages/core/src/__tests__/components/dialog.test.ts packages/core/src/index.css
git commit -m "feat(core): Dialog's Retro window look, pixel fold-out and fold-in, and scroll lock

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Tabs (React)

**Files:**
- Create: `packages/react/src/components/Tabs/TabsContext.ts`, `Tabs.tsx`, `TabParts.tsx`, `Tabs.test.tsx`
- Modify: `packages/react/src/index.ts`

**Interfaces:**
- **Produces (for Tasks 4, 6, 7 and 8):**
  - Exports: `Tabs`, `TabList`, `Tab`, `TabPanel`, and the types `TabsProps`, `TabListProps`, `TabProps`, `TabPanelProps`.
  - DOM:
    - `div.bit-tabs > div.bit-tabs__bar > (div.bit-tabs__list[role=tablist] + span.bit-tabs__slot[aria-hidden])`, then `div.bit-tabs__panel[role=tabpanel]`;
    - a tab is `button.bit-tabs__tab[role=tab][data-value] > span.bit-tabs__label`;
    - `data-boot="a" | "b"` sits on the chosen tab and the slot while the plug-in animation plays;
    - `--_bit-tabs-x` is set on the slot.

- [ ] **Step 1: Write the failing tests**

Create `packages/react/src/components/Tabs/Tabs.test.tsx`:

```tsx
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tabs } from './Tabs';
import { Tab, TabList, TabPanel } from './TabParts';
import type { TabsProps } from './Tabs';
import { expectNoA11yViolations } from '../../test/a11y';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function Demo({ disabledFirst = false, ...props }: Partial<TabsProps> & { disabledFirst?: boolean }) {
  return (
    <Tabs {...props}>
      <TabList aria-label="Docs">
        <Tab value="overview" disabled={disabledFirst}>Overview</Tab>
        <Tab value="usage">Usage</Tab>
        <Tab value="props" disabled>Props</Tab>
        <Tab value="a11y">A11y</Tab>
      </TabList>
      <TabPanel value="overview">Overview panel</TabPanel>
      <TabPanel value="usage">Usage panel</TabPanel>
      <TabPanel value="props">Props panel</TabPanel>
      <TabPanel value="a11y">A11y panel</TabPanel>
    </Tabs>
  );
}

const tab = (name: string) => screen.getByRole('tab', { name });

describe('Tabs: structure and ARIA', () => {
  it('links each tab to its panel and back; only the chosen panel shows, the rest stay mounted and hidden', () => {
    const { container } = render(<Demo defaultValue="usage" />);
    expect(screen.getByRole('tablist', { name: 'Docs' })).toBeInTheDocument();
    expect(tab('Usage')).toHaveAttribute('aria-selected', 'true');
    expect(tab('Overview')).toHaveAttribute('aria-selected', 'false');
    const panel = screen.getByRole('tabpanel');
    expect(panel).toHaveTextContent('Usage panel');
    expect(tab('Usage')).toHaveAttribute('aria-controls', panel.id);
    expect(panel).toHaveAttribute('aria-labelledby', tab('Usage').id);
    expect(panel).toHaveAttribute('tabindex', '0');
    expect(container.querySelectorAll('[role="tabpanel"][hidden]')).toHaveLength(3);
  });

  it('only the chosen tab is a Tab stop', () => {
    render(<Demo defaultValue="usage" />);
    expect(tab('Usage')).toHaveAttribute('tabindex', '0');
    expect(tab('Overview')).toHaveAttribute('tabindex', '-1');
    expect(tab('A11y')).toHaveAttribute('tabindex', '-1');
  });

  it('with no defaultValue the first enabled tab is chosen, without calling onValueChange', () => {
    const onValueChange = vi.fn();
    render(<Demo disabledFirst onValueChange={onValueChange} />);
    expect(tab('Usage')).toHaveAttribute('aria-selected', 'true');
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('a controlled value no tab has shows no panel, and the first enabled tab is the Tab stop', () => {
    render(<Demo value="nope" />);
    expect(screen.queryByRole('tabpanel')).toBeNull();
    expect(tab('Overview')).toHaveAttribute('tabindex', '0');
  });

  it('the label is wrapped in a span (for the inside focus ring); the slot is hidden from screen readers', () => {
    const { container } = render(<Demo />);
    expect(tab('Overview').firstElementChild).toHaveClass('bit-tabs__label');
    expect(container.querySelector('.bit-tabs__slot')).toHaveAttribute('aria-hidden', 'true');
  });

  it('warns in development when TabList has no name', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Tabs>
        <TabList>
          <Tab value="a">A</Tab>
        </TabList>
      </Tabs>,
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('<TabList> needs aria-label or aria-labelledby'));
    warn.mockRestore();
  });

  it('parts outside Tabs throw a clear error', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Tab value="a">A</Tab>)).toThrow('bit: <Tab> must be inside <Tabs>.');
    error.mockRestore();
  });

  it('has no axe violations', async () => {
    const { container } = render(<Demo />);
    await expectNoA11yViolations(container);
  });
});

describe('Tabs: keyboard and pointer', () => {
  it('automatic: arrows move and choose, wrapping and skipping disabled tabs; Home and End jump', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Demo defaultValue="overview" onValueChange={onValueChange} />);
    act(() => tab('Overview').focus());
    await user.keyboard('{ArrowRight}');
    expect(tab('Usage')).toHaveFocus();
    expect(tab('Usage')).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{ArrowRight}');
    expect(tab('A11y')).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(tab('Overview')).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(tab('A11y')).toHaveFocus();
    await user.keyboard('{Home}');
    expect(tab('Overview')).toHaveFocus();
    await user.keyboard('{End}');
    expect(tab('A11y')).toHaveFocus();
    expect(onValueChange.mock.calls.map((call) => call[0])).toEqual(['usage', 'a11y', 'overview', 'a11y', 'overview', 'a11y']);
  });

  it('manual: arrows only move focus; Enter or Space chooses; the Tab stop stays on the chosen tab', async () => {
    const user = userEvent.setup();
    render(<Demo defaultValue="overview" activation="manual" />);
    act(() => tab('Overview').focus());
    await user.keyboard('{ArrowRight}');
    expect(tab('Usage')).toHaveFocus();
    expect(tab('Overview')).toHaveAttribute('aria-selected', 'true');
    expect(tab('Overview')).toHaveAttribute('tabindex', '0');
    await user.keyboard('{Enter}');
    expect(tab('Usage')).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{ArrowRight}');
    await user.keyboard(' ');
    expect(tab('A11y')).toHaveAttribute('aria-selected', 'true');
  });

  it('in a right-to-left page the arrows swap', async () => {
    const user = userEvent.setup();
    render(
      <div dir="rtl">
        <Demo defaultValue="overview" />
      </div>,
    );
    act(() => tab('Overview').focus());
    await user.keyboard('{ArrowLeft}');
    expect(tab('Usage')).toHaveFocus();
  });

  it('clicking chooses; a disabled tab cannot be chosen; choosing the current tab does not call onValueChange', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Demo defaultValue="overview" onValueChange={onValueChange} />);
    await user.click(tab('Overview'));
    await user.click(tab('Props'));
    expect(onValueChange).not.toHaveBeenCalled();
    await user.click(tab('Usage'));
    expect(onValueChange).toHaveBeenCalledWith('usage');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Usage panel');
  });

  it('controlled: value wins; choosing only reports', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Demo value="overview" onValueChange={onValueChange} />);
    await user.click(tab('Usage'));
    expect(onValueChange).toHaveBeenCalledWith('usage');
    expect(tab('Overview')).toHaveAttribute('aria-selected', 'true');
  });

  it('other keys do nothing, and a TabList keydown handler can opt out', async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="a">
        <TabList aria-label="X" onKeyDown={(event) => event.key === 'End' && event.preventDefault()}>
          <Tab value="a">A</Tab>
          <Tab value="b">B</Tab>
        </TabList>
      </Tabs>,
    );
    act(() => tab('A').focus());
    await user.keyboard('{End}');
    await user.keyboard('x');
    expect(tab('A')).toHaveFocus();
  });
});

describe('Tabs: the plug-in animation', () => {
  it('does not play on the first render; plays on a change, alternating a and b; clears on the slot animationend', async () => {
    const user = userEvent.setup();
    const { container } = render(<Demo defaultValue="overview" />);
    const slot = container.querySelector('.bit-tabs__slot')!;
    expect(slot).not.toHaveAttribute('data-boot');
    await user.click(tab('Usage'));
    expect(slot).toHaveAttribute('data-boot', 'a');
    expect(tab('Usage')).toHaveAttribute('data-boot', 'a');
    expect(tab('Overview')).not.toHaveAttribute('data-boot');
    await user.click(tab('A11y'));
    expect(slot).toHaveAttribute('data-boot', 'b');
    act(() => {
      slot.dispatchEvent(new Event('animationend', { bubbles: true }));
    });
    expect(slot).not.toHaveAttribute('data-boot');
  });

  it('clears after 900ms even when no animationend comes (reduced motion)', () => {
    vi.useFakeTimers();
    const { container } = render(<Demo defaultValue="overview" />);
    act(() => tab('Usage').click());
    expect(container.querySelector('.bit-tabs__slot')).toHaveAttribute('data-boot', 'a');
    act(() => {
      vi.advanceTimersByTime(900);
    });
    expect(container.querySelector('.bit-tabs__slot')).not.toHaveAttribute('data-boot');
  });

  it('places the slot light under the chosen tab and follows resizes', () => {
    const observe = vi.fn();
    const disconnect = vi.fn();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = observe;
        disconnect = disconnect;
      },
    );
    const { container, unmount } = render(<Demo defaultValue="overview" />);
    expect((container.querySelector('.bit-tabs__slot') as HTMLElement).style.getPropertyValue('--_bit-tabs-x')).toBe('0px');
    expect(observe).toHaveBeenCalled();
    unmount();
    expect(disconnect).toHaveBeenCalled();
  });
});
```

Also cover the dev warning's production branch the way the existing tests cover `warnUnknown`'s (grep `NODE_ENV` in `*.test.ts*`). Adapt only mechanics, and keep every assertion.

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm --filter @bit-ds/react exec vitest run src/components/Tabs`
Expected: FAIL. The modules can't be resolved.

- [ ] **Step 3: Write `TabsContext.ts`**

```ts
import { createContext, useContext } from 'react';

/** What Tabs tells its parts. Private: not exported from the package. */
export interface TabsContextValue {
  baseId: string;
  /** The chosen value; undefined until a tab is chosen. */
  value: string | undefined;
  activation: 'automatic' | 'manual';
  /** The Tab stop when no tab is chosen (an unknown value): the first enabled tab. */
  stop: string | undefined;
  setStop: (value: string | undefined) => void;
  /** Choose a tab: calls onValueChange when it changes, and updates the own value when uncontrolled. */
  choose: (value: string) => void;
  /** Uncontrolled with nothing chosen yet: take this tab, without calling onValueChange. */
  adopt: (value: string) => void;
  /** '' when idle; 'a' or 'b' while the plug-in animation plays. They alternate so a new choice restarts it. */
  boot: '' | 'a' | 'b';
  endBoot: () => void;
}

export const TabsContext = createContext<TabsContextValue | null>(null);

/** The surrounding Tabs, or a clear error naming the part that is outside one. */
export function useTabs(partName: string): TabsContextValue {
  const tabs = useContext(TabsContext);
  if (!tabs) throw new Error(`bit: <${partName}> must be inside <Tabs>.`);
  return tabs;
}

/** An id-safe form of a tab value: whitespace becomes '_'. */
const idPart = (value: string) => value.replace(/\s+/g, '_');
export const tabId = (baseId: string, value: string) => `${baseId}-tab-${idPart(value)}`;
export const panelId = (baseId: string, value: string) => `${baseId}-panel-${idPart(value)}`;
```

- [ ] **Step 4: Write `Tabs.tsx`**

```tsx
import { forwardRef, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { toClasses } from '../../system/toClasses';
import { TabsContext } from './TabsContext';
import type { TabsContextValue } from './TabsContext';

export interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange' | 'color'> {
  /** The chosen tab's value, when the parent owns it. */
  value?: string;
  /** The first chosen tab, when Tabs owns it. Default: the first enabled tab. */
  defaultValue?: string;
  /** Called with the new value when a different tab is chosen. */
  onValueChange?: (value: string) => void;
  /** `automatic` (default): moving focus with the arrows chooses. `manual`: Enter or Space chooses. */
  activation?: 'automatic' | 'manual';
  /** One TabList, then the TabPanels. */
  children: ReactNode;
}

/** How long the plug-in animation may run before data-boot clears anyway (reduced motion fires no animationend). */
const BOOT_FALLBACK_MS = 900;

/** Tabs (the WAI-ARIA tabs pattern) with bit's plugged-in cartridges. Compose with TabList, Tab and TabPanel. */
export const Tabs = forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  { value, defaultValue, onValueChange, activation = 'automatic', className, children, ...rest },
  ref,
) {
  const baseId = useId();
  const [own, setOwn] = useState(defaultValue);
  const [stop, setStop] = useState<string | undefined>(undefined);
  const [boot, setBoot] = useState<'' | 'a' | 'b'>('');
  const current = value ?? own;

  // Every change after the first chosen value plays the plug-in animation, controlled or not.
  const previous = useRef(current);
  useEffect(() => {
    const before = previous.current;
    previous.current = current;
    if (before !== undefined && before !== current) setBoot((b) => (b === 'a' ? 'b' : 'a'));
  }, [current]);

  useEffect(() => {
    if (!boot) return undefined;
    const timer = setTimeout(() => setBoot(''), BOOT_FALLBACK_MS);
    return () => clearTimeout(timer);
  }, [boot]);

  const choose = useCallback(
    (next: string) => {
      if (next === current) return;
      if (value === undefined) setOwn(next);
      onValueChange?.(next);
    },
    [current, value, onValueChange],
  );
  const adopt = useCallback(
    (first: string) => {
      if (value === undefined) setOwn((chosen) => chosen ?? first);
    },
    [value],
  );
  const endBoot = useCallback(() => setBoot(''), []);

  const context = useMemo<TabsContextValue>(
    () => ({ baseId, value: current, activation, stop, setStop, choose, adopt, boot, endBoot }),
    [baseId, current, activation, stop, choose, adopt, boot, endBoot],
  );

  return (
    <TabsContext.Provider value={context}>
      <div ref={ref} className={toClasses('tabs', [], className)} {...rest}>
        {children}
      </div>
    </TabsContext.Provider>
  );
});
```

- [ ] **Step 5: Write `TabParts.tsx`**

```tsx
import { forwardRef, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import type { ButtonHTMLAttributes, HTMLAttributes, KeyboardEvent } from 'react';
import { element, withClassName } from '../../system/toClasses';
import { composeRefs } from '../../system/Slot';
import { panelId, tabId, useTabs } from './TabsContext';

export type TabListProps = Omit<HTMLAttributes<HTMLDivElement>, 'color'>;
export interface TabProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'value' | 'color'> {
  value: string;
  disabled?: boolean;
}
export interface TabPanelProps extends Omit<HTMLAttributes<HTMLDivElement>, 'color'> {
  value: string;
}

/** Which way a key moves along the tabs, or undefined. In right-to-left pages the arrows swap. */
function direction(key: string, rtl: boolean): 'next' | 'previous' | 'first' | 'last' | undefined {
  if (key === (rtl ? 'ArrowLeft' : 'ArrowRight')) return 'next';
  if (key === (rtl ? 'ArrowRight' : 'ArrowLeft')) return 'previous';
  if (key === 'Home') return 'first';
  if (key === 'End') return 'last';
  return undefined;
}

/** The row of tabs, and under it the slot the chosen cartridge plugs into. Needs aria-label or aria-labelledby. */
export const TabList = forwardRef<HTMLDivElement, TabListProps>(function TabList({ className, onKeyDown, children, ...rest }, ref) {
  const tabs = useTabs('TabList');
  const listRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLSpanElement>(null);
  const setRef = useMemo(() => composeRefs(ref, listRef), [ref]);
  const named = rest['aria-label'] !== undefined || rest['aria-labelledby'] !== undefined;

  useEffect(() => {
    if (named || process.env.NODE_ENV === 'production') return;
    console.warn('[bit] <TabList> needs aria-label or aria-labelledby, so screen readers can name the tabs.');
  }, [named]);

  const enabledTabs = () => [...listRef.current!.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)')];

  // Before paint: with nothing chosen yet, take the first enabled tab; with no chosen tab (an unknown value),
  // the first enabled tab is the Tab stop.
  useLayoutEffect(() => {
    const first = enabledTabs()[0]?.dataset.value;
    if (tabs.value === undefined && first !== undefined) tabs.adopt(first);
    const chosen = listRef.current!.querySelector('[role="tab"][aria-selected="true"]');
    tabs.setStop(chosen ? undefined : first);
  });

  // The slot lights up from under the chosen cartridge: keep its centre in --_bit-tabs-x.
  useLayoutEffect(() => {
    const list = listRef.current!;
    const slot = slotRef.current!;
    const place = () => {
      const chosen = list.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
      if (!chosen) return;
      const box = chosen.getBoundingClientRect();
      slot.style.setProperty('--_bit-tabs-x', `${box.left + box.width / 2 - slot.getBoundingClientRect().left}px`);
    };
    place();
    list.addEventListener('scroll', place);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(place);
    observer?.observe(list);
    return () => {
      list.removeEventListener('scroll', place);
      observer?.disconnect();
    };
  }, [tabs.value]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    const all = enabledTabs();
    const at = all.indexOf(event.target as HTMLButtonElement);
    const way = direction(event.key, listRef.current!.closest('[dir]')?.getAttribute('dir') === 'rtl');
    if (at === -1 || !way) return;
    const index = { next: (at + 1) % all.length, previous: (at - 1 + all.length) % all.length, first: 0, last: all.length - 1 }[way];
    const target = all[index]!;
    event.preventDefault();
    target.focus();
    if (tabs.activation === 'automatic') tabs.choose(target.dataset.value!);
  }

  return (
    <div className={element('tabs', 'bar')}>
      <div ref={setRef} role="tablist" className={withClassName(element('tabs', 'list'), className)} {...rest} onKeyDown={handleKeyDown}>
        {children}
      </div>
      <span ref={slotRef} className={element('tabs', 'slot')} aria-hidden="true" data-boot={tabs.boot || undefined} onAnimationEnd={tabs.endBoot} />
    </div>
  );
});

/** One cartridge. The chosen one is purple and seated in the slot. */
export const Tab = forwardRef<HTMLButtonElement, TabProps>(function Tab({ value, disabled, className, children, onClick, onKeyDown, ...rest }, ref) {
  const tabs = useTabs('Tab');
  const chosen = tabs.value === value;
  return (
    <button
      ref={ref}
      type="button"
      role="tab"
      id={tabId(tabs.baseId, value)}
      aria-selected={chosen}
      aria-controls={panelId(tabs.baseId, value)}
      tabIndex={chosen || tabs.stop === value ? 0 : -1}
      disabled={disabled}
      data-value={value}
      data-boot={chosen && tabs.boot ? tabs.boot : undefined}
      className={withClassName(element('tabs', 'tab'), className)}
      {...rest}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) tabs.choose(value);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || tabs.activation !== 'manual') return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          tabs.choose(value);
        }
      }}
    >
      <span className={element('tabs', 'label')}>{children}</span>
    </button>
  );
});

/** The content for one tab. Every panel stays mounted; the others are hidden, so their state is kept. */
export const TabPanel = forwardRef<HTMLDivElement, TabPanelProps>(function TabPanel({ value, className, ...rest }, ref) {
  const tabs = useTabs('TabPanel');
  return (
    <div
      ref={ref}
      role="tabpanel"
      id={panelId(tabs.baseId, value)}
      aria-labelledby={tabId(tabs.baseId, value)}
      tabIndex={0}
      hidden={tabs.value !== value}
      className={withClassName(element('tabs', 'panel'), className)}
      {...rest}
    />
  );
});
```

- [ ] **Step 6: Export it**

In `packages/react/src/index.ts`, after the Table exports:

```ts
export { Tabs } from './components/Tabs/Tabs';
export type { TabsProps } from './components/Tabs/Tabs';
export { TabList, Tab, TabPanel } from './components/Tabs/TabParts';
export type { TabListProps, TabProps, TabPanelProps } from './components/Tabs/TabParts';
```

- [ ] **Step 7: Run the tests, coverage, typecheck and lint**

Run: `pnpm --filter @bit-ds/react test:coverage && pnpm --filter @bit-ds/react typecheck && pnpm lint`
Expected: everything passes, with 100% coverage. Add a real test for any uncovered branch. One likely candidate is the `place()` early return when nothing is chosen: `<Demo value="nope" />` covers it.

- [ ] **Step 8: Commit**

```bash
git add packages/react/src/components/Tabs packages/react/src/index.ts
git commit -m "feat(react): Tabs (WAI-ARIA tabs): roving Tab stop, arrows, Home and End, manual activation, plug-in animation state

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Tabs CSS (core)

**Files:**
- Create: `packages/core/src/components/tabs.css`, `packages/core/src/__tests__/components/tabs.test.ts`
- Modify: `packages/core/src/index.css` (add `@import "./components/tabs.css";` after `table.css`)

**Interfaces:**
- **Consumes, from Task 3:**
  - the classes `bit-tabs`, `__bar`, `__list`, `__tab`, `__label`, `__slot` and `__panel`;
  - `aria-selected`, `disabled`, `hidden`, `data-boot="a"|"b"` and `--_bit-tabs-x`.

- [ ] **Step 1: Write the failing CSS tests**

Create `packages/core/src/__tests__/components/tabs.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { block, readCss, styleRules } from '../css';

describe('components/tabs.css', () => {
  const css = readCss('components/tabs.css');
  const inMedia = (media: string, selector: string) =>
    styleRules(css).find((rule) => rule.media === media && rule.selector.split(', ').includes(selector))?.body ?? null;

  it('a tab is a cartridge: line border without a bottom edge, top radius, the notch, neutral-soft and muted', () => {
    const tab = block(css, '.bit-tabs__tab')!;
    for (const line of [
      'border: var(--bit-border-width) solid var(--bit-color-line);',
      'border-bottom: 0;',
      'border-radius: var(--bit-radius-6px) var(--bit-radius-6px) 0 0;',
      'clip-path: polygon(0 0, 36% 0, 40% 6px, 60% 6px, 64% 0, 100% 0, 100% 100%, 0 100%);',
      'background: var(--bit-color-neutral-soft);',
      'color: var(--bit-color-text-muted);',
    ]) {
      expect(tab).toContain(line);
    }
  });

  it('the chosen tab is taller and purple: its fill layer is open and its text is primary-contrast', () => {
    const chosen = block(css, '.bit-tabs__tab[aria-selected="true"]')!;
    expect(chosen).toContain('padding-top: var(--bit-space-16px);');
    expect(chosen).toContain('color: var(--bit-color-primary-contrast);');
    expect(block(css, '.bit-tabs__tab::before')).toContain('background: var(--bit-color-primary);');
    expect(block(css, '.bit-tabs__tab[aria-selected="true"]::before')).toContain('clip-path: inset(0);');
  });

  it('hover only changes the text colour; nothing in tabs ever moves up', () => {
    expect(block(css, '.bit-tabs__tab:hover:not(:disabled)')).toContain('color: var(--bit-color-text);');
    expect(block(css, '.bit-tabs__tab:hover:not(:disabled)')).not.toContain('transform');
    expect(css).not.toMatch(/translateY\(\s*-/);
  });

  it('the focus ring is drawn inside, on the label, because the notch clips outlines', () => {
    expect(block(css, '.bit-tabs__tab:focus-visible')).toContain('outline: none;');
    expect(block(css, '.bit-tabs__tab:focus-visible > .bit-tabs__label')).toContain(
      'outline: var(--bit-focus-ring-width) solid var(--_bit-focus-ring, var(--bit-focus-ring-color));',
    );
  });

  it('the slot is a strip with a purple layer; the panel sits under it with no top border', () => {
    expect(block(css, '.bit-tabs__slot')).toContain('background: var(--bit-color-neutral-soft);');
    expect(block(css, '.bit-tabs__slot::before')).toContain('background: var(--bit-color-primary);');
    const panel = block(css, '.bit-tabs__panel')!;
    expect(panel).toContain('border-top: 0;');
    expect(panel).toContain('background: var(--bit-color-surface);');
  });

  it('the plug-in animation: seat, pour, spread, under alternating a and b names', () => {
    for (const name of ['a', 'b']) {
      expect(block(css, `.bit-tabs__tab[data-boot="${name}"]`)).toContain(`animation: bit-tabs-seat-${name} 120ms steps(2) both;`);
      expect(block(css, `.bit-tabs__tab[data-boot="${name}"]::before`)).toContain(`animation: bit-tabs-pour-${name} 180ms steps(4) 120ms both;`);
      expect(block(css, `.bit-tabs__slot[data-boot="${name}"]::before`)).toContain(`animation: bit-tabs-spread-${name} 240ms steps(6) 300ms both;`);
    }
    expect(css).toContain('var(--_bit-tabs-x, 50%)');
  });

  it('reduced motion: no animation', () => {
    expect(inMedia('(prefers-reduced-motion: reduce)', '.bit-tabs__tab[data-boot]')).toContain('animation: none;');
  });

  it('forced colours: CanvasText borders, Highlight fills, HighlightText on the chosen tab', () => {
    expect(inMedia('(forced-colors: active)', '.bit-tabs__tab')).toContain('border-color: CanvasText;');
    expect(inMedia('(forced-colors: active)', '.bit-tabs__tab::before')).toContain('background: Highlight;');
    expect(inMedia('(forced-colors: active)', '.bit-tabs__tab[aria-selected="true"]')).toContain('color: HighlightText;');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @bit-ds/core exec vitest run src/__tests__/components/tabs.test.ts`
Expected: FAIL. The file is missing.

- [ ] **Step 3: Write `tabs.css`**

```css
/* Tabs (W3 "Plugged in"): cartridge tabs that seat into a slot on top of the panel. States are attributes:
   aria-selected on the chosen tab, data-boot ("a" or "b", alternating so a new choice restarts it) while
   the plug-in animation plays. Nothing here ever moves up. */
.bit-tabs {
  display: block;
  color: var(--bit-color-text);
}

.bit-tabs__list {
  display: flex;
  align-items: flex-end;
  gap: var(--bit-space-8px);
  padding-inline-start: var(--bit-space-12px);
  overflow-x: auto;
}

.bit-tabs__tab {
  position: relative;
  flex: none;
  margin: 0;
  padding: var(--bit-space-12px) var(--bit-space-16px) var(--bit-space-8px);
  font-family: var(--bit-font-body);
  font-size: var(--bit-text-15px);
  font-weight: var(--bit-weight-bold);
  line-height: 1;
  color: var(--bit-color-text-muted);
  background: var(--bit-color-neutral-soft);
  border: var(--bit-border-width) solid var(--bit-color-line);
  border-bottom: 0;
  border-radius: var(--bit-radius-6px) var(--bit-radius-6px) 0 0;
  /* raw: the cartridge's notch, a 6px dip across the middle of the top edge */
  clip-path: polygon(0 0, 36% 0, 40% 6px, 60% 6px, 64% 0, 100% 0, 100% 100%, 0 100%);
  cursor: pointer;
}

/* The purple "power" layer; closed until the tab is chosen. */
.bit-tabs__tab::before {
  content: "";
  position: absolute;
  inset: 0;
  background: var(--bit-color-primary);
  clip-path: inset(0 0 100% 0);
}

.bit-tabs__label {
  position: relative;
  border-radius: var(--bit-radius-6px);
}

.bit-tabs__tab:hover:not(:disabled) {
  color: var(--bit-color-text);
}

.bit-tabs__tab[aria-selected="true"] {
  padding-top: var(--bit-space-16px);
  color: var(--bit-color-primary-contrast);
  --_bit-focus-ring: var(--bit-color-primary-contrast);
}

.bit-tabs__tab[aria-selected="true"]::before {
  clip-path: inset(0);
}

.bit-tabs__tab:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* The notch clips anything drawn outside the cartridge, so the focus ring goes on the label, inside. */
.bit-tabs__tab:focus-visible {
  outline: none;
}

.bit-tabs__tab:focus-visible > .bit-tabs__label {
  outline: var(--bit-focus-ring-width) solid var(--_bit-focus-ring, var(--bit-focus-ring-color));
  outline-offset: var(--bit-space-4px);
}

/* The slot: the panel's top strip, which lights up from under the chosen cartridge. */
.bit-tabs__slot {
  position: relative;
  display: block;
  height: 10px; /* raw: the slot strip, as on the board */
  overflow: hidden;
  background: var(--bit-color-neutral-soft);
  border: var(--bit-border-width) solid var(--bit-color-line);
  border-bottom: 0;
  border-radius: var(--bit-radius-10px) var(--bit-radius-10px) 0 0;
}

.bit-tabs__slot::before {
  content: "";
  position: absolute;
  inset: 0;
  background: var(--bit-color-primary);
}

.bit-tabs__panel {
  padding: var(--bit-space-16px);
  background: var(--bit-color-surface);
  border: var(--bit-border-width) solid var(--bit-color-line);
  border-top: 0;
  border-radius: 0 0 var(--bit-radius-10px) var(--bit-radius-10px);
  box-shadow: var(--bit-shadow-md);
}

.bit-tabs__panel[hidden] {
  display: none;
}

/* C6 plug-in: seat (0–120ms), pour (120–300ms), spread (300–540ms), in hard steps.
   raw: these durations have no tokens; the 3px seat is the press depth. */
.bit-tabs__tab[data-boot="a"] { animation: bit-tabs-seat-a 120ms steps(2) both; }
.bit-tabs__tab[data-boot="b"] { animation: bit-tabs-seat-b 120ms steps(2) both; }
.bit-tabs__tab[data-boot="a"]::before { animation: bit-tabs-pour-a 180ms steps(4) 120ms both; }
.bit-tabs__tab[data-boot="b"]::before { animation: bit-tabs-pour-b 180ms steps(4) 120ms both; }
.bit-tabs__slot[data-boot="a"]::before { animation: bit-tabs-spread-a 240ms steps(6) 300ms both; }
.bit-tabs__slot[data-boot="b"]::before { animation: bit-tabs-spread-b 240ms steps(6) 300ms both; }

@keyframes bit-tabs-seat-a { 0% { transform: none; } 50% { transform: translateY(3px); } 100% { transform: none; } }
@keyframes bit-tabs-seat-b { 0% { transform: none; } 50% { transform: translateY(3px); } 100% { transform: none; } }
@keyframes bit-tabs-pour-a { from { clip-path: inset(0 0 100% 0); } to { clip-path: inset(0); } }
@keyframes bit-tabs-pour-b { from { clip-path: inset(0 0 100% 0); } to { clip-path: inset(0); } }
@keyframes bit-tabs-spread-a { from { clip-path: inset(0 calc(100% - var(--_bit-tabs-x, 50%)) 0 var(--_bit-tabs-x, 50%)); } to { clip-path: inset(0); } }
@keyframes bit-tabs-spread-b { from { clip-path: inset(0 calc(100% - var(--_bit-tabs-x, 50%)) 0 var(--_bit-tabs-x, 50%)); } to { clip-path: inset(0); } }

@media (prefers-reduced-motion: reduce) {
  .bit-tabs__tab[data-boot],
  .bit-tabs__tab[data-boot]::before,
  .bit-tabs__slot[data-boot]::before {
    animation: none;
  }
}

@media (forced-colors: active) {
  .bit-tabs__tab,
  .bit-tabs__slot,
  .bit-tabs__panel {
    border-color: CanvasText;
  }

  .bit-tabs__tab::before,
  .bit-tabs__slot::before {
    forced-color-adjust: none;
    background: Highlight;
  }

  .bit-tabs__tab[aria-selected="true"] {
    forced-color-adjust: none;
    color: HighlightText;
    --_bit-focus-ring: HighlightText;
  }
}
```

Also give `.bit-tabs__list` the themed horizontal scrollbar Table uses, inside `@media not (forced-colors: active)`:
- read the `.bit-table` scroll rules in `table.css`;
- mirror them with a `transparent` track, since the list sits on the page;
- if `packages/core/src/__tests__/scrollbar.test.ts` enumerates scroll containers, add `.bit-tabs__list` to it.

Then add `@import "./components/tabs.css";` to `index.css` after `table.css`.

- [ ] **Step 4: Run the core suite and build**

Run: `pnpm --filter @bit-ds/core test && pnpm build && pnpm verify`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/components/tabs.css packages/core/src/__tests__/components/tabs.test.ts packages/core/src/index.css
git commit -m "feat(core): Tabs as plugged-in cartridges: notch, slot, inside focus ring, seat-pour-spread animation

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

(Also stage `packages/core/src/__tests__/scrollbar.test.ts` if it changed.)

---

### Task 5: Gallery engine: `demo` wrapper; virtual text and boolean controls

**Files:**
- Modify: `apps/gallery/src/manifests/types.ts`, `manifests/virtual.ts`, `engine/renderManifest.tsx`, `code/toJsx.ts`, `code/fullFile.ts`, `content/snippets.mjs`, `content/snippets.d.mts`
- Test: `apps/gallery/src/engine/demo.test.tsx` (new)

**Interfaces:**
- **Produces (for Task 6):**
  ```ts
  // types.ts
  interface BooleanControl { …; virtual?: boolean }
  interface TextControl { …; virtual?: boolean }
  interface ManifestDemo {
    render: (element: ReactElement) => ReactElement;
    code: { reactImports: readonly string[]; bitImports: readonly string[]; setup: readonly string[]; props: readonly string[]; wrap: (elementJsx: string) => string };
  }
  interface Manifest { …; demo?: ManifestDemo }
  // virtual.ts
  isVirtual(control) // true for any control with virtual: true
  // snippets.mjs
  fullFile({ importLine, element, setup? })
  ```

- [ ] **Step 1: Write the failing tests**

Create `apps/gallery/src/engine/demo.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { renderManifest } from './renderManifest';
import { buildProps } from './buildProps';
import { defaultState } from './state';
import { toJsx } from '../code/toJsx';
import { fullFile } from '../code/fullFile';
import { testManifest } from '../test/manifest';

const Box = ({ children }: { children?: ReactNode }) => <div data-testid="box">{children}</div>;

const withDemo = testManifest({
  name: 'Panel',
  component: Box,
  controls: [
    { kind: 'text', prop: 'title', default: 'Hello', virtual: true },
    { kind: 'boolean', prop: 'loud', default: false, virtual: true },
  ],
  deriveChildren: (state) => [{ component: 'span', children: String(state.title) }],
  demo: {
    render: (element) => <section data-testid="demo">{element}</section>,
    code: {
      reactImports: ['useState'],
      bitImports: ['Button'],
      setup: ['const [open, setOpen] = useState(false);'],
      props: ['open={open}'],
      wrap: (jsx) => `<>\n  <Button>Go</Button>\n${jsx.split('\n').map((line) => `  ${line}`).join('\n')}\n</>`,
    },
  },
});

describe('engine: demo wrapper', () => {
  it('renderManifest wraps the element with demo.render', () => {
    render(renderManifest(withDemo, defaultState(withDemo)));
    expect(screen.getByTestId('demo')).toContainElement(screen.getByTestId('box'));
    expect(screen.getByTestId('box')).toHaveTextContent('Hello');
  });

  it('virtual text and boolean controls are neither passed nor printed', () => {
    const state = { ...defaultState(withDemo), title: 'Hi', loud: true };
    expect(buildProps(withDemo, state)).toEqual({});
    expect(toJsx(withDemo, state)).not.toMatch(/title=|loud/);
  });

  it('toJsx prints the react import, the bit imports, the setup lines, the demo props first and the wrap', () => {
    expect(toJsx(withDemo, defaultState(withDemo))).toBe(
      [
        "import { useState } from 'react';\nimport { Button, Panel } from '@bit-ds/react';",
        'const [open, setOpen] = useState(false);',
        '<>\n  <Button>Go</Button>\n  <Panel open={open}>\n    <span>Hello</span>\n  </Panel>\n</>',
      ].join('\n\n'),
    );
  });

  it('the full file puts hook setup lines inside the component, before return', () => {
    expect(fullFile(toJsx(withDemo, defaultState(withDemo)))).toBe(
      [
        "import { useState } from 'react';",
        "import { Button, Panel } from '@bit-ds/react';",
        '',
        'export function Example() {',
        '  const [open, setOpen] = useState(false);',
        '',
        '  return (',
        '    <>',
        '      <Button>Go</Button>',
        '      <Panel open={open}>',
        '        <span>Hello</span>',
        '      </Panel>',
        '    </>',
        '  );',
        '}',
        '',
      ].join('\n'),
    );
  });

  it('a module-level const (a hoisted options array) still goes above the component', () => {
    const file = fullFile("import { X } from '@bit-ds/react';\n\nconst options = [\n  'a',\n];\n\n<X options={options} />");
    expect(file.indexOf('const options')).toBeLessThan(file.indexOf('export function Example()'));
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm build && pnpm --filter @bit-ds/gallery exec vitest run src/engine/demo.test.tsx`
Expected: FAIL. There's a type error on `virtual` and `demo`, and the output isn't wrapped.

- [ ] **Step 3: Types and `isVirtual`**

In `apps/gallery/src/manifests/types.ts`:
- Add `virtual?: boolean;` to `BooleanControl` and `TextControl`, with the same doc comment `SelectControl.virtual` has.
- Add, above `Manifest`:
  ```ts
  /**
   * A stateful wrapper for a component that can't show itself alone (a Dialog needs a trigger and open state).
   * The preview renders `render(element)`; the printed code adds the imports and setup lines and wraps the element.
   */
  export interface ManifestDemo {
    render: (element: ReactElement) => ReactElement;
    code: {
      /** Named imports from 'react' (`useState`), printed on their own line above the bit import. */
      reactImports: readonly string[];
      /** Extra bit components the wrapper uses (`Button`), merged into the bit import. */
      bitImports: readonly string[];
      /** Lines at the top of the component body (`const [open, setOpen] = useState(false);`). */
      setup: readonly string[];
      /** Attributes printed first on the element (`open={open}`). */
      props: readonly string[];
      /** The JSX around the element. */
      wrap: (elementJsx: string) => string;
    };
  }
  ```
- Add `demo?: ManifestDemo;` to `Manifest`, and `ReactElement` to the `react` type import.

In `manifests/virtual.ts`, the function becomes:

```ts
/** A control that shapes the page only (a count, a title in a child part): never passed, printed or documented as a prop. */
export function isVirtual(control: Control): boolean {
  return 'virtual' in control && control.virtual === true;
}
```

- [ ] **Step 4: `renderManifest` applies the demo**

In `engine/renderManifest.tsx`:

```ts
export function renderManifest(manifest: Manifest, state: ControlState): ReactElement {
  const element = createElement(manifest.component, buildProps(manifest, state), renderChildren(manifest, state));
  return manifest.demo ? manifest.demo.render(element) : element;
}
```

- [ ] **Step 5: `toJsx` prints the demo**

In `code/toJsx.ts`:
1. `importLine` becomes:
   ```ts
   function importLine(manifest: Manifest, specs: readonly ChildSpec[] | undefined): string {
     const nested = specs ? componentNames(specs) : [];
     const demo = manifest.demo?.code;
     const unique = [...new Set([manifest.name, ...(manifest.parts ?? []), ...nested, ...(demo?.bitImports ?? [])])].sort();
     const bit = `import { ${unique.join(', ')} } from '@bit-ds/react';`;
     if (!demo || demo.reactImports.length === 0) return bit;
     return `import { ${[...demo.reactImports].sort().join(', ')} } from 'react';\n${bit}`;
   }
   ```
2. In `toJsx`:
   - The `props` string gets the demo's attributes first:
     ```ts
     const demo = manifest.demo?.code;
     const props = [...(demo?.props ?? []), ...printed.map((p) => attr(p, names))].map((p) => ` ${p}`).join('');
     ```
   - After `element` is built, add `if (demo) element = demo.wrap(element);`.
   - The return becomes:
     ```ts
     const setup = demo && demo.setup.length > 0 ? [demo.setup.join('\n')] : [];
     return [importLine(manifest, specs), ...consts, ...setup, element].join('\n\n');
     ```

- [ ] **Step 6: `fullFile` puts hook setup inside the component**

In `content/snippets.mjs`, `fullFile` becomes:

```js
export function fullFile({ importLine, element, setup = '' }) {
  const body = element
    .split('\n')
    .map((line) => BODY_INDENT + line)
    .join('\n');
  const setupLines = setup
    ? `${setup
        .split('\n')
        .map((line) => `  ${line}`)
        .join('\n')}\n\n`
    : '';
  return `${importLine}\n\nexport function Example() {\n${setupLines}  return (\n${body}\n  );\n}\n`;
}
```

Also update its JSDoc and its type in `content/snippets.d.mts` (`setup?: string`).

In `code/fullFile.ts`:

```ts
import { fullFile as fullFileParts } from '../content/snippets.mjs';

/** A block that calls a hook (`const [open, setOpen] = useState(false);`): it belongs inside the component, not at module level. */
const HOOK_CALL = /=\s*use[A-Z]\w*\(/;

/**
 * Wrap a toJsx snippet in a file you can paste and run. Gallery-private. The snippet's blocks are separated by
 * blank lines: the import line, any `const` declarations, any hook setup lines, then the element. Plain consts
 * stay at module level, between the import and `export function Example()`; hook setup goes inside it.
 */
export function fullFile(jsx: string): string {
  const [importLine = '', ...rest] = jsx.split('\n\n');
  const isModuleConst = (block: string) => block.startsWith('const ') && !HOOK_CALL.test(block);
  const firstOther = rest.findIndex((block) => !isModuleConst(block));
  const splitAt = firstOther === -1 ? rest.length : firstOther;
  const after = rest.slice(splitAt);
  return fullFileParts({
    importLine: [importLine, ...rest.slice(0, splitAt)].join('\n\n'),
    setup: after.filter((block) => HOOK_CALL.test(block)).join('\n'),
    element: after.filter((block) => !HOOK_CALL.test(block)).join('\n\n'),
  });
}
```

- [ ] **Step 7: Run the gallery suite, scripts tests and typecheck**

Run: `pnpm --filter @bit-ds/gallery test && pnpm --filter @bit-ds/gallery typecheck && node --test 'scripts/*.test.mjs' && pnpm lint`
Expected: PASS. Existing pages print exactly as before: no manifest has a `demo` yet, and `fullFile` without setup is byte-identical.

- [ ] **Step 8: Commit**

```bash
git add apps/gallery/src/manifests/types.ts apps/gallery/src/manifests/virtual.ts apps/gallery/src/engine/renderManifest.tsx apps/gallery/src/code/toJsx.ts apps/gallery/src/code/fullFile.ts apps/gallery/src/content/snippets.mjs apps/gallery/src/content/snippets.d.mts apps/gallery/src/engine/demo.test.tsx
git commit -m "feat(gallery): a demo wrapper for stateful previews and their printed useState code; virtual text and boolean controls

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Gallery pages: Dialog and Tabs

**Files:**
- Create: `apps/gallery/src/demos/DialogDemo.tsx`, `apps/gallery/src/manifests/dialog.ts`, `apps/gallery/src/manifests/tabs.ts`, `apps/gallery/src/manifests/dialog.test.tsx`, `apps/gallery/src/manifests/tabs.test.ts`
- Modify: `apps/gallery/src/manifests/registry.ts`, `apps/gallery/src/manifests/index.ts`, `apps/gallery/src/manifests/manifests.test.ts`, the gallery's vitest setup file

**Interfaces:**
- **Consumes:**
  - Task 5's `demo` and virtual text and boolean controls;
  - the existing `deriveChildren`, `isInteractive` and `childSpecs`;
  - from the dist (after `pnpm build`): `Dialog` and its parts, `DialogClose`, `Tabs` and its parts.
- **Produces, for Task 7:**
  - the routes `#/components/dialog` and `#/components/tabs`;
  - the preview's "Open dialog" Button;
  - the Dialog preset "Alert";
  - the Tabs controls `tabCount` (label "tabs"), `activation` and `disabledTab`.

- [ ] **Step 1: Write the failing manifest tests**

Create `apps/gallery/src/manifests/dialog.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { dialog } from './dialog';
import { defaultState } from '../engine/state';
import { renderManifest } from '../engine/renderManifest';
import { toJsx } from '../code/toJsx';
import { fullFile } from '../code/fullFile';
import { CODE_FORMATS } from '../code/codeFormats';

describe('Dialog page', () => {
  it('previews an "Open dialog" Button; the dialog starts closed', () => {
    render(renderManifest(dialog, defaultState(dialog)));
    expect(screen.getByRole('button', { name: 'Open dialog' })).toBeInTheDocument();
    expect(document.querySelector('dialog')!.hasAttribute('open')).toBe(false);
  });

  it('prints useState, the trigger Button and the Dialog with its parts', () => {
    expect(toJsx(dialog, defaultState(dialog))).toBe(
      [
        "import { useState } from 'react';\nimport { Button, Dialog, DialogBody, DialogClose, DialogFooter, DialogHeader } from '@bit-ds/react';",
        'const [open, setOpen] = useState(false);',
        [
          '<>',
          '  <Button onClick={() => setOpen(true)}>Open dialog</Button>',
          '  <Dialog open={open} onOpenChange={setOpen}>',
          '    <DialogHeader>Save changes?</DialogHeader>',
          '    <DialogBody>Your edits will be saved to the project.</DialogBody>',
          '    <DialogFooter>',
          '      <DialogClose data-autofocus={true}>Cancel</DialogClose>',
          '      <Button>Save</Button>',
          '    </DialogFooter>',
          '  </Dialog>',
          '</>',
        ].join('\n'),
      ].join('\n\n'),
    );
  });

  it('the Alert preset prints alert and a danger Delete', () => {
    const alert = { ...defaultState(dialog), ...dialog.presets!.find((p) => p.label === 'Alert')!.state };
    const code = toJsx(dialog, alert);
    expect(code).toContain('<Dialog open={open} onOpenChange={setOpen} alert>');
    expect(code).toContain('<DialogHeader>Delete report?</DialogHeader>');
    expect(code).toContain('<Button color="danger">Delete</Button>');
  });

  it('the full file declares the state inside Example', () => {
    expect(fullFile(toJsx(dialog, defaultState(dialog)))).toContain('export function Example() {\n  const [open, setOpen] = useState(false);');
  });

  it('is interactive: no HTML tab', () => {
    expect(CODE_FORMATS.filter((f) => f.available(dialog, defaultState(dialog))).map((f) => f.id)).not.toContain('html');
  });

  it('clicking Open dialog opens the real Dialog', async () => {
    const user = userEvent.setup();
    render(renderManifest(dialog, defaultState(dialog)));
    await user.click(screen.getByRole('button', { name: 'Open dialog' }));
    expect(document.querySelector('dialog')!.hasAttribute('open')).toBe(true);
  });
});
```

The last test needs a `showModal` stand-in in the gallery's jsdom. Copy the one from `packages/react/vitest.setup.ts` (Task 1, Step 1) into the gallery's vitest setup file (find it via `apps/gallery/vitest.config.*` or `vite.config.ts`'s `test.setupFiles`), with the same comment.

Create `apps/gallery/src/manifests/tabs.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { tabs, tabCount } from './tabs';
import { defaultState } from '../engine/state';
import { childSpecs } from '../engine/childSpecs';
import { toJsx } from '../code/toJsx';

describe('Tabs page', () => {
  it('builds 2 to 5 tabs from the tabs control, clamped, with 3 by default', () => {
    const count = (raw: string) => {
      const [list] = childSpecs(tabs, { tabCount: raw })!;
      return (list!.children as readonly unknown[]).length;
    };
    expect(count('3')).toBe(3);
    expect(count('2')).toBe(2);
    expect(count('5')).toBe(5);
    expect(count('1')).toBe(2);
    expect(count('9')).toBe(5);
    expect(count('')).toBe(3);
    expect(tabCount(undefined)).toBe(3);
  });

  it('prints Tabs with defaultValue, a named TabList, the Tabs and the panels', () => {
    expect(toJsx(tabs, defaultState(tabs))).toBe(
      [
        "import { Tab, TabList, TabPanel, Tabs } from '@bit-ds/react';",
        [
          '<Tabs defaultValue="overview">',
          '  <TabList aria-label="Component docs">',
          '    <Tab value="overview">Overview</Tab>',
          '    <Tab value="usage">Usage</Tab>',
          '    <Tab value="props">Props</Tab>',
          '  </TabList>',
          '  <TabPanel value="overview">What the component is for, in a sentence or two.</TabPanel>',
          '  <TabPanel value="usage">When to reach for it, and when not to.</TabPanel>',
          '  <TabPanel value="props">Every prop, its type and its default.</TabPanel>',
          '</Tabs>',
        ].join('\n'),
      ].join('\n\n'),
    );
  });

  it('manual activation prints; the disabled-tab switch disables the last tab', () => {
    const code = toJsx(tabs, { ...defaultState(tabs), activation: 'manual', disabledTab: true });
    expect(code).toContain('<Tabs activation="manual" defaultValue="overview">');
    expect(code).toContain('<Tab value="props" disabled={true}>Props</Tab>');
  });
});
```

If `printFixed` prints booleans in a different valid JSX form, keep the repo's form and adjust only that expected string.

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm build && pnpm --filter @bit-ds/gallery exec vitest run src/manifests/dialog.test.tsx src/manifests/tabs.test.ts`
Expected: FAIL. The modules are missing.

- [ ] **Step 3: `DialogDemo.tsx`**

```tsx
import { cloneElement, useState } from 'react';
import type { ReactElement } from 'react';
import { Button } from '@bit-ds/react';
import type { DialogProps } from '@bit-ds/react';

/** The Dialog page's preview: a Button that opens the Dialog the controls built, which keeps its own open state. */
export function DialogDemo({ dialog }: { dialog: ReactElement<DialogProps> }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open dialog</Button>
      {cloneElement(dialog, { open, onOpenChange: setOpen })}
    </>
  );
}
```

- [ ] **Step 4: `manifests/dialog.ts`**

```ts
import { createElement } from 'react';
import type { ReactElement } from 'react';
import { Dialog, SIZES } from '@bit-ds/react';
import type { DialogProps } from '@bit-ds/react';
import type { ChildSpec, ControlState, Manifest } from './types';
import { DialogDemo } from '../demos/DialogDemo';

/** The two dialogs the page shows: a calm save, and an alert that deletes. */
function parts(state: ControlState): readonly ChildSpec[] {
  const alert = state.alert === true;
  return [
    { component: 'DialogHeader', children: String(state.title) },
    {
      component: 'DialogBody',
      children: alert ? 'This deletes "Q3 report" for everyone on the team. You can\'t undo it.' : 'Your edits will be saved to the project.',
    },
    {
      component: 'DialogFooter',
      children: [
        { component: 'DialogClose', props: { 'data-autofocus': true }, children: 'Cancel' },
        alert ? { component: 'Button', props: { color: 'danger' }, children: 'Delete' } : { component: 'Button', children: 'Save' },
      ],
    },
  ];
}

/** Indent every line of a JSX block by two spaces, to sit inside the demo's fragment. */
const indent = (jsx: string) =>
  jsx
    .split('\n')
    .map((line) => `  ${line}`)
    .join('\n');

export const dialog: Manifest = {
  name: 'Dialog',
  slug: 'dialog',
  group: 'components',
  component: Dialog,
  description: 'A modal window in the Retro window style. It opens over a dimmed page, keeps focus inside, and folds away when closed.',
  controls: [
    { kind: 'text', prop: 'title', label: 'title', default: 'Save changes?', virtual: true },
    { kind: 'boolean', prop: 'alert', default: false },
    { kind: 'axis', prop: 'size', values: SIZES, default: 'md' },
  ],
  deriveChildren: parts,
  parts: ['DialogHeader', 'DialogBody', 'DialogFooter', 'DialogClose'],
  presets: [{ label: 'Alert', state: { alert: true, title: 'Delete report?' } }],
  demo: {
    render: (element) => createElement(DialogDemo, { dialog: element as ReactElement<DialogProps> }),
    code: {
      reactImports: ['useState'],
      bitImports: ['Button'],
      setup: ['const [open, setOpen] = useState(false);'],
      props: ['open={open}', 'onOpenChange={setOpen}'],
      wrap: (jsx) => `<>\n  <Button onClick={() => setOpen(true)}>Open dialog</Button>\n${indent(jsx)}\n</>`,
    },
  },
  interactive: true,
  docs: {
    badges: ['Native <dialog>', 'Focus kept inside', 'Pixel fold'],
    usage: {
      do: [
        'Use a Dialog for a short task or a decision that needs an answer before going on.',
        'Put data-autofocus on the safest action (usually Cancel), so focus starts there.',
        'Use alert for a confirmation that destroys something; a click on the dimmed page then does not close it.',
      ],
      dont: ['Use a Dialog for information that could sit on the page. Use an Alert.', 'Open a Dialog from another Dialog.'],
    },
    props: [
      { name: 'open', type: 'boolean', description: 'Required. Whether the dialog is open. Dialog is controlled: keep this in state.' },
      {
        name: 'onOpenChange',
        type: '(open: boolean) => void',
        description: 'Required. Called with false on Esc, the ×, a DialogClose, or a click on the dimmed page (not for alert).',
      },
      { name: 'alert', type: 'boolean', default: 'false', description: 'An alertdialog for confirmations: a click on the dimmed page does not close it.' },
      { name: 'size', className: 'bit-{size}', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Width: 320, 420 or 560px, never wider than the screen.' },
      { name: 'closeLabel', type: 'string', default: "'Close'", description: "DialogHeader's × button name. DialogHeader's children are the title, which names the dialog." },
      { name: 'DialogClose', type: 'ButtonProps', description: 'A Button (outline neutral by default) that closes the dialog. The × is one too.' },
      { name: 'ref', type: 'Ref<HTMLDialogElement>', description: 'Goes to the native <dialog>.' },
    ],
    a11y: [
      "Built on the native <dialog> with showModal(): the browser shows it above everything and makes the page behind inert, so it can't be clicked, focused or read by a screen reader until the dialog closes.",
      'On open, focus moves to the element with data-autofocus, or else the first focusable element (the ×). Tab and Shift+Tab stay inside the dialog.',
      'Esc closes it, as do the × and any DialogClose. When it closes, focus goes back to whatever opened it.',
      'The title (DialogHeader) names it and DialogBody describes it, so a screen reader reads both when it opens. With alert it is an alertdialog.',
      'The page behind does not scroll while it is open.',
      'The fold-out and fold-in are visual only; with reduced motion turned on, the dialog simply appears and disappears.',
      'In forced-colors mode (Windows high contrast), the title bar and border use the system colors.',
    ],
  },
};
```

If a manifest contract test rejects a docs row whose name isn't a real component prop (`closeLabel`, `DialogClose`), follow the test: keep the information, but move it into the a11y or usage lines, and note it.

- [ ] **Step 5: `manifests/tabs.ts`**

```ts
import { Tabs } from '@bit-ds/react';
import type { ChildSpec, ControlState, ControlValue, Manifest } from './types';

/** The playground's tabs: the first N of these, with one line of panel text each. */
const TABS = [
  { value: 'overview', label: 'Overview', panel: 'What the component is for, in a sentence or two.' },
  { value: 'usage', label: 'Usage', panel: 'When to reach for it, and when not to.' },
  { value: 'props', label: 'Props', panel: 'Every prop, its type and its default.' },
  { value: 'accessibility', label: 'Accessibility', panel: 'What it does for keyboard and screen-reader users.' },
  { value: 'examples', label: 'Examples', panel: 'Copyable code for common cases.' },
] as const;
const TAB_COUNT = { min: 2, max: TABS.length, default: 3 } as const;

/** How many tabs to show: floored and clamped to 2–5, or 3 when the field isn't a number. */
export function tabCount(raw: ControlValue | undefined): number {
  const n = Math.floor(Number(raw));
  if (raw === undefined || String(raw).trim() === '' || !Number.isFinite(n)) return TAB_COUNT.default;
  return Math.min(TAB_COUNT.max, Math.max(TAB_COUNT.min, n));
}

function parts(state: ControlState): readonly ChildSpec[] {
  const shown = TABS.slice(0, tabCount(state.tabCount));
  const last = shown.length - 1;
  return [
    {
      component: 'TabList',
      props: { 'aria-label': 'Component docs' },
      children: shown.map((tab, index) => ({
        component: 'Tab',
        props: state.disabledTab === true && index === last ? { value: tab.value, disabled: true } : { value: tab.value },
        children: tab.label,
      })),
    },
    ...shown.map((tab) => ({ component: 'TabPanel', props: { value: tab.value }, children: tab.panel })),
  ];
}

export const tabs: Manifest = {
  name: 'Tabs',
  slug: 'tabs',
  group: 'components',
  component: Tabs,
  description: 'Tabs that plug in like game cartridges: choose one and it seats into the slot, powers up, and shows its panel.',
  controls: [
    { kind: 'number', prop: 'tabCount', label: 'tabs', default: TAB_COUNT.default, min: TAB_COUNT.min, max: TAB_COUNT.max, step: 1, virtual: true },
    { kind: 'select', prop: 'activation', values: ['automatic', 'manual'], default: 'automatic' },
    { kind: 'boolean', prop: 'disabledTab', label: 'disabled tab', default: false, virtual: true },
  ],
  fixedProps: { defaultValue: 'overview' },
  deriveChildren: parts,
  parts: ['TabList', 'Tab', 'TabPanel'],
  presets: [
    { label: 'Five tabs', state: { tabCount: '5' } },
    { label: 'Manual', state: { activation: 'manual' } },
  ],
  interactive: true,
  docs: {
    badges: ['WAI-ARIA tabs', 'Arrow keys', 'Plug-in animation'],
    usage: {
      do: [
        "Use Tabs to switch between views of the same thing, like a component's overview, usage and props.",
        'Keep tab names short: one or two words.',
        'Give TabList an aria-label (or aria-labelledby) that says what the tabs are about.',
      ],
      dont: ['Use Tabs to step through a sequence (a checkout). Use separate pages.', 'Use Tabs to pick a value for a form. Use SegmentedControl.'],
    },
    props: [
      { name: 'defaultValue', type: 'string', description: 'The first chosen tab, when Tabs owns it. Unset, the first enabled tab.' },
      { name: 'value', type: 'string', description: 'The chosen tab, when the parent owns it. Use with onValueChange.' },
      { name: 'onValueChange', type: '(value: string) => void', description: 'Called with the new value when a different tab is chosen.' },
      {
        name: 'activation',
        type: "'automatic' | 'manual'",
        default: "'automatic'",
        description: 'automatic: moving focus with the arrows chooses the tab. manual: Enter or Space chooses it, for panels that are slow to show.',
      },
    ],
    a11y: [
      'The WAI-ARIA tabs pattern: a tablist of tabs, each controlling a tabpanel that it labels. Every TabPanel names its Tab by value, and the others stay mounted but hidden.',
      'Only the chosen tab is in the Tab order. The left and right arrows move between tabs (wrapping), Home and End jump to the first and last; in a right-to-left page the arrows swap.',
      'With automatic activation, moving to a tab shows its panel; with manual, Enter or Space does. Disabled tabs are skipped and cannot be chosen.',
      'Tab moves from the tabs into the panel, which is focusable so its content can be scrolled from the keyboard.',
      'The focus ring is drawn inside the tab, because the cartridge shape would cut it off outside.',
      'The plug-in animation is visual only: the panel changes at once, and with reduced motion turned on nothing animates.',
      'In forced-colors mode, the chosen tab and the slot fill with the system highlight color.',
    ],
  },
};
```

- [ ] **Step 6: Register them**

- **`manifests/registry.ts`:** import and add to `COMPONENTS` `Dialog`, `DialogHeader`, `DialogBody`, `DialogFooter`, `DialogClose`, `Tabs`, `TabList`, `Tab` and `TabPanel`, following the file's existing order.
- **`manifests/index.ts`:** import `dialog` and `tabs`, and insert them into `MANIFESTS` after `table`. The list becomes `… segmentedControl, table, dialog, tabs, field, …`.
- **`manifests/manifests.test.ts`:** the interactive test's expected list becomes `['ModeToggle', 'CodeBlock', 'Dialog', 'Tabs', 'Select']`, in MANIFESTS order. Run the suite and fix only the expectations that list every manifest by name.

- [ ] **Step 7: Run the gallery suite and typecheck**

Run: `pnpm build && pnpm --filter @bit-ds/gallery test && pnpm --filter @bit-ds/gallery typecheck && pnpm lint`
Expected: PASS. Every manifest contract test holds:
- the parts are documented exports;
- the presets round-trip;
- the defaults match the docs.

- [ ] **Step 8: Commit**

```bash
git add apps/gallery/src/demos apps/gallery/src/manifests <gallery vitest setup file>
git commit -m "feat(gallery): Dialog and Tabs pages, with an Open dialog demo and printed useState code

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: e2e and the visual check

**Files:**
- Create: `apps/gallery/e2e/dialog.spec.ts`, `apps/gallery/e2e/tabs.spec.ts`

**Interfaces:**
- **Consumes:**
  - Task 6's routes, the "Open dialog" Button, the Alert preset and the Tabs controls;
  - Task 1's `data-state` and `data-autofocus`;
  - Task 3's `data-boot`.

- [ ] **Step 1: Write `dialog.spec.ts`**

```ts
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { MODES, seedColorMode } from './mode';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
test.use({ viewport: { width: 1280, height: 900 } });

test.describe('Dialog page', () => {
  test('opens a real modal: focus inside on Cancel, Tab stays inside; Esc folds it away and focus returns', async ({ page }) => {
    await page.goto('#/components/dialog');
    const trigger = page.getByRole('region', { name: 'Dialog preview' }).getByRole('button', { name: 'Open dialog' });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Save changes?' });
    await expect(dialog).toBeVisible();
    expect(await dialog.evaluate((el) => el.matches(':modal'))).toBe(true);
    await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
    for (let i = 0; i < 4; i += 1) {
      await page.keyboard.press('Tab');
      expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveAttribute('data-state', 'closing');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('while open, the page behind is inert', async ({ page }) => {
    await page.goto('#/components/dialog');
    await page.getByRole('region', { name: 'Dialog preview' }).getByRole('button', { name: 'Open dialog' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    // Inert content leaves the accessibility tree: the sidebar's navigation can't be found while the modal is open.
    await expect(page.getByRole('navigation')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('navigation').first()).toBeVisible();
  });

  test('a click on the dimmed page closes it; with Alert it does not', async ({ page }) => {
    await page.goto('#/components/dialog');
    const trigger = page.getByRole('region', { name: 'Dialog preview' }).getByRole('button', { name: 'Open dialog' });
    await trigger.click();
    await expect(page.getByRole('dialog')).toHaveAttribute('data-state', 'open');
    await page.mouse.click(10, 10);
    await expect(page.getByRole('dialog')).toBeHidden();
    await page.getByRole('group', { name: 'Presets' }).getByRole('button', { name: 'Alert' }).click();
    await trigger.click();
    const alert = page.getByRole('alertdialog', { name: 'Delete report?' });
    await expect(alert).toHaveAttribute('data-state', 'open');
    await page.mouse.click(10, 10);
    await expect(alert).toBeVisible();
    await alert.getByRole('button', { name: 'Close' }).click();
    await expect(alert).toBeHidden();
  });

  test('the page does not scroll while the dialog is open', async ({ page }) => {
    await page.goto('#/components/dialog');
    await page.getByRole('region', { name: 'Dialog preview' }).getByRole('button', { name: 'Open dialog' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe('hidden');
  });

  for (const mode of MODES) {
    test(`${mode}: no axe violations while open`, async ({ page }) => {
      await seedColorMode(page, mode);
      await page.goto('#/components/dialog');
      await page.getByRole('region', { name: 'Dialog preview' }).getByRole('button', { name: 'Open dialog' }).click();
      await expect(page.getByRole('dialog')).toHaveAttribute('data-state', 'open');
      const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
    });
  }
});
```

The inert test relies on inert content being dropped from Playwright's accessibility tree, so `getByRole('navigation')` finds nothing while the modal is open. If the gallery's sidebar has no `navigation` role, use a sidebar link by its real name, with the same `toHaveCount(0)` intent.

- [ ] **Step 2: Write `tabs.spec.ts`**

```ts
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { MODES, seedColorMode } from './mode';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
test.use({ viewport: { width: 1280, height: 900 } });

test.describe('Tabs page', () => {
  test('arrows, Home and End choose (automatic); the panel follows; the plug-in animation runs then clears', async ({ page }) => {
    await page.goto('#/components/tabs');
    const preview = page.getByRole('region', { name: 'Tabs preview' });
    const overview = preview.getByRole('tab', { name: 'Overview' });
    await overview.focus();
    await page.keyboard.press('ArrowRight');
    const usage = preview.getByRole('tab', { name: 'Usage' });
    await expect(usage).toBeFocused();
    await expect(usage).toHaveAttribute('aria-selected', 'true');
    await expect(preview.getByRole('tabpanel')).toHaveText('When to reach for it, and when not to.');
    await expect(usage).toHaveAttribute('data-boot', /^[ab]$/);
    await expect(usage).not.toHaveAttribute('data-boot', /./, { timeout: 2000 });
    await page.keyboard.press('End');
    await expect(preview.getByRole('tab', { name: 'Props' })).toBeFocused();
    await page.keyboard.press('Home');
    await expect(overview).toBeFocused();
  });

  test('manual activation: arrows move focus, Enter chooses', async ({ page }) => {
    await page.goto('#/components/tabs?activation=manual');
    const preview = page.getByRole('region', { name: 'Tabs preview' });
    await preview.getByRole('tab', { name: 'Overview' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(preview.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('Enter');
    await expect(preview.getByRole('tab', { name: 'Usage' })).toHaveAttribute('aria-selected', 'true');
  });

  for (const mode of MODES) {
    test(`${mode}: no axe violations`, async ({ page }) => {
      await seedColorMode(page, mode);
      await page.goto('#/components/tabs');
      await expect(page.getByRole('region', { name: 'Tabs preview' }).getByRole('tablist')).toBeVisible();
      const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
    });
  }
});
```

- [ ] **Step 3: Run e2e**

Run: `pnpm gallery:build && pnpm e2e`
Expected: every spec passes. `a11y.spec.ts` also covers both new routes, because `ROUTES` is built from the sidebar `NAV`.

- [ ] **Step 4: Visual check and screenshots for the owner**

Start the gallery yourself in the background: `pnpm build`, then `pnpm --filter @bit-ds/gallery dev`. Note the port it prints. Never kill processes you didn't start, and stop only your own server at the end.

With a headed Chromium Playwright script kept in the session scratchpad, not the repo, at 1280×900, in light and dark, capture:
- the Dialog open (`data-state="open"`);
- the Dialog mid-open (pause its animation at 220ms: `const [a] = document.querySelector('dialog').getAnimations(); a.pause(); a.currentTime = 220;`);
- the Tabs at rest;
- the Tabs mid-animation (pause the slot's animation at 380ms).

Save them to `~/.gstack/projects/doosemavis-bit-design-system/designs/dialog-tabs-20261007/` as `live-{dialog-open,dialog-mid,tabs-rest,tabs-mid}-{light,dark}.png`, and look at each:
- the title bar is purple with the pixel title;
- the × is a square Button;
- the focus ring shows inside a focused tab;
- the slot is lit under the chosen cartridge.

Report anything off rather than changing more than raw offsets.

- [ ] **Step 5: Commit**

```bash
git add apps/gallery/e2e/dialog.spec.ts apps/gallery/e2e/tabs.spec.ts
git commit -m "test(gallery): e2e for Dialog (modal, focus, Esc, backdrop, scroll lock) and Tabs (keys, manual, animation)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Release notes and package checks

**Files:**
- Modify: `packages/react/scripts/expected-exports.mjs`, `packages/react/scripts/verify-dist.mjs`, `scripts/smoke-consumer.mjs`, `CHANGELOG.md`, `README.md`

- [ ] **Step 1: Expected exports and types**

- **`expected-exports.mjs`:** add a line to `EXPECTED` after the Table line: `'Dialog', 'DialogHeader', 'DialogBody', 'DialogFooter', 'DialogClose', 'Tabs', 'TabList', 'Tab', 'TabPanel',`.
- **`verify-dist.mjs`, the type-name list (around line 75):** add `'DialogProps', 'DialogHeaderProps', 'DialogPartProps', 'DialogCloseProps', 'TabsProps', 'TabListProps', 'TabProps', 'TabPanelProps'`.

Run: `pnpm build && pnpm verify`
Expected: `dist OK: 40 components, …`.

- [ ] **Step 2: The smoke consumer type-checks both**

In `scripts/smoke-consumer.mjs`, in the `check.tsx` template:
- Add `Dialog, DialogBody, DialogClose, DialogFooter, DialogHeader, Tab, TabList, TabPanel, Tabs` to the value import.
- Add `DialogProps, TabsProps` to the type import.
- Add above `App`:
  ```ts
  // Dialog and Tabs (0.1.5): controlled open state; tabs by value.
  export const onOpen: DialogProps['onOpenChange'] = (open) => void (open === true);
  export const onTab: TabsProps['onValueChange'] = (v) => void v.toUpperCase();
  ```
- Add inside the fragment in `App`:
  ```tsx
        <Dialog open={false} onOpenChange={onOpen} alert size="sm">
          <DialogHeader closeLabel="Close">Title</DialogHeader>
          <DialogBody>Body</DialogBody>
          <DialogFooter>
            <DialogClose data-autofocus>Cancel</DialogClose>
          </DialogFooter>
        </Dialog>
        <Tabs defaultValue="a" activation="manual" onValueChange={onTab}>
          <TabList aria-label="Demo">
            <Tab value="a">A</Tab>
            <Tab value="b" disabled>B</Tab>
          </TabList>
          <TabPanel value="a">Panel A</TabPanel>
          <TabPanel value="b">Panel B</TabPanel>
        </Tabs>
  ```

Run: `pnpm smoke`
Expected: `consumer OK: 40 components via ESM and CJS, CSS present, types check`.

- [ ] **Step 3: CHANGELOG and README**

1. **CHANGELOG:** in `CHANGELOG.md`'s `## 0.1.5` "Added" section, append:
   ```markdown
   - `Dialog`, with `DialogHeader`, `DialogBody`, `DialogFooter` and `DialogClose`: a modal on the native `<dialog>` and `showModal()`, in the Retro window style. Focus moves inside (to the element with `data-autofocus`, if any), the page behind is inert and does not scroll, Esc or the × closes it, and focus returns to what opened it. Controlled with `open` and `onOpenChange`; `alert` makes it an alertdialog that a click on the dimmed page does not close; `size` sets the width. It folds out of its title bar in pixel steps and folds back in when closed (none with reduced motion).
   - `Tabs`, with `TabList`, `Tab` and `TabPanel`: the WAI-ARIA tabs pattern with cartridge-shaped tabs. Only the chosen tab is in the Tab order; the arrows (swapped in right-to-left pages), Home and End move between tabs and skip disabled ones; `activation="manual"` waits for Enter or Space. The chosen cartridge seats into a slot that lights up under it, in pixel steps (none with reduced motion). Panels stay mounted.
   - Types: `DialogProps`, `DialogHeaderProps`, `DialogPartProps`, `DialogCloseProps`, `TabsProps`, `TabListProps`, `TabProps`, `TabPanelProps`.
   ```
2. **README component list:** in `README.md`'s Components list, after the `- **Choice:** …` line, add:
   ```markdown
   - **Overlays and navigation:** Dialog (+ DialogHeader, DialogBody, DialogFooter, DialogClose), Tabs (+ TabList, Tab, TabPanel)
   ```
3. **README paragraph:** at the end of the paragraph after that list, append this sentence:
   ```markdown
   Dialog is the native modal `<dialog>`: focus moves in, the page behind is inert, Esc closes it, and focus returns to what opened it. Tabs follow the WAI-ARIA tabs pattern, with one Tab stop and arrow keys between tabs.
   ```
4. **README "How it's tested":** the **Keyboard and focus** bullet becomes:
   ```markdown
   - **Keyboard and focus:** Select's keyboard model (arrows, Home and End, Page Up and Page Down, typeahead, Enter, Space, Escape, Tab) is tested key by key, along with where focus goes and how it behaves in a form (`required`, reset, `form="id"`). Dialog is tested in a real browser for focus moving in and staying in, the page behind being inert, Esc, and focus returning; Tabs for the arrow keys, Home and End, and manual activation.
   ```
   That section lives on `docs/readme-testing` (PR #39) and may not be on this branch yet. If the bullet is absent, skip only item 4 and note it in the report; it lands in a README PR after both merge.

- [ ] **Step 4: Full local CI**

Run each, logging to its own file in the session scratchpad. Don't pipe through a filter that hides the exit code:
```bash
pnpm build && pnpm verify
pnpm typecheck
pnpm lint
pnpm --filter @bit-ds/core test
pnpm test:coverage
pnpm --filter @bit-ds/gallery test
node --test 'scripts/*.test.mjs'
pnpm smoke && pnpm smoke:full
pnpm gallery:build
pnpm e2e
```
Expected: all pass, and coverage is 100%.

- [ ] **Step 5: Commit**

```bash
git add packages/react/scripts/expected-exports.mjs packages/react/scripts/verify-dist.mjs scripts/smoke-consumer.mjs CHANGELOG.md README.md
git commit -m "chore: 0.1.5 notes and package checks for Dialog and Tabs

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
