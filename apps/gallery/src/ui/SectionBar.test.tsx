import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { SectionBar } from './SectionBar';
import { PageSection } from './PageSection';
import { PageHeader } from './PageHeader';
import { expectNoA11yViolations } from '../test/a11y';

const SECTIONS = [
  { id: 'section-one', title: 'One' },
  { id: 'section-two', title: 'Two' },
];

function Page() {
  return (
    <>
      <PageHeader eyebrow="Foundations" title="Sample" />
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
  it('the header is an eyebrow in pixel type, then the h1', () => {
    render(<PageHeader eyebrow="Components" title="Button" />);
    expect(screen.getByText('Components')).toHaveClass('gallery-eyebrow', 'bit-text', 'bit-neutral');
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
});
