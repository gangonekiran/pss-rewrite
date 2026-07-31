import type { FC, ReactNode } from 'react';

export interface LoaderProps {
  children?: ReactNode;
}

const Loader: FC<LoaderProps> = ({ children }) => {
  return <div>{children}</div>;
};

export default Loader;
