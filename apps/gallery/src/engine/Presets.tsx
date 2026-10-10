import { Button } from '@bit-ds/react';
import type { ControlState, Manifest, Preset } from '../manifests/types';

/** A preset is active while every value it sets holds in the current state. Two compatible ones can both be. */
export function isPresetActive(preset: Preset, state: ControlState): boolean {
  return Object.entries(preset.state).every(([prop, value]) => value === undefined || state[prop] === value);
}

interface PresetsProps {
  manifest: Manifest;
  state: ControlState;
  onApply: (partial: Partial<ControlState>) => void;
}

/**
 * Quick states in the preview bar, as outline Buttons, so each reads as a button with its own hover. Each applies its values on top of the current state.
 * An active preset is pressed (aria-pressed="true") and solid. On a phone the row scrolls sideways.
 */
export function Presets({ manifest, state, onApply }: PresetsProps) {
  if (!manifest.presets || manifest.presets.length === 0) return null;
  return (
    <div className="gallery-presets" role="group" aria-label="Presets">
      {manifest.presets.map((preset) => {
        const active = isPresetActive(preset, state);
        return (
          <Button
            key={preset.label}
            size="sm"
            color={active ? 'primary' : 'neutral'}
            variant={active ? 'solid' : 'outline'}
            aria-pressed={active}
            onClick={() => onApply(preset.state)}
          >
            {preset.label}
          </Button>
        );
      })}
    </div>
  );
}
