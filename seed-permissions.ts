import prisma from './src/db/client'
import { Role, ResourceType, Action } from './src/generated/prisma'

// Define permission structure
const permissions = [
  // ADMIN - Full access
  {
    role: Role.ADMIN,
    permissions: [
      // Users
      { resource: ResourceType.USER, actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE] },
      // Products
      { resource: ResourceType.PRODUCT, actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.EXPORT] },
      // Inventory
      { resource: ResourceType.INVENTORY, actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.EXPORT] },
      // Invoices
      { resource: ResourceType.INVOICE, actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.EXPORT, Action.APPROVE] },
      // Customers
      { resource: ResourceType.CUSTOMER, actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.EXPORT] },
      // Payments
      { resource: ResourceType.PAYMENT, actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.EXPORT, Action.APPROVE] },
      // Ledger
      { resource: ResourceType.LEDGER, actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.EXPORT] },
      // Reports
      { resource: ResourceType.REPORT, actions: [Action.READ, Action.EXPORT] },
    ]
  },
  
  // MANAGER - Limited management access
  {
    role: Role.MANAGER,
    permissions: [
      // Users - Read only
      { resource: ResourceType.USER, actions: [Action.READ] },
      // Products
      { resource: ResourceType.PRODUCT, actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.EXPORT] },
      // Inventory
      { resource: ResourceType.INVENTORY, actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.EXPORT] },
      // Invoices
      { resource: ResourceType.INVOICE, actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.EXPORT, Action.APPROVE] },
      // Customers
      { resource: ResourceType.CUSTOMER, actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.EXPORT] },
      // Payments
      { resource: ResourceType.PAYMENT, actions: [Action.CREATE, Action.READ, Action.APPROVE, Action.EXPORT] },
      // Ledger - Read only
      { resource: ResourceType.LEDGER, actions: [Action.READ, Action.EXPORT] },
      // Reports
      { resource: ResourceType.REPORT, actions: [Action.READ, Action.EXPORT] },
    ]
  },
  
  // CASHIER - Basic operations
  {
    role: Role.CASHIER,
    permissions: [
      // Products - Read only
      { resource: ResourceType.PRODUCT, actions: [Action.READ] },
      // Inventory - Read only
      { resource: ResourceType.INVENTORY, actions: [Action.READ] },
      // Invoices
      { resource: ResourceType.INVOICE, actions: [Action.CREATE, Action.READ] },
      // Customers
      { resource: ResourceType.CUSTOMER, actions: [Action.CREATE, Action.READ] },
      // Payments
      { resource: ResourceType.PAYMENT, actions: [Action.CREATE, Action.READ] },
      // Ledger - Read only
      { resource: ResourceType.LEDGER, actions: [Action.READ] },
    ]
  },
]

async function seedPermissions() {
  console.log('🌱 Seeding permissions...')
  
  // Clear existing permissions
  await prisma.permission.deleteMany()
  console.log('✓ Cleared existing permissions')
  
  let count = 0
  
  for (const rolePermissions of permissions) {
    for (const resource of rolePermissions.permissions) {
      for (const action of resource.actions) {
        await prisma.permission.create({
          data: {
            role: rolePermissions.role,
            resource: resource.resource,
            action: action,
          }
        })
        count++
      }
    }
  }
  
  console.log(`✓ Created ${count} permissions`)
  
  // Display summary
  const summary = await prisma.permission.groupBy({
    by: ['role'],
    _count: true
  })
  
  console.log('\n📊 Permission Summary:')
  for (const item of summary) {
    console.log(`  ${item.role}: ${item._count} permissions`)
  }
}

seedPermissions()
  .catch((e) => {
    console.error('❌ Error seeding permissions:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })