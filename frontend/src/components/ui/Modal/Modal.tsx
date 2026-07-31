import type { FC, ReactNode } from 'react';

export interface ModalProps {
  children?: ReactNode;
}

const Modal: FC<ModalProps> = ({ children }) => {
  return <div>{children}</div>;
};

export default Modal;
