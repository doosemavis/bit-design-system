import { BitLogo, Button } from '@bit/react';
import { Link } from 'react-router-dom';
import { ThemeSelect } from './ThemeSelect';

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
        <ThemeSelect />
        <Button asChild variant="outline" size="sm" color="neutral">
          <a href={REPO_URL} target="_blank" rel="noreferrer">
            GitHub
          </a>
        </Button>
      </div>
    </header>
  );
}
