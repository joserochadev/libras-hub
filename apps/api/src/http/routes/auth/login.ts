import { compare } from 'bcryptjs'
import { FastifyInstance } from 'fastify/types/instance'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { prisma } from '@/lib/prisma'

export function loginRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/auth/login',
    {
      schema: {
        summary: 'Login user',
        description: 'Login user with email and password',
        tags: ['Auth'],
        body: z.object({
          email: z
            .email({ error: 'E-mail inválido.' })
            .meta({ example: 'john@mail.com' }),
          password: z.string().meta({ example: '123456' }),
        }),
        response: {
          200: z.object({
            token: z.string().meta({ example: 'jwt.token.here' }),
          }),
          400: z.object({
            message: z.string().meta({ example: 'Bad Request' }),
          }),
          401: z.object({
            message: z.string().meta({ example: 'E-mail ou senha inválidos.' }),
          }),
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body

      const user = await prisma.user.findUnique({
        where: { email },
      })

      if (!user) {
        return reply.status(401).send({
          message: 'E-mail ou senha inválidos.',
        })
      }

      const isValidPassword = await compare(password, user.passwordHash)

      if (!isValidPassword) {
        return reply.status(401).send({
          message: 'E-mail ou senha inválidos.',
        })
      }

      const token = await reply.jwtSign(
        {
          sub: user.id,
        },
        {
          expiresIn: '7 days',
        }
      )

      return reply.status(200).send({ token })
    }
  )
}
