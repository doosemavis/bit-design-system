import { ICON_GROUPS } from '@bit-ds/react';
import type { IconData, IconGroup } from '@bit-ds/react';

/** The stylesheet the class form needs, besides styles.css. */
export const ICONS_CSS_IMPORT = "import '@bit-ds/react/icons.css';";

export type CopyFormat = 'react' | 'html';

/** `keyboard-arrow-down` → `iconKeyboardArrowDown`: the export the generator gave this icon (the catalog test proves they match). */
export function exportNameFor(name: string): string {
  return `icon${name
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')}`;
}

/** The icons the Icon page's playground offers. The All icons section lists every one. */
export const PLAYGROUND_ICONS = ['favorite', 'home', 'search', 'settings', 'delete', 'check-circle', 'warning', 'mail', 'person', 'download', 'add', 'close'] as const;

const BY_NAME: ReadonlyMap<string, IconData> = new Map(ICON_GROUPS.flatMap((g) => g.icons.map((icon) => [icon.name, icon] as const)));

/** An icon by name. */
export function findIcon(name: string): IconData {
  const icon = BY_NAME.get(name);
  if (!icon) throw new Error(`bit gallery: no icon named "${name}"`);
  return icon;
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

/** The class form of one icon, as the Icon page's HTML tab prints it. */
export function iconHtml(icon: IconData, { color, size, label, filled }: { color?: string; size: string; label?: string; filled?: boolean }): string {
  const classes = ['bit-icon', `bit-icon-${icon.name}`, ...(filled ? ['bit-iconFilled'] : []), ...(color ? [`bit-${color}`] : []), `bit-${size}`].join(' ');
  const a11y = label ? `role="img" aria-label="${escapeAttr(label)}"` : 'aria-hidden="true"';
  return `<span class="${classes}" ${a11y}></span>`;
}

/** Exactly what a tile's Copy button puts on the clipboard. */
export function copyText(icon: IconData, format: CopyFormat, filled = false): string {
  if (format === 'html') return `<span class="bit-icon bit-icon-${icon.name}${filled ? ' bit-iconFilled' : ''}" aria-hidden="true"></span>`;
  const name = exportNameFor(icon.name);
  return `import { Icon, ${name} } from '@bit-ds/react';\n\n<Icon icon={${name}}${filled ? ' iconFilled' : ''} />`;
}

/** Lower case, trimmed, with runs of spaces, underscores and hyphens as one hyphen: "Arrow Back" → "arrow-back". */
export function normalizeQuery(query: string): string {
  return query.trim().toLowerCase().replace(/[\s_-]+/g, '-');
}

/** The groups whose icon names contain the query, each keeping only its matches. Empty groups are dropped. */
export function filterGroups(groups: readonly IconGroup[], query: string): IconGroup[] {
  const q = normalizeQuery(query);
  if (q === '') return [...groups];
  return groups
    .map((group) => ({ label: group.label, icons: group.icons.filter((icon) => icon.name.includes(q)) }))
    .filter((group) => group.icons.length > 0);
}
