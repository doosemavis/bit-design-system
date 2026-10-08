import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { iconFavorite } from '@bit-ds/react';
import { AllIcons } from './AllIcons';
import { stubClipboard } from '../../test/clipboard';
import { expectNoA11yViolations } from '../../test/a11y';

afterEach(() => {
  document.getElementById('bit-announcer')?.remove();
  Reflect.deleteProperty(navigator, 'clipboard');
});

const tiles = () => screen.queryAllByRole('button', { name: /^Copy / });

describe('AllIcons', () => {
  it('shows all 300 icons under the 8 group headings, each a Copy tile, and no axe violations', { timeout: 30_000 }, async () => {
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

  it('hovering a tile shows its name in a tooltip', () => {
    render(<AllIcons />);
    fireEvent.change(screen.getByLabelText('Search icons'), { target: { value: 'favorite' } });
    fireEvent.pointerEnter(screen.getByRole('button', { name: 'Copy favorite' }));
    expect(screen.getByRole('tooltip')).toHaveTextContent('favorite');
  });

  it('clicking a tile copies the React text, then the tooltip reads Copied and the tile turns success', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    stubClipboard(writeText);
    render(<AllIcons />);
    fireEvent.change(screen.getByLabelText('Search icons'), { target: { value: 'favorite' } });
    const tile = screen.getByRole('button', { name: 'Copy favorite' });
    await act(async () => fireEvent.click(tile));
    expect(writeText).toHaveBeenLastCalledWith("import { Icon, iconFavorite } from '@bit-ds/react';\n\n<Icon icon={iconFavorite} />");
    fireEvent.pointerEnter(tile);
    expect(screen.getByRole('tooltip')).toHaveTextContent('Copied');
    expect(tile).toHaveClass('bit-success');
  });

  it('after switching to HTML and Fill, a click copies the iconFilled class form and the tile draws the fill path', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    stubClipboard(writeText);
    const { container } = render(<AllIcons />);
    fireEvent.change(screen.getByLabelText('Search icons'), { target: { value: 'favorite' } });
    fireEvent.click(screen.getByRole('radio', { name: 'HTML' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Fill' }));
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Copy favorite' })));
    expect(writeText).toHaveBeenLastCalledWith('<span class="bit-icon bit-icon-favorite bit-iconFilled" aria-hidden="true"></span>');
    expect(container.querySelector('.bit-iconButton svg path')).toHaveAttribute('d', iconFavorite.fillPath);
  });

  it('the line under the toolbar says what Copy gives, and names icons.css for HTML', () => {
    render(<AllIcons />);
    const note = screen.getByTestId('copy-gives');
    expect(note).toHaveTextContent("import { Icon, iconFavorite } from '@bit-ds/react';");
    fireEvent.click(screen.getByRole('radio', { name: 'HTML' }));
    expect(note).toHaveTextContent('<span class="bit-icon bit-icon-favorite" aria-hidden="true"></span>');
    expect(note).toHaveTextContent("import '@bit-ds/react/icons.css';");
  });

  it('the line under the toolbar shows iconFilled / bit-iconFilled when Fill is chosen', () => {
    render(<AllIcons />);
    const note = screen.getByTestId('copy-gives');
    fireEvent.click(screen.getByRole('radio', { name: 'Fill' }));
    expect(note).toHaveTextContent("<Icon icon={iconFavorite} iconFilled />");
    fireEvent.click(screen.getByRole('radio', { name: 'HTML' }));
    expect(note).toHaveTextContent('bit-icon-favorite bit-iconFilled');
  });
});
