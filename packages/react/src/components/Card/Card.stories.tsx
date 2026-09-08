import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card, CardBody, CardFooter, CardHeader } from './Card';
import { Button } from '../Button/Button';

const meta = {
  title: 'Components/Card',
  component: Card,
  args: { variant: 'solid' },
  argTypes: { variant: { control: 'select', options: ['solid', 'outline'] } },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <Card {...args} style={{ maxWidth: 360 }}>
      <CardHeader>Coins collected</CardHeader>
      <CardBody>You picked up 42 coins in World 1-2.</CardBody>
      <CardFooter>
        <Button variant="ghost" tone="neutral">Later</Button>
        <Button>Collect</Button>
      </CardFooter>
    </Card>
  ),
};

export const Outline: Story = { ...Playground, args: { variant: 'outline' } };

export const PlainHtml: Story = {
  name: 'Plain HTML (class decorators)',
  render: () => (
    <div className="bit-card bit-solid" style={{ maxWidth: 360 }}>
      <div className="bit-card__header">bit-card__header</div>
      <div className="bit-card__body">bit-card__body</div>
    </div>
  ),
};
