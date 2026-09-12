import type { Meta, StoryObj } from '@storybook/react-vite';
import { Alert } from './Alert';
import { COLORS } from '../../system/axes';

const meta = {
  title: 'Components/Alert',
  component: Alert,
  args: { title: 'Coins collected', children: 'You picked up 42 coins in World 1-2.', color: 'neutral', variant: 'outline' },
  argTypes: {
    color: { control: 'select', options: COLORS },
    variant: { control: 'select', options: ['solid', 'outline'] },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Colors: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 16 }}>
      {COLORS.map((color) => (
        <Alert key={color} {...args} color={color} title={color} />
      ))}
    </div>
  ),
};

export const Solid: Story = { args: { variant: 'solid', color: 'danger', title: 'Game over', role: 'alert' } };
export const NoTitle: Story = { args: { title: undefined } };
