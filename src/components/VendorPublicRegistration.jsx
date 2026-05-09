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
        bankName: '',
        accountName: '',
        ifscCode: '',
        accountNumber: '',
        message: ''
    })

    const [docs, setDocs] = useState({
        panCard: null,
        gstReg: null,
        cancelledCheque: null
    })

    const categories = ['Glass', 'Aluminum', 'Hardware', 'Lighting', 'Logistics', 'Civil', 'Electrical', 'Other']

    const handleFileChange = (e, key) => {
        const file = e.target.files[0]
        if (file) {
            setDocs(prev => ({ ...prev, [key]: file }))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        const newVendor = {
            ...formData,
            status: 'Vetting',
            miScore: 0,
            metrics: { price: 50, speed: 50, precision: 50, communication: 50 },
            documents: Object.entries(docs).filter(([_, file]) => file).map(([key, file]) => ({
                id: Date.now() + Math.random(),
                name: file.name,
                type: key,
                date: new Date().toLocaleDateString()
            })),
            history: [{
                id: Date.now(),
                date: new Date().toLocaleDateString(),
                type: 'system',
                title: 'Public Self-Registration',
                detail: `Compliance docs and bank details submitted from ${formData.location}.`
            }]
        }

        try {
            const { error } = await supabase.from('vendors').insert([newVendor])
            if (error) throw error

            const localVendors = JSON.parse(localStorage.getItem('hub_vendors') || '[]')
            localStorage.setItem('hub_vendors', JSON.stringify([...localVendors, { ...newVendor, id: Date.now() }]))

            setStep(2)
        } catch (err) {
            console.error("Registration error:", err)
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
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '1.5rem', letterSpacing: '-0.03em' }}>Application Logged.</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '3rem' }}>
                        Your registration for the **Meaven Intelligence Network** is being processed. 
                        Our compliance team will verify your **GST, PAN, and Bank details**. You will be notified once certification is active.
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
            <div style={{ maxWidth: '850px', margin: '0 auto' }}>
                <div style={{ marginBottom: '4rem', textAlign: 'center' }}>
                    <img src="/images/logo.png" alt="Meaven" style={{ height: '40px', marginBottom: '2rem', filter: 'var(--logo-filter)' }} />
                    <h1 style={{ fontSize: '3rem', fontWeight: '900', letterSpacing: '-0.04em', marginBottom: '1rem' }}>Partner Authorization.</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>Complete your technical and financial onboarding.</p>
                </div>

                <div className="glass-card-heavy" style={{ padding: '3rem', border: '1px solid var(--border-color)' }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                        
                        <section>
                            <h3 style={sectionTitleStyle}>1. Business Identity</h3>
                            <div className="grid-responsive" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div className="input-group">
                                    <label style={labelStyle}>Company Name</label>
                                    <input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Registered Name" style={inputStyle} />
                                </div>
                                <div className="input-group">
                                    <label style={labelStyle}>Primary Category</label>
                                    <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} style={inputStyle}>
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h3 style={sectionTitleStyle}>2. Compliance & Tax</h3>
                            <div className="grid-responsive" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div className="input-group">
                                    <label style={labelStyle}>GST Number (Mandatory)</label>
                                    <input required value={formData.gst} onChange={(e) => setFormData({...formData, gst: e.target.value})} placeholder="22AAAAA0000A1Z5" style={inputStyle} />
                                </div>
                                <div className="input-group">
                                    <label style={labelStyle}>PAN Number (Mandatory)</label>
                                    <input required value={formData.pan} onChange={(e) => setFormData({...formData, pan: e.target.value})} placeholder="ABCDE1234F" style={inputStyle} />
                                </div>
                            </div>
                        </section>

                        <section>
                            <h3 style={sectionTitleStyle}>3. Banking Details</h3>
                            <div className="grid-responsive" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                <div className="input-group">
                                    <label style={labelStyle}>Bank Name</label>
                                    <input required value={formData.bankName} onChange={(e) => setFormData({...formData, bankName: e.target.value})} placeholder="e.g. HDFC Bank" style={inputStyle} />
                                </div>
                                <div className="input-group">
                                    <label style={labelStyle}>Account Holder Name</label>
                                    <input required value={formData.accountName} onChange={(e) => setFormData({...formData, accountName: e.target.value})} placeholder="As per Bank Records" style={inputStyle} />
                                </div>
                            </div>
                            <div className="grid-responsive" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div className="input-group">
                                    <label style={labelStyle}>Account Number</label>
                                    <input required value={formData.accountNumber} onChange={(e) => setFormData({...formData, accountNumber: e.target.value})} placeholder="000000000000" style={inputStyle} />
                                </div>
                                <div className="input-group">
                                    <label style={labelStyle}>IFSC Code</label>
                                    <input required value={formData.ifscCode} onChange={(e) => setFormData({...formData, ifscCode: e.target.value})} placeholder="HDFC0001234" style={inputStyle} />
                                </div>
                            </div>
                        </section>

                        <section>
                            <h3 style={sectionTitleStyle}>4. Verification Documents</h3>
                            <div className="grid-responsive" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                                <div className="file-input">
                                    <label style={labelStyle}>PAN Card Copy</label>
                                    <input type="file" required onChange={(e) => handleFileChange(e, 'panCard')} style={fileInputStyle} />
                                </div>
                                <div className="file-input">
                                    <label style={labelStyle}>GST Certificate</label>
                                    <input type="file" required onChange={(e) => handleFileChange(e, 'gstReg')} style={fileInputStyle} />
                                </div>
                                <div className="file-input">
                                    <label style={labelStyle}>Cancelled Cheque</label>
                                    <input type="file" required onChange={(e) => handleFileChange(e, 'cancelledCheque')} style={fileInputStyle} />
                                </div>
                            </div>
                        </section>

                        <div className="input-group">
                            <label style={labelStyle}>Contact Information (Key Person & Mobile)</label>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <input required value={formData.contact} onChange={(e) => setFormData({...formData, contact: e.target.value})} placeholder="Contact Name" style={inputStyle} />
                                <input required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="Mobile No." style={inputStyle} />
                            </div>
                        </div>

                        <div style={{ marginTop: '2rem' }}>
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="btn btn-primary" 
                                style={{ width: '100%', padding: '1.2rem', fontSize: '1.1rem', fontWeight: '900', borderRadius: '16px', boxShadow: '0 10px 30px rgba(102, 178, 194, 0.2)' }}
                            >
                                {loading ? 'UPLOADING LEDGER...' : 'SUBMIT FOR COMPLIANCE REVIEW'}
                            </button>
                            <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                Your data is protected by Meaven's Enterprise-Grade Security. 
                                <br/>Incomplete or fraudulent applications will be automatically blacklisted.
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

const sectionTitleStyle = {
    fontSize: '0.8rem',
    color: 'var(--accent-color)',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    marginBottom: '1.5rem',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    paddingBottom: '0.8rem'
}

const labelStyle = { 
    fontSize: '0.65rem', 
    color: 'var(--text-secondary)', 
    fontWeight: '800', 
    textTransform: 'uppercase', 
    marginBottom: '0.6rem', 
    display: 'block' 
}

const fileInputStyle = {
    fontSize: '0.7rem',
    color: 'var(--text-secondary)',
    background: 'rgba(255,255,255,0.02)',
    padding: '0.5rem',
    borderRadius: '8px',
    width: '100%'
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
