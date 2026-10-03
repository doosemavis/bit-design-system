import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { NAV, Sidebar } from './Sidebar';
import type { NavItem } from './Sidebar';

function renderSidebar(items: readonly NavItem[]) {
  render(
    <MemoryRouter>
      <Sidebar items={items} open={false} onNavigate={() => {}} />
    </MemoryRouter>,
  );
  return screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
}

/** The link names listed under one sidebar heading. */
function linksUnder(heading: string): string[] {
  const section = screen.getByRole('heading', { level: 2, name: heading }).closest('section')!;
  return within(section)
    .getAllByRole('link')
    .map((link) => link.textContent ?? '');
}

describe('Sidebar', () => {
  it('lists Foundations, Components, Forms and Brand, with Forms between Components and Brand', () => {
    expect(renderSidebar(NAV)).toEqual(['Foundations', 'Components', 'Forms', 'Brand']);
    expect(screen.getByRole('link', { name: 'Button' })).toHaveAttribute('href', '/components/button');
  });

  it('Forms holds the form controls, routed like any component', () => {
    renderSidebar(NAV);
    expect(linksUnder('Forms')).toEqual(['Field', 'Input', 'Select']);
    expect(screen.getByRole('link', { name: 'Input' })).toHaveAttribute('href', '/components/input');
  });

  it('hides a group with no items', () => {
    expect(renderSidebar(NAV.filter((item) => item.group !== 'Forms'))).toEqual(['Foundations', 'Components', 'Brand']);
  });
});
