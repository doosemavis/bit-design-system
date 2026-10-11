import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { SectionBar } from './SectionBar';
import { PageSection } from './PageSection';
import { PageHeader } from './PageHeader';
import { expectNoA11yViolations } from '../test/a11y';

const css = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../gallery.css'), 'utf8');

/** The body of the first top-level `selector { … }` rule in gallery.css. */
const rule = (selector: string) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:^|\\n)${escaped} \\{([^}]*)\\}`).exec(css)?.[1] ?? '';
};

const SECTIONS = [
  { id: 'section-one', title: 'One' },
  { id: 'section-two', title: 'Two' },
];

function Page() {
  return (
    <>
      <PageHeader title="Sample" />
      <SectionBar sections={SECTIONS} />
      {SECTIONS.map((section) => (
        <PageSection key={section.id} {...section}>
          <p>{section.title} body</p>
        </PageSection>
      ))}
    </>
  );
}

describe('PageHeader, SectionBar and PageSection', () => {
  it('the header is just the h1, with no eyebrow above it', () => {
    const { container } = render(<PageHeader title="Button" />);
    expect(container.querySelector('.gallery-eyebrow')).toBeNull();
    expect(container.querySelectorAll('p')).toHaveLength(0);
    expect(screen.getByRole('heading', { level: 1, name: 'Button' })).toBeInTheDocument();
  });

  it('a section is a region named by its h2, which can take focus', () => {
    render(<Page />);
    const region = screen.getByRole('region', { name: 'Two' });
    expect(within(region).getByRole('heading', { level: 2, name: 'Two' })).toHaveAttribute('tabindex', '-1');
  });

  it('each link focuses its h2 and leaves the route and query alone', async () => {
    const router = createMemoryRouter([{ path: '/page', element: <Page /> }], { initialEntries: ['/page?x=1'] });
    const { container } = render(<RouterProvider router={router} />);
    const bar = screen.getByRole('navigation', { name: 'On this page' });
    await userEvent.click(within(bar).getByRole('link', { name: 'Two' }));
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 2, name: 'Two' }));
    expect(router.state.location.pathname).toBe('/page');
    expect(router.state.location.search).toBe('?x=1');
    await expectNoA11yViolations(container);
  });

  it('the bar is named by its visible "On this page" label', () => {
    render(<SectionBar sections={SECTIONS} />);
    const bar = screen.getByRole('navigation', { name: 'On this page' });
    const label = document.getElementById(bar.getAttribute('aria-labelledby')!)!;
    expect(label).toHaveTextContent('On this page');
    expect(label).toHaveClass('bit-text', 'bit-neutral');
    expect(within(bar).getAllByRole('link').map((link) => link.textContent)).toEqual(['One', 'Two']);
  });

  // Critique 2026-10-11: on a phone the header stack and a two-row bar took ~430px before the Playground.
  it('gallery.css: the bar sticks under the site header on wide screens and is one scrolling row on phones', () => {
    expect(rule('.gallery-section-bar')).toMatch(/position: sticky;/);
    expect(rule('.gallery-section-bar')).toMatch(/top: var\(--_gallery-header-height\);/);
    // Its header group gives up its box, so the sticky range is the whole page, not just the header.
    expect(rule('.bit-stack:has(> .gallery-section-bar)')).toMatch(/display: contents;/);
    const phone = /@media \(max-width: 720px\) \{\s*\.gallery-section-bar \{([^}]*)\}\s*\.gallery-section-bar \.gallery-link-list \{([^}]*)\}/.exec(css);
    expect(phone?.[1]).toMatch(/position: static;/);
    expect(phone?.[2]).toMatch(/flex-wrap: nowrap;/);
    expect(phone?.[2]).toMatch(/overflow-x: auto;/);
  });

  it('gallery.css: a jump stops below the sticky bar too, on pages that have one', () => {
    expect(rule('html:has(.gallery-section-bar)')).toMatch(/scroll-padding-top: calc\(var\(--_gallery-header-height\) \+ var\(--_gallery-section-bar-height\) \+ var\(--bit-space-16px\)\);/);
  });
});
