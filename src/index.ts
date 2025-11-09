import { serve } from '@hono/node-server'
import { OpenAPIHono } from '@hono/zod-openapi'
import { swaggerUI } from '@hono/swagger-ui'
import { Scalar } from '@scalar/hono-api-reference'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { HTTPException } from 'hono/http-exception'
import authRoutes from './routes/v1/auth'
import permissionRoutes from './routes/v1/permissions'
import { authMiddleware } from './middlewares/auth'

const app = new OpenAPIHono()

// Register security scheme
app.openAPIRegistry.registerComponent('securitySchemes', 'Bearer', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'Enter your JWT token'
})

app.use('*', logger())
app.use('*', cors())

// Error handler
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status)
  }
  console.error(err)
  return c.json({ error: 'Internal server error' }, 500)
})

app.get('/', (c) => c.json({ message: 'POS API with RBAC' }))

// Public routes (no auth)
app.route('/api/auth', authRoutes)

// Protected routes (requires auth)
app.use('/api/permissions/*', authMiddleware)
app.route('/api/permissions', permissionRoutes)

app.doc('/api/doc', {
  openapi: '3.0.0',
  info: {
    title: 'POS API',
    version: '1.0.0',
    description: 'POS System API with JWT Authentication and RBAC'
  }
})

// Swagger UI (classic)
app.get('/api/swagger', swaggerUI({ url: '/api/doc' }))

// Scalar API Reference (modern)
app.get('/api/docs', Scalar({
  url: '/api/doc',
  theme: 'purple',
  layout: 'modern'
}))

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000

serve({
  fetch: app.fetch,
  port: PORT
}, (info) => {
  console.log(`🚀 Server running on http://localhost:${info.port}`)
  console.log(`📚 Swagger UI: http://localhost:${info.port}/api/swagger`)
  console.log(`📖 Scalar Docs: http://localhost:${info.port}/api/docs`)
})