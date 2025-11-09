import { OAuth2Client } from 'google-auth-library'
import prisma from '../../db/client'
import { generateToken } from '../../lib/jwt'
import { Role } from '../../generated/prisma'

export class GoogleOAuthService {
  private client: OAuth2Client

  constructor() {
    this.client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    )
  }

  getAuthUrl(): string {
    return this.client.generateAuthUrl({
      access_type: 'offline',
      scope: ['email', 'profile']
    })
  }

  async authenticateWithCode(code: string) {
    const { tokens } = await this.client.getToken(code)
    this.client.setCredentials(tokens)

    const ticket = await this.client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID
    })

    const payload = ticket.getPayload()
    if (!payload) {
      throw new Error('Invalid token')
    }

    let user = await prisma.user.findUnique({
      where: { googleId: payload.sub }
    })

    if (!user) {
      user = await prisma.user.upsert({
        where: { email: payload.email! },
        update: {
          googleId: payload.sub,
          avatarUrl: payload.picture
        },
        create: {
          email: payload.email!,
          googleId: payload.sub,
          username: payload.name,
          avatarUrl: payload.picture
        }
      })
    }

    const token = generateToken(user.id, user.role)

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role as Role,
        avatarUrl: user.avatarUrl
      }
    }
  }
}

export const googleOAuthService = new GoogleOAuthService()