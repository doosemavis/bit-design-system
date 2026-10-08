import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge } from '@bit-ds/react';
import { KIND_BADGE } from './kinds';

describe('KIND_BADGE', () => {
  it('draws Fixed as a warning outline so it stands apart from Changed', () => {
    render(
      <>
        <Badge {...KIND_BADGE.Fixed}>Fixed</Badge>
        <Badge {...KIND_BADGE.Changed}>Changed</Badge>
      </>,
    );
    expect(screen.getByText('Fixed')).toHaveClass('bit-warning', 'bit-outline');
    expect(screen.getByText('Changed')).toHaveClass('bit-primary', 'bit-outline');
  });
});
