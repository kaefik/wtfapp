import { Badge } from '@/components/ui/Badge'
import { Droplets, Flame, HandMetal, Wind, Accessibility, Baby, BabyIcon } from 'lucide-react'
import type { Toilet } from '@/types/toilet'

interface AmenitiesBadgesProps {
  toilet: Toilet
}

const amenities = [
  { key: 'has_water' as const, label: 'Вода', icon: Droplets },
  { key: 'has_hot_water' as const, label: 'Горячая вода', icon: Flame },
  { key: 'has_soap' as const, label: 'Мыло', icon: HandMetal },
  { key: 'has_dryer' as const, label: 'Сушилка', icon: Wind },
  { key: 'is_accessible' as const, label: 'Доступный', icon: Accessibility },
  { key: 'has_child_toilet' as const, label: 'Детский', icon: Baby },
  { key: 'has_changing_table' as const, label: 'Пеленальный', icon: BabyIcon },
]

export function AmenitiesBadges({ toilet }: AmenitiesBadgesProps) {
  const active = amenities.filter((a) => toilet[a.key])
  if (active.length === 0) return null

  return (
    <div>
      <h3 className="mb-1.5 text-sm font-medium text-gray-700">Удобства</h3>
      <div className="flex flex-wrap gap-1.5">
        {active.map((a) => (
          <Badge key={a.key} variant="default" className="gap-1">
            <a.icon size={12} />
            {a.label}
          </Badge>
        ))}
      </div>
    </div>
  )
}
