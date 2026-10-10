import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderAt } from '../test/renderRoute';
import { expectNoA11yViolations } from '../test/a11y';
import { stubCanvas } from '../test/canvas';
import { stubMatchMedia } from '../test/matchMedia';
import { NARROW_QUERY } from '../ui/useMediaQuery';

let restoreCanvas: () => void = () => {};
beforeEach(() => {
  restoreCanvas = stubCanvas().restore;
});
afterEach(() => {
  restoreCanvas();
  vi.restoreAllMocks();
  window.localStorage.clear();
});

const nav = () => screen.queryByRole('navigation', { name: 'Gallery' });
const item = (name: string) => within(nav()!).getByRole('button', { name });
const pauseButton = (region: HTMLElement) => within(region).getByRole('button', { name: /^(Pause|Resume)$/ });
const liveLine = (region: HTMLElement) => within(region).getAllByRole('status').at(-1)!;

/** Opens a game from the sidebar and waits for its board (each game is its own lazy chunk). */
async function openGame(name: 'Snake' | 'Cheese Run') {
  const user = userEvent.setup();
  await user.click(await screen.findByRole('button', { name }));
  const board = await screen.findByRole('application', { name: `${name} board` });
  const region = screen.getByRole('region', { name: `Arcade: ${name}` });
  return { user, board, region };
}

