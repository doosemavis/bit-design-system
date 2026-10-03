import { Button, Text } from '@bit-ds/react';
import type { ControlState, Manifest } from '../manifests/types';

interface PresetsProps {
  manifest: Manifest;
  onApply: (partial: Partial<ControlState>) => void;
}

/** A row of quick states. Each applies several props at once on top of the current state. */
export function Presets({ manifest, onApply }: PresetsProps) {
  if (!manifest.presets || manifest.presets.length === 0) return null;
  return (
    <section className="gallery-presets" aria-labelledby="presets-heading">
      <Text as="h2" size="lg" id="presets-heading">
        Presets
      </Text>
      <div className="gallery-presets__row">
        {manifest.presets.map((preset) => (
          <Button key={preset.label} variant="outline" size="sm" color="neutral" onClick={() => onApply(preset.state)}>
            {preset.label}
          </Button>
        ))}
      </div>
    </section>
  );
}
