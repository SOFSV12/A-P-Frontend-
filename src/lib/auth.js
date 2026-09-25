// The login redirect is the only time the backend sends the profile, so it
// is persisted next to the token.
const TOKEN_KEY = 'token'
const USER_KEY = 'user'

function safe(fn, fallback = null) {
  try {
    return fn()
  } catch {
    return fallback
  }
}

export const getToken = () => safe(() => localStorage.getItem(TOKEN_KEY))
export const getUser = () => safe(() => JSON.parse(localStorage.getItem(USER_KEY)))

export function saveSession(token, user) {
  safe(() => {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  })
}

export function clearSession() {
  safe(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  })
}
