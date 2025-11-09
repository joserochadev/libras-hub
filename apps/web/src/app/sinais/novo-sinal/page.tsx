'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert' // Adicionei AlertTitle para erros
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WebcamRecorder } from '@/components/signs/webcam-recorder'
import { VideoUpload } from '@/components/signs/video-upload'
import { VideoPreview } from '@/components/signs/video-preview'
import { Upload, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'

const signSchema = z.object({
  gloss: z.string().min(1, 'Glossa é obrigatória'),
  description: z
    .string()
    .min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  category: z.string().min(1, 'Selecione uma categoria'),
})

type SignFormData = z.infer<typeof signSchema>

export default function NewSignPage() {
  const router = useRouter()
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{
    stage: string
    percentage: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [poseValidation, setPoseValidation] = useState<{
    isValid: boolean
    message: string
  } | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SignFormData>({
    resolver: zodResolver(signSchema),
  })

  const handleVideoSelect = (blob: Blob, url: string) => {
    setVideoBlob(blob)
    setVideoUrl(url)
    setError(null)
    setPoseValidation(null)
  }

  const onSubmit = async (data: SignFormData) => {
    if (!videoBlob) {
      setError('Por favor, grave ou faça upload de um vídeo')
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('video', videoBlob, 'sign.webm')
      formData.append('gloss', data.gloss)
      formData.append('description', data.description)
      formData.append('category', data.category)

      setUploadProgress({ stage: 'Enviando vídeo...', percentage: 10 })

      const token = localStorage.getItem('@LibrasHUB:token')

      const response = await fetch('http://localhost:3333/signs', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erro ao cadastrar sinal')
      }

      setUploadProgress({ stage: 'Processando vídeo...', percentage: 50 })

      const result = await response.json()

      setUploadProgress({ stage: 'Analisando pose...', percentage: 75 })

      setPoseValidation({
        isValid: result.sign.poseAnalysis.isValid,
        message: result.sign.poseAnalysis.isValid
          ? `✓ Vídeo válido! Confiança: ${(result.sign.poseAnalysis.confidence * 100).toFixed(1)}%`
          : '⚠ Pose não detectada adequadamente',
      })

      setUploadProgress({ stage: 'Finalizando...', percentage: 100 })

      setTimeout(() => {
        router.push(`/signs/${result.sign.id}`)
      }, 1500)
    } catch (err: any) {
      console.error('Upload error:', err)
      setError(err.message || 'Erro ao cadastrar sinal')
      setUploadProgress(null)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8">
          <h1 className="font-heading mb-2 text-4xl font-bold text-gray-900">
            Cadastrar Novo Sinal
          </h1>
          <p className="text-gray-600">
            Contribua com a comunidade adicionando um novo sinal em Libras
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-gray-800">1. Vídeo do Sinal</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="webcam" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gray-100 text-gray-700">
                  <TabsTrigger value="webcam">Gravar via Webcam</TabsTrigger>
                  <TabsTrigger value="upload">Fazer Upload</TabsTrigger>
                </TabsList>

                <TabsContent value="webcam" className="space-y-4 pt-4">
                  <Alert className="border-blue-200 bg-blue-50 text-blue-800">
                    <AlertDescription className="text-blue-800">
                      <strong>Dica:</strong> Certifique-se de estar visível da
                      cintura para cima e com boa iluminação.
                    </AlertDescription>
                  </Alert>
                  <WebcamRecorder onRecordingComplete={handleVideoSelect} />
                </TabsContent>

                <TabsContent value="upload" className="space-y-4 pt-4">
                  <Alert className="border-blue-200 bg-blue-50 text-blue-800">
                    <AlertDescription className="text-blue-800">
                      <strong>Formatos aceitos:</strong> MP4, WebM, MOV (máx.
                      100MB)
                    </AlertDescription>
                  </Alert>
                  <VideoUpload onFileSelect={handleVideoSelect} />
                </TabsContent>
              </Tabs>

              {videoUrl && (
                <div className="mt-6">
                  <VideoPreview url={videoUrl} />
                </div>
              )}

              {poseValidation && (
                <Alert
                  className="mt-4"
                  variant={poseValidation.isValid ? 'default' : 'destructive'}
                >
                  {poseValidation.isValid ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  <AlertDescription
                    className={
                      poseValidation.isValid ? 'text-green-800' : 'text-red-800'
                    }
                  >
                    {poseValidation.message}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-gray-800">
                2. Informações do Sinal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gloss" className="text-gray-700">
                  Glossa *
                </Label>
                <Input
                  id="gloss"
                  placeholder="Ex: CASA, ESCOLA, BOM-DIA"
                  {...register('gloss')}
                  className="focus-visible:ring-blue-500"
                />
                {errors.gloss && (
                  <p className="text-destructive text-sm">
                    {errors.gloss.message}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  A glossa é a representação escrita do sinal em letras
                  maiúsculas
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-700">
                  Descrição *
                </Label>
                <Textarea
                  id="description"
                  placeholder="Descreva o significado e contexto de uso do sinal"
                  rows={4}
                  {...register('description')}
                  className="focus-visible:ring-blue-500"
                />
                {errors.description && (
                  <p className="text-destructive text-sm">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-gray-700">
                  Categoria *
                </Label>
                <Select onValueChange={(value) => setValue('category', value)}>
                  <SelectTrigger className="focus:ring-blue-500">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="greeting">Saudação</SelectItem>
                    <SelectItem value="verb">Verbo</SelectItem>
                    <SelectItem value="noun">Substantivo</SelectItem>
                    <SelectItem value="adjective">Adjetivo</SelectItem>
                    <SelectItem value="number">Número</SelectItem>
                    <SelectItem value="alphabet">Alfabeto</SelectItem>
                    <SelectItem value="family">Família</SelectItem>
                    <SelectItem value="food">Comida</SelectItem>
                    <SelectItem value="color">Cor</SelectItem>
                    <SelectItem value="other">Outros</SelectItem>
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-destructive text-sm">
                    {errors.category.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erro ao enviar</AlertTitle>
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Progress */}
          {uploadProgress && (
            <Card className="bg-white">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">
                      {uploadProgress.stage}
                    </span>
                    <span className="text-gray-500">
                      {uploadProgress.percentage}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-blue-100">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${uploadProgress.percentage}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full bg-blue-600 text-white hover:bg-blue-700" // Botão azul
            disabled={isUploading || !videoBlob}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Cadastrar Sinal
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
