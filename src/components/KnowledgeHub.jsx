import React, { useState, useMemo, useEffect } from 'react'

// ─── DATA ────────────────────────────────────────────────────────────────────

const GUIDE_SECTIONS = [
  {
    id: 'command-center',
    icon: '📊',
    title: 'Command Center (Tactical Dashboard)',
    content: [
      'The macro-intelligence dashboard for executive oversight. All active projects are displayed as high-density tactical strips.',
      '• **Identity Pulse** — Project name, location, start date at a glance.',
      '• **Financial Grid** — Revenue (REV), Contract Value (CON), and live GP Margin %.',
      '• **Timeline Tracker** — MEA➜CLT (Meaven-to-Client) and VND➜MEA (Vendor-to-Meaven) deadlines side-by-side.',
      '• **Execution Hub** — Assigned partner and site readiness % per project.',
      '• **Live Execution Feed** — Real-time SOS alerts from the field. Click any alert to jump to that project instantly.',
    ]
  },
  {
    id: 'operations-hub',
    icon: '📁',
    title: 'Operations Hub (Project Central)',
    content: [
      'The unified workspace for project-level management. Access it by clicking any project row on the Dashboard.',
      '• **P&L Dual Ledger** — Client revenue receipts on one side, vendor payouts on the other. Both are auto-reconciled.',
      '• **Intelligence Timeline** — Timestamped log of every update. Internal notes stay hidden; milestones can be pushed to the client view.',
      '• **Readiness Guard** — Projects below 40% site readiness are auto-flagged as EXECUTIVE HALTED in the Action Center.',
      '• **Vendor Payout Sync** — Logging a payment in the Partner Bench auto-mirrors it to the project ledger.',
    ]
  },
  {
    id: 'partner-bench',
    icon: '🤝',
    title: 'Partner Bench & Orchestration',
    content: [
      'The engine for managing vendors, contracts, and emergency reassignments.',
      '• **Intelligent Partner Detection** — The system cross-references all active contracts to determine who operates each site.',
      '• **Emergency Reassignment** — "Replace" terminates the failing vendor\'s contract, activates the new one, and logs the transition — all in one click.',
      '• **AI Bench Suggestions** — Top 3 partner recommendations based on historical quality, speed, and precision scores.',
      '• **Vendor Metrics** — Four axes: Price, Speed, Precision, Communication. Updated manually via the vendor profile.',
      '• **MSA Engine** — Auto-populate Master Service Agreements using vendor details (GST, PAN, category). Editable template.',
    ]
  },
  {
    id: 'site-readiness',
    icon: '📡',
    title: 'Site Readiness & Field Portal',
    content: [
      'Bridges the gap between the field and the war room.',
      '• **Site Readiness Score** — A 0–100% checklist covering Civil, Electrical, Structural, and Compliance checks. Projects below 40% are auto-halted.',
      '• **Field Portal** — Mobile-optimized terminal for site supervisors accessed via `?view=field`. Vendors only see their own assigned projects.',
      '• **SOS Reporting** — Supervisors can trigger "Material Delay" or "Site Ready" alerts instantly. These appear on the Dashboard live feed.',
      '• **Vendor-Specific PINs** — Each partner has a unique PIN ensuring data siloing between vendors.',
    ]
  },
  {
    id: 'pricing-engine',
    icon: '💎',
    title: 'Strategic Pricing Engine',
    content: [
      'High-precision quote generation and vendor procurement audit tool.',
      '• **BOM Integrity** — Enforces absolute material requirements (e.g., SD-36 Stile Doors must include specific horizontal caps, saddle plates, and gasket sets).',
      '• **Bin-Packing Logic** — Auto-calculates profile requirements from fixed bar lengths (2500mm / 1800mm) with wastage accounted for.',
      '• **Vendor Audit Console ("Hand-Twister")** — Reverse-engineers vendor quotes against raw floor costs. Flags markups above 20%.',
      '• **Negotiation Playbook** — Auto-generates talking points based on wastage discrepancies and BOM padding detected in the vendor quote.',
      '• **All Prices Ex-GST** — All calculations performed Exclusive of GST, aligned with B2B procurement standards.',
    ]
  },
  {
    id: 'ebitda',
    icon: '📈',
    title: 'Business Ledger & EBITDA',
    content: [
      'The global financial picture across all projects and the business.',
      '• **Global EBITDA** — Aggregates revenue, COGS, and overhead across all active projects to compute real business health.',
      '• **Overhead Allocation** — Fixed overheads (salaries, rent, software, fuel) can be allocated equally across projects or weighted by contract value.',
      '• **Business Expense Ledger** — Tracks non-project operational costs separately from project-level vendor payouts.',
      '• **Executive Summary** — A single-view snapshot of Net Margin, Total Revenue, Total COGS, and Total Overhead.',
    ]
  },
  {
    id: 'governance',
    icon: '⚙️',
    title: 'Governance Console (Admin)',
    content: [
      'Platform-level controls for SuperAdmin and Admin roles.',
      '• **User Management** — Add, reset, or remove operator accounts.',
      '• **One-Click Tactical Export** — Downloads all Projects, Vendors, and Portfolios as a CSV backup.',
      '• **Hard Reset** — Permanently wipes all cloud and local data. Use with extreme caution.',
      '• **Security PIN Setup** — Configure the internal-to-client view PIN.',
      '• **Stealth Toggle** — Switch between Internal Tactical Mode and Secure Portfolio Mode from the sidebar.',
    ]
  },
  {
    id: 'security',
    icon: '🔐',
    title: 'Security & Access Layers',
    content: [
      'Multi-layered defense architecture for data integrity.',
      '• **Primary Access** — Secure email/password login via Supabase Auth.',
      '• **Stealth Toggle** — Internal view shows raw margins and COGS. Client view shows only progress and readiness — no financials.',
      '• **Client PIN** — Required to switch into Secure Portfolio Mode from the sidebar.',
      '• **Master Key** — Executive override for PIN scenarios.',
      '• **Automated Audit Trail** — Every login and major action is timestamped in each project\'s Intelligence Timeline.',
    ]
  },
  {
    id: 'crisis',
    icon: '🛡️',
    title: 'Crisis Playbook & Data Sovereignty',
    content: [
      'Your "Red Phone" protocols when things go wrong.',
      '• **Weekly CSV Export** — Go to Governance Console → System Maintenance → "One-Click Tactical Export". Save locally every week.',
      '• **Direct Supabase Access** — If the website is down, log into supabase.com → Meaven Intelligence project → Table Editor → Export as CSV.',
      '• **Offline Mode** — Meaven works offline. The browser holds a local cache in LocalStorage. Don\'t clear browser history/cache during an outage.',
      '• **You own the data.** The platform is just the lens.',
    ]
  },
]

