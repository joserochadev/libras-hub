// apps/api/src/lib/video-processor.ts
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
   * Obtém informações do vídeo
   */
  async getVideoInfo(videoPath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          console.error('❌ Erro ao obter info do vídeo:', err)
          reject(err)
        } else {
          console.log('📊 Info do vídeo:', {
            duration: metadata.format.duration,
            size: metadata.format.size,
            bitRate: metadata.format.bit_rate,
            streams: metadata.streams.length,
          })
          resolve(metadata)
        }
      })
    })
  }

  /**
   * Obtém duração do vídeo
   */
  async getVideoDuration(videoPath: string): Promise<number> {
    const metadata = await this.getVideoInfo(videoPath)
    return metadata.format.duration || 0
  }

  /**
   * Cria thumbnail do vídeo
   */
  async createThumbnail(
    videoPath: string,
    outputPath: string
  ): Promise<string> {
    console.log('📷 Criando thumbnail...')
    console.log('   Input:', videoPath)
    console.log('   Output:', outputPath)

    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .on('start', (cmd) => {
          console.log('   Comando FFmpeg:', cmd)
        })
        .on('end', () => {
          console.log('✓ Thumbnail criado com sucesso')
          resolve(outputPath)
        })
        .on('error', (err) => {
          console.error('❌ Erro ao criar thumbnail:', err.message)
          reject(err)
        })
        .screenshots({
          timestamps: ['50%'],
          filename: path.basename(outputPath),
          folder: path.dirname(outputPath),
          size: '640x480',
        })
    })
  }

  /**
   * Normaliza o vídeo - VERSÃO ULTRA SIMPLIFICADA
   * Apenas re-encoda com configurações básicas
   */
  async normalizeVideo(videoPath: string, outputPath: string): Promise<string> {
    console.log('🎬 Normalizando vídeo...')
    console.log('   Input:', videoPath)
    console.log('   Output:', outputPath)

    // Verifica se o arquivo de entrada existe
    try {
      await fs.access(videoPath)
    } catch (err) {
      throw new Error(`Arquivo de entrada não encontrado: ${videoPath}`)
    }

    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .on('start', (cmd) => {
          console.log('   Comando FFmpeg:', cmd)
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            console.log(`   Progresso: ${progress.percent.toFixed(1)}%`)
          }
        })
        .on('end', () => {
          console.log('✓ Vídeo normalizado com sucesso')
          resolve(outputPath)
        })
        .on('error', (err, stdout, stderr) => {
          console.error('❌ Erro ao normalizar:', err.message)
          console.error('   Stdout:', stdout)
          console.error('   Stderr:', stderr)
          reject(err)
        })
        .videoCodec('libx264')
        .audioCodec('aac')
        .format('mp4')
        .outputOptions([
          '-movflags',
          '+faststart',
          '-preset',
          'fast',
          '-crf',
          '23',
        ])
        .output(outputPath)
        .run()
    })
  }

  /**
   * Aplica fundo neutro - APENAS COPIA O VÍDEO
   */
  async applyNeutralBackground(
    videoPath: string,
    outputPath: string
  ): Promise<string> {
    console.log('🎨 Aplicando fundo (cópia simples)...')

    // Simplesmente copia o arquivo
    await fs.copyFile(videoPath, outputPath)
    console.log('✓ Arquivo copiado')

    return outputPath
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

    console.log('📸 Extraindo frames...')

    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .on('start', (cmd) => {
          console.log('   Comando FFmpeg:', cmd)
        })
        .on('end', async () => {
          const files = await fs.readdir(this.tempDir)
          const frames = files
            .filter((f) => f.startsWith('frame-'))
            .sort()
            .slice(0, numFrames)
            .map((f) => path.join(this.tempDir, f))

          console.log(`✓ Extraídos ${frames.length} frames`)
          resolve(frames)
        })
        .on('error', (err) => {
          console.error('❌ Erro ao extrair frames:', err)
          reject(err)
        })
        .fps(1)
        .size('640x480')
        .format('image2')
        .output(outputPattern)
        .run()
    })
  }

  /**
   * Limpa arquivos temporários
   */
  async cleanup(files: string[]) {
    console.log(`🧹 Limpando ${files.length} arquivos temporários...`)

    for (const file of files) {
      try {
        await fs.unlink(file)
        console.log(`   ✓ Removido: ${path.basename(file)}`)
      } catch (error) {
        console.error(`   ✗ Erro ao remover ${path.basename(file)}:`, error)
      }
    }
  }
}

export const videoProcessor = new VideoProcessor()
