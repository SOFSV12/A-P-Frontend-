import { useState } from 'react'
import { Modal } from './Modal'
import { Icon } from './Icons'
import { TrackRow } from './TrackRow'
import { TrackSkeleton } from './PlaylistModal'
import { isPublishable, publishableUris } from '../lib/tracks'
import { fakeRequest, mockTracks, mockSearchResults } from '../mocks/data'

const SUGGESTIONS = [
  'Upbeat indie rock for a road trip',
  'Chill lo-fi beats to study to',
  '90s R&B slow jams',
  'High energy workout hip hop',
]

const STEP_TITLES = { prompt: 'New playlist', review: 'Review songs', published: 'Published' }
const EMPTY_SEARCH = { open: false, query: '', results: [], loading: false, replaceIndex: null }

// Flow: prompt → review (revise / search / remove) → published.
// Every network call is mocked with fakeRequest for now; the real call is
// noted beside each one.
export function GenerateModal({ open, onClose, onPublished }) {
  const [step, setStep] = useState('prompt')
  const [prompt, setPrompt] = useState('')
  const [name, setName] = useState('')
  const [songs, setSongs] = useState([])
  const [busy, setBusy] = useState(null) // 'generate' | 'revise' | 'publish'
  const [error, setError] = useState(null)
  const [instruction, setInstruction] = useState('')
  const [search, setSearch] = useState(EMPTY_SEARCH)
  const [playingUri, setPlayingUri] = useState(null)
  const [published, setPublished] = useState(null)

  const validCount = songs.filter(isPublishable).length
  const unresolvedCount = songs.length - validCount
  const inList = new Set(songs.map((s) => s.uri).filter(Boolean))

  function close() {
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

  async function generate(e) {
    e?.preventDefault()
    if (!prompt.trim()) return
    setBusy('generate')
    setError(null)
    setStep('review')
    const data = await fakeRequest({ prompt, songs: mockTracks }, 1200) // api.preview(prompt)
    setBusy(null)
    // An empty list means the prompt wasn't music-related — not an HTTP error.
    if (data.songs.length === 0) {
      setStep('prompt')
      setError("That prompt didn't produce any songs. Try describing a mood, genre or occasion.")
      return
    }
    setSongs(data.songs)
    if (!name) setName(prompt.slice(0, 40))
  }

  async function revise(e) {
    e.preventDefault()
    if (!instruction.trim()) return
    setBusy('revise')
    const revised = [...songs.slice(1), { ...mockSearchResults[2], found: true }]
    const data = await fakeRequest({ songs: revised }) // api.revise(instruction, songs)
    setSongs(data.songs)
    setInstruction('')
    setBusy(null)
  }

  async function runSearch(e) {
    e?.preventDefault()
    if (!search.query.trim()) return
    setSearch((s) => ({ ...s, loading: true }))
    const data = await fakeRequest({ tracks: mockSearchResults }, 600) // api.search(search.query)
    setSearch((s) => ({ ...s, loading: false, results: data.tracks }))
  }

  // With an index, the picked result replaces that (unresolved) song.
  function openSearch(replaceIndex = null) {
    const seed = replaceIndex != null ? `${songs[replaceIndex].title} ${songs[replaceIndex].artist}` : ''
    setSearch({ ...EMPTY_SEARCH, open: true, query: seed, replaceIndex })
  }

  function pick(track) {
    const song = { ...track, found: true }
    setSongs((list) =>
      search.replaceIndex != null ? list.map((s, i) => (i === search.replaceIndex ? song : s)) : [...list, song],
    )
    setSearch(EMPTY_SEARCH)
  }

  const remove = (index) => setSongs((list) => list.filter((_, i) => i !== index))
  const removeUnresolved = () => setSongs((list) => list.filter(isPublishable))

  async function publish() {
    const uris = publishableUris(songs)
    if (!name.trim() || uris.length === 0) return
    setBusy('publish')
    const data = await fakeRequest(
      { playlist: { id: Date.now(), name, playlist_url: 'https://open.spotify.com/' }, tracks_added: uris.length },
      1400,
    ) // api.publish({ name, prompt, uris })
    setBusy(null)
    setPublished(data)
    setStep('published')
    onPublished?.({ ...data.playlist, prompt, tracks: songs.filter(isPublishable), created_at: new Date().toISOString() })
  }

  const footer =
    step === 'prompt' ? (
      <>
        <button type="button" className="btn btn--ghost" onClick={close}>Cancel</button>
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

  return (
    <Modal open={open} onClose={close} size="lg" footer={footer} title={<span className="modal__eyebrow">{STEP_TITLES[step]}</span>}>
      <Steps step={step} />

      {step === 'prompt' && (
        <form id="prompt-form" onSubmit={generate} className="stack">
          <label className="field">
            <span className="field__label">Describe your playlist</span>
            <textarea
              className="input input--area"
              rows={4}
              placeholder="e.g. Moody synth-pop for a late-night drive through the city"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              autoFocus
            />
          </label>
          <div className="chips">
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" className="chip" onClick={() => setPrompt(s)}>{s}</button>
            ))}
          </div>
          {error && <p className="alert alert--warn"><Icon name="warning" size={16} /> {error}</p>}
        </form>
      )}

      {step === 'review' && (
        <div className="stack">
          <label className="field">
            <span className="field__label">Playlist name</span>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="My new playlist" />
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
                <button type="submit" className="btn btn--secondary btn--sm" disabled={!search.query.trim()}>Search</button>
                <button type="button" className="icon-btn" aria-label="Close search" onClick={() => setSearch(EMPTY_SEARCH)}>
                  <Icon name="close" size={16} />
                </button>
              </form>
              {search.replaceIndex != null && (
                <p className="muted small">Pick a match to replace "{songs[search.replaceIndex]?.title}"</p>
              )}
              {search.loading ? (
                <TrackSkeleton rows={3} />
              ) : (
                search.results.length > 0 && (
                  <ul className="track-list track-list--compact">
                    {search.results.map((t) => (
                      <TrackRow
                        key={t.uri}
                        track={t}
                        actions={
                          <button type="button" className="btn btn--secondary btn--sm" onClick={() => pick(t)} disabled={inList.has(t.uri)}>
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
            <TrackSkeleton rows={6} />
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
                  playing={!!t.uri && playingUri === t.uri}
                  onTogglePreview={(tr) => setPlayingUri((u) => (u === tr.uri ? null : tr.uri))}
                  actions={
                    <>
                      {!isPublishable(t) && (
                        <button type="button" className="btn btn--secondary btn--sm" onClick={() => openSearch(i)}>Find match</button>
                      )}
                      <button type="button" className="icon-btn" onClick={() => remove(i)} aria-label={`Remove ${t.title}`} title="Remove">
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
          <div className="success__icon"><Icon name="check" size={32} /></div>
          <h2>"{published.playlist.name}" is on Spotify</h2>
          <p className="muted">{published.tracks_added} songs added. We've emailed you a summary.</p>
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
          <span>{i + 1}</span> {label}
        </li>
      ))}
    </ol>
  )
}
