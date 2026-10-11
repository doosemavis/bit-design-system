import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header, GitHubLink } from './Header';
import { OldVersionBanner } from './OldVersionBanner';
import { Sidebar, NAV } from './Sidebar';
import type { NavItem } from './Sidebar';
import { useFocusHeading } from './useFocusHeading';
import { useShortcuts } from './useShortcuts';
import { VersionSelect } from './VersionSelect';
import { InPageLink } from '../ui/InPageLink';
import { SearchDialog } from '../search/SearchDialog';
import { SearchButton } from './Header';
import { NARROW_QUERY, useMediaQuery } from '../ui/useMediaQuery';
import type { GameId } from '../arcade/games';
import type { ShellOutletContext } from './usePlayGame';

interface ShellProps {
  nav?: readonly NavItem[];
}

/** Three regions: header, sidebar, main. The skip link is the first focusable element. */
export function Shell({ nav = NAV }: ShellProps) {
  const { pathname, search, hash, key } = useLocation();
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
  // The open Arcade game, if any. It lives in the sidebar, not in the route, so pages and prev/next never see it.
  const [game, setGame] = useState<GameId | null>(null);
  const play = (id: GameId) => {
    setGame(id);
    // On a phone the game runs in the sheet, so opening one (from search, say) opens the sheet.
    if (narrow) setOpenOn(pathname);
  };
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
      <InPageLink targetId="main" color="neutral" className="gallery-skip">
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
      <main id="main" className="gallery-main" tabIndex={-1}>
        <OldVersionBanner />
        {/* Each page brings its own previous and next (see router.tsx), so they arrive with it, never before. */}
        <Outlet context={{ play, nav } satisfies ShellOutletContext} />
      </main>
    </div>
  );
}
