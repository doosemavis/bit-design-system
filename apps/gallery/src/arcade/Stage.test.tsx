import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderAt } from '../test/renderRoute';
import { expectNoA11yViolations } from '../test/a11y';
import { stubCanvas } from '../test/canvas';
import { stubMatchMedia } from '../test/matchMedia';
import { NARROW_QUERY } from '../ui/useMediaQuery';
import { cellLook, SWIPE_MS, swipeMoments, swipeProgress } from './swipe';
import { stageGameOf } from './ArcadeStage';

const REDUCE = '(prefers-reduced-motion: reduce)';
let restoreCanvas: () => void = () => {};
let restoreMedia: () => void = () => {};
beforeEach(() => {
  restoreCanvas = stubCanvas().restore;
  // Most tests skip the swipe (reduce motion shows the game at once); the swipe has its own tests below.
  restoreMedia = stubMatchMedia(REDUCE);
});
afterEach(() => {
  restoreCanvas();
  restoreMedia();
  vi.restoreAllMocks();
  window.localStorage.clear();
});

const nav = () => screen.getByRole('navigation', { name: 'Gallery' });
const main = () => document.getElementById('main')!;
const stage = () => screen.queryByRole('region', { name: 'Arcade: Bit Blaster' });
const pauseButton = (region: HTMLElement) => within(region).getByRole('button', { name: /^(Pause|Resume)$/ });
const liveLine = (region: HTMLElement) => within(region).getAllByRole('status').at(-1)!;

/** Opens Bit Blaster from the sidebar and waits for its board (the game is its own lazy chunk). */
async function openBlaster() {
  const user = userEvent.setup();
  await user.click(within(nav()).getByRole('button', { name: 'Bit Blaster' }));
  const board = await screen.findByRole('application', { name: 'Bit Blaster board' });
  return { user, board, region: stage()! };
}

