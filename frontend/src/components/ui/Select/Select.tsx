import type { FC, ReactNode } from 'react';

export interface SelectProps {
  children?: ReactNode;
}

const Select: FC<SelectProps> = ({ children }) => {
  return <div>{children}</div>;
};

export default Select;
