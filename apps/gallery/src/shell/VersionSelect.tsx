import { Field, Select } from '@bit-ds/react';
import { useEffect } from 'react';
import { BUILD_VERSION } from '../buildVersion';
import { SITE_BASE } from '../content/versionLines.mjs';
import type { VersionsFile } from '../content/versionLines.mjs';
import { useVersions } from './useVersions';

/** The same page in another release: its path plus the hash route the reader is on. */
export function urlForLine(path: string, hash: string): string {
  return `${path}${hash || '#/'}`;
}

interface Choice {
  value: string;
  label: string;
}

/**
 * One option per entry, valued by path (two entries can share a line), in versions.json order.
 * The root entry is the latest. This copy is added if the file does not list its path.
 */
function choicesFrom(file: VersionsFile, ownPath: string, ownChoice: Choice): Choice[] {
  const choices = file.lines.map((entry) => ({
    value: entry.path,
    label: `${entry.line}${entry.path === SITE_BASE ? ' (latest)' : ''} · ${entry.version}`,
  }));
  return choices.some((choice) => choice.value === ownPath) ? choices : [...choices, ownChoice];
}

/** Version picker. Changing it goes to the same page in that copy; with nothing to pick from it is disabled. */
export function VersionSelect() {
  const { status, file, currentLine, ownPath } = useVersions();

  // index.html already sets the attribute, so version-banner.js never races the mount; this keeps it
  // true wherever the picker renders without that page (tests, a future shell).
  useEffect(() => {
    document.documentElement.dataset.bitVersionPicker = '';
  }, []);

  const ownChoice: Choice = { value: ownPath, label: `${currentLine} · ${BUILD_VERSION}` };
  const choices = status === 'ready' && file ? choicesFrom(file, ownPath, ownChoice) : null;
  const unavailableLabel = import.meta.env.DEV ? 'dev (unreleased)' : ownChoice.label;
  const options: Choice[] = choices ?? [{ value: ownPath, label: status === 'unavailable' ? unavailableLabel : ownChoice.label }];

  let title: string | undefined;
  if (status === 'unavailable') title = 'The version list could not be loaded';
  else if (choices && choices.length < 2) title = 'Only one release line so far';
  const disabled = !choices || choices.length < 2;

  return (
    <Field label="Version" className="gallery-version">
      <Select
        size="sm"
        value={ownPath}
        disabled={disabled}
        title={title}
        onChange={(event) => {
          // Only a path versions.json listed (and isVersionsFile vetted) is ever followed.
          const entry = file?.lines.find((line) => line.path === event.target.value);
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
