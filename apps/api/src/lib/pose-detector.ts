import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision'
import sharp from 'sharp'

export interface PoseDetectionResult {
  isValidPose: boolean
  hasUpperBody: boolean
  confidence: number
  landmarks: Array<{ x: number; y: number; z: number; visibility: number }>
  keypoints: any
}

export class PoseDetector {
  private poseLandmarker: PoseLandmarker | null = null

  async initialize() {
    if (this.poseLandmarker) return

    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    )

    this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          // 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task',

        delegate: 'CPU',
      },
      runningMode: 'IMAGE',
      numPoses: 1,
    })
  }

  /**
   * Detecta pose em uma imagem
   */
  async detectPose(imagePath: string): Promise<PoseDetectionResult> {
    if (!this.poseLandmarker) {
      await this.initialize()
    }

    // Carrega e prepara a imagem
    const imageBuffer = await sharp(imagePath)
      // .resize(640, 480, { fit: 'cover' })
      .raw()
      .toBuffer({ resolveWithObject: true })

    const imageData = {
      data: imageBuffer.data,
      width: imageBuffer.info.width,
      height: imageBuffer.info.height,
    }

    // Detecta pose
    const result = this.poseLandmarker!.detect(imageData as any)

    if (!result.landmarks || result.landmarks.length === 0) {
      return {
        isValidPose: false,
        hasUpperBody: false,
        confidence: 0,
        landmarks: [],
        keypoints: null,
      }
    }

    const landmarks = result.landmarks[0]

    // Verifica se tem torso visível (cintura pra cima)
    const hasUpperBody = this.checkUpperBodyVisibility(landmarks)

    // Calcula confiança média
    const confidence =
      landmarks.reduce((sum, lm) => sum + (lm.visibility || 0), 0) /
      landmarks.length

    return {
      isValidPose: hasUpperBody && confidence > 0.5,
      hasUpperBody,
      confidence,
      landmarks: landmarks.map((lm) => ({
        x: lm.x,
        y: lm.y,
        z: lm.z,
        visibility: lm.visibility || 0,
      })),
      keypoints: this.extractKeypoints(landmarks),
    }
  }

  /**
   * Verifica se a pessoa está visível da cintura pra cima
   */
  private checkUpperBodyVisibility(landmarks: any[]): boolean {
    // Índices dos landmarks importantes do torso superior
    const upperBodyIndices = [
      11,
      12, // Ombros
      13,
      14, // Cotovelos
      15,
      16, // Punhos
      0, // Nariz
      23,
      24, // Quadril
    ]

    const visibleCount = upperBodyIndices.filter((idx) => {
      const lm = landmarks[idx]
      return lm && lm.x > 0 && lm.x < 1 && lm.y > 0 && lm.y < 1
    }).length

    // Precisa ter pelo menos 50% dos pontos do torso visíveis
    return visibleCount >= upperBodyIndices.length * 0.35
  }

  /**
   * Extrai keypoints estruturados para uso em ML
   */
  private extractKeypoints(landmarks: any[]) {
    return {
      pose: landmarks.map((lm, idx) => ({
        id: idx,
        x: lm.x,
        y: lm.y,
        z: lm.z,
        visibility: lm.visibility || 0,
      })),
      connections: this.getPoseConnections(),
    }
  }

  /**
   * Define as conexões entre os pontos do corpo
   */
  private getPoseConnections() {
    return [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 7], // Face
      [0, 4],
      [4, 5],
      [5, 6],
      [6, 8], // Face
      [9, 10], // Mouth
      [11, 12], // Shoulders
      [11, 13],
      [13, 15], // Left arm
      [12, 14],
      [14, 16], // Right arm
      [11, 23],
      [12, 24], // Torso
      [23, 24], // Hips
      [23, 25],
      [25, 27], // Left leg
      [24, 26],
      [26, 28], // Right leg
    ]
  }

  /**
   * Analisa múltiplos frames para garantir consistência
   */
  async analyzeVideoFrames(framePaths: string[]): Promise<{
    isValid: boolean
    averageConfidence: number
    framesAnalyzed: number
    validFrames: number
  }> {
    let totalConfidence = 0
    let validFrames = 0

    for (const framePath of framePaths) {
      try {
        const result = await this.detectPose(framePath)
        totalConfidence += result.confidence
        if (result.isValidPose) {
          validFrames++
        }
      } catch (error) {
        console.error('Error analyzing frame:', error)
      }
    }

    const framesAnalyzed = framePaths.length
    const averageConfidence = totalConfidence / framesAnalyzed
    const validRatio = validFrames / framesAnalyzed

    return {
      isValid: validRatio >= 0.5, // Pelo menos 50% dos frames devem ser válidos
      averageConfidence,
      framesAnalyzed,
      validFrames,
    }
  }
}

export const poseDetector = new PoseDetector()
