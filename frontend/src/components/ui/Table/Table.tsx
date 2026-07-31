import type { FC, ReactNode } from 'react';

export interface TableProps {
  children?: ReactNode;
}

const Table: FC<TableProps> = ({ children }) => {
  return <div>{children}</div>;
};

export default Table;
