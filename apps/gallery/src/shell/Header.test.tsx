import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderAt } from '../test/renderRoute';

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

  it('clicking Dark switches the whole site, and the choice survives a remount', async () => {
    const first = renderAt('/');
    const header = await screen.findByRole('banner');
    await userEvent.click(within(header).getByRole('button', { name: 'Dark' }));
    expect(document.documentElement.dataset.mode).toBe('dark');
    first.unmount();

    renderAt('/');
    const again = await screen.findByRole('banner');
    expect(within(again).getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'true');
  });
});
