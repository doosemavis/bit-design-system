import type { GameId } from './games';

/** Where a game's best score is kept: one key per game, holding a whole number as text. */
export const bestKey = (game: GameId): string => `bit-gallery-arcade-${game}-best`;

/**
 * The saved best score, or 0. Storage can throw (private windows, blocked site data) or hold junk, and a game
 * must start either way, so any trouble reads as no best yet.
 */
export function readBest(game: GameId): number {
  try {
    const saved = Number.parseInt(window.localStorage.getItem(bestKey(game)) ?? '', 10);
    return Number.isFinite(saved) && saved > 0 ? saved : 0;
  } catch {
    return 0;
  }
}

/** Saves `score` when it beats the stored best, and returns the best after the save. Never throws. */
export function saveBest(game: GameId, score: number): number {
  const best = readBest(game);
  if (score <= best) return best;
  try {
    window.localStorage.setItem(bestKey(game), String(Math.floor(score)));
  } catch {
    // Storage is full or blocked: the best still shows for this visit, it just isn't kept.
  }
  return score;
}
