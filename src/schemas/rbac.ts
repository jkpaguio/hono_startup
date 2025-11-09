import { z } from 'zod'

// Enums matching Prisma schema
export const RoleEnum = z.enum(['ADMIN', 'MANAGER', 'CASHIER'])
export const ResourceTypeEnum = z.enum(['PRODUCT', 'INVENTORY', 'INVOICE', 'CUSTOMER', 'PAYMENT', 'LEDGER', 'USER', 'REPORT'])
export const ActionEnum = z.enum(['CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT', 'APPROVE'])

// Permission Schema
export const PermissionSchema = z.object({
  id: z.string().uuid(),
  role: RoleEnum,
  resource: ResourceTypeEnum,
  action: ActionEnum,
  conditions: z.record(z.string(), z.unknown()).nullable(),
  createdAt: z.string().datetime()
})

// Create Permission Input
export const CreatePermissionSchema = z.object({
  role: RoleEnum,
  resource: ResourceTypeEnum,
  action: ActionEnum,
  conditions: z.record(z.string(), z.unknown()).optional()
})

// Bulk Create Permissions
export const BulkCreatePermissionsSchema = z.object({
  permissions: z.array(CreatePermissionSchema)
})

// Check Permission Request
export const CheckPermissionSchema = z.object({
  resource: ResourceTypeEnum,
  action: ActionEnum,
  resourceData: z.record(z.string(), z.unknown()).optional()
})

// Response schemas
export const PermissionCheckResponseSchema = z.object({
  allowed: z.boolean(),
  reason: z.string().optional()
})

export const PermissionsListResponseSchema = z.object({
  permissions: z.array(PermissionSchema),
  total: z.number()
})

export const PermissionResponseSchema = z.object({
  permission: PermissionSchema
})

// Types
export type Role = z.infer<typeof RoleEnum>
export type ResourceType = z.infer<typeof ResourceTypeEnum>
export type Action = z.infer<typeof ActionEnum>
export type Permission = z.infer<typeof PermissionSchema>
export type CreatePermissionInput = z.infer<typeof CreatePermissionSchema>
export type CheckPermissionInput = z.infer<typeof CheckPermissionSchema>