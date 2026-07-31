import type { FC, ReactNode } from 'react';

export interface ConfirmDialogProps {
  children?: ReactNode;
}

const ConfirmDialog: FC<ConfirmDialogProps> = ({ children }) => {
  return <div>{children}</div>;
};

export default ConfirmDialog;
