# Hono + Zod OpenAPI + Prisma + RBAC Starter

A production-ready API starter with Hono, OpenAPI documentation, Prisma ORM, JWT authentication, and Role-Based Access Control.

## 🚀 Features

- **Hono** - Fast web framework
- **@hono/zod-openapi** - Type-safe OpenAPI spec generation
- **Scalar API Reference** - Modern interactive API docs
- **Swagger UI** - Classic API documentation
- **Prisma** - Type-safe database ORM
- **JWT Auth** - Secure authentication
- **Google OAuth** - Social login
- **RBAC** - Role-Based Access Control with permissions
- **Service Layer** - Clean architecture with separation of concerns
- **TypeScript** - Full type safety
- **PostgreSQL** - Robust database

## 📁 Project Structure

```
backend/
├── src/
│   ├── index.ts              # Server entry point
│   ├── services/             # Business logic layer
│   │   ├── auth/
│   │   │   ├── auth.service.ts
│   │   │   └── google-oauth.service.ts
│   │   └── rbac/
│   │       └── rbac.service.ts
│   ├── routes/
│   │   └── v1/               # API version 1
│   │       ├── auth.ts
│   │       └── permissions.ts
│   ├── middlewares/
│   │   ├── auth.ts           # JWT middleware
│   │   └── rbac.ts           # RBAC middleware
│   ├── schemas/
│   │   ├── auth.ts
│   │   └── rbac.ts
│   ├── lib/
│   │   ├── jwt.ts
│   │   └── rbac.ts
│   ├── db/
│   │   └── client.ts
│   └── generated/
│       └── prisma/           # Generated Prisma Client
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── migrations/           # Database migrations
├── .env
└── package.json
```

### Folder Guide

| Folder | Purpose |
|--------|---------|
| `src/services/` | Business logic, database operations |
| `src/routes/v1/` | API v1 endpoints (thin HTTP layer) |
| `src/middlewares/` | Request interceptors (auth, RBAC) |
| `src/schemas/` | Zod schemas for validation & docs |
| `src/lib/` | Utility functions |
| `src/db/` | Database client |
| `prisma/` | Database schema & migrations |

## 🛠️ Setup

### With Bun (Recommended)

```bash
# Install
bun install

# Environment
cp .env.example .env
# Edit .env with your database URL

# Database
bunx prisma generate
bunx prisma db push

# Run
bun run dev
```

### With npm

```bash
# Install
npm install

# Environment
cp .env.example .env
# Edit .env with your database URL

# Database
npx prisma generate
npx prisma db push

# Run
npm run dev
```

## 🔧 Configuration

Create `.env`:

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/db_name"
JWT_SECRET="your-secret-key-min-32-chars"
GOOGLE_CLIENT_ID="optional-for-oauth"
GOOGLE_CLIENT_SECRET="optional-for-oauth"
PORT=3000
```

### Database Setup

**Local PostgreSQL:**
```bash
createdb your_db_name
```

**Docker:**
```bash
docker run --name postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=your_db_name \
  -p 5432:5432 -d postgres
```

## 📚 API Documentation

Once running, visit:
- **Scalar Docs** (Modern): http://localhost:3000/api/docs
- **Swagger UI** (Classic): http://localhost:3000/api/swagger
- **OpenAPI JSON**: http://localhost:3000/api/doc

## 🏗️ Architecture

### Service Layer Pattern

The application uses a **service layer architecture** for clean separation of concerns:

```
Routes (HTTP) → Services (Business Logic) → Database (Prisma)
```

**Benefits:**
- ✅ Separation of concerns (HTTP vs business logic)
- ✅ Reusable business logic
- ✅ Easier testing
- ✅ Better maintainability

**Example:**
```typescript
// Route (thin HTTP layer)
auth.openapi(loginRoute, async (c) => {
  try {
    const data = c.req.valid('json')
    const result = await authService.login(data)  // Call service
    return c.json(result, 200)
  } catch (error: any) {
    return c.json({ error: error.message }, 401)
  }
})

// Service (business logic)
class AuthService {
  async login(data: LoginInput): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({ where: { email: data.email } })
    if (!user?.passwordHash) throw new Error('Invalid credentials')
    
    const valid = await bcrypt.compare(data.password, user.passwordHash)
    if (!valid) throw new Error('Invalid credentials')
    
    return { token: generateToken(user.id, user.role), user }
  }
}
```

See [SERVICE-ARCHITECTURE.md](SERVICE-ARCHITECTURE.md) for detailed documentation.

## 🔐 Authentication & Authorization

### JWT Authentication

**Register:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

**Get Profile:**
```bash
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Google OAuth:**
```bash
# Get OAuth URL
curl http://localhost:3000/api/v1/auth/google/url

# Exchange code for token
curl -X POST http://localhost:3000/api/v1/auth/google \
  -H "Content-Type: application/json" \
  -d '{"code":"GOOGLE_AUTH_CODE"}'
```

