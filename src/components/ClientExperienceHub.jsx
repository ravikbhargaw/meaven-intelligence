import { useState } from 'react'

const ClientExperienceHub = ({ clientName, projects = [], onSelectProject, onBack }) => {
    const clientProjects = projects.filter(p => p.client === clientName || (!clientName && !p.client))
    
    // Categorize Projects
    const activeProjects = clientProjects.filter(p => p.status === 'In Progress')
    const completedProjects = clientProjects.filter(p => p.status === 'Completed')
    const onHoldProjects = clientProjects.filter(p => p.status === 'On Hold')

    // Partnership Metadata (Simulated)
    const partnershipStarted = "Feb 2024"
    const totalSqFt = (clientProjects.length * 1250).toLocaleString() // Dummy calc
    const precisionScore = 99.8

    return (
        <div className="client-experience-hub animate-fade-in" style={{ 
            padding: '1rem 0',
            position: 'relative',
            zIndex: 1
        }}>
            {/* BACKGROUND DECORATION */}
            <div style={{
                position: 'fixed',
                top: 0,
                right: 0,
                width: '60%',
                height: '100%',
                backgroundImage: 'url("/experience_hub_background.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: 0.12,
                zIndex: -1,
                maskImage: 'linear-gradient(to left, rgba(0,0,0,1), transparent)',
                pointerEvents: 'none'
            }} />

            {/* PARTNERSHIP HEADER */}
            <header style={{ marginBottom: '5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }} className="animate-slide-up">
                <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
                    <div style={{ 
                        width: '100px', 
                        height: '100px', 
                        borderRadius: '24px', 
                        background: 'linear-gradient(135deg, var(--accent-color) 0%, #fff 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '3rem',
                        fontWeight: '900',
                        color: '#000',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 60px var(--accent-glow)',
                        border: '1px solid rgba(255,255,255,0.4)'
                    }}>
                        {clientName?.charAt(0) || 'M'}
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1rem' }}>
                            <h2 className="text-gradient" style={{ fontSize: '4rem', margin: 0, letterSpacing: '-0.05em', fontWeight: '900' }}>
                                {clientName || 'General Portfolio'}
                            </h2>
                            <div style={{ 
                                padding: '0.5rem 1rem', 
                                border: '1px solid var(--success)',
                                color: 'var(--success)', 
                                borderRadius: '40px', 
                                fontSize: '0.75rem', 
                                fontWeight: '800',
                                letterSpacing: '0.1em'
                            }}>
                                PLATINUM PARTNER
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '3rem', color: 'var(--text-secondary)', fontSize: '1rem' }}>
                            <span>🤝 Partnering since <b>{partnershipStarted}</b></span>
                            <span>🏗️ <b>{totalSqFt}</b> sq.ft. executed</span>
                            <span>⭐ <b>{clientProjects.length}</b> Strategic Loops</span>
                        </div>
                    </div>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                    <button 
                        onClick={onBack}
                        className="btn btn-outline cinematic-hover"
                        style={{ 
                            padding: '1rem 2rem', 
                            fontSize: '0.9rem', 
                            borderRadius: '40px',
                            color: 'var(--accent-color)',
                            borderColor: 'var(--accent-color)',
                            fontWeight: '700',
                        }}
                    >
                        ← Switch Client
                    </button>
                </div>
            </header>

            {/* AI PORTFOLIO PULSE - THE EXECUTIVE SNAPSHOT */}
            <div className="glass-card-heavy animate-slide-up" style={{ 
                padding: '3rem', 
                marginBottom: '4rem', 
                border: '1px solid var(--accent-color)',
                background: 'linear-gradient(135deg, rgba(102, 178, 194, 0.05) 0%, rgba(0,0,0,0) 100%)',
                display: 'grid',
                gridTemplateColumns: '1.5fr 1fr',
                gap: '4rem',
                alignItems: 'center'
            }}>
                <div>
                    <h3 style={{ fontSize: '0.8rem', color: 'var(--accent-color)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '1rem' }}>MI Intelligence Pulse</h3>
                    <h4 style={{ fontSize: '2.5rem', margin: 0, fontWeight: '800', lineHeight: 1.1 }}>Global Execution Health is <span style={{ color: 'var(--success)' }}>Optimal</span></h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: '1.5rem', lineHeight: '1.6' }}>
                        Meaven AI has verified <b>142 technical parameters</b> across your current portfolio. 
                        Zero critical path delays detected. Predicted project completion remains 12 days ahead of institutional average.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '2rem', justifyContent: 'flex-end' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', fontWeight: '900', color: '#fff' }}>98%</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Technical Accuracy</div>
                    </div>
                    <div style={{ width: '1px', height: '60px', background: 'var(--border-color)' }}></div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', fontWeight: '900', color: 'var(--success)' }}>12d</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Time Gain</div>
                    </div>
                </div>
            </div>

            {/* STRATEGIC KPI GRID */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(4, 1fr)', 
                gap: '2rem', 
                marginBottom: '6rem' 
            }} className="animate-slide-up">
                <KPICard 
                    label="Technical Risk Rating" 
                    value="AAA" 
                    subtext="Institutional Grade Audit" 
                    icon="🛡️" 
                />
                <KPICard 
                    label="Decision Intelligence" 
                    value="Real-Time" 
                    subtext="Zero Reporting Lag" 
                    icon="⚡" 
                />
                <KPICard 
                    label="Audit Coverage" 
                    value="100%" 
                    subtext="Full Lifecycle Visibility" 
                    icon="🌐" 
                />
                <KPICard 
                    label="Global Sync" 
                    value="Active" 
                    subtext="Playbook Synchronized" 
                    icon="🔄" 
                />
            </div>

            {/* ACTIVE LOOPS SECTION */}
            <section style={{ marginBottom: '5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                    <h3 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        Active Execution Loops <span style={{ color: 'var(--accent-color)', marginLeft: '0.5rem' }}>({activeProjects.length})</span>
                    </h3>
                    <div style={{ height: '1px', flex: 1, background: 'linear-gradient(to right, var(--border-color), transparent)', marginLeft: '2rem' }}></div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(500px, 1fr))', gap: '2.5rem' }}>
                    {activeProjects.map((p, idx) => (
                        <ProjectExecutiveCard key={p.id} project={p} index={idx} onClick={() => onSelectProject(p.id)} />
                    ))}
                </div>
            </section>

            {/* STRATEGIZING / ON HOLD SECTION */}
            {onHoldProjects.length > 0 && (
                <section style={{ marginBottom: '5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                        <h3 style={{ fontSize: '1.4rem', color: 'var(--text-secondary)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                            Strategizing & Paused <span style={{ color: 'var(--danger)', marginLeft: '0.5rem' }}>({onHoldProjects.length})</span>
                        </h3>
                        <div style={{ height: '1px', flex: 1, background: 'linear-gradient(to right, var(--border-color), transparent)', marginLeft: '2rem' }}></div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(500px, 1fr))', gap: '2.5rem' }}>
                        {onHoldProjects.map(p => (
                            <ProjectExecutiveCard key={p.id} project={p} onClick={() => onSelectProject(p.id)} isPaused />
                        ))}
                    </div>
                </section>
            )}

            {/* HALL OF FAME / COMPLETED SECTION */}
            <section style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                    <h3 style={{ fontSize: '1.4rem', color: 'var(--text-secondary)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        Execution Hall of Fame <span style={{ color: 'var(--success)', marginLeft: '0.5rem' }}>({completedProjects.length})</span>
                    </h3>
                    <div style={{ height: '1px', flex: 1, background: 'linear-gradient(to right, var(--border-color), transparent)', marginLeft: '2rem' }}></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(500px, 1fr))', gap: '2.5rem' }}>
                    {completedProjects.map(p => (
                        <ProjectExecutiveCard key={p.id} project={p} onClick={() => onSelectProject(p.id)} isCompleted />
                    ))}
                </div>
            </section>
        </div>
    )
}

const KPICard = ({ label, value, subtext, icon }) => (
    <div className="glass-card cinematic-hover" style={{ padding: '1.8rem', position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-premium)' }}>
        <div style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '3rem', opacity: 0.05 }}>{icon}</div>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1rem' }}>{label}</p>
        <div style={{ fontSize: '2.2rem', fontWeight: '900', marginBottom: '0.3rem', color: '#fff' }}>{value}</div>
        <p style={{ fontSize: '0.75rem', color: 'var(--accent-color)', margin: 0 }}>{subtext}</p>
    </div>
)

const ProjectExecutiveCard = ({ project, onClick, index, isPaused, isCompleted }) => {
    const readiness = project.readiness || 0
    const delay = index * 0.1

    return (
        <div 
            className="glass-card-heavy cinematic-hover animate-slide-up" 
            style={{ 
                padding: '2.5rem', 
                cursor: 'pointer',
                animationDelay: `${delay}s`,
                position: 'relative',
                borderRadius: 'var(--radius-premium)'
            }}
            onClick={onClick}
        >
            {/* STATUS ACCENT */}
            <div style={{ 
                position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', 
                background: isPaused ? 'var(--danger)' : (isCompleted ? 'var(--success)' : 'var(--accent-color)'),
                boxShadow: `0 0 20px ${isPaused ? 'rgba(255,59,48,0.4)' : (isCompleted ? 'rgba(50,215,75,0.4)' : 'var(--accent-glow)')}`,
                borderTopLeftRadius: 'var(--radius-premium)',
                borderBottomLeftRadius: 'var(--radius-premium)'
            }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                    <h3 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', fontWeight: '800', letterSpacing: '-0.02em' }}>{project.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <span style={{ 
                            fontSize: '0.65rem', padding: '0.3rem 0.6rem', 
                            background: isPaused ? 'rgba(255,59,48,0.1)' : (isCompleted ? 'rgba(50,215,75,0.1)' : 'rgba(102,178,194,0.1)'), 
                            color: isPaused ? 'var(--danger)' : (isCompleted ? 'var(--success)' : 'var(--accent-color)'),
                            borderRadius: 'var(--radius-small)', fontWeight: '800', textTransform: 'uppercase'
                        }}>
                            {project.status || 'Executing'}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{project.location}</span>
                    </div>
                </div>
                {!isCompleted && !isPaused && (
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '2.2rem', fontWeight: '900', color: 'var(--accent-color)', lineHeight: 1 }}>{readiness}%</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '0.3rem' }}>Readiness</div>
                    </div>
                )}
                {isCompleted && <div style={{ fontSize: '2.5rem' }}>🏆</div>}
                {isPaused && <div style={{ fontSize: '2.5rem' }}>🛑</div>}
            </div>

            {/* REASON FOR PAUSE IF ANY */}
            {isPaused && (
                <div style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(255,59,48,0.05)', borderRadius: 'var(--radius-standard)', border: '1px solid rgba(255,59,48,0.1)' }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--danger)' }}>
                        <b>Paused:</b> {project.pauseReason}
                    </p>
                </div>
            )}

            {/* PROGRESS SPARKLINE (Except for completed/paused) */}
            {!isCompleted && !isPaused && (
                <div style={{ marginBottom: '2.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem', fontSize: '0.75rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Live Site Audit</span>
                        <span style={{ color: 'var(--success)' }}>Optimal Pulse</span>
                    </div>
                    <div style={{ height: '6px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                        <div style={{ 
                            height: '100%', width: `${readiness}%`, background: 'var(--accent-color)', 
                            borderRadius: '3px', boxShadow: '0 0 15px var(--accent-glow)'
                        }} />
                    </div>
                </div>
            )}

            {/* EXECUTION TIMELINE */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '2.5rem' }}>
                <TimelineStep label="Audit" active={readiness >= 20 || isCompleted} />
                <TimelineStep label="Design" active={readiness >= 50 || isCompleted} />
                <TimelineStep label="Prod" active={readiness >= 80 || isCompleted} />
                <TimelineStep label="Install" active={readiness >= 100 || isCompleted} />
            </div>

            {/* AUTHORIZED CLIENT TIMELINE */}
            {project.history?.some(h => h.isClientVisible) && (
                <div style={{ marginBottom: '2.5rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h4 style={{ fontSize: '0.65rem', color: 'var(--accent-color)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1.2rem', fontWeight: '800' }}>🛰️ AUTHORIZED SITE UPDATES</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {project.history.filter(h => h.isClientVisible).map(h => (
                            <div key={h.id} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                <div style={{ minWidth: '60px', fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: '700', paddingTop: '0.2rem' }}>
                                    {h.date || h.timestamp?.split('T')[0]}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '700', fontSize: '0.8rem', color: '#fff' }}>{h.title}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.1rem', lineHeight: '1.4' }}>{h.detail}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* FOOTER ACTION */}
            <div style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' 
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Last Update: {project.history?.[0]?.title || 'Audit Sync'}
                    </span>
                </div>
                <div style={{ 
                    fontSize: '0.85rem', fontWeight: '800', color: 'var(--accent-color)',
                    display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}>
                    {isCompleted ? 'VIEW COMPLETION CERT' : 'EXPLORE DEEP DIVE'} <span>→</span>
                </div>
            </div>
        </div>
    )
}

const TimelineStep = ({ label, active }) => (
    <div style={{ textAlign: 'center' }}>
        <div style={{ 
            height: '4px', width: '100%', 
            background: active ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)', 
            borderRadius: '2px', marginBottom: '0.5rem',
            boxShadow: active ? '0 0 10px var(--accent-glow)' : 'none'
        }}></div>
        <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: active ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: active ? '700' : '400' }}>
            {label}
        </span>
    </div>
)

export default ClientExperienceHub
