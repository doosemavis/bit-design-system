import { forwardRef } from 'react';
import { BitLogo, Button, Icon, iconSearch, Link, ModeToggle, Text } from '@bit-ds/react';
import { Link as RouterLink } from 'react-router-dom';
import { ThemeSelect } from './ThemeSelect';
import { VersionSelect } from './VersionSelect';
import { THEMES } from './themes';

const REPO_URL = 'https://github.com/doosemavis/bit-design-system';

/** The GitHub button. The header shows it on wide screens; at phone width it moves into the sidebar sheet. */
export function GitHubLink() {
  return (
    <Button asChild variant="outline" size="sm" color="neutral">
      {/* eslint-disable-next-line no-restricted-syntax -- Button asChild renders this anchor as a bit Button */}
      <a href={REPO_URL} target="_blank" rel="noreferrer">
        GitHub
      </a>
    </Button>
  );
}

/** True on Apple platforms, where the search shortcut is ⌘K; elsewhere it is Ctrl K. */
export function isApplePlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
}

/**
 * Opens the search dialog. The header shows it on wide screens, with the shortcut beside the word (hidden from
 * screen readers, which hear aria-keyshortcuts instead); at phone width it sits at the top of the sidebar sheet.
 */
export function SearchButton({ onClick, inSheet = false }: { onClick: () => void; inSheet?: boolean }) {
  return (
    <Button
      variant="outline"
      color="neutral"
      size={inSheet ? 'md' : 'sm'}
      className="gallery-search-button"
      aria-keyshortcuts="Meta+K Control+K"
      onClick={onClick}
    >
      <Icon icon={iconSearch} size="sm" />
      Search
      {inSheet ? null : (
        <Text color="neutral" aria-hidden="true">
          {isApplePlatform() ? '⌘K' : 'Ctrl K'}
        </Text>
      )}
    </Button>
  );
}

interface HeaderProps {
  menuOpen: boolean;
  onToggleMenu: () => void;
  onSearch: () => void;
  /** At phone width the header is Menu, the logo and the mode toggle only. */
  narrow: boolean;
}

/**
 * The ref goes on the Menu button, so closing the sheet with Escape can hand focus back to it. While the sheet is
 * open the button says Close; focus stays on it, and the sheet's links come next in the Tab order.
 */
export const Header = forwardRef<HTMLButtonElement, HeaderProps>(function Header({ menuOpen, onToggleMenu, onSearch, narrow }, ref) {
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
        {menuOpen ? 'Close' : 'Menu'}
      </Button>
      <Link asChild color="neutral" className="gallery-header__brand">
        <RouterLink to="/" aria-label="bit Design System, gallery home">
          <BitLogo size="sm" />
        </RouterLink>
      </Link>
      <div className="gallery-header__tools">
        {/* The theme dropdown appears once a second theme exists (plan §H.5); light/dark is a mode. */}
        {narrow ? null : <SearchButton onClick={onSearch} />}
        {THEMES.length > 1 ? <ThemeSelect /> : null}
        {narrow ? null : <VersionSelect />}
        <ModeToggle size="sm" />
        {narrow ? null : <GitHubLink />}
      </div>
    </header>
  );
});