### Role-Based Access Control (RBAC)

The system includes fine-grained permission control:

**Roles:**
- `ADMIN` - Full system access
- `MANAGER` - Management operations
- `CASHIER` - Basic POS operations

**Resources:**
- `PRODUCT`, `INVENTORY`, `INVOICE`, `CUSTOMER`, `PAYMENT`, `LEDGER`, `USER`, `REPORT`

**Actions:**
- `CREATE`, `READ`, `UPDATE`, `DELETE`, `EXPORT`, `APPROVE`

**Permission Endpoints:**

```bash
# Get current user's permissions
curl http://localhost:3000/api/v1/permissions/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get permissions for a role (Admin/Manager only)
curl http://localhost:3000/api/v1/permissions/role/CASHIER \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get permission summary
curl http://localhost:3000/api/v1/permissions/role/MANAGER/summary \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create permission (Admin only)
curl -X POST http://localhost:3000/api/v1/permissions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role":"CASHIER","resource":"PRODUCT","action":"READ"}'

# Delete permission (Admin only)
curl -X DELETE http://localhost:3000/api/v1/permissions/{id} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Using RBAC Middleware:**

```typescript
import { requirePermission, requireRole } from './middlewares/rbac'
import { ResourceType, Action, Role } from './generated/prisma'

// Require specific permission
app.use('/api/v1/products/*', 
  requirePermission(ResourceType.PRODUCT, Action.READ)
)

// Require specific role
app.use('/api/v1/admin/*', 
  requireRole(Role.ADMIN)
)

// Require any of multiple permissions
app.use('/api/v1/reports/*',
  requireAnyPermission([
    { resource: ResourceType.REPORT, action: Action.READ },
    { resource: ResourceType.REPORT, action: Action.EXPORT }
  ])
)
```

### Seeding Permissions

```bash
# Seed default permissions for all roles
bun run prisma/seed-permissions.ts
```

This creates default permissions:
- **ADMIN**: Full access to all resources
- **MANAGER**: Management operations (no user deletion)
- **CASHIER**: Basic operations (read products, create invoices)

## 🗄️ Database Schema

### Core Models

**User:**
```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  username     String?
  passwordHash String?
  role         Role     @default(CASHIER)
  isActive     Boolean  @default(true)
  googleId     String?  @unique
  avatarUrl    String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

enum Role {
  ADMIN
  MANAGER
  CASHIER
}
```

**Permission (RBAC):**
```prisma
model Permission {
  id         String       @id @default(uuid())
  role       Role
  resource   ResourceType
  action     Action
  conditions Json?
  createdAt  DateTime     @default(now())

  @@unique([role, resource, action])
}

enum ResourceType {
  PRODUCT
  INVENTORY
  INVOICE
  CUSTOMER
  PAYMENT
  LEDGER
  USER
  REPORT
}

enum Action {
  CREATE
  READ
  UPDATE
  DELETE
  EXPORT
  APPROVE
}
```

### Permission System

Permissions are stored as `role + resource + action` combinations:

```typescript
// Example: CASHIER can READ PRODUCT
{
  role: "CASHIER",
  resource: "PRODUCT",
  action: "READ"
}

// Example: MANAGER can CREATE and APPROVE INVOICE
{
  role: "MANAGER",
  resource: "INVOICE",
  action: "CREATE"
}
```

**Conditions** (JSON field) allows fine-grained control:
```json
{
  "ownerId": "$userId",
  "status": "draft"
}
```

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server |
| `bun run build` | Build for production |
| `bun start` | Run production server |
| `bunx prisma studio` | Open database GUI |
| `bunx prisma generate` | Generate Prisma Client |
| `bunx prisma db push` | Push schema to database |
| `bunx prisma migrate dev` | Create migration |
| `bun run seed-permissions.ts` | Seed RBAC permissions |

## 🏗️ Adding New Features

### 1. Create Service

```typescript
// src/services/products/product.service.ts
import prisma from '../../db/client'

export interface CreateProductInput {
  name: string
  sku: string
  price: number
}

export class ProductService {
  async createProduct(data: CreateProductInput) {
    const existing = await prisma.product.findUnique({
      where: { sku: data.sku }
    })

    if (existing) {
      throw new Error('SKU already exists')
    }

    return prisma.product.create({
      data: {
        name: data.name,
        sku: data.sku,
        sellingPrice: data.price,
        categoryId: data.categoryId,
        costPrice: data.costPrice
      }
    })
  }

  async getProductById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true }
    })

    if (!product) {
      throw new Error('Product not found')
    }

    return product
  }

  async getAllProducts(filters?: { categoryId?: string }) {
    return prisma.product.findMany({
      where: filters,
      include: { category: true }
    })
  }
}

export const productService = new ProductService()
```

### 2. Create Zod Schema

```typescript
// src/schemas/product.ts
import { z } from 'zod'

export const CreateProductSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  price: z.number().positive(),
  categoryId: z.string().uuid()
})

