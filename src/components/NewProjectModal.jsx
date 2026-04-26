import { useState } from 'react'

const NewProjectModal = ({ isOpen, onClose, onCreate, portfolios = [] }) => {
  const [isNewPortfolio, setIsNewPortfolio] = useState(portfolios.length === 0)
  const [newPortfolioName, setNewPortfolioName] = useState('')
  const [projectData, setProjectData] = useState({
    name: '',
    location: '',
    portfolioId: '',
    pm: { name: '', email: '' },
    architect: { name: '', email: '' },
    supervisor: { name: '', email: '' }
  })

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    
    let finalPortfolioId = projectData.portfolioId
    let finalClient = ''

    if (isNewPortfolio) {
        // Create a temporary ID for the new portfolio
        finalPortfolioId = Date.now()
        finalClient = newPortfolioName
    } else {
        const selectedPortfolio = portfolios.find(p => p.id === Number(projectData.portfolioId))
        finalPortfolioId = Number(projectData.portfolioId)
        finalClient = selectedPortfolio?.name || 'General Portfolio'
    }

    onCreate({
        ...projectData,
        portfolioId: finalPortfolioId,
        client: finalClient,
        isNewPortfolio, // Pass this to App.jsx to handle portfolio creation
        stakeholders: [
            { ...projectData.pm, role: 'Project Manager' },
            { ...projectData.architect, role: 'Site Architect' },
            { ...projectData.supervisor, role: 'Site Supervisor' }
        ]
    })
    onClose()
  }

  return (
    <div style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 
    }}>
      <div className="card animate-fade-in" style={{ width: '600px', padding: '2.5rem', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--accent-color)' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>🚀 Initialize New Project Loop</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Deploy Meaven Intelligence for a new project. Define the portfolio and execution team below.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Project Name</label>
              <input type="text" placeholder="e.g. Galaxy Tech Park" value={projectData.name} onChange={(e) => setProjectData({...projectData, name: e.target.value})} style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: '#fff' }} required />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Portfolio / Client</label>
                {portfolios.length > 0 && (
                    <button type="button" onClick={() => setIsNewPortfolio(!isNewPortfolio)} style={{ background: 'none', border: 'none', color: 'var(--accent-color)', fontSize: '0.65rem', cursor: 'pointer' }}>
                        {isNewPortfolio ? "Select Existing" : "+ New Client"}
                    </button>
                )}
              </div>
              
              {isNewPortfolio ? (
                  <input 
                    type="text" 
                    placeholder="Enter Client Name" 
                    value={newPortfolioName} 
                    onChange={(e) => setNewPortfolioName(e.target.value)} 
                    style={{ background: 'var(--bg-accent)', border: '1px solid var(--accent-color)', borderRadius: '8px', padding: '0.75rem', color: '#fff' }} 
                    required 
                  />
              ) : (
                  <select value={projectData.portfolioId} onChange={(e) => setProjectData({...projectData, portfolioId: e.target.value})} style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: '#fff' }} required>
                    <option value="">Select Portfolio...</option>
                    {portfolios.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Project Location</label>
            <input type="text" placeholder="e.g. Bangalore, Whitefield" value={projectData.location} onChange={(e) => setProjectData({...projectData, location: e.target.value})} style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: '#fff' }} required />
          </div>

          <hr style={{ border: 'none', borderBottom: '1px solid var(--border-color)', margin: '0.5rem 0' }} />
          <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--accent-color)', letterSpacing: '0.1em' }}>Execution Stakeholders</h4>

          {/* Project Manager */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Project Manager Name</label>
                <input type="text" placeholder="Name" value={projectData.pm.name} onChange={(e) => setProjectData({...projectData, pm: {...projectData.pm, name: e.target.value}})} style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: '#fff' }} required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>PM Email</label>
                <input type="email" placeholder="email@company.com" value={projectData.pm.email} onChange={(e) => setProjectData({...projectData, pm: {...projectData.pm, email: e.target.value}})} style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: '#fff' }} required />
            </div>
          </div>

          {/* Architect */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Architect Name</label>
                <input type="text" placeholder="Name" value={projectData.architect.name} onChange={(e) => setProjectData({...projectData, architect: {...projectData.architect, name: e.target.value}})} style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: '#fff' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Architect Email</label>
                <input type="email" placeholder="email@arch.com" value={projectData.architect.email} onChange={(e) => setProjectData({...projectData, architect: {...projectData.architect, email: e.target.value}})} style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: '#fff' }} />
            </div>
          </div>

          {/* Supervisor */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Site Supervisor Name</label>
                <input type="text" placeholder="Name" value={projectData.supervisor.name} onChange={(e) => setProjectData({...projectData, supervisor: {...projectData.supervisor, name: e.target.value}})} style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: '#fff' }} required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Supervisor Email</label>
                <input type="email" placeholder="email@site.com" value={projectData.supervisor.email} onChange={(e) => setProjectData({...projectData, supervisor: {...projectData.supervisor, email: e.target.value}})} style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: '#fff' }} required />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>Discard</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', fontWeight: '800' }}>START EXECUTION LOOP</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewProjectModal
