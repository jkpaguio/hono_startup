import { serve } from '@hono/node-server'
import { OpenAPIHono } from '@hono/zod-openapi'
import { swaggerUI } from '@hono/swagger-ui'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import authRoutes from './routes/auth'

const app = new OpenAPIHono()

app.use('*', logger())
app.use('*', cors())

app.get('/', (c) => c.json({ message: 'POS API' }))
app.route('/api/auth', authRoutes)

app.doc('/api/doc', {
  openapi: '3.0.0',
  info: {
    title: 'POS API',
    version: '1.0.0'
  }
})

app.get('/api/swagger', swaggerUI({ url: '/api/doc' }))

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`🚀 Server running on http://localhost:${info.port}`)
  console.log(`📚 Swagger UI: http://localhost:${info.port}/api/swagger`)
})