import type { FC, ReactNode } from 'react';

export interface DrawerProps {
  children?: ReactNode;
}

const Drawer: FC<DrawerProps> = ({ children }) => {
  return <div>{children}</div>;
};

export default Drawer;
