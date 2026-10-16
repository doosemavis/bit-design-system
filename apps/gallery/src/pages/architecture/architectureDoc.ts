import architectureMd from '../../../../../ARCHITECTURE.md?raw';

/** One row of ARCHITECTURE.md §4, "What kind of design system this is". */
export interface Axis {
  readonly axis: string;
  readonly choice: string;
  /** The rejected alternatives, split at the semicolons the doc writes between them. */
  readonly over: readonly string[];
  readonly why: string;
  readonly cost: string;
  readonly revisit: string;
}

/** The six-column body rows of the §4 table: lines that open with a bold axis name. */
const ROW = /^\| \*\*(.+?)\*\* \|(.+)\|\s*$/;

/**
 * Reads the §4 table out of ARCHITECTURE.md, so the page renders the doc's own words instead of a copy that could
 * drift. Cells hold plain text and `inline code` (renderInline draws the code), never a pipe. Throws on a row that
 * doesn't have six cells: the doc's table changed shape, so fix this parser with it.
 */
export function parseAxes(md: string): Axis[] {
  const section = md.slice(md.indexOf('## 4. What kind of design system this is'), md.indexOf('\n## 5.'));
  return section
    .split('\n')
    .map((line) => ROW.exec(line))
    .filter((match): match is RegExpExecArray => match !== null)
    .map((match) => {
      const cells = match[2]!.split(' | ').map((cell) => cell.trim());
      if (cells.length !== 5) throw new Error(`[gallery] ARCHITECTURE.md §4 row "${match[1]}" has ${cells.length + 1} cells, not 6`);
      const [choice, rejected, why, cost, revisit] = cells as [string, string, string, string, string];
      return { axis: match[1]!, choice, over: rejected.split(/;\s*/), why, cost, revisit };
    });
}

/** The six axes as ARCHITECTURE.md states them, read at build time. */
export const AXES: readonly Axis[] = parseAxes(architectureMd);
