import { Cover } from './Cover'
import { Icon } from './Icons'
import { isPublishable } from '../lib/tracks'

// One song in a list. `actions` is rendered at the end of the row so each
// context (playlist view, review list, search results) supplies its own buttons.
export function TrackRow({ track, index, playing, onTogglePreview, actions }) {
  const valid = isPublishable(track)

  return (
    <li className={`track ${valid ? '' : 'track--unresolved'}`}>
      {index != null && <span className="track__index">{index + 1}</span>}
      <Cover src={track.album_art} title={track.title} size={44} />
      <div className="track__meta">
        <div className="track__title">{track.title}</div>
        <div className="track__artist">
          {track.artist}
          {track.album && <span className="track__album"> · {track.album}</span>}
        </div>
        {!valid && (
          <div className="track__flag">
            <Icon name="warning" size={14} /> Not found on Spotify. It won't be published.
          </div>
        )}
      </div>
      {onTogglePreview && (
        <button
          type="button"
          className="icon-btn"
          onClick={() => onTogglePreview(track)}
          disabled={!track.preview_url}
          title={track.preview_url ? 'Play 30s preview' : 'No preview available'}
          aria-label={playing ? 'Pause preview' : 'Play preview'}
        >
          <Icon name={playing ? 'pause' : 'play'} />
        </button>
      )}
      {actions && <div className="track__actions">{actions}</div>}
    </li>
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
