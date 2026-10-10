import type { SnakeState } from './engine';

/**
 * The one line the live region says: only a pause and the end, never each piece of food (the score badge shows
 * that), so a screen reader isn't talking over the game.
 */
export function snakeMessage(state: SnakeState, newBest: boolean): string {
  if (state.status === 'paused') return 'Paused. Press Space to go on.';
  if (state.status !== 'over') return '';
  const full = state.food === null ? ' The board is full!' : '';
  return `Game over, score ${state.score}${newBest ? ', a new best' : ''}.${full} Press Space to play again.`;
}
