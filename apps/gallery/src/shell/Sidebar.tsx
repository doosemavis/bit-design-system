import { NavLink } from 'react-router-dom';
import { Text } from '@bit-ds/react';
import { MANIFESTS, routeFor } from '../manifests';

export type NavGroup = 'Foundations' | 'Components' | 'Brand';
export interface NavItem {
  group: NavGroup;
  label: string;
  to: string;
}

/** Foundations, then one entry per Components manifest, then Brand. */
export const NAV: readonly NavItem[] = [
  { group: 'Foundations', label: 'Tokens', to: '/tokens' },
  ...MANIFESTS.filter((m) => m.group === 'Components').map((m) => ({ group: 'Components' as const, label: m.name, to: routeFor(m) })),
  { group: 'Brand', label: 'Logo', to: '/brand/logo' },
];

const GROUPS: readonly NavGroup[] = ['Foundations', 'Components', 'Brand'];

interface SidebarProps {
  items: readonly NavItem[];
  open: boolean;
  onNavigate: () => void;
}

export function Sidebar({ items, open, onNavigate }: SidebarProps) {
  return (
    <nav id="gallery-nav" className="gallery-sidebar" aria-label="Gallery" data-open={open ? '' : undefined}>
      {GROUPS.map((group) => {
        const links = items.filter((item) => item.group === group);
        if (links.length === 0) return null;
        return (
          <section key={group} className="gallery-sidebar__group">
            <Text as="h2" size="xs" className="gallery-sidebar__title">
              {group}
            </Text>
            <ul className="gallery-sidebar__list">
              {links.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} className="gallery-sidebar__link" onClick={onNavigate}>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </nav>
  );
}
