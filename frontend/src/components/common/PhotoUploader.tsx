import { useRef, useState } from 'react'
import { Upload, X } from 'lucide-react'

interface PhotoUploaderProps {
  onUpload: (file: File) => Promise<void>
  maxFiles?: number
  maxSizeMB?: number
  previews?: string[]
  onRemovePreview?: (index: number) => void
  isUploading?: boolean
  uploadProgress?: number
}

export function PhotoUploader({
  onUpload,
  maxFiles = 5,
  maxSizeMB = 5,
  previews = [],
  onRemovePreview,
  isUploading = false,
}: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    for (const file of files) {
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`Файл слишком большой (макс. ${maxSizeMB} МБ)`)
        return
      }
      setError(null)
      await onUpload(file)
    }

    if (inputRef.current) inputRef.current.value = ''
  }

  const canUpload = previews.length < maxFiles

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {previews.map((url, i) => (
          <div key={url} className="relative h-20 w-20 overflow-hidden rounded-lg border border-gray-200">
            <img src={url} alt="" className="h-full w-full object-cover" />
            {onRemovePreview && (
              <button
                type="button"
                onClick={() => onRemovePreview(i)}
                className="absolute right-1 top-1 rounded-full bg-black/50 p-0.5 text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>
        ))}
        {canUpload && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-gray-400 hover:border-primary-400 hover:text-primary-400 disabled:opacity-50"
          >
            {isUploading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-primary-500" />
            ) : (
              <Upload size={24} />
            )}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        multiple
      />
    </div>
  )
}
