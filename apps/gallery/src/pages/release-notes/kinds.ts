import type { BadgeProps } from '@bit-ds/react';
import type { ChangeKind } from '../../content/changelog';

export const KIND_BADGE: Record<ChangeKind, Pick<BadgeProps, 'color' | 'variant'>> = {
  Breaking: { color: 'danger', variant: 'solid' },
  Added: { color: 'success', variant: 'solid' },
  Changed: { color: 'primary', variant: 'outline' },
  Fixed: { color: 'warning', variant: 'outline' },
  Removed: { color: 'neutral', variant: 'outline' },
};

/** The kinds the filter offers. Removed is rare, so it only appears inside cards. */
export const FILTER_KINDS = ['Breaking', 'Added', 'Changed', 'Fixed'] as const satisfies readonly ChangeKind[];

export const releaseAnchor = (version: string) => `release-${version}`;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

/**
 * A CHANGELOG date (YYYY-MM-DD) as people read it, with its year: "Oct 10, 2026". Written out by hand, not with
 * Intl, so it reads the same in every browser language and in tests. Anything else stays as written.
 */
export function formatReleaseDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  const month = match ? MONTHS[Number(match[2]) - 1] : undefined;
  return match && month ? `${month} ${Number(match[3])}, ${match[1]}` : iso;
}
