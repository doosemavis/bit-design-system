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

/** Where the doc's relative links land: the repo's files on GitHub, as they do for a reader of ARCHITECTURE.md there. */
export const REPO_FILES = 'https://github.com/doosemavis/bit-design-system/blob/main/';

/** A run of a cell's text, and the link it is, if it is one. */
export interface Span {
  readonly text: string;
  readonly href?: string;
}

/** A markdown link, `[label](href)`. The capture groups put each label and its href next to each other in a split. */
const LINK = /\[([^\]]+)\]\(([^)\s]+)\)/;

/**
 * A cell's text as runs of plain text and links, each link's href resolved against REPO_FILES, so a link that works
 * in ARCHITECTURE.md on GitHub works on the page too. A label keeps its `inline code` for renderInline to draw.
 */
export function splitLinks(text: string): Span[] {
  // Split with two capture groups: text, label, href, text, label, href, … text.
  const parts = text.split(new RegExp(LINK, 'g'));
  return parts.flatMap((part, i): Span[] => {
    if (i % 3 === 0) return part ? [{ text: part }] : [];
    if (i % 3 === 1) return [{ text: part, href: new URL(parts[i + 1]!, REPO_FILES).href }];
    return [];
  });
}

/** The six-column body rows of the §4 table: lines that open with a bold axis name. */
const ROW = /^\| \*\*(.+?)\*\* \|(.+)\|\s*$/;

/**
 * Reads the §4 table out of ARCHITECTURE.md, so the page renders the doc's own words instead of a copy that could
 * drift. Cells hold plain text, `inline code` (renderInline draws it) and markdown links (splitLinks), never a pipe.
 * Throws on a row that doesn't have six cells: the doc's table changed shape, so fix this parser with it.
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

/** The heading of §1's one-paragraph summary. */
const SUMMARY_HEADING = '### A Design System à la System Design';

/**
 * §1's summary in the doc's own words: the text between its heading and the next heading, with its **bold** terms
 * and `inline code` left for the page to draw. Throws when the heading is gone or the summary has grown past one
 * paragraph, so the page never shows a stale or half copy.
 */
export function parseSummary(md: string): string {
  const start = md.indexOf(SUMMARY_HEADING);
  if (start === -1) throw new Error(`[gallery] ARCHITECTURE.md has no "${SUMMARY_HEADING}" section`);
  const body = md.slice(start + SUMMARY_HEADING.length).split(/\n#{2,3} /)[0]!.trim();
  if (!body || body.includes('\n')) throw new Error(`[gallery] ARCHITECTURE.md's "${SUMMARY_HEADING}" must be one paragraph`);
  return body;
}

/** The one-paragraph summary as ARCHITECTURE.md states it, read at build time. */
export const SUMMARY: string = parseSummary(architectureMd);
