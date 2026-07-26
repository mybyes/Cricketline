'use client'

import { useState, type ReactNode } from 'react'

export interface MatchTab { key: string; label: string; content: ReactNode }

export function MatchTabs({ tabs }: { tabs: MatchTab[] }) {
  const [active, setActive] = useState(tabs[0]?.key)

  return (
    <div className="mtabs">
      <div className="mtabs-bar" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={active === t.key}
            className={`mtab ${active === t.key ? 'mtab-on' : ''}`}
            onClick={() => setActive(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {/* Mount only the active panel — avoids duplicate SSE/pollers (odds, etc.). */}
      <div className="mtab-panel" role="tabpanel">
        {tabs.find((t) => t.key === active)?.content}
      </div>
    </div>
  )
}
