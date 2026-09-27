import { useEffect, useState } from 'react'
import { Modal } from './Modal'
import { Cover } from './Cover'
import { Icon } from './Icons'
import { api } from '../lib/api'

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : null

// ".../playlist/37i9dQZF1DX..." → "37i9dQZF1DX..."
const idFromUrl = (url) => url?.match(/playlist\/([A-Za-z0-9]+)/)?.[1] ?? null

// `playlist` is the summary from GET /v1/playlists ({ id, name, playlist_url }).
// Details come from GET /v1/playlists/{id}. The API doesn't return tracks, so
// they're shown with Spotify's embed player. Render with key={playlist.id} so
// state resets per playlist.
export const PlaylistModal = ({ playlist, onClose }) => {
  const [details, setDetails] = useState(null)
  const [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!playlist) return
    let cancelled = false
    api.getPlaylist(playlist.id).then(
      (data) => !cancelled && setDetails(data),
      (err) => !cancelled && setError(err.message),
    )
    return () => {
      cancelled = true
    }
  }, [playlist, attempt])

  function retry() {
    setError(null)
    setAttempt((n) => n + 1)
  }

  const info = { ...playlist, ...details }
  const spotifyId = info.spotify_playlist_id ?? idFromUrl(info.playlist_url)

  return (
    <Modal
      open={!!playlist}
      onClose={onClose}
      size="lg"
      title={<span className="modal__eyebrow">Player select</span>}
      footer={
        <>
          <button type="button" className="btn btn--cancel" onClick={onClose}>Close</button>
          <a className="btn btn--primary" href={info.playlist_url} target="_blank" rel="noreferrer">
            <Icon name="external" size={16} /> Open in Spotify
          </a>
        </>
      }
    >
      {playlist && (
        <>
          <div className="playlist-hero">
            <Cover title={info.name} size={120} />
            <div>
              <h2 className="playlist-hero__title">{info.name}</h2>
              {details ? (
                <>
                  {details.prompt && <p className="playlist-hero__prompt">"{details.prompt}"</p>}
                  {details.created_at && <p className="muted small">Created {formatDate(details.created_at)}</p>}
                </>
              ) : (
                !error && <span className="skeleton" style={{ width: 220, height: 12, marginTop: 6 }} />
              )}
            </div>
          </div>

          {error && (
            <p className="alert alert--error">
              <Icon name="warning" size={16} /> {error}
              <button type="button" className="btn btn--ghost btn--sm" onClick={retry}>Retry</button>
            </p>
          )}

          {spotifyId ? (
            <iframe
              className="embed"
              title={`${info.name} on Spotify`}
              src={`https://open.spotify.com/embed/playlist/${spotifyId}?theme=0`}
              loading="lazy"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            />
          ) : (
            <div className="empty empty--compact">
              <Icon name="music" size={28} />
              <p>Track list isn't available. Open the playlist in Spotify to see it.</p>
            </div>
          )}
        </>
      )}
    </Modal>
  )
}
