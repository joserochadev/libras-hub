import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { prisma } from '@/lib/prisma'

export function listSignsRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/signs',
    {
      schema: {
        summary: 'List all signs',
        description: 'Get a paginated list of all signs',
        tags: ['Signs'],
        querystring: z.object({
          page: z.coerce.number().default(1),
          limit: z.coerce.number().default(20),
          category: z.string().optional(),
          search: z.string().optional(),
        }),
        response: {
          200: z.object({
            signs: z.array(
              z.object({
                id: z.uuid(),
                gloss: z.string(),
                description: z.string(),
                category: z.string(),
                videoUrl: z.url().nullable(),
                thumbUrl: z.url().nullable(),
                createdAt: z.date(),
                user: z.object({
                  id: z.uuid(),
                  name: z.string(),
                  city: z.string().nullable(),
                  state: z.string().nullable(),
                  avatarUrl: z.url().nullable(),
                }),
              })
            ),
            pagination: z.object({
              page: z.number(),
              limit: z.number(),
              total: z.number(),
              totalPages: z.number(),
            }),
          }),
        },
      },
    },
    async (request, reply) => {
      const { page, limit, category, search } = request.query

      const where = {
        ...(category && { category }),
        ...(search && {
          OR: [
            { gloss: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }),
      }

      const [signs, total] = await Promise.all([
        prisma.sign.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                city: true,
                state: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.sign.count({ where }),
      ])

      return reply.send({
        signs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
    }
  )
}