describe('Bit Blaster takes over the main area', () => {
  it('the sidebar stays a menu, the page stays put under the game but out of reach, and the URL doesn’t change', async () => {
    const { router } = renderAt('/tokens');
    await screen.findByRole('heading', { level: 1, name: 'Tokens' });
    const { board, region } = await openBlaster();
    expect(region).toHaveAttribute('id', 'gallery-stage');
    expect(region.closest('.gallery-stage')).toHaveClass('bit-dark');
    expect(nav()).toBeInTheDocument();
    expect(board).toHaveFocus();
    expect(board).toHaveAccessibleDescription(/The arrow keys or A and D move the ship\. Space fires\. P pauses\./);
    expect(main()).toHaveAttribute('inert');
    expect(within(main()).getByRole('heading', { level: 1, name: 'Tokens' })).toBeInTheDocument();
    expect(router.state.location).toMatchObject({ pathname: '/tokens', search: '' });
    expect(stageGameOf(router.state.location.state)).toBe('bit-blaster');
  });

  it('shows its score, best, lives and wave, and the keys start, fire and pause it', async () => {
    window.localStorage.setItem('bit-gallery-arcade-bit-blaster-best', '1230');
    renderAt('/');
    const { user, region } = await openBlaster();
    expect([...region.querySelectorAll('.bit-badge')].map((b) => b.textContent)).toEqual(['Score 0', 'Best 1230', 'Lives 3', 'Wave 1']);
    expect(pauseButton(region)).toBeDisabled();
    await user.keyboard(' ');
    expect(pauseButton(region)).toBeEnabled();
    await user.keyboard('p');
    expect(pauseButton(region)).toHaveTextContent('Resume');
    expect(liveLine(region)).toHaveTextContent('Paused. Press Space to go on.');
    await user.keyboard('{ArrowLeft>}');
    expect(pauseButton(region)).toHaveTextContent('Pause');
  });

  it('Back to page closes it: the page is live again and focus returns to the sidebar item', async () => {
    renderAt('/');
    const { user, region } = await openBlaster();
    await user.click(within(region).getByRole('button', { name: 'Back to page' }));
    await waitFor(() => expect(stage()).toBeNull());
    expect(main()).not.toHaveAttribute('inert');
    await waitFor(() => expect(within(nav()).getByRole('button', { name: 'Bit Blaster' })).toHaveFocus());
  });

  it('a double-click on Back to page goes back once, to the page, not past it', async () => {
    const { router } = renderAt('/spacing');
    await screen.findByRole('heading', { level: 1, name: 'Spacing' });
    await act(() => router.navigate('/tokens'));
    await screen.findByRole('heading', { level: 1, name: 'Tokens' });
    const { region } = await openBlaster();
    const back = within(region).getByRole('button', { name: 'Back to page' });
    fireEvent.click(back);
    fireEvent.click(back);
    await waitFor(() => expect(stage()).toBeNull());
    expect(router.state.location.pathname).toBe('/tokens');
  });

  it('a held key’s repeats never undo a pause, skip the game over, or leave the game', async () => {
    renderAt('/');
    const { user, board, region } = await openBlaster();
    await user.keyboard(' ');
    await user.keyboard('p');
    fireEvent.keyDown(board, { key: 'ArrowLeft', repeat: true });
    expect(pauseButton(region)).toHaveTextContent('Resume');
    fireEvent.keyDown(board, { key: 'Escape', repeat: true });
    expect(stage()).not.toBeNull();
    fireEvent.keyDown(board, { key: 'ArrowLeft' });
    expect(pauseButton(region)).toHaveTextContent('Pause');
  });

  it('the browser’s Back closes it and Forward opens it again', async () => {
    const { router } = renderAt('/spacing');
    await screen.findByRole('heading', { level: 1, name: 'Spacing' });
    await openBlaster();
    await act(() => router.navigate(-1));
    await waitFor(() => expect(stage()).toBeNull());
    expect(router.state.location.pathname).toBe('/spacing');
    await act(() => router.navigate(1));
    expect(await screen.findByRole('application', { name: 'Bit Blaster board' })).toBeInTheDocument();
  });

  it('Esc goes back from a game that isn’t running; a running game pauses first', async () => {
    renderAt('/');
    const first = await openBlaster();
    await first.user.keyboard('{Escape}');
    await waitFor(() => expect(stage()).toBeNull());

    const { user, region } = await openBlaster();
    await user.keyboard(' ');
    await user.keyboard('{Escape}');
    expect(stage()).not.toBeNull();
    expect(pauseButton(region)).toHaveTextContent('Resume');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(stage()).toBeNull());
  });

  it('pauses when focus leaves the game, and a button hands the keys back to the board', async () => {
    renderAt('/');
    const { user, board, region } = await openBlaster();
    await user.keyboard(' ');
    act(() => within(nav()).getByRole('button', { name: 'Snake' }).focus());
    expect(pauseButton(region)).toHaveTextContent('Resume');
    await user.click(within(region).getByRole('button', { name: 'Restart' }));
    expect(board).toHaveFocus();
  });

  it('takes keys only while the board has focus, and lets ⌘K through', async () => {
    renderAt('/');
    const { user, board, region } = await openBlaster();
    const back = within(region).getByRole('button', { name: 'Back to page' });
    act(() => back.focus());
    expect(fireEvent.keyDown(back, { key: ' ' })).toBe(true);
    act(() => board.focus());
    expect(fireEvent.keyDown(board, { key: ' ' })).toBe(false);
    await user.keyboard('{Meta>}k{/Meta}');
    expect(await screen.findByRole('dialog', { name: 'Search' })).toBeInTheDocument();
  });

  it('a sidebar game closes it and takes its place in the sidebar', async () => {
    renderAt('/');
    const { user } = await openBlaster();
    await user.click(within(nav()).getByRole('button', { name: 'Snake' }));
    const snake = await screen.findByRole('application', { name: 'Snake board' });
    await waitFor(() => expect(stage()).toBeNull());
    expect(snake).toHaveFocus();
  });

  it('on a component page, the playground’s query stays the page’s own, and the game stays open', async () => {
    const { router } = renderAt('/components/button?color=danger');
    await screen.findByRole('heading', { level: 1, name: 'Button' });
    await openBlaster();
    expect(router.state.location.search).toBe('?color=danger');
    expect(stage()).not.toBeNull();
  });

  it('the skip link goes to the game while it is up', async () => {
    renderAt('/');
    await openBlaster();
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#gallery-stage');
  });

  it('opens from search with Enter', async () => {
    renderAt('/');
    const user = userEvent.setup();
    await screen.findByRole('heading', { level: 1 });
    await user.keyboard('{Control>}k{/Control}');
    await user.type(await screen.findByRole('combobox', { name: 'Search pages, components and props' }), 'blaster');
    expect(screen.getAllByRole('option')[0]).toHaveAccessibleName('Bit Blaster, Arcade');
    await user.keyboard('{Enter}');
    expect(await screen.findByRole('application', { name: 'Bit Blaster board' }, { timeout: 2000 })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    renderAt('/');
    const { region } = await openBlaster();
    await expectNoA11yViolations(region);
  });
});

