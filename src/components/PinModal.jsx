import { useState } from 'react'

const PinModal = ({ onVerify, onCancel }) => {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (onVerify(pin)) {
      setPin('')
      setError(false)
    } else {
      setError(true)
      setPin('')
    }
  }

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, left: 0, right: 0, bottom: 0, 
      background: 'rgba(0,0,0,0.85)', 
      backdropFilter: 'blur(10px)',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      zIndex: 10000,
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div className="card animate-fade-in" style={{ width: '350px', padding: '2.5rem', textAlign: 'center' }}>
        <h3 style={{ marginBottom: '1rem' }}>Enter Security PIN</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '2rem' }}>
          Accessing internal cost data requires a 6-digit PIN.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <input 
            type="password" 
            maxLength="6"
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            placeholder="••••••"
            style={{ 
              background: 'var(--bg-accent)', 
              border: error ? '1px solid var(--danger)' : '1px solid var(--border-color)', 
              borderRadius: '8px', 
              padding: '1rem', 
              color: '#fff', 
              textAlign: 'center', 
              fontSize: '2rem', 
              letterSpacing: '0.4em' 
            }} 
          />
          
          {error && <p style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>Incorrect PIN. Please try again.</p>}

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="button" onClick={onCancel} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
              Verify
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PinModal
