import type { FC, ReactNode } from 'react';

export interface BadgeProps {
  children?: ReactNode;
}

const Badge: FC<BadgeProps> = ({ children }) => {
  return <div>{children}</div>;
};

export default Badge;
