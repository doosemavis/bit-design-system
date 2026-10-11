import type { ReactNode } from 'react';
import {
  Badge,
  Card,
  CodeBlock,
  Heading,
  Navbar,
  NavbarLink,
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
import { routeFor } from '../../manifests';
import type { Manifest } from '../../manifests';
import { COMPONENT_GROUPS, groupManifests } from '../../shell/navGroups';
import type { ComponentGroup } from '../../shell/navGroups';
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
  // Its links in a row, two of them, so it fits a tile without folding into a Menu button.
  navbar: () => (
    <Navbar collapse="never" size="sm" label="Navbar sample">
      <NavbarLink href="#games" current>
        Games
      </NavbarLink>
      <NavbarLink href="#shop">Shop</NavbarLink>
    </Navbar>
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

const previewOf = (manifest: Manifest): ReactNode => COMPACT[manifest.slug]?.() ?? renderManifest(manifest, defaultState(manifest), { sample: true });

/**
 * A live preview on top, the name and → below; the whole tile is one Link. The preview is inert: it shows
 * the component but takes no clicks or focus, so the tile stays a single link. Every component gets the
 * same tile, so the grid has even rows. Each tile is an item of its group's list.
 */
function Tile({ manifest }: { manifest: Manifest }) {
  return (
    <Card role="listitem" className="gallery-tile">
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

/** One sidebar group: its h3, then its tiles as a list the h3 names, so a screen reader hears "Actions, list, 3 items". */
function TileGroup({ group }: { group: ComponentGroup }) {
  const id = `home-group-${group.label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <Stack gap={12}>
      <Heading size={26} id={id}>
        {group.label}
      </Heading>
      <div role="list" aria-labelledby={id} className="gallery-tiles">
        {groupManifests(group).map((m) => (
          <Tile key={m.slug} manifest={m} />
        ))}
      </div>
    </Stack>
  );
}

const TILE_COUNT = COMPONENT_GROUPS.reduce((n, group) => n + groupManifests(group).length, 0);

/**
 * Every component as a live tile, grouped and ordered as the sidebar groups them (navGroups), so a reader who
 * learns one map has learned both, and a new component shows up once it is placed in a group.
 */
export function ComponentTiles() {
  return (
    <section aria-labelledby="home-components" className={SECTION_CLASS}>
      <Stack gap={16}>
        <Stack direction="row" gap={8} align="center">
          <Heading id="home-components" className={SECTION_TITLE_CLASS}>
            Components
          </Heading>
          <Badge size="lg" variant="outline">{String(TILE_COUNT)}</Badge>
        </Stack>
        <Text color="neutral">Every component with a live preview, grouped by the job it does. Pick one for its props, variants and examples.</Text>
        <Stack gap={48}>
          {COMPONENT_GROUPS.map((group) => (
            <TileGroup key={group.label} group={group} />
          ))}
        </Stack>
      </Stack>
    </section>
  );
}
