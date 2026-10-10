import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { MenuExamples } from './MenuExamples';
import { expectNoA11yViolations } from '../../test/a11y';

describe('MenuExamples', () => {
  it('shows a file menu and an IconButton "more" menu, each a live sample beside its code', async () => {
    const { container } = render(<MenuExamples />);
    const examples = screen.getAllByRole('article');
    expect(examples.map((example) => within(example).getAllByRole('heading')[0]!.textContent)).toEqual([
      'File menu with shortcuts',
      'A "more" menu on an IconButton',
    ]);
    for (const example of examples) expect(example.querySelector('.bit-code__block')).not.toBeNull();
    await expectNoA11yViolations(container);
  });

  it('the file menu opens by keyboard, and choosing an item says what was chosen', async () => {
    const user = userEvent.setup();
    render(<MenuExamples />);
    screen.getByRole('button', { name: 'File' }).focus();
    await user.keyboard('{ArrowDown}');
    const menu = screen.getByRole('menu', { name: 'File' });
    expect(within(menu).getAllByRole('menuitem').map((item) => item.querySelector('.bit-menu__label')!.textContent)).toEqual([
      'New game',
      'Save',
      'Duplicate',
      'Delete save',
    ]);
    await user.keyboard('{ArrowDown}{Enter}');
    expect(screen.getAllByRole('status')[0]).toHaveTextContent('Chose: Save');
  });

  it('the more menu is named for what it acts on, and skips its disabled item', async () => {
    const user = userEvent.setup();
    render(<MenuExamples />);
    await user.click(screen.getByRole('button', { name: 'More actions' }));
    expect(screen.getByRole('menu', { name: 'Level 3' })).toBeVisible();
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(document.activeElement).toHaveTextContent('Delete level');
    await user.keyboard('{Enter}');
    expect(screen.getAllByRole('status')[1]).toHaveTextContent('Chose: Delete level');
  });
});
