import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { act, render, screen } from '@testing-library/react';
import { Table, TableBody, TableCell, TableHead, TableRow } from './Table';
import type { TableProps } from './Table';
import { expectNoA11yViolations } from '../../test/a11y';

function PropsTable(props: TableProps) {
  return (
    <Table {...props}>
      <TableHead>
        <TableRow>
          <TableCell>Prop</TableCell>
          <TableCell>Default</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow>
          <TableCell as="th" scope="row">
            color
          </TableCell>
          <TableCell>primary</TableCell>
        </TableRow>
        <TableRow>
          <TableCell as="th" scope="row">
            size
          </TableCell>
          <TableCell>md</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

describe('Table', () => {
  it('renders a div.bit-table around table.bit-table__table, with the parts as BEM elements', () => {
    const { container } = render(<PropsTable />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.tagName).toBe('DIV');
    expect(wrapper.className).toBe('bit-table');
    const table = screen.getByRole('table');
    expect(table.parentElement).toBe(wrapper);
    expect(table.className).toBe('bit-table__table');
    expect(table.querySelector('thead')!.className).toBe('bit-table__head');
    expect(table.querySelector('tbody')!.className).toBe('bit-table__body');
    expect(table.querySelector('tr')!.className).toBe('bit-table__row');
    expect([...table.querySelectorAll('th, td')].every((cell) => cell.className === 'bit-table__cell')).toBe(true);
  });

  it('TableCell is th in the head and td in the body, and as overrides it', () => {
    render(<PropsTable />);
    expect(screen.getAllByRole('columnheader').map((c) => [c.tagName, c.textContent])).toEqual([
      ['TH', 'Prop'],
      ['TH', 'Default'],
    ]);
    expect(screen.getAllByRole('rowheader').map((c) => [c.tagName, c.textContent])).toEqual([
      ['TH', 'color'],
      ['TH', 'size'],
    ]);
    expect(screen.getAllByRole('cell').map((c) => [c.tagName, c.textContent])).toEqual([
      ['TD', 'primary'],
      ['TD', 'md'],
    ]);
  });

  it('as="td" makes a plain cell even in the head', () => {
    render(
      <Table>
        <TableHead>
          <TableRow>
            <TableCell as="td">not a header</TableCell>
          </TableRow>
        </TableHead>
      </Table>,
    );
    expect(screen.getByText('not a header').tagName).toBe('TD');
  });

  it('a cell outside any section is a td', () => {
    render(
      <Table>
        <tbody>
          <TableRow>
            <TableCell>loose</TableCell>
          </TableRow>
        </tbody>
      </Table>,
    );
    expect(screen.getByText('loose').tagName).toBe('TD');
  });

  it('className goes on the wrapper; the ref and rest props go on the table', () => {
    const ref = createRef<HTMLTableElement>();
    const { container } = render(
      <Table ref={ref} className="extra" data-testid="table">
        <TableBody />
      </Table>,
    );
    const table = screen.getByTestId('table');
    expect((container.firstElementChild as HTMLElement).className).toBe('bit-table extra');
    expect(table.tagName).toBe('TABLE');
    expect(ref.current).toBe(table);
    expect(table.className).toBe('bit-table__table');
  });

  it('every part takes className and a ref', () => {
    const head = createRef<HTMLTableSectionElement>();
    const row = createRef<HTMLTableRowElement>();
    const cell = createRef<HTMLTableCellElement>();
    const body = createRef<HTMLTableSectionElement>();
    render(
      <Table>
        <TableHead ref={head} className="h">
          <TableRow ref={row} className="r">
            <TableCell ref={cell} className="c">
              Prop
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody ref={body} className="b" />
      </Table>,
    );
    expect(head.current!.className).toBe('bit-table__head h');
    expect(row.current!.className).toBe('bit-table__row r');
    expect(cell.current!.className).toBe('bit-table__cell c');
    expect(body.current!.className).toBe('bit-table__body b');
  });

  it('flat adds bit-flat to the wrapper once, even when className already has it; off by default', () => {
    const { container, rerender } = render(<PropsTable flat />);
    expect((container.firstElementChild as HTMLElement).className).toBe('bit-table bit-flat');
    rerender(<PropsTable flat className="bit-flat" />);
    expect((container.firstElementChild as HTMLElement).className.split(' ').filter((c) => c === 'bit-flat')).toHaveLength(1);
    rerender(<PropsTable />);
    expect((container.firstElementChild as HTMLElement).className).toBe('bit-table');
  });

  it('striped sets data-striped on the wrapper; off by default', () => {
    const { container, rerender } = render(<PropsTable striped />);
    expect(container.firstElementChild).toHaveAttribute('data-striped', '');
    rerender(<PropsTable />);
    expect(container.firstElementChild).not.toHaveAttribute('data-striped');
  });

  it('with no label the wrapper is focusable but not a region', () => {
    const { container } = render(<PropsTable />);
    expect(container.firstElementChild).not.toHaveAttribute('role');
    expect(screen.queryByRole('region')).toBeNull();
  });

  it.each([
    ['aria-label', { 'aria-label': '' }],
    ['aria-labelledby', { 'aria-labelledby': '' }],
  ])('an empty %s does not make an empty-named region', (_attr, props) => {
    const { container } = render(<PropsTable {...props} />);
    expect(container.firstElementChild).not.toHaveAttribute('role');
  });

  it('aria-label names the table while it fits, and the wrapper stays plain, so the name is read once', () => {
    const { container } = render(<PropsTable aria-label="Button props" />);
    expect(screen.getByRole('table', { name: 'Button props' })).toBeInTheDocument();
    expect(screen.queryByRole('region')).toBeNull();
    expect(container.firstElementChild).not.toHaveAttribute('aria-label');
  });

  it('aria-labelledby does the same', () => {
    const { container } = render(
      <>
        <h2 id="props-heading">Props</h2>
        <PropsTable aria-labelledby="props-heading" />
      </>,
    );
    expect(screen.getByRole('table', { name: 'Props' })).toBeInTheDocument();
    expect(screen.queryByRole('region')).toBeNull();
    expect(container.querySelector('.bit-table')).not.toHaveAttribute('aria-labelledby');
  });

  it('rejects the legacy DOM color attribute on every part', () => {
    render(
      // @ts-expect-error color is not part of TableProps
      <Table color="danger" data-testid="table">
        {/* @ts-expect-error color is not part of TableSectionProps */}
        <TableBody color="danger" data-testid="body">
          {/* @ts-expect-error color is not part of TableRowProps */}
          <TableRow color="danger" data-testid="row">
            {/* @ts-expect-error color is not part of TableCellProps */}
            <TableCell color="danger" data-testid="cell">
              x
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    for (const id of ['table', 'body', 'row', 'cell']) expect(screen.getByTestId(id)).not.toHaveAttribute('color');
  });

  it.each([
    ['unlabelled', {}],
    ['labelled and striped', { 'aria-label': 'Button props', striped: true }],
  ])('has no accessibility violations (%s)', async (_name, props) => {
    const { container } = render(<PropsTable {...props} />);
    await expectNoA11yViolations(container);
  });
});

type Callback = ConstructorParameters<typeof ResizeObserver>[0];
let observed: Callback | undefined;
let observedEls: Element[] = [];

class FakeResizeObserver {
  constructor(cb: Callback) {
    observed = cb;
  }
  observe(el: Element) {
    observedEls.push(el);
  }
  disconnect() {}
  unobserve() {}
}

function setWidths(el: HTMLElement, scrollWidth: number, clientWidth: number) {
  Object.defineProperty(el, 'scrollWidth', { configurable: true, value: scrollWidth });
  Object.defineProperty(el, 'clientWidth', { configurable: true, value: clientWidth });
}

describe('Table: Tab stop only when it scrolls', () => {
  beforeEach(() => vi.stubGlobal('ResizeObserver', FakeResizeObserver));
  afterEach(() => {
    vi.unstubAllGlobals();
    observed = undefined;
    observedEls = [];
  });

  function wrapperOf(container: HTMLElement) {
    return container.querySelector('.bit-table') as HTMLElement;
  }

  it('a table that fits is not a Tab stop', () => {
    const { container } = render(<Table><TableBody><TableRow><TableCell>a</TableCell></TableRow></TableBody></Table>);
    const wrapper = wrapperOf(container);
    setWidths(wrapper, 300, 300);
    act(() => observed!([], {} as ResizeObserver));
    expect(wrapper).not.toHaveAttribute('tabindex');
    expect(wrapper).not.toHaveAttribute('role');
  });

  it('an unnamed table that overflows is focusable but has no role, and stops being focusable when it fits again', () => {
    const { container } = render(<Table><TableBody><TableRow><TableCell>a</TableCell></TableRow></TableBody></Table>);
    const wrapper = wrapperOf(container);
    setWidths(wrapper, 900, 300);
    act(() => observed!([], {} as ResizeObserver));
    expect(wrapper).toHaveAttribute('tabindex', '0');
    expect(wrapper).not.toHaveAttribute('role');
    setWidths(wrapper, 300, 300);
    act(() => observed!([], {} as ResizeObserver));
    expect(wrapper).not.toHaveAttribute('tabindex');
  });

  it('a labelled table that overflows is focusable and a named region, and the table drops the name', () => {
    const { container } = render(<Table aria-label="Tokens"><TableBody><TableRow><TableCell>a</TableCell></TableRow></TableBody></Table>);
    const wrapper = wrapperOf(container);
    setWidths(wrapper, 900, 300);
    act(() => observed!([], {} as ResizeObserver));
    expect(wrapper).toHaveAttribute('tabindex', '0');
    expect(wrapper).toHaveAttribute('role', 'region');
    expect(wrapper).toHaveAccessibleName('Tokens');
    expect(screen.getByRole('table')).not.toHaveAttribute('aria-label');
    expect(screen.getByRole('table')).toHaveAccessibleName('');
  });

  it('an aria-labelledby table that overflows is focusable and a named region', () => {
    const { container } = render(
      <>
        <h2 id="tok">Token list</h2>
        <Table aria-labelledby="tok"><TableBody><TableRow><TableCell>a</TableCell></TableRow></TableBody></Table>
      </>,
    );
    const wrapper = wrapperOf(container);
    setWidths(wrapper, 900, 300);
    act(() => observed!([], {} as ResizeObserver));
    expect(wrapper).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('region', { name: 'Token list' })).toBe(wrapper);
    expect(screen.getByRole('table')).not.toHaveAttribute('aria-labelledby');
  });

  it('the name moves to the region when the table starts to scroll, and back to the table when it fits', () => {
    const { container } = render(<Table aria-label="Tokens"><TableBody><TableRow><TableCell>a</TableCell></TableRow></TableBody></Table>);
    const wrapper = wrapperOf(container);
    setWidths(wrapper, 300, 300);
    act(() => observed!([], {} as ResizeObserver));
    expect(wrapper).not.toHaveAttribute('role');
    expect(wrapper).not.toHaveAttribute('tabindex');
    expect(screen.getByRole('table', { name: 'Tokens' })).toBeInTheDocument();
    setWidths(wrapper, 900, 300);
    act(() => observed!([], {} as ResizeObserver));
    expect(screen.getByRole('region', { name: 'Tokens' })).toBe(wrapper);
    expect(screen.getByRole('table')).toHaveAccessibleName('');
    setWidths(wrapper, 300, 300);
    act(() => observed!([], {} as ResizeObserver));
    expect(screen.queryByRole('region')).toBeNull();
    expect(screen.getByRole('table', { name: 'Tokens' })).toBeInTheDocument();
  });

  it('a scrolling labelled table has no accessibility violations', async () => {
    const { container } = render(<PropsTable aria-label="Button props" />);
    setWidths(wrapperOf(container), 900, 300);
    act(() => observed!([], {} as ResizeObserver));
    await expectNoA11yViolations(container);
  });

  it('without ResizeObserver it measures once on mount', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    const { container } = render(<Table><TableBody><TableRow><TableCell>a</TableCell></TableRow></TableBody></Table>);
    // jsdom widths are 0 and 0, so it fits: not a Tab stop.
    expect(wrapperOf(container)).not.toHaveAttribute('tabindex');
  });

  it('observes both the wrapper and the table, so content-only width changes are seen', () => {
    const { container } = render(<Table><TableBody><TableRow><TableCell>a</TableCell></TableRow></TableBody></Table>);
    const wrapper = wrapperOf(container);
    expect(observedEls).toEqual([wrapper, wrapper.querySelector('table')]);
  });

  it('disconnects the observer on unmount', () => {
    const { unmount } = render(<Table><TableBody><TableRow><TableCell>a</TableCell></TableRow></TableBody></Table>);
    expect(() => unmount()).not.toThrow();
  });
});
