import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode, createRef, useState } from 'react';
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
/** Let the tasks the browser queues (a native `close` event) run. */
const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
/** Fire an animationend (AnimationEvent comes from vitest.polyfills.ts, as jsdom has none). */
function endAnimation(target: Element, animationName: string) {
  act(() => {
    target.dispatchEvent(new AnimationEvent('animationend', { bubbles: true, animationName }));
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

describe('Dialog: edges', () => {
  it('a press and release on any side of the backdrop closes it', async () => {
    const { onOpenChange } = await openIt();
    for (const point of [{ clientX: 5, clientY: 0 }, { clientX: 0, clientY: -5 }, { clientX: 0, clientY: 5 }]) {
      onOpenChange.mockClear();
      await act(async () => {
        screen.getByRole('button', { name: 'Open', hidden: true }).click();
      });
      fireEvent.pointerDown(dialog(), point);
      fireEvent.click(dialog(), point);
      expect(onOpenChange).toHaveBeenLastCalledWith(false);
    }
  });

  it('a press on the backdrop released inside the box does not close it', async () => {
    const { onOpenChange } = await openIt();
    onOpenChange.mockClear();
    fireEvent.pointerDown(dialog(), { clientX: -5, clientY: -5 });
    fireEvent.click(dialog(), { clientX: 0, clientY: 0 });
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('a prefers-reduced-motion user gets no animation: opening is straight to open, closing is at once', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: true, media: query }));
    const { user } = await openIt();
    expect(dialog()).toHaveAttribute('data-state', 'open');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(dialog().open).toBe(false);
  });

  it('opens without a header; an opener that is not an HTMLElement gets no focus back, and focus is left alone', () => {
    function Svg() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <svg tabIndex={0} data-testid="svg" onFocus={() => setOpen(true)} />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogBody>x</DialogBody>
          </Dialog>
        </>
      );
    }
    render(<Svg />);
    act(() => screen.getByTestId('svg').focus());
    expect(dialog().open).toBe(true);
    expect(dialog().style.getPropertyValue('--_bit-dialog-bar')).toBe('');
    act(() => {
      dialog().dispatchEvent(new Event('cancel', { cancelable: true }));
    });
    expect(dialog().open).toBe(false);
    expect(screen.getByTestId('svg')).toHaveFocus();
  });

  it('the header height is kept as --_bit-dialog-bar', async () => {
    await openIt();
    expect(dialog().style.getPropertyValue('--_bit-dialog-bar')).toBe('0px');
  });

  it('a part that unmounts while the dialog stays open stops naming or describing it', async () => {
    function Parts() {
      const [show, setShow] = useState(true);
      return (
        <Dialog open onOpenChange={() => {}}>
          <DialogHeader>T</DialogHeader>
          {show ? <DialogBody>b</DialogBody> : null}
          <DialogFooter>
            <Button onClick={() => setShow(false)}>Hide</Button>
          </DialogFooter>
        </Dialog>
      );
    }
    const user = userEvent.setup();
    render(<Parts />);
    expect(dialog()).toHaveAttribute('aria-describedby');
    await user.click(screen.getByRole('button', { name: 'Hide' }));
    expect(dialog()).not.toHaveAttribute('aria-describedby');
  });

  it('the fallback timer finds the dialog already closed without a close event and just settles', async () => {
    allowMotion();
    await openIt();
    vi.useFakeTimers();
    act(() => screen.getByRole('button', { name: 'Cancel' }).click());
    dialog().removeAttribute('open');
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(dialog()).not.toHaveAttribute('data-state');
  });

  it('the browser closing it during the fold-in settles it without asking again', async () => {
    allowMotion();
    const { user, onOpenChange } = await openIt();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    onOpenChange.mockClear();
    act(() => {
      dialog().removeAttribute('open');
      dialog().dispatchEvent(new Event('close'));
    });
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(dialog()).not.toHaveAttribute('data-state');
  });

  it('reopening during the fold-in ignores a late bit-dialog-close animationend', () => {
    allowMotion();
    const onOpenChange = vi.fn();
    function Toggle() {
      const [open, setOpen] = useState(true);
      return (
        <>
          <Button onClick={() => setOpen((o) => !o)}>Toggle</Button>
          <Dialog
            open={open}
            onOpenChange={(next) => {
              onOpenChange(next);
              setOpen(next);
            }}
          >
            <DialogHeader>T</DialogHeader>
          </Dialog>
        </>
      );
    }
    render(<Toggle />);
    act(() => screen.getByRole('button', { name: 'Toggle', hidden: true }).click());
    act(() => screen.getByRole('button', { name: 'Toggle', hidden: true }).click());
    endAnimation(dialog(), 'bit-dialog-close');
    expect(dialog().open).toBe(true);
    expect(dialog()).toHaveAttribute('data-state', 'opening');
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('a stale close event while the dialog is open again changes nothing', async () => {
    const { onOpenChange } = await openIt();
    onOpenChange.mockClear();
    act(() => {
      dialog().dispatchEvent(new Event('close'));
    });
    expect(dialog().open).toBe(true);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('unmount closes without the later close event being read as the person closing', async () => {
    const onOpenChange = vi.fn();
    const { unmount } = render(
      <Dialog open onOpenChange={onOpenChange}>
        <DialogHeader>T</DialogHeader>
      </Dialog>,
    );
    unmount();
    await settle();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('a Dialog that starts open under StrictMode still notices the browser closing it later', async () => {
    const onOpenChange = vi.fn();
    render(
      <StrictMode>
        <Dialog open onOpenChange={onOpenChange}>
          <DialogHeader>T</DialogHeader>
        </Dialog>
      </StrictMode>,
    );
    // StrictMode's mount, unmount, mount closed and reopened it: that close event is queued and stale.
    await settle();
    expect(dialog().open).toBe(true);
    expect(onOpenChange).not.toHaveBeenCalled();
    act(() => dialog().close());
    await settle();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('a Dialog rendered open has aria-labelledby and aria-describedby as soon as it renders', () => {
    render(
      <Dialog open onOpenChange={() => {}}>
        <DialogHeader>T</DialogHeader>
        <DialogBody>B</DialogBody>
      </Dialog>,
    );
    expect(dialog()).toHaveAttribute('aria-labelledby');
    expect(dialog()).toHaveAttribute('aria-describedby');
  });

  it('data-autofocus="false" does not take focus', () => {
    render(
      <Dialog open onOpenChange={() => {}}>
        <DialogHeader>T</DialogHeader>
        <DialogBody>
          <button data-autofocus="false">no</button>
        </DialogBody>
      </Dialog>,
    );
    expect(screen.getByRole('button', { name: 'no' })).not.toHaveFocus();
  });
});
