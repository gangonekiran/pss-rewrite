import type { FC, ReactNode } from 'react';

export interface AlertProps {
  children?: ReactNode;
}

const Alert: FC<AlertProps> = ({ children }) => {
  return <div>{children}</div>;
};

export default Alert;
