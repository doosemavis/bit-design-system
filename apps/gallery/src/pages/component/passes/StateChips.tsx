import type { ReactElement } from 'react';
import { SegmentedControl } from '@bit-ds/react';

export const TRY_IT = 'Try it';

interface StateChipsProps {
  labels: readonly string[];
  value: string;
  onPick: (label: string) => void;
}

/** The States chips: one SegmentedControl, so one tab stop. */
export function StateChips({ labels, value, onPick }: StateChipsProps): ReactElement {
  return (
    <SegmentedControl
      legend="State"
      legendHidden
      options={[...labels, TRY_IT].map((label) => ({ value: label, label }))}
      value={value}
      onValueChange={onPick}
    />
  );
}
