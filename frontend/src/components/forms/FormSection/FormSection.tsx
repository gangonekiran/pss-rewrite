import type { FC, ReactNode } from 'react';

export interface FormSectionProps {
  children?: ReactNode;
}

const FormSection: FC<FormSectionProps> = ({ children }) => {
  return <div>{children}</div>;
};

export default FormSection;
