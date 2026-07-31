import type { FC, ReactNode } from 'react';

export interface CardProps {
  children?: ReactNode;
}

const Card: FC<CardProps> = ({ children }) => {
  return <div>{children}</div>;
};

export default Card;
