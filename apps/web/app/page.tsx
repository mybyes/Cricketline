import type { Metadata } from 'next'
import Link from 'next/link'
import { AppDownloadButton } from '@/components/AppDownloadButton'
import { DailySection } from '@/components/DailySection'
import { LiveScoresPanel } from '@/components/LiveScoresPanel'
import { PageRefresher } from '@/components/PageRefresher'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { FALLBACK_SERIES, getDaily, getLiveMatches, getRecentMatches, getSeriesList, getUpcomingMatches } from '@/lib/api'
import { getSiteUrl } from '@/lib/site'

export const revalidate = 15

export const metadata: Metadata = {
  title: 'LiveLine Guru — Live Cricket Scores & Ball by Ball',
  description: 'Fast live cricket line: real-time scores, ball-by-ball commentary, session & rate analytics, scorecards, squads and fixtures — IPL, Tests, ODIs & T20. Free, no login.',
  keywords: [
    'live cricket line', 'cricket live line', 'live line app', 'ball by ball live',
    'live cricket score', 'cricket scorecard', 'session and rates', 'IPL live score',
    'fastest live cricket score', 'live cricket commentary', 'cricket live line app',
  ],
  alternates: { canonical: getSiteUrl() },
  openGraph: {
    title: 'LiveLine Guru — Live Cricket Scores & Ball by Ball',
    description: 'Real-time cricket scores, ball-by-ball, session & rate analytics — IPL, Tests, ODIs & T20.',
    url: getSiteUrl(),
    type: 'website',
  },
}

// FAQ — visible content below mirrors this exactly (Google wants the schema to match the page).
const FAQ = [
  {
    q: 'Is LiveLine Guru a live cricket line app?',
    a: 'Yes — LiveLine Guru is a fast live cricket line with real-time ball-by-ball updates, live scores, session and rate analytics, full scorecards and squads, on both web and Android.',
  },
  {
    q: 'How fast do the live scores update?',
    a: 'Scores and ball-by-ball refresh in real time over a live stream, updating through every over of a match without reloading the page.',
  },
  {
    q: 'Is LiveLine Guru free and do I need to log in?',
    a: 'LiveLine Guru is free and fully usable without an account. Sign-in is optional and only adds match notifications.',
  },
  {
    q: 'Which formats and leagues are covered?',
    a: 'Tests, ODIs and T20 — internationals, the IPL and major franchise leagues — with live scores, fixtures, results, series and points tables.',
  },
]

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
}

const appJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'LiveLine Guru — Live Cricket Line',
  applicationCategory: 'SportsApplication',
  operatingSystem: 'Android, Web',
  url: getSiteUrl(),
  description: 'Live cricket line with real-time ball-by-ball, session & rate analytics, scorecards, squads and fixtures.',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
}

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'LiveLine Guru',
  url: getSiteUrl(),
  logo: `${getSiteUrl()}/og.svg`,
  sameAs: ['https://x.com/ChaiPeCric'],
}

export default async function HomePage() {
  const [seriesRes, liveRes, recentRes, upcomingRes, dailyRes] = await Promise.all([
    getSeriesList(),
    getLiveMatches(),
    getRecentMatches(),
    getUpcomingMatches(),
    getDaily(),
  ])
  const series = (seriesRes.data?.length ? seriesRes.data : FALLBACK_SERIES).slice(0, 12)
  const stale = liveRes.stale || recentRes.stale || upcomingRes.stale
  const cachedAt = Math.max(liveRes.cachedAt ?? 0, recentRes.cachedAt ?? 0, upcomingRes.cachedAt ?? 0) || undefined

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'LiveLine Guru',
        url: getSiteUrl(),
        description: 'Live cricket scores, ball-by-ball updates and scorecards for IPL, Tests, ODIs and T20.',
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: `${getSiteUrl()}/search?q={search_term_string}` },
          'query-input': 'required name=search_term_string',
        },
      }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      <PageRefresher intervalMs={15_000} />
      <SiteHeader />
      <h1 className="sr-only">Live Cricket Scores &amp; Live Line — IPL, Tests, ODIs &amp; T20, Ball by Ball</h1>

      <div className="container page-layout">
        <main className="main-col">
          {dailyRes.data?.matchOfTheDay && <DailySection data={dailyRes.data} />}

          <LiveScoresPanel initial={{
            live: liveRes.data,
            recent: recentRes.data,
            upcoming: upcomingRes.data,
            stale,
            cachedAt,
          }} />

          <section className="seo-block" id="download">
            <h2>A faster cricket live line</h2>
            <p>
              LiveLine Guru is a real-time cricket <strong>live line</strong> — <strong>ball-by-ball</strong> updates,
              live scores, <strong>session &amp; rate</strong> analytics, full scorecards, squads and fixtures across
              the IPL, internationals and major T20 leagues. It streams live (no manual refresh), works on web and as a
              free Android app, and needs no login. Looking for a fast live-line app? Tap any match for the full
              ball-by-ball summary.
            </p>
          </section>

          <section className="faq">
            <h2>Frequently asked questions</h2>
            <div className="faq-grid">
              {FAQ.map((f) => (
                <div key={f.q}>
                  <h3>{f.q}</h3>
                  <p>{f.a}</p>
                </div>
              ))}
            </div>
          </section>
        </main>

        <aside className="sidebar">
          <div className="widget" id="series">
            <div className="widget-head">Popular Series</div>
            <div className="widget-body chips">
              {series.map((s) => <Link key={s.id} href={`/series/${s.id}`} className="chip">{s.name}</Link>)}
            </div>
          </div>
          <div className="widget widget-cta">
            <div className="widget-head">LiveLine Guru App</div>
            <div className="widget-body download-box">
              <p>Faster live line on Android.</p>
              <AppDownloadButton />
            </div>
          </div>
        </aside>
      </div>
      <SiteFooter />
    </>
  )
}
