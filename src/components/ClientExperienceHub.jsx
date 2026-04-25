import { useState } from 'react'

const ClientExperienceHub = ({ clientName, projects = [], onSelectProject }) => {
    const clientProjects = projects.filter(p => p.client === clientName)

    return (
        <div className="client-experience-hub animate-fade-in" style={{ padding: '2rem 0' }}>
            <div style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.8rem', color: 'var(--accent-color)', margin: 0 }}>{clientName} | Experience Hub</h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Portfolio Overview: {clientProjects.length} Active Execution Loops</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '2rem' }}>
                {clientProjects.map(p => {
                    // Simple readiness calc for bird's eye
                    const readiness = 85 // Fallback
                    const status = p.milestones?.siteReadiness ? 'In Progress' : 'Initial Audit'
                    
                    return (
                        <div key={p.id} className="card project-summary-card" style={{ 
                            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                            padding: '2rem', borderRadius: '16px', cursor: 'pointer', transition: 'var(--transition)'
                        }} onClick={() => onSelectProject(p.id)}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.4rem' }}>{p.name}</h3>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--accent-color)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{status}</span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>{readiness}%</div>
                                    <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Site Readiness</span>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{ height: '6px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', position: 'relative' }}>
                                    <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${readiness}%`, background: 'var(--accent-color)', borderRadius: '3px', boxShadow: '0 0 10px var(--accent-color)' }} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                                    <p style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: '0 0 0.3rem 0' }}>Measurement</p>
                                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '600' }}>{p.milestones?.measurementDate || 'TBD'}</p>
                                </div>
                                <div style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                                    <p style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: '0 0 0.3rem 0' }}>Installation</p>
                                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '600' }}>{p.milestones?.siteReadiness || 'TBD'}</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                    Recent: {p.history?.[p.history.length - 1]?.title || 'Audit Sync'}
                                </p>
                                <span style={{ color: 'var(--accent-color)', fontSize: '0.8rem', fontWeight: '600' }}>Deep Dive →</span>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default ClientExperienceHub
