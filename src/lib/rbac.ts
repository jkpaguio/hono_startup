import prisma from '../db/client'
import { Role, ResourceType, Action } from '../generated/prisma'

// Cache for permissions (in-memory)
const permissionCache = new Map<string, boolean>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

interface PermissionCheck {
  role: Role
  resource: ResourceType
  action: Action
}

// Generate cache key
function getCacheKey(role: Role, resource: ResourceType, action: Action): string {
  return `${role}:${resource}:${action}`
}

// Check if user has permission
export async function hasPermission(
  role: Role,
  resource: ResourceType,
  action: Action
): Promise<boolean> {
  const cacheKey = getCacheKey(role, resource, action)
  
  // Check cache first
  if (permissionCache.has(cacheKey)) {
    return permissionCache.get(cacheKey)!
  }
  
  // Query database
  const permission = await prisma.permission.findUnique({
    where: {
      role_resource_action: {
        role,
        resource,
        action
      }
    }
  })
  
  const hasAccess = permission !== null
  
  // Cache result
  permissionCache.set(cacheKey, hasAccess)
  
  // Clear cache after TTL
  setTimeout(() => {
    permissionCache.delete(cacheKey)
  }, CACHE_TTL)
  
  return hasAccess
}

// Check multiple permissions at once
export async function hasAnyPermission(
  role: Role,
  checks: Array<{ resource: ResourceType; action: Action }>
): Promise<boolean> {
  const results = await Promise.all(
    checks.map(check => hasPermission(role, check.resource, check.action))
  )
  
  return results.some(result => result === true)
}

// Check if user has all permissions
export async function hasAllPermissions(
  role: Role,
  checks: Array<{ resource: ResourceType; action: Action }>
): Promise<boolean> {
  const results = await Promise.all(
    checks.map(check => hasPermission(role, check.resource, check.action))
  )
  
  return results.every(result => result === true)
}

// Get all permissions for a role
export async function getRolePermissions(role: Role) {
  const permissions = await prisma.permission.findMany({
    where: { role },
    select: {
      resource: true,
      action: true,
      conditions: true
    }
  })
  
  return permissions
}

// Clear permission cache
export function clearPermissionCache() {
  permissionCache.clear()
}

// Get permission summary for a role
export async function getPermissionSummary(role: Role) {
  const permissions = await getRolePermissions(role)
  
  const summary: Record<string, string[]> = {}
  
  for (const perm of permissions) {
    if (!summary[perm.resource]) {
      summary[perm.resource] = []
    }
    summary[perm.resource].push(perm.action)
  }
  
  return summary
}