import { Context, Next } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { verifyToken } from '../lib/jwt'

export const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: 'Unauthorized' })
  }
  
  try {
    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    
    c.set('userId', decoded.userId)
    c.set('userRole', decoded.role)
    
    await next()
  } catch {
    throw new HTTPException(401, { message: 'Invalid token' })
  }
}