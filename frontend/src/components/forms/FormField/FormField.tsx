import type { FC, ReactNode } from 'react';

export interface FormFieldProps {
  children?: ReactNode;
}

const FormField: FC<FormFieldProps> = ({ children }) => {
  return <div>{children}</div>;
};

export default FormField;
