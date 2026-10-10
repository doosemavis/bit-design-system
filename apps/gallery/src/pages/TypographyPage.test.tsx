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
    expect(outline).toEqual(['H1 Typography', 'H2 Fonts', 'H2 Headings', 'H2 Text sizes', "H2 Do and Don't"]);
  });

  it('shows all four fonts, each card in three parts: header, Sample and In use groups, footer', async () => {
    await renderTypography();
    const cards = ['Lilita One', 'Nunito', 'Press Start 2P', 'JetBrains Mono'].map((name) => screen.getByRole('article', { name }));
    const faces = ['display', 'body', 'pixel', 'mono'];
    cards.forEach((card, i) => {
      const face = faces[i]!;
      expect([...card.children].map((part) => part.classList[0])).toEqual(['bit-card__header', 'bit-card__body', 'bit-card__footer']);
      // Header: the name in its font, and its token.
      const header = card.querySelector('.bit-card__header')!;
      expect(header.querySelector('.gallery-face')).toHaveAttribute('data-face', face);
      expect(within(header as HTMLElement).getByText(`--bit-font-${face}`)).toHaveClass('bit-code');
      // Body: a labelled Sample group of two quotes in the font, then a labelled In use group.
      const groups = [...card.querySelectorAll('[data-group]')];
      expect(groups.map((g) => g.getAttribute('data-group'))).toEqual(['sample', 'in-use']);
      expect(groups.map((g) => g.firstElementChild?.textContent)).toEqual(['Sample', 'In use']);
      const quotes = [...groups[0]!.querySelectorAll('.gallery-face--sample')];
      expect(quotes).toHaveLength(2);
      for (const quote of quotes) {
        expect(quote).toHaveAttribute('data-face', face);
        expect(quote.textContent).toMatch(/^“.+”$/);
      }
      // Only the quotes: no alphabet, digits, game titles or years.
      expect(card.textContent).not.toMatch(/ABCDEFG|0123456789|\(\d{4}\)/);
      // Footer: what the font is used for.
      const footer = card.querySelector('.bit-card__footer')!;
      expect(footer).toHaveTextContent(/^Used for /);
      // One size under body text, so the line fits in the card.
      expect(footer.querySelector('.bit-text')).toHaveAttribute('data-size', '14');
    });
    // Each "In use" sample is the real component that uses the font.
    expect(cards[0]!.querySelector('.bit-heading')).toHaveAttribute('role', 'presentation');
    expect(cards[2]!.querySelectorAll('.bit-badge')).toHaveLength(2);
    expect(within(cards[3]!).getByText('npm i @bit-ds/react')).toHaveClass('bit-code');
  });

  it('the Headings table shows every size from 44 down to 20 as a real Heading, with the tag the size picks', async () => {
    await renderTypography();
    const table = screen.getByRole('table', { name: 'Headings' });
    const samples = [...table.querySelectorAll('.bit-heading')];
    expect(samples.map((el) => `${el.tagName} ${el.getAttribute('data-size')}`)).toEqual([
      'H1 44',
      'H1 42',
      'H1 40',
      'H2 38',
      'H2 36',
      'H2 34',
      'H2 32',
      'H3 30',
      'H3 28',
      'H3 26',
      'H4 24',
      'H5 22',
      'H6 20',
    ]);
    for (const el of samples) expect(el).toHaveAttribute('role', 'presentation');
    expect(within(table).getByText('<Heading size={20}>')).toHaveClass('bit-code');
    expect(table.textContent).not.toContain('level');
    expect(table.textContent).not.toContain('as=');
  });

  it.each([
    ['Headings', ['Example', 'Size', 'Tag', 'Code'], 10, ['24', 'h4']],
    ['Text sizes', ['Example', 'Size', 'Token', 'Code'], 1, ['16', '--bit-text-16px']],
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

  it("every Headings row's size has a rule in heading.css, its tag is the sample's, and its code is size only", async () => {
    // Not new URL(..., import.meta.url): under jsdom Vite rewrites that to an http: URL; ?raw CSS comes back empty.
    const css = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../../../../packages/core/src/components/heading.css'), 'utf8');
    await renderTypography();
    const table = screen.getByRole('table', { name: 'Headings' });
    for (const row of table.querySelectorAll('.bit-table__body .bit-table__row')) {
      const [, size, tag, code] = cellTexts(row);
      expect(css, `${size}: a data-size rule`).toContain(`.bit-heading[data-size="${size}"]`);
      const sample = row.querySelector('.bit-heading')!;
      expect(sample.tagName.toLowerCase(), `${size} tag`).toBe(tag);
      expect(sample).toHaveAttribute('data-size', size);
      expect(code, `${size} code`).toBe(`<Heading size={${size}}>`);
    }
  });

  it('the Text sizes table shows 18, 16 and 14 muted, with their code', async () => {
    await renderTypography();
    const table = screen.getByRole('table', { name: 'Text sizes' });
    const samples = [...table.querySelectorAll('.bit-table__body .bit-table__cell:first-child .bit-text')];
    expect(samples.map((el) => el.getAttribute('data-size'))).toEqual(['18', '16', '14']);
    expect(samples[2]).toHaveClass('bit-neutral');
    expect(within(table).getByText('<Text size={14} color="neutral">')).toHaveClass('bit-code');
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
