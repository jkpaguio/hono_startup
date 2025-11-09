# Hono + Swagger + Prisma Starter

A production-ready API starter template with Hono, OpenAPI/Swagger documentation, Prisma ORM, and JWT authentication.

## 🚀 Features

- **Hono** - Fast web framework
- **OpenAPI/Swagger** - Interactive API documentation
- **Prisma** - Type-safe database ORM
- **JWT Auth** - Secure authentication
- **Google OAuth** - Social login
- **TypeScript** - Full type safety
- **PostgreSQL** - Robust database

## 📁 Project Structure

```
backend/
├── src/
│   ├── index.ts              # Server entry point
│   ├── db/
│   │   └── client.ts         # Prisma client
│   ├── routes/
│   │   └── auth.ts           # Auth endpoints (OpenAPI)
│   ├── middlewares/
│   │   └── auth.ts           # JWT middleware
│   ├── schemas/
│   │   └── auth.ts           # Zod validation schemas
│   ├── lib/
│   │   └── jwt.ts            # JWT utilities
│   └── generated/
│       └── prisma/           # Generated Prisma Client
├── prisma/
│   └── schema.prisma         # Database schema
├── .env
└── package.json
```

### Folder Guide

| Folder | Purpose |
|--------|---------|
| `src/routes/` | API endpoints with OpenAPI specs |
| `src/middlewares/` | Request interceptors (auth, validation) |
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
- **Swagger UI**: http://localhost:3000/api/swagger
- **OpenAPI JSON**: http://localhost:3000/api/doc

## 🔐 Authentication

### Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Protected Route
```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🗄️ Database Schema

```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  username     String?
  passwordHash String?
  role         Role     @default(CASHIER)
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

## 🏗️ Adding New Routes

1. **Create route file** in `src/routes/`
2. **Define OpenAPI schema** with `createRoute()`
3. **Implement handler** with `app.openapi()`
4. **Register in** `src/index.ts`

Example:
```typescript
// src/routes/products.ts
import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'

const products = new OpenAPIHono()

const getProductsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Products'],
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.array(z.object({
            id: z.string(),
            name: z.string()
          }))
        }
      },
      description: 'List of products'
    }
  }
})

products.openapi(getProductsRoute, async (c) => {
  return c.json([{ id: '1', name: 'Product' }])
})

export default products
```

Register in `src/index.ts`:
```typescript
import productRoutes from './routes/products'
app.route('/api/products', productRoutes)
```

## 🔒 Adding Protected Routes

Use auth middleware:
```typescript
import { authMiddleware } from './middlewares/auth'

app.use('/api/protected/*', authMiddleware)
app.route('/api/protected/products', productRoutes)
```

Access user in route:
```typescript
products.openapi(route, async (c) => {
  const userId = c.get('userId')
  const userRole = c.get('userRole')
  // Your logic
})
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

- `hono` - Web framework
- `@hono/zod-openapi` - OpenAPI support
- `@hono/swagger-ui` - API documentation
- `@prisma/client` - Database client
- `prisma` - ORM toolkit
- `zod` - Schema validation
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT tokens
- `google-auth-library` - OAuth

## 🤝 Contributing

1. Add features in separate route files
2. Use OpenAPI specs for all routes
3. Validate inputs with Zod schemas
4. Update Prisma schema for DB changes
5. Run `prisma generate` after schema updates

## 📄 License

MIT

---

**Built with ❤️ using Hono + Swagger + Prisma**