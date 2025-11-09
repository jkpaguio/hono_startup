import bcrypt from 'bcryptjs'
import prisma from '../../db/client'
import { generateToken } from '../../lib/jwt'
import { Role } from '../../generated/prisma'

export interface RegisterInput {
  email: string
  password: string
  username?: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  user: {
    id: string
    email: string
    username: string | null
    role: Role
    avatarUrl: string | null
  }
}

export class AuthService {
  async register(data: RegisterInput): Promise<AuthResponse> {
    const existing = await prisma.user.findUnique({
      where: { email: data.email }
    })

    if (existing) {
      throw new Error('Email already exists')
    }

    const passwordHash = await bcrypt.hash(data.password, 10)

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        username: data.username || data.email.split('@')[0]
      }
    })

    const token = generateToken(user.id, user.role)

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        avatarUrl: user.avatarUrl
      }
    }
  }

  async login(data: LoginInput): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({
      where: { email: data.email }
    })

    if (!user?.passwordHash) {
      throw new Error('Invalid credentials')
    }

    const valid = await bcrypt.compare(data.password, user.passwordHash)
    if (!valid) {
      throw new Error('Invalid credentials')
    }

    const token = generateToken(user.id, user.role)

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        avatarUrl: user.avatarUrl
      }
    }
  }

  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      throw new Error('User not found')
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      avatarUrl: user.avatarUrl
    }
  }
}

export const authService = new AuthService()