const FORMULAS = [
  {
    id: 'gp-margin',
    icon: '💰',
    name: 'GP Margin %',
    description: 'Gross Profit as a percentage of Revenue. The primary health metric for each project.',
    formula: 'GP Margin % = ((Revenue − COGS) ÷ Revenue) × 100',
    example: 'Revenue: ₹10,00,000 | COGS (Vendor Payout): ₹6,50,000\nGP Margin = ((10,00,000 − 6,50,000) ÷ 10,00,000) × 100 = 35%',
  },
  {
    id: 'ebitda',
    icon: '📊',
    name: 'EBITDA / Net Margin',
    description: 'Earnings before Interest, Taxes, Depreciation & Amortization. The real business profitability after overhead.',
    formula: 'EBITDA = Total Revenue − Total COGS − Total Overhead\nNet Margin % = (EBITDA ÷ Total Revenue) × 100',
    example: 'Revenue: ₹40L | COGS: ₹26L | Overhead: ₹4L\nEBITDA = 40 − 26 − 4 = ₹10L | Net Margin = (10 ÷ 40) × 100 = 25%',
  },
  {
    id: 'overhead-equal',
    icon: '⚖️',
    name: 'Overhead Allocation — Equal Split',
    description: 'Distributes fixed monthly overhead equally across all active projects. Best when projects are similar in size.',
    formula: 'Per-Project Overhead = Total Monthly Overhead ÷ Number of Active Projects',
    example: 'Overhead: ₹2,00,000 | Projects: 4\nPer-project overhead = ₹50,000 each',
  },
  {
    id: 'overhead-weighted',
    icon: '📐',
    name: 'Overhead Allocation — Weighted by Value',
    description: 'Distributes overhead proportionally to each project\'s contract value. More accurate for projects of varying sizes.',
    formula: 'Project Share = (Project Contract Value ÷ Total Portfolio Value) × Total Overhead',
    example: 'Project A: ₹15L / Total: ₹40L → Share = (15÷40) × 2,00,000 = ₹75,000',
  },
  {
    id: 'vendor-markup',
    icon: '🔎',
    name: 'Vendor Markup Detection (Hand-Twister)',
    description: 'Reverse-engineers vendor quotes to expose effective markup above raw floor cost. Flags anything above 20%.',
    formula: 'Effective Markup % = ((Vendor Quote − Floor Cost) ÷ Floor Cost) × 100\n⚠️ Flag triggered if Markup % > 20',
    example: 'Floor Cost: ₹1,20,000 | Vendor Quote: ₹1,50,000\nMarkup = ((1,50,000 − 1,20,000) ÷ 1,20,000) × 100 = 25% → FLAGGED',
  },
  {
    id: 'bin-packing',
    icon: '📏',
    name: 'Bin-Packing / Wastage Logic (Profiles)',
    description: 'Calculates the number of standard bar lengths needed for a profile run, factoring in material wastage from cuts.',
    formula: 'Bars Needed = CEILING(Total Profile Length Required ÷ Standard Bar Length)\nWastage = (Bars Needed × Bar Length) − Total Required',
    example: 'Required: 18,500mm | Bar Length: 2,500mm\nBars = CEILING(18,500 ÷ 2,500) = 8 bars\nWastage = (8 × 2,500) − 18,500 = 1,500mm',
  },
  {
    id: 'site-readiness',
    icon: '🏗️',
    name: 'Site Readiness Score',
    description: 'A 0–100% composite score across Civil, Electrical, Structural, and Compliance categories. Below 40% triggers Executive Halt.',
    formula: 'Readiness % = (Checked Items ÷ Total Checklist Items) × 100\n🚨 If Readiness % < 40 → Status = EXECUTIVE HALTED',
    example: '22 of 40 items checked → Readiness = (22 ÷ 40) × 100 = 55% → Active\n15 of 40 items checked → Readiness = 37.5% → EXECUTIVE HALTED',
  },
  {
    id: 'vendor-score',
    icon: '⭐',
    name: 'Vendor Performance Score',
    description: 'Composite score used for AI Bench Suggestions. Combines four axes into a single ranking.',
    formula: 'Score = (Price × 0.25) + (Speed × 0.30) + (Precision × 0.30) + (Communication × 0.15)',
    example: 'Price: 80 | Speed: 70 | Precision: 90 | Comm: 60\nScore = (80×0.25)+(70×0.30)+(90×0.30)+(60×0.15) = 20+21+27+9 = 77/100',
  },
]

