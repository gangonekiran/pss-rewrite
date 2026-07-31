import type { FC, ReactNode } from 'react';

export interface DataTableProps {
  children?: ReactNode;
}

const DataTable: FC<DataTableProps> = ({ children }) => {
  return <div>{children}</div>;
};

export default DataTable;
