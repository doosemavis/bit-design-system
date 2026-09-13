import { Button, Text } from '@bit/react';
import type { Control, ControlState, ControlValue, Manifest } from '../manifests/types';

interface ControlsPanelProps {
  manifest: Manifest;
  state: ControlState;
  onChange: (prop: string, value: ControlValue) => void;
  onReset: () => void;
}

interface FieldProps {
  control: Control;
  value: ControlValue | undefined;
  onChange: (prop: string, value: ControlValue) => void;
}

/** One form control per manifest entry. Labels are the prop names so the panel doubles as API docs. */
function Field({ control, value, onChange }: FieldProps) {
  const label = ('label' in control && control.label) || control.prop;
  const id = `control-${control.prop}`;

  switch (control.kind) {
    case 'axis':
    case 'select':
      return (
        <div className="gallery-control">
          <label className="gallery-control__label" htmlFor={id}>
            {label}
          </label>
          <select
            id={id}
            className="gallery-control__select"
            value={String(value ?? control.default)}
            onChange={(event) => onChange(control.prop, event.target.value)}
          >
            {control.values.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      );
    case 'boolean': {
      const checked = value === true;
      return (
        <div className="gallery-control">
          <span className="gallery-control__label" id={`${id}-label`}>
            {label}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-labelledby={`${id}-label`}
            className="gallery-switch"
            data-on={checked ? '' : undefined}
            onClick={() => onChange(control.prop, !checked)}
          >
            <span className="gallery-switch__knob" aria-hidden="true" />
          </button>
        </div>
      );
    }
    case 'number':
      return (
        <div className="gallery-control">
          <label className="gallery-control__label" htmlFor={id}>
            {label}
          </label>
          <input
            id={id}
            className="gallery-control__input"
            type="number"
            min={control.min}
            max={control.max}
            step={control.step}
            value={String(value ?? control.default)}
            onChange={(event) => onChange(control.prop, event.target.value)}
          />
        </div>
      );
    case 'text':
      return (
        <div className="gallery-control">
          <label className="gallery-control__label" htmlFor={id}>
            {label}
          </label>
          <input
            id={id}
            className="gallery-control__input"
            type="text"
            value={String(value ?? control.default)}
            onChange={(event) => onChange(control.prop, event.target.value)}
          />
        </div>
      );
  }
}

export function ControlsPanel({ manifest, state, onChange, onReset }: ControlsPanelProps) {
  const childrenControl: Control | null =
    typeof manifest.children === 'string' ? { kind: 'text', prop: 'children', default: manifest.children } : null;
  return (
    <section className="gallery-controls" aria-labelledby="controls-heading">
      <div className="gallery-controls__head">
        <Text as="h2" size="lg" id="controls-heading">
          Controls
        </Text>
        <Button variant="ghost" size="sm" color="neutral" onClick={onReset}>
          Reset
        </Button>
      </div>
      <div className="gallery-controls__grid">
        {manifest.controls.map((control) => (
          <Field key={control.prop} control={control} value={state[control.prop]} onChange={onChange} />
        ))}
        {childrenControl ? <Field control={childrenControl} value={state.children} onChange={onChange} /> : null}
      </div>
    </section>
  );
}
