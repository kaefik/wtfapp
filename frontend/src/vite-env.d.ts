/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_API_MOCKING: string
  readonly VITE_DEFAULT_LAT: string
  readonly VITE_DEFAULT_LON: string
  readonly VITE_DEFAULT_CITY: string
  readonly VITE_SENTRY_DSN: string
  readonly VITE_NOMINATIM_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
