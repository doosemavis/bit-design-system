import { useState } from 'react';
import { Code, Field, Heading, ICON_GROUPS, iconFavorite, Input, SegmentedControl, Stack, Text } from '@bit-ds/react';
import { copyText, filterGroups, ICONS_CSS_IMPORT } from './iconCatalog';
import type { CopyFormat } from './iconCatalog';
import { IconTile } from './IconTile';

type IconStyle = 'regular' | 'fill';

const FORMATS = [
  { value: 'react', label: 'React' },
  { value: 'html', label: 'HTML' },
];

const STYLES = [
  { value: 'regular', label: 'Regular' },
  { value: 'fill', label: 'Fill' },
];

/** What Copy gives, shown once under the toolbar with favorite (or favorite-fill) as the example. */
function CopyGives({ format, style }: { format: CopyFormat; style: IconStyle }) {
  return (
    <Text data-testid="copy-gives">
      Copy gives <Code>{copyText(iconFavorite, format, style === 'fill').replace('\n\n', ' ')}</Code>
      {format === 'html' ? (
        <>
          . The class form also needs <Code>{ICONS_CSS_IMPORT}</Code> once.
        </>
      ) : null}
    </Text>
  );
}

/** Every icon in the curated set as a 56px button tile that copies its code when clicked (board tiles-v2). */
export function AllIcons() {
  const [query, setQuery] = useState('');
  const [format, setFormat] = useState<CopyFormat>('react');
  const [style, setStyle] = useState<IconStyle>('regular');
  const groups = filterGroups(ICON_GROUPS, query);
  return (
    <Stack gap={16}>
      <Text>300 icons, each with a fill version. Every one works as a React component or as plain HTML classes.</Text>
      <Stack direction="row" gap={16} align="end" wrap>
        <Field label="Search icons" className="gallery-icon-search">
          <Input type="search" value={query} placeholder="e.g. arrow, mail, play" onChange={(e) => setQuery(e.target.value)} />
        </Field>
        <SegmentedControl legend="Copy as" size="sm" color="neutral" options={FORMATS} value={format} onValueChange={(v) => setFormat(v as CopyFormat)} />
        <SegmentedControl legend="Style" size="sm" color="neutral" options={STYLES} value={style} onValueChange={(v) => setStyle(v as IconStyle)} />
      </Stack>
      <CopyGives format={format} style={style} />
      {groups.length === 0 ? <Text>No icons match. Try another word.</Text> : null}
      {groups.map((group) => (
        <Stack key={group.label} gap={8}>
          <Heading level={3}>{group.label}</Heading>
          <div className="gallery-icon-grid">
            {group.icons.map((icon) => (
              <IconTile key={icon.name} icon={icon} filled={style === 'fill'} format={format} />
            ))}
          </div>
        </Stack>
      ))}
    </Stack>
  );
}
