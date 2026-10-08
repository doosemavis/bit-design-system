import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { Card, CardBody, CardFooter, CardHeader } from './Card';
import { expectNoA11yViolations } from '../../test/a11y';

describe('Card', () => {
  it('renders a solid card by default', () => {
    render(<Card data-testid="card">x</Card>);
    expect(screen.getByTestId('card').className).toBe('bit-card bit-solid');
  });

  it('maps variant and appends className last', () => {
    render(<Card variant="outline" className="extra" data-testid="card">x</Card>);
    expect(screen.getByTestId('card').className).toBe('bit-card bit-outline extra');
  });

  it('flat adds bit-flat once, even when className already has it; off by default', () => {
    render(<Card flat data-testid="a">x</Card>);
    render(<Card flat className="bit-flat" data-testid="b">x</Card>);
    expect(screen.getByTestId('a').className).toBe('bit-card bit-solid bit-flat');
    expect(screen.getByTestId('b').className.split(' ').filter((c) => c === 'bit-flat')).toHaveLength(1);
  });

  it('renders header, body, and footer as BEM elements that accept className and ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Card>
        <CardHeader ref={ref} className="h">Stats</CardHeader>
        <CardBody>42 coins</CardBody>
        <CardFooter>Done</CardFooter>
      </Card>,
    );
    expect(screen.getByText('Stats').className).toBe('bit-card__header h');
    expect(screen.getByText('42 coins').className).toBe('bit-card__body');
    expect(screen.getByText('Done').className).toBe('bit-card__footer');
    expect(ref.current).toBe(screen.getByText('Stats'));
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <Card>
        <CardHeader>Stats</CardHeader>
        <CardBody>Body</CardBody>
      </Card>,
    );
    await expectNoA11yViolations(container);
  });

  it('rejects the legacy DOM color attribute and does not render it', () => {
    render(
      // @ts-expect-error color is not part of CardProps
      <Card color="danger" data-testid="card">
        x
      </Card>,
    );
    expect(screen.getByTestId('card')).not.toHaveAttribute('color');
  });

  it('rejects the legacy DOM color attribute on CardHeader, CardBody, and CardFooter', () => {
    render(
      <Card>
        {/* @ts-expect-error color is not part of CardPartProps */}
        <CardHeader color="danger" data-testid="header">
          Stats
        </CardHeader>
        {/* @ts-expect-error color is not part of CardPartProps */}
        <CardBody color="danger" data-testid="body">
          42 coins
        </CardBody>
        {/* @ts-expect-error color is not part of CardPartProps */}
        <CardFooter color="danger" data-testid="footer">
          Done
        </CardFooter>
      </Card>,
    );
    expect(screen.getByTestId('header')).not.toHaveAttribute('color');
    expect(screen.getByTestId('body')).not.toHaveAttribute('color');
    expect(screen.getByTestId('footer')).not.toHaveAttribute('color');
  });
});