export const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  sku: z.string(),
  sellingPrice: z.number(),
  createdAt: z.string().datetime()
})
```

### 3. Create Route

```typescript
// src/routes/v1/products.ts
import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { productService } from '../../services/products/product.service'
import { CreateProductSchema, ProductSchema } from '../../schemas/product'

const products = new OpenAPIHono()

const createProductRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Products'],
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: {
        'application/json': { schema: CreateProductSchema }
      }
    }
  },
  responses: {
    201: {
      content: {
        'application/json': { schema: ProductSchema }
      },
      description: 'Product created'
    },
    400: {
      content: {
        'application/json': { 
          schema: z.object({ error: z.string() })
        }
      },
      description: 'Bad request'
    }
  }
})

products.openapi(createProductRoute, async (c) => {
  try {
    const data = c.req.valid('json')
    const product = await productService.createProduct(data)
    return c.json(product, 201)
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

export default products
```

### 4. Register Route with Middleware

```typescript
// src/index.ts
import productRoutes from './routes/v1/products'
import { authMiddleware } from './middlewares/auth'
import { requirePermission } from './middlewares/rbac'
import { ResourceType, Action } from './generated/prisma'

// Apply auth + RBAC
app.use('/api/v1/products/*', authMiddleware)
app.use('/api/v1/products/*', 
  requirePermission(ResourceType.PRODUCT, Action.CREATE)
)
app.route('/api/v1/products', productRoutes)
```

### Best Practices

**Services:**
- ✅ Focus on single domain
- ✅ Throw descriptive errors
- ✅ Return typed objects
- ❌ Don't access HTTP request/response

**Routes:**
- ✅ Keep thin (minimal logic)
- ✅ Validate with Zod
- ✅ Handle service errors
- ❌ Don't put business logic here

**RBAC:**
- Use `requirePermission()` for resource-action checks
- Use `requireRole()` for role-based routes
- Seed default permissions with `seed-permissions.ts`

## 🔒 Protected Routes & RBAC

### JWT Authentication Middleware

```typescript
import { authMiddleware } from './middlewares/auth'

app.use('/api/v1/protected/*', authMiddleware)
app.route('/api/v1/protected/products', productRoutes)
```

Access user in route:
```typescript
products.openapi(route, async (c) => {
  const userId = c.get('userId')
  const userRole = c.get('userRole')
  // Your logic
})
```

### RBAC Middleware

```typescript
import { requirePermission, requireRole, requireAnyPermission } from './middlewares/rbac'
import { ResourceType, Action, Role } from './generated/prisma'

// Require specific permission
app.use('/api/v1/products/*', 
  authMiddleware,
  requirePermission(ResourceType.PRODUCT, Action.READ)
)

// Require specific role
app.use('/api/v1/admin/*',
  authMiddleware,
  requireRole(Role.ADMIN)
)

// Require any of multiple permissions
app.use('/api/v1/reports/*',
  authMiddleware,
  requireAnyPermission([
    { resource: ResourceType.REPORT, action: Action.READ },
    { resource: ResourceType.REPORT, action: Action.EXPORT }
  ])
)

// Require all permissions
app.use('/api/v1/sensitive/*',
  authMiddleware,
  requireAllPermissions([
    { resource: ResourceType.USER, action: Action.READ },
    { resource: ResourceType.LEDGER, action: Action.READ }
  ])
)
```

## 🧪 Testing

**Swagger UI**: Best for manual testing
**cURL**: Good for scripting
**Postman/Insomnia**: Import from `/api/doc`

## 🚀 Deployment

### Build
```bash
bun run build
```

### Production
```bash
bun start
```

### Environment
Set these in production:
- `DATABASE_URL` - Production database
- `JWT_SECRET` - Strong random string
- `NODE_ENV=production`

## 📦 Dependencies

### Core
- `hono` - Web framework
- `@hono/zod-openapi` - OpenAPI support with Zod
- `@hono/swagger-ui` - Swagger documentation
- `@scalar/hono-api-reference` - Modern API docs
- `@prisma/client` - Database client
- `prisma` - ORM toolkit
- `zod` - Schema validation

### Authentication & Security
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT tokens
- `google-auth-library` - OAuth

### Development
- `typescript` - Type safety
- `@types/node` - Node.js types
- `tsx` - TypeScript execution

## 📖 Additional Documentation

- [SERVICE-ARCHITECTURE.md](SERVICE-ARCHITECTURE.md) - Service layer patterns and examples
- [POS-DEVELOPMENT-ROADMAP.md](POS-DEVELOPMENT-ROADMAP.md) - Full project roadmap
- [Prisma Schema](prisma/schema.prisma) - Complete database schema

## 🤝 Contributing

1. Add features in separate route files
2. Use OpenAPI specs for all routes
3. Validate inputs with Zod schemas
4. Update Prisma schema for DB changes
5. Run `prisma generate` after schema updates