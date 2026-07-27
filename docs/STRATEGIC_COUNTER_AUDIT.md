# Cricket Pulse — Strategic Counter-Audit & Chalkboard Product Architecture

**Status:** Canonical product strategy (anchors design + engineering sprints)  
**Counters:** Neon “Cricketline.io v2.0” showcase audits  

## One-line thesis

Don’t become a neon odds terminal that also happens to have scores. Stay the chalk companion that makes the match make sense in two seconds — where rates are optional, and insights lead.

---

## 1. Strategic repositioning & brand identity

| | |
|---|---|
| **Brand** | Cricket Pulse (not generic Cricketline) |
| **Tagline** | Live cricket · smart insights (`apps/web/lib/brand.ts`) |
| **Aesthetic** | Chalkboard night match — cream chalk page + green board ink |
| **Reject** | Stadium Night Glow neon (`#070C18` + `#00E676` + cyan-odds terminal) |

**Rationale:** Neon dark-mode mimics sports-betting / crypto UIs (FanCode, Stake) and creates zero long-term recall. Chalkboard evokes stadium scoreboard slates and cricket-native memory while staying high-contrast.

### Chalkboard color tokens (shipped + event hierarchy)

Core surface tokens already in `apps/web` / mobile theme:

| Token | Hex | Role |
|-------|-----|------|
| Board Ink | `#163528` | Headers, insight panels, dark chalk board |
| Board Deep | `#0E241C` | Deep board / topbar |
| Board Mid | `#1E4634` | Board gradients |
| Chalk Page | `#F2EFE6` | Main page background |
| Chalk Soft | `#E8E4D8` | Alt surface |
| Chalk Text | `#F7F4EC` | Text on board |
| Score Ink | `#152A22` | Primary text on chalk |
| Amber Pulse | `#F0A202` | Accent, session gold, CTA |

**Steal from showcase (event hierarchy only — not full neon rebrand):**

| Token | Hex | Role |
|-------|-----|------|
| Boundary Green | `#00E676` | Fours, positive momentum chips |
| Six Cyan | `#00E5FF` | Sixes, turning-point flags |
| Wicket Crimson | `#FF1744` | Wickets, extreme pressure |
| Session Gold | `#FFC400` / amber | Fancy / session highlights (prefer brand amber `#F0A202` where possible) |

Do **not** replace chalk page with `#12161A` slate — that reimports the rejected neon shell.

---

## 2. Direct audit rebuttals

| Showcase recommendation | Strategic reality | Decision |
|-------------------------|-------------------|----------|
| Odds-first hero layout | Keeps app as CricLine clone with better CSS | **REJECT** — Insight-first (Story → CIE Win% → Pressure → Rates) |
| Stadium Night Glow neon UI | Looks like every betting app | **REJECT** — Retain chalkboard; steal only 4/6/W colors |
| ML pitch & win predictor | Cold-start, expensive, hard to trust | **REJECT** — Deterministic CIE (`/intelligence`, fingerprint cache, ₹0) |
| Audio line / WebRTC | Heavy infra; not the wedge | **REJECT** |
| Live chat & emoji rain | Moderation + noise on Live Line | **REJECT** |
| Pro ₹99 + VIP odds signals | Premature; fights display-only stance | **REJECT / defer** |

---

## 3. Insight-first layout hierarchy (CIE V1 surface)

**Live stack (mobile + web):**

1. **Header & live score slate** — teams, R/W, overs, CRR | RRR, ball ticker (chalk badges)
2. **CIE Insights (hero wedge)** — narrative, win lean bar, pressure, momentum, one turning point
3. **Chase strip** — need / balls / RRR
4. **Display rates** — demoted, labeled secondary
5. **Session / fancy** — optional / collapsible

**Already shipped (V1 polish):** Insights strip on match Live (web + mobile), win% bar, turning point, odds demoted below chase.

**Not yet (next CIE surface):** Home match cards with CIE lean/story; worm chart; player-named narrative depth.

---

## 4. Pragmatic roadmap matrix

### Adopt (high ROI — sprint focus)

- [ ] **Haptic feedback (mobile)** — medium pulse on 4/6, heavy on W (`expo-haptics`)
- [ ] **Redis delta payloads (backend)** — publish diffs over Pub/Sub to cut SSE payload size
- [ ] **SEO / PWA polish (web)** — keep ISR; improve match indexing + installability (do not blindly force `revalidate = 5` if it fights live cache strategy — tune carefully)
- [x] **CIE on home cards** — elevate narrative + win lean onto Live Now / match preview cards (`GET /intelligence/live`)

### Reject / deferred

- [ ] ML model training
- [ ] WebRTC voice line
- [ ] Community chat / reaction rain
- [ ] Fantasy draft assistant
- [ ] Paid subscriptions / paywalls

---

## 5. Scorecard calibration

| Dimension | Showcase | Pulse reality (honest) | Focus |
|-----------|----------|------------------------|--------|
| Architecture | 8.5 | **9.0** | Fastify + Redis SSE + CIE `/intelligence` |
| UI/UX polish | 6.2 | **~6.8 now → 7.5 after home CIE + hierarchy tokens** | Insight hierarchy + chalk tokens, not neon bloat |
| Differentiation | 6.8 | **~7.2 now → 8.0 when home is insight-first** | CIE layout is the category jump |
| Monetization | 5.5 | **5.5** | Intentionally deferred until DAU |

---

## Engineering anchors

| Piece | Path |
|-------|------|
| CIE engines | `apps/backend/src/cie/` |
| Intelligence API | `GET /match/:id/intelligence` |
| Web Insights | `apps/web/components/InsightsStrip.tsx` |
| Mobile Insights | `apps/mobile/src/components/InsightsStrip.tsx` |
| Brand CSS | `apps/web/app/globals.css` |
| Mobile colors | `apps/mobile/src/theme/colors.ts` |

This document anchors Cricket Pulse product strategy for design and engineering sprints.
