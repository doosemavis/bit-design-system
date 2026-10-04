import { useState } from 'react';
import type { ReactNode } from 'react';
import { Card, Switch } from '@bit-ds/react';

interface PreviewProps {
  label: string;
  /** The preset buttons, shown in the bar between the title and the checkerboard switch. */
  presets?: ReactNode;
  children: ReactNode;
}

/** The stage the live component sits on. Checkerboard helps judge ghost and outline variants. */
export function Preview({ label, presets, children }: PreviewProps) {
  const [checkerboard, setCheckerboard] = useState(false);
  return (
    <section className="gallery-preview" aria-label={label} data-checkerboard={checkerboard ? '' : undefined}>
      <Card className="gallery-preview__card">
        <div className="gallery-preview__bar">
          <span className="gallery-preview__title">Preview</span>
          {presets}
          <Switch size="sm" checked={checkerboard} onChange={(event) => setCheckerboard(event.target.checked)}>
            Checkerboard
          </Switch>
        </div>
        <div className="gallery-preview__stage">{children}</div>
      </Card>
    </section>
  );
}
