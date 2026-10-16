import { Icon, iconBrush, iconExtension, iconGroups, iconInventory2, iconLayers, iconTune, Stack, Table, TableBody, TableCell, TableHead, TableRow, Text } from '@bit-ds/react';
import type { IconData } from '@bit-ds/react';
import { renderInline } from '../../ui/renderInline';
import { AXES } from './architectureDoc';

/** Each axis's icon, by the name ARCHITECTURE.md gives it. architecture.test.ts fails if the doc adds an axis without one. */
export const AXIS_ICONS: Readonly<Record<string, IconData>> = {
  'Implementation model': iconLayers,
  Distribution: iconInventory2,
  Tokens: iconTune,
  Styling: iconBrush,
  'Component API': iconExtension,
  Governance: iconGroups,
};

/**
 * What bit chose on each axis, the options it turned down (in <s>, after "over"), why, and what the choice costs:
 * ARCHITECTURE.md §4's own rows, read at build time, so the page never restates them. The doc's "Revisit when"
 * column stays in the doc (owner, 2026-10-16).
 */
export function KindTable() {
  return (
    <Table flat aria-label="What kind of design system this is" className="gallery-arch-kind">
      <TableHead>
        <TableRow>
          <TableCell>Axis</TableCell>
          <TableCell>bit chose</TableCell>
          <TableCell>Why, and what it costs</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {AXES.map((row) => (
          <TableRow key={row.axis}>
            <TableCell className="gallery-arch-kind__axis">
              <Stack direction="row" gap={8} align="center">
                <Icon icon={AXIS_ICONS[row.axis] ?? iconLayers} className="gallery-arch-icon" />
                <Text weight="bold">{row.axis}</Text>
              </Stack>
            </TableCell>
            <TableCell className="gallery-arch-kind__choice">
              <Stack gap={4}>
                <Text weight="bold">{renderInline(row.choice)}</Text>
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
            <TableCell className="gallery-arch-kind__why">
              <Stack gap={8}>
                <Text>{renderInline(row.why)}</Text>
                <Stack gap={4}>
                  <Text color="neutral" className="gallery-arch-label">
                    Costs us
                  </Text>
                  <Text>{renderInline(row.cost)}</Text>
                </Stack>
              </Stack>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
