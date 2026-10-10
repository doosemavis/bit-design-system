import { useId } from 'react';
import { Alert, Button, Field, Input, Select, Switch, Text } from '@bit-ds/react';
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
  /** The whole page state, so a control can lock itself on another control's value. */
  state: ControlState;
  onChange: (prop: string, value: ControlValue) => void;
  /** Shown under a text field, which is then marked invalid (the emptied children of a Button, say). */
  error?: string;
}

/** One form control per manifest entry. Labels are the prop names so the panel doubles as API docs. */
function ControlField({ control, value, state, onChange, error }: ControlFieldProps) {
  const label = ('label' in control && control.label) || control.prop;
  const noteId = useId();

  switch (control.kind) {
    case 'axis':
      return (
        <Field label={label}>
          <Select
            size="sm"
            options={control.values.map((v) => ({ value: v, label: v }))}
            value={String(value ?? control.default)}
            onValueChange={(next) => onChange(control.prop, next)}
          />
        </Field>
      );
    case 'select': {
      // Locked: disabled, held at its default (applyLocks), and a primary note under it says why.
      const why = control.lock?.(state);
      return (
        <div className="gallery-control">
          <Field label={label} hint={control.hint}>
            <Select
              size="sm"
              options={control.values.map((v) => ({ value: v, label: v }))}
              value={String(value ?? control.default)}
              onValueChange={(next) => onChange(control.prop, next)}
              disabled={why !== undefined}
              aria-describedby={why === undefined ? undefined : noteId}
            />
          </Field>
          {why === undefined ? null : (
            <Alert id={noteId} color="primary" role="note">
              {why}
            </Alert>
          )}
        </div>
      );
    }
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
      {/* The same bar as the preview's, so the two read as one header strip across the card. */}
      <div className="gallery-controls__bar">
        <Text as="h3" size={14} id="controls-heading" className="gallery-controls__title">
          Controls
        </Text>
        <Button variant="ghost" size="sm" color="neutral" onClick={onReset}>
          Reset
        </Button>
      </div>
      <div className="gallery-controls__grid">
        {manifest.controls.map((control) => (
          <ControlField key={control.prop} control={control} value={state[control.prop]} state={state} onChange={onChange} />
        ))}
        {childrenControl ? (
          <ControlField control={childrenControl} value={state.children} state={state} onChange={onChange} error={childrenError} />
        ) : null}
      </div>
    </section>
  );
}
