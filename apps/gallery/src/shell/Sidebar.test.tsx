import { render, screen } from '@testing-library/react';
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

describe('Sidebar', () => {
  it('lists Foundations, Components, Brand and hides the empty Forms group', () => {
    expect(renderSidebar(NAV)).toEqual(['Foundations', 'Components', 'Brand']);
    expect(screen.getByRole('link', { name: 'Button' })).toHaveAttribute('href', '/components/button');
  });

  it('shows Forms between Components and Brand once a forms item exists', () => {
    const items: readonly NavItem[] = [...NAV, { group: 'Forms', label: 'Input', to: '/components/input' }];
    expect(renderSidebar(items)).toEqual(['Foundations', 'Components', 'Forms', 'Brand']);
    expect(screen.getByRole('link', { name: 'Input' })).toHaveAttribute('href', '/components/input');
  });
});
