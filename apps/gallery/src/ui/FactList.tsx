import { Card, CardBody, Text } from '@bit-ds/react';

/** One fact: a count and what it counts. */
export type Fact = readonly [count: number, label: string];

interface FactListProps {
  facts: readonly Fact[];
  /** The list's name for screen readers. */
  label: string;
}

/**
 * Counted facts as outline cards: each count in the pixel face and the link color, its label beside it as a small
 * pixel caption, both resting on one line (owner's pick B, 2026-10-11). A list for screen readers. Count each fact
 * from its source, so it stays true as the system grows.
 */
export function FactList({ facts, label }: FactListProps) {
  return (
    <ul className="gallery-facts" aria-label={label}>
      {facts.map(([count, name]) => (
        <li key={name}>
          <Card variant="outline">
            <CardBody>
              <div className="gallery-fact">
                <span className="gallery-fact__count">{count}</span>
                <Text color="neutral" className="gallery-fact__label">
                  {name}
                </Text>
              </div>
            </CardBody>
          </Card>
        </li>
      ))}
    </ul>
  );
}
