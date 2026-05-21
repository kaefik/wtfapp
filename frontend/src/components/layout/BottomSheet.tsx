import { Drawer } from 'vaul'
import { useNearbyStore } from '@/stores/nearbyStore'
import { ToiletListContent } from '@/components/toilet/ToiletListContent'

export function BottomSheet() {
  const toilets = useNearbyStore((s) => s.toilets)

  return (
    <Drawer.Root>
      <Drawer.Trigger asChild>
        <div className="fixed inset-x-0 bottom-14 z-30 flex justify-center">
          <button className="rounded-t-xl bg-white px-6 py-2 shadow-lg">
            <div className="mx-auto mb-1 h-1 w-8 rounded-full bg-gray-300" />
            <span className="text-sm font-medium text-gray-700">
              Рядом: {toilets.length} туалет{toilets.length === 1 ? '' : toilets.length < 5 && toilets.length > 1 ? 'а' : 'ов'}
            </span>
          </button>
        </div>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/30" />
        <Drawer.Content
          className="fixed inset-x-0 bottom-0 z-50 mx-auto mt-24 flex h-[70vh] flex-col rounded-t-xl bg-white shadow-xl"
          role="dialog"
          aria-label="Список туалетов поблизости"
        >
          <div className="flex items-center justify-center pt-3 pb-2">
            <div className="h-1 w-10 rounded-full bg-gray-300" />
          </div>
          <div className="flex-1 overflow-y-auto pb-4 scrollbar-hide">
            <ToiletListContent />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
