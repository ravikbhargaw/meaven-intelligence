import React, { useState, useEffect } from 'react'
import SiteReadiness from './components/SiteReadiness'
import Login from './components/Login'
import SecuritySetup from './components/SecuritySetup'
import PinModal from './components/PinModal'
import NewProjectModal from './components/NewProjectModal'
import useAuth from './hooks/useAuth'
import VendorScoring from './components/VendorScoring'
import ProjectDirectory from './components/ProjectDirectory'
import ClientExperienceHub from './components/ClientExperienceHub'
import TechnicalCalculator from './components/TechnicalCalculator'
import AdminPanel from './components/AdminPanel'
import CommandCenter from './components/CommandCenter'

// --- SAFETY VAULT: ERROR BOUNDARY ---
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '5rem', textAlign: 'center', background: '#1a0000', color: '#ff453a', height: '100vh', width: '100vw', position: 'fixed', inset: 0, zIndex: 9999 }}>
          <h1 style={{ fontSize: '3rem', fontWeight: '900' }}>🚨 CRITICAL RENDER FAILURE</h1>
          <p style={{ fontSize: '1.2rem', margin: '2rem 0' }}>The War Room has encountered a data collision. Please capture this report for Meaven Support.</p>
          <pre style={{ background: '#000', padding: '2rem', borderRadius: '12px', textAlign: 'left', display: 'inline-block', color: '#fff', maxWidth: '80%' }}>
            {this.state.error?.toString()}
          </pre>
          <div style={{ marginTop: '3rem' }}>
            <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="btn btn-primary">REBOOT & CLEAR CACHE ⟳</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const { user, login, isFirstLogin, updateSecurity, verifyPin, showPinModal, setShowPinModal, users, addUser, removeUser, resetUser, verifyMasterKey } = useAuth()
  
  // Dashboard States
  const [clientView, setClientView] = useState(true)
  const [activeTab, setActiveTab] = useState('readiness')
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false)
  const [isProjectSelected, setIsProjectSelected] = useState(false)
  const [selectedClient, setSelectedClient] = useState('')
  
  // Robust LocalStorage Loader
  const loadFromStorage = (key, defaultValue) => {
    try {
      const saved = localStorage.getItem(key)
      if (!saved || saved === 'undefined' || saved === 'null') return defaultValue
      const parsed = JSON.parse(saved)
      return (parsed !== null && typeof parsed !== 'undefined') ? parsed : defaultValue
    } catch (e) {
      console.error(`MI Core: Failed to load ${key}`, e)
      return defaultValue
    }
  }

  // Global Portfolios (Clients) State
  const [portfolios, setPortfolios] = useState(() => loadFromStorage('mi_portfolios', []))

  // Global Projects State
  const [projects, setProjects] = useState(() => loadFromStorage('mi_projects', []))

  // Global Vendor Repository
  const [vendors, setVendors] = useState(() => loadFromStorage('mi_vendors', []))

  const [activeProjectId, setActiveProjectId] = useState(null)
  const [readinessData, setReadinessData] = useState(() => loadFromStorage('mi_readiness', {}))

  // Global Playbook Template (The Master Checklist)
  const [globalPlaybookTemplate, setGlobalPlaybookTemplate] = useState(() => loadFromStorage('mi_global_playbook', [
    { id: 1, category: 'Structural Readiness', label: 'Header/Beam Structural Readiness', status: 'pending', notes: '' },
    { id: 2, category: 'Structural Readiness', label: 'Opening Dimensions Laser-Verified', status: 'pending', notes: '' },
    { id: 3, category: 'Structural Readiness', label: 'Floor Level Tolerance (+/- 2mm)', status: 'pending', notes: '' },
    { id: 4, category: 'Structural Readiness', label: 'Wall Plumbness Verified', status: 'pending', notes: '' },
    { id: 5, category: 'Site & Access', label: 'Unloading Zone Clear & Accessible', status: 'pending', notes: '' },
    { id: 6, category: 'Site & Access', label: 'Service Lift Dimensions Verified', status: 'pending', notes: '' },
    { id: 7, category: 'Site & Access', label: 'Dust-Free Zone for Installation', status: 'pending', notes: '' },
    { id: 8, category: 'Utilities & Support', label: 'Stable 3-Phase Power Available', status: 'pending', notes: '' },
  ]))

  // AI Governance: Playbook Proposals
  const [playbookProposals, setPlaybookProposals] = useState(() => loadFromStorage('mi_playbook_proposals', []))


  const handleProposePlaybookUpdate = (proposal) => {
    const newProposal = { 
        ...proposal, 
        id: Date.now(), 
        status: 'pending', 
        proposer: user?.name,
        timestamp: new Date().toISOString() 
    }
    setPlaybookProposals(prev => [...prev, newProposal])
    alert("GOVERNANCE NOTIFICATION: Playbook Update Request sent to Super Admin for technical verification.")
  }

  const handleApprovePlaybookUpdate = (id) => {
    const proposal = playbookProposals.find(p => p.id === id)
    if (!proposal || proposal.status === 'approved') return

    const now = new Date().toLocaleString()
    setPlaybookProposals(prev => prev.map(p => p.id === id ? { ...p, status: 'approved', approvalTimestamp: now } : p))
    
    // INJECT INTO GLOBAL TEMPLATE (Check for duplicates)
    setGlobalPlaybookTemplate(prev => {
        if (prev.some(t => t.label === proposal.title)) return prev
        const newItem = {
            id: Date.now(),
            category: proposal.category,
            label: proposal.title,
            status: 'pending',
            notes: `AI-Enhanced Rule (Approved ${now})`
        }
        return [...prev, newItem]
    })
    
    alert(`PLAYBOOK AUTHORED: "${proposal.title}" has been globally synchronized.`)
  }

  useEffect(() => {
    localStorage.setItem('mi_playbook_proposals', JSON.stringify(playbookProposals))
    localStorage.setItem('mi_global_playbook', JSON.stringify(globalPlaybookTemplate))
  }, [playbookProposals, globalPlaybookTemplate])


  // Sync to LocalStorage (with safety)
  useEffect(() => {
    if (projects) localStorage.setItem('mi_projects', JSON.stringify(projects))
    if (vendors) localStorage.setItem('mi_vendors', JSON.stringify(vendors))
    if (readinessData) localStorage.setItem('mi_readiness', JSON.stringify(readinessData))
    if (portfolios) localStorage.setItem('mi_portfolios', JSON.stringify(portfolios))
  }, [projects, vendors, readinessData, portfolios])

  const handleAssignProject = (projectId, vendorId, orderValue) => {
    if (!projectId || !vendorId) return
    const project = projects.find(p => p.id === projectId)
    const vendor = vendors.find(v => v.id === parseInt(vendorId))
    if (!project || !vendor) return

    setVendors(prev => prev.map(v => {
        if (v.id === vendor.id) {
            const newContract = { 
                id: Date.now(), 
                projectName: project.name, 
                orderValue: parseInt(orderValue) || 0, 
                payments: [], 
                status: 'Active' 
            }
            return { ...v, contracts: [...(v.contracts || []), newContract] }
        }
        return v
    }))

    setProjects(prev => (prev || []).map(p => {
        if (p.id === projectId) {
            return {
                ...p,
                history: [...(p.history || []), { id: Date.now(), type: 'success', title: 'Partner Assigned', detail: `${vendor.name} assigned for execution.`, timestamp: new Date().toISOString() }]
            }
        }
        return p
    }))
  }

  const handleReassignProject = (projectId, oldVendorId, newVendorId, orderValue) => {
    const project = projects.find(p => p.id === projectId)
    if (!project) return

    setVendors(prev => prev.map(v => {
        if (v.id === parseInt(oldVendorId)) {
            const updatedContracts = (v.contracts || []).map(c => 
                c.projectName === project.name ? { ...c, status: 'Terminated/Handover' } : c
            )
            return { ...v, contracts: updatedContracts }
        }
        return v
    }))

    if (newVendorId) {
        handleAssignProject(projectId, newVendorId, orderValue)
        setProjects(prev => (prev || []).map(p => {
            if (p.id === projectId) {
                return {
                    ...p,
                    history: [...(p.history || []), { id: Date.now(), type: 'warning', title: 'Mid-Project Reassignment', detail: `Project handed over from previous partner.`, timestamp: new Date().toISOString() }]
                }
            }
            return p
        }))
    }
  }

  const logEvent = (projectId, event) => {
    setProjects(prev => (prev || []).map(p => {
        if (p.id === projectId) {
            return {
                ...p,
                history: [...(p.history || []), { ...event, id: Date.now(), timestamp: new Date().toISOString() }]
            }
        }
        return p
    }))
  }

  const handleRequestClientPayment = (projectId, amount, milestone) => {
    setProjects(prev => prev.map(p => {
        if (p.id === projectId) {
            const newRequest = { id: Date.now(), amount: parseInt(amount), date: new Date().toISOString().split('T')[0], status: 'Requested', milestone }
            const newHistory = [
                ...(p.history || []),
                { id: Date.now(), type: 'info', title: `Payment Requested: ₹${(amount / 100000).toFixed(2)}L`, detail: `Request sent to ${p.pmEmail} for ${milestone}`, timestamp: new Date().toISOString() }
            ]
            const nextFin = { 
                ...p.clientFinancials, 
                requests: [...(p.clientFinancials?.requests || []), newRequest] 
            }
            return { ...p, clientFinancials: nextFin, history: newHistory }
        }
        return p
    }))
  }

  const handleLogClientPayment = (projectId, amount, ref, date) => {
    const numAmount = parseInt(amount) || 0
    setProjects(prev => prev.map(p => {
        if (p.id === projectId) {
            const paymentDate = date || new Date().toISOString().split('T')[0]
            const newReceipt = { id: Date.now(), amount: numAmount, date: paymentDate, ref }
            const newHistory = [
                ...(p.history || []),
                { id: Date.now(), type: 'success', title: `Payment Received: ₹${(numAmount / 100000).toFixed(2)}L`, detail: `Date: ${paymentDate} | Ref: ${ref}`, timestamp: new Date().toISOString() }
            ]
            const nextFin = { 
                ...p.clientFinancials, 
                received: [...(p.clientFinancials?.received || []), newReceipt] 
            }
            return { ...p, clientFinancials: nextFin, history: newHistory }
        }
        return p
    }))
  }

  const handleAddProjectExpense = (projectId, expense) => {
    setProjects(prev => prev.map(p => {
        if (p.id === projectId) {
            const newExpense = { ...expense, id: Date.now() }
            const newHistory = [
                ...(p.history || []),
                { id: Date.now(), type: 'info', title: `Expense Logged: ${expense.description}`, detail: `Amount: ₹${(expense.amount / 1000).toFixed(1)}k`, timestamp: new Date().toISOString() }
            ]
            return { ...p, expenses: [...(p.expenses || []), newExpense], history: newHistory }
        }
        return p
    }))
  }

  const handleUpdateProjectValue = (projectId, newValue) => {
    setProjects(prev => prev.map(p => {
        if (p.id === projectId) {
            const oldVal = p.clientFinancials?.totalValue || 0
            const newHistory = [
                ...(p.history || []),
                { id: Date.now(), type: 'info', title: 'Contract Value Adjusted', detail: `Changed from ₹${(oldVal / 100000).toFixed(2)}L to ₹${(newValue / 100000).toFixed(2)}L`, timestamp: new Date().toISOString() }
            ]
            const nextFin = { ...p.clientFinancials, totalValue: parseInt(newValue) }
            return { ...p, clientFinancials: nextFin, history: newHistory }
        }
        return p
    }))
  }

  const handleCreateProject = (newProject) => {
    if (newProject.isNewPortfolio) {
        const newPortfolio = {
            id: newProject.portfolioId,
            name: newProject.client,
            stakeholders: [] // Can be updated later in Admin or by AI
        }
        setPortfolios(prev => [...(prev || []), newPortfolio])
    }

    const project = { 
        ...newProject, 
        id: Date.now(),
        milestones: { measurementDate: null, siteReadiness: null, completion: null },
        clientFinancials: { totalValue: 0, requests: [], received: [] },
        history: [{ id: 1, type: 'info', title: 'Project Initialized', detail: `Project loop set for ${newProject.name}`, timestamp: new Date().toISOString() }]
    }
    setProjects([...(projects || []), project])
    setActiveProjectId(project.id)
    setIsNewProjectModalOpen(false)
  }

  const handleUpdateProjectMilestones = (projectId, milestones) => {
    setProjects(prev => prev.map(p => {
        if (p.id === projectId) {
            const newHistory = [
                ...(p.history || []),
                { id: Date.now(), type: 'info', title: 'Critical Dates Updated', detail: 'Project milestones adjusted for execution tracking.', timestamp: new Date().toISOString() }
            ]
            return { ...p, milestones: { ...p.milestones, ...milestones }, history: newHistory }
        }
        return p
    }))

    const project = projects.find(p => p.id === projectId)
    if (project) {
        setVendors(prev => prev.map(v => {
            const isLinked = (v.contracts || []).some(c => c.projectName === project.name)
            if (isLinked) {
                const vendorHistory = [
                    ...(v.history || []),
                    { id: Date.now(), type: 'info', title: `Project Date Sync: ${project.name}`, detail: 'Shared project milestones have been updated.', timestamp: new Date().toISOString() }
                ]
                return { ...v, history: vendorHistory }
            }
            return v
        }))
    }
  }

  const handleUpdateProject = (projectId, updates) => {
    setProjects(prev => (prev || []).map(p => Number(p.id) === Number(projectId) ? { ...p, ...updates } : p))
  }

  const handleUpdateReadiness = (projectId, data) => {
    if (!projectId) return
    const prevData = readinessData[projectId]
    setReadinessData(prev => ({ ...prev, [projectId]: data }))
    if (JSON.stringify(prevData?.items) !== JSON.stringify(data.items)) {
        logEvent(projectId, { type: 'audit', title: 'Audit Data Synced', detail: 'Site readiness checklist updated locally' })
    }
  }

  const handleAddVendor = (newVendor) => {
    const vendor = { ...newVendor, id: Date.now() }
    setVendors([...vendors, vendor])
  }

  const handleLockLocation = (projectId, coords) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { 
        ...p, 
        coordinates: coords, 
        locationLocked: true,
        history: [{ id: Date.now(), type: 'success', title: 'Location Calibrated', detail: `Ground Truth hard-locked at ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`, timestamp: new Date().toISOString() }, ...p.history]
    } : p))
    alert("SITE BOUNDARY LOCKED: Ground Truth has been established. All future audits are now geofenced to this precise location.")
  }

  const handleUpdateVendor = (id, updates) => {
    setVendors(vendors.map(v => v.id === id ? { ...v, ...updates } : v))
  }

  const handleAddVendorPayment = (vendorId, contractId, payment) => {
    setVendors(vendors.map(v => {
        if (v.id === vendorId) {
            const nextContracts = v.contracts.map(c => {
                if (c.id === contractId) {
                    return { ...c, payments: [...(c.payments || []), { ...payment, id: Date.now() }] }
                }
                return c
            })
            const newHistory = [
                ...(v.history || []),
                { id: Date.now(), type: 'payment', title: `Payment Logged`, detail: `Amount: ₹${(payment.amount / 100000).toFixed(2)}L`, date: payment.date }
            ]
            return { ...v, contracts: nextContracts, history: newHistory }
        }
        return v
    }))
  }

  const handleAddVendorContract = (vendorId, projectName, orderValue) => {
    setVendors(vendors.map(v => {
        if (v.id === vendorId) {
            const newContract = { id: Date.now(), projectName, orderValue: parseInt(orderValue), payments: [] }
            const newHistory = [
                ...(v.history || []),
                { id: Date.now(), type: 'contract', title: 'New Contract Linked', detail: `Project: ${projectName}`, date: new Date().toISOString().split('T')[0] }
            ]
            return { ...v, contracts: [...(v.contracts || []), newContract], history: newHistory }
        }
        return v
    }))
  }

  const handleAddVendorNote = (vendorId, noteText) => {
    setVendors(vendors.map(v => {
        if (v.id === vendorId) {
            const newHistory = [
                ...(v.history || []),
                { id: Date.now(), type: 'note', title: `Note added`, detail: noteText, date: new Date().toISOString().split('T')[0] }
            ]
            return { ...v, history: newHistory }
        }
        return v
    }))
  }

  const handleToggleClientView = () => {
    if (clientView) setShowPinModal(true)
    else setClientView(true)
  }

  const handlePinVerify = (pin) => {
    if (verifyPin(pin)) {
      setClientView(false)
      setShowPinModal(false)
      return true
    }
    return false
  }

  useEffect(() => {
    if (user) setClientView(true)
  }, [user])

  if (!user) return <Login onLogin={login} onVerifyMasterKey={verifyMasterKey} />
  if (isFirstLogin) return <SecuritySetup onComplete={updateSecurity} />

  // PROJECT SELECTOR GATE (For Client Privacy)
  if (!isProjectSelected) {
    const uniqueClients = [...new Set((projects || []).map(p => p.client || 'General Portfolio'))]
    
    return (
        <div className="landing-gate animate-fade-in" style={{ 
            height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', 
            alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)',
            backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(102, 178, 194, 0.05) 0%, transparent 70%)'
        }}>
            <div className="logo-container" style={{ marginBottom: '4rem', textAlign: 'center' }}>
                <img src="/images/logo.png" alt="Meaven Logo" style={{ height: '48px', marginBottom: '1rem' }} />
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', letterSpacing: '0.5em', fontWeight: '500', textTransform: 'uppercase' }}>INTELLIGENCE HUB</p>
            </div>

            <div className="card animate-slide-up" style={{ width: '100%', maxWidth: '520px', padding: '3rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--radius-premium)' }}>
                <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Entry Authorization</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', lineHeight: '1.6' }}>Choose the portfolio or project loop you wish to initialize.</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ textAlign: 'left' }}>
                        <label style={{ fontSize: '0.65rem', color: 'var(--accent-color)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Select Portfolio (By Client)</label>
                        <select 
                            value={selectedClient} 
                            onChange={(e) => setSelectedClient(e.target.value)}
                            style={{ width: '100%', padding: '1rem', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-premium)', color: '#fff', fontSize: '1.1rem' }}
                        >
                            <option value="">Choose Client Portfolio...</option>
                            {uniqueClients.length > 0 ? uniqueClients.map(c => <option key={c} value={c}>{c}</option>) : <option value="">No Active Portfolios Found</option>}
                        </select>
                    </div>

                    <button 
                        onClick={() => {
                            if (selectedClient) {
                                setIsProjectSelected(true)
                                setActiveTab('dashboard')
                            } else if (uniqueClients.length === 0) {
                                // For clean start, allow entering "General Portfolio" or creating a project
                                setIsNewProjectModalOpen(true)
                            }
                        }}
                        className="btn btn-primary" 
                        style={{ width: '100%', padding: '1.2rem', justifyContent: 'center', fontSize: '1.1rem', marginTop: '1rem' }}
                    >
                        {uniqueClients.length > 0 ? 'Initialize Portfolio Intelligence' : 'Start First Project Loop'}
                    </button>
                </div>
            </div>
            <NewProjectModal isOpen={isNewProjectModalOpen} onClose={() => setIsNewProjectModalOpen(false)} onCreate={handleCreateProject} portfolios={portfolios} />
        </div>
    )
  }

  const activeProject = (projects || []).find(p => Number(p.id) === Number(activeProjectId)) || (projects && projects[0]) || { id: 0, name: 'Initializing...', client: 'Meaven Intelligence' }

  return (
    <ErrorBoundary>
      <div className="dashboard-container">
      <NewProjectModal isOpen={isNewProjectModalOpen} onClose={() => setIsNewProjectModalOpen(false)} onCreate={handleCreateProject} portfolios={portfolios} />

      <aside className="sidebar">
        <div className="logo-container" style={{ marginBottom: '3rem', textAlign: 'left' }}>
          <img src="/images/logo.png" alt="Meaven Logo" style={{ height: '32px', marginBottom: '0.5rem' }} />
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', letterSpacing: '0.4em', fontWeight: '500', textTransform: 'uppercase', margin: 0 }}>INTELLIGENCE</p>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          <SidebarItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon="📊" label={clientView ? "Experience Hub" : "Internal Dashboard"} />
          {!clientView && <SidebarItem active={activeTab === 'projects'} onClick={() => setActiveTab('projects')} icon="💰" label="Financial Hub" />}
          {!clientView && <SidebarItem active={activeTab === 'vendors'} onClick={() => setActiveTab('vendors')} icon="🤝" label="Vendor Bench" />}
          {activeProjectId && <SidebarItem active={activeTab === 'readiness'} onClick={() => setActiveTab('readiness')} icon="📏" label="Live Audit Hub" />}
          <SidebarItem active={activeTab === 'calculator'} onClick={() => setActiveTab('calculator')} icon="🧮" label="Tech Calculator" />
          {user?.role === 'SuperAdmin' && !clientView && (
            <SidebarItem active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} icon="⚙️" label="Governance Console" />
          )}
        </nav>
        
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', marginBottom: '1rem' }}>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{selectedClient ? 'Active Portfolio' : 'Active Project'}</label>
          <div style={{ background: 'var(--bg-accent)', color: 'var(--accent-color)', borderRadius: '4px', padding: '0.5rem', marginTop: '0.5rem', fontSize: '0.85rem', fontWeight: '700' }}>
            {selectedClient ? selectedClient : (activeProject?.name || 'Loading...')}
          </div>
          <button onClick={() => { setIsProjectSelected(false); setSelectedClient(''); setActiveTab('dashboard'); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.65rem', marginTop: '0.5rem', cursor: 'pointer' }}>Change Client/Project ↩</button>
        </div>

        <div className="sidebar-footer" style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', marginTop: 'auto' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>System Diagnostics</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.7rem', color: 'var(--accent-color)', fontFamily: 'monospace' }}>
            <span>TAB: {activeTab.toUpperCase()}</span>
            <span>ID: {activeProjectId || 'NONE'}</span>
            <span>AUTH: {isProjectSelected ? 'SECURED' : 'PENDING'}</span>
          </div>
          
          <div className="client-toggle-card card" style={{ padding: '0.75rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem' }}>{clientView ? 'Secure' : 'Internal'} Mode</span>
              <button onClick={handleToggleClientView} style={{ width: '34px', height: '18px', backgroundColor: clientView ? 'var(--success)' : 'var(--bg-accent)', borderRadius: '9px', position: 'relative' }}>
                <div style={{ width: '14px', height: '14px', backgroundColor: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: clientView ? '18px' : '2px', transition: 'var(--transition)' }} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem' }}>
              {activeTab === 'dashboard' && (clientView ? 'Portfolio Intelligence' : 'Execution Health Overview')}
              {activeTab === 'projects' && 'Financial Strategy Hub'}
              {activeTab === 'vendors' && 'Vendor Scoring Engine'}
              {activeTab === 'readiness' && 'Site-Readiness Verification'}
              {activeTab === 'calculator' && 'Technical Calculator'}
              {activeTab === 'admin' && 'System Governance & Access'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {activeTab === 'admin' ? `Super Admin: ${user?.name || 'Authorized User'}` : (selectedClient ? `Portfolio: ${selectedClient}` : `Project: ${activeProject?.name || 'Global View'}`)}
            </p>
          </div>
        </header>

        {activeTab === 'dashboard' && (
            clientView ? (
                <ClientExperienceHub 
                    clientName={selectedClient} 
                    projects={projects} 
                    onBack={() => {
                        setIsProjectSelected(false);
                        setSelectedClient('');
                        setActiveTab('dashboard');
                    }}
                    onSelectProject={(id) => {
                        setActiveProjectId(Number(id));
                        setIsProjectSelected(true);
                        setActiveTab('readiness');
                    }} 
                />
            ) : (
                <CommandCenter 
                  projects={projects}
                  proposals={playbookProposals}
                  vendors={vendors}
                  onSelectProject={(id) => {
                    setActiveProjectId(Number(id))
                    setIsProjectSelected(true)
                    setActiveTab('readiness')
                  }}
                  onSelectTab={setActiveTab}
                />
            )
        )}

        {activeTab === 'readiness' && (
          <SiteReadiness 
            project={activeProject} 
            projects={projects || []}
            portfolios={portfolios || []}
            template={globalPlaybookTemplate || []}
            onCreateProject={handleCreateProject} 
            data={readinessData ? readinessData[activeProjectId] : null} 
            onUpdate={(data) => handleUpdateReadiness(activeProjectId, data)} 
            onUpdateMilestones={handleUpdateProjectMilestones} 
            onProposePlaybookUpdate={handleProposePlaybookUpdate}
            onBack={() => setActiveTab('dashboard')}
            onLockLocation={handleLockLocation}
            onUpdateProject={handleUpdateProject}
            userRole={user?.role}
            isReadOnly={clientView} 
          />
        )}
        
        {activeTab === 'vendors' && (
          <VendorScoring 
            vendors={vendors} 
            projects={projects} 
            portfolios={portfolios}
            onAdd={handleAddVendor} 
            onUpdate={handleUpdateVendor} 
            onAddPayment={handleAddVendorPayment} 
            onAddNote={handleAddVendorNote} 
            onAddContract={handleAddVendorContract} 
            onAddProject={handleCreateProject} 
            onBack={() => setActiveTab('dashboard')}
            isReadOnly={clientView} 
          />
        )}

        {activeTab === 'projects' && (
          <ProjectDirectory 
            projects={projects} 
            vendors={vendors} 
            portfolios={portfolios}
            onSelectProject={(id) => { setActiveProjectId(Number(id)); setActiveTab('readiness'); }} 
            onAddExpense={handleAddProjectExpense} 
            onUpdateValue={handleUpdateProjectValue} 
            onLogPayment={handleLogClientPayment} 
            onAssignPartner={handleAssignProject} 
            onReassignPartner={handleReassignProject} 
          />
        )}
        
        {activeTab === 'calculator' && (
          <TechnicalCalculator />
        )}

        {activeTab === 'admin' && (
          <AdminPanel 
            users={users || []} 
            proposals={playbookProposals || []}
            onApproveProposal={handleApprovePlaybookUpdate}
            onAddUser={addUser} 
            onRemoveUser={removeUser} 
            onResetUser={resetUser} 
            onBack={() => setActiveTab('dashboard')}
          />
        )}
      </main>

      {showPinModal && <PinModal onVerify={handlePinVerify} onCancel={() => setShowPinModal(false)} />}
    </div>
    </ErrorBoundary>
  )
}

function SidebarItem({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', borderRadius: '10px', color: active ? 'var(--accent-color)' : 'var(--text-secondary)', background: active ? 'rgba(102, 178, 194, 0.1)' : 'transparent', width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer' }}>
      <span style={{ fontSize: '1.2rem' }}>{icon}</span>
      <span style={{ fontWeight: active ? '600' : '400' }}>{label}</span>
    </button>
  )
}

export default App
