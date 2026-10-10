/**
 * Every route that is not a component page, with the name of its h1. The route smoke (routes.test.tsx) checks
 * each heading and runs axe on each of these and on every manifest's route. jsdom loads no CSS, so the markup is
 * the same in either mode: routes.dark.test.tsx checks only the dark-mode state, and the real dark colors are
 * covered by core's per-mode contrast tests and the e2e axe run.
 */
export const PAGE_ROUTES = [
  ['/', 'bit Design System'],
  ['/getting-started', 'Getting started'],
  ['/versions', 'Versions'],
  ['/accessibility', 'Accessibility'],
  ['/release-notes', 'Release notes'],
  ['/tokens', 'Tokens'],
  ['/typography', 'Typography'],
  ['/spacing', 'Spacing'],
  // A bad path: the generic 404.
  ['/nope', 'Page not found'],
  // A typo in a component slug: the unknown-component page.
  ['/components/buton', 'No component called “buton”'],
] as const;
