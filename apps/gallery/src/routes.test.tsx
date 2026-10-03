import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { MANIFESTS, routeFor } from './manifests';
import { renderAt } from './test/renderRoute';
import { expectNoA11yViolations } from './test/a11y';

describe('component routes (route smoke, D14)', () => {
  beforeEach(() => {
    document.documentElement.dataset.theme = 'power-up';
  });

  it.each(MANIFESTS.map((m) => [m.name, m] as const))(
    '%s: heading, live preview, controls and code, with no axe violations',
    async (_name, manifest) => {
      const { container } = renderAt(routeFor(manifest));
      expect(await screen.findByRole('heading', { level: 1, name: manifest.name })).toBeInTheDocument();
      const preview = screen.getByRole('region', { name: `${manifest.name} preview` });
      expect(preview.querySelector('[class*="bit-"]')).not.toBeNull();
      expect(screen.getByRole('heading', { level: 2, name: 'Controls' })).toBeInTheDocument();
      expect(screen.getByText(/from '@bit-ds\/react';/)).toBeInTheDocument();
      await expectNoA11yViolations(container);
    },
  );

  it('a control change updates the preview, the code, and the URL', async () => {
    const { router } = renderAt('/components/button');
    await screen.findByRole('heading', { level: 1, name: 'Button' });
    await userEvent.selectOptions(screen.getByLabelText('color'), 'danger');
    const preview = screen.getByRole('region', { name: 'Button preview' });
    expect(within(preview).getByRole('button', { name: 'Save' })).toHaveClass('bit-danger');
    expect(screen.getByText(/<Button color="danger">Save<\/Button>/)).toBeInTheDocument();
    expect(router.state.location.search).toBe('?color=danger');
  });

  it('old shared links fall back to defaults: ?gap=3 (the pre-px step) renders the 12px default', async () => {
    renderAt('/components/stack?gap=3');
    await screen.findByRole('heading', { level: 1, name: 'Stack' });
    const preview = screen.getByRole('region', { name: 'Stack preview' });
    expect(preview.querySelector('.bit-stack')).toHaveAttribute('data-gap', '12');
  });

  it.each(['/components/nope', '/components/logo'])('%s renders the 404 (the logo lives at /brand/logo)', async (path) => {
    renderAt(path);
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Page not found');
  });

  it('sidebar links reach component pages', async () => {
    renderAt('/');
    await screen.findByRole('heading', { level: 1 });
    await userEvent.click(screen.getByRole('link', { name: 'Badge' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Badge' })).toBeInTheDocument();
  });
});
