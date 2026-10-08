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
      <Stack gap={8}>
        {entries.map((entry) => (
          <Stack key={entry.version} direction="row" gap={8} align="center" wrap>
            <Link
              href={`#${releaseAnchor(entry.version)}`}
              aria-current={entry.version === current ? 'true' : undefined}
              onClick={(event) => {
                event.preventDefault();
                onSelect(entry.version);
              }}
            >
              {`v${entry.version}`}
            </Link>
            {entry.date ? <Text as="span">{entry.date.slice(5)}</Text> : null}
          </Stack>
        ))}
      </Stack>
    </nav>
  );
}
