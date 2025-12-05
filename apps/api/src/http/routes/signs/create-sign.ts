import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { createWriteStream, promises as fs } from 'fs'
import path from 'path'
import { pipeline } from 'stream/promises'
import z from 'zod'
import { randomUUID } from 'crypto'

import { auth } from '@/http/middlewares/auth'
import { cloudinary } from '@/lib/cloudinary'
import { prisma } from '@/lib/prisma'
import { videoProcessor } from '@/lib/video-processor'

export function createSignRoute(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    // .register(auth)
    .post(
      '/signs',
      {
        schema: {
          summary: 'Create a new sign',
          description: 'Upload and process a new Libras sign video',
          tags: ['Signs'],
          security: [{ bearerAuth: [] }],
          consumes: ['multipart/form-data'],
          response: {
            201: z.object({
              sign: z.object({
                id: z.uuid(),
                gloss: z.string(),
                description: z.string(),
                category: z.string(),
                videoUrl: z.url().nullable(),
                thumbUrl: z.url().nullable(),
                keypoints: z.any(),
              }),
            }),
            400: z.object({
              message: z.string(),
            }),
          },
        },
      },
      async (request, reply) => {
        const userId = randomUUID()

        const data = await request.file()

        if (!data) {
          return reply.status(400).send({ message: 'No file uploaded' })
        }

        const allowedMimeTypes = [
          'video/mp4',
          'video/webm',
          'video/quicktime',
          'video/x-msvideo',
        ]

        if (!allowedMimeTypes.includes(data.mimetype)) {
          return reply.status(400).send({
            message: 'Invalid file type. Only video files are allowed.',
          })
        }

        const tempDir = './tmp/uploads'
        await fs.mkdir(tempDir, { recursive: true })

        const filename = `${Date.now()}-${data.filename}`
        const tempPath = path.join(tempDir, filename)
        const writeStream = createWriteStream(tempPath)

        await pipeline(data.file, writeStream)

        const filesToCleanup: string[] = [tempPath]

        try {
          console.log('🎬 Processando vídeo (sem validação de pose)...')

          // Processa vídeo
          const processedPath = path.join(tempDir, `processed-${filename}`)
          await videoProcessor.normalizeVideo(tempPath, processedPath)
          filesToCleanup.push(processedPath)

          const neutralBgPath = path.join(tempDir, `neutral-${filename}`)
          await videoProcessor.applyNeutralBackground(
            processedPath,
            neutralBgPath
          )
          filesToCleanup.push(neutralBgPath)

          // Cria thumbnail
          console.log('📷 Criando thumbnail...')
          const thumbnailPath = path.join(
            tempDir,
            `thumb-${filename.replace(/\.\w+$/, '.jpg')}`
          )
          await videoProcessor.createThumbnail(neutralBgPath, thumbnailPath)
          filesToCleanup.push(thumbnailPath)

          // Upload para Cloudinary
          console.log('☁️ Fazendo upload...')
          const videoUpload = await cloudinary.uploader.upload(neutralBgPath, {
            resource_type: 'video',
            folder: 'librashub/signs',
            public_id: `sign-${userId}-${Date.now()}`,
          })

          const thumbUpload = await cloudinary.uploader.upload(thumbnailPath, {
            folder: 'librashub/thumbnails',
            public_id: `thumb-${userId}-${Date.now()}`,
          })

          // Extrai campos do formulário
          const fields = data.fields as any
          const gloss = fields.gloss?.value || 'Untitled'
          const description = fields.description?.value || ''
          const category = fields.category?.value || 'outros'

          // Salva no banco
          console.log('💾 Salvando no banco de dados...')
          const sign = await prisma.sign.create({
            data: {
              gloss,
              description,
              category,
              videoUrl: videoUpload.secure_url,
              thumbUrl: thumbUpload.secure_url,
              keypoints: undefined, // Sem keypoints por enquanto
              // userId,
            },
          })

          // Limpa arquivos
          await videoProcessor.cleanup(filesToCleanup)

          console.log('✅ Sinal criado com sucesso!')

          return reply.status(201).send({
            sign: {
              id: sign.id,
              gloss: sign.gloss,
              description: sign.description,
              category: sign.category,
              videoUrl: sign.videoUrl,
              thumbUrl: sign.thumbUrl,
              keypoints: sign.keypoints,
            },
          })
        } catch (error) {
          console.error('❌ Erro ao processar vídeo:', error)

          try {
            await videoProcessor.cleanup(filesToCleanup)
          } catch (e) {
            console.error('Erro no cleanup:', e)
          }

          return reply.status(400).send({
            message: 'Error processing video',
          })
        }
      }
    )
}

// import { FastifyInstance } from 'fastify'
// import { ZodTypeProvider } from 'fastify-type-provider-zod'
// import { createWriteStream, promises as fs } from 'fs'
// import path from 'path'
// import { pipeline } from 'stream/promises'
// import z from 'zod'

// import { auth } from '@/http/middlewares/auth'
// import { cloudinary } from '@/lib/cloudinary'
// import { poseDetector } from '@/lib/pose-detector'
// import { prisma } from '@/lib/prisma'
// import { videoProcessor } from '@/lib/video-processor'
// import { randomUUID } from 'crypto'

