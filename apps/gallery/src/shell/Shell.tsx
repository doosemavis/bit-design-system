import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Header, GitHubLink } from './Header';
import { OldVersionBanner } from './OldVersionBanner';
import { PageFooter } from './PageFooter';
import { Sidebar, NAV } from './Sidebar';
import type { NavItem } from './Sidebar';
import { useFocusHeading } from './useFocusHeading';
import { useShortcuts } from './useShortcuts';
import { VersionSelect } from './VersionSelect';
import { InPageLink } from '../ui/InPageLink';
import { SearchDialog } from '../search/SearchDialog';
import { SearchButton } from './Header';
import { NARROW_QUERY, useMediaQuery } from '../ui/useMediaQuery';
import { isStageGame } from '../arcade/games';
import type { GameId, SidebarGameId } from '../arcade/games';
import { ArcadeStage, STAGE_ID, stageGameOf, stageState } from '../arcade/ArcadeStage';
import type { ShellOutletContext } from './usePlayGame';

interface ShellProps {
  nav?: readonly NavItem[];
}

/**
 * When a stage game closes (its Back button, Esc, the browser's Back), focus goes back to what opened it, if it is
 * still on screen (the sidebar item, a Play button), or else to main. Not when a sidebar game took over: that game
 * takes focus itself.
 */
function useStageFocus(stageGame: string | null, opener: { current: HTMLElement | 'stay' | null }): void {
  const was = useRef(stageGame);
  useEffect(() => {
    const closed = was.current !== null && stageGame === null;
    was.current = stageGame;
    if (!closed) return;
    const target = opener.current;
    opener.current = null;
    if (target === 'stay') return;
    // checkVisibility: an item in the closed phone sheet is still in the page, just not shown.
    const shown = target?.isConnected && (typeof target.checkVisibility !== 'function' || target.checkVisibility());
    // Without scrolling: the page is back where it was left, and focus mustn't move it.
    if (target && shown) target.focus({ preventScroll: true });
    else document.getElementById('main')?.focus({ preventScroll: true });
  }, [stageGame, opener]);
}

/** Three regions: header, sidebar, main. The skip link is the first focusable element. */
export function Shell({ nav = NAV }: ShellProps) {
  const { pathname, search, hash, key, state } = useLocation();
  const navigate = useNavigate();
  const narrow = useMediaQuery(NARROW_QUERY);
  // The sheet stays open only on the page it was opened on, so any navigation closes it. Forget that page
  // as soon as we leave it, so Forward back onto it doesn't reopen a sheet that Back closed.
  const [openOn, setOpenOn] = useState<string | null>(null);
  if (openOn !== null && openOn !== pathname) setOpenOn(null);
  const menuOpen = openOn === pathname;
  const menuButton = useRef<HTMLButtonElement>(null);
  // Search too belongs to the history entry it was opened on, so Back, Forward or an edited address closes it
  // rather than leaving it over another page. The URL as well as the key: an entry the router didn't make (a
  // typed address, a plain link) has no state, so every such entry shares the key "default".
  const entry = `${key} ${pathname}${search}${hash}`;
  const [searchOn, setSearchOn] = useState<string | null>(null);
  if (searchOn !== null && searchOn !== entry) setSearchOn(null);
  const searchOpen = searchOn === entry;
  const setSearchOpen = (open: boolean) => setSearchOn(open ? entry : null);
  const openSearch = () => setSearchOpen(true);
  // The open sidebar game, if any. It lives in the sidebar, not in the route, so pages and prev/next never see it.
  const [game, setGame] = useState<SidebarGameId | null>(null);
  // The open stage game, if any: it lives in the history entry (see stageState), so Back closes it.
  const stageGame = stageGameOf(state);
  // What had focus when the stage game opened, to have it back after; 'stay' when a sidebar game takes over.
  const stageOpener = useRef<HTMLElement | 'stay' | null>(null);
  // Going back takes a moment (popstate, then a render), so a double-click mustn't go back twice, past the page.
  const closing = useRef(false);
  useEffect(() => {
    closing.current = false;
  }, [stageGame]);
  const closeStage = () => {
    if (closing.current) return;
    closing.current = true;
    // The stage's entry was pushed over the page's own, so Back is the way out; a first entry (a reload) is replaced.
    if (key !== 'default') navigate(-1);
    else navigate({ pathname, search, hash }, { replace: true, state: null });
  };
  const play = (id: GameId) => {
    if (isStageGame(id)) {
      setGame(null);
      setOpenOn(null);
      if (stageGame === id) return;
      // A click doesn't focus a button everywhere (Safari), so with nothing focused it's the game's sidebar item.
      const active = document.activeElement;
      stageOpener.current =
        active instanceof HTMLElement && active !== document.body ? active : document.querySelector<HTMLElement>(`[data-game="${id}"]`);
      navigate({ pathname, search, hash }, { state: stageState(id) });
      return;
    }
    if (stageGame) {
      stageOpener.current = 'stay';
      closeStage();
    }
    setGame(id);
    // On a phone the game runs in the sheet, so opening one (from search, say) opens the sheet.
    if (narrow) setOpenOn(pathname);
  };
  useStageFocus(stageGame, stageOpener);
  useFocusHeading();
  useShortcuts({ openSearch });

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpenOn(null);
      menuButton.current?.focus();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen]);

  return (
    <div className="gallery-shell">
      <InPageLink targetId={stageGame ? STAGE_ID : 'main'} color="neutral" className="gallery-skip">
        Skip to content
      </InPageLink>
      <Header
        ref={menuButton}
        narrow={narrow}
        menuOpen={menuOpen}
        onToggleMenu={() => setOpenOn((open) => (open === pathname ? null : pathname))}
        onSearch={openSearch}
      />
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} onPlay={play} />
      <Sidebar
        items={nav}
        open={menuOpen}
        onNavigate={() => setOpenOn(null)}
        game={game}
        onPlay={play}
        onBack={() => setGame(null)}
        header={narrow ? <SearchButton inSheet onClick={openSearch} /> : null}
        footer={
          narrow ? (
            <>
              <VersionSelect />
              <GitHubLink />
            </>
          ) : null
        }
      />
      {/* Under a stage game the page is out of reach (inert): only the game, the header and the sidebar are live. */}
      <main id="main" className="gallery-main" tabIndex={-1} inert={stageGame !== null}>
        <OldVersionBanner />
        <Outlet context={{ play } satisfies ShellOutletContext} />
        <PageFooter items={nav} />
      </main>
      <ArcadeStage game={stageGame} onBack={closeStage} />
    </div>
  );
}
