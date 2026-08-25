import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

import { login } from '../services/mockAuth.service';
import type { LoginFormData } from '../validators/login.schema';

export function useLogin() {
  const n = useNavigate();

  return {
    onSubmit: async (d: LoginFormData) => {
      try {
        await login(d);
        toast.success('Login successful');
        n('/');
      } catch (e) {
        toast.error((e as Error).message);
      }
    },
  };
}