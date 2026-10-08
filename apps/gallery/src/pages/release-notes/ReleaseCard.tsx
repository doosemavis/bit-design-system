import { useId } from 'react';
import { Badge, Box, Button, Card, CardBody, CardHeader, Heading, Stack } from '@bit-ds/react';
import { CHANGE_KINDS } from '../../content/changelog';
import type { ChangeKind } from '../../content/changelog';
import { ChangeList } from '../../ui/ChangeList';
import { KIND_BADGE, releaseAnchor } from './kinds';

interface ReleaseCardProps {
  version: string;
  date: string;
  sections: Partial<Record<ChangeKind, string[]>>;
  latest: boolean;
  open: boolean;
  /** Show only this kind's section. */
  only: ChangeKind | null;
  onToggle: () => void;
}

/** One release: a header that always shows the version, date and counts, and a body of per-kind lists. */
export function ReleaseCard({ version, date, sections, latest, open, only, onToggle }: ReleaseCardProps) {
  const bodyId = useId();
  const kinds = CHANGE_KINDS.filter((kind) => (sections[kind]?.length ?? 0) > 0);
  return (
    <Card>
      <CardHeader>
        <Stack direction="row" gap={12} align="center" wrap>
          <Heading level={2} id={releaseAnchor(version)} tabIndex={-1}>{`v${version}`}</Heading>
          {date ? (
            <Badge color="neutral" variant="outline">
              {date}
            </Badge>
          ) : null}
          {latest ? (
            <Badge color="primary" variant="solid">
              Latest
            </Badge>
          ) : null}
          {kinds.map((kind) => (
            <Badge key={kind} {...KIND_BADGE[kind]}>{`${kind} ${sections[kind]!.length}`}</Badge>
          ))}
          <Button variant="ghost" aria-label={`${open ? 'Hide' : 'Show'} changes in v${version}`} aria-expanded={open} aria-controls={bodyId} onClick={onToggle}>
            {open ? 'Hide changes' : 'Show changes'}
          </Button>
        </Stack>
      </CardHeader>
      <CardBody>
        <Box id={bodyId} hidden={!open}>
          <Stack gap={16} align="start">
            {kinds
              .filter((kind) => only === null || kind === only)
              .map((kind) => (
                <Stack key={kind} gap={8} align="start">
                  <Badge {...KIND_BADGE[kind]}>{kind}</Badge>
                  <ChangeList items={sections[kind]!} label={`${kind} in v${version}`} />
                </Stack>
              ))}
          </Stack>
        </Box>
      </CardBody>
    </Card>
  );
}
