import type { FC, ReactNode } from 'react';

export interface TabsProps {
  children?: ReactNode;
}

const Tabs: FC<TabsProps> = ({ children }) => {
  return <div>{children}</div>;
};

export default Tabs;
