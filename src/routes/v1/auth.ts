import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { verifyToken } from '../../lib/jwt'
import { authService } from '../../services/auth/auth.service'
import { googleOAuthService } from '../../services/auth/google-oauth.service'
import { RegisterSchema, LoginSchema, AuthResponseSchema, UserSchema } from '../../schemas/auth'

const auth = new OpenAPIHono()

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
  try {
    const data = c.req.valid('json')
    const result = await authService.register(data)
    return c.json(result, 200)
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
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
  try {
    const data = c.req.valid('json')
    const result = await authService.login(data)
    return c.json(result, 200)
  } catch (error: any) {
    return c.json({ error: error.message }, 401)
  }
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
  const url = googleOAuthService.getAuthUrl()
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
  try {
    const { code } = c.req.valid('json')
    const result = await googleOAuthService.authenticateWithCode(code)
    return c.json(result, 200)
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
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
    
    const user = await authService.getUserById(decoded.userId)
    return c.json({ user }, 200)
  } catch (error: any) {
    if (error.message === 'User not found') {
      return c.json({ error: 'User not found' }, 404)
    }
    return c.json({ error: 'Invalid token' }, 401)
  }
})

export default auth