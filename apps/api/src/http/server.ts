import fastifyCors from '@fastify/cors'
import fastifyJwt from '@fastify/jwt'
import fastifySwagger from '@fastify/swagger'
import scalarUI from '@scalar/fastify-api-reference'
import fastify from 'fastify'
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from 'fastify-type-provider-zod'

import { loginRoute } from './routes/auth/login'
import { getProfileRoute } from './routes/auth/profile'
import { registerRoute } from './routes/auth/register'

const app = fastify().withTypeProvider<ZodTypeProvider>()

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

app.register(fastifyCors)
app.register(fastifyJwt, {
  secret: 'librashub',
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
  return 'ok'
})

app.register(registerRoute)
app.register(loginRoute)
app.register(getProfileRoute)

app.listen({ port: 3333, host: '0.0.0.0' }).then(() => {
  console.log('HTTP server running on http://localhost:3333')
  console.log('API docs available on http://localhost:3333/docs')
})
