import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { stubCanvas } from '../../test/canvas';
import BitBlasterGame from './BitBlasterGame';

// A game that starts a step from the end: the swarm's bottom row just over the landing line, so its first march step
// lands it and the frame clock plays the game out in a frame (a whole game frame by frame took over 30s on CI).
vi.mock('./engine', async (original) => {
  const engine = await original<typeof import('./engine')>();
  return {
    ...engine,
    createBlaster: (options: Parameters<typeof engine.createBlaster>[0]) => {
      const state = engine.createBlaster(options);
      return { ...state, swarm: { ...state.swarm, y: engine.groundOf(state.rows) - 10 - 4 * 14 - 8, wait: 1 } };
    },
  };
});

let restoreCanvas: () => void = () => {};
let queue: FrameRequestCallback[] = [];
beforeEach(() => {
  restoreCanvas = stubCanvas().restore;
  queue = [];
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    queue.push(cb);
    return queue.length;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
});
afterEach(() => {
  restoreCanvas();
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe('Bit Blaster, played', () => {
  it('runs on the frame clock: the swarm lands, the game says so, and Space starts again', () => {
    render(<BitBlasterGame onBack={() => {}} />);
    const board = screen.getByRole('application', { name: 'Bit Blaster board' });
    const live = () => screen.getAllByRole('status').at(-1)!;
    fireEvent.keyDown(board, { key: ' ' });
    for (let frame = 0; frame <= 600 && !/Game over/.test(live().textContent ?? ''); frame += 1) {
      const run = queue;
      queue = [];
      act(() => run.forEach((cb) => cb(frame * 17)));
    }
    expect(live()).toHaveTextContent(/^Game over, score 0\. Press Space to play again\.$/);
    expect(screen.getByRole('button', { name: 'Play again' })).toBeInTheDocument();
    fireEvent.keyDown(board, { key: ' ' });
    expect(screen.getByRole('button', { name: 'Restart' })).toBeInTheDocument();
    expect(live()).toHaveTextContent('');
  });
});
