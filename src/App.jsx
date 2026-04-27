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
import NewPortfolioModal from './components/NewPortfolioModal'
import ExecutiveSummary from './components/ExecutiveSummary'
import AiAssistant from './components/AiAssistant'
import { supabase } from './supabaseClient'

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
  const { user, login, logout, isFirstLogin, updateSecurity, verifyPin, showPinModal, setShowPinModal, users, addUser, removeUser, resetUser, verifyMasterKey } = useAuth()
  const [clientView, setClientView] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false)
  const [isNewPortfolioModalOpen, setIsNewPortfolioModalOpen] = useState(false)
  const [isProjectSelected, setIsProjectSelected] = useState(false)
  const [selectedClient, setSelectedClient] = useState('')
  const [projects, setProjects] = useState([])
  const [vendors, setVendors] = useState([])
  const [portfolios, setPortfolios] = useState([])
  const [activeProjectId, setActiveProjectId] = useState(null)
  const [readinessData, setReadinessData] = useState({})
  const [playbookProposals, setPlaybookProposals] = useState([])
  const [isSyncing, setIsSyncing] = useState(true)
  const [navHistory, setNavHistory] = useState([])

  const handleNavigate = (newTab) => {
    if (newTab === activeTab) return
    setNavHistory(prev => [...prev, activeTab])
    setActiveTab(newTab)
  }

  const handleBack = () => {
    if (navHistory.length === 0) return
    const prevTab = navHistory[navHistory.length - 1]
    setNavHistory(prev => prev.slice(0, -1))
    setActiveTab(prevTab)
  }

  // --- CLOUD SYNC ENGINE ---
  useEffect(() => {
    async function loadTacticalData() {
        if (!user) return
        setIsSyncing(true)

        try {
            const { data: cloudProjects } = await supabase.from('projects').select('*')
            const { data: cloudVendors } = await supabase.from('vendors').select('*')
            const { data: cloudPortfolios } = await supabase.from('portfolios').select('*')
            const { data: cloudReadiness } = await supabase.from('readiness_data').select('*')

            // Migration Check: If cloud is empty, push local data
            if (!cloudProjects || cloudProjects.length === 0) {
                const localProjects = JSON.parse(localStorage.getItem('projects')) || []
                if (localProjects.length > 0) {
                    await Promise.all(localProjects.map(p => supabase.from('projects').upsert({ id: String(p.id), name: p.name, data: p })))
                    setProjects(localProjects)
                }
            } else {
                setProjects(cloudProjects.map(p => p.data))
            }

            if (!cloudVendors || cloudVendors.length === 0) {
                const localVendors = JSON.parse(localStorage.getItem('vendors')) || []
                if (localVendors.length > 0) {
                    await Promise.all(localVendors.map(v => supabase.from('vendors').upsert({ id: String(v.id), name: v.name, data: v })))
                    setVendors(localVendors)
                }
            } else {
                setVendors(cloudVendors.map(v => v.data))
            }

            if (!cloudPortfolios || cloudPortfolios.length === 0) {
                const localPortfolios = JSON.parse(localStorage.getItem('portfolios')) || []
                if (localPortfolios.length > 0) {
                    await Promise.all(localPortfolios.map(p => supabase.from('portfolios').upsert({ id: String(p.id), name: p.name, data: p })))
                    setPortfolios(localPortfolios)
                }
            } else {
                setPortfolios(cloudPortfolios.map(p => p.data))
            }

            if (cloudReadiness && cloudReadiness.length > 0) {
                const rData = {}
                cloudReadiness.forEach(r => rData[r.id] = r.data)
                setReadinessData(rData)
            } else {
                setReadinessData(JSON.parse(localStorage.getItem('readinessData')) || {})
            }

            setPlaybookProposals(JSON.parse(localStorage.getItem('playbookProposals')) || [])
        } catch (error) {
            console.error("Cloud Tactical Sync Failed:", error)
        } finally {
            setIsSyncing(false)
        }
    }
    loadTacticalData()
  }, [user])

  // --- AUTO-PERSISTENCE (LOCAL + CLOUD) ---
  useEffect(() => { 
    localStorage.setItem('projects', JSON.stringify(projects))
    if (!isSyncing && projects.length > 0) {
        projects.forEach(p => supabase.from('projects').upsert({ id: String(p.id), name: p.name, data: p }).then(() => {}))
    }
  }, [projects, isSyncing])

  useEffect(() => { 
    localStorage.setItem('vendors', JSON.stringify(vendors)) 
    if (!isSyncing && vendors.length > 0) {
        vendors.forEach(v => supabase.from('vendors').upsert({ id: String(v.id), name: v.name, data: v }).then(() => {}))
    }
  }, [vendors, isSyncing])

  useEffect(() => { 
    localStorage.setItem('portfolios', JSON.stringify(portfolios)) 
    if (!isSyncing && portfolios.length > 0) {
        portfolios.forEach(p => supabase.from('portfolios').upsert({ id: String(p.id), name: p.name, data: p }).then(() => {}))
    }
  }, [portfolios, isSyncing])

  useEffect(() => { localStorage.setItem('readinessData', JSON.stringify(readinessData)) }, [readinessData])
  useEffect(() => { localStorage.setItem('playbookProposals', JSON.stringify(playbookProposals)) }, [playbookProposals])

  useEffect(() => {
    if (user && projects.length > 0) {
      const loginKey = `login_logged_${user.email}_${new Date().toDateString()}`
      if (!sessionStorage.getItem(loginKey)) {
        setProjects(prev => prev.map(p => ({
          ...p,
          history: [
            ...(p.history || []),
            { 
              id: Date.now() + Math.random(), 
              type: 'info', 
              title: 'Tactical Access Authorized', 
              detail: `Operator ${user.name} initialized secure session`, 
              timestamp: new Date().toISOString() 
            }
          ]
        })))
        sessionStorage.setItem(loginKey, 'true')
      }
    }
  }, [user, isSyncing])

  if (!user) return (
    <div className="dashboard-app-root">
      <Login onLogin={login} onVerifyMasterKey={verifyMasterKey} />
      <AiAssistant activeTab="dashboard" clientView={true} userName="Guest" />
    </div>
  )
  if (isFirstLogin) return (
    <div className="dashboard-app-root">
      <SecuritySetup onComplete={updateSecurity} />
      <AiAssistant activeTab="dashboard" clientView={false} userName={user?.name || 'Operator'} />
    </div>
  )

  const handlePinVerify = (pin) => {
    if (verifyPin(pin)) { setClientView(false); setShowPinModal(false); }
    else { alert("Invalid Security PIN"); }
  }

  const handleCreateProject = (newProject) => {
    if (newProject.isNewPortfolio) {
        const newPortfolio = { id: newProject.portfolioId, name: newProject.client, stakeholders: [] }
        setPortfolios(prev => [...(prev || []), newPortfolio])
    }
    const project = { ...newProject, id: Date.now(), milestones: { measurementDate: null, siteReadiness: null, completion: null }, clientFinancials: { totalValue: 0, requests: [], received: [] }, history: [{ id: 1, type: 'info', title: 'Project Initialized', detail: `Project loop set for ${newProject.name}`, timestamp: new Date().toISOString() }] }
    setProjects([...(projects || []), project]); setActiveProjectId(project.id); setIsNewProjectModalOpen(false);
  }

  const handleCreatePortfolio = (newPortfolio) => {
    setPortfolios(prev => [...(prev || []), newPortfolio]); setSelectedClient(newPortfolio.name); setIsProjectSelected(true); setActiveTab('dashboard');
  }

  const handleLogPayment = (projectId, amount, ref, date, photo) => {
    setProjects(prev => prev.map(p => {
        if (Number(p.id) === Number(projectId)) {
            const financials = p.clientFinancials || { totalValue: 0, requests: [], received: [] }
            const newPayment = { id: Date.now(), amount: parseInt(amount), ref, date, photo }
            return { 
                ...p, 
                clientFinancials: { ...financials, received: [...(financials.received || []), newPayment] },
                history: [...(p.history || []), { id: Date.now() + 1, type: 'success', title: 'Payment Received', detail: `₹${parseInt(amount).toLocaleString()} credited. Ref: ${ref}`, timestamp: new Date().toISOString() }]
            }
        }
        return p
    }))
  }

  const handleLogPayout = (projectId, amount, ref, date, photo, vendorId) => {
    setProjects(prev => prev.map(p => {
        if (Number(p.id) === Number(projectId)) {
            const newPayout = { id: Date.now(), amount: parseInt(amount), ref, date, photo, vendorId }
            return { 
                ...p, 
                payouts: [...(p.payouts || []), newPayout],
                history: [...(p.history || []), { id: Date.now() + 1, type: 'warning', title: 'Vendor Payout', detail: `₹${parseInt(amount).toLocaleString()} debited. Ref: ${ref}`, timestamp: new Date().toISOString() }]
            }
        }
        return p
    }))
  }

  const handleUpdateProjectMilestones = (projectId, milestones) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, milestones: { ...p.milestones, ...milestones } } : p))
  }

  const handleUpdateProject = (projectId, updates) => {
    setProjects(prev => (prev || []).map(p => Number(p.id) === Number(projectId) ? { ...p, ...updates } : p))
  }

  const handleUpdateReadiness = (projectId, data) => {
    setReadinessData(prev => ({ ...prev, [projectId]: data }))
  }

  const handleAddVendor = (newVendor) => {
    setVendors([...vendors, { ...newVendor, id: Date.now() }])
  }

  const handleLockLocation = (projectId, coords) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, coordinates: coords, locationLocked: true } : p))
  }

  const handleUpdateVendor = (id, updates) => {
    setVendors(vendors.map(v => v.id === id ? { ...v, ...updates } : v))
  }

  const handleAddVendorPayment = (vendorId, contractId, payment) => {
    setVendors(vendors.map(v => v.id === vendorId ? { ...v, contracts: v.contracts.map(c => c.id === contractId ? { ...c, payments: [...(c.payments || []), { ...payment, id: Date.now() }] } : c) } : v))
  }

  const handleAddVendorContract = (vendorId, projectName, orderValue) => {
    setVendors(vendors.map(v => v.id === vendorId ? { ...v, contracts: [...(v.contracts || []), { id: Date.now(), projectName, orderValue: parseInt(orderValue), payments: [] }] } : v))
  }

  const handleAssignVendor = (projectId, vendor) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, assignedVendor: vendor.name } : p))
  }

  const handleReassignProject = (projectId, oldVendorId, newVendorId, orderValue) => {}
  const handleApprovePlaybookUpdate = (proposalId) => {
    setPlaybookProposals(prev => prev.map(p => p.id === proposalId ? { ...p, status: 'approved' } : p))
  }

  const uniqueClients = [...new Set([
    ...(projects || []).map(p => p.client || 'General Portfolio'),
    ...(portfolios || []).map(p => p.name)
  ])].filter(Boolean)
  const activeProject = (projects || []).find(p => Number(p.id) === Number(activeProjectId)) || (projects && projects[0]) || { id: 0, name: 'Initializing...', client: 'Meaven Intelligence' }

  return (
    <ErrorBoundary>
      <div className="dashboard-app-root">
        <NewProjectModal isOpen={isNewProjectModalOpen} onClose={() => setIsNewProjectModalOpen(false)} onCreate={handleCreateProject} portfolios={portfolios} />
        <NewPortfolioModal isOpen={isNewPortfolioModalOpen} onClose={() => setIsNewPortfolioModalOpen(false)} onCreate={handleCreatePortfolio} />
        {showPinModal && <PinModal onVerify={handlePinVerify} onCancel={() => setShowPinModal(false)} />}

        {!isProjectSelected ? (
          <div className="landing-gate animate-fade-in" style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(102, 178, 194, 0.05) 0%, transparent 70%)' }}>
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
                          <select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)} style={{ width: '100%', padding: '1rem', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-premium)', color: '#fff', fontSize: '1.1rem' }}>
                              <option value="">Choose Client Portfolio...</option>
                              {uniqueClients.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                      </div>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                          <button onClick={() => { if (selectedClient) { setIsProjectSelected(true); setActiveTab('dashboard'); } else { setIsNewProjectModalOpen(true); } }} className="btn btn-primary" style={{ flex: 1, padding: '1.2rem', justifyContent: 'center', fontSize: '1.1rem' }}>{selectedClient ? 'Initialize Portfolio' : 'Start First Project'}</button>
                          <button onClick={() => setIsNewPortfolioModalOpen(true)} className="btn btn-outline" style={{ flex: 1, padding: '1.2rem', justifyContent: 'center', fontSize: '1.1rem' }}>+ Create New Portfolio</button>
                      </div>
                  </div>
              </div>
          </div>
        ) : (
          <div className="dashboard-container">
            <aside className="sidebar">
              <div className="logo-container" style={{ marginBottom: '3rem', textAlign: 'left' }}>
                <img src="/images/logo.png" alt="Meaven Logo" style={{ height: '32px', marginBottom: '0.5rem' }} />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', letterSpacing: '0.4em', fontWeight: '500', textTransform: 'uppercase', margin: 0 }}>INTELLIGENCE</p>
              </div>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                <SidebarItem active={activeTab === 'dashboard'} onClick={() => handleNavigate('dashboard')} icon="📊" label={clientView ? "Experience Hub" : "Internal Dashboard"} />
                {!clientView && <SidebarItem active={activeTab === 'projects'} onClick={() => handleNavigate('projects')} icon="📁" label="Project Central" />}
                {!clientView && <SidebarItem active={activeTab === 'vendors'} onClick={() => handleNavigate('vendors')} icon="🤝" label="Vendor Bench" />}
                {!clientView && <SidebarItem active={activeTab === 'readiness'} onClick={() => handleNavigate('readiness')} icon="📏" label="Live Audit Hub" />}
                <SidebarItem active={activeTab === 'calculator'} onClick={() => handleNavigate('calculator')} icon="🧮" label="Tech Calculator" />
                {user?.role === 'SuperAdmin' && !clientView && (
                  <>
                    <SidebarItem active={activeTab === 'strategy'} onClick={() => handleNavigate('strategy')} icon="🧠" label="Executive Strategy" />
                    <SidebarItem active={activeTab === 'admin'} onClick={() => handleNavigate('admin')} icon="⚙️" label="Governance Console" />
                  </>
                )}
              </nav>
              <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Security Clearance</span>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: clientView ? '#34c759' : 'var(--accent-color)', boxShadow: `0 0 10px ${clientView ? '#34c759' : 'var(--accent-color)'}` }} />
                  </div>
                  <div onClick={() => { if (clientView) setShowPinModal(true); else setClientView(true); }} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem', background: 'var(--bg-primary)', borderRadius: '12px', cursor: 'pointer', border: '1px solid var(--border-color)' }}>
                    <div style={{ width: '40px', height: '22px', background: clientView ? 'rgba(255,255,255,0.1)' : 'var(--accent-color)', borderRadius: '11px', position: 'relative' }}>
                        <div style={{ width: '16px', height: '16px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '3px', left: clientView ? '3px' : '21px', transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)' }} />
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: clientView ? 'var(--text-secondary)' : '#fff' }}>{clientView ? 'CLIENT MODE' : 'INTERNAL MODE'}</span>
                  </div>
                </div>
                <button onClick={() => setIsNewProjectModalOpen(true)} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem', padding: '0.8rem', fontWeight: '800' }}>+ INITIALIZE PROJECT LOOP</button>
                <div style={{ padding: '1rem', background: 'var(--bg-accent)', borderRadius: '12px', marginTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Active Operator</p>
                      <p style={{ fontSize: '0.8rem', fontWeight: '600' }}>{user.name}</p>
                    </div>
                    <button 
                      onClick={logout} 
                      style={{ background: 'none', border: 'none', color: '#ff453a', fontSize: '0.65rem', fontWeight: '800', cursor: 'pointer', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(255, 69, 58, 0.1)' }}
                    >
                      LOGOUT
                    </button>
                  </div>
                  <button onClick={() => { setIsProjectSelected(false); setSelectedClient(''); }} style={{ background: 'none', border: 'none', color: 'var(--accent-color)', fontSize: '0.65rem', marginTop: '0.5rem', cursor: 'pointer', padding: 0 }}>Change Client ↩</button>
                </div>
              </div>
            </aside>
            <main className="main-content">
              <header className="main-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {navHistory.length > 0 && (
                      <button 
                        onClick={handleBack}
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--accent-color)', padding: '0.4rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: '800' }}
                      >
                        ← BACK
                      </button>
                    )}
                    <h1 style={{ margin: 0, fontSize: 'clamp(1rem, 4vw, 1.4rem)' }}>
                      {activeTab === 'dashboard' 
                          ? (clientView ? `Experience: ${selectedClient || activeProject?.client || 'Meaven'}` : 'Tactical Command') 
                          : activeTab === 'projects' ? 'Financial Hub' 
                          : activeTab === 'vendors' ? 'Partner Bench' 
                          : activeTab === 'readiness' ? 'Audit Hub' 
                          : activeTab === 'calculator' ? 'Tech Calc' 
                          : activeTab === 'strategy' ? 'Executive Hub'
                          : 'Admin'}
                    </h1>
                  </div>
                  <div className="desktop-only" style={{ padding: '0.4rem 1rem', background: clientView ? 'rgba(52, 215, 75, 0.1)' : 'rgba(102, 178, 194, 0.1)', border: `1px solid ${clientView ? '#34c759' : 'var(--accent-color)'}`, borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '6px', height: '6px', background: clientView ? '#34c759' : 'var(--accent-color)', borderRadius: '50%' }} />
                    <span style={{ fontSize: '0.65rem', fontWeight: '800', color: clientView ? '#34c759' : 'var(--accent-color)' }}>{clientView ? 'SECURE PORTFOLIO' : 'INTERNAL TACTICAL'}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => { setIsProjectSelected(false); setSelectedClient(''); }} className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}>⟳ Switch</button>
                </div>
              </header>

              <div className="tab-content-wrapper">
                {activeTab === 'dashboard' && (
                  clientView ? (
                    <ClientExperienceHub 
                      portfolioName={selectedClient || activeProject?.client} 
                      projects={projects.filter(p => p.client === (selectedClient || activeProject?.client))} 
                      vendors={vendors} 
                      onViewProject={(id) => { setActiveProjectId(id); setActiveTab('dashboard'); }} 
                    />
                  ) : (
                    <CommandCenter 
                      projects={projects} 
                      activeProjectId={activeProjectId} 
                      setActiveProjectId={setActiveProjectId} 
                      vendors={vendors}
                      onSelectProject={(id) => { setActiveProjectId(id); setActiveTab('readiness'); }}
                      onLockLocation={handleLockLocation}
                      onUpdateReadiness={handleUpdateReadiness}
                      readinessData={readinessData}
                      onUpdateFinancials={handleUpdateProject}
                    />
                  )
                )}

                {activeTab === 'projects' && (
                  <ProjectDirectory 
                    projects={projects} 
                    vendors={vendors}
                    onSelectProject={(id) => { setActiveProjectId(id); setActiveTab('readiness'); }} 
                    activeProjectId={activeProjectId} 
                    onUpdateMilestones={handleUpdateProjectMilestones}
                    onUpdateProject={handleUpdateProject}
                    onLogPayment={handleLogPayment}
                    onLogPayout={handleLogPayout}
                    onAddVendor={handleAddVendor}
                  />
                )}

                {activeTab === 'vendors' && (
                  <VendorScoring 
                    vendors={vendors} 
                    projects={projects} 
                    onAddContract={handleAddVendorContract} 
                    onAddPayment={handleAddVendorPayment} 
                    onUpdateVendor={handleUpdateVendor}
                    onAddVendor={handleAddVendor}
                    onAssignVendor={handleAssignVendor}
                    onReassign={handleReassignProject}
                  />
                )}

                {activeTab === 'readiness' && (
                  <SiteReadiness 
                    project={activeProject}
                    projects={projects}
                    data={readinessData[activeProjectId]} 
                    onSelectProject={setActiveProjectId}
                    onUpdate={(data) => handleUpdateReadiness(activeProjectId, data)} 
                  />
                )}
                {activeTab === 'calculator' && ( <TechnicalCalculator /> )}
                {activeTab === 'strategy' && ( <ExecutiveSummary projects={projects} vendors={vendors} onNavigate={(tab) => handleNavigate(tab)} /> )}
                {activeTab === 'admin' && ( <AdminPanel users={users || []} proposals={playbookProposals || []} onApproveProposal={handleApprovePlaybookUpdate} onAddUser={addUser} onRemoveUser={removeUser} onResetUser={resetUser} onBack={() => setActiveTab('dashboard')} /> )}
              </div>
            </main>

            {/* Mobile Navigation Engine */}
            <nav className="bottom-nav mobile-only">
              <button className={`bottom-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => handleNavigate('dashboard')}>
                <span>📊</span>
                <span>Dashboard</span>
              </button>
              <button className={`bottom-nav-item ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => handleNavigate('projects')}>
                <span>📁</span>
                <span>Projects</span>
              </button>
              {!clientView && (
                <button className={`bottom-nav-item ${activeTab === 'vendors' ? 'active' : ''}`} onClick={() => handleNavigate('vendors')}>
                  <span>🤝</span>
                  <span>Vendors</span>
                </button>
              )}
              {user?.role === 'SuperAdmin' && !clientView && (
                <button className={`bottom-nav-item ${activeTab === 'strategy' ? 'active' : ''}`} onClick={() => handleNavigate('strategy')}>
                  <span>🧠</span>
                  <span>Strategy</span>
                </button>
              )}
              <button className="bottom-nav-item" onClick={() => setIsNewProjectModalOpen(true)}>
                <span style={{ color: 'var(--accent-color)' }}>➕</span>
                <span>New</span>
              </button>
            </nav>
          </div>
        )}
        <AiAssistant 
          activeTab={activeTab} 
          clientView={clientView} 
          userName={user?.name || 'Operator'} 
        />
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
