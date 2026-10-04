import type { ReactNode } from 'react';
import { Badge, Code, CodeBlock, Heading, Stack, Text } from '@bit-ds/react';
import { BUILD_VERSION } from '../../buildVersion';
import { InstallCommand } from '../../content/InstallCommand';
import { STYLE_IMPORTS } from '../../content/styleImports';

const FIRST_COMPONENT = "import { Button } from '@bit-ds/react';\n\n<Button>Save</Button>";

interface StepProps {
  n: number;
  title: string;
  /** Shown after the title, outside the heading: the version on the Install step. */
  aside?: ReactNode;
  /** One line under the heading. JSX, so it can hold inline Code. */
  help: ReactNode;
  children: ReactNode;
}

/** One numbered step of Getting started: its title is a level-2 heading on that page. */
export function Step({ n, title, aside, help, children }: StepProps) {
  return (
    <Stack gap={8}>
      <Stack direction="row" gap={8} align="center" wrap>
        <Badge color="warning" shape="square">
          {String(n)}
        </Badge>
        <Heading level={2}>{title}</Heading>
        {aside}
      </Stack>
      <Text>{help}</Text>
      {children}
    </Stack>
  );
}

/** The first three numbered steps (the Getting started page adds two): install, add the styles once, use a component. */
export function GetStarted() {
  return (
    <Stack gap={24}>
      <Step
        n={1}
        title="Install"
        aside={
          <Badge variant="outline" shape="square">
            {`v${BUILD_VERSION}`}
          </Badge>
        }
        help="Add the React package with your package manager."
      >
        <InstallCommand />
      </Step>
      <Step n={2} title="Add the styles once" help="In your app's entry file. The theme comes first, then the component styles.">
        <CodeBlock code={STYLE_IMPORTS} language="jsx" label="Style imports" />
      </Step>
      <Step
        n={3}
        title="Use a component"
        help={
          <>
            Import it and use it. <Code>color="danger"</Code> and <Code>className="bit-danger"</Code> give the same look.
          </>
        }
      >
        <CodeBlock code={FIRST_COMPONENT} language="jsx" label="First component" />
      </Step>
    </Stack>
  );
}
