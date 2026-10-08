import { useState } from 'react';
import type { ReactNode } from 'react';
import { matchPath, NavLink, useLocation } from 'react-router-dom';
import { Link, Text } from '@bit-ds/react';
import { MANIFESTS, routeFor } from '../manifests';
import type { Manifest, ManifestGroup } from '../manifests';

type NavGroup = 'Start here' | 'Foundations' | 'Components' | 'Forms' | 'Brand';
export interface NavItem {
  group: NavGroup;
  label: string;
  to: string;
}

type PageGroup = Exclude<ManifestGroup, 'brand'>;
const GROUP_LABELS: Record<PageGroup, NavGroup> = { components: 'Components', forms: 'Forms' };

const GROUPS: readonly NavGroup[] = ['Start here', 'Foundations', 'Components', 'Forms', 'Brand'];

/** Sections listed in their written order, not alphabetically (owner ruling 2026-10-08). */
const UNSORTED_GROUPS: ReadonlySet<NavGroup> = new Set(['Start here']);

const UNSORTED_NAV: readonly NavItem[] = [
  { group: 'Start here', label: 'Overview', to: '/' },
  { group: 'Start here', label: 'Getting started', to: '/getting-started' },
  { group: 'Start here', label: 'Versions', to: '/versions' },
  { group: 'Start here', label: 'Release notes', to: '/release-notes' },
  { group: 'Foundations', label: 'Tokens', to: '/tokens' },
  { group: 'Foundations', label: 'Typography', to: '/typography' },
  { group: 'Foundations', label: 'Spacing', to: '/spacing' },
  ...MANIFESTS.filter((m): m is Manifest & { group: PageGroup } => m.group !== 'brand').map((m) => ({
    group: GROUP_LABELS[m.group],
    label: m.name,
    to: routeFor(m),
  })),
  { group: 'Brand', label: 'Logo', to: '/brand/logo' },
];

const byLabel = (a: NavItem, b: NavItem) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' });

/** Items in the order GROUPS lists their sections (Start here, Foundations, Components, Forms, Brand), alphabetical by label inside each section except Start here. Start here is listed in written order (owner ruling 2026-10-08). MANIFESTS keeps its own order. */
export const NAV: readonly NavItem[] = GROUPS.flatMap((group) => {
  const items = UNSORTED_NAV.filter((item) => item.group === group);
  return UNSORTED_GROUPS.has(group) ? items : [...items].sort(byLabel);
});

interface SidebarProps {
  items: readonly NavItem[];
  open: boolean;
  onNavigate: () => void;
  /** Shown after the groups when the header is too narrow: the GitHub button and the version picker. */
  footer?: ReactNode;
}

/** The group of the item NavLink would mark current for `pathname` (matchPath, as NavLink does), or null. */
function currentGroup(items: readonly NavItem[], pathname: string): NavGroup | null {
  const match = items.find((item) => matchPath({ path: item.to, end: item.to === '/' }, pathname));
  return match?.group ?? null;
}

export function Sidebar({ items, open, onNavigate, footer }: SidebarProps) {
  const current = currentGroup(items, useLocation().pathname);
  // Derived during render: the counter changes only when the current group does, so the title's key
  // (and its CSS animation) restarts on a section change and not on a page change inside one section.
  const [seen, setSeen] = useState({ group: current, count: 0 });
  if (seen.group !== current) setSeen({ group: current, count: seen.count + 1 });
  return (
    <nav id="gallery-nav" className="gallery-sidebar" aria-label="Gallery" data-open={open ? '' : undefined}>
      {GROUPS.map((group) => {
        const links = items.filter((item) => item.group === group);
        if (links.length === 0) return null;
        return (
          <section key={group} className="gallery-sidebar__group" data-current={group === current ? '' : undefined}>
            <Text
              key={group === current ? `${group}-${seen.count}` : group}
              as="h2"
              size={13}
              color="neutral"
              className="gallery-sidebar__title"
            >
              {group}
            </Text>
            <ul className="gallery-sidebar__list">
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
      {footer ? <div className="gallery-sidebar__footer">{footer}</div> : null}
    </nav>
  );
}
