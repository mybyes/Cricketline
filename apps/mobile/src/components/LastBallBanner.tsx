import { ScrollView, StyleSheet, Text, View } from 'react-native'

import type { BbbBall } from '../types/extras'

import { narrateBall } from '../lib/ballColors'

import { getCurrentOverBalls, getCurrentOverNum } from '../lib/bbbUtils'

import { colors } from '../theme/colors'



function overRuns(balls: BbbBall[]): number {

  return balls.reduce((s, b) => s + (typeof b.runs === 'number' ? b.runs : 0), 0)

}



function chip(b: BbbBall): { bg: string; text: string; label: string } {

  const e = b.event?.toLowerCase() ?? ''

  const runs = typeof b.runs === 'number' ? b.runs : parseInt(String(b.runs ?? ''), 10)

  if (e === 'w' || e.includes('wicket') || e.includes('out')) {

    return { bg: '#FF1744', text: '#fff', label: 'W' }

  }

  if (runs === 6) return { bg: '#00B8D4', text: '#fff', label: '6' }

  if (runs === 4) return { bg: '#00C853', text: '#fff', label: '4' }

  if (runs === 0) return { bg: '#424242', text: '#fff', label: '·' }

  return { bg: '#1565c0', text: '#fff', label: Number.isFinite(runs) ? String(runs) : '·' }

}



function OverRail({

  label,

  balls,

  runs,

  latestIdx,

  dim,

  padTo,

}: {

  label: string

  balls: BbbBall[]

  runs: number

  latestIdx?: number

  dim?: boolean

  padTo?: number

}) {

  const slots = padTo != null ? Math.max(padTo, balls.length) : balls.length

  return (

    <View style={[styles.railBlock, dim && styles.railDim]}>

      <Text style={[styles.railTag, dim && styles.railTagDim]}>{label}</Text>

      <View style={styles.seg}>

        {Array.from({ length: slots }, (_, i) => {

          const b = balls[i]

          if (!b) {

            return <View key={`e-${i}`} style={styles.ballEmpty} />

          }

          const c = chip(b)

          return (

            <View

              key={i}

              style={[

                styles.ballChip,

                { backgroundColor: c.bg },

                !dim && i === latestIdx && styles.ballLatest,

                dim && styles.ballDim,

              ]}

            >

              <Text style={[styles.ballText, { color: c.text }]}>{c.label}</Text>

            </View>

          )

        })}

      </View>

      <Text style={[styles.railSum, dim && styles.railSumDim]}>{runs}</Text>

    </View>

  )

}



/** Compact last ball + left→right over progress (prev → current). */

export function LastBallBanner({ bbb }: { bbb: BbbBall[] }) {

  if (!bbb.length) return null



  const last = bbb[bbb.length - 1]

  const narr = narrateBall(last)

  const headline = narr.headline

    ? narr.headline === 'OUT!' ? 'Wicket' : narr.headline === 'SIX' ? '6 Runs' : narr.headline === 'FOUR' ? '4 Runs' : narr.headline

    : narr.text.replace(/^(\d+) run(s)?$/i, (_: string, n: string, s: string) => `${n} Run${s ? 's' : ''}`)

      .replace(/^no run$/i, '0 Run')



  const curOver = getCurrentOverNum(bbb) ?? 0

  const thisOver = getCurrentOverBalls(bbb)

  const prevOver = curOver > 1

    ? bbb.filter((b) => (b.overNum ?? 0) === curOver - 1)

    : []

  const thisRuns = overRuns(thisOver)

  const latestIdx = thisOver.length - 1

  const progress = Math.min(1, thisOver.length / 6)



  return (

    <View style={styles.wrap}>

      <View style={styles.banner}>

        <View style={styles.bannerRow}>

          <View style={styles.livePill}>

            <View style={styles.liveDot} />

            <Text style={styles.liveTxt}>LIVE</Text>

          </View>

          <Text style={styles.headline} numberOfLines={1}>{headline}</Text>

        </View>

      </View>



      <ScrollView

        horizontal

        showsHorizontalScrollIndicator={false}

        contentContainerStyle={styles.rail}

        accessibilityLabel="Over progress"

      >

        {prevOver.length > 0 ? (

          <OverRail

            label={`Ov ${curOver - 1}`}

            balls={prevOver}

            runs={overRuns(prevOver)}

            dim

          />

        ) : null}

        {prevOver.length > 0 ? (

          <View style={styles.progress} accessibilityElementsHidden>

            <View style={styles.progressTrack}>

              <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />

            </View>

          </View>

        ) : null}

        <OverRail

          label={`Ov ${curOver}`}

          balls={thisOver}

          runs={thisRuns}

          latestIdx={latestIdx}

          padTo={6}

        />

      </ScrollView>

    </View>

  )

}



