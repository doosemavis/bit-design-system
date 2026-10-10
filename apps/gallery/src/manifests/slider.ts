import { COLORS, SIZES, Slider } from '@bit-ds/react';
import type { ControlState, Manifest } from './types';
import { SliderExamples } from '../pages/forms/SliderExamples';

/**
 * The range a sample shows, from the min, max and step controls. They are virtual, so their defaults (0 to 10
 * by 1, ten blocks) never claim to be the component's (0 to 100 by 1); only what differs from those prints.
 */
function range(state: ControlState): Record<string, number> {
  const min = Number(state.rangeMin);
  const max = Number(state.rangeMax);
  const step = Number(state.rangeStep);
  const start = min + Math.round((0.6 * (max - min)) / step) * step;
  return {
    ...(min !== 0 ? { min } : {}),
    ...(max !== 100 ? { max } : {}),
    ...(step !== 1 ? { step } : {}),
    defaultValue: Math.min(Math.max(start, min), max),
  };
}

export const slider: Manifest = {
  name: 'Slider',
  slug: 'slider',
  group: 'forms',
  component: Slider,
  description: 'Pick a number on a range by dragging or with the arrow keys. A real range input, drawn three ways: a square thumb, a health bar of blocks, or a round thumb with a value bubble.',
  related: ['input', 'segmentedcontrol', 'field'],
  controls: [
    { kind: 'axis', prop: 'variant', values: ['square', 'blocks', 'round'], default: 'square' },
    { kind: 'axis', prop: 'color', values: COLORS, default: 'primary' },
    { kind: 'axis', prop: 'size', values: SIZES, default: 'md' },
    { kind: 'number', prop: 'rangeMin', label: 'min', default: 0, min: 0, max: 50, step: 1, virtual: true },
    { kind: 'number', prop: 'rangeMax', label: 'max', default: 10, min: 1, max: 100, step: 1, virtual: true },
    { kind: 'number', prop: 'rangeStep', label: 'step', default: 1, min: 1, max: 10, step: 1, virtual: true },
    { kind: 'boolean', prop: 'invalid', default: false },
    { kind: 'boolean', prop: 'readOnly', default: false },
    { kind: 'boolean', prop: 'disabled', default: false },
  ],
  fixedProps: { 'aria-label': 'Volume' },
  deriveProps: range,
  extraSection: { id: 'section-examples', title: 'Examples', Component: SliderExamples },
  presets: [
    { label: 'Blocks', state: { variant: 'blocks' } },
    { label: 'Round', state: { variant: 'round' } },
    { label: '0 to 100 by 10', state: { rangeMax: '100', rangeStep: '10' } },
    { label: 'Read-only', state: { readOnly: true } },
    { label: 'Large', state: { size: 'lg' } },
  ],
  // The drawn fill follows the value through React, so the markup alone doesn't move.
  interactive: true,
  docs: {
    badges: ['Native <input type="range">', 'Three looks', 'Joins a Field'],
    usage: {
      do: [
        'Use a Slider for a value where about right is right: volume, brightness, a rough budget.',
        'Put it in a Field so it has a visible label, and show the number beside it when the exact value matters.',
        'Use blocks for a small count on a coarse step (lives, 0 to 10, 0 to 100 by 10): one block per step, 20 at most.',
        'Give formatValue when the number needs a unit ("40%"), so screen readers and the round bubble say it.',
      ],
      dont: [
        'Use a Slider when the exact number matters and there are many of them. Use an Input with type="number".',
        'Use a Slider to pick one of a few named options. Use a SegmentedControl or a RadioGroup.',
        'Use blocks on a fine step (0 to 100 by 1): the blocks are shared and too thin to read.',
      ],
    },
    props: [
      {
        name: 'variant',
        className: 'bit-{variant}',
        type: "'square' | 'blocks' | 'round'",
        default: "'square'",
        description: 'The look: a square thumb on a thick track, a health bar of blocks, or a round thumb with a value bubble while you drag or focus it.',
      },
      { name: 'color', className: 'bit-{color}', type: "'primary' | 'neutral' | 'success' | 'warning' | 'danger'", default: "'primary'", description: 'The fill, the lit blocks and the round thumb.' },
      { name: 'size', className: 'bit-{size}', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Thumb, track and block size.' },
      { name: 'value', type: 'number', description: 'The value, when the parent owns it. Pair it with onValueChange, or use defaultValue.' },
      { name: 'defaultValue', type: 'number', default: 'min', description: 'The first value, when the Slider owns it, and what a form reset returns to.' },
      { name: 'onValueChange', type: '(value: number) => void', description: 'Called with the new value, as a number, when it changes.' },
      { name: 'onChange', type: '(event: ChangeEvent<HTMLInputElement>) => void', description: 'The native change event of the range input. It runs before onValueChange.' },
      { name: 'min', type: 'number', default: '0', description: 'Lowest value.' },
      { name: 'max', type: 'number', default: '100', description: 'Highest value.' },
      { name: 'step', type: 'number', default: '1', description: 'The gap between values. A value is snapped to a step, as the native input snaps it. blocks draws one block per step, 20 at most.' },
      {
        name: 'formatValue',
        type: '(value: number) => string',
        description: 'Words for the value: read by screen readers (as aria-valuetext) and shown in the round bubble. An aria-valuetext you pass wins.',
      },
      { name: 'name', type: 'string', description: 'The form field name: the value is submitted under it.' },
      {
        name: 'invalid',
        type: 'boolean',
        default: 'false',
        description: 'Marks it wrong: aria-invalid="true" and a danger edge on the track or frame. A Field with an error does the same.',
      },
      {
        name: 'readOnly',
        type: 'boolean',
        default: 'false',
        description: "Shows the value at full strength, stays in the Tab order and is submitted, but it can't change. Rendered as aria-readonly, with dashed edges.",
      },
      { name: 'disabled', type: 'boolean', default: 'false', description: "The native disabled attribute: it can't be changed or focused, is faded and isn't submitted." },
    ],
    a11y: [
      'A real <input type="range">, so screen readers say "slider" with its value, and the arrow keys step it, Page Up and Page Down jump, and Home and End go to min and max.',
      'Inside a Field the label names it and the hint and error describe it. On its own, give it an aria-label or aria-labelledby; it warns in development without one.',
      'formatValue gives the value in words ("40%", "3 of 5 lives") as aria-valuetext. The round bubble is hidden from screen readers, because the input already says the value.',
      'The thumb (or the blocks frame) shows the focus ring. Read-only keeps focus and says aria-readonly; disabled leaves the Tab order.',
      'In forced-colors mode (Windows high contrast) the fill and lit blocks keep the system highlight, the thumb a button face, and an invalid track a double edge. Right to left, it fills from the right.',
    ],
  },
};
