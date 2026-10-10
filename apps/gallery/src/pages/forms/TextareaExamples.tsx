import { Field, Textarea } from '@bit-ds/react';
import { ExampleList } from '../../ui/ExampleCard';
import type { Example } from '../../ui/ExampleCard';

/** 120 of 140 characters: six more turn the count to warning, twenty more reach the limit. */
const BIO = 'Speedrunner and pixel artist. I collect old cartridges, fix handhelds, and write about the games that taught me to read.';

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
    title: 'Bio with a character limit',
    when: 'With maxLength and showCount, the count sits on the hint’s row and reads "120 / 140". It turns warning with 10% left and danger at the limit.',
    sample: (
      <Field label="Bio" hint="A line or two about you.">
        <Textarea maxLength={140} showCount defaultValue={BIO} />
      </Field>
    ),
    code: `<Field label="Bio" hint="A line or two about you.">
  <Textarea maxLength={140} showCount defaultValue={bio} />
</Field>`,
    note: 'maxLength is a hard limit: typing and pasting stop at 140. Screen readers hear "Up to 140 characters" with the hint, then the count only at 20 left, 10 left and the limit, never on every key.',
  },
  {
    title: 'Notes with a running count',
    when: 'Without maxLength, showCount just counts: "42 characters". Nothing turns warning, and nothing stops the typing.',
    sample: (
      <Field label="Notes">
        <Textarea rows={4} showCount placeholder="Anything we should know?" />
      </Field>
    ),
    code: `<Field label="Notes">
  <Textarea rows={4} showCount placeholder="Anything we should know?" />
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

/** The Textarea page's Examples: a message in a Field, a counted bio and notes, and read-only text. */
export function TextareaExamples() {
  return <ExampleList examples={EXAMPLES} />;
}
