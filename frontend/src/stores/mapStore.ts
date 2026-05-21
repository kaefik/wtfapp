import { create } from 'zustand'

export interface NearbyFilters {
  radius: number
  gender?: 'male' | 'female' | 'unisex' | 'family'
  is_free?: boolean
  has_water?: boolean
  has_hot_water?: boolean
  has_soap?: boolean
  has_dryer?: boolean
  is_accessible?: boolean
  has_child_toilet?: boolean
  has_changing_table?: boolean
  paper_type?: 'none' | 'in_cabin' | 'dispenser' | 'both'
  is_open_now?: boolean
  min_rating?: number
  toilet_type?: 'indoor' | 'outdoor' | 'portable'
}

const defaultFilters: NearbyFilters = {
  radius: 1000,
}

interface MapState {
  center: [number, number]
  zoom: number
  filters: NearbyFilters
  setCenter: (center: [number, number]) => void
  setZoom: (zoom: number) => void
  setFilters: (filters: Partial<NearbyFilters>) => void
  resetFilters: () => void
}

const DEFAULT_LAT = Number(import.meta.env.VITE_DEFAULT_LAT) || 55.7558
const DEFAULT_LON = Number(import.meta.env.VITE_DEFAULT_LON) || 37.6173

export const useMapStore = create<MapState>((set) => ({
  center: [DEFAULT_LAT, DEFAULT_LON],
  zoom: 15,
  filters: { ...defaultFilters },
  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  resetFilters: () => set({ filters: { ...defaultFilters } }),
}))
