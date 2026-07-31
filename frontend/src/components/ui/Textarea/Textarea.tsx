import type { FC, ReactNode } from 'react';

export interface TextareaProps {
  children?: ReactNode;
}

const Textarea: FC<TextareaProps> = ({ children }) => {
  return <div>{children}</div>;
};

export default Textarea;