describe('Bit Blaster on a phone', () => {
  beforeEach(() => {
    restoreMedia();
    restoreMedia = stubMatchMedia(REDUCE, NARROW_QUERY);
  });

  it('opening it from the Menu sheet closes the sheet; hold-to-move arrows and Fire keep focus on the board', async () => {
    renderAt('/');
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Menu' }));
    expect(nav()).toHaveAttribute('data-open');
    const { board, region } = await openBlaster();
    expect(nav()).not.toHaveAttribute('data-open');
    const controls = within(region).getByRole('group', { name: 'Controls' });
    const buttons = within(controls).getAllByRole('button');
    expect(buttons.map((b) => b.getAttribute('aria-label') ?? b.textContent)).toEqual(['Left', 'Fire', 'Right']);
    expect(buttons.every((b) => b.classList.contains('bit-lg'))).toBe(true);
    fireEvent.pointerDown(within(controls).getByRole('button', { name: 'Fire' }));
    expect(pauseButton(region)).toBeEnabled();
    expect(board).toHaveFocus();
    fireEvent.pointerDown(within(controls).getByRole('button', { name: 'Left' }));
    fireEvent.pointerUp(within(controls).getByRole('button', { name: 'Left' }));
    expect(board).toHaveFocus();
  });

  it('an arrow focused by keyboard steps with Enter', async () => {
    renderAt('/');
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Menu' }));
    const { region } = await openBlaster();
    act(() => within(region).getByRole('button', { name: 'Right' }).focus());
    await user.keyboard('{Enter}');
    expect(pauseButton(region)).toBeEnabled();
  });
});

describe('the pixel swipe', () => {
  it('in: clear at the start, all black at the end, the left side first; out mirrors it', () => {
    const cols = 40;
    const moments = swipeMoments(cols, 3, 'in', 9);
    expect(moments.every((m) => cellLook(0, m, 'in') === 'clear')).toBe(true);
    expect(moments.every((m) => cellLook(1, m, 'in') === 'black')).toBe(true);
    const halfway = moments.slice(0, cols).map((m) => cellLook(0.45, m, 'in'));
    expect(halfway[0]).not.toBe('clear');
    expect(halfway[cols - 1]).toBe('clear');
    const out = swipeMoments(cols, 3, 'out', 9).slice(0, cols).map((m) => cellLook(0.45, m, 'out'));
    expect(out[0]).not.toBe('clear');
    expect(out[cols - 1]).toBe('clear');
    expect(swipeMoments(cols, 3, 'out', 9).every((m) => cellLook(1, m, 'out') === 'clear')).toBe(true);
  });

  it('a ragged edge, with the edge color along it, in 15 chunky steps', () => {
    const moments = swipeMoments(40, 20, 'in', 3);
    const column = (c: number) => moments.filter((_, i) => i % 40 === c);
    // The jitter: one column's cells don't all switch at once.
    expect(new Set(column(20)).size).toBeGreaterThan(1);
    expect(moments.some((m) => cellLook(m + 0.01, m, 'in') === 'edge')).toBe(true);
    expect(swipeProgress(SWIPE_MS / 2 + 1)).toBe(7 / 15);
    expect(swipeProgress(SWIPE_MS)).toBe(1);
  });

  it('plays before the game shows, and again (right to left) before the page comes back', async () => {
    restoreMedia();
    restoreMedia = stubMatchMedia();
    let queue: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      queue.push(cb);
      return queue.length;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
    const runFrames = (from: number, count: number) => {
      for (let frame = 0; frame < count; frame += 1) {
        const run = queue;
        queue = [];
        act(() => run.forEach((cb) => cb(from + frame * 100)));
      }
    };
    renderAt('/');
    const user = userEvent.setup();
    await screen.findByRole('heading', { level: 1 });
    await user.click(within(nav()).getByRole('button', { name: 'Bit Blaster' }));
    const cabinet = document.querySelector('.gallery-stage')!;
    expect(cabinet).toHaveAttribute('data-phase', 'in');
    expect(cabinet.querySelector('canvas.gallery-stage__swipe')).not.toBeNull();
    expect(stage()).toBeNull();
    runFrames(0, 10);
    const board = await screen.findByRole('application', { name: 'Bit Blaster board' });
    expect(cabinet).toHaveAttribute('data-phase', 'shown');
    await user.click(within(stage()!).getByRole('button', { name: 'Back to page' }));
    expect(document.querySelector('.gallery-stage')).toHaveAttribute('data-phase', 'out');
    expect(board).not.toBeInTheDocument();
    runFrames(10_000, 10);
    expect(document.querySelector('.gallery-stage')).toBeNull();
  });
});
