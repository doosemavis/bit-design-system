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

  it('the Headings table renders every tag as a real Heading, with its tag, size, face and code', async () => {
    await renderTypography();
    const table = screen.getByRole('table', { name: 'Headings' });
    const samples = [...table.querySelectorAll('.bit-heading')];
    expect(samples.map((el) => `${el.tagName} ${el.getAttribute('data-size')}`)).toEqual([
      'H1 32',
      'H2 24',
      'H3 18',
      'H4 15',
      'H5 13',
      'H6 13',
    ]);
    for (const el of samples) expect(el).toHaveAttribute('role', 'presentation');
    expect(within(table).getByText('<Heading as="h6" size={13}>')).toHaveClass('bit-code');
    expect(table.textContent).not.toContain('level');
  });

  it.each([
    ['Headings', ['Example', 'Tag', 'Size', 'Face', 'Code'], 3, ['h4', '15', 'body bold']],
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

  // Value: protects=each Headings row's face cell matches heading.css for its size; fails_when=heading.css changes the face a size uses and the page text does not; why_new=only h4's text is checked, never against the CSS; seam=none
  it("every Headings row's face matches heading.css for its size, and its code names as and size", async () => {
    // Not new URL(..., import.meta.url): under jsdom Vite rewrites that to an http: URL; ?raw CSS comes back empty.
    const css = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../../../../packages/core/src/components/heading.css'), 'utf8');
    await renderTypography();
    const table = screen.getByRole('table', { name: 'Headings' });
    for (const row of table.querySelectorAll('.bit-table__body .bit-table__row')) {
      const [, tag, size, faceCell, code] = cellTexts(row);
      const rule = new RegExp(`\\.bit-heading\\[data-size="${size}"\\]\\s*\\{([^}]*)\\}`).exec(css)?.[1] ?? '';
      const face = /font-family:\s*var\(--bit-font-(\w+)\)/.exec(rule)?.[1];
      expect(face, `${tag} at ${size}: a data-size rule`).toBeDefined();
      expect(faceCell, `${tag} face`).toMatch(new RegExp(`^${face}\\b`));
      expect(code, `${tag} code`).toBe(`<Heading as="${tag}" size={${size}}>`);
      expect(row.querySelector('.bit-heading'), `${tag} sample`).toHaveAttribute('data-size', size);
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
