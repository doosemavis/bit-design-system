import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar, NAV } from './Sidebar';
import type { NavItem } from './Sidebar';
import { useFocusHeading } from './useFocusHeading';

interface ShellProps {
  nav?: readonly NavItem[];
}

/** Three regions: header, sidebar, main. The skip link is the first focusable element. */
export function Shell({ nav = NAV }: ShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  useFocusHeading();
  return (
    <div className="gallery-shell">
      <a className="gallery-skip" href="#main">
        Skip to content
      </a>
      <Header menuOpen={menuOpen} onToggleMenu={() => setMenuOpen((open) => !open)} />
      <Sidebar items={nav} open={menuOpen} onNavigate={() => setMenuOpen(false)} />
      <main id="main" className="gallery-main">
        <Outlet />
      </main>
    </div>
  );
}
