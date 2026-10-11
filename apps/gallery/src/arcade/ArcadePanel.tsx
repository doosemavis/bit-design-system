import { Component, lazy, Suspense } from 'react';
import type { ComponentType, KeyboardEvent, LazyExoticComponent, ReactNode } from 'react';
import { Button, Icon, iconArrowBack, Spinner, Stack, Text } from '@bit-ds/react';
import { gameLabel } from './games';
import type { SidebarGameId } from './games';

/** Each game is its own chunk, loaded the first time it is opened: the docs never pay for the Arcade. */
const GAME_COMPONENTS: Readonly<Record<SidebarGameId, LazyExoticComponent<ComponentType>>> = {
  snake: lazy(() => import('./snake/SnakeGame')),
  'cheese-run': lazy(() => import('./cheese/CheeseRunGame')),
};

/** A game whose chunk fails to load (offline, a deploy in between) says so instead of breaking the page. */
export class GameLoadBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) return <Text role="alert">The game didn’t load. Check your connection, go back, and try again.</Text>;
    return this.props.children;
  }
}

interface ArcadePanelProps {
  game: SidebarGameId;
  onBack: () => void;
}

/**
 * The sidebar while a game is open: a Back button above the game. Back, or Esc anywhere in the panel that the
 * game doesn't take for itself (it takes Esc only to pause a running game), returns to the menu. Unmounting the
 * game stops its clock: nothing keeps running after Back.
 */
export function ArcadePanel({ game, onBack }: ArcadePanelProps) {
  const Game = GAME_COMPONENTS[game];
  const label = gameLabel(game);
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Escape' || event.defaultPrevented) return;
    // Handled here, so the phone sheet's own Esc (close the sheet) doesn't also fire.
    event.preventDefault();
    event.stopPropagation();
    onBack();
  };
  return (
    <div className="gallery-arcade" onKeyDown={onKeyDown}>
      <Stack gap={16} className="gallery-arcade__stack">
        <Button variant="outline" color="neutral" size="sm" className="gallery-arcade__back" onClick={onBack}>
          <Icon icon={iconArrowBack} size="sm" />
          Back to menu
        </Button>
        <GameLoadBoundary key={game}>
          <Suspense fallback={<Spinner aria-label={`Loading ${label}`} />}>
            <Game />
          </Suspense>
        </GameLoadBoundary>
      </Stack>
    </div>
  );
}
