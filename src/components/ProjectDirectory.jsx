import { useState, useEffect } from 'react'
import SiteReadiness from './SiteReadiness'

// MOVE OUTSIDE to prevent re-mounting on every state change (which causes focus loss)
const ModalOverlay = ({ children }) => (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
        {children}
    </div>
)

const ProjectDirectory = ({ projects = [], vendors = [], portfolios = [], activeProjectId, onSelectProject, onAddExpense, onUpdateValue, onLogPayment, onLogPayout, onAddVendor, onAssignPartner, onReassignPartner, onAddNote, onToggleVisibility, userRole, onRemoveProject }) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return '---';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}-${m}-${y}`;
  }
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
  const [noteText, setNoteText] = useState('')
  
  // Form States for robustness
  const [selectedVendorId, setSelectedVendorId] = useState('')
  const [assignOrderValue, setAssignOrderValue] = useState('')
  const [isSignOffModalOpen, setIsSignOffModalOpen] = useState(false)
  const [signOffEmail, setSignOffEmail] = useState({ subject: '', body: '', to: '' })
  const [showAllHistory, setShowAllHistory] = useState(false)
  
  useEffect(() => {
    if (activeProjectId) {
        setSelectedProjectId(activeProjectId)
    }
  }, [activeProjectId])

  const handleStatusChange = (newStatus) => {
    if (newStatus === 'Completed') {
        const confirmHandover = window.confirm("Site reaching 100% completion. Initialize Formal Handover Sequence & Client Email Loop?");
        if (confirmHandover) {
            // Prepare Sign-Off Email
            const clientTimeline = (selectedProject.history || [])
                .filter(h => h.isClientVisible)
                .map(h => `- ${h.date || h.timestamp?.split('T')[0]}: ${h.title} (${h.detail})`)
                .join('\n');
            
            setSignOffEmail({
                to: selectedProject.stakeholders?.join(', ') || 'project.manager@meaven.co',
                subject: `Final Sign-off Request: ${selectedProject.name}`,
                body: `Dear Team,\n\nPlease review and provide the final sign-off for ${selectedProject.name}.\n\nAUTHORISED SITE TIMELINE:\n${clientTimeline || 'No entries pushed to client view yet.'}\n\nRegards,\nMeaven Intelligence Hub`
            });
            
            setIsSignOffModalOpen(true);

            onUpdateValue(selectedProject.id, { 
                status: 'Completed',
                isSignOffRequested: true,
                isHandoverPending: true 
            });
        }
    } else {
        onUpdateValue(selectedProject.id, { status: newStatus });
    }
  }

  useEffect(() => {
    if (selectedProjectId) {
        const p = projects.find(proj => Number(proj.id) === Number(selectedProjectId));
        if (p) window.lastActiveProject = p;
    }
  }, [selectedProjectId, projects]);

  const filteredProjects = (projects || []).filter(p => 
    (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.client || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedProject = (projects || []).find(p => p.id === selectedProjectId)

  // Find linked vendor (Active only)
  // Find linked vendor (Robust detection)
  const linkedVendor = (vendors || []).find(v => 
    v.name === selectedProject?.assignedVendor || 
    (v.contracts || []).some(c => 
        (c.projectName || '').toLowerCase().trim() === (selectedProject?.name || '').toLowerCase().trim() && 
        (c.status === 'Active' || !c.status)
    )
  )

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
    const linkedVendor = (vendors || []).find(v => (v.contracts || []).some(c => c.projectName === selectedProject.name && (c.status === 'Active' || !c.status)));

    return (
      <div className="project-detail-view animate-fade-in" style={{ paddingBottom: '5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                <button 
                    onClick={() => { setSelectedProjectId(null); setActiveSubTab('overview'); setIsEditingValue(false); }} 
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-color)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}
                >
                    ← Back
                </button>
                <div style={{ padding: '0.3rem 0.8rem', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.6rem', fontWeight: '800', letterSpacing: '0.1em' }}>
                    💎 FINANCIAL DEEP-DIVE
                </div>
            </div>
            <div style={{ display: 'flex', background: 'var(--bg-accent)', padding: '0.3rem', borderRadius: '8px', gap: '0.3rem', flexWrap: 'wrap' }}>
                <button 
                    onClick={() => setActiveSubTab('overview')}
                    style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', border: 'none', background: activeSubTab === 'overview' ? 'var(--accent-color)' : 'none', color: activeSubTab === 'overview' ? '#000' : '#fff', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                >Overview</button>
                <button 
                    onClick={() => setActiveSubTab('financials')}
                    style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', border: 'none', background: activeSubTab === 'financials' ? 'var(--accent-color)' : 'none', color: activeSubTab === 'financials' ? '#000' : '#fff', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                >P&L Intel</button>
                <button 
                    onClick={() => { window.location.hash = '#calculator'; window.dispatchEvent(new CustomEvent('navigate', { detail: 'calculator' })); }}
                    style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid var(--accent-color)', background: 'none', color: 'var(--accent-color)', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                >🧮 TECH CALC</button>
            </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <h1 style={{ margin: 0, fontSize: 'clamp(1.5rem, 5vw, 2.5rem)' }}>{selectedProject.name}</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <select 
                            value={selectedProject.status || 'Active'}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            style={{ 
                                background: (selectedProject.status === 'Completed' ? 'var(--success)' : (selectedProject.status === 'On Hold' ? 'var(--danger)' : (selectedProject.status === 'Final Closure' ? '#7b61ff' : 'var(--accent-color)'))),
                                color: selectedProject.status === 'Final Closure' ? '#fff' : '#000', border: 'none', borderRadius: '20px', padding: '0.3rem 0.8rem', fontSize: '0.7rem', fontWeight: '800', cursor: 'pointer'
                            }}
                        >
                            <option value="Active">ACTIVE</option>
                            <option value="Completed">COMPLETED</option>
                            <option value="On Hold">ON HOLD</option>
                            <option value="Final Closure">FINAL CLOSURE</option>
                        </select>
                        {selectedProject.isSignOffRequested && !selectedProject.managerSignOff && (
                            <span style={{ fontSize: '0.6rem', color: '#FF9500', fontWeight: '800', letterSpacing: '0.05em' }}>(AWAITING HANDOVER SIGN-OFF)</span>
                        )}
                        {selectedProject.managerSignOff && (
                            <span style={{ fontSize: '0.6rem', color: 'var(--success)', fontWeight: '800', letterSpacing: '0.05em' }}>(HANDOVER COMPLETE ✓)</span>
                        )}
                    </div>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Client: {selectedProject.client}</p>
                <button 
                    onClick={() => { if(confirm(`Flush Project ${selectedProject.name}?`)) { onRemoveProject(selectedProject.id); setSelectedProjectId(null); } }} 
                    style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '0.65rem', marginTop: '1rem', cursor: 'pointer', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '800' }}
                >
                    🗑️ Flush Individual Loop
                </button>
            </div>
            <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: '800', color: pl.margin > 30 ? 'var(--success)' : 'var(--accent-color)' }}>
                    {pl.margin.toFixed(1)}%
                </div>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>EBITDA Margin</span>
            </div>
        </div>

        {activeSubTab === 'overview' ? (
            <div className="animate-fade-in">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
                    <div className="card" style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <p style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Contract Value</p>
                        {isEditingValue ? (
                            <input 
                                autoFocus type="number" defaultValue={pl.revenue || ''}
                                onBlur={(e) => { 
                                    if (e.target.value && e.target.value !== '0') {
                                        onUpdateValue(selectedProject.id, { 
                                            clientFinancials: { 
                                                ...(selectedProject.clientFinancials || {}), 
                                                totalValue: parseInt(e.target.value) 
                                            } 
                                        }); 
                                    }
                                    setIsEditingValue(false); 
                                }}
                                onKeyDown={(e) => { 
                                    if (e.key === 'Enter') { 
                                        if (e.target.value && e.target.value !== '0') {
                                            onUpdateValue(selectedProject.id, { 
                                                clientFinancials: { 
                                                    ...(selectedProject.clientFinancials || {}), 
                                                    totalValue: parseInt(e.target.value) 
                                                } 
                                            }); 
                                        }
                                        setIsEditingValue(false); 
                                    }
                                }}
                                style={{ background: 'var(--bg-accent)', border: '1px solid var(--accent-color)', borderRadius: '4px', padding: '0.4rem', color: '#fff', fontSize: '1rem', width: '100%' }}
                            />
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                <p style={{ fontSize: '1.3rem', fontWeight: '800', margin: 0 }}>₹{(pl.revenue / 100000).toFixed(2)}L</p>
                                {(pl.revenue === 0 || userRole === 'SuperAdmin') ? (
                                    <button 
                                        onClick={() => setIsEditingValue(true)} 
                                        title={pl.revenue > 0 ? "Super Admin Override" : "Set Contract Value"}
                                        style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', fontSize: '0.7rem' }}
                                    >
                                        ✎
                                    </button>
                                ) : (
                                    <span title="Locked by Institutional Protocol. Only Super Admin can modify." style={{ fontSize: '0.8rem', opacity: 0.5, cursor: 'help' }}>🔒</span>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="card" style={{ background: 'rgba(50, 215, 75, 0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <p style={{ fontSize: '0.6rem', color: 'var(--success)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Collected</p>
                            <button onClick={() => setIsPaymentModalOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--success)', cursor: 'pointer', fontSize: '0.6rem', fontWeight: '700' }}>+ Log</button>
                        </div>
                        <p style={{ fontSize: '1.3rem', fontWeight: '800' }}>₹{(totalReceived / 100000).toFixed(2)}L</p>
                    </div>

                    <div className="card" style={{ background: 'rgba(255, 69, 58, 0.05)' }}>
                        <p style={{ fontSize: '0.6rem', color: 'var(--danger)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Outstanding</p>
                        <p style={{ fontSize: '1.3rem', fontWeight: '800' }}>₹{(outstanding / 100000).toFixed(2)}L</p>
                    </div>

                    <div className="card" style={{ 
                        background: linkedVendor ? 'rgba(50, 215, 75, 0.05)' : 'rgba(255, 69, 58, 0.05)',
                        border: linkedVendor ? 'none' : '1px solid var(--danger)',
                        position: 'relative'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <p style={{ fontSize: '0.6rem', color: linkedVendor ? 'var(--success)' : 'var(--danger)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Partner</p>
                            {linkedVendor ? (
                                <button onClick={() => setIsReassignModalOpen(true)} style={{ background: '#ff453a22', border: '1px solid var(--danger)', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.5rem', fontWeight: '800', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>REPLACE</button>
                            ) : (
                                <button onClick={() => { setSelectedVendorId(''); setIsAssignModalOpen(true); }} style={{ background: 'var(--accent-color)', border: 'none', color: '#000', cursor: 'pointer', fontSize: '0.5rem', fontWeight: '800', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>+ ASSIGN</button>
                            )}
                        </div>
                        {linkedVendor ? (
                            <div 
                                onClick={() => { window.navigateToVendorBench?.(linkedVendor.id); }}
                                style={{ cursor: 'pointer' }}
                            >
                                <p style={{ fontSize: '1rem', fontWeight: '800', margin: 0 }}>{linkedVendor.name}</p>
                            </div>
                        ) : (
                            <div>
                                <p style={{ fontSize: '1rem', fontWeight: '800', margin: 0, color: 'var(--danger)' }}>UNASSIGNED</p>
                            </div>
                        )}
                    </div>

                    <div className="card" style={{ border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: '220px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <p style={{ fontSize: '0.55rem', color: 'var(--accent-color)', textTransform: 'uppercase', margin: 0, letterSpacing: '0.1em', fontWeight: '800' }}>🛰️ TIMELINE HEALTH</p>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.6rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.5rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.2rem' }}>Vendor → Meaven</label>
                                    <input 
                                        type="date" 
                                        value={selectedProject.vendorEndDate || ''}
                                        onChange={(e) => onUpdateValue(selectedProject.id, { vendorEndDate: e.target.value })}
                                        style={{ background: 'none', border: 'none', color: '#fff', fontSize: '0.75rem', width: '100%', outline: 'none' }}
                                    />
                                </div>
                                {selectedProject.vendorEndDate && (
                                    <div style={{ fontSize: '0.6rem', fontWeight: '800', color: (new Date(selectedProject.vendorEndDate) - new Date()) > 0 ? 'var(--success)' : 'var(--danger)', marginLeft: '0.5rem' }}>
                                        {(() => {
                                            const diff = new Date(selectedProject.vendorEndDate) - new Date();
                                            const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                                            return days > 0 ? `${days}d` : (days === 0 ? 'Due' : `${Math.abs(days)}d!`);
                                        })()}
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.6rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.5rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.2rem' }}>Meaven → Client</label>
                                    <input 
                                        type="date" 
                                        value={selectedProject.endDate || ''}
                                        onChange={(e) => onUpdateValue(selectedProject.id, { endDate: e.target.value })}
                                        style={{ background: 'none', border: 'none', color: '#fff', fontSize: '0.75rem', width: '100%', outline: 'none' }}
                                    />
                                </div>
                                {selectedProject.endDate && (
                                    <div style={{ fontSize: '0.6rem', fontWeight: '800', color: (new Date(selectedProject.endDate) - new Date()) > 0 ? 'var(--accent-color)' : 'var(--danger)', marginLeft: '0.5rem' }}>
                                        {(() => {
                                            const diff = new Date(selectedProject.endDate) - new Date();
                                            const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                                            return days > 0 ? `${days}d` : (days === 0 ? 'Due' : `${Math.abs(days)}d!`);
                                        })()}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* v8.0.2 UNIFIED AUDIT ENGINE (MERGED INTO OPERATIONS HUB) */}
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(102, 178, 194, 0.2)', borderRadius: '12px', padding: '1.5rem', marginTop: '2rem', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(102, 178, 194, 0.1)', paddingBottom: '1rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>🛰️</span>
                        <h4 style={{ margin: 0, color: 'var(--accent-color)', fontSize: '0.9rem', letterSpacing: '0.1em' }}>LIVE SITE AUDIT CHECKLIST</h4>
                    </div>
                    <SiteReadiness 
                        project={selectedProject} 
                        data={selectedProject.readinessData} 
                        isReadOnly={false} 
                        onUpdate={(updatedAuditData) => {
                            // Calculate new readiness based on checklist completion
                            const total = updatedAuditData.items?.length || 0;
                            const passed = updatedAuditData.items?.filter(i => i.status === 'passed').length || 0;
                            const newReadiness = total > 0 ? Math.round((passed / total) * 100) : 0;
                            
                            onUpdateValue(selectedProject.id, { 
                                readinessData: updatedAuditData,
                                readiness: newReadiness
                            });
                        }}
                        onBack={() => {}} // No-op here as we are inside the directory
                    />
                </div>

                {!linkedVendor && (
                    <div className="card animate-fade-in" style={{ background: 'rgba(102, 178, 194, 0.05)', border: '1px solid rgba(102, 178, 194, 0.2)', marginBottom: '3rem', padding: 'clamp(1rem, 4vw, 1.5rem)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <span style={{ fontSize: '1.2rem' }}>🤖</span>
                                <h4 style={{ margin: 0, color: 'var(--accent-color)', fontSize: '0.9rem' }}>AI Bench Suggestions</h4>
                            </div>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.2rem' }}>
                            {recommendations.map(rec => (
                                <div key={rec.id} className="card" style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                                            <span style={{ fontSize: '0.55rem', background: 'var(--accent-color)', color: '#000', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: '800' }}># {rec.rank} SUGGESTION</span>
                                            <span style={{ fontSize: '1rem', fontWeight: '800' }}>{rec.miScore || 0}%</span>
                                        </div>
                                        <p style={{ margin: 0, fontWeight: '800', fontSize: '1rem' }}>{rec.name}</p>
                                        <p style={{ margin: '0.8rem 0', fontSize: '0.7rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: '1.4' }}>"{rec.reason}"</p>
                                    </div>
                                    <button 
                                        onClick={() => handleQuickAssign(rec.id)}
                                        style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--accent-color)', background: 'none', color: 'var(--accent-color)', fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer' }}
                                    >
                                        Assign Partner
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
                    <div className="card">
                        <h4 style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>🔍 Project Intelligence Timeline</h4>
                        
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem' }}>
                            <textarea 
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                placeholder="Add a tactical note, site update, or risk warning..."
                                style={{ flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem', color: '#fff', fontSize: '0.85rem', minHeight: '80px' }}
                            />
                            <button 
                                disabled={!noteText.trim()}
                                onClick={() => { onAddNote(selectedProject.id, noteText); setNoteText(''); }}
                                className="btn btn-primary" 
                                style={{ height: 'fit-content', padding: '0.8rem 1.5rem', fontSize: '0.8rem' }}
                            >Post</button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '100px' }}>
                            {(() => {
                                const history = (selectedProject.history || []).slice().reverse();
                                const visibleHistory = showAllHistory ? history : history.slice(0, 5);
                                return (
                                    <>
                                        {visibleHistory.map((h, i) => (
                                            <div key={h.id} style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
                                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: h.type === 'success' ? 'var(--success)' : (h.type === 'warning' || h.type === 'danger' ? 'var(--danger)' : (h.type === 'info' ? 'var(--accent-color)' : (h.type === 'note' ? '#fff' : '#444'))), marginTop: '4px', zIndex: 2 }} />
                                                {i < visibleHistory.length - 1 && <div style={{ position: 'absolute', left: '4px', top: '15px', bottom: '-20px', width: '2px', background: 'var(--border-color)' }} />}
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                                            <p style={{ margin: 0, fontWeight: '700', fontSize: '0.85rem' }}>{h.title}</p>
                                                            {['note', 'success', 'warning', 'danger'].includes(h.type) && (
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); onToggleVisibility(selectedProject.id, h.id); }}
                                                                    title={h.isClientVisible ? "Visible to Client" : "Internal Only"}
                                                                    style={{ 
                                                                        background: h.isClientVisible ? 'rgba(50, 215, 75, 0.1)' : 'rgba(255,255,255,0.05)', 
                                                                        border: `1px solid ${h.isClientVisible ? 'var(--success)' : 'var(--border-color)'}`,
                                                                        borderRadius: '4px', padding: '0.1rem 0.3rem', fontSize: '0.6rem', color: h.isClientVisible ? 'var(--success)' : 'var(--text-secondary)', cursor: 'pointer'
                                                                    }}
                                                                >
                                                                    {h.isClientVisible ? '👁️ PUSHED' : '👁️ PUSH'}
                                                                </button>
                                                            )}
                                                        </div>
                                                        <span style={{ fontSize: '0.6rem', color: '#444' }}>{formatDate(h.date || h.timestamp)}</span>
                                                    </div>
                                                    <p style={{ margin: '0.2rem 0', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{h.detail}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {history.length > 5 && (
                                            <button 
                                                onClick={() => setShowAllHistory(!showAllHistory)}
                                                style={{ background: 'none', border: 'none', color: 'var(--accent-color)', fontSize: '0.7rem', fontWeight: '800', cursor: 'pointer', alignSelf: 'center', padding: '1rem' }}
                                            >
                                                {showAllHistory ? 'SEE LESS ↑' : `SEE ALL ${history.length} ENTRIES ↓`}
                                            </button>
                                        )}
                                    </>
                                )
                            })()}
                        </div>
                    </div>
                    <div className="card" style={{ background: 'linear-gradient(135deg, rgba(102, 178, 194, 0.08) 0%, transparent 100%)', border: '1px solid var(--accent-color)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem' }}>
                            <span style={{ fontSize: '1.2rem' }}>🤖</span>
                            <h4 style={{ margin: 0, fontSize: '0.7rem', color: 'var(--accent-color)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>AI Financial Strategy</h4>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                            This project maintains a health-margin of <strong>{pl.margin.toFixed(1)}%</strong>. 
                            AI identifies <b>₹{(pl.cogs * 0.05 / 100000).toFixed(2)}L</b> in potential COGS savings.
                        </p>
                    </div>
                </div>
                {/* PROJECT SIGN-OFF WORKFLOW */}
            </div>
        ) : (
            <div className="animate-fade-in">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div className="card" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Project Financial Ledger</h3>
                            <div style={{ padding: '0.3rem 0.8rem', background: 'rgba(50, 215, 75, 0.1)', borderRadius: '20px', color: 'var(--success)', fontSize: '0.6rem', fontWeight: '800' }}>AUDIT READY</div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1.2rem' }}>
                            <div style={{ borderLeft: '3px solid var(--accent-color)', paddingLeft: '1rem' }}>
                                <p style={{ margin: 0, fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Project Value</p>
                                <p style={{ margin: '0.2rem 0 0 0', fontSize: '1.2rem', fontWeight: '800' }}>₹{(pl.revenue / 100000).toFixed(2)}L</p>
                            </div>
                            <div style={{ borderLeft: '3px solid var(--danger)', paddingLeft: '1rem' }}>
                                <p style={{ margin: 0, fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>COGS</p>
                                <p style={{ margin: '0.2rem 0 0 0', fontSize: '1.2rem', fontWeight: '800', color: 'var(--danger)' }}>₹{(pl.cogs / 100000).toFixed(2)}L</p>
                            </div>
                            <div style={{ borderLeft: '3px solid var(--text-secondary)', paddingLeft: '1rem' }}>
                                <p style={{ margin: 0, fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Expenses</p>
                                <p style={{ margin: '0.2rem 0 0 0', fontSize: '1.2rem', fontWeight: '800' }}>₹{(pl.expenses / 100000).toFixed(2)}L</p>
                            </div>
                            <div style={{ borderLeft: '3px solid var(--success)', paddingLeft: '1rem' }}>
                                <p style={{ margin: 0, fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>EBITDA</p>
                                <p style={{ margin: '0.2rem 0 0 0', fontSize: '1.2rem', fontWeight: '800', color: 'var(--success)' }}>₹{(pl.profit / 100000).toFixed(2)}L</p>
                            </div>
                        </div>
                    </div>

                    {/* Section 1: Client Payment Tracking */}
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h4 style={{ margin: 0, color: 'var(--success)', fontSize: '0.9rem' }}>📥 Receipts</h4>
                            <button onClick={() => setIsPaymentModalOpen(true)} style={{ background: 'var(--success)', color: '#000', border: 'none', borderRadius: '4px', padding: '0.3rem 0.6rem', fontSize: '0.65rem', fontWeight: '800', cursor: 'pointer' }}>+ Log</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            {(selectedProject.clientFinancials?.received || []).map(p => (
                                <div key={p.id} style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                                        <span style={{ fontWeight: '800', color: 'var(--success)', fontSize: '0.85rem' }}>+ ₹{p.amount.toLocaleString()}</span>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{formatDate(p.date)}</span>
                                    </div>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Ref: {p.ref}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section 2: Vendor Payout Tracking */}
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h4 style={{ margin: 0, color: 'var(--danger)', fontSize: '0.9rem' }}>📤 Payouts</h4>
                            <button onClick={() => setIsPayoutModalOpen(true)} style={{ background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.3rem 0.6rem', fontSize: '0.65rem', fontWeight: '800', cursor: 'pointer' }}>+ Log</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            {(selectedProject.payouts || []).map(p => {
                                const vendor = vendors.find(v => String(v.id) === String(p.vendorId))
                                return (
                                    <div key={p.id} style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                                            <span style={{ fontWeight: '800', color: 'var(--danger)', fontSize: '0.85rem' }}>- ₹{p.amount.toLocaleString()}</span>
                                            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{formatDate(p.date)}</span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                            {vendor ? (
                                                <div 
                                                    onClick={() => { window.navigateToVendorBench?.(vendor.id); }}
                                                    style={{ fontSize: '0.85rem', color: 'var(--accent-color)', cursor: 'pointer', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                                >
                                                    <span>To: {vendor.name}</span>
                                                    <span style={{ fontSize: '0.6rem' }}>↗</span>
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>To: Unknown Partner</span>
                                            )}
                                            <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', opacity: 0.6 }}>Transaction Ref: {p.ref}</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* MODALS */}
        {isAssignModalOpen && (
            <ModalOverlay>
                <div className="card animate-fade-in" style={{ width: 'clamp(300px, 95%, 450px)', padding: 'clamp(1.5rem, 5vw, 2.5rem)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Assign Partner</h3>
                        <button 
                            onClick={() => setIsRegisteringNew(!isRegisteringNew)}
                            style={{ background: 'none', border: 'none', color: 'var(--accent-color)', fontSize: '0.65rem', fontWeight: '800', cursor: 'pointer' }}
                        >
                            {isRegisteringNew ? '← Bench' : '+ New'}
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
                    }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {!isRegisteringNew ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Certified Bench</label>
                                <select 
                                    value={selectedVendorId} 
                                    onChange={(e) => setSelectedVendorId(e.target.value)} 
                                    required 
                                    style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.7rem', color: '#fff', fontSize: '0.85rem' }}
                                >
                                    <option value="">Choose partner...</option>
                                    {vendors.map(v => <option key={v.id} value={v.id.toString()}>{v.name} ({v.category})</option>)}
                                </select>
                            </div>
                        ) : (
                            <>
                                <input name="newName" required placeholder="Company Name" style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.7rem', color: '#fff', fontSize: '0.85rem' }} />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                                    <select name="newCategory" style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.7rem', color: '#fff', fontSize: '0.85rem' }}>
                                        <option value="Civil">Civil</option>
                                        <option value="Carpentry">Carpentry</option>
                                        <option value="Electrical">Electrical</option>
                                        <option value="Plumbing">Plumbing</option>
                                        <option value="Glass">Glass</option>
                                    </select>
                                    <input name="newPhone" required placeholder="Phone" style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.7rem', color: '#fff', fontSize: '0.85rem' }} />
                                </div>
                            </>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Contract Value (INR)</label>
                            <input name="orderValue" type="number" required placeholder="Ex: 1500000" style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.7rem', color: '#fff', fontSize: '0.85rem' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.8rem' }}>
                            <button type="button" onClick={() => { setIsAssignModalOpen(false); setIsRegisteringNew(false); }} className="btn btn-outline" style={{ flex: 1, fontSize: '0.75rem' }}>Cancel</button>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1, fontSize: '0.75rem' }}>Confirm</button>
                        </div>
                    </form>
                </div>
            </ModalOverlay>
        )}

        {isReassignModalOpen && (
            <ModalOverlay>
                <div className="card animate-fade-in" style={{ width: 'clamp(300px, 95%, 450px)', padding: 'clamp(1.5rem, 5vw, 2.5rem)', border: '1px solid var(--danger)' }}>
                    <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--danger)', fontSize: '1.1rem' }}>Replace Partner</h3>
                    <form onSubmit={(e) => {
                        e.preventDefault()
                        const formData = new FormData(e.currentTarget)
                        onReassignPartner(selectedProject.id, linkedVendor?.id, formData.get('vendorId'), formData.get('orderValue'))
                        setIsReassignModalOpen(false)
                    }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <select name="vendorId" required style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.7rem', color: '#fff', fontSize: '0.85rem' }}>
                            <option value="">Select Replacement...</option>
                            {vendors.filter(v => v.id !== linkedVendor?.id).map(v => <option key={v.id} value={v.id.toString()}>{v.name}</option>)}
                        </select>
                        <input name="orderValue" type="number" required placeholder="New Contract Value" style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.7rem', color: '#fff', fontSize: '0.85rem' }} />
                        <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.8rem' }}>
                            <button type="button" onClick={() => setIsReassignModalOpen(false)} className="btn btn-outline" style={{ flex: 1, fontSize: '0.75rem' }}>Cancel</button>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1, background: 'var(--danger)', color: '#fff', fontSize: '0.75rem' }}>Replace</button>
                        </div>
                    </form>
                </div>
            </ModalOverlay>
        )}

        {isExpenseModalOpen && (
            <ModalOverlay>
                <div className="card animate-fade-in" style={{ width: 'clamp(300px, 95%, 400px)', padding: 'clamp(1.5rem, 5vw, 2.5rem)' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Log Expense</h3>
                    <form onSubmit={(e) => {
                        e.preventDefault()
                        const formData = new FormData(e.currentTarget)
                        onAddExpense(selectedProject.id, {
                            description: formData.get('description'),
                            amount: parseInt(formData.get('amount')),
                            date: formData.get('date')
                        })
                        setIsExpenseModalOpen(false)
                    }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <input name="description" required placeholder="Description" style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.7rem', color: '#fff', fontSize: '0.85rem' }} />
                        <input name="amount" type="number" required placeholder="Amount (INR)" style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.7rem', color: '#fff', fontSize: '0.85rem' }} />
                        <input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.7rem', color: '#fff', fontSize: '0.85rem' }} />
                        <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem' }}>
                            <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="btn btn-outline" style={{ flex: 1, fontSize: '0.75rem' }}>Cancel</button>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1, fontSize: '0.75rem' }}>Log</button>
                        </div>
                    </form>
                </div>
            </ModalOverlay>
        )}

        {isPaymentModalOpen && (
            <ModalOverlay>
                <div className="card animate-fade-in" style={{ width: 'clamp(300px, 95%, 450px)', padding: 'clamp(1.5rem, 5vw, 2.5rem)' }}>
                    <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem' }}>Log Receipt</h3>
                    <form onSubmit={(e) => {
                        e.preventDefault()
                        const formData = new FormData(e.currentTarget)
                        onLogPayment(selectedProject.id, formData.get('amount'), formData.get('ref'), formData.get('date'), null)
                        setIsPaymentModalOpen(false)
                    }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <input name="amount" type="number" required placeholder="Amount" style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.7rem', color: '#fff', fontSize: '0.85rem' }} />
                        <input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.7rem', color: '#fff', fontSize: '0.85rem' }} />
                        <input name="ref" required placeholder="Transaction Ref" style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.7rem', color: '#fff', fontSize: '0.85rem' }} />
                        <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem' }}>
                            <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="btn btn-outline" style={{ flex: 1, fontSize: '0.75rem' }}>Cancel</button>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1, background: 'var(--success)', color: '#000', fontSize: '0.75rem' }}>Confirm</button>
                        </div>
                    </form>
                </div>
            </ModalOverlay>
        )}

        {isPayoutModalOpen && (
            <ModalOverlay>
                <div className="card animate-fade-in" style={{ width: 'clamp(300px, 95%, 450px)', padding: 'clamp(1.5rem, 5vw, 2.5rem)' }}>
                    <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem' }}>Log Payout</h3>
                    <form onSubmit={(e) => {
                        e.preventDefault()
                        const formData = new FormData(e.currentTarget)
                        onLogPayout(selectedProject.id, formData.get('amount'), formData.get('ref'), formData.get('date'), null, formData.get('vendorId'))
                        setIsPayoutModalOpen(false)
                    }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <select name="vendorId" required style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.7rem', color: '#fff', fontSize: '0.85rem' }}>
                            <option value="">Select Vendor...</option>
                            {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                        <input name="amount" type="number" required placeholder="Amount" style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.7rem', color: '#fff', fontSize: '0.85rem' }} />
                        <input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.7rem', color: '#fff', fontSize: '0.85rem' }} />
                        <input name="ref" required placeholder="Reference" style={{ width: '100%', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.7rem', color: '#fff', fontSize: '0.85rem' }} />
                        <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem' }}>
                            <button type="button" onClick={() => setIsPayoutModalOpen(false)} className="btn btn-outline" style={{ flex: 1, fontSize: '0.75rem' }}>Cancel</button>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1, background: 'var(--danger)', color: '#fff', fontSize: '0.75rem' }}>Confirm</button>
                        </div>
                    </form>
                </div>
            </ModalOverlay>
        )}

        {/* SIGN-OFF EMAIL MODAL */}
        {isSignOffModalOpen && (
            <ModalOverlay>
                <div className="card animate-fade-in" style={{ width: 'clamp(300px, 95%, 600px)', padding: '2.5rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent-color)' }}>Draft Sign-off Authorization</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Recipients</label>
                            <input 
                                value={signOffEmail.to}
                                onChange={(e) => setSignOffEmail({ ...signOffEmail, to: e.target.value })}
                                style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Subject</label>
                            <input 
                                value={signOffEmail.subject}
                                onChange={(e) => setSignOffEmail({ ...signOffEmail, subject: e.target.value })}
                                style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Email Body</span>
                                <span style={{ color: 'var(--success)' }}>📎 Timeline Attached</span>
                            </label>
                            <textarea 
                                value={signOffEmail.body}
                                onChange={(e) => setSignOffEmail({ ...signOffEmail, body: e.target.value })}
                                style={{ width: '100%', height: '250px', padding: '1rem', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem', lineHeight: '1.6' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={() => setIsSignOffModalOpen(false)} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                            <button 
                                onClick={() => {
                                    onAddNote(selectedProject.id, `Sign-off email sent to: ${signOffEmail.to}`);
                                    alert("Email Sent! (Reminder 1: Awaiting for final sign off - scheduled in 6 hours)");
                                    setIsSignOffModalOpen(false);
                                }}
                                className="btn btn-primary" 
                                style={{ flex: 1, justifyContent: 'center' }}
                            >
                                🚀 Send Authorization Email
                            </button>
                        </div>
                    </div>
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
