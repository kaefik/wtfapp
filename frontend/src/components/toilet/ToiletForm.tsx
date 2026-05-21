import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { PhotoUploader } from '@/components/common/PhotoUploader'
import { useGeolocation } from '@/hooks/useGeolocation'
import type { Toilet, ToiletCreate } from '@/types/toilet'
import { uploadToiletPhoto } from '@/api/toilets'
import { useState, useEffect } from 'react'

const toiletSchema = z.object({
  name: z.string().min(1, 'Введите название'),
  address: z.string().min(1, 'Введите адрес'),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  floor: z.number().nullable().optional(),
  gender: z.enum(['male', 'female', 'unisex', 'family']),
  toilet_type: z.enum(['indoor', 'outdoor', 'portable']),
  is_free: z.boolean(),
  price: z.number().nullable().optional(),
  currency: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  location_hint: z.string().nullable().optional(),
  has_water: z.boolean().optional(),
  has_hot_water: z.boolean().optional(),
  has_soap: z.boolean().optional(),
  has_dryer: z.boolean().optional(),
  is_accessible: z.boolean().optional(),
  has_child_toilet: z.boolean().optional(),
  has_changing_table: z.boolean().optional(),
  paper_type: z.enum(['unknown', 'none', 'in_cabin', 'dispenser', 'both']).optional(),
})

type FormData = z.infer<typeof toiletSchema>

interface ToiletFormProps {
  initialData?: Toilet
  onSubmit: (data: ToiletCreate) => Promise<void>
  isSubmitting: boolean
}

const amenityLabels: Record<string, string> = {
  has_water: 'Вода', has_hot_water: 'Горячая вода', has_soap: 'Мыло',
  has_dryer: 'Сушилка', is_accessible: 'Доступный', has_child_toilet: 'Детский',
  has_changing_table: 'Пеленальный',
}

const amenityKeys = ['has_water', 'has_hot_water', 'has_soap', 'has_dryer', 'is_accessible', 'has_child_toilet', 'has_changing_table'] as const

const genderOptions = [
  { value: 'male', label: 'Мужской' },
  { value: 'female', label: 'Женский' },
  { value: 'unisex', label: 'Унисекс' },
  { value: 'family', label: 'Семейный' },
]

const typeOptions = [
  { value: 'indoor', label: 'Внутри' },
  { value: 'outdoor', label: 'Снаружи' },
  { value: 'portable', label: 'Портативный' },
]

const paperOptions = [
  { value: 'unknown', label: 'Неизвестно' },
  { value: 'none', label: 'Нет' },
  { value: 'in_cabin', label: 'В кабинке' },
  { value: 'dispenser', label: 'В диспенсере' },
  { value: 'both', label: 'Оба' },
]

export function ToiletForm({ initialData, onSubmit, isSubmitting }: ToiletFormProps) {
  const geo = useGeolocation()
  const [photoUrls, setPhotoUrls] = useState<string[]>(initialData?.photo_urls ?? [])
  const [toiletId] = useState<string | null>(initialData?.id ?? null)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(toiletSchema) as any,
    defaultValues: {
      name: initialData?.name ?? '',
      address: initialData?.address ?? '',
      lat: initialData?.lat ?? geo.position?.[0] ?? 0,
      lon: initialData?.lon ?? geo.position?.[1] ?? 0,
      floor: initialData?.floor ?? null,
      gender: initialData?.gender ?? 'unisex',
      toilet_type: initialData?.toilet_type ?? 'indoor',
      is_free: initialData?.is_free ?? true,
      price: initialData?.price ?? null,
      currency: initialData?.currency ?? null,
      description: initialData?.description ?? null,
      location_hint: initialData?.location_hint ?? null,
      has_water: initialData?.has_water ?? false,
      has_hot_water: initialData?.has_hot_water ?? false,
      has_soap: initialData?.has_soap ?? false,
      has_dryer: initialData?.has_dryer ?? false,
      is_accessible: initialData?.is_accessible ?? false,
      has_child_toilet: initialData?.has_child_toilet ?? false,
      has_changing_table: initialData?.has_changing_table ?? false,
      paper_type: initialData?.paper_type ?? 'unknown',
    },
  })

  const isFree = watch('is_free')

  useEffect(() => {
    if (!initialData && geo.position) {
      setValue('lat', geo.position[0])
      setValue('lon', geo.position[1])
    }
  }, [geo.position, initialData, setValue])

  const handleFormSubmit = async (data: FormData) => {
    await onSubmit(data as ToiletCreate)
  }

  const handlePhotoUpload = async (file: File) => {
    if (!toiletId) return
    const result = await uploadToiletPhoto(toiletId, file)
    setPhotoUrls((prev) => [...prev, result.url])
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 p-4">
      <Input label="Название" {...register('name')} error={errors.name?.message} />
      <Input label="Адрес" {...register('address')} error={errors.address?.message} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Широта" type="number" step="any" {...register('lat')} error={errors.lat?.message} />
        <Input label="Долгота" type="number" step="any" {...register('lon')} error={errors.lon?.message} />
      </div>
      <Select label="Пол" options={genderOptions} {...register('gender')} error={errors.gender?.message} />
      <Select label="Тип" options={typeOptions} {...register('toilet_type')} error={errors.toilet_type?.message} />
      <Controller
        name="is_free"
        control={control}
        render={({ field }) => (
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Бесплатный</label>
            <button
              type="button"
              onClick={() => field.onChange(!field.value)}
              className={`relative h-6 w-11 rounded-full transition-colors ${field.value ? 'bg-primary-600' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${field.value ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        )}
      />
      {!isFree && (
        <div className="grid grid-cols-2 gap-3">
          <Input label="Цена" type="number" step="0.01" {...register('price')} />
          <Input label="Валюта" {...register('currency')} placeholder="RUB" />
        </div>
      )}
      <Input label="Этаж" type="number" {...register('floor')} />
      <Select label="Бумага" options={paperOptions} {...register('paper_type')} />
      <Input label="Как найти внутри здания" {...register('description')} />
      <Input label="Описание входа" {...register('location_hint')} />
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Удобства</label>
        <div className="flex flex-wrap gap-2">
          {amenityKeys.map((key) => (
            <Controller
              key={key}
              name={key}
              control={control}
              render={({ field }) => (
                <button
                  type="button"
                  onClick={() => field.onChange(!field.value)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium ${field.value ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  {amenityLabels[key]}
                </button>
              )}
            />
          ))}
        </div>
      </div>
      {toiletId && (
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Фото</label>
          <PhotoUploader onUpload={handlePhotoUpload} previews={photoUrls} onRemovePreview={(i) => setPhotoUrls((prev) => prev.filter((_, idx) => idx !== i))} />
        </div>
      )}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Сохранение...' : initialData ? 'Сохранить' : 'Добавить туалет'}
      </Button>
    </form>
  )
}
