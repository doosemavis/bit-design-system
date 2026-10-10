import { useState } from 'react';
import { Field, Textarea } from '@bit-ds/react';
import { ExampleList } from '../../ui/ExampleCard';
import type { Example } from '../../ui/ExampleCard';

const LIMIT = 200;

/** A message box whose hint counts down the characters left. */
function CountedMessage() {
  const [text, setText] = useState('');
  return (
    <Field label="Feedback" hint={`${LIMIT - text.length} characters left.`}>
      <Textarea rows={4} maxLength={LIMIT} value={text} onChange={(event) => setText(event.target.value)} />
    </Field>
  );
}

const EXAMPLES: readonly Example[] = [
  {
    title: 'A message in a Field',
    when: 'Give it the rows a typical answer needs; people can drag it taller, never wider.',
    sample: (
      <Field label="What happened?" hint="Steps to repeat it help most.">
        <Textarea rows={4} placeholder="I clicked Save and…" />
      </Field>
    ),
    code: `<Field label="What happened?" hint="Steps to repeat it help most.">
  <Textarea rows={4} placeholder="I clicked Save and…" />
</Field>`,
  },
  {
    title: 'Count what is left',
    when: 'With maxLength, say how much room is left in the hint, which screen readers read as the description.',
    sample: <CountedMessage />,
    code: `<Field label="Feedback" hint={\`\${200 - text.length} characters left.\`}>
  <Textarea rows={4} maxLength={200} value={text} onChange={(e) => setText(e.target.value)} />
</Field>`,
  },
  {
    title: 'Show text that can’t be edited here',
    when: 'readOnly keeps the text at full strength, selectable and copyable, with a dashed edge instead of the recess.',
    sample: (
      <Field label="Your note">
        <Textarea rows={2} readOnly defaultValue="Leave the parcel by the back door." />
      </Field>
    ),
    code: `<Field label="Your note">
  <Textarea rows={2} readOnly defaultValue="Leave the parcel by the back door." />
</Field>`,
  },
];

/** The Textarea page's Examples: a message in a Field, a character count, and read-only text. */
export function TextareaExamples() {
  return <ExampleList examples={EXAMPLES} />;
}
