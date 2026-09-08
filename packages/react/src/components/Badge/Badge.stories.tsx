import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './Badge';
import { TONES } from '../../system/axes';

const row = { display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' } as const;

const meta = {
  title: 'Components/Badge',
  component: Badge,
  args: { children: 'New', tone: 'neutral', variant: 'solid', size: 'md' },
  argTypes: {
    tone: { control: 'select', options: TONES },
    variant: { control: 'select', options: ['solid', 'outline'] },
    size: { control: 'select', options: ['sm', 'md'] },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Tones: Story = {
  render: (args) => (
    <div style={row}>
      {TONES.map((tone) => (
        <Badge key={tone} {...args} tone={tone}>{tone}</Badge>
      ))}
    </div>
  ),
};

export const Outline: Story = { args: { variant: 'outline', tone: 'success', children: '1-Up' } };
export const Small: Story = { args: { size: 'sm' } };
