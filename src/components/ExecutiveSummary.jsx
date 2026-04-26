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
        <div className="animate-fade-in" style={{ padding: '1rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3.5rem' }}>
                <div>
                    <h2 style={{ fontSize: '3.2rem', fontWeight: '900', margin: 0, letterSpacing: '-0.04em' }}>Strategic Command Hub</h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.8rem', letterSpacing: '0.25em', fontSize: '0.75rem', textTransform: 'uppercase' }}>Founder Intelligence v5.2 Active</p>
                </div>
                <div style={{ display: 'flex', gap: '3rem', textAlign: 'right' }}>
                    <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Global Health</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: '900', color: stats.avgReadiness > 70 ? 'var(--success)' : 'var(--accent-color)' }}>{stats.avgReadiness}%</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Active Loops</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#fff' }}>{stats.projectCount}</div>
                    </div>
                </div>
            </div>

            {/* Macro Financial HUD */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem', marginBottom: '4rem' }}>
                <MetricCard 
                    label="Portfolio Value" 
                    value={`₹${(stats.totalValue / 10000000).toFixed(2)}Cr`} 
                    subtext="Click to view Project Central"
                    color="var(--accent-color)"
                    onClick={() => onNavigate('projects')}
                />
                <MetricCard 
                    label="Realized Revenue" 
                    value={`₹${(stats.totalReceived / 100000).toFixed(2)}L`} 
                    subtext="Cash-in-hand liquidity"
                    color="var(--success)"
                    onClick={() => onNavigate('projects')}
                />
                <MetricCard 
                    label="Vendor Liability" 
                    value={`₹${(stats.outstandingPayouts / 100000).toFixed(2)}L`} 
                    subtext="Remaining payout balance"
                    color="var(--danger)"
                    onClick={() => onNavigate('vendors')}
                />
                <MetricCard 
                    label="Operating Margin" 
                    value={`${stats.projectedMargin}%`} 
                    subtext="Gross Tactical EBITDA"
                    color="var(--success)"
                    onClick={() => onNavigate('projects')}
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '2.5rem' }}>
                {/* Vendor Concentration & Risk */}
                <div className="card" style={{ padding: '2.5rem', background: 'rgba(255,255,255,0.01)' }}>
                    <h4 style={{ marginBottom: '2.5rem', fontSize: '0.8rem', letterSpacing: '0.2em', color: 'var(--accent-color)' }}>🛡️ VENDOR CONCENTRATION & RISK ANALYSIS</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {vendorRisk.map(v => (
                            <div key={v.id} onClick={() => onNavigate('vendors')} style={{ cursor: 'pointer' }} className="cinematic-hover">
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                                    <span style={{ fontWeight: '800', fontSize: '1rem' }}>{v.name}</span>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '600' }}>{v.count} Projects | {v.percentage}% Load</span>
                                </div>
                                <div style={{ height: '6px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', position: 'relative', overflow: 'hidden' }}>
                                    <div style={{ 
                                        height: '100%', 
                                        width: `${v.percentage}%`, 
                                        background: v.percentage > 40 ? 'var(--danger)' : 'var(--accent-color)',
                                        borderRadius: '3px',
                                        boxShadow: v.percentage > 40 ? '0 0 10px var(--danger)' : 'none'
                                    }}></div>
                                </div>
                                {v.percentage > 40 && <p style={{ fontSize: '0.6rem', color: 'var(--danger)', marginTop: '0.6rem', fontWeight: '900', textTransform: 'uppercase' }}>⚠️ CRITICAL CONCENTRATION WARNING</p>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pipeline Velocity */}
                <div className="card" style={{ padding: '2.5rem', background: 'rgba(255,255,255,0.01)' }}>
                    <h4 style={{ marginBottom: '2.5rem', fontSize: '0.8rem', letterSpacing: '0.2em', color: 'var(--accent-color)' }}>📈 PIPELINE VELOCITY</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        {Object.entries(statusPipeline).map(([status, count]) => (
                            <div 
                                key={status} 
                                onClick={() => onNavigate('projects')}
                                className="cinematic-hover"
                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}
                            >
                                <span style={{ fontSize: '0.9rem', fontWeight: '800', letterSpacing: '0.05em' }}>{status.toUpperCase()}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                                    <span style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--accent-color)' }}>{count}</span>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Units</span>
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
        style={{ padding: '2.5rem', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)', background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 100%)' }}
    >
        <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '1.2rem', fontWeight: '800' }}>{label}</p>
        <div style={{ fontSize: '2.8rem', fontWeight: '900', color: '#fff', marginBottom: '0.8rem', letterSpacing: '-0.02em' }}>{value}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '8px', height: '8px', background: color, borderRadius: '50%' }}></span>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '600' }}>{subtext}</p>
        </div>
    </div>
)

export default ExecutiveSummary
