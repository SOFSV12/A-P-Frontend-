// Thin wrapper around the Laravel API. Not wired into the UI yet — the
// skeleton runs on mock data (see src/mocks/data.js).
import { getToken } from './auth'

export const API_BASE =
  import.meta.env.VITE_API_URL ?? 'https://a-p-production.up.railway.app/api'

// Full-page redirect to Spotify consent — never fetch() this.
export const LOGIN_URL = `${API_BASE}/v1/login`

async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error(data.message ?? data.error ?? 'Request failed'), { status: res.status, data })
  return data
}

export const api = {
  listPlaylists: () => request('/v1/playlists'),
  getPlaylist: (id) => request(`/v1/playlists/${id}`),
  preview: (prompt) => request('/v1/playlist/preview', { method: 'POST', body: { prompt } }),
  revise: (instruction, songs) =>
    request('/v1/playlist/revise', {
      method: 'POST',
      body: { instruction, songs: songs.map(({ title, artist }) => ({ title, artist })) },
    }),
  search: (q) => request(`/v1/spotify/search?q=${encodeURIComponent(q)}`),
  publish: ({ name, prompt, uris }) => request('/v1/playlist/publish', { method: 'POST', body: { name, prompt, uris } }),
  logout: () => request('/v1/logout', { method: 'POST' }),
}