const styles = StyleSheet.create({

  wrap: {

    marginBottom: 10,

    borderRadius: 8,

    borderWidth: 1,

    borderColor: 'rgba(26,35,54,0.35)',

    borderLeftWidth: 3,

    borderLeftColor: colors.accent,

    overflow: 'hidden',

    backgroundColor: colors.header,

  },

  banner: { backgroundColor: colors.header },

  bannerRow: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    gap: 12,

    paddingHorizontal: 14,

    paddingVertical: 10,

  },

  livePill: { flexDirection: 'row', alignItems: 'center', gap: 5 },

  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.live },

  liveTxt: { fontSize: 10, fontWeight: '800', color: '#FF8A80', letterSpacing: 1.2 },

  headline: {

    flex: 1,

    fontSize: 18,

    fontWeight: '700',

    color: colors.textOnGreen,

    textAlign: 'right',

    letterSpacing: -0.3,

  },

  rail: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 10,

    backgroundColor: colors.card,

    paddingHorizontal: 10,

    paddingVertical: 8,

    borderTopWidth: 1,

    borderTopColor: 'rgba(240,162,2,0.2)',

  },

  railBlock: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 6,

  },

  railDim: { opacity: 0.78 },

  railTag: {

    fontSize: 10,

    fontWeight: '800',

    letterSpacing: 0.6,

    textTransform: 'uppercase',

    color: colors.textMuted,

    backgroundColor: 'rgba(22,53,40,0.08)',

    borderWidth: StyleSheet.hairlineWidth,

    borderColor: colors.border,

    borderRadius: 999,

    paddingHorizontal: 8,

    paddingVertical: 3,

    overflow: 'hidden',

  },

  railTagDim: { color: colors.textDim },

  railSum: {

    fontSize: 13,

    fontWeight: '800',

    color: colors.accent,

    fontVariant: ['tabular-nums'],

    minWidth: 16,

  },

  railSumDim: { color: colors.textMuted },

  progress: {

    width: 36,

    justifyContent: 'center',

  },

  progressTrack: {

    height: 3,

    borderRadius: 2,

    backgroundColor: 'rgba(22,53,40,0.12)',

    overflow: 'hidden',

  },

  progressFill: {

    height: '100%',

    borderRadius: 2,

    backgroundColor: colors.accent,

  },

  seg: { flexDirection: 'row', alignItems: 'center', gap: 3 },

  ballChip: {

    width: 22,

    height: 22,

    borderRadius: 6,

    alignItems: 'center',

    justifyContent: 'center',

  },

  ballEmpty: {

    width: 22,

    height: 22,

    borderRadius: 6,

    borderWidth: 1,

    borderColor: colors.border,

    borderStyle: 'dashed',

    backgroundColor: 'transparent',

  },

  ballLatest: {

    borderWidth: 2,

    borderColor: colors.accent,

  },

  ballDim: { opacity: 0.7 },

  ballText: { fontSize: 10, fontWeight: '700' },

})


