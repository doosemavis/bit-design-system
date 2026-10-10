import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { renderAt } from '../test/renderRoute';
import { expectNoA11yViolations } from '../test/a11y';
import { stubMatchMedia } from '../test/matchMedia';
import { NARROW_QUERY } from '../ui/useMediaQuery';
import { moveActive } from './SearchDialog';

/** Open the app at `path` and wait for its page. */
async function openAt(path: string, h1: string) {
  const utils = renderAt(path);
  await screen.findByRole('heading', { level: 1, name: h1 });
  return utils;
}

const dialog = () => screen.getByRole('dialog', { name: 'Search' });
const box = () => within(dialog()).getByRole('combobox', { name: 'Search pages, components and props' });
const activeOption = () => document.getElementById(box().getAttribute('aria-activedescendant')!)!;

describe('moveActive', () => {
  it('moves down and up, wrapping at both ends', () => {
    expect(moveActive('ArrowDown', 0, 3)).toBe(1);
    expect(moveActive('ArrowDown', 2, 3)).toBe(0);
    expect(moveActive('ArrowUp', 0, 3)).toBe(2);
    expect(moveActive('ArrowUp', 2, 3)).toBe(1);
  });

  it('ignores other keys, and an empty list', () => {
    expect(moveActive('Enter', 0, 3)).toBeNull();
    expect(moveActive('ArrowDown', 0, 0)).toBeNull();
  });
});

describe('search dialog', () => {
  let restore: () => void = () => {};
  afterEach(() => restore());

  it('is not in the page until opened, so its title adds no heading', async () => {
    await openAt('/', 'bit Design System');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Search' })).toBeNull();
  });

  it.each([
    ['Control+K', '{Control>}k{/Control}'],
    ['Meta+K', '{Meta>}k{/Meta}'],
  ])('%s opens it from anywhere, with focus in the query box', async (_name, keys) => {
    await openAt('/tokens', 'Tokens');
    await userEvent.keyboard(keys);
    expect(dialog()).toHaveAttribute('open');
    expect(box()).toHaveFocus();
  });

  it('the header Search button opens it, and says its shortcut to screen readers', async () => {
    await openAt('/', 'bit Design System');
    const button = within(screen.getByRole('banner')).getByRole('button', { name: 'Search' });
    expect(button).toHaveAttribute('aria-keyshortcuts', 'Meta+K Control+K');
    await userEvent.click(button);
    expect(box()).toHaveFocus();
  });

  it('at phone width the Search button heads the sidebar sheet instead of the header', async () => {
    restore = stubMatchMedia(NARROW_QUERY);
    await openAt('/', 'bit Design System');
    expect(within(screen.getByRole('banner')).queryByRole('button', { name: 'Search' })).toBeNull();
    const nav = screen.getByRole('navigation', { name: 'Gallery' });
    await userEvent.click(within(nav).getByRole('button', { name: 'Search' }));
    expect(box()).toHaveFocus();
  });

  it('lists every page before any query, as a combobox that owns a listbox, with no axe violations', async () => {
    const { container } = await openAt('/', 'bit Design System');
    await userEvent.keyboard('{Control>}k{/Control}');
    const list = within(dialog()).getByRole('listbox', { name: 'Results' });
    expect(box()).toHaveAttribute('aria-controls', list.id);
    expect(box()).toHaveAttribute('aria-expanded', 'true');
    expect(within(list).getAllByRole('option')[0]).toHaveAccessibleName('Overview, Start here');
    expect(activeOption()).toHaveAttribute('aria-selected', 'true');
    await expectNoA11yViolations(container);
    await userEvent.type(box(), 'size');
    await expectNoA11yViolations(container);
  });

  it('arrows move the active result, wrapping, and the box keeps focus', async () => {
    await openAt('/', 'bit Design System');
    await userEvent.keyboard('{Control>}k{/Control}');
    await userEvent.type(box(), 'button');
    expect(activeOption()).toHaveAccessibleName('Button, Components');
    await userEvent.keyboard('{ArrowDown}');
    const second = activeOption();
    expect(second).not.toHaveAccessibleName('Button, Components');
    expect(second).toHaveAttribute('aria-selected', 'true');
    expect(screen.getAllByRole('option', { selected: true })).toHaveLength(1);
    await userEvent.keyboard('{ArrowUp}{ArrowUp}');
    const options = screen.getAllByRole('option');
    expect(activeOption()).toBe(options[options.length - 1]);
    expect(box()).toHaveFocus();
  });

  it('Enter opens the active page and moves focus to its h1 once the dialog has closed', async () => {
    const { router } = await openAt('/', 'bit Design System');
    await userEvent.keyboard('{Control>}k{/Control}');
    await userEvent.type(box(), 'badge');
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(router.state.location.pathname).toBe('/components/badge'));
    await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: 'Badge' })).toHaveFocus());
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it("a prop result goes to that component's Props section", async () => {
    const { router } = await openAt('/', 'bit Design System');
    await userEvent.keyboard('{Control>}k{/Control}');
    await userEvent.type(box(), 'tooltip describe');
    expect(activeOption()).toHaveAccessibleName('describe, Components');
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(router.state.location.pathname).toBe('/components/tooltip'));
    expect(router.state.location.hash).toBe('#section-props');
    await waitFor(() => expect(screen.getByRole('heading', { level: 2, name: 'Props' })).toHaveFocus());
  });

  it('a click on a result opens it too', async () => {
    const { router } = await openAt('/', 'bit Design System');
    await userEvent.keyboard('{Control>}k{/Control}');
    await userEvent.type(box(), 'spacing');
    await userEvent.click(screen.getByRole('option', { name: 'Spacing, Foundations' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/spacing'));
  });

  it('shows an empty state, announced, when nothing matches; the listbox goes away', async () => {
    await openAt('/', 'bit Design System');
    await userEvent.keyboard('{Control>}k{/Control}');
    await userEvent.type(box(), 'zzzz');
    expect(within(dialog()).getByRole('status')).toHaveTextContent('No results for “zzzz”.');
    expect(within(dialog()).queryByRole('listbox')).toBeNull();
    expect(box()).toHaveAttribute('aria-expanded', 'false');
    expect(box()).not.toHaveAttribute('aria-activedescendant');
    await userEvent.keyboard('{Enter}');
    expect(dialog()).toHaveAttribute('open');
  });

  // jsdom's <dialog> has no Esc (the browser's cancel event); the e2e presses Esc for real.
  it('the × closes it, and the next open starts with an empty query', async () => {
    await openAt('/', 'bit Design System');
    await userEvent.keyboard('{Control>}k{/Control}');
    await userEvent.type(box(), 'tabs');
    await userEvent.click(within(dialog()).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await userEvent.keyboard('{Control>}k{/Control}');
    expect(box()).toHaveValue('');
  });
});
