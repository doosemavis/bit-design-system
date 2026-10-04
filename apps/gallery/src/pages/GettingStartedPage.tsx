import { CodeBlock, Link, ModeToggle, COLOR_MODE_SCRIPT, Stack, Text } from '@bit-ds/react';
import { Link as RouterLink } from 'react-router-dom';
import { PageHeader } from '../ui/PageHeader';
import { GetStarted, Step } from './getting-started/GetStarted';

const NO_FLASH_EXAMPLE = `<script>${COLOR_MODE_SCRIPT}</script>`;

const NEXT_STEPS = [
  { label: 'Tokens', to: '/tokens', note: 'the colours, sizes and spacing every component reads' },
  // Goes to Home, not an anchor: hash routing has no in-page anchors to link to.
  { label: 'The naming rule', to: '/', note: 'on Home: the prop you type is the class it emits' },
  { label: 'Button', to: '/components/button', note: 'the first component, with live controls' },
] as const;

/** Five steps from nothing to a styled component, in light and dark. */
export function GettingStartedPage() {
  return (
    <Stack gap={32}>
      <PageHeader eyebrow="Start here" title="Getting started">
        <Text size={18}>Install the package, add the styles once, and use your first component.</Text>
      </PageHeader>
      <Stack gap={24}>
        <GetStarted />
        <Step
          n={4}
          title="Light and dark"
          help="Try the toggle. To stop a dark visitor seeing a light flash, put this script in your page's head before your app loads."
        >
          {/* The step's Stack stretches its children; this keeps the toggle at its own size. */}
          <Stack align="start">
            <ModeToggle />
          </Stack>
          <CodeBlock code={NO_FLASH_EXAMPLE} language="html" label="No-flash script" />
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
