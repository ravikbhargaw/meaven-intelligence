import { useState } from 'react'

const SecuritySetup = ({ onComplete }) => {
  const [password, setPassword] = useState('')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (pin.length !== 6) {
      setError('PIN must be exactly 6 digits')
      return
    }
    if (pin !== confirmPin) {
      setError('PINs do not match')
      return
    }
    onComplete(password, pin)
  }

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'var(--bg-primary)' 
    }}>
      <div className="card animate-fade-in" style={{ width: 'clamp(300px, 95%, 450px)', padding: 'clamp(1.5rem, 5vw, 3rem)' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>Update Security Credentials</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          As a new user, you must set a secure password and a 6-digit PIN to access sensitive execution data.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>New Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: '#fff' }} 
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>New 6-Digit PIN</label>
            <input 
              type="password" 
              maxLength="6"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••"
              style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: '#fff', textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5em' }} 
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Confirm PIN</label>
            <input 
              type="password" 
              maxLength="6"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••"
              style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: '#fff', textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5em' }} 
              required
            />
          </div>

          {error && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', textAlign: 'center' }}>{error}</p>}

          <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>
            Initialize Security
          </button>
        </form>
      </div>
    </div>
  )
}

export default SecuritySetup
