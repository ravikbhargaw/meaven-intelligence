import React, { useState, useEffect } from 'react';

// Simulated database for demonstration
const MOCK_PROJECT = {
    id: 'PRJ-2410-A',
    name: 'Luminary Workspace HQ',
    location: 'Sector 44, Gurgaon',
    assignedVendor: 'Apex Glass Solutions',
    status: 'Installation In Progress',
    stageIndex: 5,
    stages: [
        'Project Assigned',
        'Site Verification Pending',
        'Site Audit Submitted',
        'Readiness Approved',
        'Production Freeze',
        'Installation In Progress',
        'QC Pending',
        'Snag Closure Pending',
        'Handover Completed',
        'Closure Approved'
    ],
    updates: [
        { id: 1, type: 'photo', date: '2026-05-18T10:00:00Z', note: 'Material unloaded safely. Lift was available.', severity: 'Low' }
    ],
    snags: []
};

const ONBOARDING_STEPS = [
    { title: '1. Meaven Execution Philosophy', content: 'Predictable execution over heroic saves. Proactive issue reporting. Structured handovers. Zero-snag culture.' },
    { title: '2. Vendor Expectations', content: 'Mandatory daily update sharing with photo documentation. Immediate escalation reporting. Total QC compliance.' },
    { title: '3. Project Workflow Overview', content: 'Assignment → Verification → Freeze → Installation → QC → Snag Closure → Handover → Payment.' },
    { title: '4. Site Audit & QC Standards', content: 'Upload clear photos of all critical joints. Door movement videos are mandatory before QC signoff.' },
    { title: '5. Escalation & Payment Logic', content: 'Stop installation immediately if site varies >5mm from GFCs. Payments strictly tied to QC approval.' }
];

