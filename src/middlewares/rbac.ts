import { Context, Next } from 'hono'
import { ResourceType, Action, Role } from '../generated/prisma'
import { hasPermission } from '../lib/rbac'
import { HTTPException } from 'hono/http-exception'

// RBAC middleware factory
export function requirePermission(resource: ResourceType, action: Action) {
  return async (c: Context, next: Next) => {
    const userRole = c.get('userRole') as Role
    
    if (!userRole) {
      throw new HTTPException(401, { message: 'Unauthorized' })
    }
    
    const hasAccess = await hasPermission(userRole, resource, action)
    
    if (!hasAccess) {
      throw new HTTPException(403, { 
        message: `You don't have permission to ${action} ${resource}` 
      })
    }
    
    await next()
  }
}

// Require any of the permissions
export function requireAnyPermission(
  checks: Array<{ resource: ResourceType; action: Action }>
) {
  return async (c: Context, next: Next) => {
    const userRole = c.get('userRole') as Role
    
    if (!userRole) {
      throw new HTTPException(401, { message: 'Unauthorized' })
    }
    
    const results = await Promise.all(
      checks.map(check => hasPermission(userRole, check.resource, check.action))
    )
    
    const hasAccess = results.some(result => result === true)
    
    if (!hasAccess) {
      throw new HTTPException(403, { 
        message: 'You don\'t have the required permissions' 
      })
    }
    
    await next()
  }
}

// Require all permissions
export function requireAllPermissions(
  checks: Array<{ resource: ResourceType; action: Action }>
) {
  return async (c: Context, next: Next) => {
    const userRole = c.get('userRole') as Role
    
    if (!userRole) {
      throw new HTTPException(401, { message: 'Unauthorized' })
    }
    
    const results = await Promise.all(
      checks.map(check => hasPermission(userRole, check.resource, check.action))
    )
    
    const hasAccess = results.every(result => result === true)
    
    if (!hasAccess) {
      throw new HTTPException(403, { 
        message: 'You don\'t have all the required permissions' 
      })
    }
    
    await next()
  }
}

// Require specific role
export function requireRole(...roles: Role[]) {
  return async (c: Context, next: Next) => {
    const userRole = c.get('userRole') as Role
    
    if (!userRole) {
      throw new HTTPException(401, { message: 'Unauthorized' })
    }
    
    if (!roles.includes(userRole)) {
      throw new HTTPException(403, { 
        message: `This action requires one of these roles: ${roles.join(', ')}` 
      })
    }
    
    await next()
  }
}