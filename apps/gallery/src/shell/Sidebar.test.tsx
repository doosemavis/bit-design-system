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
  it('every nav link is a bit Link, and the current page is marked', () => {
    render(
      <MemoryRouter initialEntries={['/tokens']}>
        <Sidebar items={NAV} open={false} onNavigate={() => {}} />
      </MemoryRouter>,
    );
    for (const link of screen.getAllByRole('link')) expect(link).toHaveClass('bit-link');
    expect(screen.getByRole('link', { name: 'Tokens' })).toHaveAttribute('aria-current', 'page');
  });

  it('group titles are Text in its neutral colour, so the muted shade comes from bit', () => {
    renderSidebar(NAV);
    expect(screen.getByRole('heading', { level: 2, name: 'Foundations' })).toHaveClass('bit-text', 'bit-neutral');
  });

  it('lists Foundations, Components, Forms and Brand, with Forms between Components and Brand', () => {
    expect(renderSidebar(NAV)).toEqual(['Foundations', 'Components', 'Forms', 'Brand']);
    expect(screen.getByRole('link', { name: 'Button' })).toHaveAttribute('href', '/components/button');
  });

  it('Forms holds the form controls, routed like any component', () => {
    renderSidebar(NAV);
    expect(linksUnder('Forms')).toEqual(['Field', 'Input', 'Select', 'Switch']);
    expect(screen.getByRole('link', { name: 'Input' })).toHaveAttribute('href', '/components/input');
  });

  it('Foundations lists the guide pages: Tokens, Typography, then Spacing', () => {
    renderSidebar(NAV);
    expect(linksUnder('Foundations')).toEqual(['Tokens', 'Typography', 'Spacing']);
    expect(screen.getByRole('link', { name: 'Typography' })).toHaveAttribute('href', '/typography');
    expect(screen.getByRole('link', { name: 'Spacing' })).toHaveAttribute('href', '/spacing');
  });

  it('hides a group with no items', () => {
    expect(renderSidebar(NAV.filter((item) => item.group !== 'Forms'))).toEqual(['Foundations', 'Components', 'Brand']);
  });
});
