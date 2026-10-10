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
import type { HeadingSize, HeadingTag, TextProps } from '@bit-ds/react';

/** power-up's four faces. The sample is set in the face through `.gallery-face[data-face]` in gallery.css. */
const FACES = [
  { face: 'display', name: 'Lilita One', use: 'Headings at 18 and up, and Text at 24 and 32.' },
  { face: 'body', name: 'Nunito', use: 'Body copy, labels, and headings at 15 and 13.' },
  { face: 'pixel', name: 'Press Start', use: 'Badges, table headers, small labels.' },
  { face: 'mono', name: 'JetBrains Mono', use: 'Code and CodeBlock.' },
] as const;

/** Each tag at its own px size, written out: the code reads like Text's as and size. */
const HEADINGS: readonly { tag: HeadingTag; example: string; size: HeadingSize; face: string }[] = [
  { tag: 'h1', example: 'Page title', size: 32, face: 'display' },
  { tag: 'h2', example: 'Section', size: 24, face: 'display' },
  { tag: 'h3', example: 'Subsection', size: 18, face: 'display' },
  { tag: 'h4', example: 'Group title', size: 15, face: 'body bold' },
  { tag: 'h5', example: 'Small title', size: 13, face: 'body bold' },
  { tag: 'h6', example: 'Smallest title', size: 13, face: 'body bold' },
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
function HeadingTags() {
  return (
    <Table aria-label="Headings">
      <HeadRow values={['Tag', 'Size', 'Face']} />
      <TableBody>
        {HEADINGS.map(({ tag, example, size, face }) => (
          <TableRow key={tag}>
            <TableCell>
              <Heading as={tag} size={size} role="presentation">
                {example}
              </Heading>
            </TableCell>
            <ValueCell>{tag}</ValueCell>
            <ValueCell>{String(size)}</ValueCell>
            <ValueCell>{face}</ValueCell>
            <TableCell>
              <Code>{`<Heading as="${tag}" size={${size}}>`}</Code>
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
        Pick <Code>as</Code> for the outline (one h1 per page, no skipped levels), then <Code>size</Code> for how big it
        looks.
      </Alert>
      <Alert color="danger" title="Don't" role="note">
        Use a bold Text where a heading belongs. Screen readers move through a page by its headings.
      </Alert>
    </Box>
  );
}

/** Foundations: the faces, the heading tags and the Text sizes. Built only from bit components. */
export function TypographyPage() {
  return (
    <Stack gap={32}>
      <Stack gap={8}>
        <Heading as="h1">Typography</Heading>
        <Text size={18}>
          Four faces and one scale. <Code>Heading</Code> and <Code>Text</Code> work the same way: <Code>as</Code> picks
          the tag, <Code>size</Code> picks the look, in px. Use Heading for titles, so they're in the page outline, and
          Text for everything else.
        </Text>
      </Stack>
      <Stack gap={12}>
        <Heading>Faces</Heading>
        <Faces />
      </Stack>
      <Stack gap={12}>
        <Heading>Headings</Heading>
        <HeadingTags />
      </Stack>
      <Stack gap={12}>
        <Heading>Text sizes</Heading>
        <TextSizes />
      </Stack>
      <Stack gap={12}>
        <Heading>Do and Don't</Heading>
        <DoAndDont />
      </Stack>
    </Stack>
  );
}
