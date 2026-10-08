import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AllIcons } from './AllIcons';
import { stubClipboard } from '../../test/clipboard';
import { expectNoA11yViolations } from '../../test/a11y';

afterEach(() => {
  document.getElementById('bit-announcer')?.remove();
  Reflect.deleteProperty(navigator, 'clipboard');
});

const tiles = () => screen.queryAllByRole('button', { name: /^Copy / });

describe('AllIcons', () => {
  it('shows all 300 icons under the 8 group headings, each with its own Copy button, and no axe violations', { timeout: 30_000 }, async () => {
    const { container } = render(<AllIcons />);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(8);
    expect(tiles()).toHaveLength(300);
    expect(screen.getByRole('button', { name: 'Copy favorite' })).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('search filters by name, hides empty groups, and says so when nothing matches', () => {
    render(<AllIcons />);
    const search = screen.getByLabelText('Search icons');
    fireEvent.change(search, { target: { value: 'Arrow Back' } });
    expect(tiles().map((b) => b.getAttribute('aria-label'))).toEqual(['Copy arrow-back']);
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['Arrows & navigation']);
    fireEvent.change(search, { target: { value: 'zzzz' } });
    expect(tiles()).toHaveLength(0);
    expect(screen.getByText('No icons match. Try another word.')).toBeInTheDocument();
  });

  it('Copy gives the React snippet by default, and the HTML class form after switching, in the fill style', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    stubClipboard(writeText);
    render(<AllIcons />);
    fireEvent.change(screen.getByLabelText('Search icons'), { target: { value: 'favorite' } });
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Copy favorite' })));
    expect(writeText).toHaveBeenLastCalledWith("import { Icon, iconFavorite } from '@bit-ds/react';\n\n<Icon icon={iconFavorite} />");

    fireEvent.click(screen.getByRole('radio', { name: 'HTML' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Fill' }));
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Copy favorite-fill' })));
    expect(writeText).toHaveBeenLastCalledWith('<span class="bit-icon bit-icon-favorite-fill" aria-hidden="true"></span>');
  });

  it('the line under the toolbar says what Copy gives, and names icons.css for HTML', () => {
    render(<AllIcons />);
    const note = screen.getByTestId('copy-gives');
    expect(note).toHaveTextContent("import { Icon, iconFavorite } from '@bit-ds/react';");
    fireEvent.click(screen.getByRole('radio', { name: 'HTML' }));
    expect(note).toHaveTextContent('<span class="bit-icon bit-icon-favorite" aria-hidden="true"></span>');
    expect(note).toHaveTextContent("import '@bit-ds/react/icons.css';");
  });

  it('the line under the toolbar previews the fill icon when Fill is chosen', () => {
    render(<AllIcons />);
    const note = screen.getByTestId('copy-gives');
    fireEvent.click(screen.getByRole('radio', { name: 'Fill' }));
    expect(note).toHaveTextContent("import { Icon, iconFavoriteFill } from '@bit-ds/react';");
    fireEvent.click(screen.getByRole('radio', { name: 'HTML' }));
    expect(note).toHaveTextContent('<span class="bit-icon bit-icon-favorite-fill" aria-hidden="true"></span>');
  });

  it('Fill swaps the artwork to the fill icons', () => {
    const { container } = render(<AllIcons />);
    expect(container.querySelector('.bit-icon-favorite')).not.toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: 'Fill' }));
    expect(container.querySelector('.bit-icon-favorite')).toBeNull();
    expect(container.querySelector('.bit-icon-favorite-fill')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Copy favorite-fill' })).toBeInTheDocument();
  });
});
