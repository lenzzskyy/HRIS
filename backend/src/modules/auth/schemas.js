import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8)
  }),
  params: z.object({}),
  query: z.object({})
});

export const refreshSchema = z.object({
  body: z.object({ refreshToken: z.string().min(10) }),
  params: z.object({}),
  query: z.object({})
});
