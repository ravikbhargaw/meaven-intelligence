import React, { useMemo } from 'react'

const ClientExperienceHub = ({ clientName, projects = [], onSelectProject, onBack }) => {
    // Aggregated Portfolio Stats
    const stats = useMemo(() => {
        const active = projects.filter(p => p.status !== 'Completed' && p.status !== 'Paused')
        return {
            totalSites: projects.length,
            activeSites: active.length,
            avgReadiness: projects.length ? Math.round(projects.reduce((s, p) => s + (p.readiness || 0), 0) / projects.length) : 0,
            daysToNextHandover: 12 // Simulated logic
        }
    }, [projects])

    return (
        <div className="client-experience-hub animate-fade-in" style={{ padding: '0.5rem 0' }}>
            {/* COMPACT TOP BAR */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '900', margin: 0 }}>{clientName} Hub</h2>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Live Site Intelligence Feed</p>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <CompactStat label="Portfolio Health" value={`${stats.avgReadiness}%`} color="var(--success)" />
                    <CompactStat label="Active Sites" value={stats.activeSites} color="var(--accent-color)" />
                    <div style={{ width: '1px', background: 'var(--border-color)', height: '30px' }} />
                    <button onClick={onBack} className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}>← Exit Portal</button>
                </div>
            </header>

            {/* HIGH-DENSITY GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: '1.2rem' }}>
                {projects.map(p => (
                    <ProjectCompactCard key={p.id} project={p} onSelectProject={onSelectProject} />
                ))}
            </div>
        </div>
    )
}

const ProjectCompactCard = ({ project, onSelectProject }) => {
    const isCompleted = project.status === 'Completed'
    const isPaused = project.status === 'Paused'
    const readiness = project.readiness || 0

    return (
        <div className="card cinematic-hover" style={{ 
            padding: '1.5rem', 
            background: 'var(--bg-secondary)', 
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.2rem'
        }}>
            {/* MINI HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800' }}>{project.name}</h3>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Status: <span style={{ color: isCompleted ? 'var(--success)' : 'var(--accent-color)', fontWeight: '700' }}>{project.status.toUpperCase()}</span></p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1rem', fontWeight: '900', color: 'var(--text-primary)' }}>{readiness}%</div>
                    <div style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Readiness</div>
                </div>
            </div>

            {/* COMPACT PROGRESS BAR */}
            <div style={{ height: '4px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                <div style={{ 
                    height: '100%', width: `${readiness}%`, background: 'var(--accent-color)', 
                    borderRadius: '2px', boxShadow: '0 0 10px var(--accent-glow)'
                }} />
            </div>

            {/* DATA STRIP (Side-by-side info) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'var(--bg-accent)', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div>
                    <p style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: '0 0 0.3rem 0' }}>🛡️ Partner Bench</p>
                    <p style={{ fontSize: '0.8rem', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>{project.linkedVendor || 'Certified Partner'}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: '0 0 0.3rem 0' }}>🗓️ Next Milestone</p>
                    <p style={{ fontSize: '0.8rem', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>29th April 2026</p>
                </div>
            </div>

            {/* ISOLATION FIREWALL HISTORY (Minimized) */}
            <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.6rem', color: 'var(--accent-color)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.8rem', fontWeight: '800' }}>Latest Site Updates</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {(() => {
                        const sensitiveKeywords = ['vendor', 'advance', 'paid', 'tactical', 'margin', 'rs.', 'profit', 'delay'];
                        const history = project.history?.filter(h => {
                            if (h.isClientVisible !== true) return false;
                            const content = `${h.title} ${h.detail}`.toLowerCase();
                            return !sensitiveKeywords.some(key => content.includes(key));
                        }).slice(0, 2) || []; // Only show top 2 for density

                        if (history.length === 0) return <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: 0 }}>Waiting for next site audit sync...</p>

                        return history.map(h => (
                            <div key={h.id} style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                                <div style={{ minWidth: '45px', fontSize: '0.6rem', color: 'var(--text-secondary)' }}>{h.date || 'Today'}</div>
                                <div style={{ fontSize: '0.75rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.title}</div>
                            </div>
                        ))
                    })()}
                </div>
            </div>

            {/* ACTION FOOTER */}
            <button 
                onClick={() => onSelectProject(project.id)}
                style={{ 
                    marginTop: '0.5rem', width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', 
                    borderRadius: '8px', padding: '0.6rem', fontSize: '0.75rem', color: 'var(--accent-color)', fontWeight: '700',
                    cursor: 'pointer', transition: 'all 0.2s'
                }}
            >
                EXPLORE DEEP DIVE →
            </button>
        </div>
    )
}

const CompactStat = ({ label, value, color }) => (
    <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>{label}</div>
        <div style={{ fontSize: '1.2rem', fontWeight: '900', color: color }}>{value}</div>
    </div>
)

export default ClientExperienceHub
