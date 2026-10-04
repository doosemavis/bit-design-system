import { Field, Select } from '@bit-ds/react';
import { useEffect } from 'react';
import { lineOf } from '../content/versionLines.mjs';
import { useVersions } from './useVersions';

/** The same page in another release: its path plus the hash route the reader is on. */
export function urlForLine(path: string, hash: string): string {
  return `${path}${hash || '#/'}`;
}

interface Choice {
  value: string;
  label: string;
}

/** Latest first, as versions.json lists them. The current build's line is added if the file lacks it. */
function choicesFrom(file: NonNullable<ReturnType<typeof useVersions>['file']>, currentLine: string): Choice[] {
  const latestLine = lineOf(file.latest);
  const choices = file.lines.map((entry) => ({
    value: entry.line,
    label: `${entry.line}${entry.line === latestLine ? ' (latest)' : ''} · ${entry.version}`,
  }));
  return choices.some((choice) => choice.value === currentLine)
    ? choices
    : [...choices, { value: currentLine, label: `${currentLine} · ${__BIT_VERSION__}` }];
}

/** Version picker. Changing it goes to the same page in that release; with nothing to pick from it is disabled. */
export function VersionSelect() {
  const { status, file, currentLine } = useVersions();

  useEffect(() => {
    document.documentElement.dataset.bitVersionPicker = '';
  }, []);

  const choices = status === 'ready' && file ? choicesFrom(file, currentLine) : null;
  const unavailableLabel = import.meta.env.DEV ? 'dev (unreleased)' : `${currentLine} · ${__BIT_VERSION__}`;
  const options: Choice[] = choices ?? [
    { value: currentLine, label: status === 'unavailable' ? unavailableLabel : `${currentLine} · ${__BIT_VERSION__}` },
  ];

  let title: string | undefined;
  if (status === 'unavailable') title = 'The version list could not be loaded';
  else if (choices && choices.length < 2) title = 'Only one release line so far';
  const disabled = !choices || choices.length < 2;

  return (
    <Field label="Version" className="gallery-version">
      <Select
        size="sm"
        value={currentLine}
        disabled={disabled}
        title={title}
        onChange={(event) => {
          const entry = file?.lines.find((line) => line.line === event.target.value);
          if (entry) window.location.assign(urlForLine(entry.path, window.location.hash));
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </Field>
  );
}
