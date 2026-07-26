/** Cricket Intelligence Engine — V1 primitives (deterministic, ₹0). */

export interface IntelligenceModule<T> {
  calculate(state: MatchState): T
}

export type PhaseName = 'POWERPLAY' | 'MIDDLE' | 'DEATH' | 'UNKNOWN'
export type PressureLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'

export interface BallEvent {
  runs: number
  isWicket: boolean
  isBoundary: boolean
  isDot: boolean
  overNum?: number
  ballNbr?: number
}

export interface OverBucket {
  overNum: number
  runs: number
  wickets: number
  balls: number
}

export interface PartnershipState {
  runs: number
  balls: number
  strikeRate: number
}

export interface MatchState {
  matchId: string
  matchType: string
  matchName: string
  teams: [string, string]
  battingTeam: string
  bowlingTeam: string
  innings: number
  score: number
  wickets: number
  overs: number
  balls: number
  oversTotal: number
  target?: number
  currentRR: number
  requiredRR: number
  wicketsInHand: number
  ballsLeft: number
  runsNeeded: number
  phase: PhaseName
  last30Balls: BallEvent[]
  last10Overs: OverBucket[]
  last3OversRuns: number
  last5OversRuns: number
  partnership: PartnershipState
  fingerprint: string
  matchEnded: boolean
  matchStarted: boolean
}

export interface PressureResult {
  score: number
  level: PressureLevel
  reasons: string[]
}

export interface MomentumResult {
  team: string
  value: number
  direction: 'UP' | 'DOWN' | 'FLAT'
  contributors: string[]
}

export interface ProjectionResult {
  low: number
  expected: number
  high: number
  confidence: number
  reasons: string[]
}

export interface ChaseResult {
  battingWinPct: number
  bowlingWinPct: number
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXTREME' | 'N/A'
  reasons: string[]
}

export interface PartnershipResult {
  runs: number
  balls: number
  strikeRate: number
  impact: 'LOW' | 'MEDIUM' | 'HIGH'
  reasons: string[]
}

export interface PhaseResult {
  current: PhaseName
  expectedRR: number
  actualRR: number
  status: string
  reasons: string[]
}

export interface TurningPoint {
  eventId: string
  overLabel: string
  title: string
  impact: number
  reason: string
}

export interface NarrativeResult {
  headline: string
  summary: string
  tags: string[]
}

export interface MatchIntelligence {
  matchId: string
  fingerprint: string
  updatedAt: number
  winProbability: { battingPct: number; bowlingPct: number; leader: string } | null
  pressure: PressureResult
  momentum: MomentumResult
  projection: ProjectionResult | null
  chase: ChaseResult | null
  phase: PhaseResult
  partnership: PartnershipResult
  turningPoints: TurningPoint[]
  narrative: NarrativeResult
}
