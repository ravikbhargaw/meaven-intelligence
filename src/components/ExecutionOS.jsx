import React, { useState } from 'react';

const docsDatabase = [
    {
        id: 'lead-qualification',
        category: 'BUSINESS DEVELOPMENT',
        title: 'Lead Qualification Workflow',
        tags: ['Sales', 'High Priority', 'Client Facing'],
        purpose: 'To systematically filter incoming leads, ensuring operational bandwidth is only spent on projects that align with Meaven’s technical capability, margin requirements, and risk appetite.',
        summary: 'A 4-step filtration process to categorize leads into Go/No-Go before any site visits or deep design consultations are committed.',
        process: [
            { stage: '1. Initial Capture', desc: 'Log client details, project scale (sqft), and timeline expectation into Intelligence Hub.' },
            { stage: '2. Alignment Check', desc: 'Verify if the project fits within our minimum order value (MOV) and technical scope.' },
            { stage: '3. Risk Assessment', desc: 'Run preliminary check on client reputation, timeline feasibility, and location logistics.' },
            { stage: '4. Decision Output', desc: 'Categorize as Approved for Pitch, Hold for Review, or Politely Reject.' }
        ],
        decisionPoints: [
            { decision: 'Proceed', criteria: 'Meets MOV, realistic timeline, clear requirements.' },
            { decision: 'Hold', criteria: 'Missing crucial data, timeline too aggressive.' },
            { decision: 'Reject', criteria: 'Low margin, high risk client, out of operational scope.' }
        ],
        redFlags: [
            'Client refuses to share budget expectations.',
            'Unrealistic timeline (e.g., 20,000 sqft in 30 days).',
            'History of multi-vendor payment disputes.'
        ],
        inputs: ['Initial Inquiry Form', 'Floor Plan (if available)', 'Target Budget'],
        escalation: 'If a high-value lead falls into a grey area, escalate to Founder for "Exception Review".',
        fieldNotes: 'Always confirm who the primary decision maker is during the first call. Avoid pitching to intermediaries without direct line of sight to the founder/owner.',
        relatedDocs: ['Project Acceptance Criteria', 'Architect Outreach Process']
    },
    {
        id: 'site-audit',
        category: 'PRE-EXECUTION',
        title: 'Site Audit Workflow',
        tags: ['Technical', 'Field Operations', 'Critical'],
        purpose: 'To technically validate site conditions against drawings before production freeze, minimizing execution variations and margin bleed.',
        summary: 'A comprehensive on-site technical inspection verifying measurements, access, structural readiness, and dependencies.',
        process: [
            { stage: '1. Pre-Audit Prep', desc: 'Download latest approved GFCs. Sync digital audit form.' },
            { stage: '2. Physical Verification', desc: 'Cross-check physical dimensions against GFCs. Note mm-level variations.' },
            { stage: '3. Dependency Mapping', desc: 'Check ceiling grid readiness, flooring levels, and MEP clearance.' },
            { stage: '4. Upload & Sync', desc: 'Push audit data and site media to Intelligence Hub for PM review.' }
        ],
        decisionPoints: [
            { decision: 'Freeze Production', criteria: 'Site matches GFCs within 5mm tolerance. Dependencies clear.' },
            { decision: 'Re-Verify', criteria: 'Dependencies incomplete (e.g., flooring not laid).' },
            { decision: 'Hold Production', criteria: 'Major structural mismatch found. Requires drawing revision.' }
        ],
        redFlags: [
            'Uneven floor leveling (>10mm variance).',
            'Material lift unavailable for high-rise sites.',
            'Other vendors (MEP/HVAC) actively blocking execution zones.'
        ],
        inputs: ['GFC Drawings', 'Site Access Pass', 'Laser Measurement Tools'],
        escalation: 'If site is severely delayed, trigger "Site Escalation Process" and notify client officially to protect project timeline.',
        fieldNotes: 'Never assume a wall is a perfect 90-degree angle. Always measure diagonals.',
        relatedDocs: ['Drawing vs Site Validation', 'Site Readiness Protocol']
    },
    {
        id: 'vendor-payment',
        category: 'FINANCE & CLOSURE',
        title: 'Vendor Payment Approval Logic',
        tags: ['Finance', 'Governance', 'Vendor Bench'],
        purpose: 'To ensure partner payments are released strictly against verified execution milestones, protecting cash flow and enforcing accountability.',
        summary: 'A locked gate process where finance only releases funds after technical PM validates site progress via Intelligence Hub.',
        process: [
            { stage: '1. Payment Request', desc: 'Vendor submits invoice against predefined milestone.' },
            { stage: '2. PM Validation', desc: 'Technical PM conducts site check or reviews field media to confirm milestone completion.' },
            { stage: '3. System Approval', desc: 'PM marks milestone as "Achieved" in the Hub.' },
            { stage: '4. Finance Release', desc: 'Finance verifies ledger and processes NEFT/RTGS within 48 hours.' }
        ],
        decisionPoints: [
            { decision: 'Approve', criteria: 'Milestone 100% complete, PM signed off.' },
            { decision: 'Hold (Partial)', criteria: 'Minor snags pending. Hold 10% retention until snag closure.' },
            { decision: 'Reject', criteria: 'Milestone incomplete or quality failure reported by PM.' }
        ],
        redFlags: [
            'Vendor demanding advance outside of MSA terms.',
            'PM approving without accompanying site photos.',
            'Quality issues reported by client before payment processing.'
        ],
        inputs: ['Vendor Invoice', 'Site Photos', 'PM Approval Signature'],
        escalation: 'If vendor threatens work stoppage due to payment delay, escalate immediately to Founder for override or mitigation.',
        fieldNotes: 'Always ensure GST compliance on invoices before processing. No kacha bills accepted under any circumstance.',
        relatedDocs: ['Vendor Performance Tracking', 'Snag Closure Workflow']
    },
    {
        id: 'installation-coordination',
        category: 'EXECUTION',
        title: 'Installation Coordination Workflow',
        tags: ['Execution', 'Site Ops', 'Vendor Comm'],
        purpose: 'To ensure seamless synchronization between logistics, site readiness, and vendor deployment, minimizing idle time and material damage.',
        summary: 'A tactical deployment sequence mapping material arrival with installation crew readiness and site access.',
        process: [
            { stage: '1. Material Dispatch', desc: 'Confirm material loading at factory. Sync transit ETAs with Site Supervisor.' },
            { stage: '2. Site Prep', desc: 'Ensure unloading zones are clear. Confirm material lift availability for high-rises.' },
            { stage: '3. Vendor Deployment', desc: 'Deploy installation crew to site exactly 2 hours before material arrival.' },
            { stage: '4. Daily Tracking', desc: 'Supervisor pushes end-of-day execution photos and logs daily progress.' }
        ],
        decisionPoints: [
            { decision: 'Proceed', criteria: 'Site clear, lift available, vendor mobilized.' },
            { decision: 'Hold (Partial)', criteria: 'Material arrived but site blocked. Store securely onsite.' },
            { decision: 'Hold Production', criteria: 'Site completely unready upon vendor arrival. Pull back team.' }
        ],
        redFlags: [
            'Vendor crew arrives without adequate safety gear.',
            'Material transport delayed by >6 hours without notification.',
            'Client changes sequence of installation on the fly.'
        ],
        inputs: ['Dispatch Challan', 'Site Supervisor ETA', 'Vendor Crew List'],
        escalation: 'If material is damaged during unloading, halt installation immediately and escalate to Production Head for replacement protocol.',
        fieldNotes: 'Never allow vendors to leave raw materials unprotected overnight if other contractors (painters/MEP) are active.',
        relatedDocs: ['Execution Tracking Workflow', 'Daily Update Protocol']
    },
    {
        id: 'post-install-qc',
        category: 'QC & HANDOVER',
        title: 'Post-Installation QC Framework',
        tags: ['Quality', 'Handover', 'Technical'],
        purpose: 'To strictly enforce Meaven’s zero-tolerance quality standard before client presentation, ensuring snags are identified internally rather than by the client.',
        summary: 'A rigorous 60-point technical inspection covering structural integrity, aesthetic finish, and functional compliance.',
        process: [
            { stage: '1. Internal Handover', desc: 'Vendor declares completion. PM takes operational control of the site.' },
            { stage: '2. Technical Sweep', desc: 'Execute the 60-point QC Audit via Intelligence Hub. Log every snag.' },
            { stage: '3. Snag Rectification', desc: 'Deploy vendor snag-team for 48-hour rapid closure sprint.' },
            { stage: '4. Final Validation', desc: 'Generate Clean QC Report and prepare for Client Walkthrough.' }
        ],
        decisionPoints: [
            { decision: 'Approve', criteria: 'Zero critical snags. Minor snags < 3 items. Clean aesthetic.' },
            { decision: 'Hold', criteria: 'Functional failure (e.g., door alignment off, acoustic seal broken).' },
            { decision: 'Reject', criteria: 'Major damage to glass/hardware requiring complete replacement.' }
        ],
        redFlags: [
            'Vendor attempts to hide scratches with temporary polish.',
            'Hardware feels loose or makes noise during operation.',
            'Silicone sealing is uneven or messy.'
        ],
        inputs: ['Completed Installation', 'QC Checklist Tool', 'Laser Level/Measurement Kit'],
        escalation: 'If a major structural defect is found during QC, immediately halt final handover scheduling and notify Founder.',
        fieldNotes: 'Inspect glass surfaces under harsh lighting or flashlights. Natural light often hides micro-scratches.',
        relatedDocs: ['Snag Closure Workflow', 'Client Signoff Process']
    },
    {
        id: 'high-risk-indicators',
        category: 'FOUNDER DECISION SYSTEMS',
        title: 'High-Risk Project Indicators',
        tags: ['Executive', 'Risk Matrix', 'Strategic'],
        purpose: 'To provide a quantitative and qualitative framework for identifying projects that threaten margin, reputation, or operational bandwidth.',
        summary: 'An executive warning system triggering mandatory Founder review when specific project parameters cross threshold limits.',
        process: [
            { stage: '1. Data Aggregation', desc: 'System compiles data from lead stage, PM reports, and vendor feedback.' },
            { stage: '2. Risk Scoring', desc: 'Evaluate project against the 5-point Risk Matrix (Financial, Timeline, Client, Site, Vendor).' },
            { stage: '3. Threshold Alert', desc: 'If score > 70/100, project automatically flags as High-Risk.' },
            { stage: '4. Executive Review', desc: 'Founder intervenes to restructure deal, enforce strict terms, or terminate.' }
        ],
        decisionPoints: [
            { decision: 'Proceed', criteria: 'Low risk. Standard operational flow.' },
            { decision: 'Re-Verify', criteria: 'Medium risk. Requires tighter payment terms or margin buffer.' },
            { decision: 'Hold', criteria: 'High risk. Do not proceed without Founder sign-off.' }
        ],
        redFlags: [
            'Client demands extended credit periods post-installation.',
            'Site is controlled by an aggressively uncooperative PMC.',
            'Project relies on a single unverified vendor for a critical component.'
        ],
        inputs: ['PM Field Reports', 'Financial Ledger', 'Vendor Escalation Logs'],
        escalation: 'High-Risk flags bypass all PMs and route directly to the Founder Console for immediate strategic action.',
        fieldNotes: 'Listen to the "gut feeling" of PMs regarding client behavior during the first site visit. Toxicity early on rarely improves.',
        relatedDocs: ['Project Rejection Logic', 'Margin Protection Logic']
    }
];

