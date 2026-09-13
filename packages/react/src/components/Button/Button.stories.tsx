import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';
import { SIZES, TONES, VARIANTS } from '../../system/axes';

const row = { display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' } as const;

const meta = {
  title: 'Components/Button',
  component: Button,
  args: { children: 'Continue ▶', tone: 'primary', variant: 'solid', size: 'md' },
  argTypes: {
    tone: { control: 'select', options: TONES },
    variant: { control: 'select', options: VARIANTS },
    size: { control: 'select', options: SIZES },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Tones: Story = {
  render: (args) => (
    <div style={row}>
      {TONES.map((tone) => (
        <Button key={tone} {...args} tone={tone}>{tone}</Button>
      ))}
    </div>
  ),
};

export const Variants: Story = {
  render: (args) => (
    <div style={row}>
      {VARIANTS.map((variant) => (
        <Button key={variant} {...args} variant={variant}>{variant}</Button>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div style={row}>
      {SIZES.map((size) => (
        <Button key={size} {...args} size={size}>{size}</Button>
      ))}
    </div>
  ),
};

export const Loading: Story = { args: { loading: true, children: 'Saving' } };
export const Disabled: Story = { args: { disabled: true } };

export const AsLink: Story = {
  render: (args) => (
    <Button {...args} asChild>
      <a href="#docs">Read the docs</a>
    </Button>
  ),
};

export const PlainHtml: Story = {
  name: 'Plain HTML (class decorators)',
  render: () => (
    <div style={row}>
      <button className="bit-button bit-primary bit-solid bit-md">bit-primary</button>
      <button className="bit-button bit-danger bit-outline bit-md">bit-danger bit-outline</button>
      <button className="bit-button bit-neutral bit-ghost bit-sm">bit-ghost bit-sm</button>
    </div>
  ),
};
