import { Icon } from '../components/Icons'
import { LOGIN_URL } from '../lib/api'

export default function Login() {
  return (
    <main className="login">
      <div className="login__card">
        <span className="brand__mark brand__mark--lg"><Icon name="music" size={28} /></span>
        <h1>THE CUT</h1>
        <p className="muted">
          Describe a mood, a moment or a genre. We'll pick the songs and save the playlist straight to your Spotify.
        </p>

        <ul className="login__steps">
          <li><Icon name="sparkle" size={16} /> Write a prompt</li>
          <li><Icon name="refresh" size={16} /> Revise and fine-tune the songs</li>
          <li><Icon name="check" size={16} /> Publish to your Spotify account</li>
        </ul>

        {/* Full-page redirect to Spotify consent. Must not be fetch()ed. */}
        <a className="btn btn--primary btn--lg btn--block" href={LOGIN_URL}>
          Continue with Spotify
        </a>
        <p className="muted small">
          We only ask for permission to read your profile and create playlists.
        </p>
      </div>
    </main>
  )
}
