import themeCss from '@bit-ds/react/themes/power-up.css?raw';
import { parseColorFlows } from './colorFlows';

/**
 * The power-up theme's wiring, read from the same theme file the gallery loads, as text at build time. A
 * change to the theme redraws the color flow on the next build. Null if the theme can't be read.
 */
export const THEME_FLOWS = parseColorFlows(themeCss);
