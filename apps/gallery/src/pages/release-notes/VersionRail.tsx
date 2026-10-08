import { Link, Stack, Text } from '@bit-ds/react';
import { releaseAnchor } from './kinds';

export interface RailEntry {
  version: string;
  date: string;
}

interface VersionRailProps {
  entries: readonly RailEntry[];
  current: string | undefined;
  onSelect: (version: string) => void;
}

/** Every shown release, newest first, as links that open the release and move focus to its heading. */
export function VersionRail({ entries, current, onSelect }: VersionRailProps) {
  return (
    <nav aria-label="Versions" className="gallery-rail">
      <Stack gap={4}>
        {entries.map((entry) => (
          <Link
            key={entry.version}
            href={`#${releaseAnchor(entry.version)}`}
            color='neutral'
            className='gallery-rail__row'
            aria-current={entry.version === current ? 'true' : undefined}
            onClick={(event) => {
              event.preventDefault();
              onSelect(entry.version);
            }}
          >
            <span>{`v${entry.version}`}</span>
            {entry.date ? (
              <>
                {' '}
                <Text as='span' color='neutral'>
                  {entry.date.slice(5)}
                </Text>
              </>
            ) : null}
          </Link>
        ))}
      </Stack>
    </nav>
  );
}
