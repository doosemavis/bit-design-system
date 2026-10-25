import type { Pass } from '../../../engine/pageParams';
import type { AnatomyPart, ManifestAnatomy } from '../../../manifests/types';

export interface BuildState {
  pass: Pass;
  /** Step names, in landing order. */
  landed: readonly string[];
  /** The step that just landed (highlighted for a beat). */
  fresh: string | null;
  /** States: a state label, or 'Try it'. */
  chip: string | null;
  /** The instance is focusable (Try it, Final). */
  live: boolean;
  outline: boolean;
  grid: boolean;
  lines: boolean;
  scene: boolean;
  /** The caption's right-hand line. */
  note: string;
}

const stepOf = (part: AnatomyPart) => part.step ?? part.label;

export function stepNames(anatomy: ManifestAnatomy): string[] {
  return [...new Set(anatomy.parts.map(stepOf))];
}

function noteFor(anatomy: ManifestAnatomy, step: string): string {
  return anatomy.parts
    .filter((part) => stepOf(part) === step)
    .map((part) => `${part.label}: ${part.tokens.join(', ')}`)
    .join(' · ');
}

const BLANK = { fresh: null, chip: null, live: false, outline: false, grid: false, lines: false, scene: false, note: '' };

export function stepsOf(anatomy: ManifestAnatomy, pass: Pass): BuildState[] {
  const names = stepNames(anatomy);
  switch (pass) {
    case 'wireframe':
      return [{ ...BLANK, pass, landed: [], outline: true, grid: true }];
    case 'tokens':
      return names.map((name, i) => ({
        ...BLANK,
        pass,
        landed: names.slice(0, i + 1),
        fresh: name,
        lines: true,
        note: noteFor(anatomy, name),
      }));
    case 'states': {
      const labels = anatomy.states.map((s) => s.label);
      return [...labels, ...labels.slice(0, 1)].map((chip) => ({ ...BLANK, pass, landed: names, chip }));
    }
    case 'final':
      return [{ ...BLANK, pass, landed: names, scene: true, live: true, note: anatomy.scene.caption }];
  }
}

export function endOf(anatomy: ManifestAnatomy, pass: Pass): BuildState {
  return stepsOf(anatomy, pass).at(-1) as BuildState;
}
