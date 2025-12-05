import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PlayCircle, User } from 'lucide-react'

interface SignCardProps {
  sign: {
    id: string
    gloss: string
    description: string
    category: string
    thumbUrl: string | null
    createdAt: string
    user: {
      name: string
      city: string | null
      state: string | null
      avatarUrl: string | null
    }
  }
}

const categoryLabels: Record<string, string> = {
  greeting: 'Saudação',
  verb: 'Verbo',
  noun: 'Substantivo',
  adjective: 'Adjetivo',
  number: 'Número',
  alphabet: 'Alfabeto',
  family: 'Família',
  food: 'Comida',
  color: 'Cor',
  other: 'Outros',
}

export function SignCard({ sign }: SignCardProps) {
  return (
    <Link href={`/sinais/${sign.id}`}>
      <Card className="overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg">
        <div className="bg-muted relative aspect-video">
          {sign.thumbUrl ? (
            <Image
              src={sign.thumbUrl}
              alt={sign.gloss}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <PlayCircle className="text-muted-foreground h-16 w-16" />
            </div>
          )}
          <Badge className="absolute top-2 right-2">
            {categoryLabels[sign.category] || sign.category}
          </Badge>
        </div>

        <CardContent className="p-4">
          <h3 className="font-heading mb-2 text-xl font-semibold">
            {sign.gloss}
          </h3>
          <p className="text-muted-foreground line-clamp-2 text-sm">
            {sign.description}
          </p>
        </CardContent>

        <CardFooter className="bg-muted/30 border-t px-4 py-3">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src="https://github.com/joserochadev.png" />
              <AvatarFallback>
                <User className="h-3 w-3" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">José Rocha</p>
              {
                /*{(sign.user.city || sign.user.state) && (
                <p className="text-muted-foreground truncate text-xs">
                  {sign.user.city}, {sign.user.state}
                </p>
              )}*/

                <p className="text-muted-foreground truncate text-xs">
                  Tianguá, Ceará
                </p>
              }
            </div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
