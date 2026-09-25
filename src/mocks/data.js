// Placeholder data for the skeleton. Shapes match docs/API.md in the backend.

export const mockUser = { spotifyId: '31abcxyz', displayName: 'Emmanuel', email: 'user@example.com' }

const uri = (n) => `spotify:track:${String(n).padStart(22, '0')}`

export const mockTracks = [
  { uri: uri(1), title: 'Knights of Cydonia', artist: 'Muse', album: 'Black Holes and Revelations', album_art: null, preview_url: 'mock', found: true },
  { uri: uri(2), title: 'Reptilia', artist: 'The Strokes', album: 'Room on Fire', album_art: null, preview_url: 'mock', found: true },
  { uri: uri(3), title: 'Mr. Brightside', artist: 'The Killers', album: 'Hot Fuss', album_art: null, preview_url: null, found: true },
  { uri: null, title: 'Highway Anthem (Live)', artist: 'The Open Roads', album: null, album_art: null, preview_url: null, found: false },
  { uri: uri(4), title: 'Take Me Out', artist: 'Franz Ferdinand', album: 'Franz Ferdinand', album_art: null, preview_url: 'mock', found: true },
  { uri: uri(5), title: 'Electric Feel', artist: 'MGMT', album: 'Oracular Spectacular', album_art: null, preview_url: null, found: true },
  { uri: null, title: 'Sunset Drive', artist: 'Neon Coast', album: null, album_art: null, preview_url: null, found: false },
  { uri: uri(6), title: 'Do I Wanna Know?', artist: 'Arctic Monkeys', album: 'AM', album_art: null, preview_url: 'mock', found: true },
]

export const mockSearchResults = [
  { uri: uri(11), title: 'One More Time', artist: 'Daft Punk', album: 'Discovery', album_art: null, preview_url: 'mock' },
  { uri: uri(12), title: 'Feather', artist: 'Nujabes, Cise Starr, Akin', album: 'Modal Soul', album_art: null, preview_url: null },
  { uri: uri(13), title: 'Midnight City', artist: 'M83', album: "Hurry Up, We're Dreaming", album_art: null, preview_url: 'mock' },
  { uri: uri(14), title: 'Last Nite', artist: 'The Strokes', album: 'Is This It', album_art: null, preview_url: null },
]

export const mockPlaylists = [
  { id: 42, name: 'Road Trip 2026', playlist_url: 'https://open.spotify.com/', prompt: 'upbeat indie rock for a road trip', created_at: '2026-09-20T10:00:00Z', tracks: mockTracks.filter((t) => t.found) },
  { id: 41, name: 'Study Session', playlist_url: 'https://open.spotify.com/', prompt: 'chill lo-fi beats to study to', created_at: '2026-09-12T18:30:00Z', tracks: mockSearchResults },
  { id: 40, name: 'Sunday Morning', playlist_url: 'https://open.spotify.com/', prompt: 'slow acoustic songs for a lazy sunday', created_at: '2026-08-30T08:15:00Z', tracks: [] },
  { id: 39, name: 'Gym Hype', playlist_url: 'https://open.spotify.com/', prompt: 'high energy hip hop for lifting', created_at: '2026-08-02T17:00:00Z', tracks: mockTracks.slice(0, 3) },
]

// Simulates network latency so loading states are visible.
export const fakeRequest = (data, ms = 900) => new Promise((resolve) => setTimeout(() => resolve(data), ms))
