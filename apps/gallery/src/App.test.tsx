import { StrictMode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('mounts the hash router and shows the home page', async () => {
    render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('bit');
  });
});
