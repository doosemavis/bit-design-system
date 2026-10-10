import type { ReactNode } from 'react';
import {
  Alert,
  Badge,
  Box,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
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
  headingTag,
} from '@bit-ds/react';
import type { TextProps } from '@bit-ds/react';
import { PageSection } from '../ui/PageSection';

/**
 * power-up's four fonts. Each sample is two lines from retro games, set in the font through
 * `.gallery-face[data-face]` in gallery.css; the "In use" sample is a real component that uses it.
 */
const FONTS: readonly { face: string; name: string; use: string; quotes: readonly string[]; inUse: ReactNode }[] = [
  {
    face: 'display',
    name: 'Lilita One',
    quotes: [
      "It's dangerous to go alone! Take this.",
      'Thank you Mario! But our princess is in another castle!',
    ],
    use: 'Every Heading, and Text at 24 to 40.',
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
      'Hey! Listen!',
      'Do a barrel roll!',
    ],
    use: 'Body copy, labels, Buttons and Fields.',
    inUse: <Text>Every component has a live preview, its props and its accessibility notes.</Text>,
  },
  {
    face: 'pixel',
    name: 'Press Start 2P',
    quotes: [
      'INSERT COIN TO CONTINUE',
      'HIGH SCORE! ENTER YOUR INITIALS',
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
      'You are in a maze of twisty little passages, all alike.',
      'It is pitch black. You are likely to be eaten by a grue.',
    ],
    use: 'Code and CodeBlock.',
    inUse: <Code>npm i @bit-ds/react</Code>,
  },
];

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

/** The styles Text takes, each on a word in a sentence, as you'd use them. */
const TEXT_STYLES: readonly { prop: string; props: TextProps; code: string }[] = [
  { prop: 'weight="bold"', props: { weight: 'bold' }, code: '<Text weight="bold">' },
  { prop: 'italic', props: { italic: true }, code: '<Text italic>' },
  { prop: 'underline', props: { underline: true }, code: '<Text underline>' },
  { prop: 'strikethrough', props: { strikethrough: true }, code: '<Text strikethrough>' },
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

/** A group's small label inside a font card. */
function GroupLabel({ children }: { children: string }) {
  return (
    <Text size={14} weight="bold" color="neutral">
      {children}
    </Text>
  );
}

/**
 * One card per font, in three parts: the header names the font (in it) and its token; the body holds the
 * Sample (two game quotes, in the font) and In use (a real component) groups; the footer says what it's used for.
 */
function Fonts() {
  return (
    <Box className="gallery-grid gallery-grid--fonts">
      {FONTS.map(({ face, name, use, quotes, inUse }) => (
        <Card key={face} role="article" aria-label={name}>
          <CardHeader>
            <Stack direction="row" gap={12} justify="between" align="center" wrap>
              <Text size={24} className="gallery-face gallery-face--name" data-face={face}>
                {name}
              </Text>
              <Code>{`--bit-font-${face}`}</Code>
            </Stack>
          </CardHeader>
          <CardBody className="gallery-font-card__body">
            <Stack gap={24}>
              <Stack gap={8} align="start" data-group="sample">
                <GroupLabel>Sample</GroupLabel>
                <Stack gap={12} align="start">
                  {quotes.map((quote) => (
                    <Text key={quote} size={18} className="gallery-face gallery-face--sample" data-face={face}>
                      {`“${quote}”`}
                    </Text>
                  ))}
                </Stack>
              </Stack>
              <Stack gap={8} align="start" data-group="in-use">
                <GroupLabel>In use</GroupLabel>
                {inUse}
              </Stack>
            </Stack>
          </CardBody>
          <CardFooter className="gallery-font-card__footer">
            <Text size={14}>
              <Text size={14} weight="bold">
                Used for
              </Text>{' '}
              {use}
            </Text>
          </CardFooter>
        </Card>
      ))}
    </Box>
  );
}

/** How many sizes render each tag, so a tag's cell spans all its rows. */
const TAG_ROWS: Readonly<Record<string, number>> = HEADINGS.reduce<Record<string, number>>(
  (counts, size) => ({ ...counts, [headingTag(size)]: (counts[headingTag(size)] ?? 0) + 1 }),
  {},
);

/**
 * Each sample is a real Heading, so it shows the real look. role="presentation" keeps it out of the page outline.
 * A tag's cell spans every size that renders it, with a bracket that groups those sizes.
 */
function HeadingSizes() {
  return (
    <Table aria-label="Headings">
      <HeadRow values={['Size', 'Tag']} />
      <TableBody>
        {HEADINGS.map((size, i) => {
          const tag = headingTag(size);
          const firstOfTag = i === 0 || headingTag(HEADINGS[i - 1]!) !== tag;
          return (
            <TableRow key={size} data-tag={tag}>
              <TableCell>
                <Heading size={size} role="presentation">
                  {TAG_EXAMPLE[tag]}
                </Heading>
              </TableCell>
              <ValueCell>{String(size)}</ValueCell>
              {firstOfTag ? (
                <TableCell rowSpan={TAG_ROWS[tag]} className="gallery-cell-center gallery-tag-group">
                  <span className="gallery-tag-group__bracket" aria-hidden="true" />
                  <Text weight="bold">{tag}</Text>
                </TableCell>
              ) : null}
              <TableCell>
                <Code>{`<Heading size={${size}}>`}</Code>
              </TableCell>
            </TableRow>
          );
        })}
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

/** Each style on one word of a sentence, so it shows inline, the way it's used. */
function TextStyles() {
  return (
    <Table aria-label="Text styles">
      <HeadRow values={['Prop']} />
      <TableBody>
        {TEXT_STYLES.map(({ prop, props, code }) => (
          <TableRow key={prop}>
            <TableCell>
              <Text>
                Press <Text {...props}>Start</Text> to play
              </Text>
            </TableCell>
            <ValueCell>{prop}</ValueCell>
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
    <Stack gap={64}>
      <Stack gap={8}>
        <Heading size={40}>Typography</Heading>
        <Text size={18}>
          Four fonts and two scales, each set with <Code>size</Code> in px. Use <Code>Heading</Code> for titles, so
          they're in the page outline, and <Code>Text</Code> for everything else.
        </Text>
      </Stack>
      <PageSection id="typo-fonts" title="Fonts" landmark={false}>
        <Fonts />
      </PageSection>
      <PageSection id="typo-headings" title="Headings" landmark={false}>
        <Text>
          Every 2px from 20 to 44, all in the display font. The size picks the tag (h1 to h6) that screen readers and
          search engines read, so bigger titles always rank higher.
        </Text>
        <HeadingSizes />
      </PageSection>
      <PageSection id="typo-text-sizes" title="Text sizes" landmark={false}>
        <TextSizes />
      </PageSection>
      <PageSection id="typo-text-styles" title="Text styles" landmark={false}>
        <Text>
          Bold, italic, underline and strikethrough, each a prop on Text. They combine, and a Text inside a sentence
          stays inline.
        </Text>
        <TextStyles />
      </PageSection>
      <PageSection id="typo-do-dont" title="Do and Don't" landmark={false}>
        <DoAndDont />
      </PageSection>
    </Stack>
  );
}
