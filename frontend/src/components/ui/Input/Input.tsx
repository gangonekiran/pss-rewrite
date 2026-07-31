import type { FC, ReactNode } from 'react';

export interface InputProps {
  children?: ReactNode;
}

const Input: FC<InputProps> = ({ children }) => {
  return <div>{children}</div>;
};

export default Input;
