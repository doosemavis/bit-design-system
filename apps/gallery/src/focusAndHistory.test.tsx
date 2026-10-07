import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { renderAt } from './test/renderRoute';
import { chooseOption, chosenLabel } from './test/select';

/** Plan §H.1 on a real component page: controls keep focus, and Back undoes a discrete change. */
describe('component page focus and history', () => {
  it('a keystroke keeps focus in the field, and the word reaches the URL as one replace', async () => {
    const { router } = renderAt('/components/button');
    await screen.findByRole('heading', { level: 1, name: 'Button' });
    const field = screen.getByLabelText('children');
    await userEvent.clear(field);
    await userEvent.type(field, 'Go');
    expect(document.activeElement).toBe(field);
    expect(within(screen.getByRole('region', { name: 'Button preview' })).getByRole('button', { name: 'Go' })).toHaveClass('bit-button');
    await waitFor(() => expect(router.state.location.search).toBe('?children=Go'));
    expect(router.state.historyAction).toBe('REPLACE');
    expect(document.activeElement).toBe(field);
  });

  it('a select keeps focus on the select, and Back undoes it', async () => {
    const { router } = renderAt('/components/button');
    await screen.findByRole('heading', { level: 1, name: 'Button' });
    const color = screen.getByRole('combobox', { name: 'color' });
    await chooseOption(userEvent.setup(), color, 'danger');
    expect(document.activeElement).toBe(color);
    expect(router.state.location.search).toBe('?color=danger');
    expect(router.state.historyAction).toBe('PUSH');
    await act(() => router.navigate(-1));
    expect(router.state.location.search).toBe('');
    expect(chosenLabel(screen.getByRole('combobox', { name: 'color' }))).toBe('primary');
  });

  it('a select chosen by keyboard keeps focus on its trigger, and Back undoes it', async () => {
    const { router } = renderAt('/components/button');
    await screen.findByRole('heading', { level: 1, name: 'Button' });
    const size = screen.getByRole('combobox', { name: 'size' });
    size.focus();
    await userEvent.setup().keyboard('{ArrowDown}{End}{Enter}');
    expect(document.activeElement).toBe(size);
    expect(router.state.location.search).toBe('?size=lg');
    expect(router.state.historyAction).toBe('PUSH');
    await act(() => router.navigate(-1));
    expect(router.state.location.search).toBe('');
    expect(screen.getByRole('combobox', { name: 'size' })).toHaveTextContent('md');
  });
});
