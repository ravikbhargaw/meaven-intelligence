import { useState } from 'react'

const AdminPanel = ({ users = [], proposals = [], portfolios = [], onApproveProposal, onAddUser, onRemoveUser, onResetUser, onBack, msaTemplate, onUpdateMsa, onUpdatePortfolio, onHardReset }) => {
    const [activeSection, setActiveSection] = useState('portfolios') 
    const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Admin' })
    const [localMsa, setLocalMsa] = useState(msaTemplate)

    const handleSubmit = (e) => {
        e.preventDefault()
        onAddUser(newUser)
        setNewUser({ name: '', email: '', role: 'Admin' })
    }

    const handleShareWhatsApp = (p) => {
        const text = `Hi ${p.pocName || 'Partner'}! Here is your Meaven Project Portal access link: https://meaven.intelligence/client/${p.accessKey || p.id} \n\nYour Secure PIN is: ${p.clientPin || '2410'}`;
        const url = `https://wa.me/${p.pocPhone || ''}?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    }

    const handleShareEmail = (p) => {
        const subject = `ACTION REQUIRED: Your Meaven Project Portal Access`;
        const body = `Hi ${p.pocName},\n\nYour secure project portal is ready for tracking. \n\nAccess Link: https://meaven.intelligence/client/${p.accessKey || p.id} \nYour Secure PIN: ${p.clientPin || '2410'} \n\nBest regards,\nMeaven Intelligence Hub`;
        const mailto = `mailto:${p.pocEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailto;
    }

    const sections = [
        { id: 'portfolios', label: 'Portfolio Access', icon: '🏢' },
        { id: 'team', label: 'Team Control', icon: '📡' },
        { id: 'legal', label: 'Legal Governance', icon: '📜' },
        { id: 'ai', label: 'Intelligence Ops', icon: '🤖' },
        { id: 'system', label: 'System Maintenance', icon: '⚙️' }
    ]

    return (
        <div className="admin-panel animate-fade-in" style={{ padding: '1rem 0' }}>
            {/* HEADER GOVERNANCE SNAPSHOT */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <button 
                        onClick={onBack} 
                        style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--accent-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}
                    >
                        ←
                    </button>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '900' }}>Governance Console <span style={{ color: 'var(--accent-color)', fontSize: '0.9rem', fontWeight: '500', marginLeft: '0.5rem' }}>v2.0</span></h2>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Institutional Command & Data Integrity Suite</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <StatBox label="Live Portals" value={portfolios.filter(p => p.isPortalActive).length} color="#34c759" />
                    <StatBox label="Active Team" value={users.length} color="var(--accent-color)" />
                    <StatBox label="AI Proposals" value={proposals.filter(p => p.status === 'pending').length} color="#ff9500" />
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '3rem', minHeight: '70vh' }}>
                {/* NAV SIDEBAR */}
                <aside style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {sections.map(s => (
                        <button 
                            key={s.id}
                            onClick={() => setActiveSection(s.id)}
                            style={{ 
                                display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.2rem', borderRadius: '12px', border: '1px solid transparent',
                                background: activeSection === s.id ? 'rgba(102, 178, 194, 0.1)' : 'transparent',
                                borderColor: activeSection === s.id ? 'var(--accent-color)' : 'transparent',
                                color: activeSection === s.id ? 'var(--accent-color)' : 'var(--text-secondary)',
                                cursor: 'pointer', textAlign: 'left', fontWeight: '700', fontSize: '0.9rem', transition: 'all 0.3s'
                            }}
                        >
                            <span style={{ fontSize: '1.2rem' }}>{s.icon}</span>
                            {s.label}
                        </button>
                    ))}
                </aside>

                {/* CONTENT AREA */}
                <div className="admin-section-content animate-slide-up" key={activeSection}>
                    {activeSection === 'portfolios' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
                            {portfolios.map(p => (
                                <div key={p.id} className="card" style={{ padding: '2rem', border: `1px solid ${p.isPortalActive ? 'var(--success)' : 'var(--border-color)'}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '1.3rem' }}>{p.name}</h3>
                                            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>POC: {p.pocName || 'TBD'} • {p.pocEmail}</p>
                                        </div>
                                        <div style={{ 
                                            padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.6rem', fontWeight: '900', 
                                            background: p.isPortalActive ? 'rgba(52, 215, 75, 0.1)' : 'rgba(255,255,255,0.05)',
                                            color: p.isPortalActive ? 'var(--success)' : 'var(--text-secondary)',
                                            border: `1px solid ${p.isPortalActive ? 'var(--success)' : 'var(--border-color)'}`
                                        }}>
                                            {p.isPortalActive ? '● LIVE PORTAL' : 'OFFLINE'}
                                        </div>
                                    </div>
                                    
                                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid var(--border-color)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Magic Link</span>
                                            <span style={{ fontSize: '0.6rem', color: 'var(--accent-color)', fontWeight: '800' }}>PIN: {p.clientPin || '2410'}</span>
                                        </div>
                                        <div style={{ color: '#fff', fontSize: '0.8rem', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            meaven.in/track/{p.accessKey || p.id}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.8rem' }}>
                                        {!p.isPortalActive ? (
                                            <button 
                                                onClick={() => onUpdatePortfolio(p.id, { ...p, isPortalActive: true })}
                                                className="btn btn-primary" 
                                                style={{ flex: 1, justifyContent: 'center' }}
                                            >
                                                🚀 ACTIVATE
                                            </button>
                                        ) : (
                                            <>
                                                <button onClick={() => handleShareEmail(p)} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center', fontSize: '0.75rem' }}>📧 Email</button>
                                                <button onClick={() => handleShareWhatsApp(p)} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center', fontSize: '0.75rem', color: '#25D366', borderColor: '#25D366' }}>📱 WhatsApp</button>
                                                <button onClick={() => confirm(`Kill access for ${p.name}?`) && onUpdatePortfolio(p.id, { ...p, isPortalActive: false })} className="btn btn-outline" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>🛑</button>
                                            </>
                                        )}
                                        <button title="Reset Keys" onClick={() => onUpdatePortfolio(p.id, { ...p, accessKey: Math.random().toString(36).substr(2, 8) })} className="btn btn-outline">🔄</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeSection === 'team' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
                            <div className="card">
                                <h3 style={{ marginBottom: '1.5rem' }}>Team Access Matrix</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {users.map(u => (
                                        <div key={u.email} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem', background: 'rgba(255,255,255,0.01)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>{u.name?.charAt(0)}</div>
                                                <div>
                                                    <p style={{ margin: 0, fontWeight: '700' }}>{u.name}</p>
                                                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{u.email} • {u.role}</p>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                                                {u.email !== 'ravi.bhargaw@meaven.in' && (
                                                    <>
                                                        <button 
                                                            title="Reset Credentials"
                                                            onClick={() => confirm(`Reset credentials for ${u.name}?`) && onResetUser(u.email)}
                                                            style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', fontSize: '1rem' }}
                                                        >
                                                            🔄
                                                        </button>
                                                        <button 
                                                            onClick={() => confirm('Remove user?') && onRemoveUser(u.email)} 
                                                            style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '1rem' }}
                                                        >
                                                            🗑️
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="card" style={{ alignSelf: 'start' }}>
                                <h3>Invite New Operator</h3>
                                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                    <input type="text" placeholder="Full Name" required value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="form-input" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', padding: '0.8rem', borderRadius: '8px', color: '#fff' }} />
                                    <input type="email" placeholder="Email" required value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="form-input" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', padding: '0.8rem', borderRadius: '8px', color: '#fff' }} />
                                    <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="form-input" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', padding: '0.8rem', borderRadius: '8px', color: '#fff' }}>
                                        <option value="Admin">Admin</option>
                                        <option value="Editor">Project Editor</option>
                                    </select>
                                    <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Deploy Authorization</button>
                                </form>
                            </div>
                        </div>
                    )}

                    {activeSection === 'legal' && (
                        <div className="card" style={{ maxWidth: '900px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <div>
                                    <h3 style={{ margin: 0 }}>Master Service Agreement (MSA) Template</h3>
                                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Global legal terms for partner compliance.</p>
                                </div>
                                <button onClick={() => { onUpdateMsa(localMsa); alert("MSA Template Saved Globally."); }} className="btn btn-primary">Save Changes</button>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                                {['{{VENDOR_NAME}}', '{{ADDRESS}}', '{{PAN}}', '{{GST}}', '{{DATE}}'].map(tag => (
                                    <code key={tag} style={{ fontSize: '0.7rem', color: 'var(--accent-color)', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{tag}</code>
                                ))}
                            </div>
                            <textarea 
                                value={localMsa} 
                                onChange={e => setLocalMsa(e.target.value)}
                                style={{ width: '100%', height: '500px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', color: '#fff', fontSize: '0.9rem', lineHeight: '1.7', fontFamily: 'monospace' }}
                            />
                        </div>
                    )}

                    {activeSection === 'ai' && (
                        <div className="card">
                            <h3>AI Playbook & Intelligence Proposals</h3>
                            {proposals.length === 0 ? (
                                <p style={{ color: 'var(--text-secondary)' }}>No pending intelligence updates.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {proposals.map(p => (
                                        <div key={p.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', background: 'rgba(255,255,255,0.01)' }}>
                                            <div>
                                                <p style={{ margin: 0, fontWeight: '800' }}>{p.title}</p>
                                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Status: {p.status}</p>
                                            </div>
                                            {p.status === 'pending' && <button onClick={() => onApproveProposal(p.id)} className="btn btn-primary">Approve Update</button>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    {activeSection === 'system' && (
                        <div className="card" style={{ maxWidth: '600px', border: '1px solid var(--danger)' }}>
                            <h3 style={{ color: 'var(--danger)' }}>Data Governance & Hard Reset</h3>
                            <p style={{ fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '2rem' }}>
                                Use this section to flush the Intelligence Hub of all dummy data. This will wipe all <strong>Projects</strong>, <strong>Vendors</strong>, and <strong>Portfolios</strong> from both the Cloud and Local Cache.
                            </p>
                            <div style={{ padding: '1.5rem', background: 'rgba(255, 69, 58, 0.05)', borderRadius: '12px', border: '1px solid rgba(255, 69, 58, 0.2)' }}>
                                <h4 style={{ margin: '0 0 1rem 0', color: 'var(--danger)', fontSize: '0.8rem' }}>DANGER ZONE</h4>
                                <button 
                                    onClick={onHardReset}
                                    className="btn btn-primary" 
                                    style={{ background: 'var(--danger)', borderColor: 'var(--danger)', width: '100%', justifyContent: 'center' }}
                                >
                                    🔥 FLUSH ALL DATA & START FRESH
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

const StatBox = ({ label, value, color }) => (
    <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '1.8rem', fontWeight: '900', color: color }}>{value}</div>
        <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
    </div>
)

export default AdminPanel
