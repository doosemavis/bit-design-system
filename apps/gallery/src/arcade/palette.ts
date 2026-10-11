/** The colors a board is painted in, each resolved to a color the canvas understands, and the pixel font. */
export interface Palette {
  readonly board: string;
  readonly line: string;
  readonly text: string;
  readonly snake: string;
  readonly food: string;
  readonly rat: string;
  readonly cheese: string;
  readonly cat: string;
  /** Bit Blaster: the black of space, the shields, and the swarm's three rows (top to bottom). */
  readonly space: string;
  readonly shield: string;
  readonly alienTop: string;
  readonly alienMid: string;
  readonly alienLow: string;
  readonly font: string;
}

type ColorRole = Exclude<keyof Palette, 'font'>;

/**
 * bit tokens for each role. The yellow (warning) roles are always drawn with a line-colored outline, so they
 * stand out on a white board too.
 */
export const TOKEN_COLORS: Readonly<Record<ColorRole, string>> = {
  board: 'var(--bit-color-surface)',
  line: 'var(--bit-color-line)',
  text: 'var(--bit-color-text)',
  snake: 'var(--bit-color-primary)',
  food: 'var(--bit-color-warning)',
  rat: 'var(--bit-color-primary)',
  cheese: 'var(--bit-color-warning)',
  cat: 'var(--bit-color-danger)',
  // Bit Blaster plays in a .bit-dark stage, so these resolve to the night colors: CodeBlock black, coin yellow, lilac.
  space: 'var(--bit-code-bg)',
  shield: 'var(--bit-color-success)',
  alienTop: 'var(--bit-color-danger)',
  alienMid: 'var(--bit-color-link)',
  alienLow: 'var(--bit-color-warning)',
};

/**
 * Forced colors leave a canvas alone, so the board picks the user's system colors itself: the walls, snake and
 * rat in CanvasText on Canvas, the things to reach in Highlight, the cat in LinkText.
 */
export const FORCED_COLORS: Readonly<Record<ColorRole, string>> = {
  board: 'Canvas',
  line: 'CanvasText',
  text: 'CanvasText',
  snake: 'CanvasText',
  food: 'Highlight',
  rat: 'CanvasText',
  cheese: 'Highlight',
  cat: 'LinkText',
  space: 'Canvas',
  shield: 'CanvasText',
  alienTop: 'LinkText',
  alienMid: 'Highlight',
  alienLow: 'CanvasText',
};

/** Used only where a value can't be resolved (no layout engine, as in unit tests). The light theme's colors. */
const FALLBACK: Readonly<Record<ColorRole, string>> = {
  board: '#ffffff',
  line: '#151515',
  text: '#151515',
  snake: '#7c3aed',
  food: '#ffc800',
  rat: '#7c3aed',
  cheese: '#ffc800',
  cat: '#d91a1a',
  space: '#0b0b10',
  shield: '#1fa34a',
  alienTop: '#d91a1a',
  alienMid: '#b79bff',
  alienLow: '#ffc800',
};

const ROLES = Object.keys(TOKEN_COLORS) as ColorRole[];

export const isForcedColors = (): boolean =>
  typeof window.matchMedia === 'function' && window.matchMedia('(forced-colors: active)').matches;

/**
 * Reads the palette where `host` sits, so a theme class or mode on any ancestor applies. Each role is resolved
 * through a hidden probe's `color` (which follows var() chains and system colors to an rgb() value); the probe
 * opts out of forced colors so a system color comes back as itself rather than as forced text.
 */
export function readPalette(host: Element): Palette {
  const parent = host.parentElement ?? document.body;
  const probe = document.createElement('span');
  probe.setAttribute('aria-hidden', 'true');
  probe.style.display = 'none';
  probe.style.setProperty('forced-color-adjust', 'none');
  parent.append(probe);
  const source = isForcedColors() ? FORCED_COLORS : TOKEN_COLORS;
  const resolved = Object.fromEntries(
    ROLES.map((role) => {
      probe.style.color = '';
      probe.style.color = source[role];
      const value = probe.style.color === '' ? '' : getComputedStyle(probe).color;
      return [role, /^(rgb|#|hsl|color|oklch|lab)/i.test(value) ? value : FALLBACK[role]];
    }),
  ) as Record<ColorRole, string>;
  probe.remove();
  const font = getComputedStyle(host).getPropertyValue('--bit-font-pixel').trim() || 'monospace';
  return { ...resolved, font };
}
