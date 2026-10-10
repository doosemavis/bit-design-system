import { Heading, Link, Stack, Text } from '@bit-ds/react';
import { Link as RouterLink } from 'react-router-dom';
import { MANIFESTS, routeFor } from '../manifests';
import { closestManifest } from './closestManifest';

interface UnknownComponentPageProps {
  /** The slug from the URL, exactly as typed. React escapes it like any text. */
  slug: string;
}

/** `/components/<typo>`: names the typo, suggests the closest component, and lists every one. */
export function UnknownComponentPage({ slug }: UnknownComponentPageProps) {
  const closest = closestManifest(slug);
  return (
    <Stack gap={24}>
      <Stack gap={12} align="start">
        <Heading as="h1">No component called “{slug}”</Heading>
        {closest ? (
          <Text size={18}>
            <Link asChild>
              <RouterLink to={routeFor(closest)}>
                Go to {closest.name} <span aria-hidden="true">→</span>
              </RouterLink>
            </Link>
          </Text>
        ) : null}
      </Stack>
      <Stack gap={12}>
        <Heading>Every component</Heading>
        <ul className="gallery-link-list">
          {MANIFESTS.map((manifest) => (
            <li key={manifest.slug}>
              <Link asChild>
                <RouterLink to={routeFor(manifest)}>{manifest.name}</RouterLink>
              </Link>
            </li>
          ))}
        </ul>
      </Stack>
    </Stack>
  );
}
