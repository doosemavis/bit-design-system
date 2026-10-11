import { useOutletContext } from 'react-router-dom';
import type { GameId } from '../arcade/games';

/** What Shell hands the page in its Outlet: a way to open an Arcade game. */
export interface ShellOutletContext {
  play: (game: GameId) => void;
}

/** Opens an Arcade game where it plays (the sidebar, the phone sheet, or the main area), as the sidebar's own Arcade items do; undefined outside Shell. */
export function usePlayGame(): ((game: GameId) => void) | undefined {
  return useOutletContext<ShellOutletContext | undefined>()?.play;
}
