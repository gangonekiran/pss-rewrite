import type { FC, ReactNode } from 'react';

export interface RadioProps {
  children?: ReactNode;
}

const Radio: FC<RadioProps> = ({ children }) => {
  return <div>{children}</div>;
};

export default Radio;