const categories = [
    'BUSINESS DEVELOPMENT',
    'PRE-EXECUTION',
    'EXECUTION',
    'QC & HANDOVER',
    'FINANCE & CLOSURE',
    'FOUNDER DECISION SYSTEMS'
];

export default function ExecutionOS() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDocId, setSelectedDocId] = useState('lead-qualification');
    const [activeCategory, setActiveCategory] = useState('ALL');

    const filteredDocs = docsDatabase.filter(doc => {
        const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCategory = activeCategory === 'ALL' || doc.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    const activeDoc = docsDatabase.find(d => d.id === selectedDocId) || docsDatabase[0];

    return (
        <div className="card animate-fade-in" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', minHeight: '85vh', display: 'flex', padding: 0, overflow: 'hidden' }}>
            
            {/* LEFT SIDEBAR NAVIGATION */}
            <div style={{ width: '320px', borderRight: '1px solid var(--border-color)', background: 'var(--bg-glass)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>🎛️</span>
                        <div>
                            <h2 style={{ fontSize: '1rem', margin: 0, color: 'var(--text-primary)', letterSpacing: '0.05em' }}>EXECUTION OS</h2>
                            <p style={{ fontSize: '0.65rem', color: 'var(--accent-color)', letterSpacing: '0.1em', margin: 0, fontWeight: '700' }}>OPERATING INFRASTRUCTURE</p>
                        </div>
                    </div>
                    <input 
                        type="text" 
                        placeholder="Search workflows, tags..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ width: '100%', padding: '0.8rem 1rem', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.8rem', outline: 'none' }}
                    />
                </div>
                
                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                    {categories.map(category => {
                        const docsInCategory = filteredDocs.filter(d => d.category === category);
                        if (docsInCategory.length === 0 && searchQuery) return null;
                        
                        return (
                            <div key={category} style={{ marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', letterSpacing: '0.1em', marginBottom: '0.8rem', paddingLeft: '0.5rem', fontWeight: '800' }}>{category}</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                    {docsInCategory.map(doc => (
                                        <button 
                                            key={doc.id}
                                            onClick={() => setSelectedDocId(doc.id)}
                                            style={{ 
                                                textAlign: 'left', 
                                                padding: '0.8rem 1rem', 
                                                background: selectedDocId === doc.id ? 'rgba(102, 178, 194, 0.1)' : 'transparent',
                                                border: `1px solid ${selectedDocId === doc.id ? 'var(--border-accent)' : 'transparent'}`,
                                                borderRadius: '8px',
                                                color: selectedDocId === doc.id ? 'var(--accent-color)' : 'var(--text-primary)',
                                                fontSize: '0.8rem',
                                                fontWeight: selectedDocId === doc.id ? '600' : '400',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '0.3rem'
                                            }}
                                        >
                                            <span>{doc.title}</span>
                                            {selectedDocId === doc.id && (
                                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                    {doc.tags.map(tag => (
                                                        <span key={tag} style={{ fontSize: '0.55rem', background: 'var(--bg-primary)', padding: '0.2rem 0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>{tag}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                    {docsInCategory.length === 0 && !searchQuery && (
                                        <div style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                            Protocols in development...
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* RIGHT MAIN CONTENT */}
            <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-primary)', position: 'relative' }}>
                <div style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 2rem' }}>
                    
                    {/* Header */}
                    <div style={{ marginBottom: '3rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                            <span style={{ fontSize: '0.65rem', background: 'var(--bg-accent)', color: 'var(--text-secondary)', padding: '0.3rem 0.8rem', borderRadius: '12px', border: '1px solid var(--border-color)', letterSpacing: '0.05em' }}>{activeDoc.category}</span>
                            {activeDoc.tags.map(tag => (
                                <span key={tag} style={{ fontSize: '0.65rem', background: 'rgba(102, 178, 194, 0.1)', color: 'var(--accent-color)', padding: '0.3rem 0.8rem', borderRadius: '12px', border: '1px solid var(--border-accent)', letterSpacing: '0.05em' }}>{tag}</span>
                            ))}
                        </div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', margin: '0 0 1rem 0', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{activeDoc.title}</h1>
                    </div>

                    {/* 1. Purpose & 2. Summary */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
                        <div style={{ background: 'var(--bg-glass)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                            <h4 style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', letterSpacing: '0.1em', margin: '0 0 0.8rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span>🎯</span> WORKFLOW PURPOSE</h4>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}>{activeDoc.purpose}</p>
                        </div>
                        <div style={{ background: 'var(--bg-glass)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                            <h4 style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', letterSpacing: '0.1em', margin: '0 0 0.8rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span>⚡</span> QUICK SUMMARY</h4>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}>{activeDoc.summary}</p>
                        </div>
                    </div>

                    {/* 3. Workflow Diagram (Visual) */}
                    <div style={{ marginBottom: '4rem' }}>
                        <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', letterSpacing: '0.1em', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span>🗺️</span> VISUAL WORKFLOW MAP</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-glass-heavy)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
                            {activeDoc.process.map((step, idx) => (
                                <React.Fragment key={idx}>
                                    <div style={{ minWidth: '180px', background: 'var(--bg-accent)', padding: '1.2rem', borderRadius: '12px', border: '1px solid var(--glass-border)', position: 'relative' }}>
                                        <div style={{ position: 'absolute', top: '-10px', left: '-10px', width: '24px', height: '24px', background: 'var(--accent-color)', borderRadius: '50%', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: '800' }}>{idx + 1}</div>
                                        <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--text-primary)' }}>{step.stage.replace(/^\d+\.\s*/, '')}</h5>
                                    </div>
                                    {idx < activeDoc.process.length - 1 && (
                                        <div style={{ color: 'var(--accent-color)', fontSize: '1.5rem', opacity: 0.5 }}>→</div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    {/* 4. Step-by-Step */}
                    <div style={{ marginBottom: '4rem' }}>
                        <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', letterSpacing: '0.1em', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span>⚙️</span> STRUCTURED PROCESS STAGES</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {activeDoc.process.map((step, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: '1.5rem', background: 'var(--bg-glass)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--accent-color)', opacity: 0.5, width: '30px' }}>0{idx + 1}</div>
                                    <div>
                                        <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: 'var(--text-primary)' }}>{step.stage.replace(/^\d+\.\s*/, '')}</h5>
                                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 5. Decision Points & 6. Red Flags */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '4rem' }}>
                        <div>
                            <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', letterSpacing: '0.1em', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span>🚦</span> DECISION LOGIC</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {activeDoc.decisionPoints.map((dp, idx) => (
                                    <div key={idx} style={{ padding: '1rem', borderLeft: `3px solid ${dp.decision === 'Proceed' || dp.decision === 'Approve' || dp.decision === 'Freeze Production' ? 'var(--success)' : dp.decision === 'Reject' || dp.decision === 'Hold Production' ? 'var(--danger)' : '#f5a623'}`, background: 'var(--bg-accent)', borderRadius: '0 8px 8px 0' }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.3rem', color: dp.decision === 'Proceed' || dp.decision === 'Approve' || dp.decision === 'Freeze Production' ? 'var(--success)' : dp.decision === 'Reject' || dp.decision === 'Hold Production' ? 'var(--danger)' : '#f5a623' }}>{dp.decision}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{dp.criteria}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', letterSpacing: '0.1em', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span>🚩</span> RED FLAGS (WARNING INDICATORS)</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {activeDoc.redFlags.map((flag, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: '1rem', padding: '1rem', background: 'rgba(255, 69, 58, 0.05)', border: '1px solid rgba(255, 69, 58, 0.2)', borderRadius: '8px' }}>
                                        <span style={{ color: 'var(--danger)' }}>⚠️</span>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{flag}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 7. Required Inputs & 8. Escalation & 9. Field Notes */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
                        <div>
                            <div style={{ background: 'var(--bg-glass)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                                <h4 style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', letterSpacing: '0.1em', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span>📥</span> REQUIRED INPUTS</h4>
                                <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-primary)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {activeDoc.inputs.map((input, idx) => <li key={idx}>{input}</li>)}
                                </ul>
                            </div>
                            <div style={{ background: 'var(--bg-glass)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                <h4 style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', letterSpacing: '0.1em', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span>🔗</span> RELATED SOP LINKS</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {activeDoc.relatedDocs.map((doc, idx) => (
                                        <div key={idx} style={{ fontSize: '0.8rem', color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                            <span>📄</span> <u>{doc}</u>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ background: 'var(--bg-glass)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', borderLeft: '3px solid var(--danger)' }}>
                                <h4 style={{ fontSize: '0.7rem', color: 'var(--danger)', letterSpacing: '0.1em', margin: '0 0 0.8rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span>🚨</span> ESCALATION LOGIC</h4>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}>{activeDoc.escalation}</p>
                            </div>
                            <div style={{ background: 'rgba(102, 178, 194, 0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-accent)' }}>
                                <h4 style={{ fontSize: '0.7rem', color: 'var(--accent-color)', letterSpacing: '0.1em', margin: '0 0 0.8rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span>💡</span> FIELD INTELLIGENCE NOTES</h4>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>"{activeDoc.fieldNotes}"</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
