import { useState, useEffect } from 'react'
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

function App() {
  const { user, login, isFirstLogin, updateSecurity, verifyPin, showPinModal, setShowPinModal, users, addUser, removeUser } = useAuth()
  
  // Dashboard States
  const [clientView, setClientView] = useState(true)
  const [activeTab, setActiveTab] = useState('readiness')
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false)
  const [isProjectSelected, setIsProjectSelected] = useState(false)
  const [selectedClient, setSelectedClient] = useState('')
  
  // Global Portfolios (Clients) State
  const [portfolios, setPortfolios] = useState(() => {
    const saved = localStorage.getItem('mi_portfolios')
    return saved ? JSON.parse(saved) : [
      { 
        id: 1, name: 'Maia Labs', 
        stakeholders: [
            { name: 'Rohan Sharma', email: 'finance@maia.com', role: 'Finance Head' },
            { name: 'Aditi V.', email: 'aditi@maia.com', role: 'CEO' }
        ]
      }
    ]
  })

  // Global Projects State
  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem('mi_projects')
    return saved ? JSON.parse(saved) : [
      { 
        id: 1, name: 'Maia HQ', portfolioId: 1, client: 'Maia Labs',
        stakeholders: [
            { name: 'Suresh PM', email: 'pm@maia.com', role: 'Project Manager' },
            { name: 'Ar. Karan', email: 'karan@arch.com', role: 'Architect' },
            { name: 'Vijay S.', email: 'vijay@site.com', role: 'Supervisor' }
        ],
        milestones: { measurementDate: '2026-02-15', siteReadiness: '2026-03-01', completion: null },
        clientFinancials: {
            totalValue: 2500000,
            requests: [
                { id: 1, amount: 750000, date: '2026-02-16', status: 'Requested', milestone: 'Advance' }
            ],
            received: [
                { id: 1, amount: 750000, date: '2026-02-18', ref: 'BANK_001' }
            ]
        },
        history: [{ id: 1, type: 'info', title: 'Project Initialized', detail: 'Project loop set for Maia HQ', timestamp: new Date().toISOString() }]
      }
    ]
  })

  // Global Vendor Repository
  const [vendors, setVendors] = useState(() => {
    const saved = localStorage.getItem('mi_vendors')
    return saved ? JSON.parse(saved) : [
      { 
        id: 1, name: 'Glass Tech Solutions', category: 'Glass', contact: 'Anil Kumar', phone: '+91 98860 12345', gst: '29ABCDE1234F1Z5', 
        status: 'Certified', isGstVerified: true, isCertVerified: true,
        miScore: 92,
        scores: { quality: 95, timeline: 90, financial: 88, behavior: 94 },
        history: [
            { id: 1, type: 'registration', title: 'Onboarded', detail: 'Added to Meaven database', date: '2026-01-10' }
        ],
        contracts: [
            { 
                id: 101, projectName: 'Maia HQ', orderValue: 1200000, 
                payments: [{ id: 1, amount: 450000, date: '2026-03-01', status: 'Paid', ref: 'TXN_9821', screenshot: null }] 
            }
        ],
        notes: 'High-quality glass finishing. Good for C-suite projects.'
      },
      { 
        id: 2, name: 'Precision Alum', category: 'Aluminum', contact: 'Sarah J.', phone: '+91 99000 54321', gst: '29FGHIJ5678K2Z9', 
        status: 'Vetting', isGstVerified: true, isCertVerified: false,
        miScore: 78,
        scores: { quality: 80, timeline: 75, financial: 70, behavior: 85 },
        history: [
            { id: 1, type: 'registration', title: `Onboarded by Ravi`, detail: 'New potential partner', date: '2026-02-15' }
        ],
        contracts: [],
        notes: ''
      }
    ]
  })

  const [activeProjectId, setActiveProjectId] = useState(1)
  const [readinessData, setReadinessData] = useState(() => {
    const saved = localStorage.getItem('mi_readiness')
    return saved ? JSON.parse(saved) : {}
  })

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

  const handleUpdateReadiness = (projectId, data) => {
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

            <div className="card animate-slide-up" style={{ width: '100%', maxWidth: '520px', padding: '3rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px' }}>
                <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Entry Authorization</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', lineHeight: '1.6' }}>Choose the portfolio or project loop you wish to initialize.</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <div style={{ textAlign: 'left' }}>
                        <label style={{ fontSize: '0.65rem', color: 'var(--accent-color)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Select Portfolio (By Client)</label>
                        <select 
                            value={selectedClient} 
                            onChange={(e) => { setSelectedClient(e.target.value); setActiveProjectId(''); }}
                            style={{ width: '100%', padding: '0.9rem', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '12px', color: '#fff', fontSize: '1rem' }}
                        >
                            <option value="">Choose Client Portfolio...</option>
                            {uniqueClients.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-color)' }} />
                        OR
                        <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-color)' }} />
                    </div>

                    <div style={{ textAlign: 'left' }}>
                        <label style={{ fontSize: '0.65rem', color: 'var(--accent-color)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Direct Project Entry</label>
                        <select 
                            value={activeProjectId} 
                            onChange={(e) => { setActiveProjectId(Number(e.target.value)); setSelectedClient(''); }}
                            style={{ width: '100%', padding: '0.9rem', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '12px', color: '#fff', fontSize: '1rem' }}
                        >
                            <option value="">Choose Specific Project...</option>
                            {(projects || []).map(p => <option key={p.id} value={p.id}>{p.name} ({p.client})</option>)}
                        </select>
                    </div>

                    <button 
                        onClick={() => {
                            if (selectedClient || activeProjectId) {
                                setIsProjectSelected(true)
                                // If client selected, go to Dashboard (EH), else Site Readiness (Deep Dive)
                                if (selectedClient) setActiveTab('dashboard')
                                else setActiveTab('readiness')
                            }
                        }}
                        className="btn btn-primary" 
                        style={{ width: '100%', padding: '1.2rem', justifyContent: 'center', fontSize: '1.1rem', marginTop: '1rem' }}
                    >
                        Initialize Experience Hub
                    </button>
                </div>
            </div>
            <NewProjectModal isOpen={isNewProjectModalOpen} onClose={() => setIsNewProjectModalOpen(false)} onCreate={handleCreateProject} portfolios={portfolios} />
        </div>
    )
  }

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0] || { name: 'No Active Project', client: 'N/A' }

  return (
    <div className="dashboard-container">
      <NewProjectModal isOpen={isNewProjectModalOpen} onClose={() => setIsNewProjectModalOpen(false)} onCreate={handleCreateProject} portfolios={portfolios} />

      <aside className="sidebar">
        <div className="logo-container" style={{ marginBottom: '3rem', textAlign: 'left' }}>
          <img src="/images/logo.png" alt="Meaven Logo" style={{ height: '32px', marginBottom: '0.5rem' }} />
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', letterSpacing: '0.4em', fontWeight: '500', textTransform: 'uppercase', margin: 0 }}>INTELLIGENCE</p>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          <SidebarItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon="📊" label={clientView ? "Experience Hub" : "Internal Dashboard"} />
          {!clientView && <SidebarItem active={activeTab === 'projects'} onClick={() => setActiveTab('projects')} icon="🏗️" label="Command Center" />}
          {!clientView && <SidebarItem active={activeTab === 'vendors'} onClick={() => setActiveTab('vendors')} icon="🤝" label="Vendor Bench" />}
          {(activeProjectId || activeTab !== 'dashboard') && <SidebarItem active={activeTab === 'readiness'} onClick={() => setActiveTab('readiness')} icon="📏" label="Live Audit Hub" />}
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
          <button onClick={() => { setIsProjectSelected(false); setSelectedClient(''); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.65rem', marginTop: '0.5rem', cursor: 'pointer' }}>Change Client/Project ↩</button>
        </div>

        <div className="sidebar-footer">
          <div className="client-toggle-card card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="sidebar-text" style={{ fontSize: '0.85rem' }}>{clientView ? 'Secure Mode' : 'Internal Mode'}</span>
              <button onClick={handleToggleClientView} style={{ width: '40px', height: '22px', backgroundColor: clientView ? 'var(--success)' : 'var(--bg-accent)', borderRadius: '11px', position: 'relative' }}>
                <div style={{ width: '18px', height: '18px', backgroundColor: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: clientView ? '22px' : '2px', transition: 'var(--transition)' }} />
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
              {activeTab === 'vendors' && 'Vendor Scoring Engine'}
              {activeTab === 'readiness' && 'Site-Readiness Verification'}
              {activeTab === 'calculator' && 'Technical Calculator'}
              {activeTab === 'admin' && 'System Governance & Access'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {activeTab === 'admin' ? `Super Admin: ${user.name}` : (selectedClient ? `Client: ${selectedClient}` : `Project: ${activeProject.name}`)}
            </p>
          </div>
        </header>

        {activeTab === 'dashboard' && (
            clientView ? (
                <ClientExperienceHub 
                    clientName={selectedClient} 
                    projects={projects} 
                    onSelectProject={(id) => {
                        setActiveProjectId(id);
                        setSelectedClient('');
                        setActiveTab('readiness');
                    }} 
                />
            ) : (
                <div className="grid-layout animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
                    <div className="card"><h3>Active Projects</h3><p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--accent-color)' }}>{projects.length}</p></div>
                    <div className="card"><h3>Project Timeline</h3><div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {activeProject && activeProject.history ? (
                            activeProject.history.slice().reverse().map(event => (
                                <div key={event.id} style={{ marginBottom: '1rem' }}>
                                    <p style={{ margin: 0, fontWeight: '600', fontSize: '0.85rem' }}>{event.title}</p>
                                    <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{event.detail}</p>
                                </div>
                            ))
                        ) : (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Select a project in the Command Center to view detailed activity logs.</p>
                        )}
                    </div></div>
                </div>
            )
        )}

        {activeTab === 'readiness' && (
          <SiteReadiness 
            project={activeProject} 
            projects={projects}
            portfolios={portfolios}
            onCreateProject={handleCreateProject} 
            data={readinessData[activeProjectId]} 
            onUpdate={(data) => handleUpdateReadiness(activeProjectId, data)} 
            onUpdateMilestones={handleUpdateProjectMilestones} 
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
            isReadOnly={clientView} 
          />
        )}

        {activeTab === 'projects' && (
          <ProjectDirectory 
            projects={projects} 
            vendors={vendors} 
            portfolios={portfolios}
            onSelectProject={(id) => { setActiveProjectId(id); setActiveTab('readiness'); }} 
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
          <AdminPanel users={users} onAddUser={addUser} onRemoveUser={removeUser} onResetUser={resetUser} />
        )}
      </main>

      {showPinModal && <PinModal onVerify={handlePinVerify} onCancel={() => setShowPinModal(false)} />}
    </div>
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
