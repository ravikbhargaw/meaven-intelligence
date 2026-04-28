import { useState } from 'react'

const ClientPortalGate = ({ portfolio, onAuthorize }) => {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  // --- STATE A: PORTAL IS INACTIVE (KILL-SWITCH ENGAGED) ---
  if (!portfolio || !portfolio.isPortalActive) {
    return (
      <div className="portal-gate animate-fade-in" style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', color: 'var(--text-primary)', textAlign: 'center', padding: '2rem' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255, 69, 58, 0.1)', border: '1px solid var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', marginBottom: '2rem', color: 'var(--danger)' }}>🔒</div>
        <h1 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '1rem' }}>Access Link Suspended</h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', lineHeight: '1.6' }}>
            The project intelligence portal for <strong style={{ color: 'var(--text-primary)' }}>{portfolio?.name || 'this client'}</strong> is currently undergoing a scheduled data integrity update. 
            <br/><br/>
            Please contact your Meaven Relationship Manager for live updates.
        </p>
        <div style={{ marginTop: '3rem', fontSize: '0.7rem', color: 'var(--text-secondary)', opacity: 0.5, letterSpacing: '0.4em' }}>MEAVEN INTELLIGENCE • SECURITY PROTOCOL 7.5</div>
      </div>
    )
  }

  // --- STATE B: PORTAL IS ACTIVE (THE GATE) ---
  const handlePinSubmit = (e) => {
    e.preventDefault()
    const targetPin = portfolio.clientPin || '2410'
    if (pin === targetPin) {
      onAuthorize()
    } else {
      setError(true)
      setPin('')
      setTimeout(() => setError(false), 2000)
    }
  }

  return (
    <div className="portal-gate animate-fade-in" style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(102, 178, 194, 0.05) 0%, transparent 70%)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '3.5rem', textAlign: 'center', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}>
        {/* Branded Aura */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, transparent, var(--accent-color), transparent)' }} />
        
        <div style={{ marginBottom: '3rem' }}>
          <img src="/images/logo.png" alt="Meaven" style={{ height: '40px', marginBottom: '1.5rem', filter: 'var(--logo-filter)' }} />
          <p style={{ fontSize: '0.7rem', color: 'var(--accent-color)', letterSpacing: '0.4em', fontWeight: '800', textTransform: 'uppercase', margin: 0 }}>Project Intelligence Portal</p>
        </div>

        <div style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '900', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Welcome, {portfolio.name}</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Please enter your secure 4-digit PIN to initialize your site loop.</p>
        </div>

        <form onSubmit={handlePinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ position: 'relative' }}>
                <input 
                    type="password" 
                    maxLength="4"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="• • • •"
                    style={{ 
                        width: '100%', padding: '1.5rem', background: 'var(--bg-accent)', border: error ? '1px solid var(--danger)' : '1px solid var(--border-color)', 
                        borderRadius: '16px', color: 'var(--text-primary)', fontSize: '2.5rem', textAlign: 'center', letterSpacing: '0.5em', fontWeight: '900',
                        transition: 'all 0.3s'
                    }}
                    autoFocus
                />
                {error && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', fontWeight: '700', marginTop: '1rem' }}>INVALID SECURITY PIN. ACCESS DENIED.</p>}
            </div>

            <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '1.2rem', justifyContent: 'center', fontSize: '1.1rem', fontWeight: '800' }}
            >
                AUTHORIZE ACCESS 🛡️
            </button>
        </form>

        <div style={{ marginTop: '4rem', display: 'flex', justifyContent: 'center', gap: '2rem' }}>
            <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '1.2rem', margin: 0, fontWeight: '900', color: 'var(--text-primary)' }}>{portfolio.projectsCount || '0'}+</p>
                <p style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Active Sites</p>
            </div>
            <div style={{ width: '1px', background: 'var(--border-color)' }} />
            <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '1.2rem', margin: 0, fontWeight: '900', color: 'var(--text-primary)' }}>24/7</p>
                <p style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Live Pulse</p>
            </div>
        </div>
      </div>
    </div>
  )
}

export default ClientPortalGate
