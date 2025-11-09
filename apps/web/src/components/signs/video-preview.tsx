'use client'

interface VideoPreviewProps {
  url: string
}

export function VideoPreview({ url }: VideoPreviewProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">Prévia do vídeo:</p>
      <div className="aspect-video overflow-hidden rounded-lg bg-gray-200">
        <video src={url} controls className="h-full w-full object-cover" />
      </div>
    </div>
  )
}
