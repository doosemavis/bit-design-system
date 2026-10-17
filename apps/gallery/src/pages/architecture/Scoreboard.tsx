import { Link as RouterLink } from 'react-router-dom';
import { BitTheme, Link, Text } from '@bit-ds/react';

/** Where a count can be checked: a gallery page (`to`) or a page elsewhere (`href`). */
export type ScoreLink = { readonly to: string } | { readonly href: string };

/** One count on the board, what it counts, and where to see it counted. */
export interface Score {
  readonly count: number;
  readonly label: string;
  readonly link: ScoreLink;
}

/** A score's label as a link to where the count can be checked, in the board's caption face. */
function ScoreLabel({ label, link }: Pick<Score, 'label' | 'link'>) {
  return 'to' in link ? (
    <Link asChild color="neutral" className="gallery-arch-label">
      <RouterLink to={link.to}>{label}</RouterLink>
    </Link>
  ) : (
    <Link color="neutral" className="gallery-arch-label" href={link.href}>
      {label}
    </Link>
  );
}

/** Digits on the board: every count is padded to the widest (three at least), like an arcade score. */
export function scoreDigits(scores: readonly Score[]): number {
  return Math.max(...scores.map((score) => String(score.count).length), 3);
}

/**
 * bit by the numbers, as an arcade scoreboard: a dark cabinet (a BitTheme subtree in dark mode, whatever the page's
 * mode) whose dotted bezel frames a solid screen, so the dots never sit behind text. Each count is padded with unlit
 * zeros (033) that are hidden from screen readers, which hear "33 components". Each label links to where its count can
 * be checked.
 */
export function Scoreboard({ scores, label }: { scores: readonly Score[]; label: string }) {
  const width = scoreDigits(scores);
  return (
    <BitTheme mode="dark" className="gallery-arch-scoreboard">
      <div className="gallery-arch-scoreboard__screen">
        <Text className="gallery-arch-label gallery-arch-scoreboard__title" aria-hidden="true">
          {label}
        </Text>
        <ul role="list" className="gallery-arch-scoreboard__scores" aria-label={label}>
          {scores.map(({ count, label: name, link }) => {
            const digits = String(count);
            return (
              <li key={name}>
                <span className="gallery-arch-scoreboard__count">
                  <span className="gallery-arch-scoreboard__unlit" aria-hidden="true">
                    {'0'.repeat(width - digits.length)}
                  </span>
                  {digits}
                </span>{' '}
                <ScoreLabel label={name} link={link} />
              </li>
            );
          })}
        </ul>
      </div>
    </BitTheme>
  );
}
