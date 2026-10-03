import { screen, within } from '@testing-library/react';
import { describe, it, expect, beforeAll } from 'vitest';
import { MANIFESTS, routeFor } from './manifests';
import { renderAt } from './test/renderRoute';
import { expectNoA11yViolations } from './test/a11y';

/**
 * Every page with data-mode="dark" set before the first render, the way COLOR_MODE_SCRIPT leaves it.
 * jsdom loads no CSS, so this checks markup and accessibility in dark mode. The real dark colors are
 * proven by core's per-mode contrast tests and by the screenshot board.
 */
describe('component routes in dark mode', () => {
  beforeAll(() => {
    document.documentElement.dataset.theme = 'power-up';
    document.documentElement.dataset.mode = 'dark';
  });

  it.each(MANIFESTS.map((m) => [m.name, m] as const))('%s renders with no axe violations', async (_name, manifest) => {
    const { container } = renderAt(routeFor(manifest));
    expect(await screen.findByRole('heading', { level: 1, name: manifest.name })).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('the header toggle shows Dark as pressed', async () => {
    renderAt('/');
    await screen.findByRole('heading', { level: 1 });
    const dark = within(screen.getByRole('banner')).getByRole('button', { name: 'Dark' });
    expect(dark).toHaveAttribute('aria-pressed', 'true');
  });
});
