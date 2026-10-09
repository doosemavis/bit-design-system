/** One palette color feeding one public token, e.g. violet → --bit-color-primary. */
export interface ColorFlow {
  /** The palette entry's name without its prefix: `violet` for --bit-palette-violet. */
  readonly from: string;
  /** The public token it ends up in. */
  readonly to: string;
}

/** Which palette color feeds each color and code token, in light and in dark. */
export interface ColorFlows {
  /** Palette name → hex, upper-cased. */
  readonly palette: Readonly<Record<string, string>>;
  readonly light: readonly ColorFlow[];
  readonly dark: readonly ColorFlow[];
}

type Declarations = Readonly<Record<string, string>>;

const DECLARATION = /--bit-([a-z0-9-]+)\s*:\s*([^;]+);/g;
const VAR_ONLY = /^var\(--bit-([a-z0-9-]+)\)$/;
const HEX = /^#[0-9a-f]{6}$/i;

/** The body of the first top-level rule whose selector list starts with `selector`, or null. */
function ruleBody(css: string, selector: RegExp): string | null {
  const start = selector.exec(css);
  if (!start) return null;
  const open = css.indexOf('{', start.index);
  const close = css.indexOf('}', open);
  return open < 0 || close < 0 ? null : css.slice(open + 1, close);
}

const declarationsOf = (body: string): Declarations =>
  Object.fromEntries([...body.matchAll(DECLARATION)].map((match) => [match[1]!, match[2]!.trim()]));

/** Follows var() references until one names a palette entry. A raw value (a hex, a shadow) has no source. */
function paletteSource(declarations: Declarations, name: string, seen: ReadonlySet<string> = new Set()): string | null {
  const ref = VAR_ONLY.exec(declarations[name] ?? '');
  if (!ref || seen.has(name)) return null;
  const target = ref[1]!;
  if (target.startsWith('palette-')) return target.slice('palette-'.length);
  return paletteSource(declarations, target, new Set([...seen, name]));
}

function flowsOf(declarations: Declarations, palette: ColorFlows['palette']): readonly ColorFlow[] {
  return Object.keys(declarations)
    .filter((name) => name.startsWith('color-') || name.startsWith('code-'))
    .flatMap((name) => {
      const from = paletteSource(declarations, name);
      return from && from in palette ? [{ from, to: `--bit-${name}` }] : [];
    });
}

/** Every token the flow draws, in light or dark: the names the Tokens page need not list again. */
export function flowTokens(flows: ColorFlows): ReadonlySet<string> {
  return new Set([...flows.light, ...flows.dark].map((flow) => flow.to));
}

/**
 * Reads a bit theme's CSS: the light block (the rule that starts with `:root`) and the `[data-mode="dark"]`
 * block on top of it. Comments are dropped first, so braces inside them do no harm. The system-mode media
 * copy is never read: it repeats the dark block. Null when either block is missing (or the CSS is empty).
 */
export function parseColorFlows(css: string): ColorFlows | null {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const lightBody = ruleBody(clean, /(?:^|\})\s*:root\b/);
  const darkBody = ruleBody(clean, /(?:^|\})\s*\[data-mode="dark"\]\s*\{/);
  if (lightBody === null || darkBody === null) return null;
  const light = declarationsOf(lightBody);
  const dark = { ...light, ...declarationsOf(darkBody) };
  const palette = Object.fromEntries(
    Object.entries(light)
      .filter(([name, value]) => name.startsWith('palette-') && HEX.test(value))
      .map(([name, value]) => [name.slice('palette-'.length), value.toUpperCase()]),
  );
  return { palette, light: flowsOf(light, palette), dark: flowsOf(dark, palette) };
}
