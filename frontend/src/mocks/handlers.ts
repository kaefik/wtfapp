import { http, HttpResponse } from 'msw'
import { mockToilets } from './data/toilets'
import { mockUser } from './data/users'

const API = '/api/v1'

export const handlers = [
  http.post(`${API}/auth/login`, async () => {
    return HttpResponse.json({
      access_token: 'mock-access-token',
      user: mockUser,
    })
  }),

  http.post(`${API}/auth/register`, async () => {
    return HttpResponse.json({
      access_token: 'mock-access-token',
      user: mockUser,
    })
  }),

  http.post(`${API}/auth/refresh`, async () => {
    return HttpResponse.json({ access_token: 'mock-access-token' })
  }),

  http.post(`${API}/auth/logout`, async () => {
    return new HttpResponse(null, { status: 200 })
  }),

  http.get(`${API}/auth/me`, async () => {
    return HttpResponse.json(mockUser)
  }),

  http.get(`${API}/toilets/nearby`, async ({ request }) => {
    const url = new URL(request.url)
    const lat = Number(url.searchParams.get('lat'))
    const lon = Number(url.searchParams.get('lon'))
    const radius = Number(url.searchParams.get('radius') ?? '1000')

    const toilets = mockToilets
      .map((t) => {
        const dLat = t.lat - lat
        const dLon = t.lon - lon
        const dist = Math.sqrt(dLat * dLat + dLon * dLon) * 111000
        return { ...t, distance: Math.round(dist) }
      })
      .filter((t) => t.distance <= radius)
      .sort((a, b) => a.distance - b.distance)

    return HttpResponse.json({
      items: toilets,
      next_cursor: null,
      total: toilets.length,
    })
  }),

  http.get(`${API}/toilets/search`, async ({ request }) => {
    const url = new URL(request.url)
    const q = url.searchParams.get('q')?.toLowerCase() ?? ''
    const results = mockToilets.filter(
      (t) => t.name.toLowerCase().includes(q) || t.address.toLowerCase().includes(q)
    )
    return HttpResponse.json({ items: results, next_cursor: null, total: results.length })
  }),

  http.get(`${API}/toilets/:id`, async ({ params }) => {
    const toilet = mockToilets.find((t) => t.id === params['id'])
    if (!toilet) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json(toilet)
  }),

  http.post(`${API}/toilets`, async () => {
    const newToilet = { ...mockToilets[0], id: String(Date.now()) }
    return HttpResponse.json(newToilet, { status: 201 })
  }),

  http.patch(`${API}/toilets/:id`, async ({ params }) => {
    const toilet = mockToilets.find((t) => t.id === params['id'])
    if (!toilet) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json(toilet)
  }),

  http.delete(`${API}/toilets/:id`, async () => {
    return new HttpResponse(null, { status: 200 })
  }),

  http.get(`${API}/toilets/:toiletId/reviews`, async () => {
    return HttpResponse.json({ items: [], next_cursor: null, total: 0 })
  }),

  http.post(`${API}/toilets/:toiletId/reviews`, async () => {
    return HttpResponse.json(
      {
        id: String(Date.now()),
        toilet_id: '1',
        user_id: 'user1',
        user_nickname: 'testuser',
        user_avatar_url: null,
        rating: 5,
        text: 'Отличный туалет',
        photo_urls: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { status: 201 }
    )
  }),

  http.post(`${API}/auth/forgot-password`, async () => {
    return new HttpResponse(null, { status: 200 })
  }),

  http.post(`${API}/auth/reset-password`, async () => {
    return new HttpResponse(null, { status: 200 })
  }),

  http.post(`${API}/auth/verify-email`, async () => {
    return new HttpResponse(null, { status: 200 })
  }),

  http.patch(`${API}/auth/me`, async () => {
    return HttpResponse.json(mockUser)
  }),

  http.post(`${API}/auth/me/avatar`, async () => {
    return HttpResponse.json({ ...mockUser, avatar_url: 'https://example.com/avatar.jpg' })
  }),
]
