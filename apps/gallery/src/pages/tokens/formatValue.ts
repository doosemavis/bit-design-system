const RGB = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/g;
const HEX = /#[0-9a-f]{3,8}\b/gi;

const byte = (n: number) => Math.round(n).toString(16).padStart(2, '0');

/** rgb(…) or rgba(…) as hex: six digits when opaque, eight (with alpha) when not. */
function toHex(r: string, g: string, b: string, alpha?: string): string {
  const a = alpha === undefined ? 1 : Number(alpha);
  return `#${byte(+r)}${byte(+g)}${byte(+b)}${a < 1 ? byte(a * 255) : ''}`.toUpperCase();
}

/**
 * A token's computed value, written the way the Tokens page shows colors: every rgb()/rgba() as hex, and hex
 * upper-cased. Browsers serialize a shadow's color as rgba(…), which alone is wider than a card's value column.
 */
export function formatValue(value: string): string {
  return value.replace(RGB, (_, r: string, g: string, b: string, a?: string) => toHex(r, g, b, a)).replace(HEX, (hex) => hex.toUpperCase());
}
