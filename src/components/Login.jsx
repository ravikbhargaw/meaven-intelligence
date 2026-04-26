import { useState } from 'react'

const Login = ({ onLogin, onVerifyMasterKey }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showRecovery, setShowRecovery] = useState(false)
  const [masterKey, setMasterKey] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!onLogin(email, password)) {
      setError('Invalid email or password')
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

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'radial-gradient(circle at center, #1a1a1a 0%, #000 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* CINEMATIC BACKGROUND ELEMENTS */}
      <div style={{ position: 'absolute', width: '600px', height: '600px', background: 'var(--accent-color)', opacity: 0.05, filter: 'blur(100px)', borderRadius: '50%', top: '-200px', left: '-200px' }}></div>
      <div style={{ position: 'absolute', width: '400px', height: '400px', background: 'var(--accent-color)', opacity: 0.03, filter: 'blur(80px)', borderRadius: '50%', bottom: '-100px', right: '-100px' }}></div>

      <div className="card animate-fade-in" style={{ 
        width: '450px', 
        padding: '4rem 3.5rem', 
        background: 'rgba(255,255,255,0.02)', 
        backdropFilter: 'blur(20px)', 
        border: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <img src="/images/logo.png" alt="Logo" style={{ height: '48px', marginBottom: '0.8rem', filter: 'drop-shadow(0 0 10px var(--accent-color))' }} />
          <h2 style={{ fontSize: '0.8rem', letterSpacing: '0.6em', color: 'var(--accent-color)', fontWeight: '900', textTransform: 'uppercase', margin: 0 }}>INTELLIGENCE</h2>
        </div>

        {!showRecovery ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Secure Identifier</label>
                    <input 
                        type="email" 
                        placeholder="email@meaven.in"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1rem', color: '#fff', outline: 'none', transition: 'border-color 0.3s ease' }} 
                        required
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Access Key</label>
                        <button type="button" onClick={() => setShowRecovery(true)} style={{ background: 'none', border: 'none', color: 'var(--accent-color)', fontSize: '0.7rem', cursor: 'pointer', opacity: 0.8 }}>Recovery Mode</button>
                    </div>
                    <input 
                        type="password" 
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1rem', color: '#fff', outline: 'none', transition: 'border-color 0.3s ease' }} 
                        required
                    />
                </div>

                {error && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', textAlign: 'center', background: 'rgba(255, 69, 58, 0.1)', padding: '0.8rem', borderRadius: '8px' }}>{error}</p>}

                <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center', padding: '1.2rem', fontSize: '1rem', fontWeight: '900', marginTop: '1rem' }}>
                    INITIATE SECURE SESSION
                </button>
            </form>
        ) : (
            <form onSubmit={handleRecovery} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    <p style={{ fontWeight: '900', color: 'var(--accent-color)', letterSpacing: '0.1em' }}>MASTER RECOVERY BYPASS</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>neural link verification required for administrative override.</p>
                </div>
                
                <input 
                    type="password" 
                    placeholder="0 0 0 0 0 0"
                    maxLength="6"
                    value={masterKey}
                    onChange={(e) => setMasterKey(e.target.value)}
                    style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--accent-color)', borderRadius: '12px', padding: '1.5rem', color: '#fff', textAlign: 'center', fontSize: '2rem', letterSpacing: '0.5em', outline: 'none', boxShadow: '0 0 20px rgba(102, 178, 194, 0.1)' }} 
                    required
                />

                {error && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', textAlign: 'center', background: 'rgba(255, 69, 58, 0.1)', padding: '0.8rem', borderRadius: '8px' }}>{error}</p>}

                <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center', padding: '1.2rem', fontWeight: '900' }}>
                    EXECUTE MASTER BYPASS
                </button>
                <button type="button" onClick={() => setShowRecovery(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.8rem', cursor: 'pointer', opacity: 0.6 }}>Return to Standard Login</button>
            </form>
        )}

        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                System: MEAVEN v4.0.2 • Secured by NeuralAuth
            </p>
        </div>
      </div>
    </div>
  )
}

export default Login
