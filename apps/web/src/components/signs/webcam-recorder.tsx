'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Camera, Square, RotateCcw, Play, Check } from 'lucide-react'

interface WebcamRecorderProps {
  onRecordingComplete: (blob: Blob, url: string) => void
}

export function WebcamRecorder({ onRecordingComplete }: WebcamRecorderProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRecording) {
      interval = setInterval(() => {
        setDuration((d) => d + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRecording])

  const startCamera = useCallback(async () => {
    setError(null)
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
      }

      setStream(mediaStream)
      setIsPreviewing(true)
    } catch (err) {
      console.error('Camera error:', err)
      setError(
        'Não foi possível acessar a câmera. Verifique as permissões do navegador.'
      )
    }
  }, [])

  const startRecordingWithCountdown = useCallback(() => {
    setCountdown(3)
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(countdownInterval)
          startRecording()
          return null
        }
        return prev! - 1
      })
    }, 1000)
  }, [])

  const startRecording = useCallback(() => {
    if (!stream) return

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
      setRecordedBlob(blob)
      setRecordedUrl(url)

      // Para o stream da câmera
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
      setIsPreviewing(false)
    }

    mediaRecorder.start()
    mediaRecorderRef.current = mediaRecorder
    setIsRecording(true)
    setDuration(0)
  }, [stream])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }, [isRecording])

  const resetRecording = useCallback(() => {
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl)
    }
    setRecordedBlob(null)
    setRecordedUrl(null)
    setDuration(0)
    startCamera()
  }, [recordedUrl, startCamera])

  const confirmRecording = useCallback(() => {
    if (recordedBlob && recordedUrl) {
      onRecordingComplete(recordedBlob, recordedUrl)
    }
  }, [recordedBlob, recordedUrl, onRecordingComplete])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-200">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="h-full w-full object-cover"
        />

        {countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <div className="animate-pulse text-8xl font-bold text-white">
              {countdown}
            </div>
          </div>
        )}

        {isRecording && (
          <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-red-600 px-3 py-1.5 text-white">
            <div className="h-3 w-3 animate-pulse rounded-full bg-white" />
            <span className="font-medium">{formatDuration(duration)}</span>
          </div>
        )}

        {isPreviewing && !isRecording && (
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 m-8 rounded-lg border-4 border-dashed border-blue-300" />
            <div className="absolute right-0 bottom-4 left-0 text-center">
              <p className="inline-block rounded-full bg-black/50 px-4 py-2 text-sm text-white">
                Posicione-se da cintura para cima
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap justify-center gap-2">
        {!isPreviewing && !recordedBlob && (
          <Button
            onClick={startCamera}
            size="lg"
            className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
          >
            <Camera className="h-4 w-4" />
            Iniciar Câmera
          </Button>
        )}

        {isPreviewing && !isRecording && (
          <Button
            onClick={startRecordingWithCountdown}
            size="lg"
            className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
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
              className="gap-2 border-blue-500 text-blue-600 hover:bg-blue-50" // Botão outline azul
            >
              <RotateCcw className="h-4 w-4" />
              Gravar Novamente
            </Button>
            <Button
              onClick={confirmRecording}
              size="lg"
              className="gap-2 bg-blue-600 text-white hover:bg-blue-700" // Botão azul
            >
              <Check className="h-4 w-4" />
              Confirmar Gravação
            </Button>
          </>
        )}
      </div>

      {!recordedBlob && (
        <Alert className="border-blue-200 bg-blue-50 text-blue-800">
          <AlertDescription>
            <ul className="list-inside list-disc space-y-1 text-sm">
              <li>Certifique-se de estar em um local bem iluminado</li>
              <li>Posicione-se da cintura para cima no enquadramento</li>
              <li>Mantenha as mãos visíveis durante todo o sinal</li>
              <li>Evite roupas que se misturem com o fundo</li>
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
