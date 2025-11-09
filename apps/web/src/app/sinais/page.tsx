'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SignCard } from '@/components/signs/sign-card'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Search } from 'lucide-react'

interface Sign {
  id: string
  gloss: string
  description: string
  category: string
  videoUrl: string | null
  thumbUrl: string | null
  createdAt: string
  user: {
    id: string
    name: string
    city: string | null
    state: string | null
    avatarUrl: string | null
  }
}

export default function SignsPage() {
  const [signs, setSigns] = useState<Sign[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchSigns()
  }, [page, category])

  const fetchSigns = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        ...(category && { category }),
        ...(search && { search }),
      })

      const response = await fetch(`http://localhost:3333/signs?${params}`)
      const data = await response.json()

      setSigns(data.signs)
      setTotalPages(data.pagination.totalPages)
    } catch (error) {
      console.error('Error fetching signs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    fetchSigns()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-heading mb-2 text-4xl font-bold text-gray-900">
              Explorar Sinais
            </h1>
            <p className="text-gray-600">
              Descubra e aprenda novos sinais em Libras
            </p>
          </div>
          <Link href="/sinais/novo-sinal">
            <Button
              size="lg"
              className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Cadastrar Sinal
            </Button>
          </Link>
        </div>

        <div className="mb-8 rounded-lg bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Buscar por glossa ou descrição..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button
                  onClick={handleSearch}
                  className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
                >
                  <Search className="h-4 w-4" />
                  Buscar
                </Button>
              </div>
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
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
          </div>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <SignCardSkeleton key={i} />
            ))}
          </div>
        ) : signs.length > 0 ? (
          <>
            <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {signs.map((sign) => (
                <SignCard key={sign.id} sign={sign} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <div className="flex items-center gap-2">
                  {[...Array(totalPages)].map((_, i) => (
                    <Button
                      key={i}
                      variant={page === i + 1 ? 'default' : 'outline'}
                      className={
                        page === i + 1
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : ''
                      }
                      onClick={() => setPage(i + 1)}
                    >
                      {i + 1}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Próxima
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="py-12 text-center">
            <p className="text-lg text-gray-600">Nenhum sinal encontrado</p>
          </div>
        )}
      </div>
    </div>
  )
}

function SignCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg bg-white shadow-md">
      <Skeleton className="aspect-video w-full" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  )
}
