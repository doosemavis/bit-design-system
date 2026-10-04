/**
 * Every route that is not a component page, with the name of its h1. The route smokes run axe on each of
 * these and on every manifest's route: routes.test.tsx in light, routes.dark.test.tsx in dark. Both read
 * this one list, so light and dark cannot drift apart.
 */
export const PAGE_ROUTES = [
  ['/', 'bit Design System'],
  ['/getting-started', 'Getting started'],
  ['/versions', 'Versions'],
  ['/release-notes', 'Release notes'],
  ['/tokens', 'Tokens'],
  ['/typography', 'Typography'],
  ['/spacing', 'Spacing'],
  // A bad path: the generic 404.
  ['/nope', 'Page not found'],
  // A typo in a component slug: the unknown-component page.
  ['/components/buton', 'No component called “buton”'],
] as const;
