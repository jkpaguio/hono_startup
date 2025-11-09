import { z } from 'zod'

export const RegisterSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  username: z.string().optional()
})

export const LoginSchema = z.object({
  email: z.email(),
  password: z.string().min(6)
})

export const UserSchema = z.object({
  id: z.string(),
  email: z.string(),
  username: z.string().nullable(),
  role: z.enum(['ADMIN', 'MANAGER', 'CASHIER']),
  avatarUrl: z.string().nullable()
})

export const AuthResponseSchema = z.object({
  token: z.string(),
  user: UserSchema
})