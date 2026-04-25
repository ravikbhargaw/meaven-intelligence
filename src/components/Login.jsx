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
      background: 'var(--bg-primary)' 
    }}>
      <div className="card animate-fade-in" style={{ width: '400px', padding: '3rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src="/images/logo.png" alt="Logo" style={{ height: '40px', marginBottom: '0.5rem' }} />
          <h2 style={{ fontSize: '1.2rem', letterSpacing: '0.3em', color: 'var(--text-secondary)' }}>INTELLIGENCE</h2>
        </div>

        {!showRecovery ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Email Address</label>
                    <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: '#fff' }} 
                        required
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Password</label>
                        <button type="button" onClick={() => setShowRecovery(true)} style={{ background: 'none', border: 'none', color: 'var(--accent-color)', fontSize: '0.7rem', cursor: 'pointer' }}>Forgot Password?</button>
                    </div>
                    <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: '#fff' }} 
                        required
                    />
                </div>

                {error && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', textAlign: 'center' }}>{error}</p>}

                <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>
                    Secure Login
                </button>
            </form>
        ) : (
            <form onSubmit={handleRecovery} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    <p style={{ fontWeight: '700' }}>Master Recovery Access</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Enter your 6-digit Super Admin recovery key to bypass authentication.</p>
                </div>
                
                <input 
                    type="password" 
                    placeholder="2 X X X X 5"
                    maxLength="6"
                    value={masterKey}
                    onChange={(e) => setMasterKey(e.target.value)}
                    style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', color: '#fff', textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5em' }} 
                    required
                />

                {error && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', textAlign: 'center' }}>{error}</p>}

                <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>
                    Verify & Recover Access
                </button>
                <button type="button" onClick={() => setShowRecovery(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.8rem', cursor: 'pointer' }}>Cancel</button>
            </form>
        )}

        <p style={{ marginTop: '2rem', fontSize: '0.7rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
          Internal Decision Support System. Unauthorized access is monitored.
        </p>
      </div>
    </div>
  )
}

export default Login
