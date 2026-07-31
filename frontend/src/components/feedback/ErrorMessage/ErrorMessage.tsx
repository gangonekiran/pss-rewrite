import type { FC, ReactNode } from 'react';

export interface ErrorMessageProps {
  children?: ReactNode;
}

const ErrorMessage: FC<ErrorMessageProps> = ({ children }) => {
  return <div>{children}</div>;
};

export default ErrorMessage;
