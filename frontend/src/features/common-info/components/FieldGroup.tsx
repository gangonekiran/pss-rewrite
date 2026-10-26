import { useId, type ReactNode } from 'react';

/**
 * Use FieldGroup for displaying radio buttons or checkboxes. Otherwise,
 * use FormField.
 * @param label - displayed as legend
 * @param children - the group of checkboxes, radio buttons, etc
 * @param required - optional - if true, displays a red asterisk
 * @param error - optional - if present, displays the error message in red
 * @returns A component of children wrapped in a fieldset/legend
 *
 * Screen readers hear the label as the group's name, and "Required" and
 * the error as its description.
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
  const baseId = useId();
  const requiredId = `${baseId}-required`;
  const errorId = `${baseId}-error`;
  const describedBy =
    [required && requiredId, error && errorId].filter(Boolean).join(' ') || undefined;

  return (
    <fieldset className="min-w-0 space-y-1.5" aria-describedby={describedBy}>
      <legend className="block text-[12px] font-medium text-gray-700 text-left">
        {label}
        {/* aria-hidden keeps the group's accessible name to just the label text. */}
        {required && (
          <span aria-hidden="true" className="ml-1 text-red-600">
            *
          </span>
        )}
      </legend>
      {required && (
        <span id={requiredId} className="sr-only">
          Required
        </span>
      )}
      {children}
      {error && (
        <p id={errorId} className="text-xs text-red-600">
          {error}
        </p>
      )}
    </fieldset>
  );
}
