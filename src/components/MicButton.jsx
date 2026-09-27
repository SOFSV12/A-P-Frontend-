import { Icon } from './Icons'
import { speechSupported, useSpeechToText } from '../lib/useSpeechToText'

// Voice input for a text field: dictated words are appended to `value` via
// `onChange`. Renders nothing in browsers without speech recognition.
export function MicButton({ value, onChange, onError, disabled, className = '' }) {
  const { listening, start, stop } = useSpeechToText({ onText: onChange, onError })

  if (!speechSupported) return null

  return (
    <button
      type="button"
      className={`icon-btn mic-btn ${listening ? 'is-listening' : ''} ${className}`}
      onClick={() => (listening ? stop() : start(value))}
      disabled={disabled && !listening}
      aria-pressed={listening}
      aria-label={listening ? 'Stop voice input' : 'Speak instead of typing'}
      title={listening ? 'Listening… click to stop' : 'Speak instead of typing'}
    >
      <Icon name="mic" size={16} />
    </button>
  )
}
