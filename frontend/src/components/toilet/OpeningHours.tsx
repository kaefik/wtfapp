import { Clock } from 'lucide-react'
import { formatOpeningHours } from '@/utils/openingHours'
import type { OpeningHour } from '@/types/toilet'

interface OpeningHoursProps {
  hours: OpeningHour[]
}

export function OpeningHours({ hours }: OpeningHoursProps) {
  const formatted = formatOpeningHours(hours)

  return (
    <div>
      <h3 className="mb-1 flex items-center gap-1.5 text-sm font-medium text-gray-700">
        <Clock size={14} />
        Часы работы
      </h3>
      <div className="space-y-0.5">
        {formatted.map((line, i) => (
          <p key={i} className="text-sm text-gray-600">{line}</p>
        ))}
      </div>
    </div>
  )
}
