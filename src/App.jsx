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
  const [clientView, setClientView] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false)
  const [isNewPortfolioModalOpen, setIsNewPortfolioModalOpen] = useState(false)
  const [isProjectSelected, setIsProjectSelected] = useState(false)
  const [selectedClient, setSelectedClient] = useState('')
  const [projects, setProjects] = useState(() => JSON.parse(localStorage.getItem('projects')) || [])
  const [vendors, setVendors] = useState(() => JSON.parse(localStorage.getItem('vendors')) || [])
  const [portfolios, setPortfolios] = useState(() => JSON.parse(localStorage.getItem('portfolios')) || [])
  const [activeProjectId, setActiveProjectId] = useState(null)
  const [readinessData, setReadinessData] = useState(() => JSON.parse(localStorage.getItem('readinessData')) || {})
  const [playbookProposals, setPlaybookProposals] = useState(() => JSON.parse(localStorage.getItem('playbookProposals')) || [])

  useEffect(() => { localStorage.setItem('projects', JSON.stringify(projects)) }, [projects])
  useEffect(() => { localStorage.setItem('vendors', JSON.stringify(vendors)) }, [vendors])
  useEffect(() => { localStorage.setItem('portfolios', JSON.stringify(portfolios)) }, [portfolios])
  useEffect(() => { localStorage.setItem('readinessData', JSON.stringify(readinessData)) }, [readinessData])
  useEffect(() => { localStorage.setItem('playbookProposals', JSON.stringify(playbookProposals)) }, [playbookProposals])
  useEffect(() => { if (user) setClientView(true) }, [user])

  if (!user) return <Login onLogin={login} onVerifyMasterKey={verifyMasterKey} />
  if (isFirstLogin) return <SecuritySetup onComplete={updateSecurity} />

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

  const uniqueClients = [...new Set((projects || []).map(p => p.client || 'General Portfolio'))]
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
                <SidebarItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon="📊" label={clientView ? "Experience Hub" : "Internal Dashboard"} />
                {!clientView && <SidebarItem active={activeTab === 'projects'} onClick={() => setActiveTab('projects')} icon="💰" label="Financial Hub" />}
                {!clientView && <SidebarItem active={activeTab === 'vendors'} onClick={() => setActiveTab('vendors')} icon="🤝" label="Vendor Bench" />}
                {!clientView && <SidebarItem active={activeTab === 'readiness'} onClick={() => setActiveTab('readiness')} icon="📏" label="Live Audit Hub" />}
                <SidebarItem active={activeTab === 'calculator'} onClick={() => setActiveTab('calculator')} icon="🧮" label="Tech Calculator" />
                {user?.role === 'SuperAdmin' && !clientView && ( <SidebarItem active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} icon="⚙️" label="Governance Console" /> )}
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
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Active Operator</p>
                  <p style={{ fontSize: '0.8rem', fontWeight: '600' }}>{user.name}</p>
                  <button onClick={() => { setIsProjectSelected(false); setSelectedClient(''); }} style={{ background: 'none', border: 'none', color: 'var(--accent-color)', fontSize: '0.65rem', marginTop: '0.5rem', cursor: 'pointer', padding: 0 }}>Change Client ↩</button>
                </div>
              </div>
            </aside>
            <main className="main-content">
              <header className="main-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <h1 style={{ margin: 0, fontSize: '1.4rem' }}>{activeTab === 'dashboard' ? (clientView ? `Portfolio Experience: ${selectedClient}` : 'Tactical Command Center') : activeTab === 'projects' ? 'Project Financial Hub' : activeTab === 'vendors' ? 'Partner Ecosystem' : activeTab === 'readiness' ? 'Site Audit Intelligence' : activeTab === 'calculator' ? 'Technical Calculation Loop' : 'Governance Console'}</h1>
                  <div style={{ padding: '0.4rem 1rem', background: clientView ? 'rgba(52,  green, 0.1)' : 'rgba(102, 178, 194, 0.1)', border: `1px solid ${clientView ? '#34c759' : 'var(--accent-color)'}`, borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '6px', height: '6px', background: clientView ? '#34c759' : 'var(--accent-color)', borderRadius: '50%' }} />
                    <span style={{ fontSize: '0.65rem', fontWeight: '800', color: clientView ? '#34c759' : 'var(--accent-color)' }}>{clientView ? 'SECURE PORTFOLIO' : 'INTERNAL TACTICAL'}</span>
                  </div>
                </div>
                <button onClick={() => { setIsProjectSelected(false); setSelectedClient(''); }} className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}>⟳ Switch Portfolio</button>
              </header>
              {activeTab === 'dashboard' && ( clientView ? ( <ClientExperienceHub portfolioName={selectedClient} projects={projects.filter(p => p.client === selectedClient)} vendors={vendors} onViewProject={(id) => { setActiveProjectId(id); setActiveTab('dashboard'); }} /> ) : ( <CommandCenter projects={projects} activeProjectId={activeProjectId} setActiveProjectId={setActiveProjectId} vendors={vendors} onLockLocation={handleLockLocation} onUpdateReadiness={handleUpdateReadiness} readinessData={readinessData} onUpdateFinancials={handleUpdateProject} /> ) )}
              {activeTab === 'projects' && ( <ProjectDirectory projects={projects} onSelectProject={setActiveProjectId} activeProjectId={activeProjectId} onUpdateMilestones={handleUpdateProjectMilestones} onUpdateProject={handleUpdateProject} /> )}
              {activeTab === 'vendors' && ( <VendorScoring vendors={vendors} projects={projects} onAddContract={handleAddVendorContract} onAddPayment={handleAddVendorPayment} onUpdateVendor={handleUpdateVendor} onAddVendor={handleAddVendor} onAssignVendor={handleAssignVendor} onReassign={handleReassignProject} /> )}
              {activeTab === 'readiness' && ( <SiteReadiness projectId={activeProjectId} projectName={activeProject?.name} data={readinessData[activeProjectId]} onSave={(data) => handleUpdateReadiness(activeProjectId, data)} stakeholders={activeProject?.stakeholders} /> )}
              {activeTab === 'calculator' && ( <TechnicalCalculator /> )}
              {activeTab === 'admin' && ( <AdminPanel users={users || []} proposals={playbookProposals || []} onApproveProposal={handleApprovePlaybookUpdate} onAddUser={addUser} onRemoveUser={removeUser} onResetUser={resetUser} onBack={() => setActiveTab('dashboard')} /> )}
            </main>
          </div>
        )}
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
