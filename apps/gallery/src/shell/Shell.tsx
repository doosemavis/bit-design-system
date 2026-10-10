import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header, GitHubLink } from './Header';
import { OldVersionBanner } from './OldVersionBanner';
import { PageFooter } from './PageFooter';
import { Sidebar, NAV } from './Sidebar';
import type { NavItem } from './Sidebar';
import { useFocusHeading } from './useFocusHeading';
import { VersionSelect } from './VersionSelect';
import { InPageLink } from '../ui/InPageLink';
import { SearchDialog } from '../search/SearchDialog';
import { SearchButton } from './Header';
import { NARROW_QUERY, useMediaQuery } from '../ui/useMediaQuery';

interface ShellProps {
  nav?: readonly NavItem[];
}

/** ⌘K on a Mac, Ctrl+K elsewhere (either works everywhere): open the search dialog from anywhere on the page. */
function useSearchShortcut(open: () => void): void {
  const latest = useRef(open);
  useEffect(() => {
    latest.current = open;
  });
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey || event.key.toLowerCase() !== 'k') return;
      event.preventDefault();
      latest.current();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);
}

/** Three regions: header, sidebar, main. The skip link is the first focusable element. */
export function Shell({ nav = NAV }: ShellProps) {
  const { pathname } = useLocation();
  const narrow = useMediaQuery(NARROW_QUERY);
  // The sheet stays open only on the page it was opened on, so any navigation closes it. Forget that page
  // as soon as we leave it, so Forward back onto it doesn't reopen a sheet that Back closed.
  const [openOn, setOpenOn] = useState<string | null>(null);
  if (openOn !== null && openOn !== pathname) setOpenOn(null);
  const menuOpen = openOn === pathname;
  const menuButton = useRef<HTMLButtonElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const openSearch = () => setSearchOpen(true);
  useFocusHeading();
  useSearchShortcut(openSearch);

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
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      <Sidebar
        items={nav}
        open={menuOpen}
        onNavigate={() => setOpenOn(null)}
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
        <Outlet />
        <PageFooter items={nav} />
      </main>
    </div>
  );
}
