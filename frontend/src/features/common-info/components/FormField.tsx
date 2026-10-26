import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';

type ControlProps = {
  id?: string;
  'aria-required'?: boolean;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
};

/**
 * Label + control + error message. Put the same `id` on the control so the
 * label is linked to it; when the control is a direct child, it is also
 * marked aria-required / aria-invalid and described by the error.
 * For radio buttons or checkboxes, use FieldGroup.
 */
export function Field({
  id,
  label,
  required,
  children,
  error,
}: {
  id: string;
  label: string;
  required?: boolean;
  children: ReactNode;
  error?: string;
}) {
  const errorId = `${id}-error`;

  const content = Children.map(children, (child) =>
    isValidElement<ControlProps>(child) && child.props.id === id
      ? cloneElement(child as ReactElement<ControlProps>, {
          'aria-required': required || undefined,
          'aria-invalid': error ? true : undefined,
          'aria-describedby': error ? errorId : undefined,
        })
      : child,
  );

  return (
    <div className="space-y-1.5">
      {/* The * sits outside <label> so the label text is exactly the field name. */}
      <div className="block text-sm font-medium text-gray-700 text-left">
        <label htmlFor={id}>{label}</label>
        {required && (
          <span aria-hidden="true" className="ml-1 text-red-600">
            *
          </span>
        )}
      </div>
      {content}
      {error && (
        <p id={errorId} className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
