import { useEffect, useRef, useState } from 'react'

// Plays a track's 30s preview_url through a single shared <audio>, so starting
// one preview stops any other. Returns the URI currently playing and a toggle.
export function usePreview() {
  const audioRef = useRef(null)
  const [playingUri, setPlayingUri] = useState(null)

  useEffect(() => {
    const audio = new Audio()
    const stop = () => setPlayingUri(null)
    audio.addEventListener('ended', stop)
    audio.addEventListener('error', stop)
    audioRef.current = audio
    return () => {
      audio.pause()
      audio.removeEventListener('ended', stop)
      audio.removeEventListener('error', stop)
    }
  }, [])

  function toggle(track) {
    const audio = audioRef.current
    if (!audio || !track.preview_url) return
    if (playingUri === track.uri) {
      audio.pause()
      setPlayingUri(null)
      return
    }
    audio.src = track.preview_url
    audio.play().then(
      () => setPlayingUri(track.uri),
      () => setPlayingUri(null),
    )
  }

  function stop() {
    audioRef.current?.pause()
    setPlayingUri(null)
  }

  return { playingUri, toggle, stop }
}
