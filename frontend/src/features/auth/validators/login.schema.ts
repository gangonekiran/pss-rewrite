import { z } from 'zod';
export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(6),
  rememberMe: z.boolean(),
});
export type LoginFormData = z.infer<typeof loginSchema>;
