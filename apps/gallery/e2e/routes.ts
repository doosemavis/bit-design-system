import { NAV } from '../src/shell/Sidebar';

/** Every page the gallery serves, as hash routes, plus the not-found state. */
export const ROUTES: readonly { name: string; hash: string }[] = [
  { name: 'Home', hash: '#/' },
  ...NAV.map((item) => ({ name: item.label, hash: `#${item.to}` })),
  { name: 'Not found', hash: '#/no-such-page' },
];

export const MODES = ['light', 'dark'] as const;
