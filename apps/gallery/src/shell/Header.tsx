import { BitLogo, Button, ModeToggle } from '@bit-ds/react';
import { Link } from 'react-router-dom';
import { ThemeSelect } from './ThemeSelect';
import { THEMES } from './themes';

export const REPO_URL = 'https://github.com/doosemavis/bit-design-system';

interface HeaderProps {
  menuOpen: boolean;
  onToggleMenu: () => void;
}

export function Header({ menuOpen, onToggleMenu }: HeaderProps) {
  return (
    <header className="gallery-header">
      <Button
        className="gallery-header__menu"
        variant="ghost"
        size="sm"
        aria-expanded={menuOpen}
        aria-controls="gallery-nav"
        onClick={onToggleMenu}
      >
        Menu
      </Button>
      <Link to="/" className="gallery-header__brand" aria-label="bit gallery home">
        <BitLogo size="sm" />
      </Link>
      <span className="gallery-header__name">gallery</span>
      <div className="gallery-header__tools">
        {/* The theme dropdown appears once a second theme exists (plan §H.5); light/dark is a mode. */}
        {THEMES.length > 1 ? <ThemeSelect /> : null}
        <ModeToggle size="sm" />
        <Button asChild variant="outline" size="sm" color="neutral">
          <a href={REPO_URL} target="_blank" rel="noreferrer">
            GitHub
          </a>
        </Button>
      </div>
    </header>
  );
}
