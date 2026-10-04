import { useState } from 'react';
import { CodeBlock, SegmentedControl, Switch } from '@bit-ds/react';
import type { ControlState, Manifest } from '../manifests/types';
import { CODE_FORMATS, codeFor } from './codeFormats';

interface CodePanelProps {
  manifest: Manifest;
  state: ControlState;
}

/**
 * The Playground's footer: a SegmentedControl picks the format (Props | className | HTML, whichever
 * apply), a "Full file" Switch wraps the JSX in a file you can paste, and a CodeBlock shows the code with
 * Copy. The choice is local to the page; an unavailable one falls back to Props.
 */
export function CodePanel({ manifest, state }: CodePanelProps) {
  const formats = CODE_FORMATS.filter((format) => format.available(manifest));
  const [formatId, setFormatId] = useState(formats[0]!.id);
  const [wholeFile, setWholeFile] = useState(false);
  const format = formats.find((f) => f.id === formatId) ?? formats[0]!;
  return (
    <div className="gallery-codepanel">
      <div className="gallery-codepanel__bar">
        {formats.length > 1 ? (
          <SegmentedControl
            legend="Code format"
            legendHidden
            size="sm"
            options={formats.map((f) => ({ value: f.id, label: f.label }))}
            value={format.id}
            onValueChange={setFormatId}
          />
        ) : null}
        {format.fullFile ? (
          <Switch size="sm" checked={wholeFile} onChange={(event) => setWholeFile(event.target.checked)}>
            Full file
          </Switch>
        ) : null}
      </div>
      <CodeBlock code={codeFor(format, manifest, state, wholeFile)} language={format.language} label="Example code" />
    </div>
  );
}
