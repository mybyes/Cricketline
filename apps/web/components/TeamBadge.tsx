import Image from 'next/image'
import { teamColor } from '@/lib/teamColors'

type Props = { shortname?: string; name?: string; img?: string; size?: number }

export function TeamBadge({ shortname, name, img, size = 40 }: Props) {
  const label = shortname ?? name?.slice(0, 3).toUpperCase() ?? '?'
  const bg = teamColor(shortname, name)

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
