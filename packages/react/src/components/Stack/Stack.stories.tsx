import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stack } from './Stack';
import { Button } from '../Button/Button';
import { SPACE_STEPS } from '../../system/axes';

const meta = {
  title: 'Components/Stack',
  component: Stack,
  args: { direction: 'column', gap: 3, wrap: false },
  argTypes: {
    direction: { control: 'radio', options: ['row', 'column'] },
    gap: { control: 'select', options: SPACE_STEPS },
    align: { control: 'select', options: ['start', 'center', 'end', 'stretch'] },
    justify: { control: 'select', options: ['start', 'center', 'end', 'between'] },
  },
} satisfies Meta<typeof Stack>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <Stack {...args}>
      <Button>One</Button>
      <Button tone="neutral">Two</Button>
      <Button tone="success">Three</Button>
    </Stack>
  ),
};

export const Row: Story = { ...Playground, args: { direction: 'row', gap: 2, align: 'center' } };
