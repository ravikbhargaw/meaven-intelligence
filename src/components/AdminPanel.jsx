import { useState, useRef, useEffect } from 'react'

const AdminPanel = ({ users = [], proposals = [], portfolios = [], onApproveProposal, onAddUser, onRemoveUser, onResetUser, onBack, msaTemplate, onUpdateMsa, onUpdatePortfolio, onHardReset, onExportData }) => {
    const [activeSection, setActiveSection] = useState('portfolios') 
    const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Admin' })
    const editorContainerRef = useRef(null)
    const quillRef = useRef(null)

    useEffect(() => {
        if (activeSection !== 'legal') {
            quillRef.current = null
        }
    }, [activeSection])

    useEffect(() => {
        if (activeSection === 'legal' && editorContainerRef.current && !quillRef.current) {
            if (window.Quill) {
                quillRef.current = new window.Quill(editorContainerRef.current, {
                    theme: 'snow',
                    placeholder: 'Paste or type contract terms here...',
                    modules: {
                        toolbar: [
                            [{ 'header': [1, 2, 3, false] }],
                            ['bold', 'italic', 'underline', 'strike'],
                            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                            [{ 'align': [] }],
                            ['clean']
                        ]
                    }
                })

                quillRef.current.clipboard.dangerouslyPasteHTML(msaTemplate || '')
            }
        }
    }, [activeSection, msaTemplate])



    const handleSaveMsa = () => {
        const contentHtml = quillRef.current ? quillRef.current.root.innerHTML : msaTemplate
        onUpdateMsa(contentHtml)
        alert("MSA Template Saved Globally.")
    }

    const handlePrintPdf = () => {
        const contentHtml = quillRef.current ? quillRef.current.root.innerHTML : msaTemplate
        
        // Find or create top-level print portal directly under body
        let printPortal = document.getElementById('meaven-print-portal');
        if (!printPortal) {
            printPortal = document.createElement('div');
            printPortal.id = 'meaven-print-portal';
            printPortal.className = 'msa-print-section';
            document.body.appendChild(printPortal);
        }

        printPortal.innerHTML = `
            <table class="print-table-wrapper">
                <thead>
                    <tr>
                        <th style="font-weight: normal; text-align: right; border: none; padding: 0;">
                            <div class="print-header-layout">
                                 <img id="print-logo-img" src="/images/logo-dark.png" alt="Meaven Logo" class="print-logo" />
                            </div>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <div class="print-document-body">
                                 ${contentHtml}
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        `
        
        const printImg = document.getElementById('print-logo-img')
        const triggerPrint = () => {
            setTimeout(() => {
                window.print()
            }, 150)
        }

        if (printImg) {
            if (printImg.complete) {
                triggerPrint()
            } else {
                printImg.onload = triggerPrint
                printImg.onerror = triggerPrint
            }
        } else {
            triggerPrint()
        }
    }

    const handleDownloadWord = () => {
        const contentHtml = quillRef.current ? quillRef.current.root.innerHTML : msaTemplate

        const htmlString = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>Master Service Agreement</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          body {
            font-family: "Georgia", serif;
            font-size: 11pt;
            line-height: 1.6;
            color: #000000;
            padding: 1in;
          }
          h1, h2, h3, h4, h5, h6 {
            font-family: "Georgia", serif;
            font-weight: bold;
            color: #000000;
          }
          h2 {
            font-size: 16pt;
            text-align: center;
            margin-top: 1.5rem;
            margin-bottom: 1.5rem;
          }
          h3 {
            font-size: 13pt;
            margin-top: 1.5rem;
            margin-bottom: 0.5rem;
          }
          p {
            margin-bottom: 1rem;
            text-align: justify;
          }
          ul, ol {
            margin-top: 0;
            margin-bottom: 1rem;
            padding-left: 20px;
          }
          li {
            margin-bottom: 0.3rem;
          }
          strong {
            font-weight: bold;
          }
          table {
            border-collapse: collapse;
            width: 100%;
            margin-bottom: 1.5rem;
          }
          th, td {
            border: 1px solid #cccccc;
            padding: 0.5rem;
            text-align: left;
          }
        </style>
      </head>
      <body>
        ${contentHtml}
      </body>
      </html>
    `

        const blob = new Blob(['\ufeff' + htmlString], { type: 'application/msword' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `MSA_Contract_${new Date().toISOString().slice(0,10)}.doc`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }


    const handleSubmit = (e) => {
        e.preventDefault()
        onAddUser(newUser)
        setNewUser({ name: '', email: '', role: 'Admin' })
    }

    const getMagicLink = (p) => {
        const base = (window.location.origin + window.location.pathname).replace(/\/$/, '');
        return `${base}?portal=${p.accessKey || p.id}&pin=${p.clientPin || '2410'}`;
    }

    const handleShareWhatsApp = (p) => {
        const magicLink = getMagicLink(p);
        const text = `Hi ${p.pocName || 'Partner'}! Here is your Meaven Project Portal access link: ${magicLink} \n\nYour Secure PIN is: ${p.clientPin || '2410'}`;
        const url = `https://wa.me/${p.pocPhone || ''}?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    }

    const handleShareEmail = (p) => {
        const magicLink = getMagicLink(p);
        const subject = `ACTION REQUIRED: Your Meaven Project Portal Access`;
        const body = `Hi ${p.pocName},\n\nYour secure project portal is ready for tracking. \n\nAccess Link: ${magicLink} \nYour Secure PIN: ${p.clientPin || '2410'} \n\nBest regards,\nMeaven Intelligence Hub`;
        const mailto = `mailto:${p.pocEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailto;
    }

    const handleUpdatePin = (p) => {
        const newPin = prompt(`Enter new 4-digit PIN for ${p.name}:`, p.clientPin || '2410');
        if (newPin && newPin.length === 4 && /^\d+$/.test(newPin)) {
            onUpdatePortfolio(p.id, { ...p, clientPin: newPin });
        } else if (newPin !== null) {
            alert("Invalid PIN. Please enter exactly 4 digits.");
        }
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
            <header className="stack-on-mobile" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <button 
                        onClick={onBack} 
                        style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--accent-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}
                    >
                        ←
                    </button>
                    <div>
                        <h2 style={{ margin: 0, fontSize: 'clamp(1.2rem, 4vw, 1.8rem)', fontWeight: '900' }}>Governance Console <span className="hide-on-mobile" style={{ color: 'var(--accent-color)', fontSize: '0.9rem', fontWeight: '500', marginLeft: '0.5rem' }}>v2.0</span></h2>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Institutional Command & Data Integrity Suite</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <StatBox label="Live Portals" value={portfolios.filter(p => p.isPortalActive).length} color="#34c759" />
                    <StatBox label="Active Team" value={users.length} color="var(--accent-color)" />
                    <StatBox label="AI Proposals" value={proposals.filter(p => p.status === 'pending').length} color="#ff9500" />
                </div>
            </header>

            <div className="stack-on-mobile" style={{ gap: '2rem', minHeight: '70vh' }}>
                {/* NAV SIDEBAR */}
                <aside style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: '0 0 240px', overflowX: 'auto', paddingBottom: '0.5rem' }} className="mobile-horizontal-scroll">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }} className="stack-on-mobile">
                        {sections.map(s => (
                            <button 
                                key={s.id}
                                onClick={() => setActiveSection(s.id)}
                                style={{ 
                                    display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '1rem', borderRadius: '10px', border: '1px solid transparent',
                                    background: activeSection === s.id ? 'rgba(102, 178, 194, 0.1)' : 'transparent',
                                    borderColor: activeSection === s.id ? 'var(--accent-color)' : 'transparent',
                                    color: activeSection === s.id ? 'var(--accent-color)' : 'var(--text-secondary)',
                                    cursor: 'pointer', textAlign: 'left', fontWeight: '800', fontSize: '0.8rem', transition: 'all 0.3s',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                <span style={{ fontSize: '1.1rem' }}>{s.icon}</span>
                                {s.label}
                            </button>
                        ))}
                    </div>
                </aside>

                {/* CONTENT AREA */}
                <div className="admin-section-content animate-slide-up" key={activeSection} style={{ flex: 1, minWidth: 0 }}>
                    {activeSection === 'portfolios' && (
                        <div className="grid-responsive" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                            {portfolios.length === 0 ? (
                                <div style={{ color: 'var(--text-secondary)', padding: '2rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed var(--border-color)', gridColumn: '1 / -1' }}>
                                    <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>No Active Portfolios</p>
                                    <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>Initialize a new project loop or create a portfolio to generate client portals.</p>
                                </div>
                            ) : (
                                portfolios.map(p => (
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
                                        
                                        <div style={{ background: 'var(--bg-accent)', padding: '1rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid var(--border-color)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Magic Link</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <span style={{ fontSize: '0.6rem', color: 'var(--accent-color)', fontWeight: '800' }}>PIN: {p.clientPin || '2410'}</span>
                                                    <button onClick={() => handleUpdatePin(p)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.7rem', cursor: 'pointer', padding: 0 }}>✎</button>
                                                </div>
                                            </div>
                                            <div 
                                                title="Click to copy Magic Link"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(getMagicLink(p));
                                                    alert("Magic Link copied to clipboard!");
                                                }}
                                                style={{ color: 'var(--accent-color)', fontSize: '0.75rem', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer', textDecoration: 'underline' }}
                                            >
                                                {getMagicLink(p)}
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
                                ))
                            )}
                        </div>
                    )}

                    {activeSection === 'team' && (
                        <div className="stack-on-mobile" style={{ gap: '2rem' }}>
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
                                    <input type="text" placeholder="Full Name" required value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="form-input" style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', padding: '0.8rem', borderRadius: '8px', color: 'var(--text-primary)' }} />
                                    <input type="email" placeholder="Email" required value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="form-input" style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', padding: '0.8rem', borderRadius: '8px', color: 'var(--text-primary)' }} />
                                    <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="form-input" style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', padding: '0.8rem', borderRadius: '8px', color: 'var(--text-primary)' }}>
                                        <option value="Admin" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>Admin</option>
                                        <option value="Editor" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>Project Editor</option>
                                    </select>
                                    <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Deploy Authorization</button>
                                </form>
                            </div>
                        </div>
                    )}

                    {activeSection === 'legal' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div className="card" style={{ maxWidth: '900px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
                                    <div>
                                        <h3 style={{ margin: 0 }}>Master Service Agreement (MSA) Template</h3>
                                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Global legal terms for partner compliance. Edit directly and export.</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                                        <button onClick={handleDownloadWord} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            📝 Download Word (.doc)
                                        </button>
                                        <button onClick={handlePrintPdf} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            🖨️ Download PDF / Print
                                        </button>
                                        <button onClick={handleSaveMsa} className="btn btn-primary">
                                            Save Template
                                        </button>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                                    {['{{VENDOR_NAME}}', '{{ADDRESS}}', '{{PAN}}', '{{GST}}', '{{DATE}}'].map(tag => (
                                        <code key={tag} style={{ fontSize: '0.7rem', color: 'var(--accent-color)', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{tag}</code>
                                    ))}
                                </div>
                                
                                <div ref={editorContainerRef} />
                            </div>
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '600px' }}>
                            <div className="card" style={{ border: '1px solid var(--accent-color)' }}>
                                <h3 style={{ color: 'var(--accent-color)' }}>Data Sovereignty & Export</h3>
                                <p style={{ fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                                    Your data is your asset. Download a complete human-readable dump of your entire Tactical Database (Projects, Vendors, Portfolios) for backup or analysis in Excel.
                                </p>
                                <button 
                                    onClick={() => onExportData()}
                                    className="btn btn-primary" 
                                    style={{ width: '100%', justifyContent: 'center' }}
                                >
                                    📥 ONE-CLICK TACTICAL EXPORT (CSV)
                                </button>
                            </div>

                            <div className="card" style={{ border: '1px solid var(--danger)' }}>
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
