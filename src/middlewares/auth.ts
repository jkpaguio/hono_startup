import { Context, Next } from 'hono'
import { verifyToken } from '../lib/jwt'

export const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  
  try {
    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    
    c.set('userId', decoded.userId)
    c.set('userRole', decoded.role)
    
    await next()
  } catch {
    return c.json({ error: 'Invalid token' }, 401)
  }
}