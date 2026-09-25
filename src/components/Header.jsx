import { Link } from 'react-router'
import { Icon } from './Icons'

export function Header({ user, onLogout }) {
  return (
    <header className="app-header">
      <Link to="/" className="brand">
        <span className="brand__mark"><Icon name="music" size={18} /></span>
        THE CUT
      </Link>
      <div className="app-header__right">
        {user && <span className="avatar" title={user.email ?? ''}>{(user.displayName ?? '?')[0]}</span>}
        {user && <span className="app-header__name">{user.displayName ?? 'Spotify user'}</span>}
        <button type="button" className="btn btn--ghost btn--sm" onClick={onLogout}>
          <Icon name="logout" size={16} /> Log out
        </button>
      </div>
    </header>
  )
}