const ROADMAP = {
  current: {
    version: 'v4.0',
    codename: '"Strategic Operator"',
    status: 'LIVE',
    features: [
      'Command Center with live tactical strips',
      'Operations Hub — dual P&L ledger with two-way vendor sync',
      'Partner Bench — AI bench suggestions & emergency reassignment',
      'Strategic Pricing Engine — BOM + bin-packing + Hand-Twister audit',
      'Site Readiness Scoring + SOS Field Portal',
      'Post-Installation QC Reports',
      'Global EBITDA + Business Expense Ledger',
      'Founder Control Tower',
      'Cloudflare Pages hosting + Supabase real-time sync',
      'Client Portal with PIN-gated Secure Portfolio Mode',
    ]
  },
  upcoming: {
    version: 'v5.0',
    codename: '"The Deal Architect"',
    status: 'ROADMAP',
    features: [
      {
        group: 'Sales Pipeline ("Bigin Killer")',
        items: [
          'Visual Kanban deal board for incoming leads',
          'One-click Lead → Quote via Pricing Engine',
          'IMAP/Nodemailer email integration (send via Zoho directly)',
          'Pixel tracking — know when a client opens your proposal',
          'Daily Action Center — zero missed follow-ups',
        ]
      },
      {
        group: 'Automated Proposal Design',
        items: [
          'Magazine-grade PDF generation from Pricing Engine BOMs',
          'Client digital acceptance — one-click "Approve" triggers project start',
        ]
      },
      {
        group: 'Vendor Performance Ledger',
        items: [
          'Profit Leakage Analytics — which vendors trigger most Hand-Twists',
          'Lead-Time Reliability Visualizer',
        ]
      },
      {
        group: 'Mobile Executive Terminal',
        items: [
          'PWA push notifications for SOS alerts to CEO phone',
          'Native-feel mobile dashboard',
        ]
      },
    ]
  }
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function highlightText(text, query) {
  if (!query) return text
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} style={{ background: 'rgba(102,178,194,0.35)', color: 'var(--accent-color)', borderRadius: '2px', padding: '0 2px' }}>{part}</mark>
      : part
  )
}

