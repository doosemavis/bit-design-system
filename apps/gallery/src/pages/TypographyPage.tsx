import type { ReactNode } from 'react';
import {
  Alert,
  Badge,
  Box,
  Card,
  CardBody,
  Code,
  HEADING_SIZES,
  Heading,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Text,
} from '@bit-ds/react';
import type { HeadingSize, TextProps } from '@bit-ds/react';

/** The specimen every font shows: both cases, the digits and some punctuation. */
const SPECIMEN = 'ABCDEFGHIJKLM NOPQRSTUVWXYZ abcdefghijklm nopqrstuvwxyz 0123456789 !?&@';

/** A line from a retro game, shown in a font's card as a sample of that font in real words. */
interface Quote {
  text: string;
  from: string;
}

/**
 * power-up's four fonts, each with its specimen and a real component set in it. The specimen is set in the font
 * through `.gallery-face[data-face]` in gallery.css; the "In use" sample is the component itself.
 */
const FONTS: readonly { face: string; name: string; use: string; quotes: readonly Quote[]; inUse: ReactNode }[] = [
  {
    face: 'display',
    name: 'Lilita One',
    quotes: [
      { text: "It's dangerous to go alone! Take this.", from: 'The Legend of Zelda (1986)' },
      { text: 'Thank you Mario! But our princess is in another castle!', from: 'Super Mario Bros. (1985)' },
    ],
    use: 'Every Heading (20 to 44), and Text at 24, 32 and 40.',
    // role="presentation" keeps the sample out of the page outline.
    inUse: (
      <Heading size={28} role="presentation">
        Level complete
      </Heading>
    ),
  },
  {
    face: 'body',
    name: 'Nunito',
    quotes: [
      { text: 'Hey! Listen!', from: 'The Legend of Zelda: Ocarina of Time (1998)' },
      { text: 'Do a barrel roll!', from: 'Star Fox 64 (1997)' },
    ],
    use: 'Body copy and labels: Text at 14, 16 and 18, Buttons and Fields.',
    inUse: <Text>Every component has a live preview, its props and its accessibility notes.</Text>,
  },
  {
    face: 'pixel',
    name: 'Press Start 2P',
    quotes: [
      { text: 'ALL YOUR BASE ARE BELONG TO US.', from: 'Zero Wing (1991)' },
      { text: 'A WINNER IS YOU', from: 'Pro Wrestling (1987)' },
    ],
    use: 'Badges, table headers and small labels.',
    inUse: (
      <Stack direction="row" gap={8} wrap>
        <Badge>New</Badge>
        <Badge color="success">Ready</Badge>
      </Stack>
    ),
  },
  {
    face: 'mono',
    name: 'JetBrains Mono',
    quotes: [
      { text: 'War. War never changes.', from: 'Fallout (1997)' },
      { text: 'I am Error.', from: 'Zelda II: The Adventure of Link (1987)' },
    ],
    use: 'Code and CodeBlock.',
    inUse: <Code>npm i @bit-ds/react</Code>,
  },
];

/** The tag each heading size renders, as Heading picks it: 40 and up h1, 32 to 38 h2, 26 to 30 h3, 24 h4, 22 h5, 20 h6. */
function tagOf(size: HeadingSize): string {
  if (size >= 40) return 'h1';
  if (size >= 32) return 'h2';
  if (size >= 26) return 'h3';
  return { 24: 'h4', 22: 'h5', 20: 'h6' }[size as 24 | 22 | 20];
}

/** What each tag is for, as the sample text of its rows. */
const TAG_EXAMPLE: Readonly<Record<string, string>> = {
  h1: 'Page title',
  h2: 'Section',
  h3: 'Subsection',
  h4: 'Group title',
  h5: 'Small title',
  h6: 'Smallest title',
};

/** Largest first, like the page outline. */
const HEADINGS = [...HEADING_SIZES].reverse();

const TEXT_SIZES: readonly { props: TextProps; example: string; size: string; code: string }[] = [
  { props: { size: 18 }, example: 'Lead paragraph', size: '18', code: '<Text size={18}>' },
  { props: {}, example: 'Body copy, the default', size: '16', code: '<Text>' },
  { props: { size: 14, color: 'neutral' }, example: 'Hints and captions', size: '14', code: '<Text size={14} color="neutral">' },
];

/** A value column (size, tag, token): muted text, centered under its heading. */
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

/**
 * One card per font: its name, specimen and two retro game quotes set in it, a real component that uses it, its
 * token and its jobs.
 */
function Fonts() {
  return (
    <Box className="gallery-grid gallery-grid--fonts">
      {FONTS.map(({ face, name, use, quotes, inUse }) => (
        <Card key={face} role="article" aria-label={name}>
          <CardBody>
            <Stack gap={12} align="start">
              <Text size={24} className="gallery-face" data-face={face}>
                {name}
              </Text>
              <Text className="gallery-face gallery-face--specimen" data-face={face}>
                {SPECIMEN}
              </Text>
              {quotes.map(({ text, from }) => (
                <Stack key={text} gap={4} align="start" className="gallery-quote">
                  <Text size={18} className="gallery-face gallery-face--specimen" data-face={face}>
                    {`“${text}”`}
                  </Text>
                  <Text size={14} color="neutral">
                    {from}
                  </Text>
                </Stack>
              ))}
              <Stack gap={4} align="start">
                <Text size={14} color="neutral">
                  In use
                </Text>
                {inUse}
              </Stack>
              <Code>{`--bit-font-${face}`}</Code>
              <Text color="neutral">{use}</Text>
            </Stack>
          </CardBody>
        </Card>
      ))}
    </Box>
  );
}

/** Each sample is a real Heading, so it shows the real look. role="presentation" keeps it out of the page outline. */
function HeadingSizes() {
  return (
    <Table aria-label="Headings">
      <HeadRow values={['Size', 'Tag']} />
      <TableBody>
        {HEADINGS.map((size) => (
          <TableRow key={size}>
            <TableCell>
              <Heading size={size} role="presentation">
                {TAG_EXAMPLE[tagOf(size)]}
              </Heading>
            </TableCell>
            <ValueCell>{String(size)}</ValueCell>
            <ValueCell>{tagOf(size)}</ValueCell>
            <TableCell>
              <Code>{`<Heading size={${size}}>`}</Code>
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
        Pick a heading's size by its place on the page: 40 and up for the page title (one per page), 32 to 38 for
        sections, 26 to 30 inside them.
      </Alert>
      <Alert color="danger" title="Don't" role="note">
        Use a bold Text where a heading belongs. Screen readers move through a page by its headings.
      </Alert>
    </Box>
  );
}

/** Foundations: the fonts, the heading sizes and the Text sizes. Built only from bit components. */
export function TypographyPage() {
  return (
    <Stack gap={32}>
      <Stack gap={8}>
        <Heading size={40}>Typography</Heading>
        <Text size={18}>
          Four fonts and two scales, each set with <Code>size</Code> in px. Use <Code>Heading</Code> for titles, so
          they're in the page outline, and <Code>Text</Code> for everything else.
        </Text>
      </Stack>
      <Stack gap={12}>
        <Heading>Fonts</Heading>
        <Fonts />
      </Stack>
      <Stack gap={12}>
        <Heading>Headings</Heading>
        <Text>
          Every 2px from 20 to 44, all in the display font. The size picks the tag (h1 to h6) that screen readers and
          search engines read, so bigger titles always rank higher.
        </Text>
        <HeadingSizes />
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
