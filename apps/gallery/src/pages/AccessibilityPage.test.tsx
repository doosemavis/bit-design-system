import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderAt } from '../test/renderRoute';
import { expectNoA11yViolations } from '../test/a11y';

async function renderAccessibility() {
  const utils = renderAt('/accessibility');
  await screen.findByRole('heading', { level: 1, name: 'Accessibility' });
  return { ...utils, main: screen.getByRole('main') };
}

describe('Accessibility page', () => {
  it('has an h1, a section bar, and six h2 sections in order', async () => {
    const { main } = await renderAccessibility();
    const nav = screen.getByRole('navigation', { name: 'On this page' });
    const sections = ['Built in', 'Keyboard', 'Screen readers', 'Color and vision', 'Motion', 'Before you ship'];
    expect(within(nav).getAllByRole('link').map((l) => l.textContent)).toEqual(sections);
    // Only the page's own headings: the example titles are h3s, and the heading samples are presentation.
    const outline = within(main)
      .getAllByRole('heading')
      .filter((h) => h.tagName !== 'H3')
      .map((h) => `${h.tagName} ${h.textContent}`);
    expect(outline).toEqual(['H1 Accessibility', ...sections.map((name) => `H2 ${name}`)]);
  });

  it('Built in shows a card for each thing bit does for you', async () => {
    await renderAccessibility();
    const section = screen.getByRole('region', { name: 'Built in' });
    expect(within(section).getAllByRole('article').map((card) => card.getAttribute('aria-label'))).toEqual([
      'Real HTML',
      'Contrast, tested',
      'A focus ring you can see',
      'Readable sizes',
      'Reduced motion',
      'High contrast',
      'Announced, not interrupting',
      'Checked on every change',
    ]);
  });

  it('the Keyboard table lists each interactive component, linked to its page', async () => {
    await renderAccessibility();
    const table = screen.getByRole('table', { name: 'Keys by component' });
    const links = within(table).getAllByRole('link');
    expect(links.map((l) => l.textContent)).toEqual(['Button', 'Link', 'Switch', 'Checkbox', 'RadioGroup', 'SegmentedControl', 'Select', 'Tabs', 'Dialog', 'Tooltip', 'CodeBlock']);
    expect(links[5]).toHaveAttribute('href', expect.stringContaining('/components/segmentedcontrol'));
  });

  it.each([
    ['Keyboard', ['Keep the Tab order the reading order', 'Let Dialog handle focus', 'Arrow keys inside a group', 'Add a skip link']],
    [
      'Screen readers',
      [
        'Name every icon-only button',
        'Hide decorative icons, name meaningful ones',
        'Give every field a label, and say what went wrong',
        'Keep titles in order',
        'Tell people what happened, without moving them',
        'Say what is loading',
        'Links go, buttons do',
        'Name tables',
      ],
    ],
    ['Color and vision', ['Say it in words, not just color', 'Keep reading text at 16, captions at 14', 'Respect the light or dark choice']],
    ['Motion', ['Stop your own animations with a media query', 'Check Reduce motion for movement in JavaScript']],
  ])('%s: each example pairs a live sample, framed in a Box, with its code', async (section, titles) => {
    await renderAccessibility();
    const examples = within(screen.getByRole('region', { name: section })).getAllByRole('article');
    expect(examples.map((t) => within(t).getAllByRole('heading')[0]!.textContent)).toEqual(titles);
    for (const example of examples) {
      expect(example.querySelector('.gallery-example__sample.bit-box')).not.toBeNull();
      expect(example.querySelector('.bit-code__block')).not.toBeNull();
    }
  });

  it('the samples do what they teach', async () => {
    await renderAccessibility();
    expect(screen.getByRole('button', { name: 'Delete file' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /Email/ })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Player name' })).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('img', { name: 'Favorite' })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'High scores' })).toBeInTheDocument();
    expect(screen.getByRole('tablist', { name: 'Inventory' })).toBeInTheDocument();
  });

  it('the Dialog example opens, starts on Cancel, and gives focus back to its button when it closes', async () => {
    await renderAccessibility();
    const user = userEvent.setup();
    const open = screen.getByRole('button', { name: 'Delete save' });
    await user.click(open);
    const dialog = screen.getByRole('alertdialog', { name: 'Delete this save?' });
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus();
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(open).toHaveFocus();
  });

  it('ends with the pre-ship checklist', async () => {
    await renderAccessibility();
    const section = screen.getByRole('region', { name: 'Before you ship' });
    expect(within(section).getAllByRole('listitem')).toHaveLength(6);
    expect(section).toHaveTextContent('Tab through the page');
  });

  it('has no accessibility violations', async () => {
    const { container } = await renderAccessibility();
    await expectNoA11yViolations(container);
  });
});
