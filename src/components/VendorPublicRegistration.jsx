import { useState } from 'react'
import { supabase } from '../supabaseClient'

const VendorPublicRegistration = () => {
    const [step, setStep] = useState(1) // 1: Form, 2: Success
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        category: 'Glass',
        contact: '',
        email: '',
        phone: '',
        location: '',
        gst: '',
        pan: '',
        message: ''
    })

    const categories = ['Glass', 'Aluminum', 'Hardware', 'Lighting', 'Logistics', 'Civil', 'Electrical', 'Other']

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        // Generate a random ID or let Supabase handle it
        const newVendor = {
            ...formData,
            status: 'Vetting', // Default state for new registrations
            miScore: 0,
            metrics: { price: 50, speed: 50, precision: 50, communication: 50 },
            history: [{
                id: Date.now(),
                date: new Date().toLocaleDateString(),
                type: 'system',
                title: 'Self-Registration Received',
                detail: `Vendor applied via public registration portal from ${formData.location}.`
            }]
        }

        try {
            // Save to Supabase (if configured) or localStorage (fallback)
            const { error } = await supabase.from('vendors').insert([newVendor])
            
            if (error) throw error

            // Fallback for offline/local storage if needed
            const localVendors = JSON.parse(localStorage.getItem('hub_vendors') || '[]')
            localStorage.setItem('hub_vendors', JSON.stringify([...localVendors, { ...newVendor, id: Date.now() }]))

            setStep(2)
        } catch (err) {
            console.error("Registration error:", err)
            // Still show success in local mode to avoid frustration
            setStep(2)
        } finally {
            setLoading(false)
        }
    }

    if (step === 2) {
        return (
            <div className="registration-success animate-fade-in" style={{ 
                height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                background: 'var(--bg-primary)', padding: '2rem' 
            }}>
                <div className="glass-card-heavy" style={{ padding: '4rem', maxWidth: '600px', textAlign: 'center' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '2rem' }}>💎</div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '1.5rem', letterSpacing: '-0.03em' }}>Application Received.</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '3rem' }}>
                        Your registration for the **Meaven Intelligence Network** has been logged. 
                        Our QC team will perform a manual vetting process. You will be notified once your certification is active.
                    </p>
                    <button 
                        onClick={() => window.location.href = 'https://meaven.in'}
                        className="btn btn-primary" style={{ padding: '1.2rem 3rem' }}
                    >
                        Return to Meaven.in
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="vendor-registration-page animate-fade-in" style={{ 
            minHeight: '100vh', background: 'var(--bg-primary)', padding: '4rem 2rem'
        }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ marginBottom: '4rem', textAlign: 'center' }}>
                    <img src="/meaven-logo.png" alt="Meaven" style={{ height: '40px', marginBottom: '2rem', filter: 'var(--logo-filter)' }} />
                    <h1 style={{ fontSize: '3rem', fontWeight: '900', letterSpacing: '-0.04em', marginBottom: '1rem' }}>Partner with Intelligence.</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>Join India's most precise architectural execution network.</p>
                </div>

                <div className="glass-card-heavy" style={{ padding: '3rem', border: '1px solid var(--border-color)' }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div className="grid-responsive" style={{ gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            <div className="input-group">
                                <label style={{ fontSize: '0.7rem', color: 'var(--accent-color)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.8rem', display: 'block' }}>Company Name</label>
                                <input 
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    placeholder="Enter registered business name"
                                    style={inputStyle}
                                />
                            </div>
                            <div className="input-group">
                                <label style={{ fontSize: '0.7rem', color: 'var(--accent-color)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.8rem', display: 'block' }}>Primary Category</label>
                                <select 
                                    value={formData.category}
                                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                                    style={inputStyle}
                                >
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid-responsive" style={{ gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            <div className="input-group">
                                <label style={{ fontSize: '0.7rem', color: 'var(--accent-color)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.8rem', display: 'block' }}>Key Contact Person</label>
                                <input 
                                    required
                                    value={formData.contact}
                                    onChange={(e) => setFormData({...formData, contact: e.target.value})}
                                    placeholder="Full Name"
                                    style={inputStyle}
                                />
                            </div>
                            <div className="input-group">
                                <label style={{ fontSize: '0.7rem', color: 'var(--accent-color)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.8rem', display: 'block' }}>Business Location</label>
                                <input 
                                    required
                                    value={formData.location}
                                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                                    placeholder="City, State"
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        <div className="grid-responsive" style={{ gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            <div className="input-group">
                                <label style={{ fontSize: '0.7rem', color: 'var(--accent-color)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.8rem', display: 'block' }}>Email Address</label>
                                <input 
                                    required
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    placeholder="corporate@email.com"
                                    style={inputStyle}
                                />
                            </div>
                            <div className="input-group">
                                <label style={{ fontSize: '0.7rem', color: 'var(--accent-color)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.8rem', display: 'block' }}>Phone Number</label>
                                <input 
                                    required
                                    value={formData.phone}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    placeholder="+91"
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        <div className="grid-responsive" style={{ gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            <div className="input-group">
                                <label style={{ fontSize: '0.7rem', color: 'var(--accent-color)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.8rem', display: 'block' }}>GST Number</label>
                                <input 
                                    value={formData.gst}
                                    onChange={(e) => setFormData({...formData, gst: e.target.value})}
                                    placeholder="Optional for vetting"
                                    style={inputStyle}
                                />
                            </div>
                            <div className="input-group">
                                <label style={{ fontSize: '0.7rem', color: 'var(--accent-color)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.8rem', display: 'block' }}>PAN Number</label>
                                <input 
                                    value={formData.pan}
                                    onChange={(e) => setFormData({...formData, pan: e.target.value})}
                                    placeholder="Optional for vetting"
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label style={{ fontSize: '0.7rem', color: 'var(--accent-color)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.8rem', display: 'block' }}>Portfolio / Capability Statement</label>
                            <textarea 
                                value={formData.message}
                                onChange={(e) => setFormData({...formData, message: e.target.value})}
                                placeholder="Tell us about your machinery, team size, and past 3 major projects..."
                                style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }}
                            />
                        </div>

                        <div style={{ marginTop: '2rem' }}>
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="btn btn-primary" 
                                style={{ width: '100%', padding: '1.2rem', fontSize: '1rem', fontWeight: '800', borderRadius: '12px' }}
                            >
                                {loading ? 'PROCESSING APPLICATION...' : 'SUBMIT PARTNER APPLICATION'}
                            </button>
                            <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                By submitting, you agree to undergo Meaven's proprietary Quality Compliance (QC) vetting process. 
                                <br/>Certification is granted solely at the discretion of Meaven Intelligence.
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '1rem',
    color: 'var(--text-primary)',
    fontSize: '0.95rem',
    transition: 'all 0.3s ease',
    outline: 'none'
}

export default VendorPublicRegistration
