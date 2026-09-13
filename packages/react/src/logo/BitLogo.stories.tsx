import type { Meta, StoryObj } from '@storybook/react-vite';
import { BitLogo, ERAS } from './BitLogo';
import { SIZES } from '../system/axes';

const meta = {
  title: 'Brand/BitLogo',
  component: BitLogo,
  args: { size: 'md', interval: 5, animated: true },
  argTypes: {
    size: { control: 'select', options: SIZES },
    freeze: { control: 'select', options: [undefined, ...ERAS] },
    interval: { control: { type: 'number', min: 0.5, step: 0.5 } },
  },
} satisfies Meta<typeof BitLogo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Eras: Story = {
  name: 'The four eras (frozen)',
  render: (args) => (
    <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap', alignItems: 'baseline' }}>
      {ERAS.map((era) => (
        <BitLogo key={era} {...args} freeze={era} />
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 32 }}>
      {SIZES.map((size) => (
        <BitLogo key={size} {...args} size={size} freeze={64} />
      ))}
    </div>
  ),
};
