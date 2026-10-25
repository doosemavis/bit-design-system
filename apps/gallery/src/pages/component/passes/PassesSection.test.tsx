import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { button } from '../../../manifests/button';
import type { Manifest } from '../../../manifests/types';
import { useControlState } from '../../../engine/useControlState';
import { Playground } from '../Playground';
import { PassesSection } from './PassesSection';

/** The page's wiring: the Playground and the passes share one control state, as ComponentPage does. */
function Page({ manifest }: { manifest: Manifest }) {
  const controls = useControlState(manifest);
  return (
    <>
      <Playground manifest={manifest} controls={controls} />
      <PassesSection manifest={manifest} pendingQuery={controls.pendingQuery} />
    </>
  );
}

function setup(path: string, manifest: Manifest = button) {
  const router = createMemoryRouter([{ path: '/x', element: <Page manifest={manifest} /> }], { initialEntries: [path] });
  const utils = render(<RouterProvider router={router} />);
  return { router, ...utils };
}
const stage = () => screen.getByRole('group', { name: /pass: Button$/ });
const footer = () => screen.getByText('What this pass shows').closest<HTMLElement>('.bit-card__footer')!;

// jsdom has no ResizeObserver: a stand-in that records each callback, so a test can report a resize.
let resizeCallbacks: (() => void)[] = [];
beforeEach(() => {
  resizeCallbacks = [];
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: () => void) {
        resizeCallbacks = [...resizeCallbacks, callback];
      }
      observe() {}
      disconnect() {}
    },
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('PassesSection', () => {
  it('a manifest without anatomy renders nothing', () => {
    const router = createMemoryRouter(
      [{ path: '/x', element: <PassesSection manifest={{ ...button, anatomy: undefined }} pendingQuery={() => new URLSearchParams()} /> }],
      { initialEntries: ['/x'] },
    );
    const { container } = render(<RouterProvider router={router} />);
    expect(container).toBeEmptyDOMElement();
  });

  it.each([
    ['', 'Wireframe pass: Button'],
    ['?pass=tokens', 'Tokens pass: Button'],
    ['?pass=states', 'States pass: Button'],
    ['?pass=final', 'Final pass: Button'],
    ['?pass=xray', 'Wireframe pass: Button'],
  ])('%j shows %s', (query, name) => {
    setup(`/x${query}`);
    expect(screen.getByRole('group', { name })).toBeInTheDocument();
  });

  it('Next names the following pass, pushes history, and wraps from Final to Wireframe', async () => {
    const { router } = setup('/x?pass=states');
    await userEvent.click(screen.getByRole('button', { name: 'Next: Final' }));
    expect(router.state.location.search).toBe('?pass=final');
    expect(router.state.historyAction).toBe('PUSH');
    await userEvent.click(screen.getByRole('button', { name: 'Next: Wireframe' }));
    expect(router.state.location.search).toBe('');
    await act(async () => {
      await router.navigate(-1);
    });
    expect(stage()).toHaveAccessibleName('Final pass: Button');
  });

  it('picking a pass keeps control keys', async () => {
    const { router } = setup('/x?variant=outline');
    await userEvent.click(screen.getByRole('radio', { name: 'Tokens' }));
    expect(router.state.location.search).toBe('?variant=outline&pass=tokens');
  });

  it('a pass push is canonical: control keys first, then the pass', async () => {
    const { router } = setup('/x?pass=tokens&variant=outline');
    await userEvent.click(screen.getByRole('radio', { name: 'Final' }));
    expect(router.state.location.search).toBe('?variant=outline&pass=final');
    await userEvent.click(screen.getByRole('radio', { name: 'Wireframe' }));
    expect(router.state.location.search).toBe('?variant=outline');
  });

  it('counts the passes seen on this visit', async () => {
    setup('/x');
    expect(screen.getByText('1 of 4 seen')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Next: Tokens' }));
    expect(screen.getByText('2 of 4 seen')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: 'Wireframe' }));
    expect(screen.getByText('2 of 4 seen')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: 'Final' }));
    await userEvent.click(screen.getByRole('radio', { name: 'States' }));
    expect(screen.getByText('All 4 seen')).toBeInTheDocument();
  });

  it('the live region speaks for Next only', async () => {
    setup('/x');
    const live = screen.getByRole('status');
    expect(live).toBeEmptyDOMElement();
    await userEvent.click(screen.getByRole('radio', { name: 'States' }));
    expect(live).toBeEmptyDOMElement();
    await userEvent.click(screen.getByRole('button', { name: 'Next: Final' }));
    expect(live).toHaveTextContent('Final, pass 4 of 4');
  });

  it('Next speaks again after an arrow key moves the pass back', async () => {
    setup('/x');
    const live = screen.getByRole('status');
    await userEvent.click(screen.getByRole('button', { name: 'Next: Tokens' }));
    expect(live).toHaveTextContent('Tokens, pass 2 of 4');
    screen.getByRole('radio', { name: 'Tokens' }).focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(stage()).toHaveAccessibleName('Wireframe pass: Button');
    expect(live).toBeEmptyDOMElement();
    await userEvent.click(screen.getByRole('button', { name: 'Next: Tokens' }));
    expect(live).toHaveTextContent('Tokens, pass 2 of 4');
  });

  it('Back clears what Next said, and Forward does not say it again', async () => {
    const { router } = setup('/x');
    const live = screen.getByRole('status');
    await userEvent.click(screen.getByRole('button', { name: 'Next: Tokens' }));
    await act(async () => {
      await router.navigate(-1);
    });
    expect(live).toBeEmptyDOMElement();
    await act(async () => {
      await router.navigate(1);
    });
    expect(stage()).toHaveAccessibleName('Tokens pass: Button');
    expect(live).toBeEmptyDOMElement();
  });

  it('the instance is the default Button, whatever the Playground says', () => {
    setup('/x?color=danger&pass=tokens');
    expect(stage().querySelector('.bit-button')).toHaveClass('bit-primary');
  });

  it('the caption says what the pass shows and what it reads', () => {
    setup('/x?pass=tokens');
    const footer = screen.getByText('What this pass shows').closest('.bit-card__footer') as HTMLElement;
    expect(within(footer).getByText(/Each part lands as its token turns on/)).toBeInTheDocument();
    expect(footer.querySelector('code')).toHaveTextContent(/--bit-shadow-md/);
  });

  it("Wireframe's reads follow the instance when it resizes", async () => {
    setup('/x');
    await screen.findByText('height 0px, padding-left 0px');
    const button = stage().querySelector<HTMLElement>('.bit-button')!;
    button.getBoundingClientRect = () => new DOMRect(0, 0, 120, 40);
    act(() => resizeCallbacks.forEach((callback) => callback()));
    expect(await screen.findByText('height 40px, padding-left 0px')).toBeInTheDocument();
  });

  it('reads re-measure on a pass change: Final, then Next to Wireframe', async () => {
    setup('/x?pass=final');
    await within(stage()).findByText(/bit-button/);
    await userEvent.click(screen.getByRole('button', { name: 'Next: Wireframe' }));
    expect(await screen.findByText('height 0px, padding-left 0px')).toBeInTheDocument();
  });

  it("Final reads the element's real classes", async () => {
    setup('/x?pass=final');
    const reads = await within(stage()).findByText(/bit-button/);
    expect(reads.textContent!.split(' ')).toEqual(expect.arrayContaining(['bit-button', 'bit-primary', 'bit-solid', 'bit-md']));
    expect(screen.getByText("Default props aren't printed in the code.")).toBeInTheDocument();
  });

  it('Final lists the classes once: under the scene, not again in the caption', async () => {
    setup('/x?pass=final');
    await within(stage()).findByText(/bit-button/);
    expect(within(footer()).queryByText(/bit-button/)).toBeNull();
    expect(within(footer()).queryByText('Reads')).toBeNull();
  });

  it.each([
    ['', 'The box only: its height and padding, measured from the page.'],
    ['?pass=tokens', 'Each part lands as its token turns on. Point at a callout to light its part up.'],
    ['?pass=states', 'The states its props set. Pick one, or pick Try it and use it.'],
    ['?pass=final', 'The component in a real place, and the JSX that makes it.'],
  ])('%j says its SHOWS copy', (query, copy) => {
    setup(`/x${query}`);
    expect(within(footer()).getByText(new RegExp(`^${copy.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`))).toBeInTheDocument();
  });

  it('the caption shows the build note on its right-hand line, and none on Wireframe', async () => {
    setup('/x');
    expect(within(footer()).queryByText(/--bit-/)).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Next: Tokens' }));
    expect(await within(footer()).findAllByText(/--bit-/)).not.toHaveLength(0);
  });

  it('typing in the Playground, then switching pass inside the debounce, keeps both in one push', async () => {
    const { router } = setup('/x');
    const field = screen.getByLabelText('children');
    await userEvent.clear(field);
    await userEvent.type(field, 'Sav');
    await userEvent.click(screen.getByRole('radio', { name: 'Tokens' }));
    expect(router.state.historyAction).toBe('PUSH');
    const params = new URLSearchParams(router.state.location.search);
    expect(params.get('children')).toBe('Sav');
    expect(params.get('pass')).toBe('tokens');
  });

  it('picking Tokens through the control plays it; loading at ?pass=tokens shows its end', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: false });
    try {
      setup('/x');
      fireEvent.click(screen.getByRole('radio', { name: 'Tokens' }));
      expect(footer()).toHaveTextContent('Edge: --bit-border-width');
      act(() => void vi.advanceTimersByTime(5000));
      expect(footer()).toHaveTextContent('Shadow: --bit-shadow-md');
    } finally {
      vi.useRealTimers();
    }
    cleanup();
    setup('/x?pass=tokens');
    expect(footer()).toHaveTextContent('Shadow: --bit-shadow-md');
  });

  it('picking the pass already shown marks nothing and changes no history', async () => {
    const { router } = setup('/x?pass=tokens');
    const before = router.state.location.key;
    await userEvent.click(screen.getByRole('radio', { name: 'Tokens' }));
    expect(router.state.location.key).toBe(before);
    expect(router.state.historyAction).toBe('POP');
  });

  describe('Play', () => {
    const HOLD = 960;
    const tick = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
    const pressed = (name: string) => fireEvent.click(screen.getByRole('button', { name }));
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    function watch(router: ReturnType<typeof setup>['router']) {
      const entries: string[] = [];
      router.subscribe((s) => entries.push(`${s.historyAction} ${s.location.search}`));
      return entries;
    }

    it('reads Play, then Stop while running, then Play again at the end', () => {
      setup('/x');
      pressed('Play');
      expect(screen.queryByRole('button', { name: 'Play' })).toBeNull();
      expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument();
      tick(HOLD * 20);
      expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
    });

    it('pushes exactly one entry, ?pass=final, at the end, and marks all four passes seen', () => {
      const { router } = setup('/x');
      const entries = watch(router);
      pressed('Play');
      tick(HOLD * 3);
      expect(entries).toEqual([]);
      tick(HOLD * 20);
      expect(entries).toEqual(['PUSH ?pass=final']);
      expect(stage()).toHaveAccessibleName('Final pass: Button');
      expect(screen.getByText('All 4 seen')).toBeInTheDocument();
    });

    it('marks all four seen as it starts', () => {
      setup('/x');
      pressed('Play');
      expect(screen.getByText('All 4 seen')).toBeInTheDocument();
    });

    it('Stop halts the run and replaces ?pass= with the stopped pass, with no new entry', () => {
      const { router } = setup('/x');
      const entries = watch(router);
      pressed('Play');
      tick(HOLD * 5);
      pressed('Stop');
      const name = stage().getAttribute('aria-label');
      expect(name).toBe('States pass: Button');
      tick(HOLD * 20);
      expect(entries).toEqual(['REPLACE ?pass=states']);
      expect(stage().getAttribute('aria-label')).toBe(name);
      expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Next: Final' })).toBeInTheDocument();
    });

    it('Stop on the URL pass changes no history', () => {
      const { router } = setup('/x');
      const entries = watch(router);
      pressed('Play');
      tick(HOLD * 0);
      pressed('Stop');
      expect(entries).toEqual([]);
      expect(router.state.location.search).toBe('');
    });

    it('Stop on the URL pass mid-Tokens lands that pass at its end, with no history change', () => {
      const { router } = setup('/x?pass=tokens');
      const entries = watch(router);
      pressed('Play');
      tick(HOLD * 2);
      const pending = () => stage().querySelectorAll('[role="listitem"][data-pending]').length;
      expect(pending()).toBeGreaterThan(0);
      pressed('Stop');
      expect(stage()).toHaveAccessibleName('Tokens pass: Button');
      expect(pending()).toBe(0);
      expect(entries).toEqual([]);
      expect(router.state.location.search).toBe('?pass=tokens');
    });

    it("picking the URL's pass mid-run stops the run and shows that pass's end, with no history change", () => {
      const { router } = setup('/x');
      pressed('Play');
      tick(HOLD * 5);
      expect(stage()).toHaveAccessibleName('States pass: Button');
      const entries = watch(router);
      fireEvent.click(screen.getByRole('radio', { name: 'Wireframe' }));
      expect(entries).toEqual([]);
      expect(stage()).toHaveAccessibleName('Wireframe pass: Button');
      expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
      tick(HOLD * 20);
      expect(stage()).toHaveAccessibleName('Wireframe pass: Button');
    });

    it('Next follows the shown pass mid-run', () => {
      setup('/x');
      pressed('Play');
      tick(HOLD * 5);
      expect(screen.getByRole('button', { name: 'Next: Final' })).toBeInTheDocument();
    });

    it("the pass control's value follows the run", () => {
      setup('/x');
      pressed('Play');
      expect(screen.getByRole('radio', { name: 'Wireframe' })).toBeChecked();
      tick(HOLD);
      expect(screen.getByRole('radio', { name: 'Tokens' })).toBeChecked();
      tick(HOLD * 4);
      expect(screen.getByRole('radio', { name: 'States' })).toBeChecked();
    });

    it('picking a pass mid-run is an ordinary pick: the run is cancelled', () => {
      const { router } = setup('/x');
      pressed('Play');
      tick(HOLD);
      fireEvent.click(screen.getByRole('radio', { name: 'States' }));
      expect(router.state.location.search).toBe('?pass=states');
      expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
      tick(HOLD * 20);
      expect(router.state.location.search).toBe('?pass=states');
    });

    it('changing a Playground control mid-run neither resets the build nor swaps the instance', () => {
      setup('/x');
      pressed('Play');
      tick(HOLD);
      const before = stage().querySelector('.bit-button');
      expect(stage()).toHaveAccessibleName('Tokens pass: Button');
      fireEvent.change(screen.getByLabelText('children'), { target: { value: 'Sent' } });
      tick(500);
      expect(stage()).toHaveAccessibleName('Tokens pass: Button');
      expect(stage().querySelector('.bit-button')).toBe(before);
      expect(before).toHaveClass('bit-primary');
      expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument();
    });

    it('Next still announces the pass', () => {
      setup('/x');
      pressed('Next: Tokens');
      expect(screen.getByRole('status')).toHaveTextContent('Tokens, pass 2 of 4');
    });
  });

  describe('stage size: a line per callout label and per token chip, and the callouts for the gaps', () => {
    const vars = () => [stage().style.getPropertyValue('--_gallery-passes-lines'), stage().style.getPropertyValue('--_gallery-passes-callouts')];
    const withParts = (...parts: NonNullable<Manifest['anatomy']>['parts']): Manifest => ({
      ...button,
      anatomy: { ...button.anatomy!, parts: [...button.anatomy!.parts, ...parts] },
    });

    it('Button: Face (1+2) + Size (1+1) = 5 lines in 2 callouts on the left, Edge (1+2) + Shadow (1+1) the same on the right', () => {
      setup('/x');
      expect(vars()).toEqual(['5', '2']);
      expect(stage().style.getPropertyValue('--_gallery-passes-rows')).toBe('');
    });

    it('a heavier side sets both: left gains Label (1+3), 9 lines in 3 callouts', () => {
      setup(
        '/x',
        withParts({ label: 'Label', selector: '.bit-button', tokens: ['--bit-weight-bold', '--bit-font-mono', '--bit-border-width'], side: 'left', touch: { kind: 'fill', edge: 'left' } }),
      );
      expect(vars()).toEqual(['9', '3']);
    });

    it('takes each count from the side that has more of it, so either side fits', () => {
      // Left: 5 lines + Label (1+4) = 10 lines, 3 callouts. Right: 5 lines + two 1-token parts = 9 lines, 4 callouts.
      setup(
        '/x',
        withParts(
          { label: 'Label', selector: '.bit-button', tokens: ['--bit-weight-bold', '--bit-font-mono', '--bit-border-width', '--bit-shadow-md'], side: 'left', touch: { kind: 'fill', edge: 'left' } },
          { label: 'Ring', selector: '.bit-button', tokens: ['--bit-border-width'], side: 'right', touch: { kind: 'fill', edge: 'left' } },
          { label: 'Text', selector: '.bit-button', tokens: ['--bit-weight-bold'], side: 'right', touch: { kind: 'fill', edge: 'left' } },
        ),
      );
      expect(vars()).toEqual(['10', '4']);
    });
  });
});