function renderBullet(line, query) {
  const isBullet = line.startsWith('•')
  const raw = isBullet ? line.slice(1).trim() : line
  // Bold **text**
  const segments = raw.split(/(\*\*[^*]+\*\*)/)
  const rendered = segments.map((seg, i) => {
    if (seg.startsWith('**') && seg.endsWith('**')) {
      const inner = seg.slice(2, -2)
      return <strong key={i}>{query ? highlightText(inner, query) : inner}</strong>
    }
    return query ? highlightText(seg, query) : seg
  })
  if (isBullet) return (
    <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.4rem' }}>
      <span style={{ color: 'var(--accent-color)', flexShrink: 0, marginTop: '2px' }}>›</span>
      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{rendered}</span>
    </div>
  )
  return <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.6rem', lineHeight: 1.55 }}>{rendered}</p>
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function CollapsibleSection({ section, defaultOpen = false, query }) {
  const [open, setOpen] = useState(defaultOpen)

  useEffect(() => {
    if (query) setOpen(true)
    else setOpen(false)
  }, [query])

  const matchesQuery = !query || section.title.toLowerCase().includes(query.toLowerCase()) ||
    section.content.some(c => c.toLowerCase().includes(query.toLowerCase()))

  if (!matchesQuery) return null

  return (
    <div className="kh-collapsible" style={{
      borderBottom: '1px solid var(--border-color)',
      marginBottom: '0.2rem',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          width: '100%', padding: '0.9rem 0', background: 'none',
          border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{section.icon}</span>
        <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>
          {query ? highlightText(section.title, query) : section.title}
        </span>
        <span style={{
          fontSize: '0.7rem', color: 'var(--text-secondary)',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease',
        }}>▾</span>
      </button>
      {open && (
        <div style={{ paddingBottom: '1rem', paddingLeft: '1.85rem', animation: 'kh-fade-in 0.25s ease' }}>
          {section.content.map((line, i) => (
            <React.Fragment key={i}>{renderBullet(line, query)}</React.Fragment>
          ))}
        </div>
      )}
    </div>
  )
}

function FormulaCard({ formula, query }) {
  const matchesQuery = !query ||
    formula.name.toLowerCase().includes(query.toLowerCase()) ||
    formula.description.toLowerCase().includes(query.toLowerCase()) ||
    formula.formula.toLowerCase().includes(query.toLowerCase())

  if (!matchesQuery) return null

  return (
    <div style={{
      background: 'var(--bg-accent)',
      border: '1px solid var(--border-color)',
      borderRadius: '12px',
      padding: '1.1rem',
      marginBottom: '0.8rem',
      transition: 'border-color 0.2s ease',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-accent)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '1.1rem' }}>{formula.icon}</span>
        <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-primary)' }}>
          {query ? highlightText(formula.name, query) : formula.name}
        </span>
      </div>
      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
        {query ? highlightText(formula.description, query) : formula.description}
      </p>
      <pre style={{
        background: 'rgba(102,178,194,0.06)',
        border: '1px solid rgba(102,178,194,0.2)',
        borderRadius: '8px',
        padding: '0.8rem',
        fontSize: '0.72rem',
        fontFamily: 'monospace',
        color: 'var(--accent-color)',
        whiteSpace: 'pre-wrap',
        lineHeight: 1.7,
        marginBottom: '0.75rem',
        overflowX: 'auto',
      }}>
        {formula.formula}
      </pre>
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '6px',
        padding: '0.6rem 0.8rem',
        borderLeft: '2px solid rgba(102,178,194,0.4)',
      }}>
        <p style={{ fontSize: '0.68rem', fontWeight: '700', color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Example</p>
        <pre style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.6, margin: 0 }}>
          {formula.example}
        </pre>
      </div>
    </div>
  )
}

