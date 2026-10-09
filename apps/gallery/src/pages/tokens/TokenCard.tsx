import { Card, CardBody, CardHeader, Link, Stack, Text } from '@bit-ds/react';
import type { CSSProperties, ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';

/** Text on the page background: the header of every card that isn't a color role. It inverts with the mode. */
export const PAGE_HEADER: CSSProperties = { background: 'var(--bit-color-text)', color: 'var(--bit-color-bg)' };

interface TokenCardProps {
  /** The family the card holds, as its header. Assistive tech hears "<name> tokens". */
  name: string;
  header?: CSSProperties;
  /** Spans the whole grid, for a family long enough to lay its rows out in columns. */
  full?: boolean;
  children: ReactNode;
}

/** A card of tokens: the same frame for the color roles and for every family below them. */
export function TokenCard({ name, header = PAGE_HEADER, full = false, children }: TokenCardProps) {
  return (
    <Card aria-label={`${name} tokens`} role="group" className={full ? 'gallery-token-card--full' : undefined}>
      <CardHeader style={header}>{name}</CardHeader>
      <CardBody>{children}</CardBody>
    </Card>
  );
}

/** The cards of one section, as many to a row as fit: three on a desktop, one on a phone; `wide`, two. */
export function TokenGrid({ wide = false, children }: { wide?: boolean; children: ReactNode }) {
  return <div className={wide ? 'gallery-token-grid gallery-token-grid--wide' : 'gallery-token-grid'}>{children}</div>;
}

/** A section's one-line introduction, with an optional link to the page that covers it in depth. */
export function SectionLead({ children, to, page }: { children: ReactNode; to?: string; page?: string }) {
  return (
    <Stack direction="row" gap={12} align="center" wrap>
      <Text color="neutral">{children}</Text>
      {to && page ? (
        <Link asChild>
          <RouterLink to={to}>
            See {page} <span aria-hidden="true">→</span>
          </RouterLink>
        </Link>
      ) : null}
    </Stack>
  );
}
