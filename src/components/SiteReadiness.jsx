import { useState, useEffect } from 'react'

const SiteReadiness = ({ project, projects, portfolios = [], data, onUpdate, onUpdateMilestones, isReadOnly }) => {
  const defaultItems = [
    { id: 1, category: 'Structural Readiness', label: 'Header/Beam Structural Readiness', status: 'pending', notes: '' },
    { id: 2, category: 'Structural Readiness', label: 'Opening Dimensions Laser-Verified', status: 'pending', notes: '' },
    { id: 3, category: 'Structural Readiness', label: 'Floor Level Tolerance (+/- 2mm)', status: 'pending', notes: '' },
    { id: 4, category: 'Structural Readiness', label: 'Wall Plumbness Verified', status: 'pending', notes: '' },
    { id: 5, category: 'Site & Access', label: 'Unloading Zone Clear & Accessible', status: 'pending', notes: '' },
    { id: 6, category: 'Site & Access', label: 'Service Lift Dimensions Verified', status: 'pending', notes: '' },
    { id: 7, category: 'Site & Access', label: 'Dust-Free Zone for Installation', status: 'pending', notes: '' },
    { id: 8, category: 'Utilities & Support', label: 'Stable 3-Phase Power Available', status: 'pending', notes: '' },
  ]

  const [items, setItems] = useState(data?.items || defaultItems)
  const [photos, setPhotos] = useState(data?.photos || [])
  const [observations, setObservations] = useState(data?.observations || '')
  const [isEditingDates, setIsEditingDates] = useState(false)
  const [isEditingChecklist, setIsEditingChecklist] = useState(false)
  const [showTimeline, setShowTimeline] = useState(false)
  
  useEffect(() => {
    onUpdate({ items, photos, observations })
  }, [items, photos, observations])

  const toggleStatus = (id) => {
    if (isReadOnly || !isEditingChecklist) return
    setItems(items.map(item => {
      if (item.id === id) {
        const nextStatus = item.status === 'pending' ? 'passed' : (item.status === 'passed' ? 'failed' : 'pending')
        return { ...item, status: nextStatus }
      }
      return item
    }))
  }

  const handleNoteChange = (id, val) => {
    if (isReadOnly || !isEditingChecklist) return
    setItems(items.map(item => item.id === id ? { ...item, notes: val } : item))
  }

  const handlePhotoUpload = (e) => {
    if (isReadOnly) return
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setPhotos([...photos, reader.result])
      reader.readAsDataURL(file)
    }
  }

  if (!project || !project.id) return (
    <div className="card animate-fade-in" style={{ textAlign: 'center', padding: '4rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Please select a project to initialize the Live Audit Hub.</p>
    </div>
  )

  const [showDistModal, setShowDistModal] = useState(false)
  const [distList, setDistList] = useState({ portfolio: true, project: true })

  const portfolio = portfolios.find(p => p.id === project.portfolioId) || portfolios[0] || { name: 'Unknown Portfolio', stakeholders: [] }
  const financials = project?.clientFinancials || { totalValue: 0, requests: [], received: [] }
  const totalReceived = (financials.received || []).reduce((sum, r) => sum + r.amount, 0)
  const outstanding = financials.totalValue - totalReceived

  const handleRequestPayment = () => {
    const contacts = (portfolio.stakeholders || []).map(s => s.email).join(', ')
    alert(`FINANCIAL AUTHORIZATION INITIATED\n\nRequest sent to Portfolio Stakeholders:\n${contacts}\n\nStakeholders notified: ${(portfolio.stakeholders || []).map(s => s.name).join(' & ')}`)
  }

  return (
    <div className="site-readiness-module animate-fade-in">
      {/* Header & Main Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Live Audit Hub</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Portfolio: {portfolio.name} | Project: {project?.name}</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-outline" onClick={() => setShowTimeline(!showTimeline)}>
                {showTimeline ? 'Close Timeline ✕' : 'Project Review Timeline 🗓️'}
            </button>
            <button className="btn btn-outline" onClick={() => setShowDistModal(true)}>
                Export Execution Report 📄
            </button>
        </div>
      </div>

      {showDistModal && (
          <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div className="card animate-slide-up" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
                  <h3>Report Distribution</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '2rem' }}>Select the stakeholder groups to include in this report export.</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
                          <input type="checkbox" checked={distList.portfolio} onChange={() => setDistList({...distList, portfolio: !distList.portfolio})} />
                          <div>
                              <p style={{ margin: 0, fontWeight: '600' }}>Portfolio Stakeholders (2)</p>
                              <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{(portfolio?.stakeholders || []).map(s => s.name).join(', ')}</p>
                          </div>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
                          <input type="checkbox" checked={distList.project} onChange={() => setDistList({...distList, project: !distList.project})} />
                          <div>
                              <p style={{ margin: 0, fontWeight: '600' }}>Project Stakeholders (3)</p>
                              <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{project?.stakeholders?.map(s => s.name).join(', ') || 'Site Team'}</p>
                          </div>
                      </label>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                      <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowDistModal(false)}>Cancel</button>
                      <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { setShowDistModal(false); window.print(); }}>Generate Branded PDF</button>
                  </div>
              </div>
          </div>
      )}

      {showTimeline && (
          <div className="card animate-fade-in" style={{ marginBottom: '2rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--accent-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                  <h3 style={{ margin: 0 }}>Integrated Project Chronology</h3>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Audit Logs + Milestones + Financials</span>
                    <button 
                        className="btn btn-primary" 
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.7rem' }}
                        onClick={() => {
                            const printStyles = document.createElement('style');
                            printStyles.innerHTML = `
                                @media print {
                                    body * { visibility: hidden; }
                                    #timeline-to-print, #timeline-to-print * { visibility: visible; }
                                    #timeline-to-print { position: absolute; left: 0; top: 0; width: 100%; padding: 40px; color: #000; background: #fff; }
                                    .btn, .sidebar, .client-toggle-card { display: none !important; }
                                    .print-branding { display: block !important; margin-bottom: 40px; border-bottom: 2px solid #000; padding-bottom: 20px; }
                                    #timeline-to-print .card { border: 1px solid #eee !important; box-shadow: none !important; color: #000 !important; }
                                    #timeline-to-print p, #timeline-to-print span { color: #333 !important; }
                                }
                            `;
                            document.head.appendChild(printStyles);
                            window.print();
                            document.head.removeChild(printStyles);
                        }}
                    >
                        Export PDF 📄
                    </button>
                  </div>
              </div>
              
              <div id="timeline-to-print">
                  <div className="print-branding" style={{ display: 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                          <div>
                              <h1 style={{ color: '#000', margin: 0 }}>MEAVEN INTELLIGENCE</h1>
                              <p style={{ color: '#666', margin: 0, fontSize: '0.8rem', letterSpacing: '0.2em' }}>PROJECT CHRONOLOGY REPORT</p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                              <p style={{ margin: 0, fontWeight: '700' }}>{project?.name}</p>
                              <p style={{ margin: 0, fontSize: '0.8rem' }}>Client: {project?.client}</p>
                          </div>
                      </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', position: 'relative', paddingLeft: '2rem' }}>
                  <div style={{ position: 'absolute', left: '7px', top: '5px', bottom: '5px', width: '2px', background: 'var(--border-color)' }} />
                  
                  {/* Milestones integrated into history-style display */}
                  {[
                      ...(project?.history || []).map(h => ({ ...h, date: h.timestamp })),
                      ...(project?.clientFinancials?.received || []).map(r => ({ id: `fin-${r.id}`, type: 'success', title: 'Payment Received', detail: `Ref: ${r.ref} | Amount: ₹${(r.amount/100000).toFixed(2)}L`, date: r.date })),
                      { id: 'm1', type: 'info', title: 'Measurement Milestone', detail: project?.milestones?.measurementDate || 'Pending Entry', date: project?.milestones?.measurementDate },
                      { id: 'm2', type: 'info', title: 'Site Readiness Verification', detail: project?.milestones?.siteReadiness || 'Pending Entry', date: project?.milestones?.siteReadiness },
                      { id: 'm3', type: 'success', title: 'Final Handover', detail: project?.milestones?.completion || 'Pending Entry', date: project?.milestones?.completion }
                  ]
                  .filter(item => item.date) // Only items with dates
                  .sort((a, b) => new Date(b.date) - new Date(a.date)) // Reverse chronological
                  .map(item => (
                      <div key={item.id} style={{ position: 'relative' }}>
                          <div style={{ 
                              position: 'absolute', left: '-29px', top: '4px', width: '12px', height: '12px', borderRadius: '50%', 
                              background: item.type === 'success' ? 'var(--success)' : (item.type === 'warning' ? 'var(--danger)' : 'var(--accent-color)'),
                              boxShadow: `0 0 10px ${item.type === 'success' ? 'var(--success)' : 'var(--accent-color)'}`,
                              zIndex: 2
                          }} />
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                  <p style={{ margin: 0, fontWeight: '700', fontSize: '0.95rem' }}>{item.title}</p>
                                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.detail}</p>
                              </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: '600' }}>
                                        {(() => {
                                            const d = new Date(item.date)
                                            return isNaN(d.getTime()) ? 'Pending Audit' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                        })()}
                                    </p>
                                    <p style={{ margin: 0, fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)' }}>Verified Status</p>
                                </div>
                          </div>
                      </div>
                  ))}
              </div>
            </div>
          </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Checklist Status</p>
          <p style={{ fontSize: '1.5rem', fontWeight: '800', marginTop: '0.5rem' }}>{items.filter(i => i.status === 'passed').length} / {items.length}</p>
        </div>
        <div className="card" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Project Value</p>
          <p style={{ fontSize: '1.5rem', fontWeight: '800', marginTop: '0.5rem' }}>₹{(financials.totalValue / 100000).toFixed(2)}L</p>
        </div>
        <div className="card" style={{ background: 'rgba(50, 215, 75, 0.05)' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--success)', textTransform: 'uppercase' }}>Collected till Date</p>
          <p style={{ fontSize: '1.5rem', fontWeight: '800', marginTop: '0.5rem' }}>₹{(totalReceived / 100000).toFixed(2)}L</p>
        </div>
        <div className="card" style={{ background: 'rgba(255, 69, 58, 0.05)' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--danger)', textTransform: 'uppercase' }}>Outstanding Due</p>
          <p style={{ fontSize: '1.5rem', fontWeight: '800', marginTop: '0.5rem' }}>₹{(outstanding / 100000).toFixed(2)}L</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* SITE READINESS CHECKLIST */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }}>
                <h4 style={{ margin: 0 }}>📋 Verification Points</h4>
                {!isReadOnly && (
                    <button 
                        onClick={() => setIsEditingChecklist(!isEditingChecklist)}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', fontSize: '0.7rem', fontWeight: '700' }}
                    >
                        {isEditingChecklist ? '✓ Lock Checklist' : '✎ Edit Checklist'}
                    </button>
                )}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                        <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Verification Point</th>
                        <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Status</th>
                        <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Notes</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map(item => (
                        <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '1rem 1.5rem' }}>
                                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '500' }}>{item.label}</p>
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{item.category}</span>
                            </td>
                            <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                                <button 
                                    onClick={() => toggleStatus(item.id)} 
                                    disabled={isReadOnly || !isEditingChecklist} 
                                    style={{ 
                                        fontSize: '1.2rem', 
                                        opacity: item.status === 'pending' ? 0.3 : 1,
                                        cursor: (isReadOnly || !isEditingChecklist) ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {item.status === 'passed' ? '✅' : (item.status === 'failed' ? '❌' : '⏳')}
                                </button>
                            </td>
                            <td style={{ padding: '1rem 1.5rem' }}>
                                <input 
                                    type="text" 
                                    readOnly={isReadOnly || !isEditingChecklist}
                                    placeholder={isEditingChecklist ? "Add notes..." : "No notes logged"} 
                                    value={item.notes} 
                                    onChange={(e) => handleNoteChange(item.id, e.target.value)} 
                                    style={{ 
                                        background: isEditingChecklist ? 'rgba(255,255,255,0.05)' : 'transparent', 
                                        border: isEditingChecklist ? '1px solid var(--accent-color)' : 'none', 
                                        borderRadius: '4px', padding: '0.4rem 0.8rem', color: '#fff', width: '100%', fontSize: '0.85rem' 
                                    }} 
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* PROJECT CRITICAL DATES */}
          <div className="card" style={{ background: 'var(--bg-accent)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h4 style={{ margin: 0 }}>🎯 Project Milestones</h4>
                {!isReadOnly && (
                    <button 
                        onClick={() => setIsEditingDates(!isEditingDates)}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', fontSize: '0.7rem', fontWeight: '700' }}
                    >
                        {isEditingDates ? '✓ Save Changes' : '✎ Edit Milestones'}
                    </button>
                )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                {[
                    { label: 'Measurement Date', key: 'measurementDate' },
                    { label: 'Site Readiness Date', key: 'siteReadiness' },
                    { label: 'Final Handover Date', key: 'completion' }
                ].map(m => (
                    <div key={m.key} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{m.label}</span>
                        {(isEditingDates && !isReadOnly) ? (
                            <input 
                                type="date" 
                                value={project?.milestones?.[m.key] || ''} 
                                onChange={(e) => onUpdateMilestones(project.id, { [m.key]: e.target.value })}
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--accent-color)', borderRadius: '6px', padding: '0.6rem', color: '#fff', fontSize: '0.85rem', width: '100%' }}
                            />
                        ) : (
                            <span style={{ fontSize: '0.95rem', fontWeight: '600', color: project?.milestones?.[m.key] ? '#fff' : 'var(--text-secondary)' }}>
                                {project?.milestones?.[m.key] || 'Pending Entry'}
                            </span>
                        )}
                    </div>
                ))}
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h4 style={{ margin: 0 }}>Client Billing Snapshot</h4>
                {!isReadOnly && (
                    <button 
                        onClick={handleRequestPayment}
                        className="btn btn-outline"
                        style={{ fontSize: '0.65rem', border: '1px solid var(--accent-color)', color: 'var(--accent-color)' }}
                    >
                        Request Portfolio Authorization 💸
                    </button>
                )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {(financials.requests || []).map(r => (
                    <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div>
                            <p style={{ margin: 0, fontWeight: '700', fontSize: '1rem' }}>₹{(r.amount / 100000).toFixed(2)}L</p>
                            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{r.milestone} | {r.date}</p>
                        </div>
                        <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(102,178,194,0.1)', color: 'var(--accent-color)' }}>{r.status}</span>
                    </div>
                ))}
            </div>
          </div>

          <div className="card">
            <h4 style={{ marginBottom: '1rem' }}>Photo Evidence</h4>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {photos.map((src, i) => (
                    <img key={i} src={src} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                ))}
                {!isReadOnly && (
                    <label style={{ width: '50px', height: '50px', borderRadius: '4px', border: '2px dashed #333', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        +<input type="file" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                    </label>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SiteReadiness
