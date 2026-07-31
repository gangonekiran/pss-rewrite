import type { FC, ReactNode } from 'react';

export interface SpinnerProps {
  children?: ReactNode;
}

const Spinner: FC<SpinnerProps> = ({ children }) => {
  return <div>{children}</div>;
};

export default Spinner;
