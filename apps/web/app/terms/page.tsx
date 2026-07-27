import type { Metadata } from 'next'
import { PortalLayout } from '@/components/PortalLayout'

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'Terms of use for Cricket Pulse — live cricket scores and smart insights.',
  alternates: { canonical: '/terms' },
}

export default function TermsPage() {
  return (
    <PortalLayout title="Terms of Use" subtitle="Using Cricket Pulse">
      <article className="seo-block legal">
        <p><strong>Last updated:</strong> 26 July 2026</p>
        <h2>Service</h2>
        <p>
          Cricket Pulse provides cricket scores, commentary-style ball history, tables, and match rates
          for information. The service is provided “as is” and may be delayed, incomplete, or
          unavailable.
        </p>
        <h2>No betting</h2>
        <p>
          Cricket Pulse is not a betting or gambling operator. We do not accept wagers or process
          betting payments.
        </p>
        <h2>Accuracy</h2>
        <p>
          Live scores and rates depend on upstream feeds. Do not rely on them for financial decisions.
          Official tournament scorers remain authoritative.
        </p>
        <h2>Acceptable use</h2>
        <p>
          Do not scrape, overload, or abuse the API or site. Do not misrepresent Cricket Pulse as an
          official league product or as a bookmaker.
        </p>
        <h2>Changes</h2>
        <p>
          We may update these terms as the product evolves. Continued use after changes means you accept
          the updated terms.
        </p>
      </article>
    </PortalLayout>
  )
}
