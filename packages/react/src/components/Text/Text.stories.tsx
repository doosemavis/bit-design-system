import type { Meta, StoryObj } from '@storybook/react-vite';
import { Text } from './Text';
import { TEXT_SIZES } from '../../system/axes';

const meta = {
  title: 'Components/Text',
  component: Text,
  args: { children: 'You picked up 42 coins in World 1-2.', as: 'p', size: 'md', weight: 'normal' },
  argTypes: {
    as: { control: 'select', options: ['p', 'span', 'div', 'label', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'] },
    size: { control: 'select', options: TEXT_SIZES },
    tone: { control: 'select', options: [undefined, 'neutral'] },
    weight: { control: 'radio', options: ['normal', 'bold'] },
  },
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Scale: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 12 }}>
      {TEXT_SIZES.map((size) => (
        <Text key={size} size={size}>{size}: Press Start</Text>
      ))}
    </div>
  ),
};

export const Muted: Story = { args: { tone: 'neutral' } };
export const Heading: Story = { args: { as: 'h1', size: '2xl', children: 'Press Start' } };
