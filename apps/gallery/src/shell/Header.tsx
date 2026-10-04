import { forwardRef } from 'react';
import { BitLogo, Button, Link, ModeToggle } from '@bit-ds/react';
import { Link as RouterLink } from 'react-router-dom';
import { ThemeSelect } from './ThemeSelect';
import { THEMES } from './themes';

export const REPO_URL = 'https://github.com/doosemavis/bit-design-system';

/** The GitHub button. The header shows it on wide screens; at phone width it moves into the sidebar sheet. */
export function GitHubLink() {
  return (
    <Button asChild variant="outline" size="sm" color="neutral">
      <a href={REPO_URL} target="_blank" rel="noreferrer">
        GitHub
      </a>
    </Button>
  );
}

interface HeaderProps {
  menuOpen: boolean;
  onToggleMenu: () => void;
  /** At phone width the header is Menu, the logo and the mode toggle only. */
  narrow: boolean;
}

/** The ref goes on the Menu button, so closing the sheet with Escape can hand focus back to it. */
export const Header = forwardRef<HTMLButtonElement, HeaderProps>(function Header({ menuOpen, onToggleMenu, narrow }, ref) {
  return (
    <header className="gallery-header">
      <Button
        ref={ref}
        className="gallery-header__menu"
        variant="ghost"
        size="sm"
        aria-expanded={menuOpen}
        aria-controls="gallery-nav"
        onClick={onToggleMenu}
      >
        Menu
      </Button>
      <Link asChild color="neutral" className="gallery-header__brand">
        <RouterLink to="/" aria-label="bit Design System, gallery home">
          <BitLogo size="sm" />
        </RouterLink>
      </Link>
      <div className="gallery-header__tools">
        {/* The theme dropdown appears once a second theme exists (plan §H.5); light/dark is a mode. */}
        {THEMES.length > 1 ? <ThemeSelect /> : null}
        <ModeToggle size="sm" />
        {narrow ? null : <GitHubLink />}
      </div>
    </header>
  );
});
