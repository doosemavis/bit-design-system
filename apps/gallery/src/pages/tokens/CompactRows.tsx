import { Box, Link, Stack, SPACE_STEPS, Text, TEXT_SIZES } from '@bit-ds/react';
import { Link as RouterLink } from 'react-router-dom';

const FACES = [
  ['display', 'Lilita One'],
  ['body', 'Nunito'],
  ['pixel', 'Press Start'],
  ['mono', 'JetBrains Mono'],
] as const;

function SeeMore({ to, page }: { to: string; page: string }) {
  return (
    <Link asChild>
      <RouterLink to={to}>
        See {page} <span aria-hidden="true">→</span>
      </RouterLink>
    </Link>
  );
}

/** The four faces by name, each in its own face, the text sizes as samples, and a link to Typography. */
export function TypeRow() {
  return (
    <Stack direction="row" gap={24} align="end" wrap>
      {FACES.map(([face, name]) => (
        <Text key={face} as="span" size={24} className="gallery-face" data-face={face}>
          {name}
        </Text>
      ))}
      <Stack direction="row" gap={12} align="end" wrap>
        {TEXT_SIZES.map((size) => (
          <Text key={size} as="span" size={size}>
            {size}
          </Text>
        ))}
      </Stack>
      <SeeMore to="/typography" page="Typography" />
    </Stack>
  );
}

/** The eight space steps as bars drawn by Box padding, with their numbers, and a link to Spacing. */
export function SpaceRow() {
  return (
    <Stack direction="row" gap={24} align="end" wrap>
      <Stack direction="row" gap={12} align="end" wrap>
        {SPACE_STEPS.map((step) => (
          <Stack key={step} gap={4} align="center">
            <Box paddingLeft={step} className="gallery-ruler__bar" aria-hidden="true" />
            <Text as="span" size={13} color="neutral">
              {step}
            </Text>
          </Stack>
        ))}
      </Stack>
      <SeeMore to="/spacing" page="Spacing" />
    </Stack>
  );
}
