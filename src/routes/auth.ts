import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { OAuth2Client } from 'google-auth-library'
import bcrypt from 'bcryptjs'
import prisma from '../db/client'
import { generateToken, verifyToken } from '../lib/jwt'
import { RegisterSchema, LoginSchema, AuthResponseSchema, UserSchema } from '../schemas/auth'

const auth = new OpenAPIHono()

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
)

const ErrorSchema = z.object({ error: z.string() })

// Register Route
const registerRoute = createRoute({
  method: 'post',
  path: '/register',
  tags: ['Auth'],
  request: {
    body: {
      content: {
        'application/json': { schema: RegisterSchema }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': { schema: AuthResponseSchema }
      },
      description: 'Success'
    },
    400: {
      content: {
        'application/json': { schema: ErrorSchema }
      },
      description: 'Bad request'
    }
  }
})

auth.openapi(registerRoute, async (c) => {
  const { email, password, username } = c.req.valid('json')
  
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return c.json({ error: 'Email exists' }, 400)
  }
  
  const passwordHash = await bcrypt.hash(password, 10)
  
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      username: username || email.split('@')[0]
    }
  })
  
  const token = generateToken(user.id, user.role)
  
  return c.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role as 'ADMIN' | 'MANAGER' | 'CASHIER',
      avatarUrl: user.avatarUrl
    }
  }, 200)
})

// Login Route
const loginRoute = createRoute({
  method: 'post',
  path: '/login',
  tags: ['Auth'],
  request: {
    body: {
      content: {
        'application/json': { schema: LoginSchema }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': { schema: AuthResponseSchema }
      },
      description: 'Success'
    },
    401: {
      content: {
        'application/json': { schema: ErrorSchema }
      },
      description: 'Unauthorized'
    }
  }
})

auth.openapi(loginRoute, async (c) => {
  const { email, password } = c.req.valid('json')
  
  const user = await prisma.user.findUnique({ where: { email } })
  
  if (!user?.passwordHash) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }
  
  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }
  
  const token = generateToken(user.id, user.role)
  
  return c.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role as 'ADMIN' | 'MANAGER' | 'CASHIER',
      avatarUrl: user.avatarUrl
    }
  }, 200)
})

// Google URL Route
const googleUrlRoute = createRoute({
  method: 'get',
  path: '/google/url',
  tags: ['Auth'],
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({ url: z.string() })
        }
      },
      description: 'Google OAuth URL'
    }
  }
})

auth.openapi(googleUrlRoute, (c) => {
  const url = googleClient.generateAuthUrl({
    access_type: 'offline',
    scope: ['email', 'profile']
  })
  return c.json({ url }, 200)
})

// Google Auth Route
const googleAuthRoute = createRoute({
  method: 'post',
  path: '/google',
  tags: ['Auth'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({ code: z.string() })
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': { schema: AuthResponseSchema }
      },
      description: 'Success'
    },
    400: {
      content: {
        'application/json': { schema: ErrorSchema }
      },
      description: 'Bad request'
    }
  }
})

auth.openapi(googleAuthRoute, async (c) => {
  const { code } = c.req.valid('json')
  
  const { tokens } = await googleClient.getToken(code)
  googleClient.setCredentials(tokens)
  
  const ticket = await googleClient.verifyIdToken({
    idToken: tokens.id_token!,
    audience: process.env.GOOGLE_CLIENT_ID
  })
  
  const payload = ticket.getPayload()
  if (!payload) {
    return c.json({ error: 'Invalid token' }, 400)
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
  
  return c.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role as 'ADMIN' | 'MANAGER' | 'CASHIER',
      avatarUrl: user.avatarUrl
    }
  }, 200)
})

// Get Me Route
const meRoute = createRoute({
  method: 'get',
  path: '/me',
  tags: ['Auth'],
  security: [{ Bearer: [] }],
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({ user: UserSchema })
        }
      },
      description: 'User profile'
    },
    401: {
      content: {
        'application/json': { schema: ErrorSchema }
      },
      description: 'Unauthorized'
    },
    404: {
      content: {
        'application/json': { schema: ErrorSchema }
      },
      description: 'Not found'
    }
  }
})

auth.openapi(meRoute, async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  
  try {
    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404)
    }
    
    return c.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role as 'ADMIN' | 'MANAGER' | 'CASHIER',
        avatarUrl: user.avatarUrl
      }
    }, 200)
  } catch {
    return c.json({ error: 'Invalid token' }, 401)
  }
})

export default auth