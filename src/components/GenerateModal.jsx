import { useRef, useState } from 'react'
import { Modal } from './Modal'
import { Icon } from './Icons'
import { TrackRow, TrackSkeleton } from './TrackRow'
import { MicButton } from './MicButton'
import { api } from '../lib/api'
import { isPublishable, publishableUris } from '../lib/tracks'
import { usePreview } from '../lib/usePreview'

const SUGGESTIONS = [
  'Upbeat indie rock for a road trip',
  'Chill lo-fi beats to study to',
  '90s R&B slow jams',
  'High energy workout hip hop',
]

const STEP_TITLES = { prompt: 'New playlist // choose your vibe', review: 'Review songs // build your roster', published: 'Published // victory' }
const EMPTY_SEARCH = { open: false, query: '', results: null, loading: false, error: null, replaceIndex: null }

// Flow: prompt → review (revise / search / remove) → published.
// The server is stateless between steps; this component holds the working list.
export function GenerateModal({ open, onClose, onPublished }) {
  const [step, setStep] = useState('prompt')
  const [prompt, setPrompt] = useState('')
  const [name, setName] = useState('')
  const [songs, setSongs] = useState([])
  const [busy, setBusy] = useState(null) // 'generate' | 'revise' | 'publish'
  const [error, setError] = useState(null) // { message, playlistUrl? }
  const [instruction, setInstruction] = useState('')
  const [search, setSearch] = useState(EMPTY_SEARCH)
  const [published, setPublished] = useState(null)
  const preview = usePreview()

  // Bumped on close so responses from a previous session are ignored.
  const session = useRef(0)
  const guard = (fn) => {
    const id = session.current
    return (...args) => id === session.current && fn(...args)
  }

  const validCount = songs.filter(isPublishable).length
  const unresolvedCount = songs.length - validCount
  const inList = new Set(songs.map((s) => s.uri).filter(Boolean))

  function close() {
    session.current += 1
    preview.stop()
    setStep('prompt')
    setPrompt('')
    setName('')
    setSongs([])
    setBusy(null)
    setError(null)
    setInstruction('')
    setSearch(EMPTY_SEARCH)
    setPublished(null)
    onClose()
  }

  function generate(e) {
    e?.preventDefault()
    if (!prompt.trim() || busy) return
    preview.stop()
    setBusy('generate')
    setError(null)
    setSearch(EMPTY_SEARCH)
    setStep('review')
    const done = guard((data, err) => {
      setBusy(null)
      if (err) {
        setStep('prompt')
        setError({ message: err.message })
        return
      }
      // An empty list means the prompt wasn't music-related — not an HTTP error.
      if (!data.songs?.length) {
        setStep('prompt')
        setError({ message: "That prompt didn't produce any songs. Try describing a mood, genre or occasion." })
        return
      }
      setSongs(data.songs)
      setName((n) => n || prompt.trim().slice(0, 60))
    })
    api.preview(prompt.trim()).then((data) => done(data), (err) => done(null, err))
  }

  function revise(e) {
    e.preventDefault()
    if (!instruction.trim() || busy) return
    preview.stop()
    setBusy('revise')
    setError(null)
    const done = guard((data, err) => {
      setBusy(null)
      if (err) return setError({ message: err.message })
      if (!data.songs?.length) {
        return setError({ message: "The revision came back empty, so your list wasn't changed. Try rewording it." })
      }
      setSongs(data.songs)
      setInstruction('')
    })
    api.revise(instruction.trim(), songs).then((data) => done(data), (err) => done(null, err))
  }

  function runSearch(e) {
    e?.preventDefault()
    const q = search.query.trim()
    if (!q) return
    setSearch((s) => ({ ...s, loading: true, error: null }))
    const done = guard((data, err) =>
      setSearch((s) => ({ ...s, loading: false, results: err ? null : data.tracks ?? [], error: err?.message ?? null })),
    )
    api.search(q).then((data) => done(data), (err) => done(null, err))
  }

  // With an index, the picked result replaces that (unresolved) song.
  function openSearch(replaceIndex = null) {
    const seed = replaceIndex != null ? `${songs[replaceIndex].title} ${songs[replaceIndex].artist}` : ''
    setSearch({ ...EMPTY_SEARCH, open: true, query: seed, replaceIndex })
  }

  function pick(track) {
    if (!isPublishable(track)) return
    const song = { ...track, found: true }
    setSongs((list) =>
      search.replaceIndex != null ? list.map((s, i) => (i === search.replaceIndex ? song : s)) : [...list, song],
    )
    setSearch(EMPTY_SEARCH)
  }

  function remove(index) {
    if (songs[index]?.uri === preview.playingUri) preview.stop()
    setSongs((list) => list.filter((_, i) => i !== index))
    // Indices shift after a removal, so drop any pending "replace" search.
    setSearch((s) => (s.replaceIndex != null ? EMPTY_SEARCH : s))
  }

  const removeUnresolved = () => {
    setSongs((list) => list.filter(isPublishable))
    setSearch((s) => (s.replaceIndex != null ? EMPTY_SEARCH : s))
  }

  function publish() {
    const uris = publishableUris(songs)
    if (!name.trim() || uris.length === 0 || busy) return
    preview.stop()
    setBusy('publish')
    setError(null)
    const done = guard((data, err) => {
      setBusy(null)
      if (err) {
        // 502: the playlist exists on Spotify but adding tracks failed.
        return setError({ message: err.message, playlistUrl: err.data?.playlist_url })
      }
      setPublished(data)
      setStep('published')
      onPublished?.(data.playlist)
    })
    api.publish({ name: name.trim(), prompt: prompt.trim(), uris }).then((data) => done(data), (err) => done(null, err))
  }

  const footer =
    step === 'prompt' ? (
      <>
        <button type="button" className="btn btn--cancel" onClick={close}>Cancel</button>
        <button type="submit" form="prompt-form" className="btn btn--primary" disabled={!prompt.trim()}>
          <Icon name="sparkle" size={16} /> Generate songs
        </button>
      </>
    ) : step === 'review' ? (
      <>
        <span className="footer-note">
          <strong>{validCount}</strong> ready to publish
          {unresolvedCount > 0 && <span className="text-warn"> · {unresolvedCount} not found (skipped)</span>}
        </span>
        <button type="button" className="btn btn--ghost" onClick={() => setStep('prompt')} disabled={!!busy}>
          <Icon name="back" size={16} /> Edit prompt
        </button>
        <button type="button" className="btn btn--primary" onClick={publish} disabled={!!busy || validCount === 0 || !name.trim()}>
          {busy === 'publish' ? <span className="spinner" /> : <Icon name="check" size={16} />}
          {busy === 'publish' ? 'Publishing…' : 'Publish to Spotify'}
        </button>
      </>
    ) : (
      <button type="button" className="btn btn--primary" onClick={close}>Done</button>
    )

  const errorAlert = error && (
    <p className="alert alert--error">
      <Icon name="warning" size={16} />
      <span>
        {error.message}
        {error.playlistUrl && (
          <>
            {' '}
            <a href={error.playlistUrl} target="_blank" rel="noreferrer">View the playlist on Spotify</a>
          </>
        )}
      </span>
    </p>
  )

  return (
    <Modal open={open} onClose={close} size="lg" footer={footer} title={<span className="modal__eyebrow">{STEP_TITLES[step]}</span>}>
      <Steps step={step} />

      {step === 'prompt' && (
        <form id="prompt-form" onSubmit={generate} className="stack">
          <div className="field">
            <label className="field__label" htmlFor="prompt-input">Describe your playlist (type or speak)</label>
            <div className="input-wrap">
              <textarea
                id="prompt-input"
                className="input input--area"
                rows={4}
                placeholder="e.g. Moody synth-pop for a late-night drive through the city"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                autoFocus
              />
              <MicButton value={prompt} onChange={setPrompt} onError={(message) => setError({ message })} />
            </div>
          </div>
          <div className="chips">
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" className="chip" onClick={() => setPrompt(s)}>{s}</button>
            ))}
          </div>
          {errorAlert}
        </form>
      )}

      {step === 'review' && (
        <div className="stack">
          <label className="field">
            <span className="field__label">Playlist name</span>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="My new playlist" disabled={busy === 'publish'} />
          </label>

          <p className="muted small">Prompt: "{prompt}"</p>

          <form className="inline-form" onSubmit={revise}>
            <Icon name="sparkle" size={16} />
            <input
              className="input input--bare"
              placeholder="Revise it: e.g. drop the slow songs, add two by The Strokes"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              disabled={!!busy}
            />
            <MicButton value={instruction} onChange={setInstruction} onError={(message) => setError({ message })} disabled={!!busy} />
            <button type="submit" className="btn btn--secondary btn--sm" disabled={!!busy || !instruction.trim()}>
              {busy === 'revise' ? <span className="spinner" /> : <Icon name="refresh" size={14} />} Revise
            </button>
          </form>

          <div className="toolbar">
            <button type="button" className="btn btn--secondary btn--sm" onClick={() => openSearch()} disabled={!!busy}>
              <Icon name="search" size={14} /> Search &amp; add a song
            </button>
            {unresolvedCount > 0 && (
              <button type="button" className="btn btn--ghost btn--sm" onClick={removeUnresolved} disabled={!!busy}>
                <Icon name="trash" size={14} /> Remove {unresolvedCount} not found
              </button>
            )}
          </div>

          {errorAlert}

          {search.open && (
            <div className="search-panel">
              <form className="inline-form" onSubmit={runSearch}>
                <Icon name="search" size={16} />
                <input
                  className="input input--bare"
                  placeholder="Search Spotify for a song or artist"
                  value={search.query}
                  onChange={(e) => setSearch((s) => ({ ...s, query: e.target.value }))}
                  autoFocus
                />
                <MicButton
                  value={search.query}
                  onChange={(query) => setSearch((s) => ({ ...s, query }))}
                  onError={(error) => setSearch((s) => ({ ...s, error }))}
                />
                <button type="submit" className="btn btn--secondary btn--sm" disabled={!search.query.trim() || search.loading}>Search</button>
                <button type="button" className="icon-btn" aria-label="Close search" onClick={() => setSearch(EMPTY_SEARCH)}>
                  <Icon name="close" size={16} />
                </button>
              </form>
              {search.replaceIndex != null && (
                <p className="muted small">Pick a match to replace "{songs[search.replaceIndex]?.title}"</p>
              )}
              {search.error && <p className="alert alert--error"><Icon name="warning" size={16} /> {search.error}</p>}
              {search.loading ? (
                <TrackSkeleton rows={3} />
              ) : search.results?.length === 0 ? (
                <p className="muted small">No tracks found. Try a different search.</p>
              ) : (
                search.results?.length > 0 && (
                  <ul className="track-list track-list--compact">
                    {search.results.map((t, i) => (
                      <TrackRow
                        key={t.uri ?? i}
                        track={t}
                        playing={!!t.uri && preview.playingUri === t.uri}
                        onTogglePreview={preview.toggle}
                        actions={
                          <button
                            type="button"
                            className="btn btn--secondary btn--sm"
                            onClick={() => pick(t)}
                            disabled={!isPublishable(t) || inList.has(t.uri)}
                          >
                            {inList.has(t.uri) ? 'Added' : search.replaceIndex != null ? 'Use this' : <><Icon name="plus" size={14} /> Add</>}
                          </button>
                        }
                      />
                    ))}
                  </ul>
                )
              )}
            </div>
          )}

          {busy === 'generate' || busy === 'revise' ? (
            <>
              <p className="muted small loading-note">
                <span className="spinner" /> {busy === 'generate' ? 'Picking songs and matching them on Spotify…' : 'Revising your list…'}
              </p>
              <TrackSkeleton rows={6} />
            </>
          ) : songs.length === 0 ? (
            <div className="empty empty--compact">
              <p>Your list is empty. Search for songs to add, or revise the prompt.</p>
            </div>
          ) : (
            <ol className="track-list">
              {songs.map((t, i) => (
                <TrackRow
                  key={`${t.uri ?? t.title}-${i}`}
                  track={t}
                  index={i}
                  playing={!!t.uri && preview.playingUri === t.uri}
                  onTogglePreview={preview.toggle}
                  actions={
                    <>
                      {!isPublishable(t) && (
                        <button type="button" className="btn btn--secondary btn--sm" onClick={() => openSearch(i)} disabled={!!busy}>
                          Find match
                        </button>
                      )}
                      <button type="button" className="icon-btn" onClick={() => remove(i)} disabled={!!busy} aria-label={`Remove ${t.title}`} title="Remove">
                        <Icon name="trash" size={16} />
                      </button>
                    </>
                  }
                />
              ))}
            </ol>
          )}
        </div>
      )}

      {step === 'published' && published && (
        <div className="success">
          <div className="ko" aria-hidden="true">K.O.!</div>
          <h2>"{published.playlist.name}" is on Spotify</h2>
          <p className="muted">
            {published.tracks_added} {published.tracks_added === 1 ? 'song' : 'songs'} added. If your Spotify account has an email, we'll send you a summary.
          </p>
          <a className="btn btn--primary" href={published.playlist.playlist_url} target="_blank" rel="noreferrer">
            <Icon name="external" size={16} /> Open in Spotify
          </a>
        </div>
      )}
    </Modal>
  )
}

function Steps({ step }) {
  const current = ['prompt', 'review', 'published'].indexOf(step)
  return (
    <ol className="steps">
      {['Prompt', 'Review', 'Publish'].map((label, i) => (
        <li key={label} className={i < current ? 'is-done' : i === current ? 'is-current' : ''}>
          Round {i + 1}: {label}
        </li>
      ))}
    </ol>
  )
}
