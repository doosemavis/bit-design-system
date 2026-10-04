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
const GettingStartedPage = lazy(() => import('./pages/GettingStartedPage').then((m) => ({ default: m.GettingStartedPage })));
const VersionsPage = lazy(() => import('./pages/VersionsPage').then((m) => ({ default: m.VersionsPage })));
const ReleaseNotesPage = lazy(() => import('./pages/ReleaseNotesPage').then((m) => ({ default: m.ReleaseNotesPage })));
const ComponentRoute = lazy(() => import('./pages/ComponentRoute').then((m) => ({ default: m.ComponentRoute })));
const LogoRoute = lazy(() => import('./pages/ComponentRoute').then((m) => ({ default: m.LogoRoute })));

/**
 * Wrap a lazy page in its own Suspense boundary. React Router runs each navigation in a transition, and a
 * transition keeps an already-shown boundary's old content on screen instead of its fallback. Keying the
 * boundary on the route pattern makes every route's boundary a new one, so moving between two lazy pages
 * shows the new page's loading state. Component pages share the one pattern, so moving between them keeps
 * the boundary (their code is the same chunk, already loaded).
 */
function lazyPage(path: string, page: ReactNode, fallback: ReactNode): RouteObject {
  return {
    path,
    element: (
      <Suspense key={path} fallback={fallback}>
        {page}
      </Suspense>
    ),
  };
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
            lazyPage('getting-started', <GettingStartedPage />, <PageLoading name="Getting started" />),
            lazyPage('versions', <VersionsPage />, <PageLoading name="Versions" />),
            lazyPage('release-notes', <ReleaseNotesPage />, <PageLoading name="Release notes" />),
            lazyPage('tokens', <TokensPage />, <PageLoading name="Tokens" />),
            lazyPage('typography', <TypographyPage />, <PageLoading name="Typography" />),
            lazyPage('spacing', <SpacingPage />, <PageLoading name="Spacing" />),
            lazyPage('components/:slug', <ComponentRoute />, <ComponentLoading />),
            lazyPage('brand/logo', <LogoRoute />, <PageLoading name="Logo" />),
            { path: '*', element: <NotFoundPage /> },
          ],
        },
      ],
    },
  ];
}

export const router = createHashRouter(buildRoutes());
