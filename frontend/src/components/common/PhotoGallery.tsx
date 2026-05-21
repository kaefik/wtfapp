import { useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

interface PhotoGalleryProps {
  photos: string[]
}

export function PhotoGallery({ photos }: PhotoGalleryProps) {
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null)

  if (photos.length === 0) return null

  const open = (index: number) => setFullscreenIndex(index)
  const close = () => setFullscreenIndex(null)
  const prev = () => setFullscreenIndex((i) => (i !== null ? (i - 1 + photos.length) % photos.length : null))
  const next = () => setFullscreenIndex((i) => (i !== null ? (i + 1) % photos.length : null))

  return (
    <>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {photos.map((url, i) => (
          <button
            key={url}
            type="button"
            onClick={() => open(i)}
            className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg"
          >
            <img src={url} alt={`Фото ${i + 1}`} className="h-full w-full object-cover" />
          </button>
        ))}
      </div>

      {fullscreenIndex !== null && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90" onClick={close}>
          <button onClick={close} className="absolute right-4 top-4 text-white">
            <X size={28} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); prev() }} className="absolute left-4 text-white">
            <ChevronLeft size={36} />
          </button>
          <img
            src={photos[fullscreenIndex]}
            alt=""
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button onClick={(e) => { e.stopPropagation(); next() }} className="absolute right-4 text-white">
            <ChevronRight size={36} />
          </button>
          <div className="absolute bottom-4 text-sm text-white">
            {fullscreenIndex + 1} / {photos.length}
          </div>
        </div>
      )}
    </>
  )
}
