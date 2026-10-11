import type { BlasterState } from './engine';

/**
 * The one line the live region says: a pause, a hit, a new wave and the end, never each alien (the score badge shows
 * that), so a screen reader isn't talking over the game.
 */
export function blasterMessage(state: BlasterState, newBest: boolean): string {
  if (state.status === 'paused') return 'Paused. Press Space to go on.';
  if (state.status === 'over') return `Game over, score ${state.score}${newBest ? ', a new best' : ''}. Press Space to play again.`;
  if (state.dying > 0) return state.lives > 0 ? `Hit! ${state.lives} ${state.lives === 1 ? 'life' : 'lives'} left.` : 'Hit!';
  if (state.banner > 0) return `Wave ${state.wave}.`;
  return '';
}
