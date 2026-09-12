import type { Meta, StoryObj } from '@storybook/react-vite';
import { Spinner } from './Spinner';
import { SIZES, COLORS } from '../../system/axes';

const row = { display: 'flex', gap: 16, alignItems: 'center' } as const;

const meta = {
  title: 'Components/Spinner',
  component: Spinner,
  args: { 'aria-label': 'Loading', color: 'primary', size: 'md' },
  argTypes: {
    color: { control: 'select', options: COLORS },
    size: { control: 'select', options: SIZES },
  },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div style={row}>
      {SIZES.map((size) => (
        <Spinner key={size} {...args} size={size} />
      ))}
    </div>
  ),
};

export const Colors: Story = {
  render: (args) => (
    <div style={row}>
      {COLORS.map((color) => (
        <Spinner key={color} {...args} color={color} />
      ))}
    </div>
  ),
};
