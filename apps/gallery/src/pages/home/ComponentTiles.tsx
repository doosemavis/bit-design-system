import type { ReactNode } from 'react';
import {
  Badge,
  Card,
  CodeBlock,
  Heading,
  Link,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TabList,
  TabPanel,
  Tabs,
  Text,
} from '@bit-ds/react';
import { SECTION_CLASS, SECTION_TITLE_CLASS } from '../../ui/PageSection';
import { Link as RouterLink } from 'react-router-dom';
import { MANIFESTS, routeFor } from '../../manifests';
import type { Manifest } from '../../manifests';
import { renderManifest } from '../../engine/renderManifest';
import { defaultState } from '../../engine/state';

/**
 * Compact samples for the demos too big for a tile (a full code panel, a props table, five tabs): the same
 * component, cut down, so every tile shows its component whole and every row stays the same height.
 */
const COMPACT: Readonly<Record<string, () => ReactNode>> = {
  codeblock: () => <CodeBlock language="jsx" code={'<Button size="lg" />'} copy={false} label="CodeBlock sample" />,
  table: () => (
    <Table aria-label="Table sample">
      <TableHead>
        <TableRow>
          <TableCell>Item</TableCell>
          <TableCell>Qty</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow>
          <TableCell>Coins</TableCell>
          <TableCell>3</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Stars</TableCell>
          <TableCell>1</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
  // Its badges alone: the Stack page's demo sits them in a sized Box, too wide for a tile.
  stack: () => (
    <Stack gap={8}>
      <Badge color="primary">One</Badge>
      <Badge color="success">Two</Badge>
      <Badge color="danger">Three</Badge>
    </Stack>
  ),
  tabs: () => (
    <Tabs defaultValue="one">
      <TabList aria-label="Tabs sample">
        <Tab value="one">One</Tab>
        <Tab value="two">Two</Tab>
      </TabList>
      <TabPanel value="one">Level 1</TabPanel>
      <TabPanel value="two">Level 2</TabPanel>
    </Tabs>
  ),
};

const previewOf = (manifest: Manifest): ReactNode => COMPACT[manifest.slug]?.() ?? renderManifest(manifest, defaultState(manifest));

/**
 * A live preview on top, the name and → below; the whole tile is one Link. The preview is inert: it shows
 * the component but takes no clicks or focus, so the tile stays a single link. Every component gets the
 * same tile, so the grid has even rows.
 */
function Tile({ manifest }: { manifest: Manifest }) {
  return (
    <Card className="gallery-tile">
      <div className="gallery-tile__preview" inert>
        {previewOf(manifest)}
      </div>
      <Link asChild color="neutral" className="gallery-tile__link">
        <RouterLink to={routeFor(manifest)}>
          {manifest.name} <span aria-hidden="true">→</span>
        </RouterLink>
      </Link>
    </Card>
  );
}

function TileGroup({ title, lead, manifests }: { title: string; lead: string; manifests: readonly Manifest[] }) {
  return (
    <Stack gap={16} className={SECTION_CLASS}>
      <Stack direction="row" gap={8} align="center">
        <Heading className={SECTION_TITLE_CLASS}>{title}</Heading>
        <Badge variant="outline">{String(manifests.length)}</Badge>
      </Stack>
      <Text color="neutral">{lead}</Text>
      <div className="gallery-tiles">
        {manifests.map((m) => (
          <Tile key={m.slug} manifest={m} />
        ))}
      </div>
    </Stack>
  );
}

/** Every component and form control as a live tile, from the manifests, so a new one shows up by itself. */
export function ComponentTiles() {
  // A fragment, so each group is a section of the home page and gets the same break as the rest.
  return (
    <>
      <TileGroup
        title="Components"
        lead="Every component with a live preview. Pick one for its props, variants and examples."
        manifests={MANIFESTS.filter((m) => m.group === 'components')}
      />
      <TileGroup
        title="Forms"
        lead="Inputs that behave like native ones in a form: name, required and reset all work."
        manifests={MANIFESTS.filter((m) => m.group === 'forms')}
      />
    </>
  );
}
