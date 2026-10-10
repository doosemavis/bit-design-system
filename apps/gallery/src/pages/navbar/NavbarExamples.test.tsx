import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { NavbarExamples } from './NavbarExamples';
import { expectNoA11yViolations } from '../../test/a11y';

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>;
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="*"
          element={
            <>
              <NavbarExamples />
              <Where />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('NavbarExamples', () => {
  it('shows router links, the bar in a dark subtree and the phone fold, each beside its code', async () => {
    const { container } = renderAt('/components/navbar');
    const examples = screen.getAllByRole('article');
    expect(examples.map((example) => within(example).getAllByRole('heading')[0]!.textContent)).toEqual([
      'App header with router links',
      'The bar in a dark subtree',
      'On a phone, the links fold into a Menu',
    ]);
    for (const example of examples) expect(example.querySelector('.gallery-example__body[data-wide]')).not.toBeNull();
    expect(examples[1]!.querySelector('.bit-dark .bit-navbar.bit-bar')).not.toBeNull();
    expect(examples[2]!.querySelector('.gallery-narrow .bit-navbar')).not.toBeNull();
    await expectNoA11yViolations(container);
  });

  it('marks the page you are on as current, and a router link navigates in the app', async () => {
    const user = userEvent.setup();
    renderAt('/components/navbar');
    const nav = screen.getAllByRole('navigation', { name: 'Docs' })[0]!;
    expect(within(nav).getByRole('link', { name: 'Navbar' })).toHaveAttribute('aria-current', 'page');
    await user.click(within(nav).getByRole('link', { name: 'Menu' }));
    expect(screen.getByTestId('where')).toHaveTextContent('/components/menu');
    expect(within(nav).getByRole('link', { name: 'Menu' })).toHaveAttribute('aria-current', 'page');
  });
});
