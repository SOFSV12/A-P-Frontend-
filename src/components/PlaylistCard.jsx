import { Cover } from './Cover'
import { Icon } from './Icons'

export const PlaylistCard = ({ playlist, onOpen }) => {
  return (
    <article className="playlist-card">
      <button type="button" className="playlist-card__main" onClick={() => onOpen(playlist)}>
        <Cover title={playlist.name} size={null} className="playlist-card__cover" />
        <h2 className="playlist-card__title">{playlist.name}</h2>
        {playlist.prompt && <p className="playlist-card__prompt">"{playlist.prompt}"</p>}
      </button>
      <a className="playlist-card__spotify" href={playlist.playlist_url} target="_blank" rel="noreferrer" title="Open in Spotify">
        <Icon name="external" size={16} />
      </a>
    </article>
  )
}
