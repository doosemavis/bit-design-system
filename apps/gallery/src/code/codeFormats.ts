import type { CodeLanguage } from '@bit-ds/react';
import type { ControlState, Manifest } from '../manifests/types';
import { renderManifest } from '../engine/renderManifest';
import { toJsx } from './toJsx';
import { toHtml } from './toHtml';
import { fullFile } from './fullFile';

/**
 * One option in the Playground's code switcher. To add a mode, add an entry here: the SegmentedControl,
 * the CodeBlock and the tests all read this list.
 */
interface CodeFormat {
  /** The SegmentedControl value. */
  id: string;
  /** The SegmentedControl label. */
  label: string;
  language: CodeLanguage;
  /** False hides the option for this manifest. */
  available: (manifest: Manifest) => boolean;
  /** Whether the "Full file" Switch applies to this format. */
  fullFile: boolean;
  code: (manifest: Manifest, state: ControlState) => string;
}

/** Props, then className (only with an axis to write as a class), then HTML (only for static components). */
export const CODE_FORMATS: readonly CodeFormat[] = [
  {
    id: 'props',
    label: 'Props',
    language: 'jsx',
    available: () => true,
    fullFile: true,
    code: (manifest, state) => toJsx(manifest, state),
  },
  {
    id: 'className',
    label: 'className',
    language: 'jsx',
    available: (manifest) => manifest.controls.some((control) => control.kind === 'axis'),
    fullFile: true,
    code: (manifest, state) => toJsx(manifest, state, { decorators: 'className' }),
  },
  {
    id: 'html',
    label: 'HTML',
    language: 'html',
    // An interactive component's markup alone doesn't work.
    available: (manifest) => !manifest.interactive,
    fullFile: false,
    code: (manifest, state) => toHtml(renderManifest(manifest, state)),
  },
];

/** The code to show for one format, wrapped in the full file when asked and the format allows it. */
export function codeFor(format: CodeFormat, manifest: Manifest, state: ControlState, wholeFile: boolean): string {
  const code = format.code(manifest, state);
  return wholeFile && format.fullFile ? fullFile(code) : code;
}
