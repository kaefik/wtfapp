import { useRef } from 'react'
import { Camera } from 'lucide-react'

interface AvatarUploaderProps {
  currentAvatarUrl: string | null
  onUpload: (file: File) => Promise<void>
  isUploading?: boolean
}

export function AvatarUploader({ currentAvatarUrl, onUpload, isUploading = false }: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) return
    await onUpload(file)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="relative">
      <div className="h-24 w-24 overflow-hidden rounded-full bg-gray-200">
        {currentAvatarUrl ? (
          <img src={currentAvatarUrl} alt="Аватар" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-400">
            <Camera size={32} />
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="absolute -bottom-1 -right-1 rounded-full bg-primary-600 p-1.5 text-white shadow-md hover:bg-primary-700 disabled:opacity-50"
      >
        <Camera size={14} />
      </button>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} className="hidden" />
    </div>
  )
}
