# Quick Start Guide

## Setup (5 minutes)

```bash
# 1. Install dependencies
bun install

# 2. Setup environment
cp .env.example .env
# Edit .env with your database URL and secrets

# 3. Setup database
bunx prisma generate
bunx prisma db push

# 4. Seed RBAC permissions
bun run seed-permissions.ts

# 5. Run server
bun run dev
```

Server running at:
- API: http://localhost:3000
- Docs: http://localhost:3000/api/docs
- Swagger: http://localhost:3000/api/swagger

## Quick Examples

### Authentication
```bash
# Register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}'

# Response: { "token": "...", "user": {...} }
```

### Check Permissions
```bash
# Get my permissions
curl http://localhost:3000/api/v1/permissions/me \
  -H "Authorization: Bearer YOUR_TOKEN"

# Response: { "role": "CASHIER", "permissions": [...], "summary": {...} }
```

## Default Roles & Permissions

After running `seed-permissions.ts`:

**ADMIN:**
- Full access to everything

**MANAGER:**
- Can manage products, inventory, invoices, customers
- Can view but not delete users
- Can approve payments

**CASHIER:**
- Can create invoices and record payments
- Can read products, inventory, customers
- Cannot modify products or access reports

## Project Structure

```
src/
├── services/          # Business logic
│   ├── auth/
│   └── rbac/
├── routes/v1/         # HTTP endpoints
├── middlewares/       # Auth & RBAC
├── schemas/           # Zod validation
└── lib/               # Utilities
```

## Adding New Feature

1. **Create service** → `services/feature/feature.service.ts`
2. **Create schema** → `schemas/feature.ts`
3. **Create route** → `routes/v1/feature.ts`
4. **Register route** → `index.ts`

## Common Commands

```bash
# Development
bun run dev

# Database
bunx prisma studio          # GUI
bunx prisma db push         # Update DB
bunx prisma generate        # Generate client

# Production
bun run build
bun start
```

## Testing API

Use Swagger UI at http://localhost:3000/api/swagger for interactive testing.

## Need Help?

- [README.md](README.md) - Full documentation
- [SERVICE-ARCHITECTURE.md](SERVICE-ARCHITECTURE.md) - Architecture details
- [POS-DEVELOPMENT-ROADMAP.md](POS-DEVELOPMENT-ROADMAP.md) - Project roadmap
