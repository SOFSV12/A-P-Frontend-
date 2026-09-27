import { useEffect, useRef, useState } from 'react'

// Web Speech API — Chrome, Edge and Safari. Firefox has no support, so callers
// should hide voice input when `speechSupported` is false.
const Recognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)
export const speechSupported = !!Recognition

const BLOCKED = 'Microphone access is blocked. Allow it in your browser settings to use voice input.'
const ERROR_MESSAGES = {
  'not-allowed': BLOCKED,
  'service-not-allowed': BLOCKED,
  'audio-capture': 'No microphone was found.',
  network: 'Voice input needs an internet connection.',
}

// Dictates one phrase into a text field. Words stream in live (interim
// results) and are appended to whatever was in the field when recording began.
export function useSpeechToText({ onText, onError }) {
  const recRef = useRef(null)
  const handlers = useRef({ onText, onError })
  const [listening, setListening] = useState(false)

  useEffect(() => {
    handlers.current = { onText, onError }
  })

  // Stop the mic if the field unmounts mid-dictation (modal closed, step changed).
  useEffect(() => () => recRef.current?.abort(), [])

  function start(existingText = '') {
    if (!Recognition || recRef.current) return
    const rec = new Recognition()
    rec.lang = navigator.language || 'en-US'
    rec.interimResults = true
    rec.continuous = false

    const base = existingText.trimEnd()
    rec.onresult = (e) => {
      const said = Array.from(e.results, (r) => r[0].transcript).join('').trim()
      handlers.current.onText([base, said].filter(Boolean).join(' '))
    }
    // "no-speech" and "aborted" are normal outcomes, not worth reporting.
    rec.onerror = (e) => ERROR_MESSAGES[e.error] && handlers.current.onError?.(ERROR_MESSAGES[e.error])
    rec.onend = () => {
      recRef.current = null
      setListening(false)
    }

    try {
      rec.start()
      recRef.current = rec
      setListening(true)
    } catch {
      handlers.current.onError?.("Couldn't start voice input. Try again.")
    }
  }

  const stop = () => recRef.current?.stop()

  return { listening, start, stop }
}
