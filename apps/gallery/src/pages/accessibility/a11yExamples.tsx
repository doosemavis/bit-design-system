import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Alert,
  Badge,
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogFooter,
  DialogHeader,
  Field,
  Heading,
  Icon,
  IconButton,
  Input,
  Link,
  ModeToggle,
  Spinner,
  Stack,
  Tab,
  TabList,
  TabPanel,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Text,
  iconDelete,
  iconFavorite,
  iconSettings,
} from '@bit-ds/react';
import type { Example } from '../../ui/ExampleCard';

/** A live confirm Dialog: open it, press Esc or Cancel, and focus lands back on the button that opened it. */
function DeleteSaveDemo() {
  const [open, setOpen] = useState(false);
  return (
    // align="start" keeps the button at its own width in the sample's frame.
    <Stack align="start">
      <Button color="danger" onClick={() => setOpen(true)}>
        Delete save
      </Button>
      <Dialog open={open} onOpenChange={setOpen} alert size="sm">
        <DialogHeader>Delete this save?</DialogHeader>
        <DialogBody>
          <Text>World 1-2 and every coin in it will be gone.</Text>
        </DialogBody>
        <DialogFooter>
          <DialogClose data-autofocus>Cancel</DialogClose>
          <DialogClose variant="solid" color="danger">
            Delete
          </DialogClose>
        </DialogFooter>
      </Dialog>
    </Stack>
  );
}

export const KEYBOARD_EXAMPLES: readonly Example[] = [
  {
    title: 'Keep the Tab order the reading order',
    when: 'Tab follows the source, so write elements in the order people read them. Stack direction="row" never reorders anything; CSS order and a positive tabIndex do, so leave them out.',
    sample: (
      <Stack direction="row" gap={8} justify="between">
        <Button variant="outline" color="neutral">
          Back
        </Button>
        <Button>Next</Button>
      </Stack>
    ),
    code: `<Stack direction="row" gap={8} justify="between">
  <Button variant="outline" color="neutral">Back</Button>
  <Button>Next</Button>
</Stack>`,
  },
  {
    title: 'Let Dialog handle focus',
    when: 'Open it, then try Tab, Esc and Cancel. Focus starts on Cancel (data-autofocus, the safe choice), stays inside while it is open, and goes back to the button when it closes.',
    sample: <DeleteSaveDemo />,
    code: `<Button color="danger" onClick={() => setOpen(true)}>Delete save</Button>
<Dialog open={open} onOpenChange={setOpen} alert size="sm">
  <DialogHeader>Delete this save?</DialogHeader>
  <DialogBody>
    <Text>World 1-2 and every coin in it will be gone.</Text>
  </DialogBody>
  <DialogFooter>
    <DialogClose data-autofocus>Cancel</DialogClose>
    <DialogClose variant="solid" color="danger">Delete</DialogClose>
  </DialogFooter>
</Dialog>`,
  },
  {
    title: 'Arrow keys inside a group',
    when: 'Tab into the tabs, then use Left and Right. A group like Tabs or SegmentedControl is one Tab stop, so the page stays quick to move through.',
    sample: (
      <Tabs defaultValue="items">
        <TabList aria-label="Inventory">
          <Tab value="items">Items</Tab>
          <Tab value="map">Map</Tab>
          <Tab value="quests">Quests</Tab>
        </TabList>
        <TabPanel value="items">
          <Text>3 potions, 1 key.</Text>
        </TabPanel>
        <TabPanel value="map">
          <Text>World 1-2.</Text>
        </TabPanel>
        <TabPanel value="quests">
          <Text>Find the princess.</Text>
        </TabPanel>
      </Tabs>
    ),
    code: `<Tabs defaultValue="items">
  <TabList aria-label="Inventory">
    <Tab value="items">Items</Tab>
    <Tab value="map">Map</Tab>
    <Tab value="quests">Quests</Tab>
  </TabList>
  <TabPanel value="items"><Text>3 potions, 1 key.</Text></TabPanel>
  …
</Tabs>`,
  },
  {
    title: 'Add a skip link',
    when: 'Make it the first thing on the page, so keyboard users can jump past the header and nav. This site has one: press Tab once from the top of any page.',
    sample: (
      <Link href="#a11y-keyboard" color="neutral">
        Skip to content
      </Link>
    ),
    code: `<Link href="#main" color="neutral" className="skip-link">Skip to content</Link>
…
<main id="main" tabIndex={-1}>…</main>`,
    note: 'Hide it until it has focus with your own CSS (move it on screen on :focus), never with display: none, or Tab can never reach it.',
  },
];

