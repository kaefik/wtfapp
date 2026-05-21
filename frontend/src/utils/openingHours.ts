import type { OpeningHour } from '@/types/toilet'

export function isOpenNow(hours: OpeningHour[]): boolean {
  if (!hours || hours.length === 0) return true
  const now = new Date()
  const day = now.getDay() === 0 ? 7 : now.getDay()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  const todayHours = hours.find((h) => h.day === day)
  if (!todayHours || !todayHours.open || !todayHours.close) return false

  const [openH, openM] = todayHours.open.split(':').map(Number)
  const [closeH, closeM] = todayHours.close.split(':').map(Number)
  const openMinutes = openH * 60 + openM
  const closeMinutes = closeH * 60 + closeM

  return currentMinutes >= openMinutes && currentMinutes <= closeMinutes
}

const DAY_NAMES: Record<number, string> = {
  1: 'Пн', 2: 'Вт', 3: 'Ср', 4: 'Чт', 5: 'Пт', 6: 'Сб', 7: 'Вс',
}

export function formatOpeningHours(hours: OpeningHour[]): string[] {
  if (!hours || hours.length === 0) return ['Круглосуточно']
  return hours
    .sort((a, b) => a.day - b.day)
    .map((h) => {
      const dayName = DAY_NAMES[h.day] || ''
      if (!h.open || !h.close) return `${dayName}: выходной`
      return `${dayName}: ${h.open}–${h.close}`
    })
}
