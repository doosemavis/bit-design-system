import { NAV } from '../src/shell/Sidebar';

/** Every page the gallery serves, as hash routes (NAV is grouped by section, alphabetical within each; Overview is the home page), plus the not-found state. */
export const ROUTES: readonly { name: string; hash: string }[] = [
  ...NAV.map((item) => ({ name: item.label, hash: `#${item.to}` })),
  { name: 'Not found', hash: '#/no-such-page' },
];