export const SCREEN_READER_EXAMPLES: readonly Example[] = [
  {
    title: 'Name every icon-only button',
    when: 'An icon says nothing to a screen reader. IconButton requires label, and that is what people hear: "Delete file, button".',
    sample: (
      <Stack direction="row" gap={8}>
        <IconButton icon={iconDelete} label="Delete file" />
        <IconButton icon={iconSettings} label="Settings" />
      </Stack>
    ),
    code: `<IconButton icon={iconDelete} label="Delete file" />
<IconButton icon={iconSettings} label="Settings" />`,
  },
  {
    title: 'Hide decorative icons, name meaningful ones',
    when: 'An Icon beside words that already say it is decoration: leave label off and screen readers skip it. An Icon that carries meaning on its own needs a label.',
    sample: (
      <Stack gap={8} align="start">
        <Text>
          <Icon icon={iconFavorite} /> Favorites
        </Text>
        <Text>
          Level 3 <Icon icon={iconFavorite} label="Favorite" color="danger" />
        </Text>
      </Stack>
    ),
    code: `<Text><Icon icon={iconFavorite} /> Favorites</Text>
<Text>Level 3 <Icon icon={iconFavorite} label="Favorite" color="danger" /></Text>`,
  },
  {
    title: 'Give every field a label, and say what went wrong',
    when: 'Field ties the label, hint and error to the control, so a screen reader reads all three, and error marks the field invalid. A placeholder is not a label: it disappears as someone types.',
    sample: (
      <Stack gap={12}>
        <Field label="Email" hint="We only use it to send your receipt." required>
          <Input type="email" />
        </Field>
        <Field label="Player name" error="Pick a name with at least 3 letters.">
          <Input defaultValue="Jo" />
        </Field>
      </Stack>
    ),
    code: `<Field label="Email" hint="We only use it to send your receipt." required>
  <Input type="email" />
</Field>
<Field label="Player name" error="Pick a name with at least 3 letters.">
  <Input defaultValue="Jo" />
</Field>`,
  },
  {
    title: 'Keep titles in order',
    when: "Heading's size picks its tag, so going down in size goes down the outline: 40 is the page's h1, 32 a section's h2, 26 an h3 inside it.",
    sample: (
      // role="presentation" keeps the samples out of this page's own outline; their tags are still h1, h2 and h3.
      <Stack gap={8}>
        <Heading size={40} role="presentation">
          Settings
        </Heading>
        <Heading size={32} role="presentation">
          Profile
        </Heading>
        <Heading size={26} role="presentation">
          Photo
        </Heading>
      </Stack>
    ),
    code: `<Heading size={40}>Settings</Heading>
<Heading size={32}>Profile</Heading>
<Heading size={26}>Photo</Heading>`,
    note: 'Jumping from a 40 page title straight to 24 skips h2 and h3. Screen-reader users move through a page by its headings, and a gap makes them wonder what they missed.',
  },
  {
    title: 'Tell people what happened, without moving them',
    when: 'Alert is a status region by default: a screen reader reads it when it appears, and focus stays where the person is.',
    sample: (
      <Alert color="success" title="Saved">
        Your changes are saved.
      </Alert>
    ),
    code: `<Alert color="success" title="Saved">
  Your changes are saved.
</Alert>`,
    note: 'Use role="alert" only for an error that needs attention now: it interrupts whatever the screen reader is reading.',
  },
  {
    title: 'Say what is loading',
    when: 'Spinner is a status region with a required aria-label, so a screen reader says what the wait is for, not just "busy".',
    sample: <Spinner aria-label="Loading your saves" />,
    code: `<Spinner aria-label="Loading your saves" />`,
  },
  {
    title: 'Links go, buttons do',
    when: 'A Link takes people somewhere; a Button does something on this page. Screen readers list them apart, and they answer to different keys. Write link text that makes sense alone: "Read the guide", not "click here".',
    sample: (
      <Stack direction="row" gap={12} align="center" wrap>
        <Link asChild>
          <RouterLink to="/getting-started">Read the guide</RouterLink>
        </Link>
        <Button>Save</Button>
      </Stack>
    ),
    code: `<Link href="/guide">Read the guide</Link>
<Button>Save</Button>`,
  },
  {
    title: 'Name tables',
    when: 'A name tells screen-reader users what a table holds before they enter it, and a table that may scroll needs one to be a named, scrollable region.',
    sample: (
      <Table aria-label="High scores">
        <TableHead>
          <TableRow>
            <TableCell>Player</TableCell>
            <TableCell>Score</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>MOO</TableCell>
            <TableCell>98,400</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>BIT</TableCell>
            <TableCell>72,100</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    ),
    code: `<Table aria-label="High scores">
  <TableHead>
    <TableRow><TableCell>Player</TableCell><TableCell>Score</TableCell></TableRow>
  </TableHead>
  <TableBody>…</TableBody>
</Table>`,
  },
];

export const VISION_EXAMPLES: readonly Example[] = [
  {
    title: 'Say it in words, not just color',
    when: 'Some people cannot tell red from green, and some use a screen without color. Put the meaning in the text, and let color back it up.',
    sample: (
      <Stack direction="row" gap={8} wrap>
        <Badge color="success">Passed</Badge>
        <Badge color="danger">Failed</Badge>
      </Stack>
    ),
    code: `<Badge color="success">Passed</Badge>
<Badge color="danger">Failed</Badge>`,
  },
  {
    title: 'Keep reading text at 16, captions at 14',
    when: 'Body text defaults to 16. Use 14 only for hints and captions that step back, never for paragraphs people need to read.',
    sample: (
      <Stack gap={4}>
        <Text>Every component has a live preview and its props.</Text>
        <Text size={14} color="neutral">
          Updated 2 days ago.
        </Text>
      </Stack>
    ),
    code: `<Text>Every component has a live preview and its props.</Text>
<Text size={14} color="neutral">Updated 2 days ago.</Text>`,
  },
  {
    title: 'Respect the light or dark choice',
    when: 'bit follows the system setting until someone picks; ModeToggle lets them pick. Both modes pass the same contrast checks, so check your own colors in both too.',
    sample: <ModeToggle />,
    code: `<ModeToggle />`,
  },
];

export const MOTION_EXAMPLES: readonly Example[] = [
  {
    title: 'Check Reduce motion for movement in JavaScript',
    when: "With Reduce motion on, bit's stylesheet stops CSS animations and transitions across the page, yours included. Movement you start in JavaScript, like a smooth scroll, is yours to check.",
    sample: <Spinner aria-label="Loading" />,
    code: `const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });`,
    language: 'ts',
    note: 'Turn on Reduce motion in your system settings and this Spinner stops turning. It still says "Loading" to screen readers.',
  },
];
