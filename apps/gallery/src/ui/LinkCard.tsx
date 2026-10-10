import { Card, CardBody, Link, Stack, Text } from '@bit-ds/react';
import { Link as RouterLink } from 'react-router-dom';
import { renderInline } from './renderInline';

interface LinkCardProps {
  to: string;
  /** The page's name: the link's text. */
  title: string;
  /** A short line above the name, such as "Previous". */
  eyebrow?: string;
  /** A line under the name, such as a component's description. */
  description?: string;
  /** The link's accessible name when the eyebrow says what it is ("Previous: Badge"). */
  label?: string;
  rel?: 'prev' | 'next';
  /** Next sits at the end, so its text lines up on the right. */
  align?: 'start' | 'end';
}

/**
 * A bit Card that is one link to another page: the name is the link, and its ::after covers the card, so the
 * whole card clicks while screen readers hear one link. Its keyboard focus ring goes around the card.
 */
export function LinkCard({ to, title, eyebrow, description, label, rel, align = 'start' }: LinkCardProps) {
  return (
    <Card className="gallery-link-card" data-align={align}>
      <CardBody>
        <Stack gap={4} align={align}>
          {eyebrow ? (
            <Text color="neutral" aria-hidden="true">
              {eyebrow}
            </Text>
          ) : null}
          <Text size={18} weight="bold">
            <Link asChild className="gallery-link-card__link">
              <RouterLink to={to} rel={rel} aria-label={label}>
                {title}
              </RouterLink>
            </Link>
          </Text>
          {description ? <Text color="neutral">{renderInline(description)}</Text> : null}
        </Stack>
      </CardBody>
    </Card>
  );
}
