import {
  PoseLandmarker,
  FilesetResolver,
  DrawingUtils,
} from '@mediapipe/tasks-vision'

export class PoseDetector {
  private poseLandmarker: PoseLandmarker | null = null
  private initialized: boolean = false

  async initialize() {
    if (this.initialized) return

    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      )

      this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      })

      this.initialized = true
      console.log('✓ PoseDetector initialized')
    } catch (error) {
      console.error('Error initializing PoseDetector:', error)
      throw error
    }
  }

  async detectFromVideo(video: HTMLVideoElement) {
    if (!this.poseLandmarker || !this.initialized) {
      throw new Error('PoseDetector not initialized')
    }

    try {
      const startTimeMs = performance.now()
      const result = this.poseLandmarker.detectForVideo(video, startTimeMs)

      if (result.landmarks && result.landmarks.length > 0) {
        return {
          landmarks: result.landmarks[0],
          worldLandmarks: result.worldLandmarks?.[0] || [],
        }
      }

      return null
    } catch (error) {
      console.error('Detection error:', error)
      return null
    }
  }

  close() {
    if (this.poseLandmarker) {
      this.poseLandmarker.close()
      this.initialized = false
    }
  }
}
