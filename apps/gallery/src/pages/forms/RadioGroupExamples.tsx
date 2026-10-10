import { Field, Radio, RadioGroup } from '@bit-ds/react';
import { ExampleList } from '../../ui/ExampleCard';
import type { Example } from '../../ui/ExampleCard';

const EXAMPLES: readonly Example[] = [
  {
    title: 'A required choice in a Field',
    when: "The Field's label names the group, its hint and error describe it, and required stops the form until one is chosen.",
    sample: (
      <Field label="Shipping" hint="Arrives in 2 to 5 days." required>
        <RadioGroup
          name="shipping"
          options={[
            { value: 'standard', label: 'Standard, free' },
            { value: 'express', label: 'Express, $9' },
            { value: 'pickup', label: 'Pick up in store', disabled: true },
          ]}
        />
      </Field>
    ),
    code: `<Field label="Shipping" hint="Arrives in 2 to 5 days." required>
  <RadioGroup
    name="shipping"
    options={[
      { value: 'standard', label: 'Standard, free' },
      { value: 'express', label: 'Express, $9' },
      { value: 'pickup', label: 'Pick up in store', disabled: true },
    ]}
  />
</Field>`,
  },
  {
    title: 'Radio children',
    when: 'Write each choice as a <Radio> when the list is part of your markup rather than data. The legend names the group without a Field.',
    sample: (
      <RadioGroup legend="Plan" defaultValue="free" size="lg">
        <Radio value="free">Free</Radio>
        <Radio value="pro">Pro, $8 a month</Radio>
      </RadioGroup>
    ),
    code: `<RadioGroup legend="Plan" defaultValue="free" size="lg">
  <Radio value="free">Free</Radio>
  <Radio value="pro">Pro, $8 a month</Radio>
</RadioGroup>`,
  },
  {
    title: 'Show a choice that can’t change here',
    when: 'readOnly keeps the choice at full strength and reachable with Tab, but clicks and the arrow keys leave it as it is.',
    sample: (
      <RadioGroup
        legend="Billing"
        readOnly
        value="yearly"
        options={[
          { value: 'monthly', label: 'Monthly' },
          { value: 'yearly', label: 'Yearly' },
        ]}
      />
    ),
    code: `<RadioGroup legend="Billing" readOnly value="yearly" options={billing} />`,
    note: 'Pick readOnly over disabled when people still need to read the choice: disabled fades it and takes it out of the Tab order.',
  },
];

/** The RadioGroup page's Examples: a required choice in a Field, Radio children, and a read-only choice. */
export function RadioGroupExamples() {
  return <ExampleList examples={EXAMPLES} />;
}
