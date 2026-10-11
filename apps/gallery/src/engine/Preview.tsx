import { useState } from 'react';
import type { ReactNode } from 'react';
import { Switch, Text } from '@bit-ds/react';

interface PreviewProps {
  label: string;
  /** The preset buttons, shown in the bar between the title and the checkerboard switch. */
  presets?: ReactNode;
  children: ReactNode;
}

/**
 * The stage the live component sits on, under its bar. Checkerboard helps judge ghost and outline variants.
 * No Card of its own: the Playground card frames it together with the controls. The frame holds the bar and
 * the stage together, so they stick under the site header while a long controls list scrolls beside them.
 */
export function Preview({ label, presets, children }: PreviewProps) {
  const [checkerboard, setCheckerboard] = useState(false);
  return (
    <section className="gallery-preview" aria-label={label} data-checkerboard={checkerboard ? '' : undefined}>
      <div className="gallery-preview__frame">
        <div className="gallery-preview__bar">
          <Text size={14} className="gallery-preview__title">Preview</Text>
          {presets}
          <Switch size="sm" checked={checkerboard} onChange={(event) => setCheckerboard(event.target.checked)}>
            Checkerboard
          </Switch>
        </div>
        <div className="gallery-preview__stage">{children}</div>
      </div>
    </section>
  );
}
