import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { saveSession } from '../lib/auth'

// The backend redirects here after Spotify consent:
// /auth/callback?token=...&spotify_id=...&display_name=...&email=...
export default function AuthCallback() {
  const navigate = useNavigate()
  const [params] = useState(() => new URLSearchParams(window.location.search))
  const failed = !params.get('token')

  useEffect(() => {
    if (failed) return
    const token = params.get('token')
    saveSession(token, {
      spotifyId: params.get('spotify_id'),
      displayName: params.get('display_name') ?? null,
      email: params.get('email') ?? null,
    })
    // Strip the token from the address bar before leaving.
    window.history.replaceState({}, '', '/auth/callback')
    navigate('/', { replace: true })
  }, [failed, params, navigate])

  return (
    <main className="login">
      <div className="login__card">
        {failed ? (
          <>
            <h1>Sign-in failed</h1>
            <p className="muted">We didn't get a token back from Spotify. Please try again.</p>
            <Link to="/login" className="btn btn--primary btn--block">Back to login</Link>
          </>
        ) : (
          <>
            <span className="spinner spinner--lg" />
            <p className="muted">Signing you in…</p>
          </>
        )}
      </div>
    </main>
  )
}
