import type { FC, ReactNode } from 'react';

export interface HeaderProps {
  children?: ReactNode;
}

const Header: FC<HeaderProps> = ({ children }) => {
  return <div>{children}</div>;
};

export default Header;
