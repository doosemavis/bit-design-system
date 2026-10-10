import { CAT_FROM_LEVEL } from './engine';
import type { CheeseState } from './engine';

const livesLeft = (lives: number) => `${lives} ${lives === 1 ? 'life' : 'lives'} left`;

/**
 * The one line the live region says, derived from the state so it changes only when something happens: a level
 * cleared, a life lost, a pause, the end. While the rat runs it is empty, so moving never makes noise.
 */
export function cheeseMessage(state: CheeseState, newBest: boolean): string {
  const { status, event } = state;
  if (status === 'over') {
    const why = event?.kind === 'timeout' ? 'Time is up.' : 'Caught by the cat.';
    return `${why} Game over, score ${state.score}${newBest ? ', a new best' : ''}. Press Space to play again.`;
  }
  if (status === 'paused') return 'Paused. Press Space to go on.';
  if (status !== 'ready' || !event) return '';
  if (event.kind === 'cleared') {
    const cat = state.level === CAT_FROM_LEVEL ? ' Watch out: a cat walks this maze.' : '';
    return `Level ${event.level} cleared, plus ${event.bonus}. Level ${state.level}: find the cheese.${cat}`;
  }
  const why = event.kind === 'caught' ? 'Caught by the cat!' : 'Time is up!';
  return `${why} ${livesLeft(state.lives)}. Back to the start.`;
}
