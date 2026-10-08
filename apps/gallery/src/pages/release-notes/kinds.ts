import type { BadgeProps } from '@bit-ds/react';
import type { ChangeKind } from '../../content/changelog';

export const KIND_BADGE: Record<ChangeKind, Pick<BadgeProps, 'color' | 'variant'>> = {
  Breaking: { color: 'danger', variant: 'solid' },
  Added: { color: 'success', variant: 'solid' },
  Changed: { color: 'primary', variant: 'outline' },
  Fixed: { color: 'primary', variant: 'outline' },
  Removed: { color: 'neutral', variant: 'outline' },
};

/** The kinds the filter offers. Removed is rare, so it only appears inside cards. */
export const FILTER_KINDS = ['Breaking', 'Added', 'Changed', 'Fixed'] as const satisfies readonly ChangeKind[];

export const releaseAnchor = (version: string) => `release-${version}`;
