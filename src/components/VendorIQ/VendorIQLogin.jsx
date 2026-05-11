import { useState } from 'react'

const VendorIQLogin = ({ onLogin }) => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        
        try {
            const success = await onLogin(email, password)
            if (!success) setError('Invalid credentials for VendorIQ access.')
        } catch (err) {
            setError('Authentication failed. Please check your connection.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="viq-login-page" style={containerStyle}>
            <div className="animate-slide-up" style={cardStyle}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', marginBottom: '1.2rem' }}>
                        <span style={{ fontSize: '2rem' }}>🧠</span>
                        <h1 style={{ fontSize: '2.2rem', fontWeight: '900', color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>Vendor<span style={{ color: '#FFB800' }}>IQ</span></h1>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: '700' }}>
                        Intelligence for Fit-Out Professionals
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
                    <div className="input-group">
                        <label style={labelStyle}>Corporate Email</label>
                        <input 
                            required
                            type="email"
                            style={inputStyle}
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="name@company.com"
                        />
                    </div>
                    <div className="input-group">
                        <label style={labelStyle}>Secure Password</label>
                        <input 
                            required
                            type="password"
                            style={inputStyle}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div style={{ padding: '1rem', background: 'rgba(255,69,58,0.1)', color: '#ff453a', borderRadius: '8px', fontSize: '0.8rem', textAlign: 'center', border: '1px solid rgba(255,69,58,0.2)' }}>
                            {error}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="viq-btn-primary"
                        style={{ padding: '1.1rem', fontSize: '1rem', fontWeight: '900', borderRadius: '10px', marginTop: '1rem' }}
                    >
                        {loading ? 'AUTHORIZING...' : 'INITIALIZE SESSION'}
                    </button>
                </form>

                <div style={{ marginTop: '3rem', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2rem' }}>
                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', lineHeight: '1.6' }}>
                        Restricted Access Area.<br/>
                        Subscription verification required.
                    </p>
                </div>
            </div>
        </div>
    )
}

const containerStyle = {
    height: '100vh',
    width: '100vw',
    background: '#0A0E14',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem'
}

const cardStyle = {
    width: '100%',
    maxWidth: '440px',
    background: '#121820',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '28px',
    padding: '3.5rem',
    boxShadow: '0 50px 120px rgba(0,0,0,0.5)'
}

const labelStyle = {
    fontSize: '0.65rem',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    fontWeight: '800',
    marginBottom: '0.8rem',
    display: 'block'
}

const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    padding: '1rem',
    color: '#fff',
    fontSize: '1rem',
    outline: 'none',
    transition: 'all 0.3s ease'
}

export default VendorIQLogin
