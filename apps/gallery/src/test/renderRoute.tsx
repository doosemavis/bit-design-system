import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { buildRoutes } from '../router';

/** Render the whole app at a hash-less path, e.g. renderAt('/components/button?color=danger'). */
export function renderAt(path: string) {
  const router = createMemoryRouter(buildRoutes(), { initialEntries: [path] });
  const utils = render(<RouterProvider router={router} />);
  return { ...utils, router };
}
