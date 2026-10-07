import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { act } from 'react';
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

  it('Foundations lists the guide pages: Spacing, Tokens, then Typography', () => {
    renderSidebar(NAV);
    expect(linksUnder('Foundations')).toEqual(['Spacing', 'Tokens', 'Typography']);
    expect(screen.getByRole('link', { name: 'Typography' })).toHaveAttribute('href', '/typography');
    expect(screen.getByRole('link', { name: 'Spacing' })).toHaveAttribute('href', '/spacing');
  });

  it('Start here comes first, with Getting started, Overview, Release notes and Versions in order', () => {
    renderSidebar(NAV);
    expect(screen.getAllByRole('heading', { level: 2 })[0]).toHaveTextContent('Start here');
    expect(linksUnder('Start here')).toEqual(['Getting started', 'Overview', 'Release notes', 'Versions']);
    expect(screen.getByRole('link', { name: 'Overview' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Getting started' })).toHaveAttribute('href', '/getting-started');
    expect(screen.getByRole('link', { name: 'Versions' })).toHaveAttribute('href', '/versions');
    expect(screen.getByRole('link', { name: 'Release notes' })).toHaveAttribute('href', '/release-notes');
  });

  it('every section lists its items in alphabetical order', () => {
    renderSidebar(NAV);
    for (const heading of screen.getAllByRole('heading', { level: 2 })) {
      const labels = linksUnder(heading.textContent ?? '');
      const sorted = [...labels].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
      expect(labels, heading.textContent ?? '').toEqual(sorted);
    }
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

describe('Sidebar current section', () => {
  let go: (to: string) => void = () => {};
  function Nav() {
    const navigate = useNavigate();
    go = (to) => navigate(to);
    return null;
  }
  const title = (name: string) => screen.getByRole('heading', { level: 2, name });
  const sectionOf = (name: string) => title(name).closest('section')!;
  function renderAt(path: string) {
    render(
      <MemoryRouter initialEntries={[path]}>
        <Nav />
        <Sidebar items={NAV} open={false} onNavigate={() => {}} />
      </MemoryRouter>,
    );
  }

  it('marks the group of the current page with data-current', () => {
    renderAt('/tokens');
    expect(sectionOf('Foundations')).toHaveAttribute('data-current');
    expect(sectionOf('Components')).not.toHaveAttribute('data-current');
  });

  it('marks Start here on the home page, and only there', () => {
    renderAt('/');
    expect(sectionOf('Start here')).toHaveAttribute('data-current');
    expect(sectionOf('Foundations')).not.toHaveAttribute('data-current');
  });

  it('marks no section on an unknown path, and does not crash', () => {
    renderAt('/nope');
    for (const h of screen.getAllByRole('heading', { level: 2 })) expect(h.closest('section')).not.toHaveAttribute('data-current');
  });

  it('does not mark Foundations on /tokens-extra, which only shares a prefix with /tokens', () => {
    renderAt('/tokens-extra');
    expect(sectionOf('Foundations')).not.toHaveAttribute('data-current');
  });

  it('keeps the same title node while the page changes inside one section', () => {
    renderAt('/tokens');
    const before = title('Foundations');
    act(() => go('/typography'));
    expect(title('Foundations')).toBe(before);
  });

  it('moves data-current and gives the new current title a fresh node when the section changes', () => {
    renderAt('/typography');
    const components = title('Components');
    act(() => go('/components/button'));
    expect(sectionOf('Foundations')).not.toHaveAttribute('data-current');
    expect(sectionOf('Components')).toHaveAttribute('data-current');
    expect(title('Components')).not.toBe(components);
  });
});
