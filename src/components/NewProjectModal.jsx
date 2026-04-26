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
    const hasName = data.name.trim().length > 0
    const hasEmail = data.email.trim().length > 0
    const hasPhone = data.phone.trim().length > 0

    if (hasName) {
        if (!hasEmail) roleErrors.email = 'Email is mandatory'
        else if (!validateEmail(data.email)) roleErrors.email = 'Invalid email format'
        
        if (!hasPhone) roleErrors.phone = 'Phone is mandatory'
        else if (!validatePhone(data.phone)) roleErrors.phone = 'Phone must be 10 digits'
    }
    
    return roleErrors
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const newErrors = {}
    const pmErrors = validateStakeholder('pm', projectData.pm)
    const archErrors = validateStakeholder('architect', projectData.architect)
    const supErrors = validateStakeholder('supervisor', projectData.supervisor)

    const pmFilled = projectData.pm.name.trim().length > 0
    const archFilled = projectData.architect.name.trim().length > 0
    const supFilled = projectData.supervisor.name.trim().length > 0

    if (!pmFilled && !archFilled && !supFilled) {
        newErrors.general = 'At least one stakeholder block (Name, Email, Phone) is mandatory.'
        setErrors(newErrors)
        return
    }

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--accent-color)', margin: 0 }}>{label}</h4>
                {projectData[role].name && <span style={{ fontSize: '0.6rem', color: 'var(--success)' }}>✔ ACTIVE BLOCK</span>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.8rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <input type="text" placeholder="Name" value={data.name} onChange={(e) => setProjectData({...projectData, [role]: {...data, name: e.target.value}})} style={{ background: 'var(--bg-accent)', border: roleErrors.name ? '1px solid #ff453a' : '1px solid var(--border-color)', borderRadius: '6px', padding: '0.6rem', color: '#fff', fontSize: '0.8rem' }} />
                    {roleErrors.name && <span style={{ fontSize: '0.6rem', color: '#ff453a' }}>{roleErrors.name}</span>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <input type="email" placeholder="Email" value={data.email} onChange={(e) => setProjectData({...projectData, [role]: {...data, email: e.target.value}})} style={{ background: 'var(--bg-accent)', border: roleErrors.email ? '1px solid #ff453a' : '1px solid var(--border-color)', borderRadius: '6px', padding: '0.6rem', color: '#fff', fontSize: '0.8rem' }} />
                    {roleErrors.email && <span style={{ fontSize: '0.6rem', color: '#ff453a' }}>{roleErrors.email}</span>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <input type="tel" placeholder="10-digit Phone" value={data.phone} onChange={(e) => setProjectData({...projectData, [role]: {...data, phone: e.target.value}})} style={{ background: 'var(--bg-accent)', border: roleErrors.phone ? '1px solid #ff453a' : '1px solid var(--border-color)', borderRadius: '6px', padding: '0.6rem', color: '#fff', fontSize: '0.8rem' }} />
                    {roleErrors.phone && <span style={{ fontSize: '0.6rem', color: '#ff453a' }}>{roleErrors.phone}</span>}
                </div>
            </div>
        </div>
    )
  }

  return (
    <div style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4000,
      padding: '10px'
    }}>
      <div className="card animate-fade-in" style={{ width: 'clamp(300px, 95%, 750px)', padding: 'clamp(1rem, 5vw, 2.5rem)', maxHeight: '95vh', overflowY: 'auto', border: '1px solid var(--accent-color)' }}>
        <h2 style={{ marginBottom: '0.5rem', fontSize: 'clamp(1.2rem, 4vw, 1.8rem)' }}>🚀 Initialize Project Loop</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
          Deploy Meaven Intelligence. Define the portfolio and execution stakeholders.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Project Name</label>
              <input type="text" placeholder="e.g. Galaxy Tech Park" value={projectData.name} onChange={(e) => setProjectData({...projectData, name: e.target.value})} style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: '#fff', fontSize: '0.9rem' }} required />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Portfolio / Client</label>
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
                    style={{ background: 'var(--bg-accent)', border: '1px solid var(--accent-color)', borderRadius: '8px', padding: '0.75rem', color: '#fff', fontSize: '0.9rem' }} 
                    required 
                  />
              ) : (
                  <select value={projectData.portfolioId} onChange={(e) => setProjectData({...projectData, portfolioId: e.target.value})} style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: '#fff', fontSize: '0.9rem' }} required>
                    <option value="">Select Portfolio...</option>
                    {portfolios.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Project Location</label>
            <input type="text" placeholder="e.g. Bangalore, Whitefield" value={projectData.location} onChange={(e) => setProjectData({...projectData, location: e.target.value})} style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: '#fff', fontSize: '0.9rem' }} required />
          </div>

          <hr style={{ border: 'none', borderBottom: '1px solid var(--border-color)', margin: '0.2rem 0' }} />
          
          {renderStakeholderFields('pm', 'Project Manager')}
          {renderStakeholderFields('architect', 'Site Architect')}
          {renderStakeholderFields('supervisor', 'Site Supervisor')}

          {errors.general && <p style={{ color: '#ff453a', fontSize: '0.75rem', fontWeight: '800', textAlign: 'center', background: 'rgba(255, 69, 58, 0.1)', padding: '0.5rem', borderRadius: '4px', margin: '0.5rem 0' }}>⚠️ {errors.general}</p>}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            <button type="button" onClick={onClose} className="btn btn-outline" style={{ flex: 1, minWidth: '120px', justifyContent: 'center' }}>Discard</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2, minWidth: '200px', justifyContent: 'center', fontWeight: '900' }}>START EXECUTION LOOP</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewProjectModal
