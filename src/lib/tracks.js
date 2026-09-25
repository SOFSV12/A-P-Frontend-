// A Spotify track URI: "spotify:track:" + 22 base62 chars.
const TRACK_URI = /^spotify:track:[A-Za-z0-9]{22}$/

// Only songs that resolved to a real Spotify track can be published.
export const isPublishable = (song) =>
  song?.found !== false && typeof song?.uri === 'string' && TRACK_URI.test(song.uri)

// Unique, valid URIs in list order — exactly what /v1/playlist/publish expects.
export const publishableUris = (songs) => [...new Set(songs.filter(isPublishable).map((s) => s.uri))]
