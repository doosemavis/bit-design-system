import { Field, Slider } from '@bit-ds/react';
import { ExampleList } from '../../ui/ExampleCard';
import type { Example } from '../../ui/ExampleCard';

const EXAMPLES: readonly Example[] = [
  {
    title: 'Volume with a number box',
    when: 'numberInput shows the exact value beside the track, and people can type it. unit adds a tab for what the number counts.',
    sample: (
      <Field label="Volume" hint="Music and effects.">
        <Slider numberInput unit="%" defaultValue={40} formatValue={(v) => `${v}%`} />
      </Field>
    ),
    code: `<Field label="Volume" hint="Music and effects.">
  <Slider numberInput unit="%" defaultValue={40} formatValue={(v) => \`\${v}%\`} />
</Field>`,
    note: 'The box takes the Field\'s label, so screen readers hear "Volume" for both. It has no name of its own: a form gets the value once, from the slider. blocks has no number box.',
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
    title: 'Zoom, in notches',
    when: 'notched makes the thumb jump from step to step and marks each one, for a range with only a few sensible values.',
    sample: (
      <Field label="Zoom">
        <Slider variant="round" notched min={50} max={200} step={25} defaultValue={100} formatValue={(v) => `${v}%`} />
      </Field>
    ),
    code: `<Field label="Zoom">
  <Slider
    variant="round"
    notched
    min={50}
    max={200}
    step={25}
    defaultValue={100}
    formatValue={(v) => \`\${v}%\`}
  />
</Field>`,
    note: 'notched draws a mark per step, 20 at most. With more steps (0 to 100 by 1) the marks would run together, so it draws none and warns in development. Without notched the thumb glides and settles on a step when you let go.',
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

/** The Slider page's Examples: volume with a number box, lives as blocks, a round brightness bubble, notched zoom, and read-only. */
export function SliderExamples() {
  return <ExampleList examples={EXAMPLES} />;
}
