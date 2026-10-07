// The component and helper names @bit-ds/react must export. One list for verify-dist (the built
// dist) and scripts/smoke-consumer.mjs (the packed tarball), so they cannot drift apart.
export const EXPECTED = [
  'Alert', 'Badge', 'BitLogo', 'Button', 'Card', 'CardBody', 'CardFooter', 'CardHeader', 'ModeToggle', 'Spinner', 'Stack', 'Text',
  'Field', 'Input', 'Select', 'Switch', 'Link', 'Code', 'CodeBlock', 'SegmentedControl',
  'Table', 'TableHead', 'TableBody', 'TableRow', 'TableCell',
  'Dialog', 'DialogHeader', 'DialogBody', 'DialogFooter', 'DialogClose', 'Tabs', 'TabList', 'Tab', 'TabPanel',
  'Heading', 'Box', 'announce', 'useCopyToClipboard', 'colorMode', 'ColorModeService',
];
