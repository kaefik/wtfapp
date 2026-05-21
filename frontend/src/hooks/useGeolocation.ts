import { useState, useEffect, useRef } from 'react'

interface GeolocationState {
  position: [number, number] | null
  error: string | null
  isLoading: boolean
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
    isLoading: true,
  })
  const watchIdRef = useRef<number | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({
        position: null,
        error: 'Геолокация не поддерживается',
        isLoading: false,
      })
      return
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setState({
          position: [position.coords.latitude, position.coords.longitude],
          error: null,
          isLoading: false,
        })
      },
      (err) => {
        const DEFAULT_LAT = Number(import.meta.env.VITE_DEFAULT_LAT) || 55.7558
        const DEFAULT_LON = Number(import.meta.env.VITE_DEFAULT_LON) || 37.6173
        setState({
          position: [DEFAULT_LAT, DEFAULT_LON],
          error: err.code === 1 ? 'Геолокация отключена' : 'Ошибка геолокации',
          isLoading: false,
        })
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  return state
}
