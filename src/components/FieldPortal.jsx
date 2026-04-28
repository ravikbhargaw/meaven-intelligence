import { useState } from 'react'

export default function FieldPortal({ projects, vendors, onSubmitReport, onExit }) {
    const [step, setStep] = useState('auth') // auth, form, success
    const [selectedVendorId, setSelectedVendorId] = useState('')
    const [pin, setPin] = useState('')
    const [selectedProjectId, setSelectedProjectId] = useState('')
    const [issueType, setIssueType] = useState('Readiness Issue')
    const [details, setDetails] = useState('')

    const handleLogin = (e) => {
        e.preventDefault()
        const vendor = vendors.find(v => v.id.toString() === selectedVendorId)
        if (!vendor) {
            alert('Please select a Partner Profile.')
            return
        }

        const expectedPin = vendor.accessPin || '0000' // Legacy fallback

        if (pin === expectedPin) { 
            setStep('form')
        } else {
            alert(`Invalid Access Code for ${vendor.name}. Please try again.`)
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        onSubmitReport({
            projectId: selectedProjectId,
            vendorId: selectedVendorId,
            issueType,
            details,
            date: new Date().toISOString()
        })
        setStep('success')
        setSelectedProjectId('')
        setDetails('')
    }

    const vendorProjects = projects.filter(p => p.assignedVendor && vendors.find(v => v.id.toString() === selectedVendorId)?.name === p.assignedVendor)

    return (
        <div className="animate-fade-in" style={{ minHeight: '100vh', width: '100vw', background: '#0a0a0a', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', fontFamily: 'Inter, sans-serif' }}>
            <div style={{ width: '100%', maxWidth: '400px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '2rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--danger)' }}>MEAVEN SOS</h2>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>FIELD OPERATOR PORTAL</p>
                </div>

                {step === 'auth' && (
                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <select required value={selectedVendorId} onChange={e => setSelectedVendorId(e.target.value)} style={{ padding: '0.8rem', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '6px' }}>
                            <option value="">Select Partner Profile...</option>
                            {vendors.map(v => <option key={v.id} value={v.id.toString()}>{v.name}</option>)}
                        </select>
                        <input required type="password" placeholder="4-Digit Access Code" maxLength="4" value={pin} onChange={e => setPin(e.target.value)} style={{ padding: '0.8rem', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '6px', textAlign: 'center', letterSpacing: '0.5em' }} />
                        <button type="submit" style={{ background: 'var(--accent-color)', color: '#000', padding: '1rem', border: 'none', borderRadius: '6px', fontWeight: '800', cursor: 'pointer', marginTop: '1rem' }}>AUTHENTICATE</button>
                    </form>
                )}

                {step === 'form' && (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {vendorProjects.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--danger)' }}>
                                <p>No active projects assigned to your profile.</p>
                                <button type="button" onClick={() => setStep('auth')} style={{ background: 'none', border: '1px solid #333', color: '#fff', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>Back</button>
                            </div>
                        ) : (
                            <>
                                <select required value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)} style={{ padding: '0.8rem', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '6px' }}>
                                    <option value="">Select Project Site...</option>
                                    {vendorProjects.map(p => <option key={p.id} value={p.id.toString()}>{p.name}</option>)}
                                </select>
                                <select required value={issueType} onChange={e => setIssueType(e.target.value)} style={{ padding: '0.8rem', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '6px' }}>
                                    <option value="Readiness Issue">Site Not Ready (Civil/Wall/Floor)</option>
                                    <option value="Power Failure">Power/Utility Failure</option>
                                    <option value="Material Delay">Material Delivery Delay</option>
                                    <option value="General Update">General Status Update</option>
                                </select>
                                <textarea required placeholder="Enter exact details..." value={details} onChange={e => setDetails(e.target.value)} style={{ padding: '0.8rem', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '6px', minHeight: '100px', resize: 'vertical' }} />
                                <button type="submit" style={{ background: 'var(--danger)', color: '#fff', padding: '1rem', border: 'none', borderRadius: '6px', fontWeight: '800', cursor: 'pointer', marginTop: '1rem' }}>SUBMIT SOS TICKET</button>
                            </>
                        )}
                    </form>
                )}

                {step === 'success' && (
                    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                        <h3 style={{ color: 'var(--success)' }}>Report Transmitted</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>The Command Center has been notified.</p>
                        <button onClick={() => setStep('auth')} style={{ background: 'none', border: '1px solid #333', color: '#fff', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', marginTop: '2rem' }}>Log Another Issue</button>
                    </div>
                )}
            </div>
            
            <button onClick={onExit} style={{ background: 'none', border: 'none', color: '#666', marginTop: '2rem', cursor: 'pointer', fontSize: '0.7rem' }}>Exit Field Portal</button>
        </div>
    )
}
