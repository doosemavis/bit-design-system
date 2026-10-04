import { screen, within } from '@testing-library/react';
import { describe, it, expect, beforeAll } from 'vitest';
import { renderAt } from './test/renderRoute';

/**
 * The page set with data-mode="dark" set before the first render, the way COLOR_MODE_SCRIPT leaves it.
 * jsdom loads no CSS, so the markup and axe checks in routes.test.tsx are identical in either mode; the
 * real dark colors are proven by core's per-mode contrast tests and by the e2e axe run. What dark mode
 * changes here is state, so that is what this checks.
 */
describe('dark mode', () => {
  beforeAll(() => {
    document.documentElement.dataset.theme = 'power-up';
    document.documentElement.dataset.mode = 'dark';
  });

  it('the header toggle shows Dark as pressed', async () => {
    renderAt('/');
    await screen.findByRole('heading', { level: 1 });
    const dark = within(screen.getByRole('banner')).getByRole('button', { name: 'Dark' });
    expect(dark).toHaveAttribute('aria-pressed', 'true');
  });
});
