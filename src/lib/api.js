// Thin wrapper around the Laravel API (see docs/API.md in the backend repo).
import { getToken, clearSession } from './auth'

export const API_BASE =
  import.meta.env.VITE_API_URL ?? 'https://a-p-production.up.railway.app/api'

// Full-page redirect to Spotify consent — never fetch() this.
export const LOGIN_URL = `${API_BASE}/v1/login`

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.status = status
    this.data = data
  }
}

// Laravel 422s carry per-field messages; everything else uses message/error.
function messageFrom(status, data) {
  const firstFieldError = data?.errors && Object.values(data.errors).flat()[0]
  return firstFieldError ?? data?.message ?? data?.error ?? `Request failed (${status})`
}

async function request(path, { method = 'GET', body } = {}) {
  let res
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${getToken()}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError("Can't reach the server. Check your connection and try again.", 0, null)
  }

  const data = await res.json().catch(() => null)

  if (res.status === 401) {
    // Token revoked or missing — send the user back through Spotify login.
    clearSession()
    window.location.assign('/login')
  }
  if (!res.ok) throw new ApiError(messageFrom(res.status, data), res.status, data)
  return data
}

// The revise endpoint requires a non-empty title and artist on every song.
const toRevisePayload = (songs) =>
  songs.filter((s) => s.title && s.artist).map(({ title, artist }) => ({ title, artist }))

export const api = {
  listPlaylists: () => request('/v1/playlists'),
  getPlaylist: (id) => request(`/v1/playlists/${id}`),
  preview: (prompt) => request('/v1/playlist/preview', { method: 'POST', body: { prompt } }),
  revise: (instruction, songs) =>
    request('/v1/playlist/revise', { method: 'POST', body: { instruction, songs: toRevisePayload(songs) } }),
  search: (q) => request(`/v1/spotify/search?q=${encodeURIComponent(q)}`),
  publish: ({ name, prompt, uris }) =>
    request('/v1/playlist/publish', { method: 'POST', body: { name, prompt: prompt || null, uris } }),
  logout: () => request('/v1/logout', { method: 'POST' }),
}
