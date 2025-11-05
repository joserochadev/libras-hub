import ffmpeg from 'fluent-ffmpeg'
import { promises as fs } from 'fs'
import path from 'path'

export class VideoProcessor {
  private tempDir: string

  constructor() {
    this.tempDir = process.env.TEMP_UPLOAD_DIR || './tmp/uploads'
  }

  async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true })
    } catch (error) {
      console.error('Error creating temp directory:', error)
    }
  }

  /**
   * Extrai frames do vídeo para análise
   */
  async extractFrames(
    videoPath: string,
    numFrames: number = 5
  ): Promise<string[]> {
    await this.ensureTempDir()

    const outputPattern = path.join(this.tempDir, `frame-%03d.jpg`)

    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .on('end', async () => {
          const files = await fs.readdir(this.tempDir)
          const frames = files
            .filter((f) => f.startsWith('frame-'))
            .slice(0, numFrames)
            .map((f) => path.join(this.tempDir, f))
          resolve(frames)
        })
        .on('error', reject)
        .outputOptions([
          '-vf',
          `fps=1/${Math.ceil(30 / numFrames)}`, // Extrai frames distribuídos
        ])
        .output(outputPattern)
        .run()
    })
  }

  /**
   * Obtém duração do vídeo
   */
  async getVideoDuration(videoPath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) reject(err)
        else resolve(metadata.format.duration || 0)
      })
    })
  }

  /**
   * Cria thumbnail do vídeo
   */
  async createThumbnail(
    videoPath: string,
    outputPath: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .on('end', () => resolve(outputPath))
        .on('error', reject)
        .screenshots({
          timestamps: ['50%'],
          filename: path.basename(outputPath),
          folder: path.dirname(outputPath),
          size: '640x480',
        })
    })
  }

  /**
   * Remove fundo do vídeo usando chroma key ou técnicas de segmentação
   * Converte para fundo neutro (cinza claro)
   */
  async removeBackground(
    videoPath: string,
    outputPath: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .on('end', () => resolve(outputPath))
        .on('error', reject)
        .outputOptions([
          '-vf',
          'colorkey=0x00FF00:0.3:0.2,format=yuv420p', // Remove verde
          '-c:v',
          'libx264',
          '-crf',
          '23',
          '-preset',
          'medium',
        ])
        .output(outputPath)
        .run()
    })
  }

  /**
   * Aplica fundo neutro ao vídeo
   */
  async applyNeutralBackground(
    videoPath: string,
    outputPath: string,
    backgroundColor: string = '#F3F4F6'
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .on('end', () => resolve(outputPath))
        .on('error', reject)
        .complexFilter([
          // Cria um fundo da cor especificada
          `color=${backgroundColor}:s=1280x720[bg]`,
          // Sobrepõe o vídeo no fundo
          '[bg][0:v]overlay=shortest=1[outv]',
        ])
        .outputOptions(['-map', '[outv]', '-c:v', 'libx264', '-crf', '23'])
        .output(outputPath)
        .run()
    })
  }

  /**
   * Normaliza o vídeo (resolução, codec, etc)
   */
  async normalizeVideo(videoPath: string, outputPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .on('end', () => resolve(outputPath))
        .on('error', reject)
        .videoCodec('libx264')
        .size('1280x720')
        .fps(30)
        .outputOptions(['-crf', '23', '-preset', 'medium'])
        .output(outputPath)
        .run()
    })
  }

  /**
   * Limpa arquivos temporários
   */
  async cleanup(files: string[]) {
    for (const file of files) {
      try {
        await fs.unlink(file)
      } catch (error) {
        console.error(`Error deleting file ${file}:`, error)
      }
    }
  }
}

export const videoProcessor = new VideoProcessor()
