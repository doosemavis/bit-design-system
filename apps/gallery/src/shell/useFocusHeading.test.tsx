import { act, render, waitFor } from '@testing-library/react';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { sectionIdOf, useFocusHeading } from './useFocusHeading';

function Layout() {
  useFocusHeading();
  return (
    <main>
      <Outlet />
    </main>
  );
}

/** A page whose first h1s are presentational samples, like the Typography page's heading table. */
function SamplePage() {
  return (
    <>
      <h1 role="presentation">Page title sample</h1>
      <h1 role="none">Another sample</h1>
      <h1>Real title</h1>
    </>
  );
}

describe('useFocusHeading', () => {
  it('skips presentational h1 samples and focuses the real page heading', async () => {
    const router = createMemoryRouter(
      [
        {
          element: <Layout />,
          children: [
            { path: '/', element: <h1>Home</h1> },
            { path: '/samples', element: <SamplePage /> },
          ],
        },
      ],
      { initialEntries: ['/'] },
    );
    const { getByText } = render(<RouterProvider router={router} />);
    await act(() => router.navigate('/samples'));
    await waitFor(() => expect(document.activeElement).toBe(getByText('Real title')));
  });

  it('a query-only change (a control on a component page) keeps focus where it is', async () => {
    const router = createMemoryRouter(
      [{ element: <Layout />, children: [{ path: '/page', element: <h1>Page</h1> }] }],
      { initialEntries: ['/page'] },
    );
    render(<RouterProvider router={router} />);
    const input = document.createElement('input');
    document.body.append(input);
    input.focus();
    await act(() => router.navigate('/page?color=danger'));
    await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
    expect(document.activeElement).toBe(input);
    input.remove();
  });

  it('coming back to the first page is a page change too, so its heading takes focus', async () => {
    const router = createMemoryRouter(
      [
        {
          element: <Layout />,
          children: [
            { path: '/', element: <h1>Home</h1> },
            { path: '/other', element: <h1>Other</h1> },
          ],
        },
      ],
      { initialEntries: ['/'] },
    );
    const { getByText } = render(<RouterProvider router={router} />);
    await act(() => router.navigate('/other'));
    await waitFor(() => expect(document.activeElement).toBe(getByText('Other')));
    await act(() => router.navigate('/'));
    await waitFor(() => expect(document.activeElement).toBe(getByText('Home')));
  });

  describe('a route hash names a section', () => {
    function SectionsPage() {
      return (
        <>
          <h1>Sections</h1>
          <h2 id="section-usage">Usage</h2>
          <h2 id="section-props">Props</h2>
        </>
      );
    }
    const routes = [
      {
        element: <Layout />,
        children: [
          { path: '/', element: <h1>Home</h1> },
          { path: '/sections', element: <SectionsPage /> },
        ],
      },
    ];

    it('a new page with a hash focuses that section, not the h1', async () => {
      const router = createMemoryRouter(routes, { initialEntries: ['/'] });
      const { getByText } = render(<RouterProvider router={router} />);
      await act(() => router.navigate('/sections#section-props'));
      await waitFor(() => expect(document.activeElement).toBe(getByText('Props')));
    });

    it('the first load of a deep link focuses its section', async () => {
      const router = createMemoryRouter(routes, { initialEntries: ['/sections#section-usage'] });
      const { getByText } = render(<RouterProvider router={router} />);
      await waitFor(() => expect(document.activeElement).toBe(getByText('Usage')));
    });

    it('a new hash on the same page moves to that section', async () => {
      const router = createMemoryRouter(routes, { initialEntries: ['/sections#section-usage'] });
      const { getByText } = render(<RouterProvider router={router} />);
      await waitFor(() => expect(document.activeElement).toBe(getByText('Usage')));
      await act(() => router.navigate('/sections#section-props'));
      await waitFor(() => expect(document.activeElement).toBe(getByText('Props')));
    });

    it('a hash that names nothing falls back to the h1 on a new page', async () => {
      const router = createMemoryRouter(routes, { initialEntries: ['/'] });
      const { getByText } = render(<RouterProvider router={router} />);
      await act(() => router.navigate('/sections#nope'));
      await waitFor(() => expect(document.activeElement).toBe(getByText('Sections')));
    });
  });

  it('sectionIdOf reads the id, decoded, and nothing from an empty hash', () => {
    expect(sectionIdOf('#section-props')).toBe('section-props');
    expect(sectionIdOf('#a%20b')).toBe('a b');
    expect(sectionIdOf('#%E0%A4%A')).toBe('%E0%A4%A');
    expect(sectionIdOf('#')).toBe('');
    expect(sectionIdOf('')).toBe('');
  });
});
