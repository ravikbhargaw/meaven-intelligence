import { useState } from 'react'

const NewProjectModal = ({ isOpen, onClose, onCreate, portfolios = [] }) => {
  const [isNewPortfolio, setIsNewPortfolio] = useState(portfolios.length === 0)
  const [newPortfolioName, setNewPortfolioName] = useState('')
  const [errors, setErrors] = useState({})
  
  const [projectData, setProjectData] = useState({
    name: '',
    location: '',
    portfolioId: '',
    pm: { name: '', email: '', phone: '' },
    architect: { name: '', email: '', phone: '' },
    supervisor: { name: '', email: '', phone: '' }
  })

  if (!isOpen) return null

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const validatePhone = (phone) => /^\d{10}$/.test(phone)

  const validateStakeholder = (role, data) => {
    const roleErrors = {}
    if (!data.name.trim()) roleErrors.name = 'Name is required'
    
    const hasEmail = data.email.trim().length > 0
    const hasPhone = data.phone.trim().length > 0

    if (!hasEmail && !hasPhone) {
        roleErrors.contact = 'Either Email or Phone is mandatory'
    } else {
        if (hasEmail && !validateEmail(data.email)) roleErrors.email = 'Invalid email format'
        if (hasPhone && !validatePhone(data.phone)) roleErrors.phone = 'Phone must be 10 digits'
    }
    return roleErrors
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const newErrors = {}
    const pmErrors = validateStakeholder('pm', projectData.pm)
    const archErrors = validateStakeholder('architect', projectData.architect)
    const supErrors = validateStakeholder('supervisor', projectData.supervisor)

    if (Object.keys(pmErrors).length > 0) newErrors.pm = pmErrors
    if (Object.keys(archErrors).length > 0) newErrors.architect = archErrors
    if (Object.keys(supErrors).length > 0) newErrors.supervisor = supErrors

    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        return
    }

    let finalPortfolioId = projectData.portfolioId
    let finalClient = ''

    if (isNewPortfolio) {
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
        isNewPortfolio,
        stakeholders: [
            { ...projectData.pm, role: 'Project Manager' },
            { ...projectData.architect, role: 'Site Architect' },
            { ...projectData.supervisor, role: 'Site Supervisor' }
        ]
    })
    onClose()
  }

  const renderStakeholderFields = (role, label) => {
    const data = projectData[role]
    const roleErrors = errors[role] || {}

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--accent-color)', margin: 0 }}>{label}</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <input type="text" placeholder="Name" value={data.name} onChange={(e) => setProjectData({...projectData, [role]: {...data, name: e.target.value}})} style={{ background: 'var(--bg-accent)', border: roleErrors.name ? '1px solid #ff453a' : '1px solid var(--border-color)', borderRadius: '6px', padding: '0.6rem', color: '#fff', fontSize: '0.85rem' }} />
                    {roleErrors.name && <span style={{ fontSize: '0.6rem', color: '#ff453a' }}>{roleErrors.name}</span>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <input type="email" placeholder="Email" value={data.email} onChange={(e) => setProjectData({...projectData, [role]: {...data, email: e.target.value}})} style={{ background: 'var(--bg-accent)', border: roleErrors.email || roleErrors.contact ? '1px solid #ff453a' : '1px solid var(--border-color)', borderRadius: '6px', padding: '0.6rem', color: '#fff', fontSize: '0.85rem' }} />
                    {roleErrors.email && <span style={{ fontSize: '0.6rem', color: '#ff453a' }}>{roleErrors.email}</span>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <input type="tel" placeholder="10-digit Phone" value={data.phone} onChange={(e) => setProjectData({...projectData, [role]: {...data, phone: e.target.value}})} style={{ background: 'var(--bg-accent)', border: roleErrors.phone || roleErrors.contact ? '1px solid #ff453a' : '1px solid var(--border-color)', borderRadius: '6px', padding: '0.6rem', color: '#fff', fontSize: '0.85rem' }} />
                    {roleErrors.phone && <span style={{ fontSize: '0.6rem', color: '#ff453a' }}>{roleErrors.phone}</span>}
                </div>
            </div>
            {roleErrors.contact && <p style={{ fontSize: '0.6rem', color: '#ff453a', margin: 0 }}>{roleErrors.contact}</p>}
        </div>
    )
  }

  return (
    <div style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4000 
    }}>
      <div className="card animate-fade-in" style={{ width: '750px', padding: '2.5rem', maxHeight: '95vh', overflowY: 'auto', border: '1px solid var(--accent-color)' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>🚀 Initialize New Project Loop</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Deploy Meaven Intelligence. Define the portfolio and execution stakeholders.
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
          
          {renderStakeholderFields('pm', 'Project Manager')}
          {renderStakeholderFields('architect', 'Site Architect')}
          {renderStakeholderFields('supervisor', 'Site Supervisor')}

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
