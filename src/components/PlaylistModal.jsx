import { useState } from 'react'
import { Modal } from './Modal'
import { Cover } from './Cover'
import { Icon } from './Icons'
import { TrackRow } from './TrackRow'

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : null

// Details for one playlist. `playlist` merges GET /v1/playlists/{id}; `tracks`
// is mock-only for now (the backend doesn't return tracks yet).
export const PlaylistModal = ({ playlist, loading = false, onClose }) => {
  const [playingUri, setPlayingUri] = useState(null)
  const tracks = playlist?.tracks ?? []

  return (
    <Modal
      open={!!playlist}
      onClose={onClose}
      size="lg"
      title={<span className="modal__eyebrow">Playlist</span>}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>Close</button>
          <a className="btn btn--primary" href={playlist?.playlist_url} target="_blank" rel="noreferrer">
            <Icon name="external" size={16} /> Open in Spotify
          </a>
        </>
      }
    >
      {playlist && (
        <>
          <div className="playlist-hero">
            <Cover title={playlist.name} size={120} />
            <div>
              <h2 className="playlist-hero__title">{playlist.name}</h2>
              {playlist.prompt && <p className="playlist-hero__prompt">"{playlist.prompt}"</p>}
              <p className="muted small">
                {tracks.length} {tracks.length === 1 ? 'song' : 'songs'}
                {playlist.created_at && ` · Created ${formatDate(playlist.created_at)}`}
              </p>
            </div>
          </div>

          {loading ? (
            <TrackSkeleton />
          ) : tracks.length === 0 ? (
            <div className="empty empty--compact">
              <Icon name="music" size={28} />
              <p>No tracks to show for this playlist.</p>
            </div>
          ) : (
            <ol className="track-list">
              {tracks.map((t, i) => (
                <TrackRow
                  key={t.uri ?? i}
                  track={t}
                  index={i}
                  playing={playingUri === t.uri}
                  onTogglePreview={(tr) => setPlayingUri((u) => (u === tr.uri ? null : tr.uri))}
                />
              ))}
            </ol>
          )}
        </>
      )}
    </Modal>
  )
}

export function TrackSkeleton({ rows = 5 }) {
  return (
    <ul className="track-list" aria-busy="true">
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="track track--skeleton">
          <span className="skeleton" style={{ width: 44, height: 44 }} />
          <div className="track__meta">
            <span className="skeleton" style={{ width: '55%', height: 12 }} />
            <span className="skeleton" style={{ width: '35%', height: 10, marginTop: 8 }} />
          </div>
        </li>
      ))}
    </ul>
  )
}
