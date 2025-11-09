'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, X, FileVideo } from 'lucide-react'

interface VideoUploadProps {
  onFileSelect: (blob: Blob, url: string) => void
}

export function VideoUpload({ onFileSelect }: VideoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const validateFile = (file: File): boolean => {
    const maxSize = 100 * 1024 * 1024 // 100MB
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime']

    if (!allowedTypes.includes(file.type)) {
      setError('Formato não suportado. Use MP4, WebM ou MOV.')
      return false
    }

    if (file.size > maxSize) {
      setError('Arquivo muito grande. Tamanho máximo: 100MB.')
      return false
    }

    setError(null)
    return true
  }

  const handleFile = (file: File) => {
    if (!validateFile(file)) return

    setSelectedFile(file)
    const url = URL.createObjectURL(file)
    onFileSelect(file, url)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleButtonClick = () => {
    inputRef.current?.click()
  }

  const clearFile = () => {
    setSelectedFile(null)
    setError(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <div
        className={`relative cursor-pointer rounded-lg border-2 border-dashed p-8 transition-colors ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        } ${selectedFile ? 'bg-gray-100' : 'hover:border-blue-500 hover:bg-blue-50'} `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          onChange={handleChange}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-4 text-center">
          {selectedFile ? (
            <>
              <FileVideo className="h-12 w-12 text-blue-600" />
              <div>
                <p className="font-medium text-gray-800">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  clearFile()
                }}
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                <X className="mr-2 h-4 w-4" />
                Remover
              </Button>
            </>
          ) : (
            <>
              <Upload className="h-12 w-12 text-gray-400" />
              <div>
                <p className="font-medium text-gray-700">
                  Arraste um vídeo aqui ou clique para selecionar
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  MP4, WebM ou MOV (máx. 100MB)
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
