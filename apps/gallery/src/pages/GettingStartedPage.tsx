import { COLOR_MODE_STORAGE_KEY, Code, CodeBlock, Link, ModeToggle, Stack, Text } from '@bit-ds/react';
import { Link as RouterLink } from 'react-router-dom';
import { Disclosure } from '../ui/Disclosure';
import { PageHeader } from '../ui/PageHeader';
import { GetStarted, Step } from './getting-started/GetStarted';

const HTML_EXAMPLE = '<html lang="en" data-mode="system">  <!-- or "light" / "dark" -->';

const COLOR_MODE_EXAMPLE = `import { colorMode } from '@bit-ds/react';

colorMode.set('dark');   // switch and remember
colorMode.toggle();      // light \u21C4 dark
colorMode.set('system'); // follow the visitor's OS again`;

const SAVED_CHOICE_EXAMPLE = `<script>
  // Use the visitor's saved choice (from the toggle) before your app loads.
  try {
    const saved = localStorage.getItem('${COLOR_MODE_STORAGE_KEY}');
    if (saved === 'light' || saved === 'dark') document.documentElement.dataset.mode = saved;
  } catch {} // storage blocked: the data-mode in your HTML stands
</script>`;

const NEXT_STEPS = [
  { label: 'Tokens', to: '/tokens', note: 'the colours, sizes and spacing every component reads' },
  // Goes to Home, not an anchor: hash routing has no in-page anchors to link to.
  { label: 'The naming rule', to: '/', note: 'on Home: how props, classes and tokens line up' },
  { label: 'Button', to: '/components/button', note: 'the first component, with live controls' },
] as const;

/** Five steps from nothing to a styled component, in light and dark. */
export function GettingStartedPage() {
  return (
    <Stack gap={32}>
      <PageHeader title="Getting started">
        <Text size={18}>Install the package, add the styles once, and use your first component.</Text>
      </PageHeader>
      <Stack gap={24}>
        <GetStarted />
        <Step
          n={4}
          title="Light and dark"
          help={
            <>
              Pick the default in your <Code>index.html</Code>, then switch it from anywhere with <Code>colorMode</Code>. Try the
              toggle.
            </>
          }
        >
          {/* The step's Stack stretches its children; this keeps the toggle at its own size. */}
          <Stack align="start">
            <ModeToggle />
          </Stack>
          <Stack gap={8}>
            <Text as="h3" weight="bold" className="gallery-caption">
              In <Code>index.html</Code>
            </Text>
            <CodeBlock code={HTML_EXAMPLE} language="html" label="index.html" />
          </Stack>
          <Stack gap={8}>
            <Text as="h3" weight="bold" className="gallery-caption">
              In any file
            </Text>
            <CodeBlock code={COLOR_MODE_EXAMPLE} language="jsx" label="Any file" />
          </Stack>
          <Disclosure title="Optional: use a saved choice before the page draws">
            <Stack gap={8}>
              <Text>
                Without this, a returning visitor's saved choice applies once your app loads. This script applies it earlier.{' '}
                <Code>COLOR_MODE_SCRIPT</Code> is the same thing as a string, for frameworks that render <Code>&lt;head&gt;</Code> in
                React.
              </Text>
              <CodeBlock code={SAVED_CHOICE_EXAMPLE} language="html" label="Saved-choice script" />
            </Stack>
          </Disclosure>
        </Step>
        <Step n={5} title="Next steps" help="Where to go from here.">
          <Stack gap={8}>
            {NEXT_STEPS.map((step) => (
              <Text key={step.label}>
                <Link asChild>
                  <RouterLink to={step.to}>{step.label}</RouterLink>
                </Link>{' '}
                {step.note}
              </Text>
            ))}
          </Stack>
        </Step>
      </Stack>
    </Stack>
  );
}
