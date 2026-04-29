import { useState, useEffect } from 'react'

const AccessGateway = ({ onLogin, onClientLogin, onVerifyMasterKey }) => {
  const [mode, setMode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('ops') === '1' || params.get('internal') === '1') return 'select';
    return 'client';
  }) 
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [showRecovery, setShowRecovery] = useState(false)
  const [masterKey, setMasterKey] = useState('')

  const handleInternalSubmit = (e) => {
    e.preventDefault()
    if (!onLogin(email, password)) {
      setError('Invalid email or password')
    }
  }

  const handleClientSubmit = (e) => {
    e.preventDefault()
    if (!onClientLogin(pin)) {
      setError('Invalid Security PIN. Access Denied.')
      setPin('')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleRecovery = (e) => {
    e.preventDefault()
    if (onVerifyMasterKey(masterKey)) {
        setShowRecovery(false)
    } else {
        setError('Invalid Master Recovery Key')
    }
  }

  const bgImage = '/hub_bg.png'

  return (
    <div style={{ ...containerStyle, backgroundImage: `url(${bgImage})` }}>
      {/* Cinematic Overlays */}
      <div style={overlayStyle}></div>
      <div style={grainStyle}></div>
      <div style={glowTopStyle}></div>
      <div style={glowBottomStyle}></div>
      
      <div className="animate-fade-in" style={{ zIndex: 10, width: '100%', display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        {mode === 'select' ? (
          <div style={{ textAlign: 'center', width: '100%', maxWidth: '900px' }}>
            <div style={{ marginBottom: '5rem' }}>
              <img src="/images/logo.png" alt="Logo" style={{ height: '70px', marginBottom: '1.5rem', filter: 'drop-shadow(0 0 20px var(--accent-color))' }} />
              <h2 style={{ fontSize: '1.1rem', letterSpacing: '0.8em', color: 'var(--accent-color)', fontWeight: '900', textTransform: 'uppercase', margin: 0, opacity: 0.9 }}>INTELLIGENCE HUB</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem' }}>
              <div className="glass-card cinematic-hover" onClick={() => setMode('internal')} style={selectionCardStyle}>
                <div style={iconBoxStyle}>🏢</div>
                <h3 style={cardTitleStyle}>Strategic Operations</h3>
                <p style={cardDescStyle}>Authorized access for Meaven team members, operators, and executive leadership.</p>
                <div style={cardFooterStyle}>ENTER COMMAND CENTER →</div>
              </div>

              <div className="glass-card cinematic-hover" onClick={() => setMode('client')} style={{ ...selectionCardStyle, borderColor: 'rgba(50, 215, 75, 0.3)' }}>
                <div style={{ ...iconBoxStyle, background: 'rgba(50, 215, 75, 0.1)', color: '#32D74B' }}>💎</div>
                <h3 style={cardTitleStyle}>Client Experience</h3>
                <p style={cardDescStyle}>Secure portal for project partners and stakeholders to monitor live site loops.</p>
                <div style={{ ...cardFooterStyle, color: '#32D74B' }}>ACCESS PORTFOLIO →</div>
              </div>
            </div>
            <p style={{ marginTop: '6rem', opacity: 0.3, fontSize: '0.7rem', letterSpacing: '0.5em', textTransform: 'uppercase' }}>Meaven Intelligence • Deployment v4.5.2</p>
          </div>
        ) : (
          <div className="card animate-slide-up" style={loginCardStyle}>
            <button 
              onClick={() => { 
                const params = new URLSearchParams(window.location.search);
                if (params.get('ops') === '1' || params.get('internal') === '1') setMode('select'); 
                else setMode('client');
                setError(''); 
                setShowRecovery(false); 
              }} 
              style={backButtonStyle}
            >
              ← BACK
            </button>

            <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
              <img src="/images/logo.png" alt="Logo" style={{ height: '45px', marginBottom: '1rem', filter: mode === 'client' ? 'drop-shadow(0 0 15px #32D74B)' : 'drop-shadow(0 0 15px var(--accent-color))' }} />
              <p style={{ fontSize: '0.7rem', letterSpacing: '0.5em', color: mode === 'client' ? '#32D74B' : 'var(--accent-color)', fontWeight: '900', textTransform: 'uppercase', margin: 0 }}>
                {mode === 'client' ? 'Partner Authorization' : 'Tactical Entry'}
              </p>
            </div>

            {mode === 'internal' && (
              !showRecovery ? (
                <form onSubmit={handleInternalSubmit} style={formStyle}>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>Secure Identifier</label>
                    <input type="email" placeholder="email@meaven.in" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} required />
                  </div>
                  <div style={fieldGroupStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <label style={labelStyle}>Access Key</label>
                      <button type="button" onClick={() => setShowRecovery(true)} style={recoveryLinkStyle}>Recovery Mode</button>
                    </div>
                    <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} required />
                  </div>
                  {error && <p style={errorBoxStyle}>{error}</p>}
                  <button type="submit" className="btn btn-primary" style={submitButtonStyle}>INITIATE SECURE SESSION</button>
                </form>
              ) : (
                <form onSubmit={handleRecovery} style={formStyle}>
                  <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    <p style={{ fontWeight: '900', color: 'var(--accent-color)', letterSpacing: '0.2em' }}>MASTER RECOVERY</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>Biometric verification required for administrative override.</p>
                  </div>
                  <input type="password" placeholder="0 0 0 0 0 0" maxLength="6" value={masterKey} onChange={(e) => setMasterKey(e.target.value)} style={masterInputStyle} required />
                  {error && <p style={errorBoxStyle}>{error}</p>}
                  <button type="submit" className="btn btn-primary" style={submitButtonStyle}>EXECUTE MASTER BYPASS</button>
                  <button type="button" onClick={() => setShowRecovery(false)} style={recoveryLinkStyle}>Return to Standard Login</button>
                </form>
              )
            )}

            {mode === 'client' && (
              <form onSubmit={handleClientSubmit} style={formStyle}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '0.8rem', color: '#fff' }}>Access Portal</h2>
                  <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>Enter your project security PIN to initialize your live site intelligence loop.</p>
                </div>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="password" maxLength="4" value={pin} 
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} 
                    placeholder="• • • •"
                    style={pinInputStyle(error)} autoFocus required 
                  />
                  {error && <p style={{ ...errorBoxStyle, marginTop: '1.5rem' }}>{error}</p>}
                </div>
                <button type="submit" className="btn btn-primary" style={clientButtonStyle}>AUTHORIZE ACCESS 🛡️</button>
                <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', opacity: 0.6 }}>Lost your PIN? Contact your Relationship Manager.</p>
                  <div onClick={() => setMode('internal')} style={stealthStyle}>Operator Command Node 0.1</div>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Styles
const containerStyle = { height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', overflow: 'hidden' }
const overlayStyle = { position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, rgba(0,0,0,0.4) 0%, #000 100%)', zIndex: 1 }
const grainStyle = { position: 'absolute', inset: 0, backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")', opacity: 0.05, pointerEvents: 'none', zIndex: 2 }
const glowTopStyle = { position: 'absolute', width: '600px', height: '600px', background: 'var(--accent-color)', opacity: 0.07, filter: 'blur(100px)', borderRadius: '50%', top: '-200px', left: '-200px', zIndex: 3 }
const glowBottomStyle = { position: 'absolute', width: '400px', height: '400px', background: 'var(--accent-color)', opacity: 0.05, filter: 'blur(80px)', borderRadius: '50%', bottom: '-100px', right: '-100px', zIndex: 3 }

const loginCardStyle = { width: 'clamp(320px, 95%, 480px)', padding: '4rem 3.5rem', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '32px', boxShadow: '0 50px 100px -20px rgba(0,0,0,0.8)', position: 'relative' }
const backButtonStyle = { position: 'absolute', top: '2rem', left: '2rem', background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer', transition: 'color 0.2s' }
const formStyle = { display: 'flex', flexDirection: 'column', gap: '2rem' }
const fieldGroupStyle = { display: 'flex', flexDirection: 'column', gap: '0.8rem' }
const labelStyle = { fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: '700' }
const inputStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1.2rem', color: '#fff', fontSize: '1rem', outline: 'none', transition: 'all 0.3s' }
const recoveryLinkStyle = { background: 'none', border: 'none', color: 'var(--accent-color)', fontSize: '0.7rem', cursor: 'pointer', opacity: 0.8, fontWeight: '600' }
const errorBoxStyle = { color: 'var(--danger)', fontSize: '0.8rem', textAlign: 'center', background: 'rgba(255, 69, 58, 0.1)', padding: '1rem', borderRadius: '12px', fontWeight: '600' }
const submitButtonStyle = { justifyContent: 'center', padding: '1.4rem', fontSize: '1rem', fontWeight: '900', letterSpacing: '0.05em' }
const masterInputStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid var(--accent-color)', borderRadius: '16px', padding: '1.5rem', color: '#fff', fontSize: '2.5rem', textAlign: 'center', letterSpacing: '0.4em', fontWeight: '900', boxShadow: '0 0 30px rgba(102, 178, 194, 0.1)' }

const pinInputStyle = (error) => ({ width: '100%', padding: '1.8rem', background: 'rgba(0,0,0,0.4)', border: error ? '2px solid var(--danger)' : '1px solid rgba(255,255,255,0.2)', borderRadius: '24px', color: '#fff', fontSize: '3rem', textAlign: 'center', letterSpacing: '0.5em', fontWeight: '900', transition: 'all 0.3s', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)' })
const clientButtonStyle = { width: '100%', padding: '1.4rem', justifyContent: 'center', fontSize: '1.1rem', fontWeight: '900', background: '#32D74B', border: 'none', boxShadow: '0 10px 40px rgba(50, 215, 75, 0.3)', color: '#000', borderRadius: '16px', cursor: 'pointer' }
const stealthStyle = { marginTop: '2.5rem', fontSize: '0.55rem', color: 'rgba(255,255,255,0.1)', cursor: 'pointer', userSelect: 'none', letterSpacing: '0.2em' }

const selectionCardStyle = { padding: '5rem 3.5rem', textAlign: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '40px', backdropFilter: 'blur(20px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }
const iconBoxStyle = { width: '90px', height: '90px', borderRadius: '28px', background: 'rgba(102, 178, 194, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', marginBottom: '2.5rem', color: 'var(--accent-color)', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }
const cardTitleStyle = { fontSize: '1.8rem', marginBottom: '1.2rem', fontWeight: '900', color: '#fff' }
const cardDescStyle = { color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem', lineHeight: '1.7', maxWidth: '240px' }
const cardFooterStyle = { marginTop: '3.5rem', fontSize: '0.8rem', fontWeight: '900', letterSpacing: '0.15em', color: 'var(--accent-color)', opacity: 0.9, textTransform: 'uppercase' }

export default AccessGateway

