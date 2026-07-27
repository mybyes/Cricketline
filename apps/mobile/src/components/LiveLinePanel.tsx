import { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import type { BbbBall } from '../types/extras'
import type { Match } from '../types/match'
import type { ScorecardData } from '../types/scorecard'
import type { MatchIntelligence } from '../types/intelligence'
import { colors } from '../theme/colors'
import { fetchMatchIntelligence } from '../lib/api'
import { synthRatesBoard, withSessionLadder } from '../lib/matchRates'
import type { MatchOddsBoard } from '../types/odds'
import { InsightsStrip } from './InsightsStrip'
import { LastBallBanner } from './LastBallBanner'
import { LivePairStrip } from './LivePairStrip'
import { OtherLiveMatches } from './OtherLiveMatches'
import { LineRatesPanel } from './panels/LineRatesPanel'

function oversToBalls(o: number): number {
  const w = Math.floor(o)
  return w * 6 + Math.round((o - w) * 10)
}

/**
 * Live Line: last ball → rates/session → match story → batters/bowler.
 * Target/chase lives in the top ScoreHero.
 */
export function LiveLinePanel({
  data, bbb = [], otherLive = [], onSwitchMatch, odds = null,
}: {
  data: ScorecardData
  bbb?: BbbBall[]
  otherLive?: Match[]
  onSwitchMatch?: (m: Match) => void
  odds?: MatchOddsBoard | null
}) {
  const isLive = data.matchStarted && !data.matchEnded
  const [intel, setIntel] = useState<MatchIntelligence | null>(null)

  useEffect(() => {
    if (!isLive || !data.id) {
      setIntel(null)
      return
    }
    let alive = true
    const pull = async () => {
      const res = await fetchMatchIntelligence(data.id)
      if (alive && res.success && res.data) setIntel(res.data)
    }
    void pull()
    const t = setInterval(() => { void pull() }, 12_000)
    return () => {
      alive = false
      clearInterval(t)
    }
  }, [isLive, data.id, data.score?.[data.score.length - 1]?.r, data.score?.[data.score.length - 1]?.w, data.score?.[data.score.length - 1]?.o, bbb.length])

  const activeInning = data.scorecard?.[data.scorecard.length - 1]
  const rawBoard = odds ?? (isLive ? synthRatesBoard(data, bbb) : null)
  const board = rawBoard && isLive ? withSessionLadder(rawBoard, data, bbb) : rawBoard
  const battingHint = activeInning?.inning?.split(' ')[0]

  const activeScore = data.score?.[data.score.length - 1]
  const ballsFaced = bbb.length || (activeScore ? oversToBalls(activeScore.o) : 0)
  const rpb = activeScore && ballsFaced > 0 ? (activeScore.r / ballsFaced) : null
  const fmt = data.matchType?.toLowerCase()
  const totalBalls = fmt === 'odi' ? 300 : fmt === 'test' ? null : 120
  const ballsRem = totalBalls != null && isLive ? Math.max(0, totalBalls - ballsFaced) : null

  if (data.matchEnded) {
    return (
      <View>
        <LineRatesPanel data={data} board={board} battingHint={battingHint} />
        <View style={styles.endedBox}>
          <Text style={styles.endedLabel}>MATCH ENDED</Text>
          <Text style={styles.endedStatus}>{data.status}</Text>
        </View>
      </View>
    )
  }

  return (
    <View>
      {isLive && bbb.length > 0 ? <LastBallBanner bbb={bbb} /> : null}

      {isLive && (rpb != null || ballsRem != null) && (
        <View style={styles.statRow}>
          {rpb != null ? <Text style={styles.statTxt}>Runs Per Ball: {rpb.toFixed(2)}</Text> : null}
          {ballsRem != null ? <Text style={styles.statTxt}>Balls Rem: {ballsRem}</Text> : null}
        </View>
      )}

      <LineRatesPanel data={data} board={board} battingHint={battingHint} />

      {isLive ? <InsightsStrip intel={intel} /> : null}

      {isLive ? <LivePairStrip data={data} bbb={bbb} /> : null}

      {onSwitchMatch ? <OtherLiveMatches matches={otherLive} onSelect={onSwitchMatch} /> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  statRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 4, marginBottom: 8,
  },
  statTxt: { fontSize: 13, fontWeight: '700', color: colors.text },
  endedBox: {
    backgroundColor: colors.surfaceAlt, padding: 16, borderRadius: 8, marginBottom: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  endedLabel: { fontSize: 10, fontWeight: '900', color: colors.textDim, letterSpacing: 1, marginBottom: 6 },
  endedStatus: { fontSize: 16, fontWeight: '800', color: colors.score, lineHeight: 22 },
})
