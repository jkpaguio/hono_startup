import prisma from '../../db/client'
import { Role, ResourceType, Action, Prisma } from '../../generated/prisma'
import { hasPermission, getPermissionSummary, clearPermissionCache } from '../../lib/rbac'

export interface CreatePermissionInput {
  role: Role
  resource: ResourceType
  action: Action
  conditions?: Record<string, unknown>
}

export interface PermissionOutput {
  id: string
  role: Role
  resource: ResourceType
  action: Action
  conditions: Record<string, unknown> | null
  createdAt: string
}

export class RBACService {
  // Get all permissions
  async getAllPermissions(): Promise<PermissionOutput[]> {
    const permissions = await prisma.permission.findMany({
      orderBy: [
        { role: 'asc' },
        { resource: 'asc' },
        { action: 'asc' }
      ]
    })

    return permissions.map(this.mapPermission)
  }

  // Get permissions for a specific role
  async getPermissionsByRole(role: Role): Promise<PermissionOutput[]> {
    const permissions = await prisma.permission.findMany({
      where: { role }
    })

    return permissions.map(this.mapPermission)
  }

  // Get permission summary for a role
  async getPermissionSummaryForRole(role: Role): Promise<Record<string, string[]>> {
    return getPermissionSummary(role)
  }

  // Check if role has permission
  async checkPermission(role: Role, resource: ResourceType, action: Action): Promise<boolean> {
    return hasPermission(role, resource, action)
  }

  // Create new permission
  async createPermission(data: CreatePermissionInput): Promise<PermissionOutput> {
    try {
      const permission = await prisma.permission.create({
        data: {
          role: data.role,
          resource: data.resource,
          action: data.action,
          conditions: data.conditions ? (data.conditions as any) : Prisma.JsonNull
        }
      })

      // Clear cache after creating permission
      clearPermissionCache()

      return this.mapPermission(permission)
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new Error('Permission already exists')
      }
      throw error
    }
  }

  // Delete permission
  async deletePermission(id: string): Promise<void> {
    try {
      await prisma.permission.delete({
        where: { id }
      })

      // Clear cache after deleting permission
      clearPermissionCache()
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new Error('Permission not found')
      }
      throw error
    }
  }

  // Bulk create permissions
  async bulkCreatePermissions(permissions: CreatePermissionInput[]): Promise<number> {
    const createdCount = await prisma.$transaction(async (tx) => {
      let count = 0
      
      for (const perm of permissions) {
        try {
          await tx.permission.create({
            data: {
              role: perm.role,
              resource: perm.resource,
              action: perm.action,
              conditions: perm.conditions ? (perm.conditions as any) : Prisma.JsonNull
            }
          })
          count++
        } catch (error: any) {
          // Skip if already exists
          if (error.code !== 'P2002') {
            throw error
          }
        }
      }
      
      return count
    })

    // Clear cache after bulk operation
    clearPermissionCache()

    return createdCount
  }

  // Delete all permissions for a role
  async deletePermissionsByRole(role: Role): Promise<number> {
    const result = await prisma.permission.deleteMany({
      where: { role }
    })

    // Clear cache after bulk delete
    clearPermissionCache()

    return result.count
  }

  // Helper to map Prisma Permission to output format
  private mapPermission(p: any): PermissionOutput {
    return {
      id: p.id,
      role: p.role,
      resource: p.resource,
      action: p.action,
      conditions: p.conditions as Record<string, unknown> | null,
      createdAt: p.createdAt.toISOString()
    }
  }
}

export const rbacService = new RBACService()