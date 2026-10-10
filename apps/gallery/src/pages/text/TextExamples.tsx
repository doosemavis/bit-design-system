import { Heading, Text } from '@bit-ds/react';
import { ExampleList } from '../../ui/ExampleCard';
import type { Example } from '../../ui/ExampleCard';

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
    when: 'A Text inside a Text stays in the sentence (it renders a span); weight="bold" picks out the part that matters.',
    sample: (
      <Text>
        You have <Text weight="bold">3 coins</Text> left.
      </Text>
    ),
    code: `<Text>
  You have <Text weight="bold">3 coins</Text> left.
</Text>`,
  },
  {
    title: 'Bold, italic, underline, strikethrough',
    when: 'Each is a prop on a Text inside the sentence, and they combine. Strikethrough suits something no longer true, like an old price.',
    sample: (
      <>
        <Text>
          Press <Text weight="bold">Start</Text> to play, <Text italic>if you dare</Text>.
        </Text>
        <Text>
          Read the <Text underline>whole</Text> manual first.
        </Text>
        <Text>
          Extra lives: <Text strikethrough>500 coins</Text> <Text weight="bold">300 coins</Text>
        </Text>
        <Text>
          <Text weight="bold" italic>
            Bold and italic
          </Text>{' '}
          together.
        </Text>
      </>
    ),
    code: `<Text>
  Press <Text weight="bold">Start</Text> to play, <Text italic>if you dare</Text>.
</Text>
<Text>
  Read the <Text underline>whole</Text> manual first.
</Text>
<Text>
  Extra lives: <Text strikethrough>500 coins</Text> <Text weight="bold">300 coins</Text>
</Text>
<Text>
  <Text weight="bold" italic>Bold and italic</Text> together.
</Text>`,
  },
  {
    title: 'Big text that is not a title',
    when: '24, 32 and 40 use the display face, for a big number or statement that does not name a section. That face has one weight, so weight does nothing here.',
    sample: <Text size={32}>300 icons</Text>,
    code: `<Text size={32}>300 icons</Text>`,
  },
  {
    title: 'Same look, different job',
    when: 'Heading and Text both take size in px, so at 24 they look alike.',
    sample: (
      <>
        {/* role="presentation" keeps the sample out of this page's own outline; its tag is still h4. */}
        <Heading size={24} role="presentation">
          Release notes
        </Heading>
        <Text size={24}>Release notes</Text>
      </>
    ),
    code: `<Heading size={24}>Release notes</Heading>
<Text size={24}>Release notes</Text>`,
    note: (
      <>
        Only the Heading is a heading (an h4, picked by its size). Screen readers list it and jump to it, search
        engines read it as a section, and reader modes build their outline from it. If it names a section, use Heading.
        If it is only big, use Text.
      </>
    ),
  },
];

/** The Text page's Examples: the common jobs for Text, each live beside its code, then Text against Heading. */
export function TextExamples() {
  return <ExampleList examples={EXAMPLES} />;
}
