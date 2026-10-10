import postcss from 'postcss';
import type { AtRule, Rule } from 'postcss';

export interface CssException {
  readonly selector: string;
  readonly property: string;
  readonly reason: string;
}

interface GuardResult {
  /** Paint declarations with no exception: "<key> { <property> }". */
  readonly unlisted: readonly string[];
  /** Exceptions that match no paint declaration. */
  readonly stale: readonly string[];
  /** Exceptions with an empty reason. */
  readonly unexplained: readonly string[];
}

const LAYOUT_EXACT = new Set([
  'display', 'gap', 'row-gap', 'column-gap', 'order', 'position', 'top', 'right', 'bottom', 'left', 'z-index',
  'width', 'min-width', 'max-width', 'height', 'min-height', 'max-height', 'box-sizing', 'aspect-ratio', 'contain',
  'isolation', 'visibility', 'clip', 'clip-path', 'white-space', 'text-overflow', 'word-break', 'overflow-wrap', 'text-align',
]);
const LAYOUT_PREFIXES = ['grid', 'flex', 'align-', 'justify-', 'place-', 'inset', 'margin', 'padding', 'overflow', 'scroll-margin', 'scroll-padding', '--_gallery-'];

/** Positioning, sizing and spacing: what a layout-only stylesheet may set. Custom properties must be `--_gallery-*`, so the sheet cannot re-theme a bit token. */
export function isLayoutProperty(property: string): boolean {
  return LAYOUT_EXACT.has(property) || LAYOUT_PREFIXES.some((prefix) => property.startsWith(prefix));
}

/** "a,\n b" → "a, b", so a key doesn't depend on how the list was wrapped. */
const normalize = (selector: string) => selector.split(',').map((s) => s.trim()).join(', ');

function atPrefix(rule: Rule): string {
  const parts: string[] = [];
  for (let parent = rule.parent; parent && parent.type !== 'root'; parent = parent.parent) {
    if (parent.type === 'atrule') parts.unshift(`@${(parent as AtRule).name} ${(parent as AtRule).params}`);
  }
  return parts.join(' ');
}

/** Every declaration in a rule, keyed "<at-rule chain> <selector>" with the selector list normalised. */
export function declarationKeys(css: string): readonly { key: string; property: string }[] {
  const out: { key: string; property: string }[] = [];
  postcss.parse(css).walkRules((rule) => {
    const prefix = atPrefix(rule);
    const key = prefix ? `${prefix} ${normalize(rule.selector)}` : normalize(rule.selector);
    rule.each((child) => {
      if (child.type === 'decl') out.push({ key, property: child.prop });
    });
  });
  return out;
}

const label = (key: string, property: string) => `${key} { ${property} }`;

/** Checks that every non-layout declaration is listed, and that the list holds nothing extra. */
export function checkCss(css: string, exceptions: readonly CssException[]): GuardResult {
  const paint = declarationKeys(css).filter((d) => !isLayoutProperty(d.property));
  const listed = exceptions.map((e) => label(normalize(e.selector), e.property));
  const covered = new Set(listed);
  const used = new Set(paint.map((d) => label(d.key, d.property)));
  return {
    unlisted: [...new Set(paint.map((d) => label(d.key, d.property)))].filter((l) => !covered.has(l)),
    stale: listed.filter((l) => !used.has(l)),
    unexplained: exceptions.filter((e) => e.reason.trim() === '').map((e) => label(normalize(e.selector), e.property)),
  };
}
