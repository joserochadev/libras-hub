import fastifyCors from '@fastify/cors'
import fastifyJwt from '@fastify/jwt'
import fastifyMultipart from '@fastify/multipart'
import fastifySwagger from '@fastify/swagger'
import scalarUI from '@scalar/fastify-api-reference'
import fastify from 'fastify'
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from 'fastify-type-provider-zod'

import { env } from '@/env'

import { loginRoute } from './routes/auth/login'
import { getProfileRoute } from './routes/auth/profile'
import { registerRoute } from './routes/auth/register'
import { createSignRoute } from './routes/signs/create-sign'
import { getSignRoute } from './routes/signs/get-sign'
import { listSignsRoute } from './routes/signs/list-signs'

const app = fastify().withTypeProvider<ZodTypeProvider>()

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

app.register(fastifyCors)
app.register(fastifyJwt, {
  secret: env.JWT_SECRET,
})

app.register(fastifyMultipart, {
  limits: {
    fileSize: env.MAX_FILE_SIZE, // 100MB
  },
})

app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'LibrasHUB',
      version: '0.0.1',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    servers: [],
  },
  transform: jsonSchemaTransform,
})

app.register(scalarUI, {
  routePrefix: '/docs',
  configuration: {
    persistAuth: true,
  },
})

app.get('/health', () => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

app.register(registerRoute)
app.register(loginRoute)
app.register(getProfileRoute)
app.register(createSignRoute)
app.register(listSignsRoute)
app.register(getSignRoute)

const PORT = process.env.PORT || 3333
const HOST = process.env.HOST || '0.0.0.0'

app.listen({ port: Number(PORT), host: HOST }).then(() => {
  console.log(`
  🚀 LibrasHUB API running!
    URL: http://localhost:${PORT}
    Docs: http://localhost:${PORT}/docs
    Health: http://localhost:${PORT}/health
  `)
})
