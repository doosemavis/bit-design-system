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
});
