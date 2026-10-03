import { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { createHashRouter } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { Shell } from './shell/Shell';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';

// Pages other than home are lazy so the first paint ships only the shell and home.
const TokensPage = lazy(() => import('./pages/TokensPage').then((m) => ({ default: m.TokensPage })));
const TypographyPage = lazy(() => import('./pages/TypographyPage').then((m) => ({ default: m.TypographyPage })));
const SpacingPage = lazy(() => import('./pages/SpacingPage').then((m) => ({ default: m.SpacingPage })));
const ComponentRoute = lazy(() => import('./pages/ComponentPage').then((m) => ({ default: m.ComponentRoute })));
const LogoRoute = lazy(() => import('./pages/ComponentPage').then((m) => ({ default: m.LogoRoute })));

function Loading() {
  return <p className="gallery-loading">Loading…</p>;
}

function lazyPage(page: ReactNode) {
  return <Suspense fallback={<Loading />}>{page}</Suspense>;
}

/** Route table shared by the hash router (app) and memory routers (tests). */
export function buildRoutes(): RouteObject[] {
  return [
    {
      element: <Shell />,
      children: [
        { index: true, element: <HomePage /> },
        { path: 'tokens', element: lazyPage(<TokensPage />) },
        { path: 'typography', element: lazyPage(<TypographyPage />) },
        { path: 'spacing', element: lazyPage(<SpacingPage />) },
        { path: 'components/:slug', element: lazyPage(<ComponentRoute />) },
        { path: 'brand/logo', element: lazyPage(<LogoRoute />) },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ];
}

export const router = createHashRouter(buildRoutes());
