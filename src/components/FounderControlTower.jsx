import React, { useState, useMemo } from 'react';

const FounderControlTower = ({ projects, vendors, onNavigate }) => {
    
    // Derived State for Operational Intelligence
    const { priorities, criticalAlerts, approvals, vendorRisks, paymentRisks, healthOverview } = useMemo(() => {
        let priorities = [];
        let criticalAlerts = [];
        let approvals = [];
        let vendorRisks = [];
        let paymentRisks = [];
        let healthOverview = { healthy: [], attention: [], highRisk: [], blocked: [] };

        const now = new Date();

        projects?.forEach(p => {
            // Health Assessment Logic (Mocked AI Logic)
            let riskScore = 0;
            const daysSinceLastUpdate = p.history?.length ? Math.floor((now - new Date(p.history[0].timestamp || p.history[0].date)) / (1000 * 60 * 60 * 24)) : 0;
            
            if (daysSinceLastUpdate > 2) riskScore += 2;
            const linkedVendor = vendors?.find(v => v && (v.contracts || []).some(c => c.projectName === p.name && (c.status === 'Active' || !c.status)));

            if (p.stageIndex > 1 && !linkedVendor) riskScore += 3;

            // Health Overview
            if (riskScore === 0) healthOverview.healthy.push(p.name);
            else if (riskScore < 3) healthOverview.attention.push(p.name);
            else if (riskScore >= 3) healthOverview.highRisk.push(p.name);

            // Critical Alerts
            if (riskScore >= 3) {
                criticalAlerts.push({
                    id: p.id,
                    name: p.name,
                    stage: p.stageIndex || 1,
                    daysDelayed: daysSinceLastUpdate,
                    blocker: !linkedVendor ? 'No Vendor Assigned' : 'Execution Inactive',
                    vendorName: linkedVendor ? linkedVendor.name : 'None',
                    riskScore: riskScore
                });
            }

            // Vendor Updates (Approvals)
            p.vendorUpdates?.forEach(u => {
                if (u.status === 'pending_approval') {
                    approvals.push({
                        id: u.id,
                        type: u.type === 'risk' ? 'Risk Flag' : 'Site Update',
                        projectName: p.name,
                        vendorName: linkedVendor ? linkedVendor.name : 'Unknown',
                        time: new Date(u.timestamp || u.date).toLocaleDateString(),
                        urgency: u.severity || 'Medium'
                    });
                    
                    if (u.severity === 'Critical' || u.severity === 'High') {
                        priorities.push({
                            id: `upd-${u.id}`,
                            projectName: p.name,
                            vendorName: linkedVendor ? linkedVendor.name : 'Unknown',
                            priority: u.severity,
                            action: 'Pending Update Approval',
                            delay: 'Action Required',
                        });
                    }
                }
            });

            // Payment Risks
            const revenue = p.clientFinancials?.totalValue || 0;
            const collected = p.clientFinancials?.received?.reduce((acc, curr) => acc + curr.amount, 0) || 0;
            if (revenue > 0 && collected < revenue && p.stageIndex >= 4) {
                paymentRisks.push({
                    id: p.id,
                    projectName: p.name,
                    pendingAmount: revenue - collected,
                    stage: p.stageIndex,
                    riskLevel: p.stageIndex >= 6 ? 'Critical' : 'High'
                });
            }
        });

        // Vendor Risks
        vendors?.forEach(v => {
            const activeProjects = projects?.filter(p => String(p.vendorId) === String(v.id))?.length || 0;
            const metricsAvg = v.metrics ? (v.metrics.price + v.metrics.speed + v.metrics.precision + v.metrics.communication) / 4 : 50;
            if (metricsAvg < 60 && activeProjects > 0) {
                vendorRisks.push({
                    id: v.id,
                    name: v.name,
                    activeProjects,
                    score: metricsAvg,
                    trend: 'Declining',
                    action: 'Review Performance'
                });
            }
        });

        // Sort Priorities
        const order = { 'Critical': 1, 'High': 2, 'Medium': 3, 'Low': 4 };
        priorities.sort((a, b) => order[a.priority] - order[b.priority]);

        return { priorities, criticalAlerts, approvals, vendorRisks, paymentRisks, healthOverview };
    }, [projects, vendors]);

    const PriorityBadge = ({ level }) => {
        const colors = {
            'Critical': 'var(--danger)',
            'High': '#FF9500',
            'Medium': 'var(--accent-color)',
            'Low': 'var(--success)'
        };
        return (
            <span style={{ 
                background: `color-mix(in srgb, ${colors[level]} 15%, transparent)`, 
                color: colors[level], 
                padding: '0.2rem 0.5rem', 
                borderRadius: '4px', 
                fontSize: '0.65rem', 
                fontWeight: '900',
                textTransform: 'uppercase',
                border: `1px solid ${colors[level]}`
            }}>
                {level}
            </span>
        );
    };

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
            {/* Page Header */}
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>🎛️</span>
                    <h2 style={{ fontSize: '1.6rem', fontWeight: '900', margin: 0, letterSpacing: '-0.02em' }}>Founder Control Tower</h2>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '600px', margin: 0 }}>
                    Real-time execution priority system. Fast scanning, zero clutter, immediate action.
                </p>
            </div>

            {/* SECTION 1: TODAY'S OPERATIONAL PRIORITIES */}
            <div style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger)', boxShadow: '0 0 10px var(--danger)' }}></div>
                    <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: '800', letterSpacing: '0.1em', color: 'var(--text-primary)', textTransform: 'uppercase' }}>TODAY'S OPERATIONAL PRIORITIES</h3>
                </div>
                {priorities.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        {priorities.map((item, idx) => (
                            <div key={idx} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                                    <PriorityBadge level={item.priority} />
                                    <div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{item.action}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            <span style={{ color: 'var(--accent-color)', fontWeight: '600' }}>{item.projectName}</span> • {item.vendorName} • {item.delay}
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => onNavigate('projects')} style={{ background: 'var(--accent-color)', color: '#000', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer' }}>
                                    Resolve →
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '2rem', textAlign: 'center' }}>
                        <span style={{ fontSize: '1.5rem' }}>☕</span>
                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>No critical priorities pending today.</p>
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
                {/* SECTION 2: CRITICAL PROJECT ALERTS */}
                <div>
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.1em', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Critical Project Alerts</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        {criticalAlerts.length > 0 ? criticalAlerts.map(alert => (
                            <div key={alert.id} style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(255, 69, 58, 0.2)', borderRadius: '10px', padding: '1rem', borderLeft: '3px solid var(--danger)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: '800' }}>{alert.name}</span>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--danger)', fontWeight: '800', background: 'rgba(255, 69, 58, 0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>Score: {alert.riskScore}</span>
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                    <div><span style={{ opacity: 0.6 }}>Blocker:</span> <span style={{ color: 'var(--text-primary)' }}>{alert.blocker}</span></div>
                                    <div><span style={{ opacity: 0.6 }}>Delay:</span> <span style={{ color: 'var(--text-primary)' }}>{alert.daysDelayed} days</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                                        <span><span style={{ opacity: 0.6 }}>Partner:</span> {alert.vendorName}</span>
                                        <button onClick={() => onNavigate('projects')} style={{ background: 'none', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.65rem', padding: '0.2rem 0.6rem', borderRadius: '4px', cursor: 'pointer' }}>Open Hub</button>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div style={{ padding: '1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>All projects stable.</div>
                        )}
                    </div>
                </div>

                {/* SECTION 3: APPROVAL QUEUE */}
                <div>
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.1em', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Approval Queue</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        {approvals.length > 0 ? approvals.map(app => (
                            <div key={app.id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent-color)' }}>{app.type}</span>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{app.time}</span>
                                </div>
                                <div style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.2rem' }}>{app.projectName}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.8rem' }}>Vendor: {app.vendorName}</div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={() => onNavigate('projects')} style={{ flex: 1, background: 'var(--accent-color)', color: '#000', border: 'none', padding: '0.3rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: '800', cursor: 'pointer' }}>Review</button>
                                </div>
                            </div>
                        )) : (
                            <div style={{ padding: '1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>No pending approvals.</div>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
                {/* SECTION 4: VENDOR RISK MONITOR */}
                <div>
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.1em', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Vendor Risk Monitor</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        {vendorRisks.length > 0 ? vendorRisks.map(v => (
                            <div key={v.id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: '800' }}>{v.name}</span>
                                    <span style={{ fontSize: '0.65rem', color: '#FF9500', fontWeight: '800' }}>{v.score}%</span>
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Active Sites: {v.activeProjects}</span>
                                    <span>{v.trend} ↘</span>
                                </div>
                            </div>
                        )) : (
                            <div style={{ padding: '1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Vendor bench is nominal.</div>
                        )}
                    </div>
                </div>

                {/* SECTION 5: PAYMENT & COLLECTION RISKS */}
                <div>
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.1em', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Collection Risks</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        {paymentRisks.length > 0 ? paymentRisks.map(p => (
                            <div key={p.id} style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(255, 69, 58, 0.2)', borderRadius: '10px', padding: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: '800' }}>{p.projectName}</span>
                                    <span style={{ fontSize: '0.65rem', color: p.riskLevel === 'Critical' ? 'var(--danger)' : '#FF9500', fontWeight: '800' }}>{p.riskLevel}</span>
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--danger)', fontWeight: '700' }}>₹{(p.pendingAmount/100000).toFixed(2)}L <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: '400' }}>EXPOSURE</span></div>
                            </div>
                        )) : (
                            <div style={{ padding: '1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>No immediate exposure.</div>
                        )}
                    </div>
                </div>

                {/* SECTION 6: SNAG & QC ESCALATIONS */}
                <div>
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.1em', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>QC Escalations</h3>
                    <div style={{ padding: '1.5rem', background: 'var(--bg-secondary)', border: '1px dashed var(--border-color)', borderRadius: '10px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        No unresolved critical QC flags.
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }} className="stack-on-mobile">
                {/* SECTION 7: TODAY'S FOLLOW-UPS */}
                <div>
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.1em', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Action List</h3>
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem 0', borderBottom: '1px solid var(--border-color)' }}>
                            <input type="checkbox" style={{ width: '16px', height: '16px', accentColor: 'var(--accent-color)', cursor: 'pointer' }} />
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Review pending layout approvals for Site A</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem 0' }}>
                            <input type="checkbox" style={{ width: '16px', height: '16px', accentColor: 'var(--accent-color)', cursor: 'pointer' }} />
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Follow up on overdue collection for Site B</span>
                        </div>
                    </div>
                </div>

                {/* SECTION 8: PROJECT HEALTH OVERVIEW */}
                <div>
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.1em', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Portfolio Health Matrix</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ background: 'rgba(50, 215, 75, 0.05)', border: '1px solid rgba(50, 215, 75, 0.2)', borderRadius: '12px', padding: '1.2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }} onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
                            <span style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--success)' }}>{healthOverview.healthy.length}</span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700', marginTop: '0.3rem' }}>Healthy</span>
                            {healthOverview.healthy.length > 0 && <div style={{ fontSize: '0.55rem', color: 'var(--success)', marginTop: '0.5rem', textAlign: 'center', opacity: 0.8 }}>{healthOverview.healthy.slice(0, 3).join(', ')}{healthOverview.healthy.length > 3 ? '...' : ''}</div>}
                        </div>
                        <div style={{ background: 'rgba(255, 149, 0, 0.05)', border: '1px solid rgba(255, 149, 0, 0.2)', borderRadius: '12px', padding: '1.2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }} onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
                            <span style={{ fontSize: '1.8rem', fontWeight: '900', color: '#FF9500' }}>{healthOverview.attention.length}</span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700', marginTop: '0.3rem' }}>Attention Needed</span>
                            {healthOverview.attention.length > 0 && <div style={{ fontSize: '0.55rem', color: '#FF9500', marginTop: '0.5rem', textAlign: 'center', opacity: 0.8 }}>{healthOverview.attention.slice(0, 3).join(', ')}{healthOverview.attention.length > 3 ? '...' : ''}</div>}
                        </div>
                        <div style={{ background: 'rgba(255, 69, 58, 0.05)', border: '1px solid rgba(255, 69, 58, 0.2)', borderRadius: '12px', padding: '1.2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }} onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
                            <span style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--danger)' }}>{healthOverview.highRisk.length}</span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700', marginTop: '0.3rem' }}>High Risk</span>
                            {healthOverview.highRisk.length > 0 && <div style={{ fontSize: '0.55rem', color: 'var(--danger)', marginTop: '0.5rem', textAlign: 'center', opacity: 0.8 }}>{healthOverview.highRisk.slice(0, 3).join(', ')}{healthOverview.highRisk.length > 3 ? '...' : ''}</div>}
                        </div>
                        <div style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--text-secondary)' }}>{healthOverview.blocked.length}</span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700', marginTop: '0.3rem' }}>Blocked</span>
                            {healthOverview.blocked.length > 0 && <div style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', marginTop: '0.5rem', textAlign: 'center', opacity: 0.8 }}>{healthOverview.blocked.slice(0, 3).join(', ')}{healthOverview.blocked.length > 3 ? '...' : ''}</div>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FounderControlTower;
