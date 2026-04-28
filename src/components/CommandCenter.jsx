import { useState, useEffect } from 'react'
import SiteReadiness from './SiteReadiness'

const CommandCenter = ({ projects = [], proposals = [], vendors = [], onSelectProject, onSelectTab, onUpdateProject }) => {
    const formatDate = (dateStr) => {
        if (!dateStr || dateStr === '---') return dateStr;
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const y = date.getFullYear();
        return `${d}-${m}-${y}`;
    }

    const [stats, setStats] = useState({ totalValue: 0, avgReadiness: 0, activeAnomalies: 0, complianceRate: 98.2 })

    const [alerts, setAlerts] = useState([])
    const [aiInsights, setAiInsights] = useState([])
    const [executionFeed, setExecutionFeed] = useState([])

    useEffect(() => {
        const total = projects.reduce((sum, p) => sum + (p.clientFinancials?.totalValue || 0), 0)
        const avg = projects.length > 0 ? Math.round(projects.reduce((sum, p) => sum + (p.readiness || 0), 0) / projects.length) : 0
        const anomalies = proposals.filter(p => p.status === 'pending').length
        setStats({ totalValue: total, avgReadiness: avg, activeAnomalies: anomalies, complianceRate: 99.4 })

        // --- DERIVE TACTICAL ALERTS ---
        const newAlerts = []
        projects.forEach(p => {
            if (p.isSignOffRequested && !p.managerSignOff) {
                newAlerts.push({ id: `signoff-${p.id}`, type: 'emergency', title: 'Authorization Required', detail: `${p.name} awaiting executive sign-off.` })
            }
            if (p.readiness < 40 && p.status === 'Active') {
                newAlerts.push({ id: `danger-${p.id}`, type: 'emergency', title: 'EXECUTION HALTED', detail: `${p.name} readiness below 40%. DO NOT COMMENCE.` })
            }
            if (p.clientFinancials?.totalValue > 500000 && (p.clientFinancials?.received || []).length === 0) {
                newAlerts.push({ id: `cash-${p.id}`, type: 'financial', title: 'Revenue Gap', detail: `High value site ${p.name} has 0 receipts.` })
            }
        })
        setAlerts(newAlerts)

        // --- DERIVE AI INSIGHTS ---
        const insights = []
        vendors.forEach(v => {
            const activeContracts = (v.contracts || []).filter(c => c.status === 'Active').length
            if (activeContracts >= 3) {
                insights.push(`⚠️ Vendor ${v.name} is at capacity (${activeContracts} sites). Divert new loops.`)
            }
        })
        projects.forEach(p => {
            if (p.readiness >= 95 && p.status === 'Active') {
                insights.push(`🚀 ${p.name} at 95%+ readiness. Ready for Handover loop?`)
            }
        })
        if (insights.length === 0) insights.push("Sector performance at optimal velocity. No immediate bottlenecks detected.")
        setAiInsights(insights)

        // --- DERIVE EXECUTION FEED ---
        const feed = projects.flatMap(p => 
            (p.history || [])
            .filter(h => h.title.includes('FIELD SOS'))
            .map(h => ({ ...h, projectName: p.name, projectId: p.id }))
        ).sort((a, b) => b.id - a.id).slice(0, 5)
        setExecutionFeed(feed)
    }, [projects, proposals, vendors])

    const matrixBorder = '1px solid var(--border-color)'
    const matrixBg = 'var(--bg-secondary)'

    const groupedPortfolios = projects.reduce((acc, p) => {
        const client = p.client || 'General Portfolio'
        if (!acc[client]) acc[client] = []
        acc[client].push(p)
        return acc
    }, {})

    return (
        <div className="command-center animate-fade-in" style={{ padding: '0.5rem 0' }}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2rem' }}>
                {/* MODULE 2: SITE INTELLIGENCE MATRIX */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {Object.entries(groupedPortfolios).map(([client, projs]) => (
                        <div key={client} style={{ background: matrixBg, border: matrixBorder, borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ padding: '1rem 1.5rem', background: 'rgba(102, 178, 194, 0.08)', borderBottom: matrixBorder, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: '900', letterSpacing: '0.15em', color: 'var(--accent-color)' }}>{client.toUpperCase()} // PORTFOLIO</h3>
                                    {(() => {
                                        const uniqueVendors = [...new Set(projs.map(p => {
                                            if (p.assignedVendor) return p.assignedVendor
                                            // Fallback for old projects: search in vendor contracts
                                            const vMatch = vendors.find(v => (v.contracts || []).some(c => c.projectName === p.name && (c.status === 'Active' || !c.status)))
                                            return vMatch?.name
                                        }).filter(Boolean))]
                                        const vendorText = uniqueVendors.length === 0 ? 'PARTNER PENDING' : uniqueVendors.length === 1 ? `PARTNER: ${uniqueVendors[0].toUpperCase()}` : 'MULTIPLE PARTNERS'
                                        return (
                                            <span style={{ fontSize: '0.6rem', color: uniqueVendors.length === 0 ? 'var(--danger)' : 'var(--text-secondary)', background: 'var(--bg-accent)', padding: '0.2rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)', fontWeight: '800' }}>
                                                {vendorText}
                                            </span>
                                        )
                                    })()}
                                </div>
                                <span style={{ fontSize: '0.65rem', fontWeight: '800' }}>{projs.length} SITES</span>
                            </div>
                            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {projs.map(p => {
                                    // Calculate COGS (Contract Value to Vendor)
                                    const cogs = vendors.reduce((sum, v) => {
                                        const projectContract = (v.contracts || []).find(c => c.projectName === p.name && (c.status === 'Active' || !c.status))
                                        return sum + (projectContract ? (Number(projectContract.orderValue) || 0) : 0)
                                    }, 0)
                                    
                                    const orderValue = p.clientFinancials?.totalValue || 0
                                    const margin = orderValue > 0 ? ((orderValue - cogs) / orderValue * 100).toFixed(1) : 0

                                    return (
                                        <div 
                                            key={p.id} 
                                            onClick={() => onSelectProject(p.id)}
                                            className="matrix-row glass-module"
                                            style={{ 
                                                display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr 180px', gap: '1rem', padding: '1rem', 
                                                borderRadius: '6px', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                border: matrixBorder, marginBottom: '0.4rem', alignItems: 'center'
                                            }}
                                        >
                                            {/* SECTION 1: IDENTITY */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', borderRight: matrixBorder, paddingRight: '1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.status === 'Active' ? 'var(--success)' : 'var(--danger)', boxShadow: `0 0 5px ${p.status === 'Active' ? 'var(--success)' : 'var(--danger)'}` }} />
                                                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</h4>
                                                </div>
                                                <p style={{ margin: 0, fontSize: '0.55rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                    {p.location} // {formatDate(p.startDate)}
                                                </p>
                                            </div>

                                            {/* SECTION 2: FINANCIALS */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', borderRight: matrixBorder, paddingRight: '1rem' }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                                                        <span style={{ color: 'var(--text-secondary)' }}>REV:</span>
                                                        <span style={{ fontWeight: '800' }}>₹{(orderValue / 100000).toFixed(1)}L</span>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginTop: '0.1rem' }}>
                                                        <span style={{ color: 'var(--text-secondary)' }}>CON:</span>
                                                        <span style={{ fontWeight: '800', color: 'var(--danger)' }}>₹{(cogs / 100000).toFixed(1)}L</span>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: '900', color: margin > 30 ? 'var(--success)' : 'var(--accent-color)' }}>{margin}%</div>
                                                    <div style={{ fontSize: '0.45rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>GP MARGIN</div>
                                                </div>
                                            </div>

                                            {/* SECTION 3: TIMELINES */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', borderRight: matrixBorder, paddingRight: '1rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem' }}>
                                                    <span style={{ color: 'var(--accent-color)', fontSize: '0.55rem' }}>MEA➜CLT:</span>
                                                    <span style={{ fontWeight: '700', color: 'var(--accent-color)' }}>{formatDate(p.endDate)}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem' }}>
                                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.55rem' }}>VND➜MEA:</span>
                                                    <span style={{ fontWeight: '700' }}>{formatDate(p.vendorEndDate)}</span>
                                                </div>
                                            </div>

                                            {/* SECTION 4: PARTNER & READINESS */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: '800', color: 'var(--accent-color)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.assignedVendor || 'UNASSIGNED'}</p>
                                                    <p style={{ margin: 0, fontSize: '0.5rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{p.createdBy || 'ADMIN'}</p>
                                                </div>
                                                <div style={{ textAlign: 'right', minWidth: '45px' }}>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: '900', color: p.readiness < 40 ? 'var(--danger)' : 'var(--success)' }}>{p.readiness}%</div>
                                                    <div style={{ height: '2px', width: '30px', background: 'var(--bg-accent)', borderRadius: '1px', marginLeft: 'auto', overflow: 'hidden' }}>
                                                        <div style={{ height: '100%', width: `${p.readiness}%`, background: p.readiness < 40 ? 'var(--danger)' : 'var(--success)' }} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* MODULE 3: TACTICAL ACTION CENTER & AI BRAIN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ background: matrixBg, border: matrixBorder, padding: '1.5rem', borderRadius: '4px' }}>
                        <h4 style={{ margin: '0 0 1.5rem 0', fontSize: '0.65rem', color: 'var(--accent-color)', fontWeight: '900', letterSpacing: '0.2em' }}>⚡ TACTICAL ACTION CENTER</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {alerts.length > 0 ? alerts.map(alert => (
                                <div key={alert.id} style={{ 
                                    padding: '1rem', 
                                    background: 'var(--bg-accent)', 
                                    borderLeft: `3px solid ${alert.type === 'emergency' ? 'var(--danger)' : 'var(--accent-color)'}`,
                                    borderRadius: '4px'
                                }}>
                                    <div style={{ fontSize: '0.6rem', fontWeight: '900', color: alert.type === 'emergency' ? 'var(--danger)' : 'var(--accent-color)', marginBottom: '0.3rem' }}>{alert.title.toUpperCase()}</div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>{alert.detail}</div>
                                </div>
                            )) : (
                                <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                                    All project loops synchronized. No active bottlenecks.
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ background: matrixBg, border: matrixBorder, padding: '1.5rem', borderRadius: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h4 style={{ margin: 0, fontSize: '0.65rem', color: '#FF9500', fontWeight: '900', letterSpacing: '0.2em' }}>📡 LIVE EXECUTION FEED</h4>
                            <span className="pulse-dot" style={{ width: '6px', height: '6px', background: '#FF9500', borderRadius: '50%' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            {executionFeed.length > 0 ? executionFeed.map(item => (
                                <div 
                                    key={item.id} 
                                    onClick={() => {
                                        onSelectProject(item.projectId);
                                        onSelectTab('projects');
                                    }}
                                    style={{ 
                                        borderLeft: '2px solid #FF9500', 
                                        paddingLeft: '1rem', 
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        padding: '0.8rem'
                                    }}
                                    className="cinematic-hover"
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                                        <span style={{ fontSize: '0.6rem', fontWeight: '900', color: '#FF9500' }}>{item.projectName.toUpperCase()}</span>
                                        <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)' }}>{formatDate(item.date)}</span>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{item.title}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{item.detail}</div>
                                </div>
                            )) : (
                                <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                                    No active field reports in current cycle.
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ background: 'var(--bg-accent)', border: matrixBorder, padding: '1.5rem', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem' }}>
                            <div className="pulse-dot" style={{ width: '8px', height: '8px', background: 'var(--accent-color)', borderRadius: '2px' }} />
                            <h4 style={{ margin: 0, fontSize: '0.65rem', color: 'var(--accent-color)', fontWeight: '900', letterSpacing: '0.2em' }}>TACTICAL AI BRAIN</h4>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        {aiInsights.map((insight, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '1rem', background: matrixBg, borderRadius: '8px', border: matrixBorder }}>
                                <span style={{ color: 'var(--accent-color)', fontSize: '1rem' }}>⚡</span>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-primary)', lineHeight: '1.4' }}>{insight}</p>
                            </div>
                        ))}
                    </div>
                        <button onClick={() => onSelectTab('admin')} className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', borderColor: 'var(--accent-color)', color: 'var(--accent-color)', fontWeight: '800', marginTop: '1rem' }}>GOVERNANCE PANEL</button>
                    </div>
                </div>
            </div>

            <style>{`
                .matrix-row:hover {
                    background: rgba(102, 178, 194, 0.05);
                    border-left: 3px solid var(--accent-color);
                    padding-left: 0.8rem;
                }
                .matrix-row:last-child {
                    border-bottom: none;
                }
            `}</style>
        </div>
    )
}

const MatrixStatModule = ({ label, value, sub, color = '#fff' }) => (
    <div className="glass-module cinematic-hover" style={{ 
        padding: '1.5rem', borderRadius: '4px', borderLeft: `4px solid ${color}`,
        cursor: 'pointer'
    }}>
        <p style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.15em', margin: '0 0 0.8rem 0', fontWeight: '800' }}>{label}</p>
        <div style={{ fontSize: '2rem', fontWeight: '900', color: color, marginBottom: '0.4rem' }}>{value}</div>
        <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', margin: 0 }}>{sub}</p>
    </div>
)

const MatrixDataCell = ({ label, value }) => (
    <div style={{ padding: '1.2rem', background: 'rgba(0,0,0,0.3)' }}>
        <p style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: '0 0 0.4rem 0', letterSpacing: '0.1em' }}>{label}</p>
        <p style={{ fontSize: '0.9rem', fontWeight: '800', color: '#fff', margin: 0 }}>{value}</p>
    </div>
)

export default CommandCenter
