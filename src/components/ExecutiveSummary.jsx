import React, { useMemo } from 'react'

const ExecutiveSummary = ({ projects = [], vendors = [], onNavigate }) => {
    const stats = useMemo(() => {
        const totalValue = projects.reduce((sum, p) => sum + (Number(p.clientFinancials?.totalValue) || 0), 0)
        const totalReceived = projects.reduce((sum, p) => {
            const received = (p.clientFinancials?.received || []).reduce((s, r) => s + (Number(r.amount) || 0), 0)
            return sum + received
        }, 0)
        const totalPayouts = projects.reduce((sum, p) => {
            const payouts = (p.payouts || []).reduce((s, r) => s + (Number(r.amount) || 0), 0)
            return sum + payouts
        }, 0)

        const vendorLiability = projects.reduce((sum, p) => sum + (Number(p.linkedVendorOrderValue) || 0), 0)
        const outstandingPayouts = vendorLiability - totalPayouts

        return {
            totalValue,
            totalReceived,
            totalPayouts,
            outstandingPayouts,
            projectCount: projects.length,
            avgReadiness: projects.length ? Math.round(projects.reduce((s, p) => s + (p.readiness || 0), 0) / projects.length) : 0,
            projectedMargin: totalValue > 0 ? Math.round(((totalValue - vendorLiability) / totalValue) * 100) : 0
        }
    }, [projects])

    const vendorRisk = useMemo(() => {
        const distribution = {}
        projects.forEach(p => {
            if (p.linkedVendorId) {
                distribution[p.linkedVendorId] = (distribution[p.linkedVendorId] || 0) + 1
            }
        })
        
        return Object.entries(distribution).map(([vid, count]) => {
            const v = vendors.find(v => String(v.id) === String(vid))
            return {
                id: vid,
                name: v?.name || 'Unknown',
                count,
                percentage: Math.round((count / projects.length) * 100)
            }
        }).sort((a, b) => b.count - a.count)
    }, [projects, vendors])

    const statusPipeline = useMemo(() => {
        const pipeline = {}
        projects.forEach(p => {
            pipeline[p.status] = (pipeline[p.status] || 0) + 1
        })
        return pipeline
    }, [projects])

    return (
        <div className="animate-fade-in" style={{ padding: '0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3.5rem', flexWrap: 'wrap', gap: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: 'clamp(1.8rem, 5vw, 3.2rem)', fontWeight: '900', margin: 0, letterSpacing: '-0.04em' }}>Strategic Command</h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.8rem', letterSpacing: '0.25em', fontSize: '0.7rem', textTransform: 'uppercase' }}>Founder Intelligence v5.5</p>
                </div>
                <div style={{ display: 'flex', gap: '2rem', textAlign: 'right' }}>
                    <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Global Health</div>
                        <div style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: '900', color: stats.avgReadiness > 70 ? 'var(--success)' : 'var(--accent-color)' }}>{stats.avgReadiness}%</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Active Loops</div>
                        <div style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: '900', color: 'var(--text-primary)' }}>{stats.projectCount}</div>
                    </div>
                </div>
            </div>

            {/* Macro Financial HUD */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                gap: '1.5rem', 
                marginBottom: '4rem' 
            }}>
                <MetricCard 
                    label="Portfolio Value" 
                    value={`₹${(stats.totalValue / 10000000).toFixed(2)}Cr`} 
                    subtext="View Project Central"
                    color="var(--accent-color)"
                    onClick={() => onNavigate('projects')}
                />
                <MetricCard 
                    label="Realized Revenue" 
                    value={`₹${(stats.totalReceived / 100000).toFixed(2)}L`} 
                    subtext="Cash-in-hand"
                    color="var(--success)"
                    onClick={() => onNavigate('projects')}
                />
                <MetricCard 
                    label="Vendor Liability" 
                    value={`₹${(stats.outstandingPayouts / 100000).toFixed(2)}L`} 
                    subtext="Remaining payout"
                    color="var(--danger)"
                    onClick={() => onNavigate('vendors')}
                />
                <MetricCard 
                    label="Operating Margin" 
                    value={`${stats.projectedMargin}%`} 
                    subtext="Tactical EBITDA"
                    color="var(--success)"
                    onClick={() => onNavigate('projects')}
                />
            </div>

            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
                gap: '2rem' 
            }}>
                {/* Vendor Concentration & Risk */}
                <div className="card" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)', background: 'var(--bg-secondary)' }}>
                    <h4 style={{ marginBottom: '2.5rem', fontSize: '0.8rem', letterSpacing: '0.2em', color: 'var(--accent-color)' }}>🛡️ VENDOR CONCENTRATION RISK</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {vendorRisk.map(v => (
                            <div key={v.id} onClick={() => onNavigate('vendors')} style={{ cursor: 'pointer' }} className="cinematic-hover">
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                                    <span style={{ fontWeight: '800', fontSize: '0.9rem' }}>{v.name}</span>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>{v.count} Sites | {v.percentage}%</span>
                                </div>
                                <div style={{ height: '6px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', position: 'relative', overflow: 'hidden' }}>
                                    <div style={{ 
                                        height: '100%', 
                                        width: `${v.percentage}%`, 
                                        background: v.percentage > 40 ? 'var(--danger)' : 'var(--accent-color)',
                                        borderRadius: '3px'
                                    }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pipeline Velocity */}
                <div className="card" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)', background: 'var(--bg-secondary)' }}>
                    <h4 style={{ marginBottom: '2.5rem', fontSize: '0.8rem', letterSpacing: '0.2em', color: 'var(--accent-color)' }}>📈 PIPELINE VELOCITY</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {Object.entries(statusPipeline).map(([status, count]) => (
                            <div 
                                key={status} 
                                onClick={() => onNavigate('projects')}
                                className="cinematic-hover"
                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem', background: 'var(--bg-accent)', borderRadius: '12px', border: '1px solid var(--border-color)', cursor: 'pointer' }}
                            >
                                <span style={{ fontSize: '0.8rem', fontWeight: '800' }}>{status.toUpperCase()}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <span style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--accent-color)' }}>{count}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

const MetricCard = ({ label, value, subtext, color, onClick }) => (
    <div 
        className="glass-card cinematic-hover" 
        onClick={onClick}
        style={{ padding: '2rem', cursor: 'pointer', border: '1px solid var(--border-color)', background: 'var(--bg-glass)' }}
    >
        <p style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '1rem', fontWeight: '800' }}>{label}</p>
        <div style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{value}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '6px', height: '6px', background: color, borderRadius: '50%' }}></span>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '600' }}>{subtext}</p>
        </div>
    </div>
)

export default ExecutiveSummary
