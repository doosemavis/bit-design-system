import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { screen, within } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderAt } from '../test/renderRoute';

async function renderTypography() {
  const utils = renderAt('/typography');
  await screen.findByRole('heading', { level: 1, name: 'Typography' });
  return { ...utils, main: screen.getByRole('main') };
}

/** The text of each cell in a table row, in column order. */
function cellTexts(row: Element): (string | null)[] {
  return [...row.querySelectorAll('.bit-table__cell')].map((cell) => cell.textContent);
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
    expect(within(table).getByText('<Heading level={6}>')).toHaveClass('bit-code');
  });

  it.each([
    ['Heading levels', ['Example', 'Tag', 'Size', 'Face', 'Code'], 3, ['h4', '15', 'body bold']],
    ['Text sizes', ['Example', 'Size', 'Token', 'Code'], 1, ['15', '--bit-text-15px']],
  ])('the %s table gives each value a column, centered under its heading', async (name, head, sampleRow, values) => {
    await renderTypography();
    const table = screen.getByRole('table', { name });
    expect(cellTexts(table.querySelector('.bit-table__head .bit-table__row')!)).toEqual(head);
    const rows = [...table.querySelectorAll('.bit-table__body .bit-table__row')];
    expect(cellTexts(rows[sampleRow]!).slice(1, -1)).toEqual(values);
    for (const row of [table.querySelector('.bit-table__head .bit-table__row')!, ...rows]) {
      const centered = [...row.querySelectorAll('.bit-table__cell')].map((cell) => cell.classList.contains('gallery-cell-center'));
      // Example and Code stay left; every value column between them is centered.
      expect(centered).toEqual(head.map((_, i) => i > 0 && i < head.length - 1));
    }
  });

  // Value: protects=each Headings row's size and face cells match heading.css for that level; fails_when=heading.css changes a level's size or face (as h6 11→13 did) and the page text does not; why_new=only h4's text is checked, never against the CSS; seam=none
  it("every Headings row's size and face match heading.css", async () => {
    // Not new URL(..., import.meta.url): under jsdom Vite rewrites that to an http: URL; ?raw CSS comes back empty.
    const css = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../../../../packages/core/src/components/heading.css'), 'utf8');
    await renderTypography();
    const table = screen.getByRole('table', { name: 'Heading levels' });
    const rows = [...table.querySelectorAll('.bit-table__body .bit-table__row')];
    for (let level = 1; level <= 6; level++) {
      const rule = new RegExp(`\\.bit-heading\\[data-level="${level}"\\]\\s*\\{([^}]*)\\}`).exec(css)?.[1] ?? '';
      const size = /font-size:\s*var\(--bit-text-(\d+)px\)/.exec(rule)?.[1];
      const face = /font-family:\s*var\(--bit-font-(\w+)\)/.exec(rule)?.[1];
      expect(size, `h${level} font-size`).toBeDefined();
      const [, tag, sizeCell, faceCell] = cellTexts(rows[level - 1]!);
      expect(tag, `h${level} tag`).toBe(`h${level}`);
      expect(sizeCell, `h${level} size`).toBe(size);
      expect(faceCell, `h${level} face`).toMatch(new RegExp(`^${face}\\b`));
    }
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
