import { create } from 'zustand'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
  duration?: number
}

interface UIState {
  bottomSheetState: 'collapsed' | 'expanded'
  setBottomSheetState: (state: 'collapsed' | 'expanded') => void
  isFilterPanelOpen: boolean
  setFilterPanelOpen: (open: boolean) => void
  desktopFilterOpen: boolean
  setDesktopFilterOpen: (open: boolean) => void
  isOffline: boolean
  setOffline: (offline: boolean) => void
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

let toastCounter = 0

export const useUIStore = create<UIState>((set) => ({
  bottomSheetState: 'expanded',
  setBottomSheetState: (state) => set({ bottomSheetState: state }),
  isFilterPanelOpen: false,
  setFilterPanelOpen: (open) => set({ isFilterPanelOpen: open }),
  desktopFilterOpen: false,
  setDesktopFilterOpen: (open) => set({ desktopFilterOpen: open }),
  isOffline: false,
  setOffline: (offline) => set({ isOffline: offline }),
  toasts: [],
  addToast: (toast) => {
    const id = String(++toastCounter)
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }))
    const duration = toast.duration ?? 4000
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, duration)
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))
