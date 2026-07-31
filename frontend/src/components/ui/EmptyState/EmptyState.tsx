import type { FC, ReactNode } from 'react';

export interface EmptyStateProps {
  children?: ReactNode;
}

const EmptyState: FC<EmptyStateProps> = ({ children }) => {
  return <div>{children}</div>;
};

export default EmptyState;
