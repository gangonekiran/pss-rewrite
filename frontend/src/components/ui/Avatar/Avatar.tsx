import type { FC, ReactNode } from 'react';

export interface AvatarProps {
  children?: ReactNode;
}

const Avatar: FC<AvatarProps> = ({ children }) => {
  return <div>{children}</div>;
};

export default Avatar;
