import { useState } from 'react'

const NewProjectModal = ({ isOpen, onClose, onCreate, portfolios = [] }) => {
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
    const selectedPortfolio = portfolios.find(p => p.id === Number(projectData.portfolioId))
    onCreate({
        ...projectData,
        portfolioId: Number(projectData.portfolioId),
        client: selectedPortfolio?.name || 'Unknown Client',
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
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 
    }}>
      <div className="card animate-fade-in" style={{ width: '600px', padding: '2.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>Start New Project</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Initialize project intelligence and setup the multi-layer stakeholder loop.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Project Name</label>
              <input type="text" placeholder="e.g. WeWork Galaxy" value={projectData.name} onChange={(e) => setProjectData({...projectData, name: e.target.value})} style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: '#fff' }} required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Portfolio / Client</label>
              <select value={projectData.portfolioId} onChange={(e) => setProjectData({...projectData, portfolioId: e.target.value})} style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: '#fff' }} required>
                <option value="">Select Portfolio...</option>
                {portfolios.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Location</label>
            <input type="text" placeholder="Bangalore" value={projectData.location} onChange={(e) => setProjectData({...projectData, location: e.target.value})} style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: '#fff' }} required />
          </div>

          <hr style={{ border: 'none', borderBottom: '1px solid var(--border-color)', margin: '0.5rem 0' }} />
          <h4 style={{ fontSize: '0.9rem' }}>Project Execution Stakeholders</h4>

          {/* Project Manager */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <input type="text" placeholder="PM Name" value={projectData.pm.name} onChange={(e) => setProjectData({...projectData, pm: {...projectData.pm, name: e.target.value}})} style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: '#fff' }} required />
            <input type="email" placeholder="PM Email" value={projectData.pm.email} onChange={(e) => setProjectData({...projectData, pm: {...projectData.pm, email: e.target.value}})} style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: '#fff' }} required />
          </div>

          {/* Architect */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <input type="text" placeholder="Architect Name" value={projectData.architect.name} onChange={(e) => setProjectData({...projectData, architect: {...projectData.architect, name: e.target.value}})} style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: '#fff' }} />
            <input type="email" placeholder="Architect Email" value={projectData.architect.email} onChange={(e) => setProjectData({...projectData, architect: {...projectData.architect, email: e.target.value}})} style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: '#fff' }} />
          </div>

          {/* Supervisor */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <input type="text" placeholder="Supervisor Name" value={projectData.supervisor.name} onChange={(e) => setProjectData({...projectData, supervisor: {...projectData.supervisor, name: e.target.value}})} style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: '#fff' }} required />
            <input type="email" placeholder="Supervisor Email" value={projectData.supervisor.email} onChange={(e) => setProjectData({...projectData, supervisor: {...projectData.supervisor, email: e.target.value}})} style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: '#fff' }} required />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={onClose} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Create Project Loop</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewProjectModal
