import type { FC, ReactNode } from 'react';

export interface SidebarProps {
  children?: ReactNode;
}

const Sidebar: FC<SidebarProps> = ({ children }) => {
  return <div>{children}</div>;
};

export default Sidebar;
