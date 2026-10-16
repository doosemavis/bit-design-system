import { BitTheme, Text } from '@bit-ds/react';

/** One count on the board and what it counts. */
export interface Score {
  readonly count: number;
  readonly label: string;
}

/** Digits on the board: every count is padded to the widest (three at least), like an arcade score. */
export function scoreDigits(scores: readonly Score[]): number {
  return Math.max(...scores.map((score) => String(score.count).length), 3);
}

/**
 * bit by the numbers, as an arcade scoreboard: a dark cabinet (a BitTheme subtree in dark mode, whatever the page's
 * mode) whose dotted bezel frames a solid screen, so the dots never sit behind text. Each count is padded with unlit
 * zeros (032) that are hidden from screen readers, which hear "32 components".
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
          {scores.map(({ count, label: name }) => {
            const digits = String(count);
            return (
              <li key={name}>
                <span className="gallery-arch-scoreboard__count">
                  <span className="gallery-arch-scoreboard__unlit" aria-hidden="true">
                    {'0'.repeat(width - digits.length)}
                  </span>
                  {digits}
                </span>{' '}
                <Text color="neutral" className="gallery-arch-label">
                  {name}
                </Text>
              </li>
            );
          })}
        </ul>
      </div>
    </BitTheme>
  );
}
