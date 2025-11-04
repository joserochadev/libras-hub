import { hash } from 'bcryptjs'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { prisma } from '@/lib/prisma'

export function registerRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/auth/register',
    {
      schema: {
        summary: 'Register a new user',
        description: 'Register a new user with email and password',
        tags: ['Auth'],
        body: z.object({
          name: z
            .string()
            .min(3, { error: 'O nome deve ter no mínimo 3 caracteres' })
            .meta({ example: 'John Doe' }),
          email: z
            .email({ error: 'E-mail inválido.' })
            .meta({ example: 'john@mail.com' }),
          password: z
            .string()
            .min(6, { error: 'A senha deve ter no mínimo 6 caracteres' })
            .meta({ example: '123456' }),
          city: z.string().optional().meta({ example: 'São Paulo' }),
          state: z.string().optional().meta({ example: 'SP' }),
        }),
      },
    },
    async (request, reply) => {
      const { name, email, password, city, state } = request.body

      const userWithSameEmail = await prisma.user.findUnique({
        where: { email },
      })

      if (userWithSameEmail) {
        return reply.status(400).send({
          message: 'Já existe um usuário com esse e-mail.',
        })
      }

      const passwordHash = await hash(password, 6)

      const user = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          city,
          state,
        },
      })

      return reply.status(201).send()
    }
  )
}
