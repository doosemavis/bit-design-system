import { screen, within } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderAt } from '../test/renderRoute';

async function renderTypography() {
  const utils = renderAt('/typography');
  await screen.findByRole('heading', { level: 1, name: 'Typography' });
  return { ...utils, main: screen.getByRole('main') };
}

describe('Typography page', () => {
  beforeEach(() => {
    document.documentElement.dataset.theme = 'power-up';
  });

  it("the outline is the page's own headings; the heading samples are not headings", async () => {
    const { main } = await renderTypography();
    const outline = within(main)
      .getAllByRole('heading')
      .map((h) => `${h.tagName} ${h.textContent}`);
    expect(outline).toEqual(['H1 Typography', 'H2 Faces', 'H2 Headings', 'H2 Text sizes', "H2 Do and Don't"]);
  });

  it('shows the four faces, each with its font token', async () => {
    const { container } = await renderTypography();
    const faces = [...container.querySelectorAll('.gallery-face')].map((el) => el.getAttribute('data-face'));
    expect(faces).toEqual(['display', 'body', 'pixel', 'mono']);
    for (const face of faces) expect(screen.getByText(`--bit-font-${face}`)).toHaveClass('bit-code');
  });

  it('the Headings table renders every level as a real Heading, with its tag, size, face and code', async () => {
    await renderTypography();
    const table = screen.getByRole('table', { name: 'Heading levels' });
    const samples = [...table.querySelectorAll('.bit-heading')];
    expect(samples.map((el) => `${el.tagName} ${el.getAttribute('data-level')}`)).toEqual([
      'H1 1',
      'H2 2',
      'H3 3',
      'H4 4',
      'H5 5',
      'H6 6',
    ]);
    for (const el of samples) expect(el).toHaveAttribute('role', 'presentation');
    expect(within(table).getByText('h4 · 15 · body bold')).toBeInTheDocument();
    expect(within(table).getByText('<Heading level={6}>')).toHaveClass('bit-code');
  });

  it('the Text sizes table shows 18, 15 and 13 muted, with their code', async () => {
    await renderTypography();
    const table = screen.getByRole('table', { name: 'Text sizes' });
    const samples = [...table.querySelectorAll('.bit-table__body .bit-table__cell:first-child .bit-text')];
    expect(samples.map((el) => el.getAttribute('data-size'))).toEqual(['18', '15', '13']);
    expect(samples[2]).toHaveClass('bit-neutral');
    expect(within(table).getByText('<Text size={13} color="neutral">')).toHaveClass('bit-code');
  });

  it("Do and Don't are success and danger Alerts, read as notes rather than live status", async () => {
    const { main } = await renderTypography();
    const notes = within(main).getAllByRole('note');
    expect(notes.map((n) => n.className)).toEqual([
      'bit-alert bit-success bit-outline',
      'bit-alert bit-danger bit-outline',
    ]);
    expect(within(notes[0]!).getByText('Do')).toBeInTheDocument();
    expect(within(notes[1]!).getByText("Don't")).toBeInTheDocument();
  });

  it('uses no raw table, code, pre or heading tags: every one comes from a bit component', async () => {
    const { main } = await renderTypography();
    for (const el of main.querySelectorAll('table, code, pre, h1, h2, h3, h4, h5, h6')) {
      expect(el.matches('.bit-table__table, .bit-code, .bit-code__pre, .bit-code__pre code, .bit-heading'), el.outerHTML).toBe(true);
    }
  });
});
