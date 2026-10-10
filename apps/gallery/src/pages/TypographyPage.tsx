import {
  Alert,
  Box,
  Card,
  CardBody,
  Code,
  Heading,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Text,
} from '@bit-ds/react';
import type { HeadingLevel, TextProps } from '@bit-ds/react';

/** power-up's four faces. The sample is set in the face through `.gallery-face[data-face]` in gallery.css. */
const FACES = [
  { face: 'display', name: 'Lilita One', use: 'h1 to h3, and Text at 24 and 32.' },
  { face: 'body', name: 'Nunito', use: 'Body copy, labels, h4 and h5.' },
  { face: 'pixel', name: 'Press Start', use: 'Eyebrows, h6, small labels.' },
  { face: 'mono', name: 'JetBrains Mono', use: 'Code and CodeBlock.' },
] as const;

const HEADINGS: readonly { level: HeadingLevel; example: string; size: string; face: string }[] = [
  { level: 1, example: 'Page title', size: '32', face: 'display' },
  { level: 2, example: 'Section', size: '24', face: 'display' },
  { level: 3, example: 'Subsection', size: '18', face: 'display' },
  { level: 4, example: 'Group title', size: '15', face: 'body bold' },
  { level: 5, example: 'Small title', size: '13', face: 'body bold' },
  { level: 6, example: 'Eyebrow', size: '13', face: 'pixel' },
];

const TEXT_SIZES: readonly { props: TextProps; example: string; size: string; code: string }[] = [
  { props: { size: 18 }, example: 'Lead paragraph', size: '18', code: '<Text size={18}>' },
  { props: {}, example: 'Body copy, the default', size: '15', code: '<Text>' },
  { props: { size: 13, color: 'neutral' }, example: 'Hints and captions', size: '13', code: '<Text size={13} color="neutral">' },
];

/** A value column (tag, size, face, token): muted text, centered under its heading. */
function ValueCell({ children }: { children: string }) {
  return (
    <TableCell className="gallery-cell-center">
      <Text color="neutral">{children}</Text>
    </TableCell>
  );
}

/** The head row both tables share: what it looks like, one centered column per value, and how to write it. */
function HeadRow({ values }: { values: readonly string[] }) {
  return (
    <TableHead>
      <TableRow>
        <TableCell>Example</TableCell>
        {values.map((value) => (
          <TableCell key={value} className="gallery-cell-center">
            {value}
          </TableCell>
        ))}
        <TableCell>Code</TableCell>
      </TableRow>
    </TableHead>
  );
}

function Faces() {
  return (
    <Box className="gallery-grid">
      {FACES.map(({ face, name, use }) => (
        <Card key={face}>
          <CardBody>
            <Stack gap={8} align="start">
              <Text as="span" size={24} className="gallery-face" data-face={face}>
                {name}
              </Text>
              <Code>{`--bit-font-${face}`}</Code>
              <Text color="neutral">
                {use}
              </Text>
            </Stack>
          </CardBody>
        </Card>
      ))}
    </Box>
  );
}

/** Each sample is a real Heading, so it shows the real look. role="presentation" keeps it out of the page outline. */
function HeadingLevels() {
  return (
    <Table aria-label="Heading levels">
      <HeadRow values={['Tag', 'Size', 'Face']} />
      <TableBody>
        {HEADINGS.map(({ level, example, size, face }) => (
          <TableRow key={level}>
            <TableCell>
              <Heading level={level} role="presentation">
                {example}
              </Heading>
            </TableCell>
            <ValueCell>{`h${level}`}</ValueCell>
            <ValueCell>{size}</ValueCell>
            <ValueCell>{face}</ValueCell>
            <TableCell>
              <Code>{`<Heading level={${level}}>`}</Code>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function TextSizes() {
  return (
    <Table aria-label="Text sizes">
      <HeadRow values={['Size', 'Token']} />
      <TableBody>
        {TEXT_SIZES.map(({ props, example, size, code }) => (
          <TableRow key={code}>
            <TableCell>
              <Text {...props}>{example}</Text>
            </TableCell>
            <ValueCell>{size}</ValueCell>
            <ValueCell>{`--bit-text-${size}px`}</ValueCell>
            <TableCell>
              <Code>{code}</Code>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** Do and Don't are guidance, not news: role="note" instead of Alert's default live status. */
function DoAndDont() {
  return (
    <Box className="gallery-grid">
      <Alert color="success" title="Do" role="note">
        Pick the level for the outline (one h1 per page, no skipped levels), then use <Code>size</Code> if it should
        look smaller.
      </Alert>
      <Alert color="danger" title="Don't" role="note">
        Use a bold Text where a heading belongs. Screen readers move through a page by its headings.
      </Alert>
    </Box>
  );
}

/** Foundations: the faces, the heading levels and the Text sizes. Built only from bit components. */
export function TypographyPage() {
  return (
    <Stack gap={32}>
      <Stack gap={8}>
        <Heading level={1}>Typography</Heading>
        <Text size={18}>
          Four faces and one scale. Use <Code>Heading</Code> for titles: the level picks the tag. Use <Code>Text</Code>{' '}
          for everything else: the size picks the step.
        </Text>
      </Stack>
      <Stack gap={12}>
        <Heading level={2}>Faces</Heading>
        <Faces />
      </Stack>
      <Stack gap={12}>
        <Heading level={2}>Headings</Heading>
        <HeadingLevels />
      </Stack>
      <Stack gap={12}>
        <Heading level={2}>Text sizes</Heading>
        <TextSizes />
      </Stack>
      <Stack gap={12}>
        <Heading level={2}>Do and Don't</Heading>
        <DoAndDont />
      </Stack>
    </Stack>
  );
}
