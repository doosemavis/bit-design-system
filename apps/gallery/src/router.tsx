import { lazy, Suspense } from 'react';
import { createHashRouter } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { Shell } from './shell/Shell';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';

// Pages other than home are lazy so the first paint ships only the shell and home.
const TokensPage = lazy(() => import('./pages/TokensPage').then((m) => ({ default: m.TokensPage })));

function Loading() {
  return <p className="gallery-loading">Loading…</p>;
}

/** Route table shared by the hash router (app) and memory routers (tests). */
export function buildRoutes(): RouteObject[] {
  return [
    {
      element: <Shell />,
      children: [
        { index: true, element: <HomePage /> },
        {
          path: 'tokens',
          element: (
            <Suspense fallback={<Loading />}>
              <TokensPage />
            </Suspense>
          ),
        },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ];
}

export const router = createHashRouter(buildRoutes());
