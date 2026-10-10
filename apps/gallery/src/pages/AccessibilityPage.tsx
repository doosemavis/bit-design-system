import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Card, CardBody, CardHeader, Code, Link, Stack, Table, TableBody, TableCell, TableHead, TableRow, Text } from '@bit-ds/react';
import { MANIFESTS, routeFor } from '../manifests';
import { ExampleList } from '../ui/ExampleCard';
import { KEYBOARD_EXAMPLES, MOTION_EXAMPLES, SCREEN_READER_EXAMPLES, VISION_EXAMPLES } from './accessibility/a11yExamples';
import { PageHeader } from '../ui/PageHeader';
import { PageSection } from '../ui/PageSection';
import { SectionBar } from '../ui/SectionBar';

const SECTIONS = [
  { id: 'a11y-built-in', title: 'Built in' },
  { id: 'a11y-keyboard', title: 'Keyboard' },
  { id: 'a11y-screen-readers', title: 'Screen readers' },
  { id: 'a11y-vision', title: 'Color and vision' },
  { id: 'a11y-motion', title: 'Motion' },
  { id: 'a11y-checklist', title: 'Before you ship' },
] as const;

/** What bit does for every app that uses it, without any setup. */
const BUILT_IN: readonly { title: string; body: ReactNode }[] = [
  {
    title: 'Real HTML',
    body: (
      <>
        Buttons are <Code>{'<button>'}</Code>, links are <Code>{'<a href>'}</Code>, tables are <Code>{'<table>'}</Code>,
        fields are <Code>{'<input>'}</Code> with a <Code>{'<label>'}</Code>, and Dialog is the native{' '}
        <Code>{'<dialog>'}</Code>. Browsers and screen readers already know how to use them.
      </>
    ),
  },
  {
    title: 'Contrast, tested',
    body: 'Text is at least 4.5:1 on its background, and borders and icons at least 3:1, in light and dark. A test checks every pair, so a token change cannot quietly break it.',
  },
  {
    title: 'A focus ring you can see',
    body: 'Every focusable element shows a 2px ring when it has keyboard focus: violet in light mode, yellow in dark. Nothing in bit removes it.',
  },
  {
    title: 'Readable sizes',
    body: 'No reading text is under 14px, and body text is 16. Sizes are px tokens, so browser zoom scales the whole page together.',
  },
  {
    title: 'Reduced motion',
    body: "With Reduce motion on, bit's stylesheet stops CSS animations and transitions across the page: Dialog, Tabs, Select, Tooltip and Spinner change at once.",
  },
  {
    title: 'High contrast',
    body: 'In Windows high contrast (forced colors), borders, focus rings and chosen states switch to the system colors, so nothing disappears.',
  },
  {
    title: 'Announced, not interrupting',
    body: "Alert and Spinner are status regions: screen readers read them when they change, without moving focus. CodeBlock's Copy result is announced the same way.",
  },
  {
    title: 'Checked on every change',
    body: "Every component's tests run axe, an automated accessibility checker, and so does every component page on this site.",
  },
];

/** The keys each interactive component answers to, by its manifest name. */
const KEYS: readonly { component: string; keys: string }[] = [
  { component: 'Button', keys: 'Enter or Space presses it.' },
  { component: 'Link', keys: 'Enter follows it.' },
  { component: 'Switch', keys: 'Space turns it on or off.' },
  { component: 'SegmentedControl', keys: 'Tab enters and leaves the group in one stop; the arrow keys move the choice.' },
  {
    component: 'Select',
    keys: 'Enter, Space or an arrow key opens it. The arrows, Home and End move; typing jumps to a match. Enter chooses, Esc closes without choosing.',
  },
  { component: 'Tabs', keys: 'Left and Right move between tabs, Home and End jump to the ends, and Tab goes into the panel.' },
  { component: 'Dialog', keys: 'Tab stays inside it. Esc closes it, and focus goes back to whatever opened it.' },
  { component: 'Tooltip', keys: 'It opens on keyboard focus as well as hover; Esc closes it.' },
  { component: 'CodeBlock', keys: 'Tab reaches the code, so the arrow keys can scroll long lines.' },
];

