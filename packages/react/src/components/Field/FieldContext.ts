import { createContext, useContext } from 'react';

/** What a Field tells the one control inside it. Private: not exported from the package. */
export interface FieldContextValue {
  id: string;
  /** The label's id, so a control with a popup (Select's listbox) can be named by the same label. */
  labelId: string;
  describedBy: string | undefined;
  invalid: boolean;
  required: boolean | undefined;
}

export const FieldContext = createContext<FieldContextValue | null>(null);

/** The props of a control that Field can wire. */
interface FieldControlProps {
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean | 'true' | 'false' | 'grammar' | 'spelling';
  required?: boolean;
}

/**
 * The id, description, invalid state and required flag a control renders: its own props merged with
 * the surrounding Field's, if any. The control's own props win; descriptions are combined.
 */
export function useFieldControl(own: FieldControlProps, invalid: boolean | undefined): FieldControlProps {
  const field = useContext(FieldContext);
  const describedBy = [own['aria-describedby'], field?.describedBy].filter(Boolean).join(' ');
  return {
    id: own.id ?? field?.id,
    'aria-describedby': describedBy || undefined,
    'aria-invalid': own['aria-invalid'] ?? (invalid || field?.invalid ? true : undefined),
    required: own.required ?? field?.required,
  };
}

/** The surrounding Field's label id, or undefined outside a Field. */
export function useFieldLabelId(): string | undefined {
  return useContext(FieldContext)?.labelId;
}
