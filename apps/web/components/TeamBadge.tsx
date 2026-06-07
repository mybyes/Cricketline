import Image from 'next/image'

const PALETTE = ['#1b5e20', '#1565c0', '#6a1b9a', '#c62828', '#ef6c00', '#00838f']

function colorFor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i) * 17) % PALETTE.length
  return PALETTE[h]!
}

type Props = { shortname?: string; name?: string; img?: string; size?: number }

export function TeamBadge({ shortname, name, img, size = 40 }: Props) {
  const label = shortname ?? name?.slice(0, 3).toUpperCase() ?? '?'
  const bg = colorFor(shortname ?? name ?? '?')

  if (img) {
    return (
      <Image
        src={img}
        alt=""
        className="team-badge-img"
        width={size}
        height={size}
        unoptimized
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <span className="team-badge-fallback" style={{ width: size, height: size, backgroundColor: bg, fontSize: size * 0.38 }}>
      {label.slice(0, 2)}
    </span>
  )
}