describe('the Arcade in the sidebar', () => {
  it('is the last section, after Brand: Snake and Cheese Run, as buttons, and not in the pages’ previous and next', async () => {
    renderAt('/brand/logo');
    await screen.findByRole('heading', { level: 1 });
    const titles = [...document.querySelectorAll('.gallery-sidebar__title')].map((t) => t.textContent);
    expect(titles.slice(-2)).toEqual(['Brand', 'Arcade']);
    const list = within(nav()!).getByRole('list', { name: 'Arcade' });
    expect(within(list).getAllByRole('button').map((b) => b.textContent)).toEqual(['Snake', 'Cheese Run']);
    expect(within(list).queryAllByRole('link')).toEqual([]);
    // Logo is still the last page: its pager has a Previous and no Next.
    expect(screen.getByRole('link', { name: /^Previous:/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^Next:/ })).toBeNull();
  });

  it('choosing a game turns the sidebar into it: a named region, the menu gone, focus on the described board', async () => {
    const { router } = renderAt('/tokens');
    await screen.findByRole('heading', { level: 1, name: 'Tokens' });
    const { board, region } = await openGame('Snake');
    expect(nav()).toBeNull();
    expect(region).toHaveAttribute('id', 'gallery-nav');
    expect(board).toHaveFocus();
    expect(board).toHaveAccessibleDescription(/Arrow keys or WASD turn the snake\. Space or P pauses\. Esc pauses, then Esc again goes back\./);
    // The page beside it is untouched, and the route didn't change.
    expect(screen.getByRole('heading', { level: 1, name: 'Tokens' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/tokens');
  });

  it('Back returns to the menu and puts focus back on the game’s item', async () => {
    renderAt('/');
    const { user, region } = await openGame('Cheese Run');
    await user.click(within(region).getByRole('button', { name: 'Back to menu' }));
    expect(nav()).not.toBeNull();
    await waitFor(() => expect(item('Cheese Run')).toHaveFocus());
  });

  it('Esc goes back from a game that isn’t running; on a running game it pauses first (and says so), then goes back', async () => {
    renderAt('/');
    let { user } = await openGame('Snake');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(item('Snake')).toHaveFocus());

    ({ user } = await openGame('Snake'));
    const region = screen.getByRole('region', { name: 'Arcade: Snake' });
    await user.keyboard('{ArrowUp}');
    expect(pauseButton(region)).toBeEnabled();
    await user.keyboard('{Escape}');
    expect(screen.getByRole('region', { name: 'Arcade: Snake' })).toBeInTheDocument();
    expect(pauseButton(region)).toHaveTextContent('Resume');
    expect(liveLine(region)).toHaveTextContent('Paused. Press Space to go on.');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(item('Snake')).toHaveFocus());
  });

  it('takes keys only while the board has focus, and lets ⌘K through', async () => {
    renderAt('/');
    const { user, board, region } = await openGame('Snake');
    const main = document.getElementById('main')!;
    act(() => main.focus());
    expect(fireEvent.keyDown(main, { key: 'ArrowUp' })).toBe(true);
    expect(pauseButton(region)).toBeDisabled();
    act(() => board.focus());
    expect(fireEvent.keyDown(board, { key: 'ArrowUp' })).toBe(false);
    expect(pauseButton(region)).toBeEnabled();
    await user.keyboard('{Meta>}k{/Meta}');
    expect(await screen.findByRole('dialog', { name: 'Search' })).toBeInTheDocument();
  });

  it('pauses a running game when focus leaves the panel, or the tab is hidden', async () => {
    renderAt('/');
    const { user, board, region } = await openGame('Cheese Run');
    await user.keyboard('{ArrowRight}{ArrowDown}');
    expect(pauseButton(region)).toHaveTextContent('Pause');
    act(() => document.getElementById('main')!.focus());
    expect(pauseButton(region)).toHaveTextContent('Resume');
    expect(liveLine(region)).toHaveTextContent('Paused');

    act(() => board.focus());
    await user.keyboard(' ');
    expect(pauseButton(region)).toHaveTextContent('Pause');
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(pauseButton(region)).toHaveTextContent('Resume');
    hidden.mockRestore();
  });

  it('a button hands the keys back to the board', async () => {
    renderAt('/');
    const { user, board, region } = await openGame('Snake');
    await user.click(within(region).getByRole('button', { name: 'Restart' }));
    expect(board).toHaveFocus();
  });

  it.each(['Snake', 'Cheese Run'] as const)('%s: the open panel has no axe violations', async (name) => {
    renderAt('/');
    const { region } = await openGame(name);
    await expectNoA11yViolations(region);
  });

  it('Cheese Run shows its level, lives, time, score and best', async () => {
    window.localStorage.setItem('bit-gallery-arcade-cheese-run-best', '420');
    renderAt('/');
    const { region } = await openGame('Cheese Run');
    const hud = [...region.querySelectorAll('.bit-badge')].map((b) => b.textContent);
    expect(hud).toEqual(['Level 1', 'Lives 3', 'Time 30', 'Score 0', 'Best 420']);
  });
});

describe('Snake, played', () => {
  it('runs on the frame clock: into the wall ends the game, says so, and Space starts again', async () => {
    let queue: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      queue.push(cb);
      return queue.length;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
    renderAt('/');
    const { user, region } = await openGame('Snake');
    await user.keyboard('{ArrowDown}');
    // The snake starts on the middle row of 15; heading down, the ninth step leaves the board.
    for (let frame = 0; frame <= 10; frame += 1) {
      const run = queue;
      queue = [];
      act(() => run.forEach((cb) => cb(frame * 200)));
    }
    expect(liveLine(region)).toHaveTextContent('Game over, score 0. Press Space to play again.');
    expect(within(region).getByRole('button', { name: 'Play again' })).toBeInTheDocument();
    await user.keyboard(' ');
    expect(liveLine(region)).toHaveTextContent('');
    expect(within(region).getByRole('button', { name: 'Restart' })).toBeInTheDocument();
  });
});

describe('the Arcade in search', () => {
  it('lists the games under Arcade, and Enter opens one in the sidebar', async () => {
    renderAt('/');
    const user = userEvent.setup();
    await screen.findByRole('heading', { level: 1 });
    await user.keyboard('{Control>}k{/Control}');
    const box = await screen.findByRole('combobox', { name: 'Search pages, components and props' });
    await user.type(box, 'cheese');
    expect(screen.getAllByRole('option')[0]).toHaveAccessibleName('Cheese Run, Arcade');
    await user.keyboard('{Enter}');
    expect(await screen.findByRole('application', { name: 'Cheese Run board' }, { timeout: 2000 })).toBeInTheDocument();
  });
});

describe('the Arcade on a phone', () => {
  let restore: () => void = () => {};
  beforeEach(() => {
    restore = stubMatchMedia(NARROW_QUERY);
  });
  afterEach(() => restore());

  it('runs in the Menu sheet with on-screen arrows that keep focus on the board; Esc goes back without closing the sheet', async () => {
    renderAt('/');
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Menu' }));
    const { board, region } = await openGame('Cheese Run');
    expect(region).toHaveAttribute('data-open');
    const arrows = within(within(region).getByRole('group', { name: 'Arrows' })).getAllByRole('button');
    expect(arrows.map((a) => a.getAttribute('aria-label'))).toEqual(['Up', 'Left', 'Down', 'Right']);
    expect(arrows.every((a) => a.classList.contains('bit-lg'))).toBe(true);
    await user.click(within(region).getByRole('button', { name: 'Right' }));
    expect(pauseButton(region)).toBeEnabled();
    expect(board).toHaveFocus();
    await user.keyboard(' ');
    await user.keyboard('{Escape}');
    expect(nav()).toHaveAttribute('data-open');
    await waitFor(() => expect(item('Cheese Run')).toHaveFocus());
  });

  it('an arrow focused by keyboard works with Enter', async () => {
    renderAt('/');
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Menu' }));
    const { region } = await openGame('Snake');
    act(() => within(region).getByRole('button', { name: 'Up' }).focus());
    await user.keyboard('{Enter}');
    expect(pauseButton(region)).toBeEnabled();
  });
});
