/** Tunable CIE weights — keep out of engine bodies. */
export const CIE_WEIGHTS = {
  pressure: {
    rrrGap: 12,
    wicketsLost: 6,
    oversLeftTight: 8,
    dotPct: 0.35,
    recentWickets: 10,
    last3Slow: 8,
  },
  momentum: {
    last2OversRuns: 1.2,
    boundaryBonus: 3,
    wicketPenalty: 14,
    rrLift: 8,
  },
  projection: {
    deathBoost: 1.15,
    wicketDrag: 0.04,
    bandPct: 0.04,
  },
  chase: {
    rrGap: 0.07,
    wicketFactor: 0.05,
    highRrrPenalty: 0.04,
    deathPanic: 0.25,
  },
  phase: {
    t20: { powerplayEnd: 6, deathStart: 16, expected: { POWERPLAY: 8.5, MIDDLE: 8.0, DEATH: 11.5 } },
    odi: { powerplayEnd: 10, deathStart: 40, expected: { POWERPLAY: 5.5, MIDDLE: 5.2, DEATH: 8.5 } },
  },
  turningPoint: {
    bigPartnership: 50,
    winSwing: 8,
    bigOverRuns: 16,
  },
} as const
