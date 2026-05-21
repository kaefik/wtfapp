import ky, { type KyInstance, type BeforeRequestHook, type AfterResponseHook } from 'ky'

let accessToken: string | null = null
let refreshPromise: Promise<boolean> | null = null

const apiPrefix = import.meta.env.VITE_API_URL || '/api/v1'

export function getAccessToken(): string | null {
  return accessToken
}

export function setAccessToken(token: string | null): void {
  accessToken = token
}

async function refreshAuth(): Promise<boolean> {
  try {
    const response = await ky.post('auth/refresh', {
      prefix: apiPrefix,
      credentials: 'include',
    }).json<{ access_token: string }>()
    setAccessToken(response.access_token)
    return true
  } catch {
    setAccessToken(null)
    return false
  }
}

async function deduplicatedRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise
  refreshPromise = refreshAuth()
  try {
    return await refreshPromise
  } finally {
    refreshPromise = null
  }
}

const beforeRequestHook: BeforeRequestHook = (state) => {
  const token = getAccessToken()
  if (token) {
    state.request.headers.set('Authorization', `Bearer ${token}`)
  }
}

const afterResponseHook: AfterResponseHook = async (state) => {
  if (state.response.status !== 401) return

  const refreshed = await deduplicatedRefresh()
  if (!refreshed) return

  const token = getAccessToken()
  if (token) {
    state.request.headers.set('Authorization', `Bearer ${token}`)
  }
  return ky(state.request)
}

export const apiClient: KyInstance = ky.create({
  prefix: apiPrefix,
  timeout: 10000,
  credentials: 'include',
  hooks: {
    beforeRequest: [beforeRequestHook],
    afterResponse: [afterResponseHook],
  },
})
