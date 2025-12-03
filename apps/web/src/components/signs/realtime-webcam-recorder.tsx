'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Camera, Square, RotateCcw, Play, Check, Loader2 } from 'lucide-react'
import { PoseDetector } from '@/lib/pose-detector-client'
import { Badge } from '@/components/ui/badge'

interface RealtimeWebcamRecorderProps {
  onRecordingComplete: (
    blob: Blob,
    url: string,
    metadata: RecordingMetadata
  ) => void
}

interface RecordingMetadata {
  keypoints: any[]
  averageDepth: number
  poseQuality: number
  hasUpperBody: boolean
  duration: number
}

export function RealtimeWebcamRecorder({
  onRecordingComplete,
}: RealtimeWebcamRecorderProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const detectorRef = useRef<PoseDetector | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const keypointsHistoryRef = useRef<any[]>([])

  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Estado de detecção em tempo real
  const [detectionStatus, setDetectionStatus] = useState({
    hasUpperBody: false,
    poseQuality: 0,
    depth: 0,
    handsVisible: false,
    faceVisible: false,
  })
  const [isDetecting, setIsDetecting] = useState(false)
  const [detectorLoading, setDetectorLoading] = useState(false)

  // Timer para duração da gravação
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRecording) {
      interval = setInterval(() => {
        setDuration((d) => d + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRecording])

  // Inicializar detector
  useEffect(() => {
    const initDetector = async () => {
      if (!detectorRef.current) {
        setDetectorLoading(true)
        try {
          detectorRef.current = new PoseDetector()
          await detectorRef.current.initialize()
          console.log('✓ Detector inicializado')
        } catch (err) {
          console.error('Erro ao inicializar detector:', err)
          setError('Erro ao carregar detector de pose')
        } finally {
          setDetectorLoading(false)
        }
      }
    }
    initDetector()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  // Loop de detecção em tempo real
  const detectPose = useCallback(async () => {
    if (
      !videoRef.current ||
      !canvasRef.current ||
      !detectorRef.current ||
      !isDetecting
    ) {
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    if (!ctx || video.readyState !== 4) {
      animationFrameRef.current = requestAnimationFrame(detectPose)
      return
    }

    // Ajustar canvas ao tamanho do vídeo
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Desenhar frame atual
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    try {
      // Detectar pose
      const result = await detectorRef.current.detectFromVideo(video)

      if (result && result.landmarks) {
        // Desenhar keypoints e conexões
        drawPose(ctx, result.landmarks, canvas.width, canvas.height)

        // Atualizar status de detecção
        const status = analyzePose(result.landmarks)
        setDetectionStatus(status)

        // Salvar keypoints se estiver gravando
        if (isRecording) {
          keypointsHistoryRef.current.push({
            timestamp: Date.now(),
            landmarks: result.landmarks,
            worldLandmarks: result.worldLandmarks,
          })
        }
      }
    } catch (err) {
      console.error('Erro na detecção:', err)
    }

    animationFrameRef.current = requestAnimationFrame(detectPose)
  }, [isDetecting, isRecording])

  // Iniciar loop de detecção quando começar preview
  useEffect(() => {
    if (isDetecting && detectorRef.current) {
      detectPose()
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isDetecting, detectPose])

  // Desenhar pose no canvas
  const drawPose = (
    ctx: CanvasRenderingContext2D,
    landmarks: any[],
    width: number,
    height: number
  ) => {
    // Conexões do corpo
    const connections = [
      [11, 12], // Ombros
      [11, 13],
      [13, 15], // Braço esquerdo
      [12, 14],
      [14, 16], // Braço direito
      [11, 23],
      [12, 24], // Torso
      [23, 24], // Quadril
      [0, 1],
      [1, 2],
      [2, 3], // Rosto esquerdo
      [0, 4],
      [4, 5],
      [5, 6], // Rosto direito
    ]

    // Desenhar conexões
    ctx.strokeStyle = '#3B82F6'
    ctx.lineWidth = 3
    connections.forEach(([start, end]) => {
      const startPoint = landmarks[start]
      const endPoint = landmarks[end]
      if (
        startPoint &&
        endPoint &&
        startPoint.visibility > 0.5 &&
        endPoint.visibility > 0.5
      ) {
        ctx.beginPath()
        ctx.moveTo(startPoint.x * width, startPoint.y * height)
        ctx.lineTo(endPoint.x * width, endPoint.y * height)
        ctx.stroke()
      }
    })

    // Desenhar keypoints
    landmarks.forEach((landmark, idx) => {
      if (landmark.visibility > 0.5) {
        const x = landmark.x * width
        const y = landmark.y * height

        // Cor baseada na importância do ponto
        const isHand = [15, 16, 19, 20, 21, 22].includes(idx)
        const isFace = idx < 11
        const color = isHand ? '#10B981' : isFace ? '#F59E0B' : '#3B82F6'

        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(x, y, 6, 0, 2 * Math.PI)
        ctx.fill()

        // Borda branca
        ctx.strokeStyle = '#FFFFFF'
        ctx.lineWidth = 2
        ctx.stroke()
      }
    })
  }

  // Analisar qualidade da pose
  const analyzePose = (landmarks: any[]) => {
    // Índices importantes
    const upperBodyIndices = [0, 11, 12, 13, 14, 15, 16, 23, 24]
    const handIndices = [15, 16, 19, 20, 21, 22]
    const faceIndices = [0, 1, 2, 3, 4, 5, 6]

    // Verificar visibilidade
    const visibleUpperBody = upperBodyIndices.filter(
      (idx) => landmarks[idx]?.visibility > 0.5
    ).length
    const visibleHands = handIndices.filter(
      (idx) => landmarks[idx]?.visibility > 0.5
    ).length
    const visibleFace = faceIndices.filter(
      (idx) => landmarks[idx]?.visibility > 0.5
    ).length

    const hasUpperBody = visibleUpperBody >= upperBodyIndices.length * 0.5
    const handsVisible = visibleHands >= 2
    const faceVisible = visibleFace >= 3

    // Calcular qualidade geral
    const poseQuality =
      (visibleUpperBody / upperBodyIndices.length) * 0.5 +
      (visibleHands / handIndices.length) * 0.3 +
      (visibleFace / faceIndices.length) * 0.2

    // Estimar profundidade (usando coordenada Z)
    const depths = landmarks
      .filter((l) => l.visibility > 0.5)
      .map((l) => Math.abs(l.z || 0))
    const avgDepth = depths.reduce((a, b) => a + b, 0) / depths.length

    return {
      hasUpperBody,
      poseQuality: Math.round(poseQuality * 100),
      depth: Math.round(avgDepth * 100),
      handsVisible,
      faceVisible,
    }
  }

  const startCamera = useCallback(async () => {
    setError(null)
    setDetectorLoading(true)

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      })

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        // Aguardar vídeo carregar
        await new Promise<void>((resolve) => {
          videoRef.current!.onloadedmetadata = () => resolve()
        })
      }

      setStream(mediaStream)
      setIsPreviewing(true)
      setIsDetecting(true)
    } catch (err) {
      console.error('Camera error:', err)
      setError('Não foi possível acessar a câmera. Verifique as permissões.')
    } finally {
      setDetectorLoading(false)
    }
  }, [])

  const startRecording = useCallback(() => {
    if (!stream) return

    keypointsHistoryRef.current = []
    const chunks: Blob[] = []
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
    })

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data)
      }
    }

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' })
      const url = URL.createObjectURL(blob)

      // Calcular metadados
      const metadata: RecordingMetadata = {
        keypoints: keypointsHistoryRef.current,
        averageDepth: detectionStatus.depth,
        poseQuality: detectionStatus.poseQuality,
        hasUpperBody: detectionStatus.hasUpperBody,
        duration,
      }

      setRecordedBlob(blob)
      setRecordedUrl(url)

      // Parar câmera e detecção
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
      setIsPreviewing(false)
      setIsDetecting(false)

      onRecordingComplete(blob, url, metadata)
    }

    mediaRecorder.start()
    mediaRecorderRef.current = mediaRecorder
    setIsRecording(true)
    setDuration(0)
  }, [stream, duration, detectionStatus, onRecordingComplete])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }, [isRecording])

  const startRecordingWithCountdown = useCallback(() => {
    setCountdown(3)
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(countdownInterval)
          // Pequeno delay antes de iniciar gravação
          setTimeout(() => {
            startRecording()
          }, 100)
          return null
        }
        return prev! - 1
      })
    }, 1000)
  }, [startRecording])

  const resetRecording = useCallback(() => {
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl)
    }
    setRecordedBlob(null)
    setRecordedUrl(null)
    setDuration(0)
    keypointsHistoryRef.current = []
    startCamera()
  }, [recordedUrl, startCamera])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Status visual
  const getStatusColor = () => {
    if (detectionStatus.poseQuality > 80) return 'text-green-600'
    if (detectionStatus.poseQuality > 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-4">
      {/* Video Display com Canvas Overlay */}
      <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-900">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* Countdown Overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70">
            <div className="animate-pulse text-8xl font-bold text-white">
              {countdown}
            </div>
          </div>
        )}

        {/* Recording Indicator */}
        {isRecording && (
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-full bg-red-600 px-3 py-1.5 text-white">
            <div className="h-3 w-3 animate-pulse rounded-full bg-white" />
            <span className="font-medium">{formatDuration(duration)}</span>
          </div>
        )}

        {/* Real-time Status */}
        {isPreviewing && !isRecording && (
          <div className="absolute top-4 right-4 z-10 space-y-2">
            <Badge
              variant={detectionStatus.hasUpperBody ? 'default' : 'destructive'}
              className="bg-black/70 text-white"
            >
              {detectionStatus.hasUpperBody ? '✓' : '✗'} Corpo Visível
            </Badge>
            <Badge
              variant={detectionStatus.handsVisible ? 'default' : 'destructive'}
              className="bg-black/70 text-white"
            >
              {detectionStatus.handsVisible ? '✓' : '✗'} Mãos Visíveis
            </Badge>
            <Badge
              variant={detectionStatus.faceVisible ? 'default' : 'destructive'}
              className="bg-black/70 text-white"
            >
              {detectionStatus.faceVisible ? '✓' : '✗'} Rosto Visível
            </Badge>
          </div>
        )}

        {/* Loading Detector */}
        {detectorLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70">
            <div className="flex flex-col items-center gap-3 text-white">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p>Carregando detector de pose...</p>
            </div>
          </div>
        )}
      </div>

      {/* Quality Meter */}
      {isPreviewing && !isRecording && !detectorLoading && (
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Qualidade da Pose</span>
                <span className={`text-sm font-bold ${getStatusColor()}`}>
                  {detectionStatus.poseQuality}%
                </span>
              </div>
              <Progress value={detectionStatus.poseQuality} className="h-2" />
              <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                <div>Profundidade: {detectionStatus.depth}</div>
                <div>Keypoints: {isDetecting ? 'Detectando...' : 'Parado'}</div>
                <div>FPS: ~30</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Controls */}
      <div className="flex flex-wrap justify-center gap-2">
        {!isPreviewing && !recordedBlob && (
          <Button
            onClick={startCamera}
            size="lg"
            className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
            disabled={detectorLoading}
          >
            {detectorLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Inicializando...
              </>
            ) : (
              <>
                <Camera className="h-4 w-4" />
                Iniciar Câmera
              </>
            )}
          </Button>
        )}

        {isPreviewing && !isRecording && (
          <Button
            onClick={startRecordingWithCountdown}
            size="lg"
            className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
            // disabled={
            //   !detectionStatus.hasUpperBody || detectionStatus.poseQuality < 50
            // }
          >
            <Play className="h-4 w-4" />
            Gravar
          </Button>
        )}

        {isRecording && (
          <Button
            onClick={stopRecording}
            variant="destructive"
            size="lg"
            className="gap-2"
          >
            <Square className="h-4 w-4" />
            Parar Gravação
          </Button>
        )}

        {recordedBlob && (
          <>
            <Button
              onClick={resetRecording}
              variant="outline"
              size="lg"
              className="gap-2 border-blue-500 text-blue-600 hover:bg-blue-50"
            >
              <RotateCcw className="h-4 w-4" />
              Gravar Novamente
            </Button>
            <Button
              onClick={() => {
                /* Handled by parent */
              }}
              size="lg"
              className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
            >
              <Check className="h-4 w-4" />
              Confirmar Gravação
            </Button>
          </>
        )}
      </div>

      {/* Instructions */}
      {!recordedBlob && (
        <Alert className="border-blue-200 bg-blue-50 text-blue-800">
          <AlertDescription>
            <ul className="list-inside list-disc space-y-1 text-sm">
              <li>
                Posicione-se da <strong>cintura para cima</strong>
              </li>
              <li>
                Mantenha <strong>mãos e rosto visíveis</strong>
              </li>
              <li>
                Aguarde qualidade acima de <strong>50%</strong> para gravar
              </li>
              <li>
                Os keypoints azuis/verdes mostram a detecção em tempo real
              </li>
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Metadata Preview */}
      {recordedBlob && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <AlertDescription>
            <div className="space-y-1 text-sm">
              <p>
                <strong>✓ Gravação concluída!</strong>
              </p>
              <p>• {keypointsHistoryRef.current.length} frames com keypoints</p>
              <p>• Qualidade média: {detectionStatus.poseQuality}%</p>
              <p>• Duração: {formatDuration(duration)}</p>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
