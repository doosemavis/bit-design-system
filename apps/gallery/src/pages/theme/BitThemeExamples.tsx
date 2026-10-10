import { BitTheme, Box, Button, Code, ModeToggle, Stack, Text, colorMode, useColorMode } from '@bit-ds/react';
import type { ReactNode } from 'react';
import { ExampleList } from '../../ui/ExampleCard';
import type { Example } from '../../ui/ExampleCard';

/** A small page in one mode: what a whole app looks like with that class (or attribute) on <html>. */
function MiniPage({ mode, label, attribute }: { mode: 'light' | 'dark'; label: ReactNode; attribute: boolean }) {
  const content = (
    <Box padding={16}>
      <Stack gap={8} align="start">
        <Text weight="bold">{label}</Text>
        <Button size="sm">Save</Button>
      </Stack>
    </Box>
  );
  // The attribute form, written by hand: bit-theme paints the page color, data-* pick the theme and mode.
  return attribute ? (
    <div className="bit-theme" data-theme="power-up" data-mode={mode}>
      {content}
    </div>
  ) : (
    <BitTheme theme="power-up" mode={mode}>
      {content}
    </BitTheme>
  );
}

/** The two mini pages side by side. */
function BothModes({ light, dark, attribute = false }: { light: ReactNode; dark: ReactNode; attribute?: boolean }) {
  return (
    <Stack direction="row" gap={12} wrap>
      <MiniPage mode="light" label={light} attribute={attribute} />
      <MiniPage mode="dark" label={dark} attribute={attribute} />
    </Stack>
  );
}

/** Buttons that switch this whole site, and what colorMode wrote on <html>. */
function SwitchFromCode() {
  const { mode } = useColorMode();
  return (
    <Stack gap={12} align="start">
      <Stack direction="row" gap={8} wrap>
        <Button size="sm" variant="outline" onClick={() => colorMode.set('dark')}>
          Dark
        </Button>
        <Button size="sm" variant="outline" onClick={() => colorMode.toggle()}>
          Toggle
        </Button>
        <Button size="sm" variant="ghost" onClick={() => colorMode.set('system')}>
          Follow the system
        </Button>
      </Stack>
      <Text>
        Showing <Code>{mode}</Code>.
      </Text>
    </Stack>
  );
}

const EXAMPLES: readonly Example[] = [
  {
    title: 'Whole app',
    when: 'Name the theme and the mode once, on <html> in index.html, so they apply before the page paints.',
    sample: <BothModes light={<Code>bit-light</Code>} dark={<Code>bit-dark</Code>} />,
    code: `<html lang="en" class="bit-theme-power-up bit-light">
<!-- or, for a dark app -->
<html lang="en" class="bit-theme-power-up bit-dark">`,
    language: 'html',
    note: 'Put the classes on <html>, not <body>: the page background, the scrollbars and the browser’s own controls take their colors from <html>. power-up is the theme; light and dark are its modes.',
  },
  {
    title: 'Follow the system',
    when: 'data-mode="system" follows the visitor’s OS in CSS alone, with no script. After a click, ModeToggle or colorMode writes bit-light or bit-dark on <html> and remembers it.',
    sample: (
      // The sample frame stretches its children; this keeps the toggle at its own size.
      <Stack align="start">
        <ModeToggle />
      </Stack>
    ),
    code: `<html lang="en" class="bit-theme-power-up" data-mode="system">`,
    language: 'html',
    note: 'There is no class for system: following the OS is a CSS media query on data-mode="system". Choosing light or dark adds the class and sets data-mode to match; choosing system again removes the class.',
  },
  {
    title: 'Scoped',
    when: 'BitTheme gives one part of the page its own mode, such as a dark sidebar or promo band in a light page. It paints its own background.',
    sample: (
      <Stack direction="row" gap={12} wrap>
        <Box padding={16}>
          <Stack gap={8} align="start">
            <Text weight="bold">The page</Text>
            <Button size="sm">Save</Button>
          </Stack>
        </Box>
        <BitTheme mode="dark" asChild>
          <aside aria-label="Dark sidebar sample">
            <Box padding={16}>
              <Stack gap={8} align="start">
                <Text weight="bold">A dark sidebar</Text>
                <Button size="sm">Save</Button>
              </Stack>
            </Box>
          </aside>
        </BitTheme>
      </Stack>
    ),
    code: `<BitTheme mode="dark" asChild>
  <aside>
    <Text weight="bold">A dark sidebar</Text>
    <Button size="sm">Save</Button>
  </aside>
</BitTheme>`,
  },
  {
    title: 'Switching from code',
    when: 'colorMode works from any file: set() and toggle() switch this whole site, remember the choice, and write the bit-light or bit-dark class and data-mode on <html>.',
    sample: <SwitchFromCode />,
    code: `import { colorMode } from '@bit-ds/react';

colorMode.set('dark');   // <html class="… bit-dark" data-mode="dark">
colorMode.toggle();      // light ⇄ dark
colorMode.set('system'); // no class, data-mode="system"`,
  },
  {
    title: 'The data- attribute form',
    when: 'data-mode and data-theme do exactly what the classes do, and keep working. Use whichever suits your markup.',
    sample: <BothModes attribute light={<Code>data-mode=&quot;light&quot;</Code>} dark={<Code>data-mode=&quot;dark&quot;</Code>} />,
    code: `<html lang="en" data-theme="power-up" data-mode="dark">
<!-- is the same as -->
<html lang="en" class="bit-theme-power-up bit-dark">`,
    language: 'html',
    note: 'Pick one form per element. bit-dark and data-mode="light" on the same element disagree, and dark wins.',
  },
];

/** The BitTheme page's Examples: the whole app, following the OS, a scoped subtree, switching from code, and the attribute form. */
export function BitThemeExamples() {
  return <ExampleList examples={EXAMPLES} />;
}
