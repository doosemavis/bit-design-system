import { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { createHashRouter } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { Shell } from './shell/Shell';
import { ComponentLoading, PageLoading } from './shell/PageLoading';
import { PageError } from './shell/PageError';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';

// Pages other than home are lazy so the first paint ships only the shell and home.
const TokensPage = lazy(() => import('./pages/TokensPage').then((m) => ({ default: m.TokensPage })));
const TypographyPage = lazy(() => import('./pages/TypographyPage').then((m) => ({ default: m.TypographyPage })));
const SpacingPage = lazy(() => import('./pages/SpacingPage').then((m) => ({ default: m.SpacingPage })));
const ComponentRoute = lazy(() => import('./pages/ComponentRoute').then((m) => ({ default: m.ComponentRoute })));
const LogoRoute = lazy(() => import('./pages/ComponentRoute').then((m) => ({ default: m.LogoRoute })));

function lazyPage(page: ReactNode, fallback: ReactNode) {
  return <Suspense fallback={fallback}>{page}</Suspense>;
}

/** Route table shared by the hash router (app) and memory routers (tests). */
export function buildRoutes(): RouteObject[] {
  return [
    {
      element: <Shell />,
      children: [
        {
          // Pathless, so a page that throws or fails to load shows PageError inside the shell.
          errorElement: <PageError />,
          children: [
            { index: true, element: <HomePage /> },
            { path: 'tokens', element: lazyPage(<TokensPage />, <PageLoading name="Tokens" />) },
            { path: 'typography', element: lazyPage(<TypographyPage />, <PageLoading name="Typography" />) },
            { path: 'spacing', element: lazyPage(<SpacingPage />, <PageLoading name="Spacing" />) },
            { path: 'components/:slug', element: lazyPage(<ComponentRoute />, <ComponentLoading />) },
            { path: 'brand/logo', element: lazyPage(<LogoRoute />, <PageLoading name="Logo" />) },
            { path: '*', element: <NotFoundPage /> },
          ],
        },
      ],
    },
  ];
}

export const router = createHashRouter(buildRoutes());
