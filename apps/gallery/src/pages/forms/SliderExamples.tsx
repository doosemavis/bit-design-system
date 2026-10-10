import { useState } from 'react';
import { Field, Slider, Stack, Text } from '@bit-ds/react';
import { ExampleList } from '../../ui/ExampleCard';
import type { Example } from '../../ui/ExampleCard';

/** Volume in a Field, with the number shown beside the slider. */
function Volume() {
  const [volume, setVolume] = useState(40);
  return (
    <Field label="Volume" hint="Music and effects.">
      <Stack direction="row" align="center" gap={16}>
        <Slider value={volume} onValueChange={setVolume} formatValue={(v) => `${v}%`} />
        <Text weight="bold">{volume}%</Text>
      </Stack>
    </Field>
  );
}

const EXAMPLES: readonly Example[] = [
  {
    title: 'Volume in a Field',
    when: "The Field's label names the slider and its hint describes it. Show the number beside it when people care about the exact value.",
    sample: <Volume />,
    code: `const [volume, setVolume] = useState(40);

<Field label="Volume" hint="Music and effects.">
  <Stack direction="row" align="center" gap={16}>
    <Slider value={volume} onValueChange={setVolume} formatValue={(v) => \`\${v}%\`} />
    <Text weight="bold">{volume}%</Text>
  </Stack>
</Field>`,
  },
  {
    title: 'Lives, as a health bar',
    when: 'blocks draws one block per step, so a small count reads at a glance. A click on a block picks it.',
    sample: (
      <Field label="Lives">
        <Slider variant="blocks" color="danger" max={5} defaultValue={3} formatValue={(v) => `${v} of 5 lives`} name="lives" />
      </Field>
    ),
    code: `<Field label="Lives">
  <Slider
    variant="blocks"
    color="danger"
    max={5}
    defaultValue={3}
    formatValue={(v) => \`\${v} of 5 lives\`}
    name="lives"
  />
</Field>`,
    note: 'blocks draws one block per step, 20 at most. With more steps (0 to 100 by 1) blocks are shared and too thin to read, and it warns in development: give it a coarse step, like 0 to 10, or 0 to 100 by 10.',
  },
  {
    title: 'Brightness with a value bubble',
    when: 'round shows the value in a small bubble over the thumb while it is dragged or focused, so the number needs no room of its own.',
    sample: (
      <Field label="Brightness">
        <Slider variant="round" step={5} defaultValue={70} formatValue={(v) => `${v}%`} />
      </Field>
    ),
    code: `<Field label="Brightness">
  <Slider variant="round" step={5} defaultValue={70} formatValue={(v) => \`\${v}%\`} />
</Field>`,
    note: 'The bubble is hidden from screen readers: formatValue gives the input the same words as aria-valuetext, so they hear "70%", not "70".',
  },
  {
    title: 'Show a setting that can’t change here',
    when: 'readOnly keeps the slider at full strength and in the Tab order, with dashed edges, but a drag or a key does nothing.',
    sample: (
      <Field label="Difficulty" hint="Set by your team admin.">
        <Slider variant="blocks" max={10} defaultValue={7} readOnly />
      </Field>
    ),
    code: `<Field label="Difficulty" hint="Set by your team admin.">
  <Slider variant="blocks" max={10} defaultValue={7} readOnly />
</Field>`,
  },
];

/** The Slider page's Examples: volume in a Field, lives as blocks, a round brightness bubble, and read-only. */
export function SliderExamples() {
  return <ExampleList examples={EXAMPLES} />;
}
