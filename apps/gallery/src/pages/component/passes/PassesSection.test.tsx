import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { button } from '../../../manifests/button';
import type { Manifest } from '../../../manifests/types';
import { PassesSection } from './PassesSection';

function setup(path: string, manifest: Manifest = button) {
  const router = createMemoryRouter([{ path: '/x', element: <PassesSection manifest={manifest} /> }], { initialEntries: [path] });
  const utils = render(<RouterProvider router={router} />);
  return { router, ...utils };
}
const stage = () => screen.getByRole('group', { name: /pass: Button$/ });

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
    const { container } = setup('/x', { ...button, anatomy: undefined });
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
    expect(within(footer).getByText(/Each part points to the tokens it reads/)).toBeInTheDocument();
    expect(within(footer).getByText(/--bit-shadow-md/)).toBeInTheDocument();
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
    await screen.findByText(/bit-button/);
    await userEvent.click(screen.getByRole('button', { name: 'Next: Wireframe' }));
    expect(await screen.findByText('height 0px, padding-left 0px')).toBeInTheDocument();
  });

  it("Final reads the element's real classes", async () => {
    setup('/x?pass=final');
    const reads = await screen.findByText(/bit-button/);
    expect(reads.textContent!.split(' ')).toEqual(expect.arrayContaining(['bit-button', 'bit-primary', 'bit-solid', 'bit-md']));
    expect(screen.getByText("Default props aren't printed in the code.")).toBeInTheDocument();
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
        withParts({ label: 'Label', selector: '.bit-button', tokens: ['--bit-weight-bold', '--bit-font-mono', '--bit-border-width'], side: 'left' }),
      );
      expect(vars()).toEqual(['9', '3']);
    });

    it('takes each count from the side that has more of it, so either side fits', () => {
      // Left: 5 lines + Label (1+4) = 10 lines, 3 callouts. Right: 5 lines + two 1-token parts = 9 lines, 4 callouts.
      setup(
        '/x',
        withParts(
          { label: 'Label', selector: '.bit-button', tokens: ['--bit-weight-bold', '--bit-font-mono', '--bit-border-width', '--bit-shadow-md'], side: 'left' },
          { label: 'Ring', selector: '.bit-button', tokens: ['--bit-border-width'], side: 'right' },
          { label: 'Text', selector: '.bit-button', tokens: ['--bit-weight-bold'], side: 'right' },
        ),
      );
      expect(vars()).toEqual(['10', '4']);
    });
  });
});
