'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ArrowLeft,
  User,
  MapPin,
  Calendar,
  CheckCircle2,
  Activity,
} from 'lucide-react'

interface SignDetail {
  id: string
  gloss: string
  description: string
  category: string
  videoUrl: string | null
  thumbUrl: string | null
  keypoints: any
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    city: string | null
    state: string | null
    avatarUrl: string | null
    bio: string | null
  }
}

export default function SignDetailPage() {
  const params = useParams()
  const [sign, setSign] = useState<SignDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (params.id) {
      fetchSign(params.id as string)
    }
  }, [params.id])

  const fetchSign = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3333/signs/${id}`)

      if (!response.ok) {
        throw new Error('Sinal não encontrado')
      }

      const data = await response.json()
      setSign(data.sign)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <SignDetailSkeleton />
  }

  if (error || !sign) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Alert variant="destructive">
          <AlertDescription>{error || 'Sinal não encontrado'}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="from-primary-50 to-secondary-50 min-h-screen bg-linear-to-br via-white">
      <div className="container mx-auto px-4 py-12">
        <Link href="/signs">
          <Button variant="ghost" className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardContent className="p-0">
                <div className="aspect-video overflow-hidden rounded-t-lg bg-black">
                  {sign.videoUrl ? (
                    <video
                      src={sign.videoUrl}
                      controls
                      className="h-full w-full"
                      poster={sign.thumbUrl || undefined}
                    />
                  ) : (
                    <div className="text-muted-foreground flex h-full items-center justify-center">
                      Vídeo não disponível
                    </div>
                  )}
                </div>
                <div className="space-y-4 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h1 className="font-heading mb-2 text-3xl font-bold">
                        {sign.gloss}
                      </h1>
                      <Badge>{sign.category}</Badge>
                    </div>
                  </div>

                  <p className="text-muted-foreground leading-relaxed">
                    {sign.description}
                  </p>

                  {sign.keypoints && (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>
                        <strong>✓ Vídeo processado</strong> - Keypoints
                        extraídos com sucesso
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>

            {sign.keypoints && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Análise de Movimento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-muted-foreground mb-2 text-sm">
                      Keypoints detectados: {sign.keypoints.pose?.length || 0}
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium">Pontos corporais</p>
                        <p className="text-muted-foreground">
                          {sign.keypoints.pose?.length || 0} pontos
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">Conexões</p>
                        <p className="text-muted-foreground">
                          {sign.keypoints.connections?.length || 0} conexões
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contribuído por</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src="https://github.com/joserochadev.png" />
                    <AvatarFallback>
                      <User className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">José Rocha</p>
                    {
                      /*{(sign.user.city || sign.user.state) && (
                      <p className="text-muted-foreground flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3" />
                        {sign.user.city}, {sign.user.state}
                      </p>
                    )}*/
                      <p className="text-muted-foreground flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3" />
                        Tianguá, Ceará
                      </p>
                    }
                  </div>
                </div>
                {/*{sign.user.bio && (
                  <p className="text-muted-foreground text-sm">
                    {sign.user.bio}
                  </p>
                )}*/}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="text-muted-foreground h-4 w-4" />
                  <span className="text-muted-foreground">Cadastrado em</span>
                  <span className="font-medium">
                    {new Date(sign.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Compartilhar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full" size="sm">
                  Copiar Link
                </Button>
                <Button variant="outline" className="w-full" size="sm">
                  Compartilhar
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function SignDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 py-12">
      <Skeleton className="mb-6 h-10 w-32" />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <Skeleton className="aspect-video w-full rounded-t-lg" />
            <div className="space-y-4 p-6">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
