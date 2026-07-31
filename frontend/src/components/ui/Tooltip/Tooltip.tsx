import type { FC, ReactNode } from 'react';

export interface TooltipProps {
  children?: ReactNode;
}

const Tooltip: FC<TooltipProps> = ({ children }) => {
  return <div>{children}</div>;
};

export default Tooltip;
