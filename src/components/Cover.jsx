// Album art, or a deterministic gradient when there is none (the playlist
// list endpoint returns no images).
function hue(text = '') {
  let h = 0
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) % 360
  return h
}

export function Cover({ src, title, size = 48, className = '' }) {
  if (src) {
    return <img className={`cover ${className}`} src={src} alt="" width={size} height={size} style={{ width: size, height: size }} />
  }
  const h = hue(title)
  return (
    <div
      className={`cover cover--placeholder ${className}`}
      style={{ width: size, height: size, background: `linear-gradient(135deg, hsl(${h} 65% 45%), hsl(${(h + 60) % 360} 70% 25%))` }}
      aria-hidden="true"
    >
      <span style={{ fontSize: Math.max(12, size / 3) }}>{title?.[0]?.toUpperCase() ?? '♪'}</span>
    </div>
  )
}
