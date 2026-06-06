const PALETTE = ['#1b5e20', '#1565c0', '#6a1b9a', '#c62828', '#ef6c00', '#00838f', '#4527a0', '#2e7d32']

export function teamColor(shortname?: string) {
  if (!shortname) return PALETTE[0]
  let h = 0
  for (let i = 0; i < shortname.length; i++) h = shortname.charCodeAt(i) + ((h << 5) - h)
  return PALETTE[Math.abs(h) % PALETTE.length]
}
