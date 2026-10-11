import { useOutletContext } from 'react-router-dom';
import type { GameId } from '../arcade/games';

/** What Shell hands the page in its Outlet: a way to open an Arcade game in the sidebar. */
export interface ShellOutletContext {
  play: (game: GameId) => void;
}

/** Opens an Arcade game in the sidebar (the phone sheet on a phone), as the sidebar's own Arcade items do; undefined outside Shell. */
export function usePlayGame(): ((game: GameId) => void) | undefined {
  return useOutletContext<ShellOutletContext | undefined>()?.play;
}
