import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Header } from '../components/Header'
import { Icon } from '../components/Icons'
import { PlaylistCard } from '../components/PlaylistCard'
import { PlaylistModal } from '../components/PlaylistModal'
import { GenerateModal } from '../components/GenerateModal'
import { getUser, clearSession } from '../lib/auth'
import { mockPlaylists, mockUser } from '../mocks/data'

// Skeleton helpers: add ?empty to the URL to preview the empty state,
// ?loading to preview the loading grid.
export default function Home() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const user = getUser() ?? mockUser

  const [playlists, setPlaylists] = useState(params.has('empty') ? [] : mockPlaylists) // api.listPlaylists()
  const loading = params.has('loading')
  const [selected, setSelected] = useState(null)
  const [generating, setGenerating] = useState(false)

  function logout() {
    // api.logout() first once wired
    clearSession()
    navigate('/login')
  }

  return (
    <div className="page">
      <Header user={user} onLogout={logout} />

      <main className="container">
        <section className="page-head">
          <div>
            <h1>Your playlists</h1>
            <p className="muted">Describe a vibe and we'll build the playlist on your Spotify account.</p>
          </div>
          <button type="button" className="btn btn--primary btn--lg" onClick={() => setGenerating(true)}>
            <Icon name="sparkle" size={18} /> New playlist
          </button>
        </section>

        {loading ? (
          <div className="playlist-grid">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="playlist-card playlist-card--skeleton">
                <span className="skeleton playlist-card__cover" />
                <span className="skeleton" style={{ width: '70%', height: 14, marginTop: 12 }} />
              </div>
            ))}
          </div>
        ) : playlists.length === 0 ? (
          <div className="empty">
            <div className="empty__icon"><Icon name="music" size={32} /></div>
            <h2>No playlists yet</h2>
            <p className="muted">Try something like "chill lo-fi beats to study to".</p>
            <button type="button" className="btn btn--primary" onClick={() => setGenerating(true)}>
              <Icon name="sparkle" size={16} /> Create your first playlist
            </button>
          </div>
        ) : (
          <div className="playlist-grid">
            {playlists.map((p) => (
              <PlaylistCard key={p.id} playlist={p} onOpen={setSelected} />
            ))}
          </div>
        )}
      </main>

      {/* Opening a card will call api.getPlaylist(id) for prompt/created_at */}
      <PlaylistModal playlist={selected} onClose={() => setSelected(null)} />

      <GenerateModal
        open={generating}
        onClose={() => setGenerating(false)}
        onPublished={(p) => setPlaylists((list) => [p, ...list])}
      />
    </div>
  )
}
