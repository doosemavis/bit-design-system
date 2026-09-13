import type { Meta, StoryObj } from '@storybook/react-vite';
import { Alert } from './Alert';
import { TONES } from '../../system/axes';

const meta = {
  title: 'Components/Alert',
  component: Alert,
  args: { title: 'Coins collected', children: 'You picked up 42 coins in World 1-2.', tone: 'neutral', variant: 'outline' },
  argTypes: {
    tone: { control: 'select', options: TONES },
    variant: { control: 'select', options: ['solid', 'outline'] },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Tones: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 16 }}>
      {TONES.map((tone) => (
        <Alert key={tone} {...args} tone={tone} title={tone} />
      ))}
    </div>
  ),
};

export const Solid: Story = { args: { variant: 'solid', tone: 'danger', title: 'Game over', role: 'alert' } };
export const NoTitle: Story = { args: { title: undefined } };
