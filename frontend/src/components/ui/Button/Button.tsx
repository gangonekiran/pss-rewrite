import type { FC, ReactNode } from 'react';

export interface ButtonProps {
  children?: ReactNode;
}

const Button: FC<ButtonProps> = ({ children }) => {
  return <div>{children}</div>;
};

export default Button;
