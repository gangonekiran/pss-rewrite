import type { FC, ReactNode } from 'react';

export interface BreadcrumbProps {
  children?: ReactNode;
}

const Breadcrumb: FC<BreadcrumbProps> = ({ children }) => {
  return <div>{children}</div>;
};

export default Breadcrumb;