function RoadmapView() {
  const { current, upcoming } = ROADMAP
  return (
    <div>
      {/* Current */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 8px var(--success)', flexShrink: 0 }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1rem', fontWeight: '900', color: 'var(--text-primary)' }}>{current.version}</span>
              <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>{current.codename}</span>
            </div>
            <span style={{ fontSize: '0.65rem', fontWeight: '800', letterSpacing: '0.12em', color: 'var(--success)', textTransform: 'uppercase' }}>● {current.status} NOW</span>
          </div>
        </div>
        <div style={{ marginLeft: '1.6rem', borderLeft: '1px solid var(--border-color)', paddingLeft: '1rem' }}>
          {current.features.map((f, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span style={{ color: 'var(--success)', fontSize: '0.75rem', marginTop: '1px', flexShrink: 0 }}>✓</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
        <span style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-secondary)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Upcoming</span>
        <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
      </div>

      {/* Upcoming */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'rgba(102,178,194,0.3)', border: '2px solid var(--accent-color)', flexShrink: 0 }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1rem', fontWeight: '900', color: 'var(--text-primary)' }}>{upcoming.version}</span>
              <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>{upcoming.codename}</span>
            </div>
            <span style={{ fontSize: '0.65rem', fontWeight: '800', letterSpacing: '0.12em', color: 'var(--accent-color)', textTransform: 'uppercase' }}>◌ {upcoming.status}</span>
          </div>
        </div>
        <div style={{ marginLeft: '1.6rem', borderLeft: '1px dashed rgba(102,178,194,0.3)', paddingLeft: '1rem' }}>
          {upcoming.features.map((group, gi) => (
            <div key={gi} style={{ marginBottom: '1.2rem' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: '900', color: 'var(--accent-color)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                {group.group}
              </p>
              {group.items.map((item, ii) => (
                <div key={ii} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span style={{ color: 'rgba(102,178,194,0.5)', fontSize: '0.75rem', marginTop: '1px', flexShrink: 0 }}>◯</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function KnowledgeHub({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('guide')
  const [search, setSearch] = useState('')

  // Reset search when tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setSearch('')
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && isOpen) onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const tabs = [
    { id: 'guide', label: 'Platform Guide', icon: '📖' },
    { id: 'formulas', label: 'Formula Vault', icon: '🔢' },
    { id: 'roadmap', label: 'Roadmap', icon: '🚀' },
  ]

  const q = search.trim().toLowerCase()

  return (
    <>
      {/* Backdrop */}
      <div
        className={`kh-backdrop${isOpen ? ' kh-open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={`kh-drawer${isOpen ? ' kh-open' : ''}`}
        role="dialog"
        aria-label="Knowledge Hub"
        aria-modal="true"
      >
        {/* Header */}
        <div style={{
          padding: '1.4rem 1.5rem 0 1.5rem',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-glass-heavy)',
          backdropFilter: 'blur(20px)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
                <span style={{ fontSize: '1.2rem' }}>📚</span>
                <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: '900', letterSpacing: '-0.01em' }}>
                  Knowledge Hub
                </h2>
                <span style={{
                  fontSize: '0.55rem', fontWeight: '800', letterSpacing: '0.12em', color: 'var(--accent-color)',
                  background: 'rgba(102,178,194,0.1)', border: '1px solid rgba(102,178,194,0.25)',
                  borderRadius: '4px', padding: '0.15rem 0.4rem', textTransform: 'uppercase',
                }}>INTERNAL</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                Guides, formulas & platform roadmap
              </p>
            </div>
            <button
              onClick={onClose}
              id="kh-close-btn"
              style={{
                background: 'var(--bg-accent)', border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)', width: '28px', height: '28px',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: '0.85rem', flexShrink: 0, marginTop: '2px',
              }}
              aria-label="Close Knowledge Hub"
            >✕</button>
          </div>

          {/* Search */}
          {activeTab !== 'roadmap' && (
            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <span style={{
                position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                fontSize: '0.8rem', color: 'var(--text-secondary)', pointerEvents: 'none',
              }}>🔍</span>
              <input
                id="kh-search-input"
                type="text"
                placeholder={activeTab === 'guide' ? 'Search modules…' : 'Search formulas…'}
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', padding: '0.55rem 0.75rem 0.55rem 2.1rem',
                  background: 'var(--bg-accent)', border: '1px solid var(--border-color)',
                  borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.8rem',
                  outline: 'none', fontFamily: 'var(--font-main)',
                  transition: 'border-color 0.2s ease',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent-color)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{
                    position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'var(--text-secondary)',
                    cursor: 'pointer', fontSize: '0.8rem', padding: '0.2rem',
                  }}
                >✕</button>
              )}
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.2rem', marginBottom: '-1px' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                id={`kh-tab-${tab.id}`}
                onClick={() => handleTabChange(tab.id)}
                style={{
                  padding: '0.5rem 0.85rem',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '0.75rem', fontWeight: activeTab === tab.id ? '800' : '500',
                  color: activeTab === tab.id ? 'var(--accent-color)' : 'var(--text-secondary)',
                  borderBottom: activeTab === tab.id ? '2px solid var(--accent-color)' : '2px solid transparent',
                  transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '0.3rem',
                  whiteSpace: 'nowrap',
                }}
              >
                <span>{tab.icon}</span>
                <span className="kh-tab-label">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem',
          scrollbarWidth: 'thin', scrollbarColor: 'var(--bg-accent) transparent',
        }}>
          {/* Platform Guide */}
          {activeTab === 'guide' && (
            <div style={{ animation: 'kh-fade-in 0.25s ease' }}>
              {GUIDE_SECTIONS.map(section => (
                <CollapsibleSection
                  key={section.id}
                  section={section}
                  defaultOpen={false}
                  query={q}
                />
              ))}
              {q && GUIDE_SECTIONS.every(s =>
                !s.title.toLowerCase().includes(q) &&
                !s.content.some(c => c.toLowerCase().includes(q))
              ) && (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                  No results for "<strong>{search}</strong>"
                </div>
              )}
            </div>
          )}

          {/* Formula Vault */}
          {activeTab === 'formulas' && (
            <div style={{ animation: 'kh-fade-in 0.25s ease' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
                All formulas are calculated <strong>Exclusive of GST</strong> unless stated otherwise. These are the exact algorithms powering the MI backend.
              </p>
              {FORMULAS.map(f => (
                <FormulaCard key={f.id} formula={f} query={q} />
              ))}
              {q && FORMULAS.every(f =>
                !f.name.toLowerCase().includes(q) &&
                !f.description.toLowerCase().includes(q) &&
                !f.formula.toLowerCase().includes(q)
              ) && (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                  No formulas matching "<strong>{search}</strong>"
                </div>
              )}
            </div>
          )}

          {/* Roadmap */}
          {activeTab === 'roadmap' && (
            <div style={{ animation: 'kh-fade-in 0.25s ease' }}>
              <RoadmapView />
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '0.8rem 1.5rem',
          borderTop: '1px solid var(--border-color)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>
            Meaven Intelligence · Internal Ops Manual
          </span>
          <span style={{ fontSize: '0.65rem', color: 'rgba(102,178,194,0.5)', fontFamily: 'monospace', fontWeight: '700' }}>
            v4.0 LIVE
          </span>
        </div>
      </div>

      <style>{`
        @keyframes kh-fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  )
}
