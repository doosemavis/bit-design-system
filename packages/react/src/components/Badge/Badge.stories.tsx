import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './Badge';
import { COLORS } from '../../system/axes';

const row = { display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' } as const;

const meta = {
  title: 'Components/Badge',
  component: Badge,
  args: { children: 'New', color: 'neutral', variant: 'solid', size: 'md', shape: 'pill' },
  argTypes: {
    color: { control: 'select', options: COLORS },
    variant: { control: 'select', options: ['solid', 'outline'] },
    size: { control: 'select', options: ['sm', 'md'] },
    shape: { control: 'radio', options: ['pill', 'square'] },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Colors: Story = {
  render: (args) => (
    <div style={row}>
      {COLORS.map((color) => (
        <Badge key={color} {...args} color={color}>{color}</Badge>
      ))}
    </div>
  ),
};

export const Outline: Story = { args: { variant: 'outline', color: 'success', children: '1-Up' } };
export const Small: Story = { args: { size: 'sm' } };
