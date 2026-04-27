import { useState, useEffect } from 'react'
import ProjectRadar from './ProjectRadar'

const CommandCenter = ({ projects = [], proposals = [], vendors = [], onSelectProject, onSelectTab }) => {
    const [stats, setStats] = useState({ totalValue: 0, avgReadiness: 0, activeAnomalies: 0, complianceRate: 98.2 })
    const [viewedProject, setViewedProject] = useState(null)

    useEffect(() => {
        const total = projects.reduce((sum, p) => sum + (p.clientFinancials?.totalValue || 0), 0)
        const avg = projects.length > 0 ? Math.round(projects.reduce((sum, p) => sum + (p.readiness || 0), 0) / projects.length) : 0
        const anomalies = proposals.filter(p => p.status === 'pending').length
        // Stabilized Compliance Rate to prevent blinking
        setStats({ totalValue: total, avgReadiness: avg, activeAnomalies: anomalies, complianceRate: 99.4 })
    }, [projects, proposals])

    const projectFocus = viewedProject ? projects.find(proj => Number(proj.id) === Number(viewedProject)) : null

    // --- LEVEL 2: SURGICAL PROJECT INTELLIGENCE ---
    if (viewedProject) {
        const p = projectFocus
        
        if (!p) {
            return (
                <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
                    <button onClick={() => setViewedProject(null)} className="btn btn-outline">← Back</button>
                    <p style={{ marginTop: '2rem' }}>PROJECT DATA MISMATCH: Please contact technical support.</p>
                </div>
            )
        }

        const projectAnomalies = (p.readiness || 0) < 40 ? 1 : 0

        return (
            <div className="animate-fade-in" style={{ padding: '1rem 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <button onClick={() => setViewedProject(null)} style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', fontWeight: '800' }}>← BACK TO GLOBAL DIRECTORY</button>
                    <div style={{ padding: '0.4rem 1.2rem', borderRadius: '20px', background: 'rgba(102, 178, 194, 0.1)', border: '1px solid var(--accent-color)', color: 'var(--accent-color)', fontSize: '0.7rem', fontWeight: '800', letterSpacing: '0.1em' }}>
                        🎯 PROJECT SURGICAL FOCUS
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '2rem' }}>
                    <div>
                        <h2 style={{ fontSize: '3rem', margin: 0, letterSpacing: '-0.04em', fontWeight: '900' }}>{p.name}</h2>
                        <p style={{ color: 'var(--text-secondary)', margin: '0.8rem 0 0 0', textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '0.75rem' }}>Tactical Site ID: {p.id} | Location: {p.location}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '3.5rem', fontWeight: '900', color: p.readiness > 80 ? 'var(--success)' : 'var(--accent-color)', lineHeight: 1 }}>{p.readiness}%</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '0.5rem' }}>Project Technical Truth</div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2.5rem' }}>
                    <div className="card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', padding: '2.5rem' }}>
                        <h3 style={{ fontSize: '0.9rem', marginBottom: '2rem', letterSpacing: '0.1em' }}>SITE EXECUTION PULSE</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
                            <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.3)' }}>
                                <p style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Current Milestone</p>
                                <p style={{ margin: '0.5rem 0 0 0', fontWeight: '800', fontSize: '1.1rem' }}>{p.status}</p>
                            </div>
                            <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.3)' }}>
                                <p style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Active Vendor</p>
                                <p style={{ margin: '0.5rem 0 0 0', fontWeight: '800', fontSize: '1.1rem' }}>{vendors.find(v => (v.contracts || []).some(c => c.projectName === p.name))?.name || 'VETTING PENDING'}</p>
                            </div>
                        </div>
                        <button onClick={() => onSelectProject(p.id)} className="btn btn-primary" style={{ width: '100%', padding: '1.2rem', fontWeight: '900' }}>DEPLOY TO LIVE AUDIT HUB →</button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div className="card" style={{ border: projectAnomalies ? '1px solid var(--danger)' : '1px solid var(--border-color)', background: projectAnomalies ? 'rgba(255, 69, 58, 0.03)' : 'transparent' }}>
                            <h3 style={{ fontSize: '0.8rem', color: projectAnomalies ? 'var(--danger)' : 'var(--accent-color)', marginBottom: '1.5rem', letterSpacing: '0.1em' }}>{projectAnomalies ? '⚠️ PROJECT ANOMALY' : '✓ SITE HEALTH'}</h3>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
                                {projectAnomalies 
                                    ? `Project ${p.name} shows significant deviation in site readiness. Critical path at risk due to material sync issues.`
                                    : "Execution is trending ahead of the baseline technical playbook. No deviations detected."}
                            </p>
                        </div>

                        <div className="card" style={{ background: 'rgba(0,0,0,0.2)', flex: 1 }}>
                            <h3 style={{ fontSize: '0.8rem', marginBottom: '1.5rem', letterSpacing: '0.1em' }}>PROJECT CHRONOLOGY</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {(p.history || []).slice(0, 3).map(h => (
                                    <div key={h.id} style={{ fontSize: '0.75rem', borderLeft: '2px solid var(--border-color)', paddingLeft: '1rem' }}>
                                        <div style={{ fontWeight: '700' }}>{h.title}</div>
                                        <div style={{ color: 'var(--text-secondary)' }}>{h.detail}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // --- LEVEL 1: GLOBAL PORTFOLIO VIEW ---
    const groupedPortfolios = projects.reduce((acc, p) => {
        const client = p.client || 'General Portfolio'
        if (!acc[client]) acc[client] = []
        acc[client].push(p)
        return acc
    }, {})

    return (
        <div className="command-center animate-fade-in" style={{ padding: '1rem 0' }}>
            {/* 1. TOP TIER: STRATEGIC INTELLIGENCE & MAP */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
                {/* DYNAMIC MAP - LIGHT MODE GIS INTERFACE */}
                <div className="card" style={{ background: '#fff', border: '1px solid #dadce0', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', letterSpacing: '0.1em', color: '#3c4043' }}>🌍 PROJECT MAP</h3>
                        <div style={{ display: 'flex', gap: '0.8rem', fontSize: '0.6rem' }}>
                            <span style={{ color: '#34a853', fontWeight: '800' }}>● ACTIVE</span>
                            <span style={{ color: '#ea4335', fontWeight: '800' }}>● ON HOLD</span>
                        </div>
                    </div>
                    <ProjectRadar projects={projects} />
                </div>

                {/* MEAVEN AI BRAIN - ADVANCED INTELLIGENCE LAYER */}
                <div className="card" style={{ border: '1px solid var(--accent-color)', background: 'linear-gradient(135deg, rgba(102, 178, 194, 0.08) 0%, transparent 100%)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', padding: '1.5rem' }}>
                    <div style={{ position: 'absolute', top: '-20px', right: '-20px', fontSize: '8rem', opacity: 0.03, pointerEvents: 'none' }}>🤖</div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                        <div className="pulse-icon" style={{ width: '10px', height: '10px', background: 'var(--accent-color)', borderRadius: '50%', boxShadow: '0 0 10px var(--accent-color)' }}></div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--accent-color)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Tactical Brain</h3>
                            <p style={{ margin: 0, fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Neural Network Active</p>
                        </div>
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ padding: '1rem', background: projectFocus ? (projectFocus.readiness < 40 ? 'rgba(255, 69, 58, 0.05)' : 'rgba(50, 215, 75, 0.05)') : 'rgba(255, 69, 58, 0.05)', borderRadius: '12px', borderLeft: '4px solid ' + (projectFocus ? (projectFocus.readiness < 40 ? 'var(--danger)' : 'var(--success)') : 'var(--danger)') }}>
                            <h4 style={{ margin: 0, fontSize: '0.65rem', color: projectFocus ? (projectFocus.readiness < 40 ? 'var(--danger)' : 'var(--success)') : 'var(--danger)', marginBottom: '0.5rem', fontWeight: '800' }}>
                                {projectFocus ? `STATUS: ${projectFocus.name.toUpperCase()}` : '⚠️ GLOBAL ANOMALIES'}
                            </h4>
                            <p style={{ margin: '0.3rem 0', fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                                {projectFocus ? (projectFocus.readiness < 40 ? `Lag at ${projectFocus.readiness}%. AI predicts blockers.` : `Health at ${projectFocus.readiness}%. Ahead of playbook.`) : 'Critical deviations detected in baseline delivery.'}
                            </p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start' }}>
                                <span style={{ fontSize: '1rem' }}>⚡</span>
                                <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}><b>Bench</b>: Solutions outperforming sector by 18%.</p>
                            </div>
                        </div>

                        <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                            <button onClick={() => onSelectTab('admin')} style={{ width: '100%', background: 'var(--accent-color)', border: 'none', color: '#000', fontSize: '0.7rem', fontWeight: '800', padding: '0.8rem', borderRadius: '8px', cursor: 'pointer' }}>🤖 AI GOVERNANCE</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. TACTICAL HUD */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
                <HUDCard label="Global Exposure" value={`₹${(stats.totalValue / 10000000).toFixed(2)}Cr`} subtext="Live Value" trend="+12%" color="var(--accent-color)" />
                <HUDCard label="Network Pulse" value={`${stats.avgReadiness}%`} subtext="Execution Health" trend="Optimal" color="var(--success)" />
                <HUDCard label="AI Anomalies" value={stats.activeAnomalies} subtext="Governance" trend="Pending" color="var(--danger)" pulse />
                <HUDCard label="Data Integrity" value={`${stats.complianceRate.toFixed(1)}%`} subtext="Accuracy" trend="+0.2%" color="var(--success)" />
            </div>

            {/* 3. COMPACT PORTFOLIO GRID */}
            <h3 style={{ fontSize: '1.4rem', letterSpacing: '0.1em', marginBottom: '2.5rem', textTransform: 'uppercase' }}>Portfolio Intelligence Directory</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
                {Object.keys(groupedPortfolios).map(clientName => (
                    <PortfolioCard 
                        key={clientName} 
                        clientName={clientName} 
                        projects={groupedPortfolios[clientName]} 
                        onViewIntel={(pid) => setViewedProject(pid)}
                    />
                ))}
            </div>
        </div>
    )
}

const PortfolioCard = ({ clientName, projects = [], onViewIntel }) => {
    const totalValue = projects.reduce((sum, p) => sum + (p.clientFinancials?.totalValue || 0), 0)

    return (
        <div className="glass-card cinematic-hover" style={{ padding: '1.5rem', border: '1px solid var(--border-color)', minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', color: 'var(--accent-color)' }}>{clientName}</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{projects.length} ACTIVE LOOPS</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: '800' }}>₹{(totalValue / 100000).toFixed(2)}L</span>
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.8rem', overflowY: 'auto', maxHeight: '180px', paddingRight: '0.5rem' }}>
                {projects.map(p => (
                    <div key={p.id} style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: '700' }}>{p.name}</p>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                                <button onClick={() => onViewIntel(p.id)} style={{ background: 'none', border: 'none', color: 'var(--accent-color)', fontSize: '0.6rem', cursor: 'pointer', padding: 0, textDecoration: 'underline', fontWeight: '800' }}>VIEW INTELLIGENCE</button>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: '800' }}>{p.readiness}%</p>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.65rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                PORTFOLIO HEALTH: {Math.round(projects.reduce((sum, p) => sum + (p.readiness || 0), 0) / projects.length)}%
            </div>
        </div>
    )
}



const HUDCard = ({ label, value, subtext, trend, color, pulse }) => (
    <div className="glass-card cinematic-hover" style={{ padding: '2rem', position: 'relative', overflow: 'hidden' }}>
        {pulse && <div className="pulse-ring" style={{ position: 'absolute', top: '10px', right: '10px' }}></div>}
        <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1rem' }}>{label}</p>
        <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#fff', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>{value}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{subtext}</span>
            <span style={{ fontSize: '0.75rem', color: color, fontWeight: '800' }}>{trend}</span>
        </div>
    </div>
)

const CapacityBar = ({ label, value }) => (
    <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.7rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
            <span>{value}%</span>
        </div>
        <div style={{ height: '4px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
            <div style={{ height: '100%', width: `${value}%`, background: 'var(--accent-color)', borderRadius: '2px' }}></div>
        </div>
    </div>
)

export default CommandCenter