/** The checks worth a few minutes before every release of an app built with bit. */
const CHECKLIST: readonly string[] = [
  'Put the mouse away and Tab through the page: every control is reachable, in reading order, with a visible focus ring.',
  'Turn on a screen reader (VoiceOver with Cmd+F5 on a Mac, NVDA on Windows) and finish one task by ear.',
  'Zoom the browser to 200%: nothing overlaps or gets cut off.',
  'Turn on Reduce motion, and check nothing important shows only through animation.',
  'Try dark mode, and Windows high contrast (or emulate forced colors in Chrome DevTools, under Rendering).',
  'Run an automated checker, such as axe DevTools or Lighthouse. It finds some problems, not all: the checks above find the rest.',
];

function BuiltIn() {
  return (
    <Box className="gallery-grid gallery-grid--a11y">
      {BUILT_IN.map(({ title, body }) => (
        <Card key={title} role="article" aria-label={title}>
          <CardHeader>{title}</CardHeader>
          <CardBody>
            <Text>{body}</Text>
          </CardBody>
        </Card>
      ))}
    </Box>
  );
}

/** Each component name links to its page. */
function Keyboard() {
  return (
    <Table aria-label="Keys by component">
      <TableHead>
        <TableRow>
          <TableCell>Component</TableCell>
          <TableCell>Keys</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {KEYS.map(({ component, keys }) => {
          const manifest = MANIFESTS.find((m) => m.name === component)!;
          return (
            <TableRow key={component}>
              <TableCell>
                <Link asChild>
                  <RouterLink to={routeFor(manifest)}>{component}</RouterLink>
                </Link>
              </TableCell>
              <TableCell>{keys}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

/** How bit handles accessibility, the keys each component answers to, worked examples, and a pre-ship checklist. */
export function AccessibilityPage() {
  return (
    <Stack gap={64}>
      <PageHeader title="Accessibility">
        <Text size={18}>
          bit is built so the people using your app can read it, see where they are, and use it with a keyboard, a
          screen reader or high contrast. It aims for{' '}
          <Link href="https://www.w3.org/WAI/WCAG22/quickref/" target="_blank" rel="noreferrer">
            WCAG 2.2 level AA
          </Link>
          . The components handle what they can; the words, names and page structure are yours.
        </Text>
        <SectionBar sections={SECTIONS} />
      </PageHeader>
      <PageSection {...SECTIONS[0]}>
        <Text>What every app that uses bit gets, with no setup.</Text>
        <BuiltIn />
      </PageSection>
      <PageSection {...SECTIONS[1]}>
        <Text>
          Everything works without a mouse. Tab and Shift+Tab move between controls; these are the keys each one
          answers to once it has focus.
        </Text>
        <Keyboard />
        <ExampleList examples={KEYBOARD_EXAMPLES} />
      </PageSection>
      <PageSection {...SECTIONS[2]}>
        <Text>
          A screen reader reads the page aloud (or in braille) and lets people jump by headings, links, fields and
          landmarks. bit gives each component the right role and state; the names and words are yours.
        </Text>
        <ExampleList examples={SCREEN_READER_EXAMPLES} />
      </PageSection>
      <PageSection {...SECTIONS[3]}>
        <Text>For low vision, color blindness and bright or dim rooms: contrast, size and words that don't lean on color.</Text>
        <ExampleList examples={VISION_EXAMPLES} />
      </PageSection>
      <PageSection {...SECTIONS[4]}>
        <Text>Movement can make some people dizzy or sick, so anything that moves listens to their Reduce motion setting.</Text>
        <ExampleList examples={MOTION_EXAMPLES} />
      </PageSection>
      <PageSection {...SECTIONS[5]}>
        <Text>A few minutes of checks catch most problems before your visitors do.</Text>
        <ul className="gallery-bullets">
          {CHECKLIST.map((item) => (
            <li key={item}>
              <Text>{item}</Text>
            </li>
          ))}
        </ul>
      </PageSection>
    </Stack>
  );
}
