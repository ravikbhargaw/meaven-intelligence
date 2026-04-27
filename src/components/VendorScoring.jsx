import { useState, useEffect } from 'react'

const VendorScoring = ({ vendors, projects, portfolios = [], selectedVendorId: selectedVendorIdProp, msaTemplate, onSelectVendor, onAddVendor, onUpdateVendor, onAddPayment, onAddNote, onAddContract, onAddProject, onBack, isReadOnly }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isContractModalOpen, setIsContractModalOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [selectedVendorId, setSelectedVendorId] = useState(null)
  const [activeContractId, setActiveContractId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')
  const [noteText, setNoteText] = useState('')
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false)
  const [isMsaModalOpen, setIsMsaModalOpen] = useState(false)
  const [isEsignMode, setIsEsignMode] = useState(false)
  const [signerName, setSignerName] = useState('')
  
  useEffect(() => {
    if (selectedVendorIdProp !== undefined) {
        setSelectedVendorId(selectedVendorIdProp);
    }
  }, [selectedVendorIdProp]);

  const handleSetSelectedVendor = (id) => {
    setSelectedVendorId(id);
    if (onSelectVendor) onSelectVendor(id);
  }
  
  // New Contract Modal State
  const [linkMode, setLinkMode] = useState('existing') // 'existing' or 'new'

  const categories = ['All', 'Glass', 'Aluminum', 'Hardware', 'Lighting', 'Logistics']
  const statuses = ['All', 'Certified', 'Vetting']

  const filteredVendors = vendors.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (v.gst || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'All' || v.category === filterCategory
    const matchesStatus = filterStatus === 'All' || v.status === filterStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  const calculateScore = (m) => {
    if (!m) return 0
    const price = m.price || 0
    const speed = m.speed || 0
    const precision = m.precision || 0
    const communication = m.communication || 0
    return Math.round((price * 0.3) + (speed * 0.3) + (precision * 0.25) + (communication * 0.15))
  }

  const maskData = (str, visibleCount = 4) => {
    if (!str || !isReadOnly) return str
    const s = String(str)
    const visible = s.slice(-visibleCount)
    const masked = 'X'.repeat(Math.max(0, s.length - visibleCount))
    return masked + visible
  }

  const selectedVendor = vendors.find(v => v.id === selectedVendorId)
  const selectedContract = selectedVendor?.contracts?.find(c => c.id === activeContractId)

  const getGlobalFinancials = (v) => {
    const contracts = v.contracts || []
    const totalOrder = contracts.reduce((sum, c) => sum + (parseInt(c.orderValue) || 0), 0)
    const totalPaid = contracts.reduce((sum, c) => {
        return sum + (c.payments || []).reduce((pSum, p) => pSum + (parseInt(p.amount) || 0), 0)
    }, 0)
    return { totalOrder, totalPaid, due: totalOrder - totalPaid }
  }

  const getContractFinancials = (c) => {
    if (!c) return { order: 0, paid: 0, due: 0 }
    const paid = (c.payments || []).reduce((sum, p) => sum + (parseInt(p.amount) || 0), 0)
    const order = parseInt(c.orderValue) || 0
    return { order, paid, due: order - paid }
  }

  if (selectedVendor) {
    const score = calculateScore(selectedVendor.metrics)
    const globalFin = getGlobalFinancials(selectedVendor)
    const contractFin = getContractFinancials(selectedContract)

    return (
      <div className="vendor-detail-view animate-fade-in" style={{ paddingBottom: '5rem' }}>
        <button 
          onClick={() => handleSetSelectedVendor(null)} 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-color)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '2rem', fontSize: '0.9rem', fontWeight: '600' }}
        >
          ← Back to Partner Directory
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <h1 style={{ margin: 0, fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', filter: isReadOnly ? 'blur(8px)' : 'none' }}>{selectedVendor.name}</h1>
                    <span style={{ fontSize: '0.6rem', padding: '0.2rem 0.6rem', borderRadius: '20px', background: selectedVendor.status === 'Certified' ? 'rgba(50, 215, 75, 0.1)' : 'rgba(255, 149, 0, 0.1)', color: selectedVendor.status === 'Certified' ? 'var(--success)' : '#FF9500', fontWeight: '800', letterSpacing: '0.05em' }}>
                        {selectedVendor.status.toUpperCase()}
                    </span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>{selectedVendor.category} Division | {selectedVendor.contact}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 'clamp(2rem, 6vw, 3rem)', fontWeight: '800', color: score > 80 ? 'var(--success)' : 'var(--accent-color)', lineHeight: 1 }}>
                    {score}
                </div>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Intelligence Score</span>
            </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.2rem', marginBottom: '3rem' }}>
            <div className="card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
                <p style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Global Portfolio</p>
                <p style={{ fontSize: '1.3rem', fontWeight: '800', filter: isReadOnly ? 'blur(10px)' : 'none' }}>₹{(globalFin.totalOrder / 100000).toFixed(2)}L</p>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>{selectedVendor.contracts?.length || 0} Active Sites</p>
            </div>
            <div className="card" style={{ background: 'rgba(50, 215, 75, 0.05)' }}>
                <p style={{ fontSize: '0.6rem', color: 'var(--success)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Paid to Date</p>
                <p style={{ fontSize: '1.3rem', fontWeight: '800', filter: isReadOnly ? 'blur(10px)' : 'none' }}>₹{(globalFin.totalPaid / 100000).toFixed(2)}L</p>
            </div>
            <div className="card" style={{ background: 'rgba(255, 69, 58, 0.05)' }}>
                <p style={{ fontSize: '0.6rem', color: 'var(--danger)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Global Due</p>
                <p style={{ fontSize: '1.3rem', fontWeight: '800', filter: isReadOnly ? 'blur(10px)' : 'none' }}>₹{(globalFin.due / 100000).toFixed(2)}L</p>
            </div>
            <div className="card" style={{ border: '1px solid var(--accent-color)', background: 'linear-gradient(135deg, rgba(102, 178, 194, 0.08) 0%, transparent 100%)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.7rem', color: 'var(--accent-color)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>AI Health Audit</h4>
                    <div style={{ fontSize: '0.55rem', fontWeight: '900', color: 'var(--success)' }}>OPTIMAL</div>
                </div>
                <p style={{ fontSize: '0.75rem', lineHeight: '1.4', margin: 0, color: 'var(--text-secondary)' }}>
                    {selectedVendor.miScore > 85 
                        ? "Partner reliability is high. AI recommends for complex structural works."
                        : "Site precision variance detected. AI suggests more frequent audits."}
                </p>
            </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Project Sites</h4>
                        {!isReadOnly && (
                            <button onClick={() => { setLinkMode('existing'); setIsContractModalOpen(true); }} style={{ color: 'var(--accent-color)', fontSize: '0.75rem', fontWeight: '600' }}>+ Link Project</button>
                        )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        {(selectedVendor.contracts || []).map(c => (
                            <div 
                                key={c.id} 
                                onClick={() => setActiveContractId(c.id)}
                                style={{ 
                                    padding: '1rem', 
                                    borderRadius: 'var(--radius-standard)', 
                                    background: activeContractId === c.id ? 'var(--accent-color)' : 'rgba(255,255,255,0.03)',
                                    color: activeContractId === c.id ? '#000' : '#fff',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    border: '1px solid ' + (activeContractId === c.id ? 'var(--accent-color)' : 'transparent')
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <p style={{ margin: 0, fontWeight: '700', fontSize: '0.9rem' }}>{c.projectName}</p>
                                    {(() => {
                                        const p = projects.find(proj => proj.name === c.projectName);
                                        const status = p?.status || 'Active';
                                        return (
                                            <span 
                                                title="This status is synchronized with Project Central. Modify it there to update partner records."
                                                style={{ 
                                                    fontSize: '0.5rem', padding: '0.2rem 0.5rem', borderRadius: '4px', 
                                                    background: status === 'Completed' ? 'var(--success)' : (status === 'On Hold' ? 'var(--danger)' : (status === 'Final Closure' ? '#7b61ff' : 'var(--accent-color)')),
                                                    color: status === 'Final Closure' ? '#fff' : '#000', fontWeight: '800', cursor: 'help'
                                                }}
                                            >
                                                {status.toUpperCase()}
                                            </span>
                                        );
                                    })()}
                                </div>
                                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.7rem', opacity: 0.7 }}>Order: ₹{(c.orderValue / 100000).toFixed(2)}L</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card" style={{ background: 'var(--bg-accent)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h4 style={{ margin: 0, fontSize: '0.9rem' }}>🛡️ Compliance Vault</h4>
                        <button 
                            onClick={() => setIsVaultModalOpen(true)}
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--accent-color)', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: '800', cursor: 'pointer' }}
                        >
                            MANAGE VAULT
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        {/* Mandatory Data Fields */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                            <div>
                                <label style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Phone</label>
                                <input 
                                    value={selectedVendor.phone || ''}
                                    onChange={(e) => onUpdateVendor(selectedVendor.id, { phone: e.target.value })}
                                    placeholder="Add phone..."
                                    style={{ width: '100%', background: 'none', border: 'none', borderBottom: '1px solid var(--border-color)', color: '#fff', fontSize: '0.8rem', padding: '0.2rem 0' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>PAN</label>
                                <input 
                                    value={selectedVendor.pan || ''}
                                    onChange={(e) => onUpdateVendor(selectedVendor.id, { pan: e.target.value })}
                                    placeholder="Add PAN..."
                                    style={{ width: '100%', background: 'none', border: 'none', borderBottom: '1px solid var(--border-color)', color: '#fff', fontSize: '0.8rem', padding: '0.2rem 0' }}
                                />
                            </div>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Physical Address</label>
                            <input 
                                value={selectedVendor.address || ''}
                                onChange={(e) => onUpdateVendor(selectedVendor.id, { address: e.target.value })}
                                placeholder="Full Registered Address..."
                                style={{ width: '100%', background: 'none', border: 'none', borderBottom: '1px solid var(--border-color)', color: '#fff', fontSize: '0.8rem', padding: '0.2rem 0' }}
                            />
                        </div>

                        {/* Mandatory Document Status */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.5rem' }}>
                            {[
                                { label: 'GST Certificate', key: 'GST' },
                                { label: 'PAN Card Doc', key: 'PAN' },
                                { label: 'Cancelled Cheque', key: 'Cheque' }
                            ].map(doc => {
                                const hasDoc = (selectedVendor.documents || []).some(d => d.tag === doc.key);
                                return (
                                    <div key={doc.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', padding: '0.5rem', background: 'rgba(0,0,0,0.1)', borderRadius: '6px' }}>
                                        <span style={{ color: hasDoc ? '#fff' : 'var(--text-secondary)' }}>{doc.label}</span>
                                        <span style={{ fontWeight: '800', color: hasDoc ? 'var(--success)' : 'var(--danger)' }}>{hasDoc ? 'VERIFIED ✅' : 'MISSING ❌'}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {(() => {
                        const hasPhone = !!selectedVendor.phone;
                        const hasAddress = !!selectedVendor.address;
                        const hasPan = !!selectedVendor.pan;
                        const hasGstDoc = (selectedVendor.documents || []).some(d => d.tag === 'GST');
                        const hasPanDoc = (selectedVendor.documents || []).some(d => d.tag === 'PAN');
                        const hasChequeDoc = (selectedVendor.documents || []).some(d => d.tag === 'Cheque');
                        
                        const isEligible = hasPhone && hasAddress && hasPan && hasGstDoc && hasPanDoc && hasChequeDoc;

                        return (
                            <div style={{ marginTop: '1.5rem' }}>
                                {selectedVendor.status === 'Certified' ? (
                                    <div style={{ textAlign: 'center', padding: '0.8rem', background: 'rgba(50, 215, 75, 0.1)', borderRadius: '8px', border: '1px solid var(--success)', color: 'var(--success)', fontSize: '0.75rem', fontWeight: '800' }}>
                                        ✨ MEAVEN CERTIFIED PARTNER
                                    </div>
                                ) : (
                                    <div title={!isEligible ? "Verification Requirements Incomplete: Ensure Phone, Address, PAN, and all 3 Mandatory Docs are present." : "Ready for Institutional Certification"}>
                                        <button 
                                            disabled={!isEligible || isReadOnly}
                                            onClick={() => onUpdateVendor(selectedVendor.id, { status: 'Certified', msaStatus: 'Pending' })}
                                            className="btn btn-primary" 
                                            style={{ width: '100%', fontSize: '0.75rem', padding: '0.6rem', opacity: isEligible ? 1 : 0.4 }}
                                        >
                                            {isEligible ? 'UPGRADE TO CERTIFIED PARTNER' : '🔒 CERTIFICATION LOCKED'}
                                        </button>
                                        {!isEligible && (
                                            <p style={{ fontSize: '0.55rem', color: 'var(--danger)', marginTop: '0.5rem', textAlign: 'center' }}>
                                                Checklist: {!hasPhone && 'Phone, '}{!hasAddress && 'Address, '}{!hasPan && 'PAN, '}{(!hasGstDoc || !hasPanDoc || !hasChequeDoc) && 'Compliance Docs'} missing.
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* MSA Workflow */}
                                {selectedVendor.status === 'Certified' && (
                                    <div style={{ marginTop: '1rem' }}>
                                        {selectedVendor.msaStatus === 'Executed' ? (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.8rem', background: 'rgba(123, 97, 255, 0.1)', border: '1px solid #7b61ff', color: '#7b61ff', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800' }}>
                                                📜 MSA EXECUTED
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => setIsMsaModalOpen(true)}
                                                className="btn btn-outline" 
                                                style={{ width: '100%', color: '#7b61ff', borderColor: '#7b61ff', fontSize: '0.75rem' }}
                                            >
                                                {selectedVendor.msaStatus === 'Sent' ? '⌛ AWAITING SIGNATURE' : '📜 ISSUE MSA CONTRACT'}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {activeContractId ? (
                    <div className="card animate-fade-in" style={{ border: '1px solid var(--accent-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <h3 style={{ margin: 0 }}>{selectedContract.projectName} Ledger</h3>
                                    {(() => {
                                        const p = projects.find(proj => proj.name === selectedContract.projectName);
                                        const status = p?.status || 'Active';
                                        return (
                                            <span 
                                                style={{ 
                                                    fontSize: '0.6rem', padding: '0.2rem 0.8rem', borderRadius: '20px', 
                                                    background: status === 'Completed' ? 'var(--success)' : (status === 'On Hold' ? 'var(--danger)' : (status === 'Final Closure' ? '#7b61ff' : 'var(--accent-color)')),
                                                    color: status === 'Final Closure' ? '#fff' : '#000', fontWeight: '800'
                                                }}
                                            >
                                                {status.toUpperCase()}
                                            </span>
                                        );
                                    })()}
                                </div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.4rem' }}>Tracking independent financial cycles for this site.</p>
                            </div>
                            {!isReadOnly && (
                                <button className="btn btn-primary" onClick={() => setIsPaymentModalOpen(true)} style={{ fontSize: '0.8rem' }}>+ Log Payment</button>
                            )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.8rem', marginBottom: '2rem' }}>
                            <div style={{ padding: '0.8rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                                <p style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Contract</p>
                                <p style={{ fontSize: '1.1rem', fontWeight: '800', margin: '0.2rem 0', filter: isReadOnly ? 'blur(6px)' : 'none' }}>₹{(contractFin.order / 100000).toFixed(2)}L</p>
                            </div>
                            <div style={{ padding: '0.8rem', background: 'rgba(50, 215, 75, 0.05)', borderRadius: '8px' }}>
                                <p style={{ fontSize: '0.55rem', color: 'var(--success)', textTransform: 'uppercase' }}>Paid</p>
                                <p style={{ fontSize: '1.1rem', fontWeight: '800', margin: '0.2rem 0', filter: isReadOnly ? 'blur(6px)' : 'none' }}>₹{(contractFin.paid / 100000).toFixed(2)}L</p>
                            </div>
                            <div style={{ padding: '0.8rem', background: 'rgba(255, 69, 58, 0.05)', borderRadius: '8px' }}>
                                <p style={{ fontSize: '0.55rem', color: 'var(--danger)', textTransform: 'uppercase' }}>Due</p>
                                <p style={{ fontSize: '1.1rem', fontWeight: '800', margin: '0.2rem 0', filter: isReadOnly ? 'blur(6px)' : 'none' }}>₹{(contractFin.due / 100000).toFixed(2)}L</p>
                            </div>
                        </div>

                        <h4 style={{ fontSize: '0.9rem', marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Recent Project Transactions</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            {(selectedContract.payments || []).length > 0 ? selectedContract.payments.map(p => (
                                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-standard)', border: '1px solid var(--border-color)' }}>
                                    <div>
                                        <p style={{ margin: 0, fontWeight: '700', fontSize: '1.1rem', filter: isReadOnly ? 'blur(6px)' : 'none' }}>₹{(p.amount / 100000).toFixed(2)}L</p>
                                        <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{p.date} | Ref: {p.ref}</p>
                                    </div>
                                    {p.screenshot && (
                                        <button onClick={() => window.open(p.screenshot)} style={{ fontSize: '0.7rem', color: 'var(--accent-color)' }}>View Evidence 📎</button>
                                    )}
                                </div>
                            )) : <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textAlign: 'center', padding: '2rem' }}>No payments logged for this contract yet.</p>}
                        </div>
                    </div>
                ) : (
                    <div className="card" style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border-color)', background: 'none' }}>
                        <p style={{ color: 'var(--text-secondary)' }}>Select a project from the sidebar to view detailed financial tracking.</p>
                    </div>
                )}

                <div className="card">
                    <h4 style={{ marginBottom: '1.5rem' }}>🔍 Partner Intelligence Timeline</h4>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                        <textarea 
                            readOnly={isReadOnly}
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="Add a global behavior note, warning, or execution tip..."
                            style={{ flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem', color: '#fff', fontSize: '0.9rem' }}
                        />
                        <button 
                            disabled={!noteText.trim() || isReadOnly}
                            onClick={() => { onAddNote(selectedVendor.id, noteText); setNoteText(''); }}
                            className="btn btn-primary" style={{ height: 'fit-content', padding: '0.8rem 1.5rem' }}
                        >Post</button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
                        {(selectedVendor.history || []).slice().reverse().map((h, i) => (
                            <div key={h.id} style={{ display: 'flex', gap: '1.5rem', position: 'relative' }}>
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: h.type === 'contract' ? 'var(--accent-color)' : (h.type === 'payment' ? 'var(--success)' : '#444'), marginTop: '6px', zIndex: 2 }} />
                                {i < selectedVendor.history.length - 1 && <div style={{ position: 'absolute', left: '5px', top: '20px', bottom: '-25px', width: '2px', background: 'var(--border-color)' }} />}
                                <div style={{ flex: 1 }}>
                                    <p style={{ margin: 0, fontWeight: '700', fontSize: '0.95rem' }}>{h.title}</p>
                                    <p style={{ margin: '0.3rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{h.detail}</p>
                                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#444' }}>{h.date}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* INTEGRATED PROJECT LINK/CREATE MODAL */}
        {isContractModalOpen && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5000 }}>
                <div className="card animate-fade-in" style={{ width: 'clamp(300px, 95%, 450px)', padding: 'clamp(1.5rem, 5vw, 2.5rem)' }}>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                        <button onClick={() => setLinkMode('existing')} style={{ flex: 1, padding: '0.5rem', background: linkMode === 'existing' ? 'var(--accent-color)' : 'none', color: linkMode === 'existing' ? '#000' : 'var(--text-secondary)', border: 'none', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}>Choose Existing</button>
                        <button onClick={() => setLinkMode('new')} style={{ flex: 1, padding: '0.5rem', background: linkMode === 'new' ? 'var(--accent-color)' : 'none', color: linkMode === 'new' ? '#000' : 'var(--text-secondary)', border: 'none', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}>+ Create New Site</button>
                    </div>

                    <form onSubmit={(e) => {
                        e.preventDefault()
                        const formData = new FormData(e.target)
                        let pName = formData.get('projectName')
                        
                        if (linkMode === 'existing') {
                            // CHECK FOR DUPLICATE LINKING
                            const existingVendor = vendors.find(v => v.contracts?.some(c => c.projectName === pName))
                            if (existingVendor) {
                                alert(`CRITICAL CONFLICT: This project is already linked to ${existingVendor.name}. Each project site is limited to one primary partner to ensure accountability.`)
                                return
                            }
                        }

                        if (linkMode === 'new') {
                            const newPName = formData.get('newProjectName')
                            onAddProject({
                                name: newPName,
                                client: formData.get('client'),
                                pmEmail: formData.get('pmEmail') || 'support@meaven.co'
                            })
                            pName = newPName
                        }

                        onAddContract(selectedVendor.id, pName, formData.get('orderValue'))
                        setIsContractModalOpen(false)
                    }} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        
                        {linkMode === 'existing' ? (
                            <div>
                                <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>SELECT ACTIVE PROJECT</label>
                                <select name="projectName" required style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.8rem', color: '#fff' }}>
                                    {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                </select>
                            </div>
                        ) : (
                            <>
                                <div>
                                    <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>NEW PROJECT NAME</label>
                                    <input name="newProjectName" required placeholder="e.g. Nexus Innovation Hub" style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.8rem', color: '#fff' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>CLIENT NAME</label>
                                    <input name="client" required placeholder="Company Name" style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.8rem', color: '#fff' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>PROJECT MANAGER EMAIL</label>
                                    <input name="pmEmail" type="email" placeholder="pm@client.com" style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.8rem', color: '#fff' }} />
                                </div>
                            </>
                        )}

                        <div>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>TOTAL CONTRACT ORDER (INR)</label>
                            <input name="orderValue" type="number" required placeholder="Project-specific order value" style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.8rem', color: '#fff' }} />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <button type="button" onClick={() => setIsContractModalOpen(false)} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>{linkMode === 'new' ? 'Create & Link' : 'Link Contract'}</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* PAYMENT MODAL (Existing logic) */}
        {isPaymentModalOpen && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5000 }}>
                <div className="card animate-fade-in" style={{ width: 'clamp(300px, 95%, 450px)', padding: 'clamp(1.5rem, 5vw, 2.5rem)' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Log Payment for {selectedContract.projectName}</h3>
                    <form onSubmit={(e) => {
                        e.preventDefault()
                        const formData = new FormData(e.target)
                        const reader = new FileReader()
                        const file = e.target.screenshot.files[0]
                        
                        const savePayment = (screenshotData = null) => {
                            onAddPayment(selectedVendor.id, selectedContract.id, {
                                amount: parseInt(formData.get('amount')),
                                date: formData.get('date'),
                                ref: formData.get('ref'),
                                status: 'Paid',
                                screenshot: screenshotData
                            })
                            setIsPaymentModalOpen(false)
                        }

                        if (file) {
                            reader.onloadend = () => savePayment(reader.result)
                            reader.readAsDataURL(file)
                        } else {
                            savePayment()
                        }
                    }} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        <div>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>AMOUNT (INR)</label>
                            <input name="amount" type="number" required placeholder="Amount for this specific project" style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.8rem', color: '#fff' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>DATE OF PAYMENT</label>
                            <input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.8rem', color: '#fff' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>TRANSACTION REF</label>
                            <input name="ref" required placeholder="UTR / Ref Number" style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.8rem', color: '#fff' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>PAYMENT SCREENSHOT</label>
                            <input name="screenshot" type="file" accept="image/*" style={{ fontSize: '0.8rem' }} />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Save Entry</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
        {/* DOCUMENT VAULT MODAL */}
        {isVaultModalOpen && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 6000 }}>
                <div className="card animate-fade-in" style={{ width: 'clamp(300px, 95%, 650px)', padding: '2.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h3 style={{ margin: 0 }}>🗄️ Partner Document Vault</h3>
                        <button onClick={() => setIsVaultModalOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                    </div>

                    <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <h4 style={{ marginTop: 0, fontSize: '0.8rem', color: 'var(--accent-color)', textTransform: 'uppercase' }}>Upload New Verification Docs</h4>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <input 
                                type="file" 
                                id="vault-upload"
                                multiple
                                onChange={(e) => {
                                    const files = Array.from(e.target.files);
                                    const newDocs = files.map(f => ({
                                        id: Date.now() + Math.random(),
                                        name: f.name,
                                        type: f.type,
                                        date: new Date().toISOString().split('T')[0],
                                        url: URL.createObjectURL(f)
                                    }));
                                    onUpdateVendor(selectedVendor.id, { 
                                        documents: [...(selectedVendor.documents || []), ...newDocs] 
                                    });
                                }}
                                style={{ display: 'none' }} 
                            />
                            <button onClick={() => document.getElementById('vault-upload').click()} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>+ Select Files</button>
                            <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Accepts PDF, PNG, JPG</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {(selectedVendor.documents || []).length > 0 ? (selectedVendor.documents.map(doc => (
                            <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: '40px', height: '40px', background: 'rgba(102, 178, 194, 0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                                        {doc.type.includes('pdf') ? '📄' : '🖼️'}
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, fontWeight: '700', fontSize: '0.85rem' }}>{doc.name}</p>
                                        <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Uploaded: {doc.date}</p>
                                    </div>
                                </div>
                                
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <select 
                                        value={doc.tag || ''}
                                        onChange={(e) => {
                                            const updatedDocs = selectedVendor.documents.map(d => 
                                                d.id === doc.id ? { ...d, tag: e.target.value } : d
                                            );
                                            onUpdateVendor(selectedVendor.id, { documents: updatedDocs });
                                        }}
                                        style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', color: doc.tag ? 'var(--success)' : '#fff', fontSize: '0.7rem', padding: '0.3rem', borderRadius: '4px' }}
                                    >
                                        <option value="">No Tag</option>
                                        <option value="GST">GST Cert</option>
                                        <option value="PAN">PAN Card</option>
                                        <option value="Cheque">Cancelled Cheque</option>
                                        <option value="Other">Other</option>
                                    </select>
                                    <a href={doc.url} download={doc.name} style={{ textDecoration: 'none', fontSize: '1.2rem' }} title="Download">📥</a>
                                    <button 
                                        onClick={() => {
                                            const updatedDocs = selectedVendor.documents.filter(d => d.id !== doc.id);
                                            onUpdateVendor(selectedVendor.id, { documents: updatedDocs });
                                        }}
                                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.9rem' }}
                                    >🗑️</button>
                                </div>
                            </div>
                        ))) : (
                            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                                <p>No documents found in vault.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
        {/* MSA CONTRACT MODAL / ESIGN PORTAL */}
        {isMsaModalOpen && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(30px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 7000 }}>
                <div className="card animate-fade-in" style={{ width: 'clamp(300px, 95%, 800px)', padding: '0', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '1.5rem 2rem', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, color: 'var(--accent-color)' }}>{isEsignMode ? '✍️ Digital Signature Portal' : '📜 MSA Contract Generation'}</h3>
                        <button onClick={() => { setIsMsaModalOpen(false); setIsEsignMode(false); }} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '3rem', background: '#fff', color: '#333', fontFamily: 'serif' }}>
                        <div style={{ maxWidth: '600px', margin: '0 auto', fontSize: '0.9rem', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
                            {(() => {
                                let content = msaTemplate || '';
                                content = content.replace(/{{VENDOR_NAME}}/g, selectedVendor.name || '');
                                content = content.replace(/{{ADDRESS}}/g, selectedVendor.address || '[ADDRESS PENDING]');
                                content = content.replace(/{{GST}}/g, selectedVendor.gst || '');
                                content = content.replace(/{{PAN}}/g, selectedVendor.pan || '');
                                content = content.replace(/{{DATE}}/g, new Date().toLocaleDateString());
                                content = content.replace(/{{CATEGORY}}/g, selectedVendor.category || '');
                                return content;
                            })()}

                            <div style={{ marginTop: '4rem', borderTop: '2px solid #333', paddingTop: '2rem', display: 'flex', justifyContent: 'space-between' }}>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#666' }}>Meaven Designs Authorised Signatory</p>
                                    <p style={{ fontFamily: '"Great Vibes", cursive', fontSize: '1.5rem', margin: '0.5rem 0' }}>Ravi Bhargaw</p>
                                    <p style={{ fontSize: '0.7rem' }}>Director of Operations</p>
                                </div>
                                <div style={{ flex: 1, textAlign: 'right' }}>
                                    <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#666' }}>Partner Authorised Signatory</p>
                                    {selectedVendor.msaStatus === 'Executed' ? (
                                        <>
                                            <p style={{ fontFamily: '"Great Vibes", cursive', fontSize: '1.5rem', margin: '0.5rem 0', color: 'var(--success)' }}>{selectedVendor.signerName}</p>
                                            <p style={{ fontSize: '0.7rem' }}>Digitally Signed on {selectedVendor.msaDate}</p>
                                        </>
                                    ) : (
                                        <div style={{ height: '50px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '0.7rem' }}>
                                            {isEsignMode ? 'AWAITING SIGNATURE' : 'PENDING ISSUE'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ padding: '2rem', background: 'var(--bg-accent)', borderTop: '1px solid var(--border-color)' }}>
                        {!isEsignMode ? (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Review the contract terms before issuing to the partner.</p>
                                <button 
                                    onClick={() => {
                                        onUpdateVendor(selectedVendor.id, { msaStatus: 'Sent' });
                                        setIsEsignMode(true); // Switch to Esign Mode for simulation
                                    }}
                                    className="btn btn-primary"
                                >
                                    🚀 Issue & Send to Partner
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Type Full Name to Sign Digitally</label>
                                        <input 
                                            value={signerName}
                                            onChange={(e) => setSignerName(e.target.value)}
                                            placeholder="John Doe"
                                            style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--accent-color)', borderRadius: '8px', padding: '1rem', color: '#fff', fontSize: '1.1rem', fontFamily: '"Great Vibes", cursive' }}
                                        />
                                    </div>
                                    <button 
                                        disabled={!signerName.trim()}
                                        onClick={() => {
                                            const signedDate = new Date().toLocaleDateString();
                                            const newDoc = {
                                                id: Date.now(),
                                                name: `Executed_MSA_${selectedVendor.name}.pdf`,
                                                type: 'application/pdf',
                                                date: signedDate,
                                                tag: 'MSA',
                                                url: '#',
                                                status: 'Signed'
                                            };
                                            onUpdateVendor(selectedVendor.id, { 
                                                msaStatus: 'Executed', 
                                                msaDate: signedDate, 
                                                signerName: signerName,
                                                documents: [...(selectedVendor.documents || []), newDoc]
                                            });
                                            setIsMsaModalOpen(false);
                                            setIsEsignMode(false);
                                            setSignerName('');
                                            alert("Contract Executed! The signed PDF has been automatically stored in the Document Vault.");
                                        }}
                                        className="btn btn-primary" 
                                        style={{ padding: '1.2rem 2.5rem', fontSize: '1rem' }}
                                    >
                                        ✅ Sign & Execute
                                    </button>
                                </div>
                                <p style={{ margin: 0, fontSize: '0.6rem', color: 'var(--text-secondary)', textAlign: 'center' }}>By clicking 'Sign & Execute', you acknowledge that this typed signature is legally binding and equivalent to a hand-written signature.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
      </div>
    )
  }

  // LIST VIEW
  return (
    <div className="vendor-scoring-module animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <button 
            onClick={onBack} 
            style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', marginBottom: '1rem', fontSize: '0.8rem', fontWeight: '700', padding: 0 }}
          >
            ← RETURN TO WAR ROOM
          </button>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Vendor Intelligence Hub</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Centralized partner lifecycle and performance management.</p>
        </div>
        {!isReadOnly && (
          <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
            <span>+</span> Register New Vendor
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <input 
          type="text" 
          placeholder="Search partners..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 2, background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#fff' }}
        />
        <select 
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={{ flex: 1, background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#fff' }}
        >
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select 
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ flex: 1, background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#fff' }}
        >
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.2rem' }}>
        {filteredVendors.map(vendor => {
          const score = calculateScore(vendor.metrics)
          const globalFin = getGlobalFinancials(vendor)

          return (
            <div key={vendor.id} className="card vendor-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', cursor: 'pointer', position: 'relative', overflow: 'hidden' }} onClick={() => handleSetSelectedVendor(vendor.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(102, 178, 194, 0.1)', color: 'var(--accent-color)', textTransform: 'uppercase', fontWeight: '700' }}>{vendor.category}</span>
                  <h3 style={{ 
                      marginTop: '0.5rem', 
                      fontSize: '1.1rem',
                      filter: isReadOnly ? 'blur(4px)' : 'none',
                      opacity: isReadOnly ? 0.4 : 1,
                      transition: 'all 0.3s ease'
                  }}>
                    {vendor.name}
                    {vendor.id === Math.max(...filteredVendors.map(v => v.id)) && !isReadOnly && (
                        vendor.status === 'Certified' ? (
                            <span style={{ marginLeft: '0.5rem', fontSize: '0.6rem', color: 'var(--success)', border: '1px solid var(--success)', padding: '0.1rem 0.4rem', borderRadius: '4px', verticalAlign: 'middle' }}>AI RECOMMENDED</span>
                        ) : (
                            <span 
                                title={`PENDING COMPLIANCE: ${!vendor.isGstVerified ? 'GST Verification' : ''}${!vendor.isGstVerified && !vendor.isCertVerified ? ', ' : ''}${!vendor.isCertVerified ? 'Technical Quality Audit' : ''} required before certification.`}
                                style={{ marginLeft: '0.5rem', fontSize: '0.6rem', color: '#FF9500', border: '1px solid #FF9500', padding: '0.1rem 0.4rem', borderRadius: '4px', verticalAlign: 'middle', cursor: 'help' }}
                            >
                                ⚠️ AI RECOMMENDED (VETTING INCOMPLETE)
                            </span>
                        )
                    )}
                  </h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'end', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', borderRadius: '20px', background: vendor.status === 'Certified' ? 'rgba(50, 215, 75, 0.1)' : 'rgba(255, 149, 0, 0.1)', color: vendor.status === 'Certified' ? 'var(--success)' : '#FF9500', fontWeight: '600' }}>
                        {vendor.status}
                    </span>
                    <div style={{ fontSize: '1.2rem', fontWeight: '800', color: score > 80 ? 'var(--success)' : 'var(--accent-color)' }}>
                        {score}
                    </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
                <div>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '0.2rem', fontSize: '0.7rem' }}>CONTACT</p>
                  <p>{vendor.contact}</p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '0.2rem', fontSize: '0.7rem' }}>PORTFOLIO DUE</p>
                  <p style={{ fontWeight: '700', color: 'var(--danger)', filter: isReadOnly ? 'blur(6px)' : 'none' }}>₹{(globalFin.due / 100000).toFixed(2)}L</p>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-color)' }}>Manage Contracts →</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{vendor.contracts?.length || 0} Active Projects</span>
              </div>
            </div>
          )
        })}
      </div>

      {isAddModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}>
          <div className="card animate-fade-in" style={{ width: 'clamp(300px, 95%, 450px)', padding: 'clamp(1.5rem, 5vw, 2.5rem)' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Register New Partner</h3>
            <form onSubmit={(e) => {
                e.preventDefault()
                const form = e.currentTarget
                const formData = new FormData(form)
                const files = form.querySelector('input[type="file"]').files
                
                const newVendorData = {
                    name: formData.get('name'),
                    category: formData.get('category'),
                    contact: formData.get('contact'),
                    phone: formData.get('phone'),
                    gst: formData.get('gst'),
                    address: formData.get('address') || '',
                    pan: formData.get('pan') || '',
                    status: 'Vetting',
                    isGstVerified: false,
                    isCertVerified: false,
                    metrics: { price: 50, speed: 50, precision: 50, communication: 50 },
                    history: [{ id: Date.now(), type: 'registration', title: 'Partner Onboarded', detail: 'Added to Meaven database via CRM', date: new Date().toISOString().split('T')[0] }],
                    contracts: [],
                    documents: Array.from(files).slice(0, 5).map(f => ({
                        id: Date.now() + Math.random(),
                        name: f.name,
                        type: f.type,
                        date: new Date().toISOString().split('T')[0],
                        url: URL.createObjectURL(f) // Local preview URL
                    })),
                    notes: ''
                }

                onAddVendor(newVendorData)
                setIsAddModalOpen(false)
            }} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <input name="name" required placeholder="Company Name" style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.8rem', color: '#fff' }} />
              <select name="category" style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.8rem', color: '#fff' }}>
                {categories.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input name="contact" required placeholder="Primary Contact Person" style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.8rem', color: '#fff' }} />
              <input name="phone" required placeholder="Phone Number" style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.8rem', color: '#fff' }} />
              <input name="gst" required placeholder="GST Number" style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.8rem', color: '#fff' }} />
              
              <div style={{ border: '1px dashed var(--border-color)', borderRadius: '8px', padding: '1rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Onboarding Attachments (Max 5: PDF, PNG, JPG)</p>
                  <input type="file" multiple accept=".pdf,.png,.jpg,.jpeg" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }} />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Add to Pipeline</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default VendorScoring
