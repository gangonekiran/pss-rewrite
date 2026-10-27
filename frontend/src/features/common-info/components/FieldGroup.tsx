import type { ReactNode } from 'react';

/**
 * Use FieldGroup for displaying radio buttons or checkboxes. Otherwise,
 * use FormField.
 * @param label - displayed as legend
 * @param children - the group of checkboxes, radio buttons, etc
 * @param required - optional - if true, displays a red asterisk
 * @param error - optional - if present, displays the error message in red
 * @returns A component of children wrapped in a fieldset/legend
 */
export default function FieldGroup({
  label,
  children,
  required,
  error,
}: {
  label: string;
  children: ReactNode;
  required?: boolean;
  error?: string;
}) {
  return (
    <fieldset>
      <legend>
        {label}
        {required && <span className="ml-1 text-red-600">*</span>}
      </legend>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </fieldset>
  );
}

