import z from 'zod'

export const envSchema = z.object({
  PORT: z.coerce.number().default(3333),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  CLOUDINARY_CLOUD_NAME: z.string().min(1, 'CLOUDINARY_CLOUD_NAME is required'),
  CLOUDINARY_API_KEY: z.string().min(1, 'CLOUDINARY_API_KEY is required'),
  CLOUDINARY_API_SECRET: z.string().min(1, 'CLOUDINARY_API_SECRET is required'),

  MAX_FILE_SIZE: z.coerce.number().default(100 * 1024 * 1024), // 100MB
  ALLOWED_VIDEO_FORMATS: z.string().default('mp4,mov,avi,webm'),

  FFMPEG_PATH: z.string().default('/usr/bin/ffmpeg'),
  TEMP_UPLOAD_DIR: z.string().default('/tmp/uploads'),
})

export const env = envSchema.parse(process.env)
