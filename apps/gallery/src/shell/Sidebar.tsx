import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { matchPath, NavLink, useLocation } from 'react-router-dom';
import { Button, Link, Text } from '@bit-ds/react';
import { routeFor } from '../manifests';
import { ArcadePanel } from '../arcade/ArcadePanel';
import { GAMES, gameLabel } from '../arcade/games';
import type { GameId } from '../arcade/games';
import { COMPONENT_GROUPS, groupManifests } from './navGroups';
import type { ComponentGroupLabel } from './navGroups';

type NavGroup = 'Start here' | 'Foundations' | ComponentGroupLabel | 'Brand';
export interface NavItem {
  group: NavGroup;
  label: string;
  to: string;
}

const GROUPS: readonly NavGroup[] = ['Start here', 'Foundations', ...COMPONENT_GROUPS.map((group) => group.label), 'Brand'];

/**
 * Every page, in sidebar order: Start here in its written order (owner ruling 2026-10-08), every other
 * section alphabetical: Foundations, the components by task (navGroups: Actions first, so Button leads), alphabetical inside each
 * group, then Brand. The pages' previous and next links walk this same order.
 */
export const NAV: readonly NavItem[] = [
  { group: 'Start here', label: 'Overview', to: '/' },
  { group: 'Start here', label: 'Getting started', to: '/getting-started' },
  { group: 'Start here', label: 'Versions', to: '/versions' },
  { group: 'Start here', label: 'Accessibility', to: '/accessibility' },
  { group: 'Start here', label: 'Release notes', to: '/release-notes' },
  { group: 'Foundations', label: 'Spacing', to: '/spacing' },
  { group: 'Foundations', label: 'Tokens', to: '/tokens' },
  { group: 'Foundations', label: 'Typography', to: '/typography' },
  ...COMPONENT_GROUPS.flatMap((group) => groupManifests(group).map((m) => ({ group: group.label, label: m.name, to: routeFor(m) }))),
  { group: 'Brand', label: 'Logo', to: '/brand/logo' },
];

interface SidebarProps {
  items: readonly NavItem[];
  open: boolean;
  onNavigate: () => void;
  /** Shown before the groups when the header is too narrow: the Search button. */
  header?: ReactNode;
  /** Shown after the groups when the header is too narrow: the GitHub button and the version picker. */
  footer?: ReactNode;
  /** The open game, which takes the sidebar's place; null shows the menu. */
  game?: GameId | null;
  /** Opens a game. Without it the Arcade section isn't listed. */
  onPlay?: (game: GameId) => void;
  /** Leaves the game for the menu. */
  onBack?: () => void;
}

/** The group of the item NavLink would mark current for `pathname` (matchPath, as NavLink does), or null. */
function currentGroup(items: readonly NavItem[], pathname: string): NavGroup | null {
  const match = items.find((item) => matchPath({ path: item.to, end: item.to === '/' }, pathname));
  return match?.group ?? null;
}

/** The id of a group's title, which labels its list of links. */
const titleId = (group: string) => `gallery-nav-${group.toLowerCase().replace(/\s+/g, '-')}`;

/** A group's title. A label, not a heading: it names the list below, so a screen reader says "Foundations, list". */
function GroupTitle({ group }: { group: string }) {
  return (
    <Text id={titleId(group)} size={14} color="neutral" className="gallery-sidebar__title">
      {group}
    </Text>
  );
}

/**
 * The last section: games, not pages. Each item is a Button (it opens the game in the sidebar; it goes nowhere),
 * kept out of NAV so the pages' previous and next links and the routes never see it.
 */
