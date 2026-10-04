import { Button, Field, Heading, Input, Select, Switch } from '@bit-ds/react';
import type { Control, ControlState, ControlValue, Manifest } from '../manifests/types';

interface ControlsPanelProps {
  manifest: Manifest;
  state: ControlState;
  onChange: (prop: string, value: ControlValue) => void;
  onReset: () => void;
}

interface ControlFieldProps {
  control: Control;
  value: ControlValue | undefined;
  onChange: (prop: string, value: ControlValue) => void;
  /** Shown under a text field, which is then marked invalid (the emptied children of a Button, say). */
  error?: string;
}

/** One form control per manifest entry. Labels are the prop names so the panel doubles as API docs. */
function ControlField({ control, value, onChange, error }: ControlFieldProps) {
  const label = ('label' in control && control.label) || control.prop;

  switch (control.kind) {
    case 'axis':
    case 'select':
      return (
        <Field label={label}>
          <Select
            size="sm"
            value={String(value ?? control.default)}
            onChange={(event) => onChange(control.prop, event.target.value)}
          >
            {control.values.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </Select>
        </Field>
      );
    case 'boolean':
      return (
        <div className="gallery-control">
          <Switch size="sm" checked={value === true} onChange={(event) => onChange(control.prop, event.target.checked)}>
            {label}
          </Switch>
        </div>
      );
    case 'number':
      return (
        <Field label={label}>
          <Input
            size="sm"
            type="number"
            min={control.min}
            max={control.max}
            step={control.step}
            value={String(value ?? control.default)}
            onChange={(event) => onChange(control.prop, event.target.value)}
          />
        </Field>
      );
    case 'text':
      return (
        <Field label={label} error={error}>
          <Input
            size="sm"
            type="text"
            value={String(value ?? control.default)}
            onChange={(event) => onChange(control.prop, event.target.value)}
          />
        </Field>
      );
  }
}

export function ControlsPanel({ manifest, state, onChange, onReset }: ControlsPanelProps) {
  const childrenControl: Control | null =
    typeof manifest.children === 'string' ? { kind: 'text', prop: 'children', default: manifest.children } : null;
  // Emptied children: the preview and code show the empty component, and the field says what that costs.
  const childrenError = state.children === '' ? manifest.docs.emptyChildrenError : undefined;
  return (
    <section className="gallery-controls" aria-labelledby="controls-heading">
      <div className="gallery-controls__head">
        <Heading level={3} id="controls-heading">
          Controls
        </Heading>
        <Button variant="ghost" size="sm" color="neutral" onClick={onReset}>
          Reset
        </Button>
      </div>
      <div className="gallery-controls__grid">
        {manifest.controls.map((control) => (
          <ControlField key={control.prop} control={control} value={state[control.prop]} onChange={onChange} />
        ))}
        {childrenControl ? (
          <ControlField control={childrenControl} value={state.children} onChange={onChange} error={childrenError} />
        ) : null}
      </div>
    </section>
  );
}
