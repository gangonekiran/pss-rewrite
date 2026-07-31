import type { FC, ReactNode } from 'react';

export interface CheckboxProps {
  children?: ReactNode;
}

const Checkbox: FC<CheckboxProps> = ({ children }) => {
  return <div>{children}</div>;
};

export default Checkbox;
