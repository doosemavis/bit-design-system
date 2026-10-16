import themeCss from '@bit-ds/react/themes/power-up.css?raw';

/**
 * The power-up theme file as the gallery ships it, read as text at build time. Its own module so a jsdom test can
 * hand it the file from disk (under jsdom a `?raw` CSS import comes back empty).
 */
export const THEME_CSS: string = themeCss;