function ArcadeGroup({ onPlay }: { onPlay: (game: GameId) => void }) {
  return (
    <section className="gallery-sidebar__group">
      <GroupTitle group="Arcade" />
      <ul className="gallery-sidebar__list" aria-labelledby={titleId('Arcade')}>
        {GAMES.map((game) => (
          <li key={game.id}>
            <Button variant="ghost" color="neutral" size="sm" className="gallery-sidebar__game" data-game={game.id} onClick={() => onPlay(game.id)}>
              {game.label}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** After Back, focus returns to the Arcade item of the game that was open, once the menu is back. */
function useFocusGameItem(nav: HTMLElement | null, game: GameId | null): (left: GameId) => void {
  const left = useRef<GameId | null>(null);
  useEffect(() => {
    if (game !== null || left.current === null || !nav) return;
    // On the first pass `nav` can still be the game's region, now gone: wait for the menu's own element.
    const item = nav.querySelector<HTMLElement>(`[data-game="${left.current}"]`);
    if (!item) return;
    item.focus();
    left.current = null;
  }, [nav, game]);
  return (id) => {
    left.current = id;
  };
}

/**
 * The sidebar scrolls its own list (it stays put beside the page), so a page far down the list (Tooltip, Switch)
 * would have its link out of sight. On each page change, and when the phone sheet opens, bring the current link
 * into the list's view if it isn't.
 */
function useCurrentLinkInView(nav: HTMLElement | null, pathname: string, open: boolean): void {
  useEffect(() => {
    const link = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!nav || !link || nav.clientHeight === 0) return;
    const top = link.offsetTop;
    const bottom = top + link.offsetHeight;
    if (top >= nav.scrollTop && bottom <= nav.scrollTop + nav.clientHeight) return;
    nav.scrollTop = top - (nav.clientHeight - link.offsetHeight) / 2;
  }, [nav, pathname, open]);
}

export function Sidebar({ items, open, onNavigate, header, footer, game = null, onPlay, onBack }: SidebarProps) {
  const { pathname } = useLocation();
  const current = currentGroup(items, pathname);
  const [nav, setNav] = useState<HTMLElement | null>(null);
  useCurrentLinkInView(nav, pathname, open);
  const leaving = useFocusGameItem(nav, game);
  // Derived during render: the counter changes only when the current group does, so the title's key
  // (and its CSS animation) restarts on a section change and not on a page change inside one section.
  const [seen, setSeen] = useState({ group: current, count: 0 });
  if (seen.group !== current) setSeen({ group: current, count: seen.count + 1 });
  if (game !== null) {
    // The game isn't navigation, so while it is open the sidebar is a named region; it keeps the id the Menu
    // button controls, so the phone sheet opens and closes the game the same way.
    return (
      <section
        ref={setNav}
        id="gallery-nav"
        className="gallery-sidebar gallery-sidebar--arcade"
        aria-label={`Arcade: ${gameLabel(game)}`}
        data-open={open ? '' : undefined}
      >
        <ArcadePanel
          game={game}
          onBack={() => {
            leaving(game);
            onBack?.();
          }}
        />
      </section>
    );
  }
  return (
    <nav ref={setNav} id="gallery-nav" className="gallery-sidebar" aria-label="Gallery" data-open={open ? '' : undefined}>
      {header ? <div className="gallery-sidebar__header">{header}</div> : null}
      {GROUPS.map((group) => {
        const links = items.filter((item) => item.group === group);
        if (links.length === 0) return null;
        return (
          <section key={group} className="gallery-sidebar__group" data-current={group === current ? '' : undefined}>
            <GroupTitle key={group === current ? `${group}-${seen.count}` : group} group={group} />
            <ul className="gallery-sidebar__list" aria-labelledby={titleId(group)}>
              {links.map((item) => (
                <li key={item.to}>
                  <Link asChild color="neutral" className="gallery-sidebar__link">
                    <NavLink to={item.to} end={item.to === '/'} onClick={onNavigate}>
                      {item.label}
                    </NavLink>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      {onPlay ? <ArcadeGroup onPlay={onPlay} /> : null}
      {footer ? <div className="gallery-sidebar__footer">{footer}</div> : null}
    </nav>
  );
}
