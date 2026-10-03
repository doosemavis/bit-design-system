import type { Meta, StoryObj } from '@storybook/react-vite';
import { BitLogo } from './BitLogo';
import { ERAS } from './logoEra';
import { SIZES } from '../system/axes';

const meta = {
  title: 'Brand/BitLogo',
  component: BitLogo,
  args: { size: 'md' },
  argTypes: {
    size: { control: 'select', options: SIZES },
    era: { control: 'select', options: [undefined, ...ERAS] },
  },
} satisfies Meta<typeof BitLogo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Eras: Story = {
  name: 'The four eras (pinned)',
  render: (args) => (
    <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      {ERAS.map((era) => (
        <BitLogo key={era} {...args} era={era} />
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 32 }}>
      {SIZES.map((size) => (
        <BitLogo key={size} {...args} size={size} era={64} />
      ))}
    </div>
  ),
};
