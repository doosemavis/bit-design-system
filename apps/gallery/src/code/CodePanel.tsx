import { useState } from 'react';
import { CodeBlock, Link, SegmentedControl, Switch, Text } from '@bit-ds/react';
import { Link as RouterLink } from 'react-router-dom';
import type { ControlState, Manifest } from '../manifests/types';
import { CODE_FORMATS, codeFor } from './codeFormats';

interface CodePanelProps {
  manifest: Manifest;
  state: ControlState;
}

/**
 * The Playground's footer: a SegmentedControl picks the format (Props | className | HTML, whichever
 * apply), a "Full file" Switch (on by default) wraps the JSX in a file you can paste, and a CodeBlock shows
 * the code with Copy. The full file leaves out the style imports, so a note under it points to Getting started. The choice is local to the page; an unavailable one falls back to Props.
 */
export function CodePanel({ manifest, state }: CodePanelProps) {
  const formats = CODE_FORMATS.filter((format) => format.available(manifest, state));
  const [formatId, setFormatId] = useState(formats[0]!.id);
  // On by default: a bare JSX line isn't a runnable React file, so lead with the whole file.
  const [wholeFile, setWholeFile] = useState(true);
  const format = formats.find((f) => f.id === formatId) ?? formats[0]!;
  const showsFullFile = wholeFile && format.fullFile;
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
      {showsFullFile ? (
        <Text>
          Styles aren't in this file: you add them once for the whole app. See{' '}
          <Link asChild>
            <RouterLink to="/getting-started">Getting started</RouterLink>
          </Link>
          .
        </Text>
      ) : null}
    </div>
  );
}
