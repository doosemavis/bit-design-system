import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderAt } from '../test/renderRoute';
import { stubMatchMedia } from '../test/matchMedia';
import { NARROW_QUERY } from '../ui/useMediaQuery';

describe('Header color mode', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.mode;
  });

  it('shows the Light/Dark toggle and no theme dropdown while there is one theme', async () => {
    renderAt('/');
    const header = await screen.findByRole('banner');
    expect(within(header).getByRole('group', { name: 'Color mode' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Theme')).toBeNull();
  });

  it('names the home link with the visible wordmark text (WCAG 2.5.3)', async () => {
    renderAt('/');
    const header = await screen.findByRole('banner');
    expect(within(header).getByRole('link', { name: 'bit Design System, gallery home' })).toHaveAttribute('href', '/');
  });

  it('has no "gallery" text label beside the logo (Amendment 2, B3)', async () => {
    renderAt('/');
    const header = await screen.findByRole('banner');
    expect(within(header).queryByText('gallery')).toBeNull();
    expect(header.querySelector('.gallery-header__name')).toBeNull();
  });

  it('clicking Dark switches the whole site, and the choice survives a remount', async () => {
    const first = renderAt('/');
    const header = await screen.findByRole('banner');
    await userEvent.click(within(header).getByRole('button', { name: 'Dark' }));
    expect(document.documentElement.dataset.mode).toBe('dark');
    expect(localStorage.getItem('bit-color-mode')).toBe('dark');
    first.unmount();

    renderAt('/');
    const again = await screen.findByRole('banner');
    expect(within(again).getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('Header at phone width', () => {
  let restore: () => void = () => {};
  afterEach(() => restore());

  it('is Menu, the logo and the mode toggle; GitHub moves into the sidebar sheet', async () => {
    restore = stubMatchMedia(NARROW_QUERY);
    renderAt('/');
    const header = await screen.findByRole('banner');
    expect(within(header).getByRole('button', { name: 'Menu' })).toBeInTheDocument();
    expect(within(header).getByRole('link', { name: 'bit Design System, gallery home' })).toBeInTheDocument();
    expect(within(header).getByRole('group', { name: 'Color mode' })).toBeInTheDocument();
    expect(within(header).queryByRole('link', { name: 'GitHub' })).toBeNull();
    const nav = screen.getByRole('navigation', { name: 'Gallery' });
    expect(within(nav).getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/doosemavis/bit-design-system');
  });

  it('on a wide screen GitHub stays in the header and the sheet has none', async () => {
    renderAt('/');
    const header = await screen.findByRole('banner');
    expect(within(header).getByRole('link', { name: 'GitHub' })).toBeInTheDocument();
    expect(within(screen.getByRole('navigation', { name: 'Gallery' })).queryByRole('link', { name: 'GitHub' })).toBeNull();
  });
});
