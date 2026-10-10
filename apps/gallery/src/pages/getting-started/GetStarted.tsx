import type { ReactNode } from 'react';
import { Badge, Button, Card, CardBody, Code, CodeBlock, Heading, Stack, Text } from '@bit-ds/react';
import { SECTION_CLASS, SECTION_TITLE_CLASS } from '../../ui/PageSection';
import { BUILD_VERSION } from '../../buildVersion';
import { InstallCommand } from '../../content/InstallCommand';
import { GLOBAL_CSS_IMPORTS, STYLE_IMPORTS } from '../../content/styleImports';

/** A whole component file, so nobody has to guess where the element goes. The "It renders" Card shows the same tree. */
const FIRST_COMPONENT = `import { Button, Stack } from '@bit-ds/react';

export function Toolbar() {
  return (
    <Stack direction="row" gap={8} wrap>
      <Button>Save</Button>
      <Button color="danger">Delete</Button>
      <Button className="bit-danger">Delete</Button>
    </Stack>
  );
}`;

const USE_IT = `import { Toolbar } from './Toolbar';

export default function App() {
  return <Toolbar />;
}`;

interface StepProps {
  n: number;
  title: string;
  /** Shown after the title, outside the heading: the version on the Install step. */
  aside?: ReactNode;
  /** One line under the heading. JSX, so it can hold inline Code. */
  help: ReactNode;
  children: ReactNode;
}

/**
 * One numbered step of Getting started: its title is a level-2 heading on that page. The number and heading sit
 * above a Card that frames the rest, so every step looks the same.
 */
export function Step({ n, title, aside, help, children }: StepProps) {
  return (
    <Stack gap={16} data-step={n} className={SECTION_CLASS}>
      <Stack direction="row" gap={8} align="center" wrap>
        <Badge color="warning" shape="square">
          {String(n)}
        </Badge>
        <Heading className={SECTION_TITLE_CLASS}>{title}</Heading>
        {aside}
      </Stack>
      <Card>
        <CardBody>
          <Stack gap={24}>
            <Text>{help}</Text>
            {children}
          </Stack>
        </CardBody>
      </Card>
    </Stack>
  );
}

/**
 * The first three numbered steps (the Getting started page adds two): install, add the styles once, use a
 * component. A fragment, so every step is a sibling in the page's Stack and gets the same section break.
 */
export function GetStarted() {
  return (
    <>
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
      <Step
        n={2}
        title="Add the styles once"
        help="Two stylesheets, added once for the whole app. CSS imported in React is global, so every component in every folder gets these styles."
      >
        <ul className="gallery-bullets">
          <li>
            <Code>themes/power-up.css</Code>: the theme. Colors, fonts and sizes as <Code>--bit-*</Code> tokens, in light and dark.
            It comes first.
          </li>
          <li>
            <Code>styles.css</Code>: the component styles. They read the theme's tokens.
          </li>
        </ul>
        <Stack gap={8}>
          <Text weight="bold" className="gallery-caption">
            In your entry file
          </Text>
          <Text>
            <Code>src/main.tsx</Code> in Vite, <Code>app/layout.tsx</Code> in Next.js.
          </Text>
          <CodeBlock code={STYLE_IMPORTS} language="tsx" label="Style imports" />
        </Stack>
        <Stack gap={8}>
          <Text weight="bold" className="gallery-caption">
            Or in your global stylesheet
          </Text>
          <Text>
            At the very top of <Code>src/index.css</Code> (Vite) or <Code>app/globals.css</Code> (Next.js), before any other rule.
          </Text>
          <CodeBlock code={GLOBAL_CSS_IMPORTS} language="css" label="Global stylesheet imports" />
        </Stack>
        <Text>
          Pick one. You don't import them again in each component: the component examples on this site leave them out for
          that reason.
        </Text>
      </Step>
      <Step
        n={3}
        title="Use a component"
        help={
          <>
            Import what you need from <Code>@bit-ds/react</Code> at the top of a component file, then put it in the JSX that
            component returns.
          </>
        }
      >
        {/* Two parts, 24px apart, so the big code blocks and their labels don't run together. */}
        <Stack gap={24}>
          <Stack gap={16} data-step-part="1">
            {/* The code and what it renders, side by side (stacked on a phone). */}
            <div className="gallery-split">
              <Stack gap={8} className="gallery-split__code">
                <Text weight="bold" className="gallery-caption">
                  1. In a component file, such as <Code>src/Toolbar.tsx</Code>:
                </Text>
                <CodeBlock code={FIRST_COMPONENT} language="tsx" label="First component" />
              </Stack>
              <Stack gap={8}>
                <Text weight="bold" className="gallery-caption">
                  It renders:
                </Text>
                <Card role="region" aria-label="What it renders" className="gallery-split__result">
                  <CardBody>
                    <Stack direction="row" gap={8} wrap>
                      <Button>Save</Button>
                      <Button color="danger">Delete</Button>
                      <Button className="bit-danger">Delete</Button>
                    </Stack>
                  </CardBody>
                </Card>
              </Stack>
            </div>
            <ul className="gallery-bullets">
              <li>
                <Code>import {'{ Button, Stack }'}</Code>: name every component you use, in one import from <Code>@bit-ds/react</Code>.
              </li>
              <li>
                <Code>export function Toolbar()</Code>: your own component. It returns the JSX to show.
              </li>
              <li>
                <Code>{'<Button>Save</Button>'}</Code>: a Button with its defaults. The text between the tags is its label.
              </li>
              <li>
                <Code>color="danger"</Code>: a prop that changes the color.
              </li>
              <li>
                <Code>className="bit-danger"</Code>: the same change written as a class. The last two Buttons look the same.
              </li>
              <li>
                <Code>{'<Stack direction="row" gap={8} wrap>'}</Code>: lays the Buttons out in a row, 8px apart, and wraps them on a narrow screen.
              </li>
            </ul>
          </Stack>
          <Stack gap={8} data-step-part="2">
            <Text weight="bold" className="gallery-caption">
              2. Then use your component like any other, for example in <Code>src/App.tsx</Code>:
            </Text>
            <CodeBlock code={USE_IT} language="tsx" label="Use it in your app" />
          </Stack>
        </Stack>
      </Step>
    </>
  );
}
