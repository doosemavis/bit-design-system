import { useState } from 'react';
import type { ReactNode } from 'react';

interface PreviewProps {
  label: string;
  children: ReactNode;
}

/** The stage the live component sits on. Checkerboard helps judge ghost and outline variants. */
export function Preview({ label, children }: PreviewProps) {
  const [checkerboard, setCheckerboard] = useState(false);
  return (
    <section className="gallery-preview" aria-label={label} data-checkerboard={checkerboard ? '' : undefined}>
      <div className="gallery-preview__bar">
        <span className="gallery-preview__title">Preview</span>
        <span className="gallery-control gallery-inline">
          <span className="gallery-control__label" id="checkerboard-label">
            Checkerboard
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={checkerboard}
            aria-labelledby="checkerboard-label"
            className="gallery-switch"
            data-on={checkerboard ? '' : undefined}
            onClick={() => setCheckerboard((v) => !v)}
          >
            <span className="gallery-switch__knob" aria-hidden="true" />
          </button>
        </span>
      </div>
      <div className="gallery-preview__stage">{children}</div>
    </section>
  );
}
