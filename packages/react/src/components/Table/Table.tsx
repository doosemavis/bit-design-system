import { createContext, forwardRef, useContext, useEffect, useState } from 'react';
import type { HTMLAttributes, TableHTMLAttributes, TdHTMLAttributes } from 'react';
import { element, toClasses, withClassName } from '../../system/toClasses';
import { dropLegacyColor } from '../../system/dropLegacyColor';

/** Which section a cell is in, so TableCell can pick th (head) or td (body). Private. */
const TableSectionContext = createContext<'head' | 'body'>('body');

/** True while the element is wider inside than out, re-measured on every resize. */
function useOverflows(): [(node: HTMLDivElement | null) => void, boolean] {
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const [overflows, setOverflows] = useState(false);
  useEffect(() => {
    if (!node) return;
    const measure = () => setOverflows(node.scrollWidth > node.clientWidth);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    // Watch the table too: its width changes (fonts, content) without the wrapper box changing.
    [node, ...Array.from(node.children)].forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [node]);
  return [setNode, overflows];
}

export interface TableProps extends Omit<TableHTMLAttributes<HTMLTableElement>, 'color'> {
  /** Shade every other body row. Rendered as `data-striped` on the wrapper. */
  striped?: boolean;
}

/**
 * A native table in a bordered wrapper that scrolls sideways when the table is too wide. The wrapper
 * takes `className`. The wrapper is focusable only while the table is too wide and scrolls, so the scroll
 * works from the keyboard without an extra Tab stop the rest of the time. With an `aria-label` or
 * `aria-labelledby` it is also a named region. The table takes the ref and every other prop.
 */
export const Table = forwardRef<HTMLTableElement, TableProps>(function Table(
  { striped = false, className, ...rest },
  ref,
) {
  const [measureRef, overflows] = useOverflows();
  const label = rest['aria-label'];
  const labelledBy = rest['aria-labelledby'];
  // An empty string names nothing, so it must not make an empty-named region.
  const named = Boolean(label) || Boolean(labelledBy);
  return (
    <div
      ref={measureRef}
      className={toClasses('table', [], className)}
      data-striped={striped ? '' : undefined}
      tabIndex={overflows ? 0 : undefined}
      role={named || overflows ? 'region' : undefined}
      aria-label={label}
      aria-labelledby={labelledBy}
    >
      <table ref={ref} className={element('table', 'table')} {...dropLegacyColor(rest)} />
    </div>
  );
});

export type TableSectionProps = Omit<HTMLAttributes<HTMLTableSectionElement>, 'color'>;

export const TableHead = forwardRef<HTMLTableSectionElement, TableSectionProps>(function TableHead(
  { className, ...rest },
  ref,
) {
  return (
    <TableSectionContext.Provider value="head">
      <thead ref={ref} className={withClassName(element('table', 'head'), className)} {...dropLegacyColor(rest)} />
    </TableSectionContext.Provider>
  );
});

export const TableBody = forwardRef<HTMLTableSectionElement, TableSectionProps>(function TableBody(
  { className, ...rest },
  ref,
) {
  return (
    <TableSectionContext.Provider value="body">
      <tbody ref={ref} className={withClassName(element('table', 'body'), className)} {...dropLegacyColor(rest)} />
    </TableSectionContext.Provider>
  );
});

export type TableRowProps = Omit<HTMLAttributes<HTMLTableRowElement>, 'color'>;

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(function TableRow({ className, ...rest }, ref) {
  return <tr ref={ref} className={withClassName(element('table', 'row'), className)} {...dropLegacyColor(rest)} />;
});

export interface TableCellProps extends Omit<TdHTMLAttributes<HTMLTableCellElement>, 'color'> {
  /** Force the element. Default: `th` inside TableHead, `td` everywhere else. */
  as?: 'th' | 'td';
}

export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(function TableCell(
  { as, className, ...rest },
  ref,
) {
  const section = useContext(TableSectionContext);
  const Cell = as ?? (section === 'head' ? 'th' : 'td');
  return <Cell ref={ref} className={withClassName(element('table', 'cell'), className)} {...dropLegacyColor(rest)} />;
});
