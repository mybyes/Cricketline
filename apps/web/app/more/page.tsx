import type { Metadata } from 'next'
import { MoreMenu } from '@/components/MoreMenu'
import { SiteHeader } from '@/components/SiteHeader'

export const metadata: Metadata = {
  title: 'More',
  description: 'Browse cricket, follow Cricket Pulse, and read About, Privacy and Terms.',
  alternates: { canonical: '/more' },
}

export default function MorePage() {
  return (
    <>
      <SiteHeader />
      <div className="page-head">
        <div className="container">
          <h1 className="page-title">More</h1>
          <p className="page-sub">Browse, follow &amp; info</p>
        </div>
      </div>
      <div className="container more-page">
        <MoreMenu />
      </div>
    </>
  )
}
