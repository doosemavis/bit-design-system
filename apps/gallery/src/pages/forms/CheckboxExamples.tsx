import { useState } from 'react';
import { Box, Checkbox, Field, Stack } from '@bit-ds/react';
import { ExampleList } from '../../ui/ExampleCard';
import type { Example } from '../../ui/ExampleCard';

const TOPPINGS = ['Cheese', 'Mushrooms', 'Olives'] as const;

/** A "Select all" box over three: checked when all are, indeterminate when some are. */
function SelectAll() {
  const [chosen, setChosen] = useState<readonly string[]>(['Cheese']);
  const all = chosen.length === TOPPINGS.length;
  return (
    <Stack gap={8}>
      <Checkbox
        checked={all}
        indeterminate={chosen.length > 0 && !all}
        onCheckedChange={(next) => setChosen(next ? TOPPINGS : [])}
      >
        All toppings
      </Checkbox>
      <Box paddingLeft={24}>
        <Stack gap={8}>
          {TOPPINGS.map((topping) => (
            <Checkbox
              key={topping}
              checked={chosen.includes(topping)}
              onCheckedChange={(next) => setChosen(TOPPINGS.filter((t) => (t === topping ? next : chosen.includes(t))))}
            >
              {topping}
            </Checkbox>
          ))}
        </Stack>
      </Box>
    </Stack>
  );
}

const EXAMPLES: readonly Example[] = [
  {
    title: 'Select all',
    when: 'A box over a list: checked when every item is, indeterminate (a bar) when only some are.',
    sample: <SelectAll />,
    code: `const all = chosen.length === toppings.length;

<Checkbox
  checked={all}
  indeterminate={chosen.length > 0 && !all}
  onCheckedChange={(next) => setChosen(next ? toppings : [])}
>
  All toppings
</Checkbox>`,
    note: 'indeterminate is a state of the box, not a value: the form still submits checked or not. Screen readers announce it as "mixed".',
  },
  {
    title: 'Agree in a form',
    when: "Inside a Field, the Field's label, hint and error reach the checkbox, and required stops the form until it is ticked.",
    sample: (
      <Field label="Terms" error="Tick the box to go on." required>
        <Checkbox name="terms">I agree to the terms</Checkbox>
      </Field>
    ),
    code: `<Field label="Terms" error="Tick the box to go on." required>
  <Checkbox name="terms">I agree to the terms</Checkbox>
</Field>`,
  },
  {
    title: 'Show a setting that can’t change here',
    when: 'readOnly keeps the box at full strength and in the Tab order, so it can be read and reached, but a click or Space does nothing.',
    sample: (
      <Stack gap={8}>
        <Checkbox readOnly defaultChecked>
          Two-step sign-in
        </Checkbox>
        <Checkbox readOnly>Marketing email</Checkbox>
      </Stack>
    ),
    code: `<Checkbox readOnly defaultChecked>Two-step sign-in</Checkbox>
<Checkbox readOnly>Marketing email</Checkbox>`,
  },
];

/** The Checkbox page's Examples: select all, a required box in a Field, and read-only settings. */
export function CheckboxExamples() {
  return <ExampleList examples={EXAMPLES} />;
}
