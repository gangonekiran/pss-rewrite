import type { FC, ReactNode } from 'react';

export interface PaginationProps {
  children?: ReactNode;
}

const Pagination: FC<PaginationProps> = ({ children }) => {
  return <div>{children}</div>;
};

export default Pagination;
