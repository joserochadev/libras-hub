import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { prisma } from '@/lib/prisma'

export function getSignRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/signs/:signId',
    {
      schema: {
        summary: 'Get sign by ID',
        description: 'Get detailed information about a specific sign',
        tags: ['Signs'],
        params: z.object({
          signId: z.uuid(),
        }),
        response: {
          200: z.object({
            sign: z.object({
              id: z.uuid(),
              gloss: z.string(),
              description: z.string(),
              category: z.string(),
              videoUrl: z.url().nullable(),
              imageUrl: z.url().nullable(),
              thumbUrl: z.url().nullable(),
              keypoints: z.any().nullable(),
              createdAt: z.date(),
              updatedAt: z.date(),
              user: z.object({
                id: z.uuid(),
                name: z.string(),
                city: z.string().nullable(),
                state: z.string().nullable(),
                avatarUrl: z.url().nullable(),
                bio: z.string().nullable(),
              }),
            }),
          }),
          404: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { signId } = request.params

      const sign = await prisma.sign.findUnique({
        where: { id: signId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              city: true,
              state: true,
              avatarUrl: true,
              bio: true,
            },
          },
        },
      })

      if (!sign) {
        return reply.status(404).send({ message: 'Sign not found' })
      }

      return reply.send({ sign })
    }
  )
}
