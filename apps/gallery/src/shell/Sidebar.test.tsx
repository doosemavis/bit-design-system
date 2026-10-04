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
    expect(renderSidebar(NAV)).toEqual(['Start here', 'Foundations', 'Components', 'Forms', 'Brand']);
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

  it('Start here comes first, with Overview, Getting started, Versions and Release notes in order', () => {
    renderSidebar(NAV);
    expect(screen.getAllByRole('heading', { level: 2 })[0]).toHaveTextContent('Start here');
    expect(linksUnder('Start here')).toEqual(['Overview', 'Getting started', 'Versions', 'Release notes']);
    expect(screen.getByRole('link', { name: 'Overview' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Getting started' })).toHaveAttribute('href', '/getting-started');
    expect(screen.getByRole('link', { name: 'Versions' })).toHaveAttribute('href', '/versions');
    expect(screen.getByRole('link', { name: 'Release notes' })).toHaveAttribute('href', '/release-notes');
  });

  it('Overview is current on / only, not on every page', () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={['/']}>
        <Sidebar items={NAV} open={false} onNavigate={() => {}} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Overview' })).toHaveAttribute('aria-current', 'page');
    unmount();
    render(
      <MemoryRouter initialEntries={['/tokens']}>
        <Sidebar items={NAV} open={false} onNavigate={() => {}} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Overview' })).not.toHaveAttribute('aria-current');
  });

  it('hides a group with no items', () => {
    expect(renderSidebar(NAV.filter((item) => item.group !== 'Forms'))).toEqual(['Start here', 'Foundations', 'Components', 'Brand']);
  });
});