// export function createSignRoute(app: FastifyInstance) {
//   app
//     .withTypeProvider<ZodTypeProvider>()
//     // .register(auth)
//     .post(
//       '/signs',
//       {
//         schema: {
//           summary: 'Create a new sign',
//           description: 'Upload and process a new Libras sign video',
//           tags: ['Signs'],
//           security: [{ bearerAuth: [] }],
//           consumes: ['multipart/form-data'],
//           response: {
//             201: z.object({
//               sign: z.object({
//                 id: z.uuid(),
//                 gloss: z.string(),
//                 description: z.string(),
//                 category: z.string(),
//                 videoUrl: z.url().nullable(),
//                 thumbUrl: z.url().nullable(),
//                 keypoints: z.any(),
//                 poseAnalysis: z.object({
//                   isValid: z.boolean(),
//                   confidence: z.number(),
//                   hasUpperBody: z.boolean(),
//                 }),
//               }),
//             }),
//             400: z.object({
//               message: z.string(),
//             }),
//           },
//         },
//       },
//       async (request, reply) => {
//         const userId = await randomUUID()

//         // Recebe o upload multipart
//         const data = await request.file()

//         if (!data) {
//           return reply.status(400).send({ message: 'No file uploaded' })
//         }

//         // Valida tipo de arquivo
//         const allowedMimeTypes = [
//           'video/mp4',
//           'video/webm',
//           'video/quicktime',
//           'video/x-msvideo',
//         ]

//         if (!allowedMimeTypes.includes(data.mimetype)) {
//           return reply.status(400).send({
//             message: 'Invalid file type. Only video files are allowed.',
//           })
//         }

//         // Salva arquivo temporário
//         const tempDir = './tmp/uploads'
//         await fs.mkdir(tempDir, { recursive: true })

//         const filename = `${Date.now()}-${data.filename}`
//         const tempPath = path.join(tempDir, filename)
//         const writeStream = createWriteStream(tempPath)

//         await pipeline(data.file, writeStream)

//         try {
//           // 1. Extrai frames para análise
//           console.log('📸 Extracting frames...')
//           const frames = await videoProcessor.extractFrames(tempPath, 12)

//           // 2. Analisa pose nos frames
//           console.log('🕵️ Analyzing pose...')
//           const poseAnalysis = await poseDetector.analyzeVideoFrames(frames)

//           if (!poseAnalysis.isValid) {
//             await videoProcessor.cleanup([tempPath, ...frames])
//             return reply.status(400).send({
//               message:
//                 'Video validation failed: Person must be visible from waist up',
//             })
//           }

//           // 3. Detecta pose detalhada no melhor frame
//           const bestFrame = frames[Math.floor(frames.length / 2)]
//           const detailedPose = await poseDetector.detectPose(bestFrame)

//           // 4. Processa vídeo (normalização e fundo neutro)
//           console.log('🎬 Processing video...')
//           const processedPath = path.join(tempDir, `processed-${filename}`)
//           await videoProcessor.normalizeVideo(tempPath, processedPath)

//           const neutralBgPath = path.join(tempDir, `neutral-${filename}`)
//           await videoProcessor.applyNeutralBackground(
//             processedPath,
//             neutralBgPath
//           )

//           // 5. Cria thumbnail
//           console.log('📷 Creating thumbnail...')
//           const thumbnailPath = path.join(
//             tempDir,
//             `thumb-${filename.replace(/\.\w+$/, '.jpg')}`
//           )
//           await videoProcessor.createThumbnail(neutralBgPath, thumbnailPath)

//           // 6. Faz upload para Cloudinary
//           console.log('☁️ Uploading to cloud...')
//           const videoUpload = await cloudinary.uploader.upload(neutralBgPath, {
//             resource_type: 'video',
//             folder: 'librashub/signs',
//             public_id: `sign-${userId}-${Date.now()}`,
//           })

//           const thumbUpload = await cloudinary.uploader.upload(thumbnailPath, {
//             folder: 'librashub/thumbnails',
//             public_id: `thumb-${userId}-${Date.now()}`,
//           })

//           // 7. Obtém metadados do vídeo
//           const duration = await videoProcessor.getVideoDuration(neutralBgPath)

//           // 8. Extrai campos adicionais do formulário
//           const fields = data.fields as any
//           const gloss = fields.gloss?.value || 'Untitled'
//           const description = fields.description?.value || ''
//           const category = fields.category?.value || 'outros'

//           // 9. Salva no banco de dados
//           console.log('💾 Saving to database...')
//           const sign = await prisma.sign.create({
//             data: {
//               gloss,
//               description,
//               category,
//               videoUrl: videoUpload.secure_url,
//               thumbUrl: thumbUpload.secure_url,
//               keypoints: detailedPose.keypoints,
//               userId,
//             },
//             include: {
//               user: {
//                 select: {
//                   id: true,
//                   name: true,
//                   city: true,
//                   state: true,
//                   avatarUrl: true,
//                 },
//               },
//             },
//           })

//           // 10. Limpa arquivos temporários
//           await videoProcessor.cleanup([
//             tempPath,
//             processedPath,
//             neutralBgPath,
//             thumbnailPath,
//             ...frames,
//           ])

//           console.log('✅ Sign created successfully!')

//           return reply.status(201).send({
//             sign: {
//               id: sign.id,
//               gloss: sign.gloss,
//               description: sign.description,
//               category: sign.category,
//               videoUrl: sign.videoUrl,
//               thumbUrl: sign.thumbUrl,
//               keypoints: sign.keypoints,
//               poseAnalysis: {
//                 isValid: poseAnalysis.isValid,
//                 confidence: poseAnalysis.averageConfidence,
//                 hasUpperBody: detailedPose.hasUpperBody,
//               },
//             },
//           })
//         } catch (error) {
//           console.error('Error processing video:', error)

//           // Limpa arquivos em caso de erro
//           try {
//             await fs.unlink(tempPath)
//           } catch (e) {
//             // Ignora erros de limpeza
//           }

//           return reply.status(400).send({
//             message: 'Error processing video',
//           })
//         }
//       }
//     )
// }
