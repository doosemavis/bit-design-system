import { useId } from 'react';
import type { ReactNode } from 'react';
import { Alert, Card, CardBody, CodeBlock, Heading, Stack, Text } from '@bit-ds/react';

interface Example {
  title: string;
  /** One line on when to reach for it. */
  when: ReactNode;
  sample: ReactNode;
  code: string;
  /** The why, in the primary note, for the one example that needs it. */
  note?: ReactNode;
}

const EXAMPLES: readonly Example[] = [
  {
    title: 'Lead and body',
    when: 'Open a page or a section with an 18px lead, then body copy at the default 16.',
    sample: (
      <>
        <Text size={18}>bit is a retro-styled design system for React.</Text>
        <Text>Every component has a live preview, its props and its accessibility notes.</Text>
      </>
    ),
    code: `<Text size={18}>bit is a retro-styled design system for React.</Text>
<Text>Every component has a live preview, its props and its accessibility notes.</Text>`,
  },
  {
    title: 'Hint or caption',
    when: '14px in neutral steps back: help under a field, a caption under a figure, a timestamp.',
    sample: (
      <Text size={14} color="neutral">
        We only use this to send your receipt.
      </Text>
    ),
    code: `<Text size={14} color="neutral">We only use this to send your receipt.</Text>`,
  },
  {
    title: 'Inline emphasis',
    when: 'as="span" keeps Text inside a sentence; weight="bold" picks out the part that matters.',
    sample: (
      <Text>
        You have{' '}
        <Text as="span" weight="bold">
          3 coins
        </Text>{' '}
        left.
      </Text>
    ),
    code: `<Text>
  You have <Text as="span" weight="bold">3 coins</Text> left.
</Text>`,
  },
  {
    title: 'Big text that is not a title',
    when: '24, 32 and 40 use the display face, for a big number or statement that does not name a section. That face has one weight, so weight does nothing here.',
    sample: <Text size={32}>98 tokens</Text>,
    code: `<Text size={32}>98 tokens</Text>`,
  },
  {
    title: 'Same look, different job',
    when: 'Heading and Text take the same as and size, so at 24 they look alike.',
    sample: (
      <>
        {/* role="presentation" keeps the sample out of this page's own outline; its tag is still h2. */}
        <Heading as="h2" size={24} role="presentation">
          Release notes
        </Heading>
        <Text size={24}>Release notes</Text>
      </>
    ),
    code: `<Heading as="h2" size={24}>Release notes</Heading>
<Text size={24}>Release notes</Text>`,
    note: (
      <>
        Only the Heading is an h2. Screen readers list it and jump to it, search engines read it as a section, and
        reader modes build their outline from it. If it names a section, use Heading. If it is only big, use Text.
      </>
    ),
  },
];

function ExampleCard({ title, when, sample, code, note }: Example) {
  const titleId = useId();
  return (
    <Card role="article" aria-labelledby={titleId}>
      <CardBody>
        <Stack gap={12}>
          <Stack gap={4}>
            <Heading as="h3" size={16} id={titleId}>
              {title}
            </Heading>
            <Text color="neutral">{when}</Text>
          </Stack>
          <div className="gallery-example__body">
            <div className="gallery-example__sample">{sample}</div>
            <CodeBlock code={code} language="jsx" label={`${title} code`} />
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

/** The Text page's Examples: the common jobs for Text, each live beside its code, then Text against Heading. */
export function TextExamples() {
  return (
    <Stack gap={16}>
      {EXAMPLES.map((example) => (
        <ExampleCard key={example.title} {...example} />
      ))}
    </Stack>
  );
}
