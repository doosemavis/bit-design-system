import { useId } from 'react';
import type { ReactNode } from 'react';
import type { CodeLanguage } from '@bit-ds/react';
import { Alert, Box, Card, CardBody, CardHeader, CodeBlock, Heading, Stack, Text } from '@bit-ds/react';

/** One worked example: a titled card with the live sample, framed in a Box, beside the code that makes it. */
export interface Example {
  title: string;
  /** One line on when to reach for it. */
  when: ReactNode;
  sample: ReactNode;
  code: string;
  /** The code's language, for highlighting. Default jsx. */
  language?: CodeLanguage;
  /** The why, in the primary note, for an example that needs it. */
  note?: ReactNode;
}

export function ExampleCard({ title, when, sample, code, language = 'jsx', note }: Example) {
  const titleId = useId();
  return (
    <Card role="article" aria-labelledby={titleId}>
      {/* The header's bottom border divides the title and its line from the example. */}
      <CardHeader>
        <Stack gap={4}>
          <Heading size={26} id={titleId}>
            {title}
          </Heading>
          <Text color="neutral">{when}</Text>
        </Stack>
      </CardHeader>
      <CardBody>
        <Stack gap={12}>
          <div className="gallery-example__body">
            <Box padding={16} className="gallery-example__sample">
              {sample}
            </Box>
            <CodeBlock code={code} language={language} label={`${title} code`} />
          </div>
          {note ? (
            <Alert color="primary" role="note">
              {note}
            </Alert>
          ) : null}
        </Stack>
      </CardBody>
    </Card>
  );
}

/** A page's examples, 32px apart (twice the gap inside one card), so each reads as its own block. */
export function ExampleList({ examples }: { examples: readonly Example[] }) {
  return (
    <Stack gap={32}>
      {examples.map((example) => (
        <ExampleCard key={example.title} {...example} />
      ))}
    </Stack>
  );
}
