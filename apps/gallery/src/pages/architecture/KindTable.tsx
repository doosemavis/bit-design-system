import { Fragment } from 'react';
import { Icon, iconBrush, iconExtension, iconGroups, iconInventory2, iconLayers, iconTune, Link, Stack, Table, TableBody, TableCell, TableHead, TableRow, Text } from '@bit-ds/react';
import type { IconData } from '@bit-ds/react';
import { renderInline } from '../../ui/renderInline';
import { AXES, splitLinks } from './architectureDoc';

/** Each axis's icon, by the name ARCHITECTURE.md gives it. architecture.test.ts fails if the doc adds an axis without one. */
export const AXIS_ICONS: Readonly<Record<string, IconData>> = {
  'Implementation model': iconLayers,
  Distribution: iconInventory2,
  Tokens: iconTune,
  Styling: iconBrush,
  'Component API': iconExtension,
  Governance: iconGroups,
};

/** A cell of the doc as it reads there: its citations are the doc's own links, its `code` drawn as Code. */
function DocText({ text }: { text: string }) {
  return splitLinks(text).map((span, i) =>
    span.href ? (
      <Link key={i} href={span.href}>
        {renderInline(span.text)}
      </Link>
    ) : (
      <Fragment key={i}>{renderInline(span.text)}</Fragment>
    ),
  );
}

/**
 * What bit chose on each axis, the options it turned down (in <s>, after "over"), why, and what the choice costs:
 * ARCHITECTURE.md §4's own rows, read at build time, so the page never restates them. The doc's "Revisit when"
 * column stays in the doc (owner, 2026-10-16).
 *
 * On a phone gallery.css stacks each row into one block. A table whose parts are given another display can lose its
 * table semantics in some browsers, so every part names its role, and a screen reader still hears a table.
 */
export function KindTable() {
  return (
    <Table flat aria-label="What kind of design system this is" className="gallery-arch-kind" role="table">
      <TableHead role="rowgroup">
        <TableRow role="row">
          <TableCell role="columnheader">Axis</TableCell>
          <TableCell role="columnheader">bit chose</TableCell>
          <TableCell role="columnheader">Why, and what it costs</TableCell>
        </TableRow>
      </TableHead>
      <TableBody role="rowgroup">
        {AXES.map((row) => (
          <TableRow key={row.axis} role="row">
            <TableCell role="cell" className="gallery-arch-kind__axis">
              <Stack direction="row" gap={8} align="center">
                <Icon icon={AXIS_ICONS[row.axis] ?? iconLayers} className="gallery-arch-icon" />
                <Text weight="bold">{row.axis}</Text>
              </Stack>
            </TableCell>
            <TableCell role="cell" className="gallery-arch-kind__choice">
              <Stack gap={4}>
                <Text weight="bold">
                  <DocText text={row.choice} />
                </Text>
                <Text color="neutral">
                  over{' '}
                  {row.over.map((option, i) => (
                    <span key={option}>
                      {i > 0 ? ', ' : null}
                      <s className="gallery-arch-rejected">{renderInline(option)}</s>
                    </span>
                  ))}
                </Text>
              </Stack>
            </TableCell>
            <TableCell role="cell" className="gallery-arch-kind__why">
              <Stack gap={8}>
                <Text>
                  <DocText text={row.why} />
                </Text>
                <Stack gap={4}>
                  <Text color="neutral" className="gallery-arch-label">
                    Costs us
                  </Text>
                  <Text>
                    <DocText text={row.cost} />
                  </Text>
                </Stack>
              </Stack>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
