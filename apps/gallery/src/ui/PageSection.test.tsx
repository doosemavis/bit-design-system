import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { PageSection, SECTION_CLASS, SECTION_TITLE_CLASS } from './PageSection';

const css = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../gallery.css'), 'utf8');

describe('PageSection', () => {
  it('is a section named by its h2, which carries the title class for the accent bar', () => {
    render(
      <PageSection id="s1" title="Usage">
        <p>Body</p>
      </PageSection>,
    );
    const region = screen.getByRole('region', { name: 'Usage' });
    expect(region).toHaveClass(SECTION_CLASS);
    expect(screen.getByRole('heading', { level: 2, name: 'Usage' })).toHaveClass(SECTION_TITLE_CLASS);
  });

  it('landmark={false} renders a plain div with the same classes, for a section whose table already names the region', () => {
    const { container } = render(
      <PageSection id="s2" title="Headings" landmark={false}>
        <p>Body</p>
      </PageSection>,
    );
    expect(screen.queryByRole('region')).toBeNull();
    expect(container.firstElementChild!.tagName).toBe('DIV');
    expect(container.firstElementChild).toHaveClass(SECTION_CLASS);
  });

  // Owner pick, 2026-10-10: 128px between sections (no rule), and an accent bar under each title.
  it('gallery.css draws the break: 64px more on every section after the first (128 with the page gap), no rule, and the accent bar', () => {
    expect(css).toMatch(/\.gallery-section \+ \.gallery-section \{\s*padding-top: var\(--bit-space-64px\);\s*\}/);
    expect(css).not.toMatch(/\.gallery-section[^{]*\{[^}]*border-top/);
    expect(css).toMatch(/\.gallery-section-title::after \{[^}]*width: var\(--bit-space-48px\);[^}]*background: var\(--bit-color-accent\);/);
  });

  describe('the "#" deep link', () => {
    function renderInRouter(path: string) {
      const router = createMemoryRouter(
        [
          {
            path: '/page',
            element: (
              <PageSection id="section-usage" title="Usage">
                <p>Body</p>
              </PageSection>
            ),
          },
        ],
        { initialEntries: [path] },
      );
      render(<RouterProvider router={router} />);
      return router;
    }

    it('is a named link beside the h2, outside it, so the title keeps its own name', () => {
      renderInRouter('/page');
      const link = screen.getByRole('link', { name: 'Link to the Usage section' });
      expect(link).toHaveClass('gallery-anchor', 'bit-link');
      expect(screen.getByRole('heading', { level: 2 })).toHaveAccessibleName('Usage');
      expect(link.closest('h2')).toBeNull();
      expect(link.parentElement).toHaveClass('gallery-section-head');
    });

    it('links to the page with its query and the section as the hash, and following it sets that hash', async () => {
      const router = renderInRouter('/page?color=danger');
      const link = screen.getByRole('link', { name: 'Link to the Usage section' });
      expect(link).toHaveAttribute('href', '/page?color=danger#section-usage');
      await userEvent.click(link);
      expect(router.state.location.hash).toBe('#section-usage');
      expect(router.state.location.search).toBe('?color=danger');
      expect(screen.getByRole('heading', { level: 2, name: 'Usage' })).toHaveFocus();
    });

    it('is hidden until its row is hovered or it has focus, and always shown without hover', () => {
      expect(css).toMatch(/\.gallery-anchor\.bit-link \{[^}]*opacity: 0;/);
      expect(css).toMatch(/\.gallery-section-head:hover \.gallery-anchor\.bit-link,\s*\.gallery-anchor\.bit-link:focus-visible \{\s*opacity: 1;/);
      expect(css).toMatch(/@media \(hover: none\) \{\s*\.gallery-anchor\.bit-link \{\s*opacity: 1;/);
    });
  });
});
