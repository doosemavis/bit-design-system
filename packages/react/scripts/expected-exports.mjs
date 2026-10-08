import { readFileSync } from 'node:fs';
import { iconExportName } from '../../../scripts/icon-names.mjs';

// The component and helper names @bit-ds/react must export. One list for verify-dist (the built
// dist) and scripts/smoke-consumer.mjs (the packed tarball), so they cannot drift apart.
export const EXPECTED = [
  'Alert', 'Badge', 'BitLogo', 'Button', 'Card', 'CardBody', 'CardFooter', 'CardHeader', 'ModeToggle', 'Spinner', 'Stack', 'Text',
  'Field', 'Input', 'Select', 'Switch', 'Link', 'Code', 'CodeBlock', 'SegmentedControl',
  'Table', 'TableHead', 'TableBody', 'TableRow', 'TableCell',
  'Dialog', 'DialogHeader', 'DialogBody', 'DialogFooter', 'DialogClose', 'Tabs', 'TabList', 'Tab', 'TabPanel',
  'Heading', 'Box', 'Icon', 'announce', 'useCopyToClipboard', 'colorMode', 'ColorModeService',
];

// Every icon export: each name in icons.json and its fill, worked out from the list so it never needs retyping.
const ICON_LIST = JSON.parse(readFileSync(new URL('../../core/src/icons/icons.json', import.meta.url), 'utf8'));
export const ICON_EXPORTS = Object.values(ICON_LIST)
  .flat()
  .flatMap((name) => [iconExportName(name), iconExportName(`${name}-fill`)]);
