/** Add a theme here after adding its CSS import in src/main.tsx. */
export const THEMES = ['power-up'] as const;
export type Theme = (typeof THEMES)[number];
export const DEFAULT_THEME: Theme = 'power-up';
