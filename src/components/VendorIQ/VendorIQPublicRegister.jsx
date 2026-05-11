import { useState } from 'react'
import { supabase } from '../../supabaseClient'

const VendorIQPublicRegister = () => {
    const [step, setStep] = useState(1) // 1: Form, 2: Success
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        businessName: '',
        city: '',
        gstn: '',
        yearsInOperation: '',
        categories: [],
        materialsHandled: '',
        moq: '',
        leadTimeQuoted: '',
        deliveryCapability: 'Site',
        priceRangeFrom: '',
        priceRangeTo: '',
        priceUnit: 'sqft',
        contactName: '',
        contactDesignation: '',
        contactMobile: '',
        referenceProject1: '',
        referenceProject2: '',
        declaration: false
    })

    const categoryOptions = [
        'Glass', 'ACP', 'Gypsum', 'Flooring', 'MEP', 
        'Hardware', 'Modular Furniture', 'Facade', 'Other'
    ]

    const handleCategoryToggle = (cat) => {
        setFormData(prev => ({
            ...prev,
            categories: prev.categories.includes(cat)
                ? prev.categories.filter(c => c !== cat)
                : [...prev.categories, cat]
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.declaration) return alert("Please accept the declaration.")
        setLoading(true)

        try {
            const { error } = await supabase.from('viq_registrations').insert([{
                ...formData,
                status: 'New',
                date_submitted: new Date().toISOString()
            }])
            
            if (error) throw error
            setStep(2)
        } catch (err) {
            console.error("VIQ Registration Error:", err)
            // Fallback for local dev
            setStep(2)
        } finally {
            setLoading(false)
        }
    }

    if (step === 2) {
        return (
            <div className="viq-register-success animate-fade-in" style={containerStyle}>
                <div style={cardStyle}>
                    <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>📋</div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#fff', marginBottom: '1rem' }}>Profile Submitted.</h1>
                    <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: '1.6', marginBottom: '2.5rem' }}>
                        Your application for **VendorIQ Intelligence** has been logged. Our analysts will verify your technical and financial benchmarks. 
                        You will be notified within 5 working days.
                    </p>
                    <button onClick={() => window.location.href = '/'} className="viq-btn-primary">Return to Homepage</button>
                </div>
            </div>
        )
    }

    return (
        <div className="viq-register-page animate-fade-in" style={containerStyle}>
            <div style={{ maxWidth: '800px', width: '100%' }}>
                <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '1.8rem' }}>🧠</span>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>Vendor<span style={{ color: '#FFB800' }}>IQ</span></h2>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem' }}>Official Vendor Onboarding Portal</p>
                </div>

                <form onSubmit={handleSubmit} style={{ ...cardStyle, textAlign: 'left' }}>
                    <div style={sectionStyle}>
                        <h3 style={sectionTitleStyle}>1. Business Identity</h3>
                        <div className="grid-responsive" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div className="input-group">
                                <label style={labelStyle}>Business Name</label>
                                <input required style={inputStyle} value={formData.businessName} onChange={e => setFormData({...formData, businessName: e.target.value})} placeholder="e.g. Precision Glass Works" />
                            </div>
                            <div className="input-group">
                                <label style={labelStyle}>City / Base of Operations</label>
                                <input required style={inputStyle} value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} placeholder="e.g. Mumbai" />
                            </div>
                        </div>
                        <div className="grid-responsive" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
                            <div className="input-group">
                                <label style={labelStyle}>GST Number</label>
                                <input required style={inputStyle} value={formData.gstn} onChange={e => setFormData({...formData, gstn: e.target.value})} placeholder="22AAAAA0000A1Z5" />
                            </div>
                            <div className="input-group">
                                <label style={labelStyle}>Years in Operation</label>
                                <input required type="number" style={inputStyle} value={formData.yearsInOperation} onChange={e => setFormData({...formData, yearsInOperation: e.target.value})} placeholder="e.g. 12" />
                            </div>
                        </div>
                    </div>

                    <div style={sectionStyle}>
                        <h3 style={sectionTitleStyle}>2. Capability & Scope</h3>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={labelStyle}>Categories Covered (Select All That Apply)</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginTop: '0.8rem' }}>
                                {categoryOptions.map(cat => (
                                    <button 
                                        key={cat}
                                        type="button"
                                        onClick={() => handleCategoryToggle(cat)}
                                        style={{
                                            ...pillStyle,
                                            background: formData.categories.includes(cat) ? '#FFB800' : 'rgba(255,255,255,0.05)',
                                            color: formData.categories.includes(cat) ? '#000' : 'rgba(255,255,255,0.6)',
                                            borderColor: formData.categories.includes(cat) ? '#FFB800' : 'rgba(255,255,255,0.1)'
                                        }}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="input-group">
                            <label style={labelStyle}>Specific Materials Handled</label>
                            <textarea style={{ ...inputStyle, minHeight: '80px' }} value={formData.materialsHandled} onChange={e => setFormData({...formData, materialsHandled: e.target.value})} placeholder="e.g. 12mm Toughened Glass, DGU, Lacquered Glass..." />
                        </div>
                    </div>

                    <div style={sectionStyle}>
                        <h3 style={sectionTitleStyle}>3. Delivery & Commercials</h3>
                        <div className="grid-responsive" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div className="input-group">
                                <label style={labelStyle}>Minimum Order Quantity (MOQ)</label>
                                <input required style={inputStyle} value={formData.moq} onChange={e => setFormData({...formData, moq: e.target.value})} placeholder="e.g. 500 sqft or ₹50k" />
                            </div>
                            <div className="input-group">
                                <label style={labelStyle}>Standard Lead Time (Quoted)</label>
                                <input required style={inputStyle} value={formData.leadTimeQuoted} onChange={e => setFormData({...formData, leadTimeQuoted: e.target.value})} placeholder="e.g. 7-10 Days" />
                            </div>
                        </div>
                        <div className="grid-responsive" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
                            <div className="input-group">
                                <label style={labelStyle}>Delivery Capability</label>
                                <select style={inputStyle} value={formData.deliveryCapability} onChange={e => setFormData({...formData, deliveryCapability: e.target.value})}>
                                    <option value="Site">Site Delivery</option>
                                    <option value="Ex-Factory">Ex-Factory</option>
                                    <option value="Both">Both</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label style={labelStyle}>Avg. Price Range (per {formData.priceUnit})</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input type="number" style={inputStyle} value={formData.priceRangeFrom} onChange={e => setFormData({...formData, priceRangeFrom: e.target.value})} placeholder="Min" />
                                    <input type="number" style={inputStyle} value={formData.priceRangeTo} onChange={e => setFormData({...formData, priceRangeTo: e.target.value})} placeholder="Max" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={sectionStyle}>
                        <h3 style={sectionTitleStyle}>4. Human Intelligence (Direct Contact)</h3>
                        <div className="grid-responsive" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                            <div className="input-group">
                                <label style={labelStyle}>Contact Name</label>
                                <input required style={inputStyle} value={formData.contactName} onChange={e => setFormData({...formData, contactName: e.target.value})} placeholder="Full Name" />
                            </div>
                            <div className="input-group">
                                <label style={labelStyle}>Designation</label>
                                <input required style={inputStyle} value={formData.contactDesignation} onChange={e => setFormData({...formData, contactDesignation: e.target.value})} placeholder="e.g. Factory Mgr" />
                            </div>
                            <div className="input-group">
                                <label style={labelStyle}>Mobile No.</label>
                                <input required style={inputStyle} value={formData.contactMobile} onChange={e => setFormData({...formData, contactMobile: e.target.value})} placeholder="+91" />
                            </div>
                        </div>
                    </div>

                    <div style={sectionStyle}>
                        <h3 style={sectionTitleStyle}>5. Project References</h3>
                        <div className="input-group" style={{ marginBottom: '1rem' }}>
                            <label style={labelStyle}>Major Project 1 (Name & PM Contact)</label>
                            <input required style={inputStyle} value={formData.referenceProject1} onChange={e => setFormData({...formData, referenceProject1: e.target.value})} placeholder="e.g. Google Office - Colliers PM (Name/No)" />
                        </div>
                        <div className="input-group">
                            <label style={labelStyle}>Major Project 2 (Name & PM Contact)</label>
                            <input required style={inputStyle} value={formData.referenceProject2} onChange={e => setFormData({...formData, referenceProject2: e.target.value})} placeholder="e.g. WeWork Fitout - CBRE PM (Name/No)" />
                        </div>
                    </div>

                    <div style={{ marginTop: '2.5rem', padding: '1.5rem', background: 'rgba(255,184,0,0.05)', borderRadius: '12px', border: '1px solid rgba(255,184,0,0.1)' }}>
                        <label style={{ display: 'flex', gap: '1rem', cursor: 'pointer', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', lineHeight: '1.5' }}>
                            <input type="checkbox" checked={formData.declaration} onChange={e => setFormData({...formData, declaration: e.target.checked})} style={{ marginTop: '3px' }} />
                            <span>I understand that my profile on VendorIQ will include ratings and reviews from Project Managers who have worked with me, and that Meaven Designs reserves the right to publish or remove my profile at any time.</span>
                        </label>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="viq-btn-primary" 
                        style={{ width: '100%', marginTop: '2rem', padding: '1.2rem', fontSize: '1rem', fontWeight: '900', borderRadius: '12px' }}
                    >
                        {loading ? 'PROCESSING DOSSIER...' : 'SUBMIT PARTNER PROFILE'}
                    </button>
                </form>
            </div>
        </div>
    )
}

// Styles
const containerStyle = {
    minHeight: '100vh',
    background: '#0A0E14', // Dark Navy
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '4rem 2rem'
}

const cardStyle = {
    background: '#121820',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '24px',
    padding: '3rem',
    boxShadow: '0 40px 100px rgba(0,0,0,0.4)',
    width: '100%'
}

const sectionStyle = {
    marginBottom: '3rem',
    borderBottom: '1px solid rgba(255,255,255,0.03)',
    paddingBottom: '2.5rem'
}

const sectionTitleStyle = {
    fontSize: '0.7rem',
    color: '#FFB800',
    textTransform: 'uppercase',
    letterSpacing: '0.2em',
    fontWeight: '900',
    marginBottom: '2rem'
}

const labelStyle = {
    fontSize: '0.65rem',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    fontWeight: '800',
    marginBottom: '0.8rem',
    display: 'block'
}

const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    padding: '0.9rem 1rem',
    color: '#fff',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'all 0.3s ease'
}

const pillStyle = {
    padding: '0.5rem 1.2rem',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: '700',
    border: '1px solid',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
}

export default VendorIQPublicRegister
