import type { FC, ReactNode } from 'react';

export interface FooterProps {
  children?: ReactNode;
}

const Footer: FC<FooterProps> = ({ children }) => {
  return <div>{children}</div>;
};

export default Footer;
