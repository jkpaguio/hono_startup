import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { HTTPException } from 'hono/http-exception'
import type { Context } from 'hono'
import { Role } from '../../generated/prisma'
import { rbacService } from '../../services/rbac/rbac.service'

type Env = {
  Variables: {
    userId: string
    userRole: Role
  }
}

const permissions = new OpenAPIHono<Env>()

const PermissionSchema = z.object({
  id: z.string(),
  role: z.enum(['ADMIN', 'MANAGER', 'CASHIER']),
  resource: z.enum(['PRODUCT', 'INVENTORY', 'INVOICE', 'CUSTOMER', 'PAYMENT', 'LEDGER', 'USER', 'REPORT']),
  action: z.enum(['CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT', 'APPROVE']),
  conditions: z.record(z.string(), z.unknown()).nullable(),
  createdAt: z.string()
})

const CreatePermissionSchema = z.object({
  role: z.enum(['ADMIN', 'MANAGER', 'CASHIER']),
  resource: z.enum(['PRODUCT', 'INVENTORY', 'INVOICE', 'CUSTOMER', 'PAYMENT', 'LEDGER', 'USER', 'REPORT']),
  action: z.enum(['CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT', 'APPROVE']),
  conditions: z.record(z.string(), z.unknown()).optional()
})

const ErrorSchema = z.object({ error: z.string() })

function checkRole(c: Context<Env>, ...roles: Role[]) {
  const userRole = c.get('userRole')
  if (!userRole) {
    throw new HTTPException(401, { message: 'Unauthorized' })
  }
  if (!roles.includes(userRole)) {
    throw new HTTPException(403, { 
      message: `This action requires one of these roles: ${roles.join(', ')}` 
    })
  }
}

// Get all permissions (Admin only)
const listPermissionsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Permissions'],
  security: [{ Bearer: [] }],
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            permissions: z.array(PermissionSchema)
          })
        }
      },
      description: 'List of all permissions'
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Unauthorized'
    },
    403: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Forbidden'
    }
  }
})

permissions.openapi(listPermissionsRoute, async (c) => {
  checkRole(c, Role.ADMIN)
  
  const allPermissions = await rbacService.getAllPermissions()
  
  return c.json({ permissions: allPermissions }, 200)
})

// Get permissions for a specific role
const getRolePermissionsRoute = createRoute({
  method: 'get',
  path: '/role/{role}',
  tags: ['Permissions'],
  security: [{ Bearer: [] }],
  request: {
    params: z.object({
      role: z.enum(['ADMIN', 'MANAGER', 'CASHIER'])
    })
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            role: z.string(),
            permissions: z.array(PermissionSchema)
          })
        }
      },
      description: 'Role permissions'
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Unauthorized'
    },
    403: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Forbidden'
    }
  }
})

permissions.openapi(getRolePermissionsRoute, async (c) => {
  checkRole(c, Role.ADMIN, Role.MANAGER)
  
  const { role } = c.req.valid('param')
  
  const rolePermissions = await rbacService.getPermissionsByRole(role as Role)
  
  return c.json({
    role,
    permissions: rolePermissions
  }, 200)
})

// Get permission summary for a role
const getPermissionSummaryRoute = createRoute({
  method: 'get',
  path: '/role/{role}/summary',
  tags: ['Permissions'],
  security: [{ Bearer: [] }],
  request: {
    params: z.object({
      role: z.enum(['ADMIN', 'MANAGER', 'CASHIER'])
    })
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            role: z.string(),
            summary: z.record(z.string(), z.array(z.string()))
          })
        }
      },
      description: 'Permission summary'
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Unauthorized'
    }
  }
})

permissions.openapi(getPermissionSummaryRoute, async (c) => {
  const { role } = c.req.valid('param')
  const summary = await rbacService.getPermissionSummaryForRole(role as Role)
  
  return c.json({
    role,
    summary
  }, 200)
})

// Get current user's permissions
const getMyPermissionsRoute = createRoute({
  method: 'get',
  path: '/me',
  tags: ['Permissions'],
  security: [{ Bearer: [] }],
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            role: z.string(),
            permissions: z.array(PermissionSchema),
            summary: z.record(z.string(), z.array(z.string()))
          })
        }
      },
      description: 'Current user permissions'
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Unauthorized'
    }
  }
})

permissions.openapi(getMyPermissionsRoute, async (c) => {
  const userRole = c.get('userRole')
  
  const rolePermissions = await rbacService.getPermissionsByRole(userRole)
  const summary = await rbacService.getPermissionSummaryForRole(userRole)
  
  return c.json({
    role: userRole,
    permissions: rolePermissions,
    summary
  }, 200)
})

// Create new permission (Admin only)
const createPermissionRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Permissions'],
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: {
        'application/json': { schema: CreatePermissionSchema }
      }
    }
  },
  responses: {
    201: {
      content: {
        'application/json': { schema: PermissionSchema }
      },
      description: 'Permission created'
    },
    400: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Bad request'
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Unauthorized'
    },
    403: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Forbidden'
    }
  }
})

permissions.openapi(createPermissionRoute, async (c) => {
  checkRole(c, Role.ADMIN)
  
  try {
    const data = c.req.valid('json')
    const permission = await rbacService.createPermission(data as any)
    
    return c.json(permission, 201)
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// Delete permission (Admin only)
const deletePermissionRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Permissions'],
  security: [{ Bearer: [] }],
  request: {
    params: z.object({
      id: z.string()
    })
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({ message: z.string() })
        }
      },
      description: 'Permission deleted'
    },
    400: {  // Add this
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Bad request'
    },
    401: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Unauthorized'
    },
    403: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Forbidden'
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Not found'
    }
  }
})

permissions.openapi(deletePermissionRoute, async (c) => {
  checkRole(c, Role.ADMIN)
  
  try {
    const { id } = c.req.valid('param')
    await rbacService.deletePermission(id)
    
    return c.json({ message: 'Permission deleted successfully' }, 200)
  } catch (error: any) {
    if (error.message === 'Permission not found') {
      return c.json({ error: error.message }, 404)
    }
    return c.json({ error: error.message }, 400)
  }
})

export default permissions