import type { Metadata } from 'next'
import { PortalLayout } from '@/components/PortalLayout'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy policy for Cricket Pulse – Live Line & AI web and Android apps.',
  alternates: { canonical: '/privacy' },
}

export default function PrivacyPage() {
  return (
    <PortalLayout title="Privacy Policy" subtitle="How we handle data">
      <article className="seo-block legal">
        <p><strong>Last updated:</strong> 26 July 2026</p>
        <h2>What we collect</h2>
        <p>
          If you use the site without signing in, we may process standard server logs (IP, user agent,
          pages requested) needed to run and secure the service. Optional Google sign-in stores your name,
          email, and avatar from Google so we can show your account and, when enabled, send match alerts.
        </p>
        <h2>What we do not do</h2>
        <p>
          We do not sell personal data. We do not run a betting wallet. Display-only market rates are not
          linked to personal wagering profiles.
        </p>
        <h2>Cookies &amp; storage</h2>
        <p>
          We use local browser storage for preferences such as favorites and short-lived match caches.
          Auth sessions use cookies or equivalent tokens when you sign in.
        </p>
        <h2>Third parties</h2>
        <p>
          Score data comes from cricket data providers. If Google sign-in is enabled, Google processes
          authentication. House promotional slots may link to our social channels (e.g. @ChaiPeCric).
        </p>
        <h2>Contact</h2>
        <p>
          For privacy requests related to Cricket Pulse, contact the operator via the project maintainers
          or the social channel listed on the site.
        </p>
      </article>
    </PortalLayout>
  )
}
