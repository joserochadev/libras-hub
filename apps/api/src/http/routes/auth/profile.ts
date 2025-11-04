import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

export function getProfileRoute(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/auth/profile',
      {
        schema: {
          summary: 'Get current user profile',
          description:
            'Retrieve the profile information of the currently authenticated user',
          tags: ['Auth'],
          security: [{ bearerAuth: [] }],
          response: {
            200: z.object({
              user: z.object({
                id: z.uuid().meta({ example: 'user-uuid' }),
                name: z.string().meta({ example: 'John Doe' }),
                email: z.email().meta({ example: 'john@mail.com' }),
                city: z.string().nullable().meta({ example: 'São Paulo' }),
                state: z.string().nullable().meta({ example: 'SP' }),
                bio: z.string().nullable().meta({
                  example: 'Apaixonado por Libras e tecnologia!',
                }),
                avatarUrl: z.url().nullable().meta({
                  example: 'https://example.com/avatars/user-uuid/avatar.png',
                }),
              }),
            }),
            404: z.object({
              message: z.string().meta({ example: 'User not found' }),
            }),
          },
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()

        const user = await prisma.user.findUnique({
          where: { id: userId },
        })

        if (!user) {
          return reply.status(404).send({ message: 'User not found' })
        }

        return reply.send({
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            city: user.city,
            state: user.state,
            bio: user.bio,
            avatarUrl: user.avatarUrl,
          },
        })
      }
    )
}