export default function ExecutionPartnerSystem({ projects = [], onSubmitUpdate }) {
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get('projectId');
    
    const actualProject = projects.find(p => String(p.id) === String(projectId));
    
    const [view, setView] = useState(() => {
        const onboarded = localStorage.getItem(`mvn_onboarded_${projectId}`);
        return onboarded === 'true' ? 'active_project' : 'onboarding';
    }); // onboarding, active_project, success
    const [uploadNote, setUploadNote] = useState('');
    const [riskSeverity, setRiskSeverity] = useState('Low'); // Low, Medium, High, Critical
    const [isUploadMode, setIsUploadMode] = useState(false);
    
    // Onboarding State
    const [currentOnboardingStep, setCurrentOnboardingStep] = useState(0);

    // Media Upload State
    const [uploadedMedia, setUploadedMedia] = useState([]);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadedMedia(prev => [...prev, reader.result]);
            };
            reader.readAsDataURL(file);
        });
    };

    // If invalid link
    if (!actualProject) {
        return (
            <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--danger)' }}>INVALID EXECUTION LINK</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '1rem' }}>This project link is either invalid or expired. Please contact your Meaven PM for a fresh execution link.</p>
                
                {/* Debug Info */}
                <div style={{ marginTop: '3rem', padding: '1rem', background: 'var(--bg-accent)', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.7rem', color: 'var(--text-secondary)', textAlign: 'left', width: '100%', maxWidth: '400px' }}>
                    <strong>DIAGNOSTIC DATA:</strong><br/>
                    Requested ID: {projectId || 'None'}<br/>
                    Database Sync: {projects.length} active projects loaded.<br/><br/>
                    <em>If database sync is 0, ensure you are testing in the SAME browser window (not incognito) so local storage can be shared, unless Supabase cloud sync is fully active.</em>
                </div>
            </div>
        );
    }

    const STAGES = [
        'Project Assigned',
        'Site Verification Pending',
        'Site Audit Submitted',
        'Readiness Approved',
        'Production Freeze',
        'Installation In Progress',
        'QC Pending',
        'Snag Closure Pending',
        'Handover Completed',
        'Closure Approved'
    ];

    // Determine current stage based on project data (fallback to 0)
    // We mock a stage index for visual purposes if none exists
    const currentStageIndex = actualProject.stageIndex || 1; 

    const handleUploadUpdate = () => {
        if (!uploadNote) return;
        const newUpdate = {
            id: Date.now(),
            type: riskSeverity === 'Low' ? 'update' : 'risk',
            date: new Date().toISOString(),
            note: uploadNote,
            severity: riskSeverity,
            status: 'pending_approval',
            media: uploadedMedia
        };
        
        if (onSubmitUpdate) {
            onSubmitUpdate(actualProject.id, newUpdate);
        }
        
        setUploadNote('');
        setUploadedMedia([]);
        setIsUploadMode(false);
        setView('success');
    };

    if (view === 'success') {
        return (
            <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem', color: 'var(--success)' }}>✓</div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#fff', marginBottom: '0.5rem' }}>TRANSMITTED</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>Your update has been logged to the Project Hub and is pending PM approval.</p>
                <button onClick={() => { setView('active_project'); setUploadNote(''); setRiskSeverity('Low'); setIsUploadMode(false); }} style={{ background: 'var(--accent-color)', color: '#000', padding: '1rem', borderRadius: '12px', fontWeight: '800', width: '100%', maxWidth: '300px', border: 'none' }}>
                    RETURN TO WORKSPACE
                </button>
            </div>
        );
    }

    if (view === 'onboarding') {
        const step = ONBOARDING_STEPS[currentOnboardingStep];
        return (
            <div style={{ background: 'var(--bg-secondary)', minHeight: '100vh', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--accent-color)', fontWeight: '800', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>ONBOARDING GATES</div>
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                        {ONBOARDING_STEPS.map((_, i) => (
                            <div key={i} style={{ height: '4px', flex: 1, background: i <= currentOnboardingStep ? 'var(--accent-color)' : 'var(--border-color)', borderRadius: '2px' }} />
                        ))}
                    </div>
                </div>
                
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1rem', color: '#fff' }}>{step.title}</h2>
                    <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{step.content}</p>
                </div>

                <button 
                    onClick={() => {
                        if (currentOnboardingStep < ONBOARDING_STEPS.length - 1) {
                            setCurrentOnboardingStep(prev => prev + 1);
                        } else {
                            localStorage.setItem(`mvn_onboarded_${projectId}`, 'true');
                            setView('active_project');
                        }
                    }} 
                    style={{ background: 'var(--accent-color)', color: '#000', padding: '1rem', borderRadius: '12px', fontWeight: '800', fontSize: '1rem', border: 'none', cursor: 'pointer', width: '100%', marginTop: '2rem' }}
                >
                    {currentOnboardingStep < ONBOARDING_STEPS.length - 1 ? 'ACKNOWLEDGE & CONTINUE' : 'ENTER PROJECT WORKSPACE'}
                </button>
            </div>
        );
    }

    if (view === 'active_project') {
        const approvedUpdates = (actualProject.vendorUpdates || []).filter(u => u.status === 'approved');
        
        return (
            <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', paddingBottom: '80px' }}>
                {/* Header */}
                <div style={{ background: 'var(--bg-glass-heavy)', padding: '1.5rem', position: 'sticky', top: 0, zIndex: 10, borderBottom: '1px solid var(--border-color)', backdropFilter: 'blur(20px)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--accent-color)', fontWeight: '800', letterSpacing: '0.1em', textTransform: 'uppercase' }}>ID: {actualProject.id}</div>
                            <h2 style={{ margin: '0.2rem 0 0 0', fontSize: '1.2rem', fontWeight: '800' }}>{actualProject.name}</h2>
                            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Client: {actualProject.client}</p>
                        </div>
                    </div>
                </div>

                {/* Workflow Status */}
                <div style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', letterSpacing: '0.1em', marginBottom: '1rem', fontWeight: '700' }}>EXECUTION STAGE</h3>
                    <div style={{ background: 'var(--bg-secondary)', borderRadius: '16px', padding: '1rem', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        {STAGES.map((stage, idx) => {
                            const isPast = idx < currentStageIndex;
                            const isActive = idx === currentStageIndex;
                            return (
                                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', opacity: isPast || isActive ? 1 : 0.4 }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: isPast ? 'var(--success)' : isActive ? 'var(--accent-color)' : 'transparent', border: `2px solid ${isPast ? 'var(--success)' : isActive ? 'var(--accent-color)' : 'var(--text-secondary)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {isPast && <span style={{ color: '#000', fontSize: '0.6rem', fontWeight: 'bold' }}>✓</span>}
                                        </div>
                                        {idx < STAGES.length - 1 && <div style={{ width: '2px', height: '20px', background: isPast ? 'var(--success)' : 'var(--border-color)', marginTop: '4px' }} />}
                                    </div>
                                    <div style={{ paddingTop: '2px', fontWeight: isActive ? '800' : '500', color: isActive ? '#fff' : 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                        {stage}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Updates Feed */}
                <div style={{ padding: '0 1.5rem 1.5rem 1.5rem' }}>
                    <h3 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', letterSpacing: '0.1em', marginBottom: '1rem', fontWeight: '700' }}>APPROVED SITE LOG</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {approvedUpdates.length === 0 ? (
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontStyle: 'italic', textAlign: 'center', padding: '2rem 0' }}>No updates approved yet.</div>
                        ) : (
                            approvedUpdates.map(upd => (
                                <div key={upd.id} style={{ background: upd.type === 'risk' ? 'rgba(255, 69, 58, 0.05)' : 'var(--bg-secondary)', border: `1px solid ${upd.type === 'risk' ? 'rgba(255,69,58,0.3)' : 'var(--border-color)'}`, padding: '1rem', borderRadius: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ fontSize: '0.7rem', color: upd.type === 'risk' ? 'var(--danger)' : 'var(--accent-color)', fontWeight: '800', textTransform: 'uppercase' }}>
                                            {upd.type === 'risk' ? `⚠️ RISK: ${upd.severity}` : '📸 FIELD UPDATE'}
                                        </span>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{new Date(upd.date).toLocaleDateString()}</span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>{upd.note}</p>
                                    {upd.media && upd.media.length > 0 && (
                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.8rem', overflowX: 'auto' }}>
                                            {upd.media.map((img, idx) => (
                                                <img key={idx} src={img} style={{ width: '80px', height: '80px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--border-color)' }} alt="vendor-site-photo" />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Fixed Bottom Action Bar */}
                <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '1rem', background: 'var(--bg-glass-heavy)', backdropFilter: 'blur(30px)', borderTop: '1px solid var(--border-color)', zIndex: 100 }}>
                    {!isUploadMode ? (
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={() => { setIsUploadMode(true); setRiskSeverity('Low'); }} style={{ flex: 1, background: 'var(--accent-color)', color: '#000', padding: '1rem', borderRadius: '12px', fontWeight: '800', border: 'none', display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center' }}>
                                <span>📸</span> UPLOAD STATUS
                            </button>
                            <button onClick={() => { setIsUploadMode(true); setRiskSeverity('High'); }} style={{ flex: 1, background: 'rgba(255,69,58,0.1)', color: 'var(--danger)', border: '1px solid var(--danger)', padding: '1rem', borderRadius: '12px', fontWeight: '800', display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center' }}>
                                <span>⚠️</span> FLAG ISSUE
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: '800', color: riskSeverity !== 'Low' ? 'var(--danger)' : 'var(--accent-color)' }}>
                                    {riskSeverity !== 'Low' ? 'REPORT SITE RISK' : 'FIELD STATUS UPDATE'}
                                </span>
                                <button onClick={() => setIsUploadMode(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1rem' }}>✕</button>
                            </div>
                            
                            {riskSeverity !== 'Low' && (
                                <select value={riskSeverity} onChange={(e) => setRiskSeverity(e.target.value)} style={{ background: 'var(--bg-secondary)', color: '#fff', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--danger)', outline: 'none' }}>
                                    <option value="Medium">Medium Severity (Timeline Delay)</option>
                                    <option value="High">High Severity (Quality/Cost Risk)</option>
                                    <option value="Critical">Critical (Stop Work Immediately)</option>
                                </select>
                            )}

                            <textarea 
                                value={uploadNote} 
                                onChange={(e) => setUploadNote(e.target.value)} 
                                placeholder="Describe site condition, snags, or readiness..." 
                                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: '#fff', padding: '1rem', borderRadius: '8px', minHeight: '80px', outline: 'none', fontFamily: 'inherit' }} 
                            />

                            {uploadedMedia.length > 0 && (
                                <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', padding: '0.5rem 0' }}>
                                    {uploadedMedia.map((img, i) => (
                                        <div key={i} style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-color)', flexShrink: 0 }}>
                                            <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Preview" />
                                            <button 
                                                type="button"
                                                onClick={() => setUploadedMedia(prev => prev.filter((_, idx) => idx !== i))}
                                                style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', fontSize: '0.6rem', padding: '2px 4px', cursor: 'pointer' }}
                                            >✕</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            <input 
                                type="file" 
                                id="vendor-media-upload" 
                                multiple 
                                accept="image/*" 
                                style={{ display: 'none' }} 
                                onChange={handleFileChange} 
                            />
                            
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button 
                                    type="button"
                                    onClick={() => document.getElementById('vendor-media-upload').click()}
                                    style={{ flex: 1, background: 'var(--bg-secondary)', border: '1px dashed var(--text-secondary)', padding: '1rem', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}
                                >
                                    + ADD MEDIA ({uploadedMedia.length})
                                </button>
                                <button onClick={handleUploadUpdate} style={{ flex: 1, background: riskSeverity !== 'Low' ? 'var(--danger)' : 'var(--success)', color: '#000', border: 'none', padding: '1rem', borderRadius: '8px', fontWeight: '800' }}>
                                    TRANSMIT
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return null;
}
