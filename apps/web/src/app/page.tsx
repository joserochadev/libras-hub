import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Video, Users, Globe, Sparkles } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-200">
      {' '}
      {/* Fundo mais neutro para evitar inversão */}
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-4xl space-y-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700">
            <Sparkles className="h-4 w-4" />
            Plataforma aberta e colaborativa
          </div>

          <h1 className="font-heading bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-5xl leading-tight font-bold text-transparent md:text-7xl">
            LibrasHUB
          </h1>

          <p className="mx-auto max-w-2xl text-xl text-gray-700 md:text-2xl">
            {' '}
            {/* Texto mais escuro */}
            Conectando sinais, criando conhecimento. O ponto de encontro da
            Libras e da tecnologia.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/cadastrar">
              <Button
                size="lg"
                className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
              >
                {' '}
                {/* Botão principal com cor */}
                Cadastrar Sinal <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/explorar">
              <Button
                size="lg"
                variant="outline"
                className="gap-2 border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                {' '}
                {/* Botão outline */}
                Explorar Sinais
              </Button>
            </Link>
          </div>
        </div>
      </section>
      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
          <FeatureCard
            icon={<Video className="h-8 w-8 text-blue-500" />}
            title="Cadastre Sinais"
            description="Grave via webcam ou faça upload de vídeos de sinais em Libras"
          />
          <FeatureCard
            icon={<Globe className="h-8 w-8 text-blue-500" />}
            title="Mapeamento Regional"
            description="Explore variações regionais e contribua para o mapa da Libras"
          />
          <FeatureCard
            icon={<Users className="h-8 w-8 text-blue-500" />}
            title="API Aberta"
            description="Acesse dados públicos para pesquisa e desenvolvimento de IA"
          />
        </div>
      </section>
      {/* Stats */}
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-lg">
          <div className="grid gap-8 text-center md:grid-cols-3">
            <StatCard number="0" label="Sinais Cadastrados" />
            <StatCard number="0" label="Contribuidores" />
            <StatCard number="0" label="Regiões Mapeadas" />
          </div>
        </div>
      </section>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-md transition-shadow hover:shadow-lg">
      <div className="mb-4">{icon}</div>{' '}
      {/* A cor do ícone é passada diretamente no ícone */}
      <h3 className="font-heading mb-2 text-xl font-semibold text-gray-800">
        {title}
      </h3>{' '}
      {/* Título mais escuro */}
      <p className="text-gray-600">{description}</p>{' '}
      {/* Descrição mais escura */}
    </div>
  )
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <div className="text-4xl font-bold text-blue-600">{number}</div>{' '}
      {/* Número com cor */}
      <div className="mt-1 text-gray-600">{label}</div>{' '}
      {/* Label mais escuro */}
    </div>
  )
}
