import type { IntelligenceModule, MatchState, PartnershipResult } from '../types'

export const partnershipEngine: IntelligenceModule<PartnershipResult> = {
  calculate(state: MatchState): PartnershipResult {
    const { runs, balls, strikeRate } = state.partnership
    const reasons: string[] = []
    let impact: PartnershipResult['impact'] = 'LOW'

    if (runs >= 70 || (runs >= 40 && strikeRate >= 150)) {
      impact = 'HIGH'
      reasons.push('Substantial stand changing the innings')
    } else if (runs >= 35 || (runs >= 20 && strikeRate >= 130)) {
      impact = 'MEDIUM'
      reasons.push('Useful partnership building')
    } else {
      reasons.push('New or rebuilding stand')
    }

    if (balls > 0) {
      reasons.push(`${runs} off ${balls} · SR ${strikeRate.toFixed(0)}`)
    }

    return { runs, balls, strikeRate: Math.round(strikeRate), impact, reasons: reasons.slice(0, 3) }
  },
}
