import { useState } from 'react'

const NewPortfolioModal = ({ isOpen, onClose, onCreate }) => {
  const [errors, setErrors] = useState({})
  const [data, setData] = useState({
    name: '',
    pocName: '',
    pocEmail: '',
    pocPhone: '',
    supervisorEmail: '',
    customPin: ''
  })

  if (!isOpen) return null

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const validatePhone = (phone) => /^\d{10}$/.test(phone)

  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = {}

    if (!data.name.trim()) newErrors.name = 'Company name is required'
    if (!data.pocName.trim()) newErrors.pocName = 'POC Name is required'
    
    // POC Validation (One of Email or Phone)
    const hasEmail = data.pocEmail.trim().length > 0
    const hasPhone = data.pocPhone.trim().length > 0
    if (!hasEmail && !hasPhone) {
        newErrors.pocContact = 'Either POC Email or Phone is mandatory'
    } else {
        if (hasEmail && !validateEmail(data.pocEmail)) newErrors.pocEmail = 'Invalid email format'
        if (hasPhone && !validatePhone(data.pocPhone)) newErrors.pocPhone = 'Phone must be 10 digits'
    }

    // Supervisor Validation
    if (!data.supervisorEmail.trim()) {
        newErrors.supervisorEmail = 'Supervisor Email is required'
    } else if (!validateEmail(data.supervisorEmail)) {
        newErrors.supervisorEmail = 'Invalid email format'
    }

    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        return
    }

    const accessKey = data.name.toLowerCase().replace(/\s+/g, '-') + '-' + Math.floor(1000 + Math.random() * 9000)
    const clientPin = data.customPin && data.customPin.length === 4 ? data.customPin : Math.floor(1000 + Math.random() * 9000).toString()

    onCreate({
        ...data,
        id: Date.now(),
        accessKey,
        clientPin,
        stakeholders: [
            { name: data.pocName, email: data.pocEmail, phone: data.pocPhone, role: 'Point of Contact' },
            { name: 'Site Supervisor', email: data.supervisorEmail, role: 'Supervisor' }
        ]
    })
    onClose()
    setData({ name: '', pocName: '', pocEmail: '', pocPhone: '', supervisorEmail: '', customPin: '' })
    setErrors({})
  }

  return (
    <div style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5000 
    }}>
      <div className="card animate-fade-in" style={{ width: 'clamp(300px, 95%, 440px)', padding: '2rem', border: '1px solid var(--accent-color)', borderRadius: '12px' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>🏢 Create New Portfolio</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Define the organizational loop for a new client partnership.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Company / Client Name</label>
            <input 
                type="text" 
                placeholder="e.g. Acme Corp" 
                value={data.name} 
                onChange={(e) => setData({...data, name: e.target.value})} 
                style={{ background: 'var(--bg-accent)', border: errors.name ? '1px solid #ff453a' : '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: '#fff' }} 
            />
            {errors.name && <span style={{ fontSize: '0.65rem', color: '#ff453a' }}>{errors.name}</span>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Primary Point of Contact</label>
            <input 
                type="text" 
                placeholder="POC Full Name" 
                value={data.pocName} 
                onChange={(e) => setData({...data, pocName: e.target.value})} 
                style={{ background: 'var(--bg-accent)', border: errors.pocName ? '1px solid #ff453a' : '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: '#fff' }} 
            />
            {errors.pocName && <span style={{ fontSize: '0.65rem', color: '#ff453a' }}>{errors.pocName}</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>POC Email</label>
                <input 
                    type="email" 
                    placeholder="poc@client.com" 
                    value={data.pocEmail} 
                    onChange={(e) => setData({...data, pocEmail: e.target.value})} 
                    style={{ background: 'var(--bg-accent)', border: errors.pocEmail || errors.pocContact ? '1px solid #ff453a' : '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: '#fff' }} 
                />
                {errors.pocEmail && <span style={{ fontSize: '0.65rem', color: '#ff453a' }}>{errors.pocEmail}</span>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>POC Contact Number</label>
                <input 
                    type="tel" 
                    placeholder="10-digit Phone" 
                    value={data.pocPhone} 
                    onChange={(e) => setData({...data, pocPhone: e.target.value})} 
                    style={{ background: 'var(--bg-accent)', border: errors.pocPhone || errors.pocContact ? '1px solid #ff453a' : '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: '#fff' }} 
                />
                {errors.pocPhone && <span style={{ fontSize: '0.65rem', color: '#ff453a' }}>{errors.pocPhone}</span>}
            </div>
          </div>
          {errors.pocContact && <p style={{ fontSize: '0.65rem', color: '#ff453a', margin: 0 }}>{errors.pocContact}</p>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Supervisor Email ID</label>
            <input 
                type="email" 
                placeholder="supervisor@client.com" 
                value={data.supervisorEmail} 
                onChange={(e) => setData({...data, supervisorEmail: e.target.value})} 
                style={{ background: 'var(--bg-accent)', border: errors.supervisorEmail ? '1px solid #ff453a' : '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: '#fff' }} 
            />
            {errors.supervisorEmail && <span style={{ fontSize: '0.65rem', color: '#ff453a' }}>{errors.supervisorEmail}</span>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Custom Security PIN (Optional)</label>
            <input 
                type="text" 
                placeholder="4-digit PIN (e.g. 1234)" 
                maxLength="4"
                value={data.customPin} 
                onChange={(e) => setData({...data, customPin: e.target.value.replace(/\D/g, '')})} 
                style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: '#fff', fontSize: '1.2rem', letterSpacing: '0.2em' }} 
            />
            <p style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Leave blank to auto-generate.</p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', fontWeight: '800' }}>CREATE PORTFOLIO</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewPortfolioModal
