/** Cricket Intelligence Engine payload (backend CIE V1). */

export type PressureLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'

export interface MatchIntelligence {
  matchId: string
  fingerprint: string
  updatedAt: number
  winProbability: { battingPct: number; bowlingPct: number; leader: string } | null
  pressure: { score: number; level: PressureLevel; reasons: string[] }
  momentum: {
    team: string
    value: number
    direction: 'UP' | 'DOWN' | 'FLAT'
    contributors: string[]
  }
  projection: {
    low: number
    expected: number
    high: number
    confidence: number
    reasons: string[]
  } | null
  chase: {
    battingWinPct: number
    bowlingWinPct: number
    difficulty: string
    reasons: string[]
  } | null
  phase: {
    current: string
    expectedRR: number
    actualRR: number
    status: string
    reasons: string[]
  }
  partnership: {
    runs: number
    balls: number
    strikeRate: number
    impact: string
    reasons: string[]
  }
  turningPoints: {
    eventId: string
    overLabel: string
    title: string
    impact: number
    reason: string
  }[]
  narrative: { headline: string; summary: string; tags: string[] }
}
