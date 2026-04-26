import { useState } from 'react'

// MOVE OUTSIDE to prevent re-mounting on every state change (which causes focus loss)
const ModalOverlay = ({ children }) => (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
        {children}
    </div>
)

const ProjectDirectory = ({ projects = [], vendors = [], portfolios = [], onSelectProject, onAddExpense, onUpdateValue, onLogPayment, onLogPayout, onAddVendor, onAssignPartner, onReassignPartner }) => {
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeSubTab, setActiveSubTab] = useState('overview') 
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false)
  const [isEditingValue, setIsEditingValue] = useState(false)
  const [isRegisteringNew, setIsRegisteringNew] = useState(false)
  
  // Form States for robustness
  const [selectedVendorId, setSelectedVendorId] = useState('')
  const [assignOrderValue, setAssignOrderValue] = useState('')

  const filteredProjects = (projects || []).filter(p => 
    (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.client || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedProject = (projects || []).find(p => p.id === selectedProjectId)

  // Find linked vendor (Active only)
  const linkedVendor = (vendors || []).find(v => (v.contracts || []).some(c => c.projectName === selectedProject?.name && c.status === 'Active'))

  // INTELLIGENCE ENGINE: Recommend Top 3 Best Fit Vendors
  const getRecommendations = () => {
    if (!selectedProject || (vendors || []).length === 0) return []
    
    return [...vendors]
        .filter(v => v.id !== linkedVendor?.id) 
        .sort((a, b) => (b.miScore || 0) - (a.miScore || 0))
        .slice(0, 3) 
        .map((top, index) => {
            let reason = `Top-tier reliability based on past Meaven site audits.`
            if (top.scores?.quality > 95) reason = `Exceptional quality standards; zero defects reported on recent projects.`
            else if (top.scores?.timeline > 90) reason = `Fast-track specialist; 90% accuracy in hitting site-readiness dates.`
            
            return { ...top, reason, rank: index + 1 }
        })
  }

  const recommendations = getRecommendations()

  const handleQuickAssign = (vendorId) => {
    setSelectedVendorId(vendorId.toString())
    setIsAssignModalOpen(true)
  }

  const submitAssignment = (e) => {
    e.preventDefault()
    if (!selectedProject || !selectedVendorId || !assignOrderValue) {
        alert('Please select a vendor and enter a contract value.')
        return
    }
    
    onAssignPartner(selectedProject.id, selectedVendorId, assignOrderValue)
    
    // Reset and Close
    setIsAssignModalOpen(false)
    setSelectedVendorId('')
    setAssignOrderValue('')
  }

  const getPL = (p) => {
    if (!p) return { revenue: 0, cogs: 0, expenses: 0, profit: 0, margin: 0 }
    const revenue = p.clientFinancials?.totalValue || 0
    const vendorList = vendors || []
    const cogs = vendorList.reduce((sum, v) => {
        const projectContract = (v.contracts || []).find(c => c.projectName === p.name && c.status === 'Active')
        return sum + (projectContract ? (parseInt(projectContract.orderValue) || 0) : 0)
    }, 0)
    const expenses = (p.expenses || []).reduce((sum, e) => sum + (parseInt(e.amount) || 0), 0)
    const profit = revenue - cogs - expenses
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0
    return { revenue, cogs, expenses, profit, margin }
  }

  if (selectedProject) {
    const pl = getPL(selectedProject)
    const financials = selectedProject.clientFinancials || { totalValue: 0, requests: [], received: [] }
    const totalReceived = (financials.received || []).reduce((sum, r) => sum + r.amount, 0)
    const outstanding = pl.revenue - totalReceived

    return (
      <div className="project-detail-view animate-fade-in" style={{ paddingBottom: '5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <button 
                    onClick={() => { setSelectedProjectId(null); setActiveSubTab('overview'); setIsEditingValue(false); }} 
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-color)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' }}
                >
                    ← Back to Project Directory
                </button>
                <div style={{ padding: '0.3rem 1rem', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.65rem', fontWeight: '800', letterSpacing: '0.1em' }}>
                    💎 PROJECT FINANCIAL DEEP-DIVE
                </div>
            </div>
            <div style={{ display: 'flex', background: 'var(--bg-accent)', padding: '0.4rem', borderRadius: '8px', gap: '0.5rem' }}>
                <button 
                    onClick={() => setActiveSubTab('overview')}
                    style={{ padding: '0.4rem 1rem', borderRadius: '6px', border: 'none', background: activeSubTab === 'overview' ? 'var(--accent-color)' : 'none', color: activeSubTab === 'overview' ? '#000' : '#fff', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}
                >Execution Overview</button>
                <button 
                    onClick={() => setActiveSubTab('financials')}
                    style={{ padding: '0.4rem 1rem', borderRadius: '6px', border: 'none', background: activeSubTab === 'financials' ? 'var(--accent-color)' : 'none', color: activeSubTab === 'financials' ? '#000' : '#fff', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}
                >Financial Intelligence (P&L)</button>
            </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
            <div>
                <h1 style={{ margin: 0 }}>{selectedProject.name}</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: '0.5rem' }}>Client: {selectedProject.client} | PM: {selectedProject.pmEmail}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: pl.margin > 30 ? 'var(--success)' : 'var(--accent-color)' }}>
                    {pl.margin.toFixed(1)}%
                </div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Project EBITDA Margin</span>
            </div>
        </div>

        {activeSubTab === 'overview' ? (
            <div className="animate-fade-in">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
                    <div className="card" style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Contract Value</p>
                        {isEditingValue ? (
                            <input 
                                autoFocus type="number" defaultValue={pl.revenue}
                                onBlur={(e) => { onUpdateValue(selectedProject.id, e.target.value); setIsEditingValue(false); }}
                                onKeyDown={(e) => { if (e.key === 'Enter') { onUpdateValue(selectedProject.id, e.target.value); setIsEditingValue(false); }}}
                                style={{ background: 'var(--bg-accent)', border: '1px solid var(--accent-color)', borderRadius: '4px', padding: '0.4rem', color: '#fff', fontSize: '1.2rem', width: '100%' }}
                            />
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                <p style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>₹{(pl.revenue / 100000).toFixed(2)}L</p>
                                <button onClick={() => setIsEditingValue(true)} style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', fontSize: '0.7rem' }}>✎</button>
                            </div>
                        )}
                    </div>

                    <div className="card" style={{ 
                        background: linkedVendor ? 'rgba(50, 215, 75, 0.05)' : 'rgba(255, 69, 58, 0.05)',
                        border: linkedVendor ? 'none' : '1px solid var(--danger)',
                        position: 'relative'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <p style={{ fontSize: '0.65rem', color: linkedVendor ? 'var(--success)' : 'var(--danger)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Execution Partner</p>
                            {linkedVendor ? (
                                <button onClick={() => setIsReassignModalOpen(true)} style={{ background: '#ff453a22', border: '1px solid var(--danger)', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.55rem', fontWeight: '800', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>⚠ REPLACE</button>
                            ) : (
                                <button onClick={() => { setSelectedVendorId(''); setIsAssignModalOpen(true); }} style={{ background: 'var(--accent-color)', border: 'none', color: '#000', cursor: 'pointer', fontSize: '0.55rem', fontWeight: '800', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>+ ASSIGN</button>
                            )}
                        </div>
                        {linkedVendor ? (
                            <div>
                                <p style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0 }}>{linkedVendor.name}</p>
                                <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>MI Score: {linkedVendor.miScore || 0}% | <span style={{ color: 'var(--success)' }}>Active</span></p>
                            </div>
                        ) : (
                            <div>
                                <p style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0, color: 'var(--danger)' }}>UNASSIGNED</p>
                                <p style={{ fontSize: '0.6rem', color: 'var(--text-chars)', marginTop: '0.2rem' }}>Audit Suggestions Below ↓</p>
                            </div>
                        )}
                    </div>

                    <div className="card" style={{ background: 'rgba(50, 215, 75, 0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <p style={{ fontSize: '0.65rem', color: 'var(--success)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Collected till Date</p>
                            <button onClick={() => setIsPaymentModalOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--success)', cursor: 'pointer', fontSize: '0.6rem', fontWeight: '700' }}>+ Log</button>
                        </div>
                        <p style={{ fontSize: '1.5rem', fontWeight: '800' }}>₹{(totalReceived / 100000).toFixed(2)}L</p>
                    </div>

                    <div className="card" style={{ background: 'rgba(255, 69, 58, 0.05)' }}>
                        <p style={{ fontSize: '0.65rem', color: 'var(--danger)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Outstanding Due</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: '800' }}>₹{(outstanding / 100000).toFixed(2)}L</p>
                    </div>
                </div>

                {!linkedVendor && (
                    <div className="card animate-fade-in" style={{ background: 'rgba(102, 178, 194, 0.05)', border: '1px solid rgba(102, 178, 194, 0.2)', marginBottom: '3rem', padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <span style={{ fontSize: '1.5rem' }}>🤖</span>
                                <h4 style={{ margin: 0, color: 'var(--accent-color)' }}>Meaven Intelligence: High-Performance Bench</h4>
                            </div>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                            {recommendations.map(rec => (
                                <div key={rec.id} className="card" style={{ background: 'rgba(255,255,255,0.02)', padding: '1.2rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <span style={{ fontSize: '0.6rem', background: 'var(--accent-color)', color: '#000', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: '800' }}># {rec.rank} SUGGESTION</span>
                                            <span style={{ fontSize: '1.1rem', fontWeight: '800' }}>{rec.miScore || 0}%</span>
                                        </div>
                                        <p style={{ margin: 0, fontWeight: '800', fontSize: '1.1rem' }}>{rec.name}</p>
                                        
                                        {/* Parameter Breakdown */}
                                        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                            {[
                                                { label: 'Quality', val: rec.scores?.quality || 0 },
                                                { label: 'Timeline', val: rec.scores?.timeline || 0 },
                                                { label: 'Behavior', val: rec.scores?.behavior || 0 }
                                            ].map(s => (
                                                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{s.label}</span>
                                                    <div style={{ width: '60px', height: '4px', background: '#222', borderRadius: '2px', position: 'relative' }}>
                                                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${s.val}%`, background: 'var(--accent-color)', borderRadius: '2px' }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <p style={{ margin: '1rem 0', fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: '1.4' }}>"{rec.reason}"</p>
                                    </div>
                                    <button 
                                        onClick={() => handleQuickAssign(rec.id)}
                                        style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--accent-color)', background: 'none', color: 'var(--accent-color)', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', marginTop: '1rem' }}
                                    >
                                        Assign to Project
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
                    <div className="card">
                        <h4 style={{ marginBottom: '2rem' }}>📜 Complete Project Timeline</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
                            {(selectedProject.history || []).slice().reverse().map((h, i) => (
                                <div key={h.id} style={{ display: 'flex', gap: '1.5rem', position: 'relative' }}>
                                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: h.type === 'success' ? 'var(--success)' : (h.type === 'warning' ? 'var(--danger)' : (h.type === 'info' ? 'var(--accent-color)' : '#444')), marginTop: '6px', zIndex: 2 }} />
                                    {i < (selectedProject.history?.length || 0) - 1 && <div style={{ position: 'absolute', left: '5px', top: '20px', bottom: '-25px', width: '2px', background: 'var(--border-color)' }} />}
                                    <div style={{ flex: 1 }}>
                                        <p style={{ margin: 0, fontWeight: '700', fontSize: '0.95rem' }}>{h.title}</p>
                                        <p style={{ margin: '0.3rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{h.detail}</p>
                                        <p style={{ margin: 0, fontSize: '0.7rem', color: '#444' }}>{h.timestamp ? new Date(h.timestamp).toLocaleString() : 'N/A'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="card" style={{ background: 'linear-gradient(135deg, rgba(102, 178, 194, 0.08) 0%, transparent 100%)', border: '1px solid var(--accent-color)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem' }}>
                            <span style={{ fontSize: '1.2rem' }}>🤖</span>
                            <h4 style={{ margin: 0, fontSize: '0.8rem', color: 'var(--accent-color)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>AI Financial Strategy</h4>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.75rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>EBITDA Optimization Potential</span>
                                    <span style={{ color: 'var(--success)', fontWeight: '800' }}>+4.2%</span>
                                </div>
                                <div style={{ height: '4px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                                    <div style={{ height: '100%', width: '85%', background: 'var(--success)', borderRadius: '2px' }}></div>
                                </div>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                                This project maintains a health-margin of <strong>{pl.margin.toFixed(1)}%</strong>. 
                                AI identifies <b>₹{(pl.cogs * 0.05 / 100000).toFixed(2)}L</b> in potential COGS savings through logistics consolidation.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        ) : (
        ) : (
            <div className="animate-fade-in">
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div className="card" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)', gridColumn: 'span 3' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>Project Financial Ledger (P&L)</h3>
                            <div style={{ padding: '0.4rem 1rem', background: 'rgba(50, 215, 75, 0.1)', borderRadius: '20px', color: 'var(--success)', fontSize: '0.7rem', fontWeight: '800' }}>AUDIT READY</div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
                            <div style={{ borderLeft: '3px solid var(--accent-color)', paddingLeft: '1rem' }}>
                                <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Revenue</p>
                                <p style={{ margin: '0.3rem 0 0 0', fontSize: '1.4rem', fontWeight: '800' }}>₹{(pl.revenue / 100000).toFixed(2)}L</p>
                            </div>
                            <div style={{ borderLeft: '3px solid var(--danger)', paddingLeft: '1rem' }}>
                                <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total COGS</p>
                                <p style={{ margin: '0.3rem 0 0 0', fontSize: '1.4rem', fontWeight: '800', color: 'var(--danger)' }}>₹{(pl.cogs / 100000).toFixed(2)}L</p>
                            </div>
                            <div style={{ borderLeft: '3px solid var(--text-secondary)', paddingLeft: '1rem' }}>
                                <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Site Expenses</p>
                                <p style={{ margin: '0.3rem 0 0 0', fontSize: '1.4rem', fontWeight: '800' }}>₹{(pl.expenses / 100000).toFixed(2)}L</p>
                            </div>
                            <div style={{ borderLeft: '3px solid var(--success)', paddingLeft: '1rem' }}>
                                <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Project EBITDA</p>
                                <p style={{ margin: '0.3rem 0 0 0', fontSize: '1.4rem', fontWeight: '800', color: 'var(--success)' }}>₹{(pl.profit / 100000).toFixed(2)}L</p>
                            </div>
                        </div>
                    </div>

                    {/* Section 1: Client Payment Tracking */}
                    <div className="card" style={{ gridColumn: 'span 1.5' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h4 style={{ margin: 0, color: 'var(--success)' }}>📥 Client Revenue Track</h4>
                            <button onClick={() => setIsPaymentModalOpen(true)} style={{ background: 'var(--success)', color: '#000', border: 'none', borderRadius: '4px', padding: '0.3rem 0.8rem', fontSize: '0.7rem', fontWeight: '800', cursor: 'pointer' }}>+ Log Receipt</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            {(selectedProject.clientFinancials?.received || []).map(p => (
                                <div key={p.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                        <span style={{ fontWeight: '800', color: 'var(--success)' }}>+ ₹{p.amount.toLocaleString()}</span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{p.date}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ref: {p.ref}</span>
                                        {p.photo && <span style={{ fontSize: '0.65rem', color: 'var(--accent-color)', cursor: 'pointer' }}>📸 View Receipt</span>}
                                    </div>
                                </div>
                            ))}
                            {(selectedProject.clientFinancials?.received || []).length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No payments recorded yet.</p>}
                        </div>
                    </div>

                    {/* Section 2: Vendor Payout Tracking */}
                    <div className="card" style={{ gridColumn: 'span 1.5' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h4 style={{ margin: 0, color: 'var(--danger)' }}>📤 Vendor Payout Track</h4>
                            <button onClick={() => setIsPayoutModalOpen(true)} style={{ background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.3rem 0.8rem', fontSize: '0.7rem', fontWeight: '800', cursor: 'pointer' }}>+ Log Payout</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            {(selectedProject.payouts || []).map(p => {
                                const vendor = vendors.find(v => v.id === p.vendorId)
                                return (
                                    <div key={p.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                            <span style={{ fontWeight: '800', color: 'var(--danger)' }}>- ₹{p.amount.toLocaleString()}</span>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{p.date}</span>
                                        </div>
                                        <p style={{ margin: '0 0 0.4rem 0', fontSize: '0.8rem', fontWeight: '600' }}>To: {vendor?.name || 'Unassigned Vendor'}</p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ref: {p.ref}</span>
                                            {p.photo && <span style={{ fontSize: '0.65rem', color: 'var(--accent-color)', cursor: 'pointer' }}>📸 View Evidence</span>}
                                        </div>
                                    </div>
                                )
                            })}
                            {(selectedProject.payouts || []).length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No payouts recorded yet.</p>}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* MODALS */}
        {isAssignModalOpen && (
            <ModalOverlay>
                <div className="card animate-fade-in" style={{ width: '450px', padding: '2.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0 }}>Assign Partner</h3>
                        <button 
                            onClick={() => setIsRegisteringNew(!isRegisteringNew)}
                            style={{ background: 'none', border: 'none', color: 'var(--accent-color)', fontSize: '0.7rem', fontWeight: '800', cursor: 'pointer' }}
                        >
                            {isRegisteringNew ? '← Select Bench' : '+ New Partner'}
                        </button>
                    </div>
                    <form onSubmit={(e) => {
                        e.preventDefault()
                        const formData = new FormData(e.currentTarget)
                        if (isRegisteringNew) {
                            const newId = Date.now()
                            onAddVendor({
                                id: newId,
                                name: formData.get('newName'),
                                category: formData.get('newCategory'),
                                contact: formData.get('newContact'),
                                phone: formData.get('newPhone'),
                                status: 'Vetting',
                                metrics: { price: 50, speed: 50, precision: 50, communication: 50 },
                                contracts: []
                            })
                            onAssignPartner(selectedProject.id, newId, formData.get('orderValue'))
                        } else {
                            onAssignPartner(selectedProject.id, selectedVendorId, formData.get('orderValue'))
                        }
                        setIsAssignModalOpen(false)
                        setIsRegisteringNew(false)
                        setSelectedVendorId('')
                        setAssignOrderValue('')
                    }} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        {!isRegisteringNew ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Certified Bench</label>
                                <select 
                                    value={selectedVendorId} 
                                    onChange={(e) => setSelectedVendorId(e.target.value)} 
                                    required 
                                    style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.8rem', color: '#fff' }}
                                >
                                    <option value="">Choose partner...</option>
                                    {vendors.map(v => <option key={v.id} value={v.id.toString()}>{v.name} ({v.category})</option>)}
                                </select>
                            </div>
                        ) : (
                            <>
                                <input name="newName" required placeholder="Company Name" style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.8rem', color: '#fff' }} />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <select name="newCategory" style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.8rem', color: '#fff' }}>
                                        <option value="Civil">Civil</option>
                                        <option value="Carpentry">Carpentry</option>
                                        <option value="Electrical">Electrical</option>
                                        <option value="Plumbing">Plumbing</option>
                                        <option value="Glass">Glass</option>
                                    </select>
                                    <input name="newPhone" required placeholder="Phone" style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.8rem', color: '#fff' }} />
                                </div>
                                <input name="newContact" required placeholder="Contact Person" style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.8rem', color: '#fff' }} />
                            </>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Contract Value (INR)</label>
                            <input name="orderValue" type="number" required placeholder="Ex: 1500000" style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.8rem', color: '#fff' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button type="button" onClick={() => { setIsAssignModalOpen(false); setIsRegisteringNew(false); }} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>{isRegisteringNew ? 'Register & Assign' : 'Confirm Assignment'}</button>
                        </div>
                    </form>
                </div>
            </ModalOverlay>
        )}

        {isReassignModalOpen && (
            <ModalOverlay>
                <div className="card animate-fade-in" style={{ width: '450px', padding: '2.5rem', border: '1px solid var(--danger)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0, color: 'var(--danger)' }}>Replace Partner</h3>
                        <button 
                            onClick={() => setIsRegisteringNew(!isRegisteringNew)}
                            style={{ background: 'rgba(102, 178, 194, 0.1)', border: '1px solid var(--accent-color)', color: 'var(--accent-color)', fontSize: '0.65rem', fontWeight: '800', cursor: 'pointer', padding: '0.3rem 0.6rem', borderRadius: '4px' }}
                        >
                            {isRegisteringNew ? '← Select Existing' : '+ Register New'}
                        </button>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>Terminating contract with <strong>{linkedVendor?.name}</strong>.</p>
                    
                    <form onSubmit={(e) => {
                        e.preventDefault()
                        const formData = new FormData(e.currentTarget)
                        if (isRegisteringNew) {
                            const newId = Date.now()
                            onAddVendor({
                                id: newId,
                                name: formData.get('newName'),
                                category: formData.get('newCategory'),
                                contact: formData.get('newContact'),
                                phone: formData.get('newPhone'),
                                status: 'Vetting',
                                metrics: { price: 50, speed: 50, precision: 50, communication: 50 },
                                contracts: []
                            })
                            onReassignPartner(selectedProject.id, linkedVendor?.id, newId, formData.get('orderValue'))
                        } else {
                            onReassignPartner(selectedProject.id, linkedVendor?.id, formData.get('vendorId'), formData.get('orderValue'))
                        }
                        setIsReassignModalOpen(false)
                        setIsRegisteringNew(false)
                    }} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        
                        {!isRegisteringNew ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Select Replacement</label>
                                <select name="vendorId" style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.8rem', color: '#fff' }}>
                                    <option value="">Select later (Unassigned)</option>
                                    {vendors.filter(v => v.id !== linkedVendor?.id).map(v => <option key={v.id} value={v.id.toString()}>{v.name} ({v.category})</option>)}
                                </select>
                            </div>
                        ) : (
                            <>
                                <input name="newName" required placeholder="New Company Name" style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.8rem', color: '#fff' }} />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <select name="newCategory" style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.8rem', color: '#fff' }}>
                                        <option value="Civil">Civil</option>
                                        <option value="Carpentry">Carpentry</option>
                                        <option value="Electrical">Electrical</option>
                                        <option value="Plumbing">Plumbing</option>
                                        <option value="Glass">Glass</option>
                                    </select>
                                    <input name="newPhone" required placeholder="Phone" style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.8rem', color: '#fff' }} />
                                </div>
                                <input name="newContact" required placeholder="Contact Person" style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.8rem', color: '#fff' }} />
                            </>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>New Contract Value (INR)</label>
                            <input name="orderValue" type="number" required placeholder="Ex: 1200000" style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.8rem', color: '#fff' }} />
                        </div>
                        
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button type="button" onClick={() => { setIsReassignModalOpen(false); setIsRegisteringNew(false); }} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'var(--danger)', color: '#fff' }}>Terminate & Reassign</button>
                        </div>
                    </form>
                </div>
            </ModalOverlay>
        )}

        {isExpenseModalOpen && (
            <ModalOverlay>
                <div className="card animate-fade-in" style={{ width: '400px', padding: '2.5rem' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Log Project Expense</h3>
                    <form onSubmit={(e) => {
                        e.preventDefault()
                        const formData = new FormData(e.currentTarget)
                        onAddExpense(selectedProject.id, {
                            description: formData.get('description'),
                            amount: parseInt(formData.get('amount')),
                            date: formData.get('date')
                        })
                        setIsExpenseModalOpen(false)
                    }} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        <input name="description" required placeholder="Expense Description" style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.8rem', color: '#fff' }} />
                        <input name="amount" type="number" required placeholder="Amount (INR)" style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.8rem', color: '#fff' }} />
                        <input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.8rem', color: '#fff' }} />
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Log Expense</button>
                        </div>
                    </form>
                </div>
            </ModalOverlay>
        )}

        {isPaymentModalOpen && (
            <ModalOverlay>
                <div className="card animate-fade-in" style={{ width: '450px', padding: '2.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>📥</span>
                        <h3 style={{ margin: 0 }}>Log Client Receipt</h3>
                    </div>
                    <form onSubmit={(e) => {
                        e.preventDefault()
                        const formData = new FormData(e.currentTarget)
                        const photoInput = e.currentTarget.querySelector('input[type="file"]')
                        const photoFile = photoInput.files[0]
                        
                        if (photoFile) {
                            const reader = new FileReader()
                            reader.onloadend = () => {
                                onLogPayment(selectedProject.id, formData.get('amount'), formData.get('ref'), formData.get('date'), reader.result)
                                setIsPaymentModalOpen(false)
                            }
                            reader.readAsDataURL(photoFile)
                        } else {
                            onLogPayment(selectedProject.id, formData.get('amount'), formData.get('ref'), formData.get('date'), null)
                            setIsPaymentModalOpen(false)
                        }
                    }} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Amount (INR) *</label>
                                <input name="amount" type="number" required placeholder="Ex: 500000" style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.8rem', color: '#fff' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Date *</label>
                                <input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.8rem', color: '#fff' }} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Transaction Ref / ID *</label>
                            <input name="ref" required placeholder="UTR / NEFT / Bank ID" style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.8rem', color: '#fff' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Evidence / Screenshot (Optional)</label>
                            <input type="file" accept="image/*" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.8rem', fontSize: '0.75rem' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'var(--success)', color: '#000' }}>Confirm Receipt</button>
                        </div>
                    </form>
                </div>
            </ModalOverlay>
        )}

        {isPayoutModalOpen && (
            <ModalOverlay>
                <div className="card animate-fade-in" style={{ width: '450px', padding: '2.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>📤</span>
                        <h3 style={{ margin: 0 }}>Log Vendor Payout</h3>
                    </div>
                    <form onSubmit={(e) => {
                        e.preventDefault()
                        const formData = new FormData(e.currentTarget)
                        const photoInput = e.currentTarget.querySelector('input[type="file"]')
                        const photoFile = photoInput.files[0]
                        
                        const submit = (photo) => {
                            onLogPayout(selectedProject.id, formData.get('amount'), formData.get('ref'), formData.get('date'), photo, formData.get('vendorId'))
                            setIsPayoutModalOpen(false)
                        }

                        if (photoFile) {
                            const reader = new FileReader()
                            reader.onloadend = () => submit(reader.result)
                            reader.readAsDataURL(photoFile)
                        } else {
                            submit(null)
                        }
                    }} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Select Vendor *</label>
                            <select name="vendorId" required style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.8rem', color: '#fff' }}>
                                <option value="">Choose partner...</option>
                                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Amount (INR) *</label>
                                <input name="amount" type="number" required placeholder="Ex: 200000" style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.8rem', color: '#fff' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Date *</label>
                                <input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.8rem', color: '#fff' }} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Transaction Ref / ID *</label>
                            <input name="ref" required placeholder="Payment ID / Chq No / UTR" style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.8rem', color: '#fff' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Evidence / Screenshot (Optional)</label>
                            <input type="file" accept="image/*" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.8rem', fontSize: '0.75rem' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button type="button" onClick={() => setIsPayoutModalOpen(false)} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'var(--danger)', color: '#fff' }}>Confirm Payout</button>
                        </div>
                    </form>
                </div>
            </ModalOverlay>
        )}
      </div>
    )
  }

  return (
    <div className="project-directory-module animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Execution Financial Hub</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Full lifecycle P&L visibility of all active Meaven sites.</p>
        </div>
        <div style={{ padding: '0.5rem 1.2rem', borderRadius: '20px', background: 'rgba(102, 178, 194, 0.1)', border: '1px solid var(--accent-color)', color: 'var(--accent-color)', fontSize: '0.7rem', fontWeight: '900', letterSpacing: '0.2em' }}>
            🏦 STRATEGIC PORTFOLIO HUB
        </div>
      </div>
      <div style={{ marginBottom: '2rem' }}>
        <input 
          type="text" 
          placeholder="Search by project name or client..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', maxWidth: '400px', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#fff' }}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {(filteredProjects || []).map(p => {
          const pl = getPL(p)
          return (
            <div key={p.id} className="card project-card" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '1rem' }} onClick={() => setSelectedProjectId(p.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{p.name || 'Unnamed Project'}</h3>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Client: {p.client || 'TBD'}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--accent-color)' }}>{pl.margin.toFixed(0)}%</div>
                    <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Margin</span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <div>
                    <p style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Project Revenue</p>
                    <p style={{ margin: 0, fontWeight: '700' }}>₹{(pl.revenue / 100000).toFixed(2)}L</p>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-color)' }}>View Intelligence →</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ProjectDirectory
