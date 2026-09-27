import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Header } from '../components/Header'
import { Icon } from '../components/Icons'
import { PlaylistCard } from '../components/PlaylistCard'
import { PlaylistModal } from '../components/PlaylistModal'
import { GenerateModal } from '../components/GenerateModal'
import { api } from '../lib/api'
import { getUser, clearSession } from '../lib/auth'

export default function Home() {
  const navigate = useNavigate()
  const user = getUser()

  const [playlists, setPlaylists] = useState(null) // null until the first load
  const [error, setError] = useState(null)
  const [reload, setReload] = useState(0)
  const [selected, setSelected] = useState(null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    let cancelled = false
    api.listPlaylists().then(
      (data) => {
        if (cancelled) return
        setPlaylists(data)
        setError(null)
      },
      (err) => !cancelled && setError(err.message),
    )
    return () => {
      cancelled = true
    }
  }, [reload])

  function retry() {
    setError(null)
    setReload((n) => n + 1)
  }

  async function logout() {
    // Revoke the token server-side; log out locally even if that fails.
    await api.logout().catch(() => {})
    clearSession()
    navigate('/login', { replace: true })
  }

  const loading = playlists === null && !error

  return (
    <div className="page">
      <Header user={user} onLogout={logout} />

      <main className="container">
        <section className="page-head">
          <div>
            <h1>{user?.displayName ? `${user.displayName}'s playlists` : 'Your playlists'}</h1>
            {playlists && (
              <p className="score">
                Hi-score <strong>{String(playlists.length).padStart(3, '0')}</strong> playlists
              </p>
            )}
            <p className="muted">Describe a vibe and we'll build the playlist on your Spotify account.</p>
          </div>
          <button type="button" className="btn btn--primary btn--lg" onClick={() => setGenerating(true)}>
            <Icon name="sparkle" size={18} /> New playlist
          </button>
        </section>

        {error && playlists === null ? (
          <div className="empty">
            <div className="empty__icon"><Icon name="warning" size={28} /></div>
            <h2>Couldn't load your playlists</h2>
            <p className="muted">{error}</p>
            <button type="button" className="btn btn--secondary" onClick={retry}>
              <Icon name="refresh" size={16} /> Try again
            </button>
          </div>
        ) : loading ? (
          <div className="playlist-grid" aria-busy="true">
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

      <PlaylistModal key={selected?.id} playlist={selected} onClose={() => setSelected(null)} />

      <GenerateModal
        open={generating}
        onClose={() => setGenerating(false)}
        onPublished={(p) => {
          // Show it immediately, then resync with the server.
          setPlaylists((list) => [p, ...(list ?? []).filter((x) => x.id !== p.id)])
          setReload((n) => n + 1)
        }}
      />
    </div>
  )
}
