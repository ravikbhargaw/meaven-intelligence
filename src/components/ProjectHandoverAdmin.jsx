import React, { useState } from 'react';
import { createPortal } from 'react-dom';

const ProjectHandoverAdmin = ({ project, onSaveHandover, onClose }) => {
    if (!project) return null;

    // Editable Project Info
    const [clientName, setClientName] = useState(project.clientName || '');
    const [siteAddress, setSiteAddress] = useState(project.address || '');

    // Form Inputs
    const [recipientType, setRecipientType] = useState('Customer');
    const [recipientName, setRecipientName] = useState(project.clientName || '');
    const [recipientDesignation, setRecipientDesignation] = useState('');
    const [recipientCompany, setRecipientCompany] = useState('');
    const [recipientPhone, setRecipientPhone] = useState(project.pocPhone || '');
    const [recipientEmail, setRecipientEmail] = useState(project.pocEmail || '');
    const [internalRemarks, setInternalRemarks] = useState('');

    const [feedbackEnabled, setFeedbackEnabled] = useState(false);
    const [googleReviewEnabled, setGoogleReviewEnabled] = useState(false);
    const [googleReviewUrl, setGoogleReviewUrl] = useState('https://g.page/r/meaven-review');

    // Snag Selection
    const projectSnags = project.snags || [];
    const [selectedSnags, setSelectedSnags] = useState([]);
    const [customObservations, setCustomObservations] = useState([]);
    const [newObsDesc, setNewObsDesc] = useState('');
    const [newObsLocation, setNewObsLocation] = useState('');
    const [newObsPriority, setNewObsPriority] = useState('Medium');

    const [generatedLink, setGeneratedLink] = useState('');
    const [copySuccess, setCopySuccess] = useState(false);

    const toggleSnagSelect = (snag) => {
        if (selectedSnags.some(s => s.id === snag.id)) {
            setSelectedSnags(prev => prev.filter(s => s.id !== snag.id));
        } else {
            setSelectedSnags(prev => [...prev, snag]);
        }
    };

    const handleAddCustomObs = (e) => {
        e.preventDefault();
        if (!newObsDesc.trim()) return;
        const newObs = {
            id: Date.now(),
            description: newObsDesc.trim(),
            location: newObsLocation.trim() || 'Site Area',
            priority: newObsPriority,
            status: 'Pending'
        };
        setCustomObservations(prev => [...prev, newObs]);
        setNewObsDesc('');
        setNewObsLocation('');
    };

    const handleRemoveCustomObs = (id) => {
        setCustomObservations(prev => prev.filter(o => o.id !== id));
    };

    const handleGenerateLink = () => {
        if (!recipientName.trim()) {
            alert('Please enter recipient name.');
            return;
        }

        const token = 'ho_sec_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
        const handoverId = 'HO-' + new Date().getFullYear() + '-' + String(Math.floor(1000 + Math.random() * 9000));
        
        const version = (project.handovers || []).length + 1;

        const newHandover = {
            id: handoverId,
            projectId: String(project.id),
            token: token,
            version: version,
            status: 'SENT',
            clientName: clientName.trim(),
            siteAddress: siteAddress.trim(),
            recipientType,
            recipientName: recipientName.trim(),
            recipientDesignation: recipientDesignation.trim(),
            recipientCompany: recipientCompany.trim(),
            recipientPhone: recipientPhone.trim(),
            recipientEmail: recipientEmail.trim(),
            internalRemarks: internalRemarks.trim(),
            feedbackEnabled,
            googleReviewEnabled,
            googleReviewUrl: googleReviewUrl.trim(),
            selectedSnags,
            customObservations,
            checklistResponses: {
                workInspected: false,
                completedWorkHandedOver: false,
                scopeMaterialsReceived: false,
                installationQcCompleted: false,
                snagsRecorded: false
            },
            signature: null,
            feedbackData: null,
            pdfBase64: null,
            createdAt: new Date().toISOString(),
            sentAt: new Date().toISOString(),
            openedAt: null,
            completedAt: null,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        };

        const base = (window.location.origin + window.location.pathname).replace(/\/$/, '');
        const link = `${base}?view=handover&token=${token}`;

        setGeneratedLink(link);
        
        // Persist to local server API for instant Incognito and cross-tab availability
        try {
            fetch('http://localhost:3001/api/handovers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, project, handover: newHandover })
            }).catch(e => console.warn('Local handover API post error:', e));
        } catch (e) {}

        onSaveHandover(newHandover);
    };

    const handleCopyLink = () => {
        if (!generatedLink) return;
        navigator.clipboard.writeText(generatedLink);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    const handleSendWhatsApp = () => {
        if (!recipientPhone.trim()) {
            alert('Please enter mobile number for WhatsApp delivery.');
            return;
        }
        const text = `Hi ${recipientName}!\n\nThe digital handover process for project *${project.name}* is ready for your review.\n\nPlease complete the handover confirmation here:\n${generatedLink}\n\nIt takes approximately 2 minutes.\n\nRegards,\nMeaven Intelligence`;
        const url = `https://wa.me/${recipientPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    return createPortal(
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            background: 'var(--bg-glass-heavy, rgba(0,0,0,0.85))',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999999,
            padding: '1rem',
            boxSizing: 'border-box'
        }}>
            <div className="card animate-fade-in" style={{
                position: 'relative',
                margin: 'auto',
                width: '100%',
                maxWidth: '720px',
                maxHeight: '88vh',
                overflowY: 'auto',
                background: 'var(--bg-secondary, #0A0A0A)',
                border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
                borderRadius: '16px',
                padding: '1.8rem',
                color: 'var(--text-primary, #ffffff)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9)'
            }}>
                {/* HEADER */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem' }}>
                    <div>
                        <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--accent-color)', fontWeight: '900', letterSpacing: '0.15em' }}>
                            PROJECT CLOSURE & HANDOVER INITIATION
                        </div>
                        <h2 style={{ margin: '0.2rem 0 0 0', fontSize: '1.3rem', fontWeight: '900' }}>
                            {project.name}
                        </h2>
                    </div>
                    <button onClick={onClose} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>✕ Close</button>
                </div>

                {/* PROJECT DETAILS (AUTO-FILLED + EDITABLE CLIENT NAME & ADDRESS) */}
                <div style={{ background: 'var(--bg-accent)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', fontSize: '0.75rem', alignItems: 'center' }}>
                        <div><span style={{ color: 'var(--text-secondary)' }}>Project ID:</span> <strong>{project.id}</strong> (Auto-populated)</div>
                        <div>
                            <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem', textTransform: 'uppercase', fontWeight: '800' }}>Client Name (Editable)</label>
                            <input 
                                type="text" 
                                value={clientName} 
                                onChange={(e) => setClientName(e.target.value)} 
                                placeholder="Enter client name"
                                style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', background: 'var(--bg-primary)', color: '#fff', border: '1px solid var(--border-color)', fontSize: '0.75rem' }}
                            />
                        </div>
                    </div>
                    <div>
                        <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem', textTransform: 'uppercase', fontWeight: '800' }}>Site Address (Editable)</label>
                        <input 
                            type="text" 
                            value={siteAddress} 
                            onChange={(e) => setSiteAddress(e.target.value)} 
                            placeholder="Enter site address"
                            style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', background: 'var(--bg-primary)', color: '#fff', border: '1px solid var(--border-color)', fontSize: '0.75rem' }}
                        />
                    </div>
                </div>

                {/* FORM INPUTS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* RECIPIENT TYPE */}
                    <div>
                        <label style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                            Recipient Role / Type *
                        </label>
                        <select 
                            value={recipientType} 
                            onChange={(e) => setRecipientType(e.target.value)}
                            style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                        >
                            <option value="Customer">Customer</option>
                            <option value="Site Supervisor / Manager / Engineer">Site Supervisor / Manager / Engineer</option>
                            <option value="Architect / Consultant">Architect / Consultant</option>
                            <option value="Interior Designer">Interior Designer</option>
                            <option value="Contractor / Vendor">Contractor / Vendor</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    {/* RECIPIENT NAME & DESIGNATION */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                                Recipient Full Name *
                            </label>
                            <input 
                                type="text" 
                                value={recipientName} 
                                onChange={(e) => setRecipientName(e.target.value)} 
                                placeholder="Enter name"
                                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                                Designation (Optional)
                            </label>
                            <input 
                                type="text" 
                                value={recipientDesignation} 
                                onChange={(e) => setRecipientDesignation(e.target.value)} 
                                placeholder="e.g. Director / Facility Manager"
                                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                            />
                        </div>
                    </div>

                    {/* COMPANY, MOBILE & EMAIL */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem' }}>
                        <div>
                            <label style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                                Company (Optional)
                            </label>
                            <input 
                                type="text" 
                                value={recipientCompany} 
                                onChange={(e) => setRecipientCompany(e.target.value)} 
                                placeholder="Company name"
                                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                                Mobile Number (for WA) *
                            </label>
                            <input 
                                type="text" 
                                value={recipientPhone} 
                                onChange={(e) => setRecipientPhone(e.target.value)} 
                                placeholder="+919876543210"
                                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                                Email (Optional)
                            </label>
                            <input 
                                type="email" 
                                value={recipientEmail} 
                                onChange={(e) => setRecipientEmail(e.target.value)} 
                                placeholder="recipient@example.com"
                                style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                            />
                        </div>
                    </div>

                    {/* FEATURE TOGGLES */}
                    <div style={{ background: 'var(--bg-accent)', padding: '0.8rem 1rem', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: '800' }}>⭐ Feedback Collection</span>
                                    <input 
                                        type="checkbox" 
                                        checked={feedbackEnabled} 
                                        onChange={(e) => setFeedbackEnabled(e.target.checked)}
                                        style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                                    />
                                </div>
                                <p style={{ margin: 0, fontSize: '0.6rem', color: 'var(--text-secondary)' }}>
                                    Collect ratings into separate Feedback Report. (Default: OFF)
                                </p>
                            </div>

                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: '800' }}>🌐 Google Review Request</span>
                                    <input 
                                        type="checkbox" 
                                        checked={googleReviewEnabled} 
                                        onChange={(e) => setGoogleReviewEnabled(e.target.checked)}
                                        style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                                    />
                                </div>
                                <p style={{ margin: 0, fontSize: '0.6rem', color: 'var(--text-secondary)' }}>
                                    Show Google Review link on completion screen. (Default: OFF)
                                </p>
                            </div>
                        </div>

                        {/* FEEDBACK QUESTIONS PREVIEW */}
                        {feedbackEnabled && (
                            <div style={{ background: 'var(--bg-primary)', padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.75rem' }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--accent-color)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                                    📋 Included Feedback Questions:
                                </div>
                                <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                    <li>⭐ Overall Experience (1 to 5 Stars)</li>
                                    <li>⭐ Quality of Work & Finishing (1 to 5 Stars)</li>
                                    <li>⭐ Installation & Execution (1 to 5 Stars)</li>
                                    <li>⭐ Communication & Coordination (1 to 5 Stars)</li>
                                    <li>🤝 Would recommend Meaven? (Yes / Maybe / No)</li>
                                    <li>💬 What did you like most? (Free text box)</li>
                                    <li>💬 What could we have done better? (Free text box)</li>
                                    <li>✓ Testimonial clearance checkbox</li>
                                </ul>
                            </div>
                        )}

                        {/* GOOGLE REVIEW LINK PREVIEW & TEST BUTTON */}
                        {googleReviewEnabled && (
                            <div style={{ background: 'var(--bg-primary)', padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                <label style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--accent-color)', display: 'block', marginBottom: '0.4rem' }}>
                                    🌐 Google Review Target URL *
                                </label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input 
                                        type="text" 
                                        value={googleReviewUrl} 
                                        onChange={(e) => setGoogleReviewUrl(e.target.value)} 
                                        placeholder="https://g.page/r/meaven-review"
                                        style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--accent-color)', fontSize: '0.75rem' }}
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            if (googleReviewUrl.trim()) window.open(googleReviewUrl.trim(), '_blank');
                                            else alert('Please enter a valid Google Review URL first.');
                                        }}
                                        className="btn btn-outline"
                                        style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', flexShrink: 0 }}
                                    >
                                        🔗 Test Link
                                    </button>
                                </div>
                                <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                                    Click "Test Link" to verify your Google Maps review page opens properly before sending to client.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* PENDING ITEMS & SNAG SELECTION */}
                    <div style={{ border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.8rem 1rem', background: 'var(--bg-primary)' }}>
                        <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '0.8rem', fontWeight: '800', color: 'var(--accent-color)' }}>
                            ⚠️ Select Pending Items / Snags to Include on Handover
                        </h4>
                        <p style={{ margin: '0 0 0.6rem 0', fontSize: '0.6rem', color: 'var(--text-secondary)' }}>
                            Unselected internal snags will NEVER be shown to the customer.
                        </p>

                        {/* OPEN PROJECT SNAGS */}
                        {projectSnags.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.8rem', maxHeight: '130px', overflowY: 'auto' }}>
                                {projectSnags.map(snag => {
                                    const isSelected = selectedSnags.some(s => s.id === snag.id);
                                    return (
                                        <div 
                                            key={snag.id} 
                                            onClick={() => toggleSnagSelect(snag)}
                                            style={{
                                                padding: '0.4rem 0.6rem',
                                                borderRadius: '6px',
                                                border: '1px solid ' + (isSelected ? 'var(--accent-color)' : 'var(--border-color)'),
                                                background: isSelected ? 'rgba(102,178,194,0.1)' : 'var(--bg-secondary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                cursor: 'pointer',
                                                fontSize: '0.75rem'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <input type="checkbox" checked={isSelected} readOnly />
                                                <span><strong>[{snag.type || 'Snag'}]</strong> {snag.description}</span>
                                            </div>
                                            <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>{snag.severity || 'Medium'}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '0.6rem' }}>
                                No active internal snags logged in project tracker.
                            </div>
                        )}

                        {/* ADD CUSTOM OBSERVATION */}
                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.6rem', marginTop: '0.4rem' }}>
                            <div style={{ fontSize: '0.65rem', fontWeight: '800', marginBottom: '0.3rem' }}>Add Custom Handover Observation:</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr auto', gap: '0.4rem' }}>
                                <input 
                                    type="text" 
                                    placeholder="Location" 
                                    value={newObsLocation} 
                                    onChange={(e) => setNewObsLocation(e.target.value)}
                                    style={{ padding: '0.4rem', fontSize: '0.75rem', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: '#fff' }}
                                />
                                <input 
                                    type="text" 
                                    placeholder="Observation description..." 
                                    value={newObsDesc} 
                                    onChange={(e) => setNewObsDesc(e.target.value)}
                                    style={{ padding: '0.4rem', fontSize: '0.75rem', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: '#fff' }}
                                />
                                <select 
                                    value={newObsPriority} 
                                    onChange={(e) => setNewObsPriority(e.target.value)}
                                    style={{ padding: '0.4rem', fontSize: '0.75rem', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: '#fff' }}
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                </select>
                                <button type="button" onClick={handleAddCustomObs} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>+ Add</button>
                            </div>

                            {/* CUSTOM OBS LIST */}
                            {customObservations.length > 0 && (
                                <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                    {customObservations.map(o => (
                                        <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-accent)', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem' }}>
                                            <span>📍 <strong>{o.location}:</strong> {o.description} ({o.priority})</span>
                                            <button onClick={() => handleRemoveCustomObs(o.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>✕</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* GENERATE ACTION BUTTON */}
                    {!generatedLink ? (
                        <button 
                            onClick={handleGenerateLink} 
                            className="btn btn-primary" 
                            style={{ padding: '0.8rem', fontSize: '0.85rem', fontWeight: '900', letterSpacing: '0.05em', marginTop: '0.4rem' }}
                        >
                            🚀 GENERATE SECURE HANDOVER LINK
                        </button>
                    ) : (
                        <div style={{ background: 'rgba(50,215,75,0.1)', border: '1px solid var(--success)', padding: '1rem', borderRadius: '10px', marginTop: '0.4rem' }}>
                            <div style={{ color: 'var(--success)', fontWeight: '900', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                                ✓ SECURE LINK GENERATED SUCCESSFULLY!
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.8rem' }}>
                                <input 
                                    type="text" 
                                    readOnly 
                                    value={generatedLink} 
                                    style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', fontSize: '0.75rem' }}
                                />
                                <button onClick={handleCopyLink} className="btn btn-outline" style={{ fontSize: '0.75rem' }}>
                                    {copySuccess ? '✓ Copied!' : '📋 Copy Link'}
                                </button>
                            </div>
                            <div style={{ display: 'flex', gap: '0.8rem' }}>
                                <button onClick={handleSendWhatsApp} className="btn btn-primary" style={{ flex: 1, background: '#25D366', borderColor: '#25D366', color: '#000', fontWeight: '900' }}>
                                    📱 Send via WhatsApp
                                </button>
                                <button onClick={onClose} className="btn btn-outline" style={{ flex: 1 }}>
                                    Done & Close
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ProjectHandoverAdmin;
